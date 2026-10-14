"""Model data sesuai Class Diagram (Gambar 3) & Bagian 7 dokumen arsitektur.
Admin dan Kaprodi tidak punya tabel sendiri - cukup role pada User."""
from datetime import datetime, timezone
from .extensions import db

ROLES = ("admin", "kaprodi", "dosen", "mahasiswa", "orangtua")


def _now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "user"
    id_user = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)  # bcrypt
    role = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)  # DELETE /users = nonaktifkan
    # Verifikasi email & penguncian akun. Akun buatan Admin/seed dianggap sudah terverifikasi (default True);
    # pendaftaran mandiri memakai False sampai tautan di email diklik.
    email_verified = db.Column(db.Boolean, nullable=False, default=True)
    verify_token_hash = db.Column(db.String(64), index=True)   # SHA-256 dari token; token asli tidak disimpan
    verify_expires_at = db.Column(db.DateTime)
    failed_logins = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=_now)

    dosen_pa = db.relationship("DosenPA", back_populates="user", uselist=False)
    mahasiswa = db.relationship("Mahasiswa", back_populates="user", uselist=False)
    orang_tua = db.relationship("OrangTua", back_populates="user", uselist=False)

    @property
    def display_name(self):
        profile = self.mahasiswa or self.dosen_pa or self.orang_tua
        return profile.nama if profile else self.username

    @property
    def nim(self):
        """NIM mahasiswa sendiri, atau NIM anak yang dipantau (orang tua)."""
        if self.mahasiswa:
            return self.mahasiswa.nim
        if self.orang_tua:
            return self.orang_tua.nim
        return None

    def to_dict(self):
        return {
            "id": self.id_user,
            "username": self.username,
            "name": self.display_name,
            "email": self.email,
            "role": self.role,
            "nim": self.nim,
            "no_wa": (self.dosen_pa or self.orang_tua).no_wa if (self.dosen_pa or self.orang_tua) else None,
            "is_active": self.is_active,
            "email_verified": self.email_verified,
            # dosen: id profil Dosen PA-nya sendiri; mahasiswa: id Dosen PA pembimbingnya (null = belum ditugaskan)
            "id_dosen_pa": self.dosen_pa.id_dosen_pa if self.dosen_pa else (self.mahasiswa.id_dosen_pa if self.mahasiswa else None),
        }


class DosenPA(db.Model):
    __tablename__ = "dosen_pa"
    id_dosen_pa = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey("user.id_user"), nullable=False, unique=True)
    nidn = db.Column(db.String(20), nullable=False, unique=True)
    nama = db.Column(db.String(100), nullable=False)
    prodi = db.Column(db.String(100))
    no_wa = db.Column(db.String(20))  # format 62812xxxxxxx; ditampilkan ke orang tua mahasiswa bimbingan

    user = db.relationship("User", back_populates="dosen_pa")
    bimbingan = db.relationship("Mahasiswa", back_populates="dosen_pa")


class Mahasiswa(db.Model):
    __tablename__ = "mahasiswa"
    nim = db.Column(db.String(20), primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey("user.id_user"), nullable=False, unique=True)
    id_dosen_pa = db.Column(db.Integer, db.ForeignKey("dosen_pa.id_dosen_pa"), nullable=True)
    nama = db.Column(db.String(100), nullable=False)
    prodi = db.Column(db.String(100))
    angkatan = db.Column(db.Integer)
    ipk = db.Column(db.Float)  # diimpor dari SIAKAD
    ips = db.Column(db.Float)

    user = db.relationship("User", back_populates="mahasiswa")
    dosen_pa = db.relationship("DosenPA", back_populates="bimbingan")


class RosterMahasiswa(db.Model):
    """Daftar mahasiswa resmi (diimpor Admin dari data kampus/PDDikti). Kalau terisi, daftar mandiri wajib memakai NIM di sini."""
    __tablename__ = "roster_mahasiswa"
    nim = db.Column(db.String(20), primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    prodi = db.Column(db.String(100))
    angkatan = db.Column(db.Integer)
    email = db.Column(db.String(120))  # opsional: email Google yang diharapkan untuk NIM ini


class OrangTua(db.Model):
    """Akun pendamping: satu orang tua memantau satu mahasiswa (nim)."""
    __tablename__ = "orang_tua"
    id_orang_tua = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey("user.id_user"), nullable=False, unique=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    nama = db.Column(db.String(100), nullable=False)
    no_wa = db.Column(db.String(20))  # tujuan notifikasi WhatsApp (FR-11); ditampilkan ke Dosen PA

    user = db.relationship("User", back_populates="orang_tua")
    mahasiswa = db.relationship("Mahasiswa")


class Nilai(db.Model):
    __tablename__ = "nilai"
    id_nilai = db.Column(db.Integer, primary_key=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    kode_mk = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    nilai_mk = db.Column(db.Float)


class Presensi(db.Model):
    __tablename__ = "presensi"
    id_presensi = db.Column(db.Integer, primary_key=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    kode_mk = db.Column(db.String(20), nullable=False)
    pertemuan = db.Column(db.Integer, nullable=False)
    status_kehadiran = db.Column(db.String(20), nullable=False)


class Tugas(db.Model):
    __tablename__ = "tugas"
    id_tugas = db.Column(db.Integer, primary_key=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    kode_mk = db.Column(db.String(20), nullable=False)
    waktu_kumpul = db.Column(db.DateTime)
    status_terlambat = db.Column(db.String(20))


class RiskScore(db.Model):
    __tablename__ = "risk_score"
    __table_args__ = (db.UniqueConstraint("nim", "periode", name="uq_risk_nim_periode"),)
    id_score = db.Column(db.Integer, primary_key=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    periode = db.Column(db.String(20), nullable=False)
    skor = db.Column(db.Float, nullable=False)  # probabilitas kelas High
    kategori_risiko = db.Column(db.String(10), nullable=False)  # Low / Medium / High
    faktor_dominan = db.Column(db.String(100))


class CatatanTindakLanjut(db.Model):
    __tablename__ = "catatan_tindak_lanjut"
    id_catatan = db.Column(db.Integer, primary_key=True)
    nim = db.Column(db.String(20), db.ForeignKey("mahasiswa.nim"), nullable=False, index=True)
    id_dosen_pa = db.Column(db.Integer, db.ForeignKey("dosen_pa.id_dosen_pa"), nullable=False)
    id_score = db.Column(db.Integer, db.ForeignKey("risk_score.id_score"), nullable=False)
    isi_catatan = db.Column(db.Text, nullable=False)
    isi_pesan = db.Column(db.Text)
    tanggal = db.Column(db.Date, nullable=False)


class Notifikasi(db.Model):
    __tablename__ = "notifikasi"
    id_notifikasi = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey("user.id_user"), nullable=False, index=True)
    id_score = db.Column(db.Integer, db.ForeignKey("risk_score.id_score"), nullable=False)
    isi_pesan = db.Column(db.Text, nullable=False)
    status_kirim = db.Column(db.String(20), nullable=False, default="pending")
    kanal = db.Column(db.String(20), nullable=False)  # sistem / wa
    dibaca = db.Column(db.Boolean, nullable=False, default=False)  # untuk PATCH /notifikasi/{id}/baca
