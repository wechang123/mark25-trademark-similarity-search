#!/usr/bin/env python3
"""
Migration Validation Script
Validates the integrity of the migrated trademark embeddings data.
"""

import os
import sys
import json
from pathlib import Path

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
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

# Load environment variables
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env.local'
load_env_file(env_path)

vectordb_env = project_root / 'vectorDB' / '.env.local'
load_env_file(vectordb_env)

try:
    import psycopg2
    import numpy as np
except ImportError as e:
    print(f"❌ Error: Required package not installed - {e}")
    print("Run: pip install psycopg2-binary numpy")
    sys.exit(1)


def validate_migration():
    """Validate the migration"""
    print("\n" + "=" * 70)
    print("Migration Validation")
    print("=" * 70 + "\n")

    # Get connection info
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not service_key:
        print("❌ Missing environment variables")
        return False

    project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')
    conn_string = (
        f"postgres://postgres.{project_id}:{service_key}"
        f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
        f"?sslmode=require"
    )

    # Load expected data
    vectordb_path = Path(__file__).parent.parent
    embeddings = np.load(vectordb_path / 'embeddings.npy')
    with open(vectordb_path / 'filenames.json', 'r') as f:
        filenames = json.load(f)

    expected_count = len(embeddings)

    print(f"Expected records: {expected_count:,}\n")

    # Connect to database
    try:
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor()

        # Test 1: Check record count
        print("Test 1: Checking record count...")
        cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
        actual_count = cur.fetchone()[0]

        if actual_count == expected_count:
            print(f"   ✅ PASS: Found {actual_count:,} records")
        else:
            print(f"   ❌ FAIL: Found {actual_count:,} records (expected {expected_count:,})")

        # Test 2: Check for NULL embeddings
        print("\nTest 2: Checking for NULL embeddings...")
        cur.execute("SELECT COUNT(*) FROM trademark_embeddings WHERE embedding IS NULL;")
        null_count = cur.fetchone()[0]

        if null_count == 0:
            print(f"   ✅ PASS: No NULL embeddings")
        else:
            print(f"   ❌ FAIL: Found {null_count} NULL embeddings")

        # Test 3: Check index exists
        print("\nTest 3: Checking HNSW index...")
        cur.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'trademark_embeddings'
              AND indexdef LIKE '%USING hnsw%';
        """)
        index_result = cur.fetchone()

        if index_result:
            print(f"   ✅ PASS: Index exists")
            print(f"   Index: {index_result[0]}")
        else:
            print(f"   ⚠️  WARNING: HNSW index not found (may be test mode)")

        # Test 4: Check table size
        print("\nTest 4: Checking table size...")
        cur.execute("""
            SELECT pg_size_pretty(pg_total_relation_size('trademark_embeddings'));
        """)
        table_size = cur.fetchone()[0]
        print(f"   📊 Table size: {table_size}")

        # Test 5: Test vector search
        print("\nTest 5: Testing vector search...")
        cur.execute("""
            SELECT trademark_number, filename,
                   embedding <=> '[0.1,0.2,0.3]'::vector AS distance
            FROM trademark_embeddings
            ORDER BY distance
            LIMIT 5;
        """)
        results = cur.fetchall()

        if results:
            print(f"   ✅ PASS: Vector search working")
            print(f"   Found {len(results)} nearest neighbors")
        else:
            print(f"   ❌ FAIL: Vector search not working")

        # Test 6: Check embedding dimensions
        print("\nTest 6: Checking embedding dimensions...")
        cur.execute("""
            SELECT vector_dims(embedding) as dims, COUNT(*) as count
            FROM trademark_embeddings
            GROUP BY dims
            LIMIT 10;
        """)
        dim_results = cur.fetchall()

        if len(dim_results) == 1 and dim_results[0][0] == 1024:
            print(f"   ✅ PASS: All embeddings have 1024 dimensions")
        else:
            print(f"   ❌ FAIL: Inconsistent dimensions:")
            for dims, count in dim_results:
                print(f"      - {dims} dimensions: {count} records")

        # Test 7: Sample data check
        print("\nTest 7: Checking sample data...")
        cur.execute("""
            SELECT trademark_number, filename, filepath,
                   trademark_name, status
            FROM trademark_embeddings
            LIMIT 3;
        """)
        samples = cur.fetchall()

        print(f"   Sample records:")
        for sample in samples:
            print(f"      - {sample[0]}: {sample[1]}")

        # Summary
        print("\n" + "=" * 70)
        print("Validation Summary")
        print("=" * 70)
        print(f"✅ Record count: {actual_count:,} / {expected_count:,}")
        print(f"✅ NULL check: {null_count} NULL embeddings")
        print(f"✅ Index: {'Present' if index_result else 'Missing'}")
        print(f"✅ Table size: {table_size}")
        print(f"✅ Vector search: {'Working' if results else 'Failed'}")
        print("=" * 70 + "\n")

        cur.close()
        conn.close()

        return actual_count == expected_count and null_count == 0

    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = validate_migration()
    sys.exit(0 if success else 1)
