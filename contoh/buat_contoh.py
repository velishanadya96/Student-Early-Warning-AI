"""Membuat contoh CSV (deterministik) untuk demo: python contoh/buat_contoh.py"""
import csv, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
random.seed(7)
PERIODE = "2026-1"
MK = [("TI101", "Algoritma dan Pemrograman"), ("TI102", "Basis Data"), ("TI103", "Jaringan Komputer"),
      ("TI104", "Pemrograman Web"), ("TI105", "Matematika Diskrit")]
# nim, nama, angkatan, ipk, rata_nilai, kehadiran, tugas
S = [
    ("2024001", "Alya Putri", 2024, 3.72, 88, .95, .95),
    ("2024002", "Bagas Pratama", 2024, 2.90, 72, .82, .70),
    ("2024003", "Citra Lestari", 2024, 3.10, 76, .55, .80),   # High karena KEHADIRAN
    ("2024004", "Dimas Ramadhan", 2023, 3.00, 74, .80, .65),
    ("2024005", "Eka Sari", 2023, 2.20, 60, .90, .90),        # High karena IPK / nilai
    ("2024006", "Farhan Maulana", 2024, 3.40, 82, .90, .85),
    ("2024007", "Gita Anjani", 2024, 3.55, 85, .93, .90),
    ("2024008", "Hendra Wijaya", 2023, 1.95, 52, .50, .35),   # High, banyak faktor
    ("2024009", "Intan Permata", 2023, 2.80, 70, .78, .60),
    ("2024010", "Joko Santoso", 2024, 3.20, 78, .60, .70),    # High karena kehadiran
    ("2024011", "Kirana Dewi", 2024, 3.65, 86, .97, .95),
    ("2024012", "Lukman Hakim", 2023, 2.60, 68, .85, .55),
]
with open(os.path.join(HERE, f"akademik_{PERIODE}.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["nim", "nama", "prodi", "angkatan", "ipk", "nidn_dosen_pa", "kode_mk", "nilai_mk", "total_pertemuan", "hadir"])
    for nim, nama, ang, ipk, nilai, hadir, _ in S:
        total_pert = 14 * len(MK)
        hadir_total = round(hadir * total_pert)
        per = [hadir_total // len(MK)] * len(MK)
        for i in range(hadir_total - sum(per)):
            per[i] += 1
        for (kode, _n), h in zip(MK, per):
            w.writerow([nim, nama, "D3 Teknik Informatika", ang, f"{ipk:.2f}", "0012345601", kode,
                        max(0, min(100, round(nilai + random.randint(-6, 6)))), 14, min(14, h)])
with open(os.path.join(HERE, f"tugas_{PERIODE}.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["nim", "kode_mk", "judul", "waktu_kumpul", "status_terlambat"])
    for nim, _nama, _a, _i, _n, _h, tugas in S:
        total = 10
        kumpul = round(tugas * total)
        for k in range(total):
            kode, _ = MK[k % len(MK)]
            judul = f"Tugas {k // len(MK) + 1} {kode}"
            if k < kumpul:
                terlambat = random.random() < 0.15
                w.writerow([nim, kode, judul, f"2026-09-{10 + k:02d} 14:30", "terlambat" if terlambat else "tepat"])
            else:
                w.writerow([nim, kode, judul, "", ""])
