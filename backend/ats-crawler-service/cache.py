import sqlite3
import json
import time
import os
from typing import Optional, List
from models import JobListing

DB_PATH = os.path.join(os.path.dirname(__file__), "ats_jobs_cache.db")
CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 Hours

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_cache():
    conn = get_db_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS company_cache (
                company_name TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                cached_at REAL NOT NULL,
                jobs_json TEXT NOT NULL
            )
        """)
    conn.close()

init_cache()

def get_cached_company_jobs(company_name: str) -> Optional[List[JobListing]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT cached_at, jobs_json FROM company_cache WHERE company_name = ?", (company_name,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    cached_at = row["cached_at"]
    if time.time() - cached_at > CACHE_TTL_SECONDS:
        return None  # Expired

    try:
        raw_list = json.loads(row["jobs_json"])
        return [JobListing(**item) for item in raw_list]
    except Exception as e:
        print(f"[Cache] Error decoding cache for {company_name}: {e}")
        return None

def set_cached_company_jobs(company_name: str, platform: str, jobs: List[JobListing]):
    conn = get_db_connection()
    jobs_json = json.dumps([j.model_dump() for j in jobs])
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO company_cache (company_name, platform, cached_at, jobs_json)
            VALUES (?, ?, ?, ?)
        """, (company_name, platform, time.time(), jobs_json))
    conn.close()

def get_all_valid_cached_jobs() -> List[JobListing]:
    conn = get_db_connection()
    cursor = conn.cursor()
    min_time = time.time() - CACHE_TTL_SECONDS
    cursor.execute("SELECT jobs_json FROM company_cache WHERE cached_at >= ?", (min_time,))
    rows = cursor.fetchall()
    conn.close()

    all_jobs: List[JobListing] = []
    for r in rows:
        try:
            items = json.loads(r["jobs_json"])
            all_jobs.extend([JobListing(**i) for i in items])
        except Exception:
            continue
    return all_jobs

def clear_all_cache():
    conn = get_db_connection()
    with conn:
        conn.execute("DELETE FROM company_cache")
    conn.close()
