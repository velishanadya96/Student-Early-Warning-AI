import os
from datetime import datetime, timezone

os.environ.setdefault("BCRYPT_ROUNDS", "4")

import pytest  # noqa: E402

from app import create_app
from app.extensions import db
from app.models import DosenPA, Mahasiswa, OrangTua, User
from app.security import hash_password

PASSWORD = "Rahasia123"


def make_app(**overrides):
    from sqlalchemy.pool import StaticPool

    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
        "SQLALCHEMY_ENGINE_OPTIONS": {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool},
        "RATELIMIT_ENABLED": False,
        **overrides,
    })
    with app.app_context():
        db.create_all()
        _seed()
    return app


@pytest.fixture()
def app():
    app = make_app()
    with app.app_context():
        yield app
        db.session.remove()
        db.drop_all()


def _add(username, email, role):
    user = User(username=username, email=email, role=role, password_hash=hash_password(PASSWORD),
                email_verified_at=datetime.now(timezone.utc))
    db.session.add(user)
    db.session.flush()
    return user


def _seed():
    _add("admin", "admin@student.uns.ac.id", "admin")
    dosen_user = _add("dosen", "dosen@student.uns.ac.id", "dosen")
    db.session.add(DosenPA(id_user=dosen_user.id_user, nidn="0012345601", nama="Dosen PA"))
    alya = _add("alya", "alya@student.uns.ac.id", "mahasiswa")
    db.session.add(Mahasiswa(nim="2024001", id_user=alya.id_user, nama="Alya Putri"))
    db.session.flush()
    ortu = _add("orangtua", "orangtua@example.com", "orangtua")
    db.session.add(OrangTua(id_user=ortu.id_user, nim="2024001", nama="Orang Tua Alya"))
    db.session.commit()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def login(client):
    def _login(username, password=PASSWORD):
        res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
        return res
    return _login


@pytest.fixture()
def auth(login):
    """Header Authorization untuk akun seed."""
    def _auth(username):
        token = login(username).get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _auth
