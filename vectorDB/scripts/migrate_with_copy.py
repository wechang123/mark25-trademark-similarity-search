#!/usr/bin/env python3
"""
Trademark Embeddings Migration to Supabase using PostgreSQL COPY
Uses COPY command for 50-100x faster bulk insert compared to batch INSERT.
"""

import os
import sys
import json
import time
import argparse
import io
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from tqdm import tqdm

# Environment variable loader
def load_env_file(env_path: Path) -> None:
    """Load environment variables from .env.local file"""
    if not env_path.exists():
        print(f"❌ Environment file not found: {env_path}")
        return

    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

# Load environment variables from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env.local'
load_env_file(env_path)

# Also try vectorDB/.env.local
vectordb_env = project_root / 'vectorDB' / '.env.local'
load_env_file(vectordb_env)

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("Run: pip install psycopg2-binary")
    sys.exit(1)


class COPYMigration:
    def __init__(self, batch_size: int = 10000, test_mode: bool = False, limit: Optional[int] = None):
        self.batch_size = batch_size
        self.test_mode = test_mode
        self.limit = limit
        self.checkpoint_file = Path(__file__).parent / 'migration_checkpoint.json'

        # Validate environment variables
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.db_password = os.getenv('POSTGRES_PASSWORD')  # Database password

        if not self.supabase_url or not self.service_key:
            raise ValueError(
                "Missing required environment variables:\n"
                "  - NEXT_PUBLIC_SUPABASE_URL\n"
                "  - SUPABASE_SERVICE_ROLE_KEY\n"
                "  - POSTGRES_PASSWORD (optional, will use service key if not found)\n"
                "Please check your .env.local file"
            )

        # Use database password if available, otherwise fall back to service key
        password = self.db_password if self.db_password else self.service_key

        # Construct PostgreSQL connection string for session pooler (port 5432)
        # Format: postgres://postgres.PROJECT:PASSWORD@HOST:5432/postgres
        # Extract project ID and host from Supabase URL
        # Example URL: https://fwsdfirkkjjstajxnsrq.supabase.co
        project_id = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

        # Construct direct connection string (session mode, not transaction mode)
        self.conn_string = (
            f"postgres://postgres.{project_id}:{password}"
            f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
            f"?sslmode=require"
        )

        # Load data files
        self.vectordb_path = Path(__file__).parent.parent

        print("Loading data files...")
        self.embeddings = np.load(self.vectordb_path / 'embeddings.npy')

        with open(self.vectordb_path / 'filenames.json', 'r') as f:
            self.filenames = json.load(f)

        # Load metadata if available
        metadata_path = self.vectordb_path / 'metadata_map.json'
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}

        # Apply limit for testing
        if self.limit:
            self.embeddings = self.embeddings[:self.limit]
            self.filenames = self.filenames[:self.limit]
            print(f"🧪 Test mode: Limited to {self.limit:,} records")

        print(f"✅ Loaded {len(self.embeddings):,} embeddings")
        print(f"✅ Loaded {len(self.filenames):,} filenames")
        print(f"✅ Loaded {len(self.metadata):,} metadata entries")

    def format_vector_for_csv(self, vector_array: np.ndarray) -> str:
        """Format numpy array as PostgreSQL vector literal [1,2,3,...]"""
        return '[' + ','.join(str(float(x)) for x in vector_array) + ']'

    def format_array_for_csv(self, arr: Optional[List]) -> Optional[str]:
        """Format Python list as PostgreSQL array {a,b,c}"""
        if not arr or len(arr) == 0:
            return None
        # Escape special characters in array elements
        escaped = [str(x).replace('"', '\\"') for x in arr]
        return '{' + ','.join(escaped) + '}'

    def create_csv_buffer(self, start_idx: int, end_idx: int) -> io.StringIO:
        """Create in-memory CSV buffer for COPY command"""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        for i in range(start_idx, end_idx):
            if i >= len(self.embeddings):
                break

            filename = self.filenames[i]
            embedding = self.embeddings[i]

            # Extract PURE trademark number from Windows path
            # Input examples:
            #   "C:\KIPRIS_FULL\ALL_IMAGES\4020200123456.jpg" -> "4020200123456"
            #   "C:\KIPRIS_FULL\ALL_IMAGES\4020240049857_tm000001.jpg" -> "4020240049857"
            # Use ntpath to handle Windows paths on any OS
            import ntpath
            base_filename = ntpath.basename(filename)  # Works with Windows paths on macOS/Linux

            # Remove file extension
            name_without_ext = base_filename.split('.')[0] if base_filename else f"unknown_{i}"

            # Remove _tm suffix if present (some files have _tm000001 suffix)
            if '_tm' in name_without_ext:
                trademark_number = name_without_ext.split('_tm')[0]
            else:
                trademark_number = name_without_ext

            # Ensure it's a valid trademark number (not too long)
            if len(trademark_number) > 50:
                trademark_number = trademark_number[:50]

            # CSV row: ONLY trademark_number and embedding (no metadata!)
            row = [
                trademark_number,
                self.format_vector_for_csv(embedding)
            ]

            writer.writerow(row)

        output.seek(0)
        return output

    def get_index_definition(self, conn) -> Optional[str]:
        """Get existing HNSW index definition"""
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT indexdef
                FROM pg_indexes
                WHERE tablename = 'trademark_embeddings'
                  AND indexdef LIKE '%USING hnsw%'
            """)
            result = cur.fetchone()
            return result[0] if result else None
        finally:
            cur.close()

    def drop_index(self, conn):
        """Drop HNSW index if it exists"""
        cur = conn.cursor()
        try:
            cur.execute("""
                DROP INDEX IF EXISTS trademark_embeddings_embedding_idx;
            """)
            conn.commit()
            print("✅ Dropped HNSW index")
        finally:
            cur.close()

    def recreate_index(self, conn):
        """Recreate HNSW index"""
        cur = conn.cursor()
        try:
            print("🔨 Creating HNSW index (this may take 10-15 minutes)...")
            start_time = time.time()

            cur.execute("""
                CREATE INDEX IF NOT EXISTS trademark_embeddings_embedding_idx
                ON trademark_embeddings
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
            """)
            conn.commit()

            elapsed = time.time() - start_time
            print(f"✅ Index created in {elapsed/60:.1f} minutes")

            # Run ANALYZE
            print("📊 Running ANALYZE...")
            cur.execute("ANALYZE trademark_embeddings;")
            conn.commit()
            print("✅ ANALYZE completed")

        finally:
            cur.close()

    def load_checkpoint(self) -> Dict[str, Any]:
        """Load migration checkpoint"""
        if self.checkpoint_file.exists():
            with open(self.checkpoint_file, 'r') as f:
                return json.load(f)
        return {
            'last_index': 0,
            'stats': {
                'total': len(self.embeddings),
                'processed': 0,
                'success': 0,
                'failed': 0
            }
        }

    def save_checkpoint(self, checkpoint: Dict[str, Any]) -> None:
        """Save migration checkpoint"""
        checkpoint['timestamp'] = time.time()
        with open(self.checkpoint_file, 'w') as f:
            json.dump(checkpoint, f, indent=2)

    def run(self, start_from: Optional[int] = None) -> None:
        """Run the migration using COPY command"""
        print("\n" + "=" * 70)
        print("Trademark Embeddings Migration to Supabase (COPY Method)")
        print("=" * 70 + "\n")

        # Connect to database
        print("🔌 Connecting to Supabase...")
        try:
            conn = psycopg2.connect(self.conn_string)
            print("✅ Connected to Supabase")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            print("\nTroubleshooting:")
            print("1. Check your .env.local file")
            print("2. Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
            print("3. Ensure you have network access to Supabase")
            sys.exit(1)

        cur = conn.cursor()

        # Configure session
        print("⚙️  Configuring session...")
        cur.execute("SET statement_timeout = '600000';")  # 10 minutes
        cur.execute("SET idle_in_transaction_session_timeout = '900000';")  # 15 minutes
        cur.execute("SET maintenance_work_mem = '2GB';")  # For index creation
        conn.commit()
        print("✅ Session configured")

        # Load checkpoint
        checkpoint = self.load_checkpoint()
        start_index = start_from if start_from is not None else checkpoint['last_index']
        total = len(self.embeddings)

        if start_index > 0:
            print(f"📍 Resuming from checkpoint: {start_index:,}/{total:,}")

        # Calculate batches
        num_batches = (total - start_index + self.batch_size - 1) // self.batch_size

        print(f"\n📊 Migration Plan:")
        print(f"   Total records: {total:,}")
        print(f"   Starting from: {start_index:,}")
        print(f"   Remaining: {total - start_index:,}")
        print(f"   Batch size: {self.batch_size:,}")
        print(f"   Num batches: {num_batches:,}")
        print(f"   Test mode: {'Yes' if self.test_mode else 'No'}")
        print(f"\n{'─' * 70}\n")

        # Step 1: Drop index
        print("Step 1: Dropping HNSW index...")
        self.drop_index(conn)

        # Step 2: Bulk load data with COPY
        print(f"\nStep 2: Bulk loading {total:,} vectors...")
        stats = checkpoint['stats']

        start_time = time.time()

        with tqdm(total=total - start_index, initial=0, desc="Migrating") as pbar:
            for batch_num in range(num_batches):
                batch_start = start_index + (batch_num * self.batch_size)
                batch_end = min(batch_start + self.batch_size, total)

                try:
                    # Create CSV buffer
                    csv_buffer = self.create_csv_buffer(batch_start, batch_end)

                    # Use COPY command
                    cur.copy_expert(
                        sql="""
                            COPY trademark_embeddings (trademark_number, embedding)
                            FROM STDIN WITH (FORMAT CSV, NULL '')
                        """,
                        file=csv_buffer
                    )

                    batch_size_actual = batch_end - batch_start
                    stats['processed'] += batch_size_actual
                    stats['success'] += batch_size_actual

                    # Update progress
                    pbar.update(batch_size_actual)
                    pbar.set_postfix({
                        'success': stats['success'],
                        'batch': f"{batch_num+1}/{num_batches}"
                    })

                    # Commit every 50k rows
                    if (batch_num + 1) % 5 == 0 or batch_num == num_batches - 1:
                        conn.commit()

                        # Save checkpoint every 100k
                        if (batch_num + 1) % 10 == 0:
                            checkpoint['last_index'] = batch_end
                            checkpoint['stats'] = stats
                            self.save_checkpoint(checkpoint)

                except Exception as e:
                    print(f"\n❌ Batch {batch_num} failed: {str(e)[:200]}")
                    conn.rollback()
                    stats['failed'] += (batch_end - batch_start)

                    # Save checkpoint on error
                    checkpoint['last_index'] = batch_end
                    checkpoint['stats'] = stats
                    self.save_checkpoint(checkpoint)

        # Final commit
        conn.commit()

        elapsed = time.time() - start_time

        # Final checkpoint
        checkpoint['last_index'] = total
        checkpoint['stats'] = stats
        self.save_checkpoint(checkpoint)

        # Print bulk load summary
        print(f"\n{'─' * 70}")
        print(f"✅ Bulk load completed in {elapsed/60:.1f} minutes!")
        print(f"\n📊 Statistics:")
        print(f"   Successful: {stats['success']:,}")
        print(f"   Failed: {stats['failed']:,}")
        print(f"   Rate: {stats['success']/elapsed:.0f} records/sec")
        print(f"{'─' * 70}\n")

        # Step 3: Recreate index
        if not self.test_mode:
            print("Step 3: Recreating HNSW index...")
            self.recreate_index(conn)
        else:
            print("🧪 Test mode: Skipping index recreation")

        # Cleanup
        cur.close()
        conn.close()

        print(f"\n{'=' * 70}")
        print(f"🎉 Migration completed successfully!")
        print(f"{'=' * 70}\n")


def main():
    parser = argparse.ArgumentParser(description='Migrate trademark embeddings using COPY command')
    parser.add_argument('--batch-size', type=int, default=10000, help='Batch size for COPY (default: 10000)')
    parser.add_argument('--start-from', type=int, help='Start from specific index (ignores checkpoint)')
    parser.add_argument('--reset', action='store_true', help='Reset checkpoint and start from beginning')
    parser.add_argument('--test', action='store_true', help='Test mode (skip index recreation)')
    parser.add_argument('--limit', type=int, help='Limit number of records (for testing)')

    args = parser.parse_args()

    try:
        migration = COPYMigration(
            batch_size=args.batch_size,
            test_mode=args.test,
            limit=args.limit
        )

        if args.reset and migration.checkpoint_file.exists():
            migration.checkpoint_file.unlink()
            print("🔄 Checkpoint reset")

        migration.run(start_from=args.start_from)

    except KeyboardInterrupt:
        print("\n\n⚠️  Migration interrupted by user")
        print("📍 Progress saved to checkpoint - you can resume later")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
