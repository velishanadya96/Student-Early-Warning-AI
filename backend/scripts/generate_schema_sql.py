"""Hasilkan database/schema.sql (MySQL) dari app/models.py.

Jalankan dari folder backend/:  python scripts/generate_schema_sql.py
Indeks ditulis di dalam CREATE TABLE supaya file ini aman diimpor ulang (CREATE INDEX tidak punya IF NOT EXISTS di MySQL).
Revisi Alembic terbaru dibaca dari migrations/versions agar `flask db upgrade` sesudah import tidak membuat ulang tabel.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy.dialects import mysql  # noqa: E402
from sqlalchemy.schema import CreateTable  # noqa: E402

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402


def head_revision() -> str:
    revisions, downs = {}, set()
    for path in (ROOT / "migrations" / "versions").glob("*.py"):
        text = path.read_text()
        rev = re.search(r"^revision = '(\w+)'", text, re.M).group(1)
        down = re.search(r"^down_revision = (?:'(\w+)'|None)", text, re.M).group(1)
        revisions[rev] = down
        if down:
            downs.add(down)
    heads = [rev for rev in revisions if rev not in downs]
    if len(heads) != 1:
        sys.exit(f"Harus ada tepat satu head Alembic, ditemukan: {heads}")
    return heads[0]


def main() -> None:
    app = create_app({"SQLALCHEMY_DATABASE_URI": "sqlite://"})
    out = [
        "-- Student Early Warning AI - skema database (MySQL 8) sesuai Dokumen Arsitektur Backend, Bagian 7 (+ orang_tua, revoked_token)",
        "-- DIHASILKAN dari app/models.py oleh scripts/generate_schema_sql.py. Jangan diedit tangan.",
        "-- Import lewat phpMyAdmin / mysql -u root < database/schema.sql, lalu jalankan: python seed.py",
        "-- Skema ditandai sebagai revisi Alembic terbaru, jadi `flask db upgrade` sesudahnya tidak membuat ulang tabel.",
        "",
        "CREATE DATABASE IF NOT EXISTS student_early_warning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        "USE student_early_warning;",
        "",
    ]
    with app.app_context():
        for table in db.metadata.sorted_tables:
            ddl = str(CreateTable(table, if_not_exists=True).compile(dialect=mysql.dialect())).strip()
            indexes = [
                f"{'UNIQUE ' if index.unique else ''}INDEX {index.name} ({', '.join(c.name for c in index.columns)})"
                for index in sorted(table.indexes, key=lambda i: i.name)
            ]
            if indexes:
                ddl = ddl[: ddl.rindex(")")].rstrip() + ",\n\t" + ",\n\t".join(indexes) + "\n)"
            out.append(ddl + " ENGINE=InnoDB;\n")
    out += [
        "CREATE TABLE IF NOT EXISTS alembic_version (",
        "\tversion_num VARCHAR(32) NOT NULL,",
        "\tCONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)",
        ") ENGINE=InnoDB;",
        f"INSERT IGNORE INTO alembic_version (version_num) VALUES ('{head_revision()}');",
        "",
    ]
    (ROOT / "database" / "schema.sql").write_text("\n".join(out))
    print("database/schema.sql dihasilkan.")


if __name__ == "__main__":
    main()
