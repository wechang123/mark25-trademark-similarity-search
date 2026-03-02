#!/usr/bin/env python3
"""
테이블 생성 스크립트
trademark_embeddings 테이블을 Supabase에 생성합니다
"""
import os
import sys
from pathlib import Path
import psycopg2

# Load environment
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

# Get credentials
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
db_password = os.getenv('POSTGRES_PASSWORD')

if not supabase_url or not db_password:
    raise ValueError("Missing required environment variables")

# Extract project ID and build connection string
project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')
conn_string = (
    f"postgres://postgres.{project_id}:{db_password}"
    f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    f"?sslmode=require"
)

print("=" * 70)
print("테이블 생성 (trademark_embeddings)")
print("=" * 70 + "\n")

print("🔌 Connecting to Supabase...")
conn = psycopg2.connect(conn_string)
conn.autocommit = True
cur = conn.cursor()
print("✅ Connected\n")

# Enable pgvector extension
print("🔧 Step 1: Enabling pgvector extension...")
try:
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    print("✅ pgvector extension enabled\n")
except Exception as e:
    print(f"⚠️  Warning: {e}\n")

# Create table
print("🔧 Step 2: Creating trademark_embeddings table...")
try:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS trademark_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trademark_number VARCHAR(50) NOT NULL,
            embedding vector(1024) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    print("✅ Table created\n")
except Exception as e:
    print(f"❌ Table creation failed: {e}")
    cur.close()
    conn.close()
    sys.exit(1)

# Create index on trademark_number
print("🔧 Step 3: Creating index on trademark_number...")
try:
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_trademark_number
        ON trademark_embeddings(trademark_number);
    """)
    print("✅ Index created\n")
except Exception as e:
    print(f"⚠️  Index creation failed (may already exist): {e}\n")

# Verify table structure
print("📋 Table structure:")
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'trademark_embeddings'
    ORDER BY ordinal_position;
""")
columns = cur.fetchall()
for col_name, col_type in columns:
    print(f"  - {col_name} ({col_type})")

cur.close()
conn.close()

print("\n✅ 테이블 생성 완료!")
print("=" * 70)
print("다음 단계: POSTGRES_PASSWORD=\"xezGac-zexrur-rumgu7\" python3 vectorDB/scripts/migrate_with_copy.py --reset")
print("=" * 70)
