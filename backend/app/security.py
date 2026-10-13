import os
import bcrypt
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from .errors import ApiError
from .extensions import db

# Biaya bcrypt; 12 = default aman. Test menurunkannya agar cepat.
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

# Hash pembanding: login untuk akun yang tidak ada tetap menjalankan bcrypt sehingga
# waktu respons tidak membocorkan apakah email/username terdaftar.
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


def check_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode(), hashed.encode())
    except ValueError:
        return False


def burn_password_check(raw: str) -> None:
    check_password(raw, _DUMMY_HASH)


def current_user():
    """User dari JWT yang sedang dipakai; 401 kalau akun sudah dihapus/dinonaktifkan."""
    from .models import User

    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        raise ApiError("AKUN_NONAKTIF", "Akun tidak aktif. Silakan login ulang.", 401)
    return user


def roles_required(*roles):
    """RBAC: setiap endpoint menyatakan role yang diizinkan (Bagian 9).
    Role dan status aktif dibaca dari database, bukan dari klaim token, sehingga akun yang
    dinonaktifkan langsung kehilangan akses (tidak menunggu token kedaluwarsa)."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            verify_jwt_in_request()
            if current_user().role not in roles:
                raise ApiError("AKSES_DITOLAK", "Anda tidak memiliki akses ke fitur ini.", 403)
            return fn(*a, **kw)
        return wrapper
    return deco
