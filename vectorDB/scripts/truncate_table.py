#!/usr/bin/env python3
"""
데이터베이스 테이블 초기화 스크립트
기존 잘못된 데이터를 삭제하고 재마이그레이션 준비
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
print("테이블 데이터 초기화 (TRUNCATE)")
print("=" * 70 + "\n")

print("🔌 Connecting to Supabase...")
conn = psycopg2.connect(conn_string)
cur = conn.cursor()
print("✅ Connected\n")

# Check current record count
cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
current_count = cur.fetchone()[0]
print(f"📊 현재 레코드 수: {current_count:,}개")

# Check some sample data
print("\n🔍 샘플 데이터 확인:")
cur.execute("""
    SELECT trademark_number,
           LEFT(embedding::text, 50) as embedding_preview
    FROM trademark_embeddings
    LIMIT 5;
""")
samples = cur.fetchall()
for i, (tm_num, emb_prev) in enumerate(samples, 1):
    print(f"  {i}. {tm_num[:50]}... | {emb_prev}...")

print(f"\n⚠️  WARNING: 이 작업은 {current_count:,}개의 모든 레코드를 삭제합니다!")
print("재마이그레이션을 진행할 준비가 되어 있어야 합니다.\n")
print("계속하시겠습니까? (yes 입력 필요): ", end='')

response = input().strip()

if response != 'yes':
    print("❌ 취소되었습니다.")
    cur.close()
    conn.close()
    sys.exit(0)

# Drop index first (will be recreated after migration)
print("\n🔧 Step 1: HNSW 인덱스 제거...")
try:
    cur.execute("DROP INDEX IF EXISTS trademark_embeddings_embedding_idx;")
    conn.commit()
    print("✅ 인덱스 제거 완료")
except Exception as e:
    print(f"⚠️  인덱스 제거 실패 (무시): {e}")
    conn.rollback()

# Truncate table
print("\n🗑️  Step 2: 테이블 데이터 삭제...")
try:
    cur.execute("TRUNCATE TABLE trademark_embeddings;")
    conn.commit()
    print("✅ 데이터 삭제 완료")
except Exception as e:
    print(f"❌ 삭제 실패: {e}")
    conn.rollback()
    cur.close()
    conn.close()
    sys.exit(1)

# Verify
cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
final_count = cur.fetchone()[0]
print(f"\n📊 최종 레코드 수: {final_count:,}개")

if final_count == 0:
    print("✅ 테이블이 비어있습니다. 재마이그레이션 준비 완료!")
else:
    print(f"⚠️  예상치 못한 레코드가 남아있습니다: {final_count:,}개")

cur.close()
conn.close()

print("\n" + "=" * 70)
print("다음 단계: POSTGRES_PASSWORD=\"xezGac-zexrur-rumgu7\" python3 scripts/migrate_with_copy.py --reset")
print("=" * 70)
