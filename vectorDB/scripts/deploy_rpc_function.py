#!/usr/bin/env python3
"""
Deploy optimized RPC function to Supabase

This script deploys the optimized match_trademark_embeddings function
that properly utilizes the HNSW index.

Usage:
    POSTGRES_PASSWORD="your_password" python3 deploy_rpc_function.py
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
    project_id = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

    # Construct connection string
    conn_string = (
        f"postgres://postgres.{project_id}:{password}"
        f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
        f"?sslmode=require"
    )

# Extract project ID for display
if SUPABASE_URL:
    project_id = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
else:
    import re
    match = re.search(r'postgres\.([^:]+):', conn_string)
    project_id = match.group(1) if match else 'unknown'


def deploy_rpc_function():
    """Deploy optimized RPC function to Supabase"""

    print("🔗 Connecting to Supabase PostgreSQL...")
    print(f"   Project ID: {project_id}")
    print()

    try:
        conn = psycopg2.connect(conn_string, connect_timeout=30)
        conn.set_session(autocommit=True)
        cur = conn.cursor()

        print("✅ Connected successfully")
        print()

        # Read SQL file
        sql_file = Path(__file__).parent / 'create_rpc_function_optimized.sql'

        if not sql_file.exists():
            print(f"❌ Error: SQL file not found: {sql_file}")
            sys.exit(1)

        with open(sql_file, 'r') as f:
            sql_content = f.read()

        print("📄 Deploying optimized RPC function...")
        print("   Function: match_trademark_embeddings")
        print("   Optimization: Removed WHERE clause to use HNSW index")
        print()

        # Execute SQL
        cur.execute(sql_content)

        print("✅ RPC function deployed successfully!")
        print()

        # Verify function
        print("🔍 Verifying function deployment...")
        cur.execute("""
            SELECT proname, pronargs, prosrc
            FROM pg_proc
            WHERE proname = 'match_trademark_embeddings';
        """)

        result = cur.fetchone()

        if result:
            print("✅ Function verified:")
            print(f"   Name: {result[0]}")
            print(f"   Arguments: {result[1]}")
            print()
        else:
            print("⚠️  Warning: Function deployed but could not be verified")
            print()

        print("=" * 70)
        print("🎉 Deployment Complete!")
        print("=" * 70)
        print()
        print("📝 Next Steps:")
        print("   1. Test the similar image search")
        print("   2. Verify HNSW index is being used (should be much faster)")
        print("   3. Check query performance")
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

    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    deploy_rpc_function()
