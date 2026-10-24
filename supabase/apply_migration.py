"""
Applies the lung cancer detection SQL migration to the live Supabase PostgreSQL database.
"""

import sys
import psycopg2
from pathlib import Path

DB_URL = "postgresql://postgres:Btqr0GrOVoVhoiXe@db.wmrozzpccwwdhswdoewm.supabase.co:5432/postgres"

def apply_migration():
    migration_file = Path("supabase/migrations/20261023_init_lung_cancer.sql")
    if not migration_file.exists():
        print(f"[!] Migration file not found at {migration_file}")
        sys.exit(1)

    with open(migration_file, "r") as f:
        sql = f.read()

    print("[*] Connecting to live Supabase PostgreSQL database...")
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        with conn.cursor() as cursor:
            print("[*] Applying migration: 20261023_init_lung_cancer.sql...")
            cursor.execute(sql)
            print("[+] Successfully executed schema migration!")
            
            # Verify tables exist
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('profiles', 'predictions');
            """)
            tables = [row[0] for row in cursor.fetchall()]
            print(f"[+] Verified public tables in Supabase: {tables}")

        conn.close()
    except Exception as e:
        print(f"[!] Migration execution error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
