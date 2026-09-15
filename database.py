from contextlib import contextmanager
import os
import mysql.connector

from config import Config

@contextmanager
def connection():

    connect_args = {
        "host": Config.DB_HOST,
        "port": Config.DB_PORT,
        "user": Config.DB_USER,
        "password": Config.DB_PASSWORD,
        "database": Config.DB_NAME,
    }

    # Enable TLS automatically for TiDB Cloud
    if Config.DB_SSL_CA and os.path.exists(Config.DB_SSL_CA):
        connect_args["ssl_ca"] = Config.DB_SSL_CA
        connect_args["ssl_verify_cert"] = True

    conn = mysql.connector.connect(**connect_args)

    try:
        yield conn
    finally:
        conn.close()


def fetch_all(sql, params=()):
    with connection() as conn:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(sql, params)
            return cur.fetchall()
        finally:
            cur.close()


def fetch_one(sql, params=()):
    with connection() as conn:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(sql, params)
            return cur.fetchone()
        finally:
            cur.close()


def execute(sql, params=()):
    with connection() as conn:
        cur = conn.cursor()
        try:
            cur.execute(sql, params)
            conn.commit()
            return cur.lastrowid
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


def ensure_announcement_link_column():
    """Add the optional announcement link column for existing GameHub databases."""

    with connection() as conn:
        cur = conn.cursor()
        try:
            try:
                cur.execute(
                    "ALTER TABLE announcements ADD COLUMN link_url VARCHAR(700) NULL AFTER message"
                )
                conn.commit()
            except mysql.connector.Error as exc:
                if exc.errno != 1060:
                    conn.rollback()
                    raise
        finally:
            cur.close()