#!/usr/bin/env python3
"""
Remove _md suffix from trademark_number in trademark_embeddings_filtered table
"""

import os
import sys
from pathlib import Path

# Load environment variables
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

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed")
    sys.exit(1)

# Get connection string
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
db_password = os.getenv('POSTGRES_PASSWORD')

if not supabase_url or not service_key:
    print("❌ Missing environment variables")
    sys.exit(1)

password = db_password if db_password else service_key
project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')

conn_string = (
    f"postgres://postgres.{project_id}:{password}"
    f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    f"?sslmode=require"
)

print("🔗 Connecting to Supabase...")
conn = psycopg2.connect(conn_string, connect_timeout=30)
conn.set_session(autocommit=False)
cur = conn.cursor()

# Set longer timeout for this session
cur.execute("SET statement_timeout = '600000';")  # 10 minutes
conn.commit()

print("✅ Connected\n")

# Get IDs with _md suffix
print("📊 Getting records with _md suffix...")
cur.execute("""
    SELECT id, trademark_number
    FROM trademark_embeddings_filtered
    WHERE trademark_number LIKE '%_md%'
    ORDER BY id
    LIMIT 50000;
""")

records = cur.fetchall()
total = len(records)
print(f"   Found {total:,} records to update\n")

if total == 0:
    print("✅ No records to update!")
    cur.close()
    conn.close()
    sys.exit(0)

# Update in batches
batch_size = 1000
updated_count = 0

print(f"🔄 Updating in batches of {batch_size}...")

for i in range(0, total, batch_size):
    batch = records[i:i+batch_size]

    # Build UPDATE query with CASE
    ids = [str(r[0]) for r in batch]

    # Simple approach: update one by one in a transaction
    for record_id, tm_number in batch:
        new_number = tm_number.split('_md')[0]
        cur.execute("""
            UPDATE trademark_embeddings_filtered
            SET trademark_number = %s
            WHERE id = %s
        """, (new_number, record_id))

    conn.commit()
    updated_count += len(batch)

    if (i // batch_size + 1) % 10 == 0:
        print(f"   Progress: {updated_count:,} / {total:,} updated")

print(f"\n✅ Update complete: {updated_count:,} records updated")

# Verify
print("\n📊 Verifying...")
cur.execute("SELECT COUNT(*) FROM trademark_embeddings_filtered WHERE trademark_number LIKE '%_md%';")
remaining = cur.fetchone()[0]

if remaining == 0:
    print("✅ Success! No _md suffixes remaining")
else:
    print(f"⚠️  Warning: {remaining:,} records still have _md suffix")

cur.close()
conn.close()

print("\n🎉 Done!")
