"""Token bertanda tangan untuk tautan di email (verifikasi dan reset password)."""
import hashlib

from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from .errors import ApiError


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["JWT_SECRET_KEY"], salt=salt)


def _fingerprint(user) -> str:
    """Sidik jari hash password: token reset otomatis tidak berlaku setelah password diganti."""
    return hashlib.sha256(user.password_hash.encode()).hexdigest()[:16]


def make_verify_token(user) -> str:
    return _serializer("email-verify").dumps({"id": user.id_user, "email": user.email})


def read_verify_token(token: str) -> dict:
    try:
        return _serializer("email-verify").loads(token, max_age=current_app.config["VERIFY_TOKEN_HOURS"] * 3600)
    except SignatureExpired:
        raise ApiError("TOKEN_KEDALUWARSA", "Tautan verifikasi sudah kedaluwarsa. Minta tautan baru.", 400)
    except BadSignature:
        raise ApiError("TOKEN_TIDAK_VALID", "Tautan verifikasi tidak valid.", 400)


def make_reset_token(user) -> str:
    return _serializer("password-reset").dumps({"id": user.id_user, "fp": _fingerprint(user)})


def read_reset_token(token: str) -> dict:
    try:
        return _serializer("password-reset").loads(token, max_age=current_app.config["RESET_TOKEN_MINUTES"] * 60)
    except SignatureExpired:
        raise ApiError("TOKEN_KEDALUWARSA", "Tautan reset password sudah kedaluwarsa. Minta tautan baru.", 400)
    except BadSignature:
        raise ApiError("TOKEN_TIDAK_VALID", "Tautan reset password tidak valid.", 400)


def reset_token_matches(user, data: dict) -> bool:
    return data.get("fp") == _fingerprint(user)
