#!/usr/bin/env python3
"""
HNSW Index Creation Script for Supabase pgvector

This script creates a HNSW (Hierarchical Navigable Small World) index
on the trademark_embeddings table to enable fast similarity search.

Usage:
    POSTGRES_PASSWORD="your_password" python3 create_hnsw_index.py
"""

import os
import sys
import time
import psycopg2
from psycopg2 import sql
from pathlib import Path

# Load environment variables from .env.local
def load_env_file(env_path: Path) -> None:
    """Load environment variables from .env.local file"""
    if not env_path.exists():
        return

    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

# Load environment variables
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env.local'
load_env_file(env_path)

vectordb_env = project_root / 'vectorDB' / '.env.local'
load_env_file(vectordb_env)

# Validate environment variables
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD')

# Try to use POSTGRES_URL_NON_POOLING first (most reliable)
conn_string = os.getenv('POSTGRES_URL_NON_POOLING')

if not conn_string:
    # Fallback to constructing connection string
    if not SUPABASE_URL or not SERVICE_KEY:
        print("❌ Error: Missing required environment variables")
        print("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        print("Optional: POSTGRES_PASSWORD, POSTGRES_URL_NON_POOLING")
        sys.exit(1)

    # Use database password if available, otherwise fall back to service key
    password = DB_PASSWORD if DB_PASSWORD else SERVICE_KEY

    # Extract project ID from Supabase URL
    # Example: https://bpjdodqkijqmxxafqfjz.supabase.co
    project_id = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

    # Construct connection string (same format as migrate_with_copy.py)
    conn_string = (
        f"postgres://postgres.{project_id}:{password}"
        f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
        f"?sslmode=require"
    )

# Extract project ID for display
if SUPABASE_URL:
    project_id = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
else:
    # Extract from connection string
    import re
    match = re.search(r'postgres\.([^:]+):', conn_string)
    project_id = match.group(1) if match else 'unknown'


def create_hnsw_index():
    """Create HNSW index on trademark_embeddings table"""

    print("🔗 Connecting to Supabase PostgreSQL...")
    print(f"   Project ID: {project_id}")
    print()

    try:
        # Use connection string (same as migrate_with_copy.py)
        # Use autocommit=True for CONCURRENTLY operations
        conn = psycopg2.connect(conn_string, connect_timeout=30)

        conn.set_session(autocommit=True)
        cur = conn.cursor()

        print("✅ Connected successfully")
        print()

        # Set statement timeout to 30 minutes for index creation
        print("⏱️  Setting statement timeout to 30 minutes...")
        cur.execute("SET statement_timeout = '1800s';")  # 30 minutes
        print("✅ Statement timeout configured")
        print()

        # Check if index already exists
        print("🔍 Checking if HNSW index already exists...")
        cur.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'trademark_embeddings'
            AND indexname = 'trademark_embeddings_embedding_idx';
        """)

        existing_index = cur.fetchone()

        if existing_index:
            print("⚠️  HNSW index already exists!")
            print("   Index name: trademark_embeddings_embedding_idx")

            response = input("\n🤔 Do you want to DROP and recreate it? (yes/no): ").strip().lower()

            if response == 'yes':
                print("\n🗑️  Dropping existing index...")
                cur.execute("DROP INDEX IF EXISTS trademark_embeddings_embedding_idx;")
                conn.commit()
                print("✅ Existing index dropped")
            else:
                print("\n✋ Keeping existing index. Exiting...")
                cur.close()
                conn.close()
                return

        print()
        print("=" * 70)
        print("🚀 Creating HNSW Index for Vector Similarity Search")
        print("=" * 70)
        print()
        print("📊 Index Configuration:")
        print("   - Table: trademark_embeddings")
        print("   - Column: embedding (vector 1024)")
        print("   - Algorithm: HNSW")
        print("   - Distance: Cosine (vector_cosine_ops)")
        print("   - Parameters:")
        print("     • m = 16 (max connections per layer)")
        print("     • ef_construction = 64 (construction quality)")
        print()
        print("⏱️  Estimated time: 10-15 minutes for 690,078 records")
        print("   This is a long-running operation. Please be patient...")
        print()

        start_time = time.time()

        # Create HNSW index with CONCURRENTLY option
        # CONCURRENTLY allows the index to be built without locking writes
        # and is more resilient to connection timeouts
        print("🔨 Creating HNSW index (CONCURRENTLY)...")
        print("   SQL: CREATE INDEX CONCURRENTLY trademark_embeddings_embedding_idx")
        print("        ON trademark_embeddings")
        print("        USING hnsw (embedding vector_cosine_ops)")
        print("        WITH (m = 16, ef_construction = 64);")
        print()
        print("ℹ️  Using CONCURRENTLY to avoid table locking and improve resilience")
        print()

        # Autocommit mode is already enabled at connection time

        cur.execute("""
            CREATE INDEX CONCURRENTLY trademark_embeddings_embedding_idx
            ON trademark_embeddings
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        """)

        # No commit needed - autocommit is enabled for CONCURRENTLY

        index_time = time.time() - start_time
        print(f"✅ HNSW index created successfully in {index_time:.2f} seconds ({index_time/60:.2f} minutes)")
        print()

        # Run ANALYZE to update statistics
        print("📈 Running ANALYZE to update table statistics...")
        cur.execute("ANALYZE trademark_embeddings;")
        conn.commit()

        analyze_time = time.time() - start_time - index_time
        print(f"✅ ANALYZE completed in {analyze_time:.2f} seconds")
        print()

        # Verify index creation
        print("🔍 Verifying index creation...")
        cur.execute("""
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'trademark_embeddings'
            AND indexname = 'trademark_embeddings_embedding_idx';
        """)

        index_info = cur.fetchone()

        if index_info:
            print("✅ Index verified successfully!")
            print(f"   Schema: {index_info[0]}")
            print(f"   Table: {index_info[1]}")
            print(f"   Index: {index_info[2]}")
            print()
        else:
            print("⚠️  Warning: Index created but could not be verified")
            print()

        # Get index size
        print("📦 Checking index size...")
        cur.execute("""
            SELECT pg_size_pretty(pg_relation_size('trademark_embeddings_embedding_idx'));
        """)

        index_size = cur.fetchone()
        if index_size:
            print(f"   Index size: {index_size[0]}")
            print()

        total_time = time.time() - start_time

        print("=" * 70)
        print("🎉 Index Creation Complete!")
        print("=" * 70)
        print(f"⏱️  Total time: {total_time:.2f} seconds ({total_time/60:.2f} minutes)")
        print()
        print("📝 Next Steps:")
        print("   1. Test the similar image search in the admin debug page")
        print("   2. Monitor query performance with EXPLAIN ANALYZE")
        print("   3. Adjust ef_search parameter if needed for query performance")
        print()

        cur.close()
        conn.close()

    except psycopg2.OperationalError as e:
        print(f"❌ Connection Error: {e}")
        print()
        print("💡 Troubleshooting:")
        print("   1. Check if POSTGRES_PASSWORD is correct")
        print("   2. Verify Supabase database is accessible")
        print("   3. Check network connection")
        sys.exit(1)

    except psycopg2.Error as e:
        print(f"❌ Database Error: {e}")
        sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Operation interrupted by user")
        print("   The index creation may be incomplete.")
        print("   You may need to drop the partial index and recreate it.")
        sys.exit(1)

    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_hnsw_index()
