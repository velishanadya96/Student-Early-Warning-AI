-- Student Early Warning AI - skema database (MySQL 8) sesuai Dokumen Arsitektur Backend, Bagian 7 (+ orang_tua, revoked_token)
-- DIHASILKAN dari app/models.py oleh scripts/generate_schema_sql.py. Jangan diedit tangan.
-- Import lewat phpMyAdmin / mysql -u root < database/schema.sql, lalu jalankan: python seed.py
-- Skema ditandai sebagai revisi Alembic terbaru, jadi `flask db upgrade` sesudahnya tidak membuat ulang tabel.

CREATE DATABASE IF NOT EXISTS student_early_warning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_early_warning;

CREATE TABLE IF NOT EXISTS revoked_token (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	jti VARCHAR(64) NOT NULL, 
	expires_at DATETIME NOT NULL, 
	PRIMARY KEY (id),
	UNIQUE INDEX ix_revoked_token_jti (jti)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user (
	id_user INTEGER NOT NULL AUTO_INCREMENT, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	`role` VARCHAR(20) NOT NULL, 
	is_active BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	email_verified_at DATETIME, 
	failed_logins INTEGER NOT NULL, 
	locked_until DATETIME, 
	PRIMARY KEY (id_user), 
	UNIQUE (username), 
	UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dosen_pa (
	id_dosen_pa INTEGER NOT NULL AUTO_INCREMENT, 
	id_user INTEGER NOT NULL, 
	nidn VARCHAR(20) NOT NULL, 
	nama VARCHAR(100) NOT NULL, 
	prodi VARCHAR(100), 
	PRIMARY KEY (id_dosen_pa), 
	UNIQUE (id_user), 
	FOREIGN KEY(id_user) REFERENCES user (id_user), 
	UNIQUE (nidn)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mahasiswa (
	nim VARCHAR(20) NOT NULL, 
	id_user INTEGER NOT NULL, 
	id_dosen_pa INTEGER, 
	nama VARCHAR(100) NOT NULL, 
	prodi VARCHAR(100), 
	angkatan INTEGER, 
	ipk FLOAT, 
	ips FLOAT, 
	PRIMARY KEY (nim), 
	UNIQUE (id_user), 
	FOREIGN KEY(id_user) REFERENCES user (id_user), 
	FOREIGN KEY(id_dosen_pa) REFERENCES dosen_pa (id_dosen_pa)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nilai (
	id_nilai INTEGER NOT NULL AUTO_INCREMENT, 
	nim VARCHAR(20) NOT NULL, 
	kode_mk VARCHAR(20) NOT NULL, 
	semester VARCHAR(20) NOT NULL, 
	nilai_mk FLOAT, 
	PRIMARY KEY (id_nilai), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim),
	INDEX ix_nilai_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orang_tua (
	id_orang_tua INTEGER NOT NULL AUTO_INCREMENT, 
	id_user INTEGER NOT NULL, 
	nim VARCHAR(20) NOT NULL, 
	nama VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id_orang_tua), 
	UNIQUE (id_user), 
	FOREIGN KEY(id_user) REFERENCES user (id_user), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim),
	INDEX ix_orang_tua_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS presensi (
	id_presensi INTEGER NOT NULL AUTO_INCREMENT, 
	nim VARCHAR(20) NOT NULL, 
	kode_mk VARCHAR(20) NOT NULL, 
	pertemuan INTEGER NOT NULL, 
	status_kehadiran VARCHAR(20) NOT NULL, 
	PRIMARY KEY (id_presensi), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim),
	INDEX ix_presensi_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS risk_score (
	id_score INTEGER NOT NULL AUTO_INCREMENT, 
	nim VARCHAR(20) NOT NULL, 
	periode VARCHAR(20) NOT NULL, 
	skor FLOAT NOT NULL, 
	kategori_risiko VARCHAR(10) NOT NULL, 
	faktor_dominan VARCHAR(100), 
	PRIMARY KEY (id_score), 
	CONSTRAINT uq_risk_nim_periode UNIQUE (nim, periode), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim),
	INDEX ix_risk_score_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tugas (
	id_tugas INTEGER NOT NULL AUTO_INCREMENT, 
	nim VARCHAR(20) NOT NULL, 
	kode_mk VARCHAR(20) NOT NULL, 
	waktu_kumpul DATETIME, 
	status_terlambat VARCHAR(20), 
	PRIMARY KEY (id_tugas), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim),
	INDEX ix_tugas_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catatan_tindak_lanjut (
	id_catatan INTEGER NOT NULL AUTO_INCREMENT, 
	nim VARCHAR(20) NOT NULL, 
	id_dosen_pa INTEGER NOT NULL, 
	id_score INTEGER NOT NULL, 
	isi_catatan TEXT NOT NULL, 
	isi_pesan TEXT, 
	tanggal DATE NOT NULL, 
	PRIMARY KEY (id_catatan), 
	FOREIGN KEY(nim) REFERENCES mahasiswa (nim), 
	FOREIGN KEY(id_dosen_pa) REFERENCES dosen_pa (id_dosen_pa), 
	FOREIGN KEY(id_score) REFERENCES risk_score (id_score),
	INDEX ix_catatan_tindak_lanjut_nim (nim)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifikasi (
	id_notifikasi INTEGER NOT NULL AUTO_INCREMENT, 
	id_user INTEGER NOT NULL, 
	id_score INTEGER NOT NULL, 
	isi_pesan TEXT NOT NULL, 
	status_kirim VARCHAR(20) NOT NULL, 
	kanal VARCHAR(20) NOT NULL, 
	dibaca BOOL NOT NULL, 
	PRIMARY KEY (id_notifikasi), 
	FOREIGN KEY(id_user) REFERENCES user (id_user), 
	FOREIGN KEY(id_score) REFERENCES risk_score (id_score),
	INDEX ix_notifikasi_id_user (id_user)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alembic_version (
	version_num VARCHAR(32) NOT NULL,
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
) ENGINE=InnoDB;
INSERT IGNORE INTO alembic_version (version_num) VALUES ('24165dbbc535');
