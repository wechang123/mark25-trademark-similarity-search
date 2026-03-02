#!/usr/bin/env python3
"""
Check actual record count in trademark_embeddings table
"""

import os
import sys
import psycopg2
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

# Get connection string
conn_string = os.getenv('POSTGRES_URL_NON_POOLING')

if not conn_string:
    SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    DB_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not SUPABASE_URL:
        print("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL")
        sys.exit(1)

    password = DB_PASSWORD if DB_PASSWORD else SERVICE_KEY
    project_id = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

    conn_string = (
        f"postgres://postgres.{project_id}:{password}"
        f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
        f"?sslmode=require"
    )

print("🔗 Connecting to Supabase PostgreSQL...")
print()

try:
    conn = psycopg2.connect(conn_string, connect_timeout=30)
    cur = conn.cursor()

    print("✅ Connected successfully")
    print()

    # Get total count
    print("📊 Checking trademark_embeddings table...")
    cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
    total_count = cur.fetchone()[0]

    print(f"   Total records: {total_count:,}")
    print()

    # Check if specific Starbucks trademarks exist
    starbucks_numbers = ['4520120004900', '4020160015394']

    print("🔍 Checking for specific Starbucks trademarks...")
    for trademark_num in starbucks_numbers:
        cur.execute(
            "SELECT trademark_number FROM trademark_embeddings WHERE trademark_number = %s;",
            (trademark_num,)
        )
        result = cur.fetchone()

        if result:
            print(f"   ✅ Found: {trademark_num}")
        else:
            print(f"   ❌ NOT FOUND: {trademark_num}")

    print()

    # Get sample records
    print("📝 Sample records (first 5):")
    cur.execute("""
        SELECT trademark_number,
               array_length(embedding::float[], 1) as embedding_dim
        FROM trademark_embeddings
        LIMIT 5;
    """)

    for row in cur.fetchall():
        print(f"   {row[0]} - dimension: {row[1]}")

    print()

    # Check embedding dimensions distribution
    print("📏 Checking embedding dimensions...")
    cur.execute("""
        SELECT array_length(embedding::float[], 1) as dim, COUNT(*) as count
        FROM trademark_embeddings
        GROUP BY dim
        ORDER BY count DESC;
    """)

    for row in cur.fetchall():
        print(f"   Dimension {row[0]}: {row[1]:,} records")

    print()

    cur.close()
    conn.close()

    print("=" * 70)
    print("✅ Check Complete")
    print("=" * 70)

except psycopg2.Error as e:
    print(f"❌ Database Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    sys.exit(1)
