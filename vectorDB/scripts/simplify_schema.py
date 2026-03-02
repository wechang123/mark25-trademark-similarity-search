#!/usr/bin/env python3
"""
테이블 스키마 간소화 스크립트
trademark_number + embedding만 남기고 나머지 컬럼 제거
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
print("테이블 스키마 간소화")
print("=" * 70 + "\n")

print("🔌 Connecting to Supabase...")
conn = psycopg2.connect(conn_string)
cur = conn.cursor()
print("✅ Connected\n")

# Check current schema
print("📋 현재 테이블 구조 확인...")
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'trademark_embeddings'
    ORDER BY ordinal_position;
""")
current_columns = cur.fetchall()
print("\n현재 컬럼 목록:")
for col_name, col_type in current_columns:
    print(f"  - {col_name} ({col_type})")

# Columns to keep
keep_columns = {'id', 'trademark_number', 'embedding', 'created_at'}

# Columns to drop
drop_columns = [
    col for col, _ in current_columns
    if col not in keep_columns
]

if not drop_columns:
    print("\n✅ 스키마가 이미 간소화되어 있습니다!")
    cur.close()
    conn.close()
    sys.exit(0)

print(f"\n⚠️  다음 {len(drop_columns)}개 컬럼을 제거합니다:")
for col in drop_columns:
    print(f"  - {col}")

print("\n계속하시겠습니까? (y/n): ", end='')
response = input().strip().lower()

if response != 'y':
    print("❌ 취소되었습니다.")
    cur.close()
    conn.close()
    sys.exit(0)

# Drop columns
print("\n🔧 컬럼 제거 중...")
for col in drop_columns:
    try:
        cur.execute(f"ALTER TABLE trademark_embeddings DROP COLUMN IF EXISTS {col};")
        print(f"  ✓ Dropped: {col}")
    except Exception as e:
        print(f"  ✗ Failed to drop {col}: {e}")
        conn.rollback()
        continue

conn.commit()

# Verify final schema
print("\n📋 최종 테이블 구조:")
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'trademark_embeddings'
    ORDER BY ordinal_position;
""")
final_columns = cur.fetchall()
for col_name, col_type in final_columns:
    print(f"  - {col_name} ({col_type})")

# Check record count
cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
count = cur.fetchone()[0]
print(f"\n현재 레코드 수: {count:,}개")

cur.close()
conn.close()

print("\n✅ 스키마 간소화 완료!")
print("=" * 70)
