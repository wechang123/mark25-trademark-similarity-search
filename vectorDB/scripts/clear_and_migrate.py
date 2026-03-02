#!/usr/bin/env python3
"""
Clear existing data and run COPY migration
"""
import os
import sys
from pathlib import Path

# Load environment
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env.local'

def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

load_env_file(env_path)
load_env_file(project_root / 'vectorDB' / '.env.local')

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed")
    sys.exit(1)

# Get credentials
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
db_password = os.getenv('POSTGRES_PASSWORD')

if not supabase_url or not db_password:
    print("❌ Missing credentials")
    sys.exit(1)

project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')
conn_string = (
    f"postgres://postgres.{project_id}:{db_password}"
    f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    f"?sslmode=require"
)

print("🔌 Connecting to Supabase...")
try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()

    print("🗑️  Clearing trademark_embeddings table...")
    cur.execute("TRUNCATE TABLE trademark_embeddings;")
    conn.commit()

    print("✅ Table cleared successfully!")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print("\n🚀 Starting COPY migration...")
print("=" * 70)
