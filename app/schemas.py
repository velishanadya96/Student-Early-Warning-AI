"""Validasi input dengan Pydantic (Bagian 6): tipe & rentang tidak wajar ditolak."""
import re
from typing import Literal, Optional
from pydantic import BaseModel, ValidationError, field_validator, model_validator

from .errors import ApiError

SSO_DOMAIN = "@student.uns.ac.id"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
Role = Literal["admin", "kaprodi", "dosen", "mahasiswa", "orangtua"]


def parse(model, data):
    """Validasi body; kalau gagal -> 422 dengan pesan Indonesia."""
    try:
        return model.model_validate(data or {})
    except ValidationError as e:
        first = e.errors()[0]
        msg = first["msg"].removeprefix("Value error, ")
        if first["type"] in ("missing", "string_type", "int_parsing", "literal_error"):
            field = ".".join(str(p) for p in first["loc"]) or "input"
            msg = f"Field '{field}' wajib diisi dengan nilai yang valid."
        raise ApiError("VALIDASI_GAGAL", msg, 422)


def _email(v: str) -> str:
    """Email SSO wajib untuk akun internal."""
    v = _email_any(v)
    if not v.endswith(SSO_DOMAIN):
        raise ValueError(f"Email harus menggunakan format nama{SSO_DOMAIN}.")
    return v


def _email_any(v: str) -> str:
    v = v.strip().lower()
    if not EMAIL_RE.match(v):
        raise ValueError("Format email tidak valid.")
    return v


def _wa(v):
    """Normalisasi nomor WhatsApp ke format 62xxxxxxxxxx (spasi, strip, +, 08.. dibersihkan)."""
    if v is None or not str(v).strip():
        return None
    digits = re.sub(r"[\s\-().+]", "", str(v))
    if not digits.isdigit():
        raise ValueError("Nomor WhatsApp hanya boleh berisi angka.")
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    if not digits.startswith("62") or not 10 <= len(digits) <= 15:
        raise ValueError("Nomor WhatsApp tidak valid. Contoh: 081234567890.")
    return digits


class LoginIn(BaseModel):
    username: str  # boleh username ATAU email (FR-01)
    password: str

    @model_validator(mode="before")
    @classmethod
    def _alias(cls, data):
        if isinstance(data, dict) and "username" not in data and "email" in data:
            data = {**data, "username": data["email"]}
        return data

    @field_validator("username")
    @classmethod
    def _u(cls, v):
        v = v.strip().lower()
        if not v:
            raise ValueError("Username atau email wajib diisi.")
        return v

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter.")
        return v


class LoginOrtuIn(BaseModel):
    """Login Orang Tua (FR-01): NIM anak + email anak + password orang tua."""
    nim: str
    email: str
    password: str

    @field_validator("nim")
    @classmethod
    def _nim(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("NIM mahasiswa wajib diisi.")
        return v

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        return _email_any(v)

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter.")
        return v


class RegisterOrtuIn(BaseModel):
    """Pendaftaran mandiri Orang Tua: diverifikasi dengan NIM + email anak."""
    name: str
    email: str          # email milik orang tua sendiri
    password: str
    nim: str            # NIM anak
    email_mahasiswa: str
    no_wa: str

    @field_validator("name")
    @classmethod
    def _n(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Nama lengkap minimal 3 karakter.")
        return v

    @field_validator("email", "email_mahasiswa")
    @classmethod
    def _e(cls, v):
        return _email_any(v)

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        if len(v) < 8:
            raise ValueError("Password minimal 8 karakter.")
        return v

    @field_validator("nim")
    @classmethod
    def _nim(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("NIM mahasiswa wajib diisi.")
        return v

    @field_validator("no_wa")
    @classmethod
    def _w(cls, v):
        w = _wa(v)
        if not w:
            raise ValueError("Nomor WhatsApp wajib diisi.")
        return w


class RegisterIn(BaseModel):
    """Pendaftaran mandiri - khusus mahasiswa."""
    name: str
    email: str
    password: str
    nim: str
    username: Optional[str] = None
    prodi: Optional[str] = "D3 Teknik Informatika"
    angkatan: Optional[int] = None

    @field_validator("name")
    @classmethod
    def _n(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Nama lengkap minimal 3 karakter.")
        return v

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        return _email(v)

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        if len(v) < 8:
            raise ValueError("Password minimal 8 karakter.")
        return v

    @field_validator("nim")
    @classmethod
    def _nim(cls, v):
        v = v.strip()
        if not v.isalnum() or len(v) < 6:
            raise ValueError("NIM wajib diisi, minimal 6 digit angka.")
        return v

    @field_validator("angkatan")
    @classmethod
    def _a(cls, v):
        if v is not None and not 2000 <= v <= 2100:
            raise ValueError("Angkatan tidak valid.")
        return v


class UserCreateIn(RegisterIn):
    """Dibuat Admin (FR-12): semua role."""
    role: Role
    nim: Optional[str] = None   # mahasiswa: NIM sendiri; orangtua: NIM anak yang dipantau
    nidn: Optional[str] = None
    no_wa: Optional[str] = None  # wajib untuk dosen & orangtua

    @field_validator("no_wa")
    @classmethod
    def _w(cls, v):
        return _wa(v)

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        return _email_any(v)  # domain SSO dicek per role di _by_role (orang tua boleh email umum)

    @field_validator("nim")
    @classmethod
    def _nim(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v.isalnum() or len(v) < 6:
            raise ValueError("NIM minimal 6 karakter alfanumerik.")
        return v

    @model_validator(mode="after")
    def _by_role(self):
        if self.role != "orangtua" and not self.email.endswith(SSO_DOMAIN):
            raise ValueError(f"Email harus menggunakan format nama{SSO_DOMAIN}.")
        if self.role == "mahasiswa" and not self.nim:
            raise ValueError("NIM wajib diisi untuk akun mahasiswa.")
        if self.role == "orangtua" and not self.nim:
            raise ValueError("NIM mahasiswa yang dipantau wajib diisi untuk akun orang tua.")
        if self.role == "dosen" and not (self.nidn or "").strip():
            raise ValueError("NIDN wajib diisi untuk akun Dosen PA.")
        if self.role in ("dosen", "orangtua") and not self.no_wa:
            raise ValueError("Nomor WhatsApp wajib diisi untuk akun Dosen PA dan orang tua.")
        return self


class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    no_wa: Optional[str] = None

    @field_validator("no_wa")
    @classmethod
    def _w(cls, v):
        return _wa(v)

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        return None if v is None else _email_any(v)  # domain SSO dicek di route sesuai role

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError("Password minimal 8 karakter.")
        return v


class AssignDosenIn(BaseModel):
    id_dosen_pa: int


class VerifyEmailIn(BaseModel):
    token: str

    @field_validator("token")
    @classmethod
    def _t(cls, v):
        v = (v or "").strip()
        if not v or len(v) > 200:
            raise ValueError("Token tidak valid.")
        return v


class ResendIn(BaseModel):
    """Kirim ulang: pakai email akun, atau (khusus orang tua) NIM anak + email anak."""
    email: str
    nim: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        return (v or "").strip().lower()
