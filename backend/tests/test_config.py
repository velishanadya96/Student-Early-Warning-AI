import pytest

from app import create_app


def test_production_menolak_secret_lemah(monkeypatch):
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        create_app({"APP_ENV": "production", "JWT_SECRET_KEY": "pendek", "SQLALCHEMY_DATABASE_URI": "sqlite://"})


def test_production_menolak_secret_bawaan_dev():
    with pytest.raises(RuntimeError):
        create_app({"APP_ENV": "production", "JWT_SECRET_KEY": "dev-only-" + "x" * 40, "SQLALCHEMY_DATABASE_URI": "sqlite://"})


def test_production_menerima_secret_kuat():
    create_app({"APP_ENV": "production", "JWT_SECRET_KEY": "k" * 48, "SQLALCHEMY_DATABASE_URI": "sqlite://"})
