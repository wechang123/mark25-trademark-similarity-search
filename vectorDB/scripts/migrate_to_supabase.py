#!/usr/bin/env python3
"""
Trademark Embeddings Migration to Supabase pgvector
Migrates vector embeddings from local .npy files to Supabase pgvector with checkpoint support.
"""

import os
import sys
import json
import time
import argparse
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
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase-py not installed")
    print("Run: pip install supabase")
    sys.exit(1)


class SupabaseMigration:
    def __init__(self, batch_size: int = 100, workers: int = 4):
        self.batch_size = batch_size
        self.workers = workers
        self.checkpoint_file = Path(__file__).parent / 'migration_checkpoint.json'

        # Validate environment variables
        required_vars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables:\n" +
                "\n".join(f"  - {var}" for var in missing_vars) +
                "\nPlease check your .env.local file"
            )

        # Initialize Supabase client
        self.supabase: Client = create_client(
            os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )

        # Load data files
        self.vectordb_path = Path(__file__).parent.parent
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

        print(f"✅ Loaded {len(self.embeddings):,} embeddings")
        print(f"✅ Loaded {len(self.filenames):,} filenames")
        print(f"✅ Loaded {len(self.metadata):,} metadata entries")

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
                'failed': 0,
                'skipped': 0
            }
        }

    def save_checkpoint(self, checkpoint: Dict[str, Any]) -> None:
        """Save migration checkpoint"""
        checkpoint['timestamp'] = time.time()
        with open(self.checkpoint_file, 'w') as f:
            json.dump(checkpoint, f, indent=2)

    def prepare_batch(self, start_idx: int, end_idx: int) -> List[Dict[str, Any]]:
        """Prepare a batch of records for insertion"""
        batch = []

        for i in range(start_idx, end_idx):
            if i >= len(self.embeddings):
                break

            filename = self.filenames[i]
            embedding = self.embeddings[i].tolist()

            # Extract trademark number from filename
            # Format: "40201234567.jpg" or similar
            trademark_number = filename.split('.')[0] if filename else f"unknown_{i}"

            # Ensure trademark_number doesn't exceed 50 characters (database limit)
            if len(trademark_number) > 50:
                trademark_number = trademark_number[:50]

            # Get metadata if available
            meta = self.metadata.get(trademark_number, {})

            record = {
                'trademark_number': trademark_number,
                'filename': filename,
                'filepath': f'gs://ipdr-trademark-images/{trademark_number}.jpg',  # GCS path
                'embedding': embedding,
                'trademark_name': meta.get('trademark_name'),
                'status': meta.get('status', 'active'),
                'application_date': meta.get('application_date'),
                'trademark_type_code': meta.get('trademark_type_code'),
                'applicant_name': meta.get('applicant_name'),
                'product_codes': meta.get('product_codes'),
                'product_classes': meta.get('product_classes'),
                'vienna_codes': meta.get('vienna_codes'),
                'trademark_type': meta.get('trademark_type')
            }

            batch.append(record)

        return batch

    def _reconnect_supabase(self):
        """Reconnect to Supabase (connection pool recovery)"""
        try:
            self.supabase: Client = create_client(
                os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
                os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            )
            print("  🔄 Supabase connection reset")
        except Exception as e:
            print(f"  ⚠️  Failed to reset connection: {str(e)[:100]}")

    def insert_batch(self, batch: List[Dict[str, Any]], retry_count: int = 0) -> tuple[int, int]:
        """Insert a batch of records into Supabase with connection recovery"""
        if not batch:
            return 0, 0

        try:
            # Direct batch insert
            response = self.supabase.table('trademark_embeddings').insert(
                batch
            ).execute()
            return len(batch), 0
        except Exception as e:
            error_msg = str(e)

            # If it's a duplicate key error, skip silently
            if 'duplicate key' in error_msg.lower():
                return 0, 0

            # Check for connection-related errors
            connection_errors = ['connection', 'timeout', 'timed out', 'network', 'reset']
            if any(err in error_msg.lower() for err in connection_errors) and retry_count < 3:
                print(f"\n⚠️  Connection issue detected, resetting... (attempt {retry_count + 1}/3)")
                self._reconnect_supabase()
                time.sleep(2)  # Wait before retry
                return self.insert_batch(batch, retry_count + 1)

            print(f"\n❌ Batch insert failed: {error_msg[:200]}")

            # Try inserting one by one to identify problematic records
            success_count = 0
            fail_count = 0

            for record in batch:
                try:
                    self.supabase.table('trademark_embeddings').insert(
                        record
                    ).execute()
                    success_count += 1
                except Exception as item_error:
                    # Skip duplicate key errors silently
                    if 'duplicate key' in str(item_error).lower():
                        continue
                    fail_count += 1
                    print(f"  Failed: {record['trademark_number']} - {str(item_error)[:100]}")

            return success_count, fail_count

    def run(self, start_from: Optional[int] = None) -> None:
        """Run the migration"""
        print("\n" + "=" * 70)
        print("Trademark Embeddings Migration to Supabase pgvector")
        print("=" * 70 + "\n")

        # Load checkpoint
        checkpoint = self.load_checkpoint()
        start_index = start_from if start_from is not None else checkpoint['last_index']
        total = len(self.embeddings)

        if start_index > 0:
            print(f"📍 Resuming from checkpoint: {start_index:,}/{total:,} ({start_index/total*100:.1f}%)")

        # Calculate batches
        num_batches = (total - start_index + self.batch_size - 1) // self.batch_size

        print(f"\n📊 Migration Plan:")
        print(f"   Total records: {total:,}")
        print(f"   Starting from: {start_index:,}")
        print(f"   Remaining: {total - start_index:,}")
        print(f"   Batch size: {self.batch_size:,}")
        print(f"   Num batches: {num_batches:,}")
        print(f"   Workers: {self.workers}")
        print(f"\n{'─' * 70}\n")

        # Process batches sequentially
        stats = checkpoint['stats']

        with tqdm(total=total - start_index, initial=0, desc="Migrating") as pbar:
            for batch_num in range(num_batches):
                batch_start = start_index + (batch_num * self.batch_size)
                batch_end = min(batch_start + self.batch_size, total)

                # Prepare and insert batch
                batch = self.prepare_batch(batch_start, batch_end)

                try:
                    success, failed = self.insert_batch(batch)

                    # Update stats
                    stats['processed'] += len(batch)
                    stats['success'] += success
                    stats['failed'] += failed

                    # Update progress
                    pbar.update(len(batch))
                    pbar.set_postfix({
                        'success': stats['success'],
                        'failed': stats['failed'],
                        'batch': f"{batch_num+1}/{num_batches}"
                    })

                    # Add delay between batches to prevent timeout
                    time.sleep(0.5)

                    # Save checkpoint every 100 batches (reduced frequency to prevent I/O blocking)
                    if (batch_num + 1) % 100 == 0:
                        checkpoint['last_index'] = batch_end
                        checkpoint['stats'] = stats
                        self.save_checkpoint(checkpoint)

                except Exception as e:
                    print(f"\n❌ Batch {batch_num} failed: {str(e)}")
                    stats['failed'] += len(batch)

        # Final checkpoint
        checkpoint['last_index'] = total  # All done
        checkpoint['stats'] = stats
        self.save_checkpoint(checkpoint)

        # Print summary
        print(f"\n{'─' * 70}")
        print(f"✅ Migration completed!")
        print(f"\n📊 Final Statistics:")
        print(f"   Total processed: {stats['processed']:,}")
        print(f"   Successful: {stats['success']:,}")
        print(f"   Failed: {stats['failed']:,}")
        print(f"   Success rate: {stats['success']/stats['processed']*100:.2f}%")
        print(f"{'─' * 70}\n")


def main():
    parser = argparse.ArgumentParser(description='Migrate trademark embeddings to Supabase')
    parser.add_argument('--batch-size', type=int, default=100, help='Batch size for insertion (default: 100)')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers (default: 4)')
    parser.add_argument('--start-from', type=int, help='Start from specific index (ignores checkpoint)')
    parser.add_argument('--reset', action='store_true', help='Reset checkpoint and start from beginning')

    args = parser.parse_args()

    try:
        migration = SupabaseMigration(batch_size=args.batch_size, workers=args.workers)

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
