#!/usr/bin/env python3
"""
Type D (순수 텍스트) 상표를 Supabase에서 삭제
"""

import os
import sys
import psycopg2
from pathlib import Path

# 환경변수 로드
def load_env_file(env_path):
    if not env_path.exists():
        return
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

project_root = Path(__file__).parent.parent.parent
load_env_file(project_root / '.env.local')
load_env_file(project_root / 'vectorDB' / '.env.local')

conn_string = os.getenv('POSTGRES_URL_NON_POOLING')

if not conn_string:
    print("❌ POSTGRES_URL_NON_POOLING not found")
    sys.exit(1)

def delete_type_d_trademarks():
    print("🔗 Connecting to Supabase...")

    conn = psycopg2.connect(conn_string, connect_timeout=30)
    conn.set_session(autocommit=False)  # 트랜잭션 사용
    cur = conn.cursor()

    print("✅ Connected")

    # Step 1: 현재 레코드 수 확인
    print("\n📊 Checking current record count...")
    cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
    total_before = cur.fetchone()[0]
    print(f"   Current records: {total_before:,}")

    # Step 2: 삭제할 출원번호 로드
    delete_file = Path(__file__).parent.parent / 'delete_trademark_numbers.txt'
    print(f"\n📂 Loading trademark numbers to delete from: {delete_file}")

    with open(delete_file, 'r', encoding='utf-8') as f:
        delete_numbers = [line.strip() for line in f if line.strip()]

    print(f"   Loaded {len(delete_numbers):,} trademark numbers to delete")

    # Step 3: 배치 삭제 (1000개씩)
    batch_size = 1000
    total_deleted = 0

    print(f"\n🗑️  Starting deletion (batch size: {batch_size})...")

    for i in range(0, len(delete_numbers), batch_size):
        batch = delete_numbers[i:i+batch_size]

        # DELETE 쿼리 실행
        placeholders = ','.join(['%s'] * len(batch))
        query = f"DELETE FROM trademark_embeddings WHERE trademark_number IN ({placeholders});"

        cur.execute(query, batch)
        deleted = cur.rowcount
        total_deleted += deleted

        if (i // batch_size + 1) % 10 == 0:  # 10배치마다 진행상황 출력
            print(f"   Progress: {i+batch_size:,} / {len(delete_numbers):,} processed, {total_deleted:,} deleted")

    print(f"\n✅ Deletion complete: {total_deleted:,} records deleted")

    # Step 4: 트랜잭션 커밋
    print("\n💾 Committing transaction...")
    conn.commit()
    print("✅ Transaction committed")

    # Step 5: 최종 레코드 수 확인
    print("\n📊 Checking final record count...")
    cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
    total_after = cur.fetchone()[0]
    print(f"   Final records: {total_after:,}")
    print(f"   Records removed: {total_before - total_after:,}")

    # Step 6: ANALYZE 실행 (통계 업데이트)
    print("\n📊 Running ANALYZE...")
    cur.execute("ANALYZE trademark_embeddings;")
    print("✅ Complete")

    cur.close()
    conn.close()

    print(f"\n🎉 All done! Database now contains {total_after:,} trademarks (Type A + 미분류)")

if __name__ == "__main__":
    try:
        delete_type_d_trademarks()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
