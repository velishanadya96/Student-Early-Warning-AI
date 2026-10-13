# Kontribusi

Kamu **tidak perlu** ditambahkan sebagai collaborator untuk berkontribusi. Alurnya:

1. **Fork** repo ini ke akun GitHub-mu (tombol *Fork*).
2. Clone fork-mu dan buat branch: `git switch -c fix/nama-singkat`.
3. Kerjakan perubahan kecil dan fokus. Jalankan pemeriksaan lokal (di bawah).
4. Push ke fork-mu lalu buka **Pull Request** ke repo ini. Isi templat PR.
5. Pemilik repo me-review. CI otomatis berjalan di PR dan harus hijau sebelum digabung.

Hanya pemilik (dan collaborator yang ditambahkan) yang bisa langsung push ke repo ini; semua orang lain lewat Pull Request.

## Pemeriksaan sebelum membuka PR
```bash
# frontend (root repo)
npm ci && npm run typecheck && npm run lint && npm test && npm run build
# backend
cd backend && pip install -r requirements.txt -r requirements-dev.txt && APP_ENV=testing pytest
# subproject Vite
cd modul-8-vite && npm ci && npm run typecheck && npm run check && npm run build
```
Jika mengubah model database: buat migrasi (`flask db migrate`), jalankan `python scripts/generate_schema_sql.py`, dan commit keduanya.

## Aturan singkat
- Jangan commit rahasia: `.env`, kunci, password, atau dump database. Kalau tidak sengaja ter-commit, beri tahu pemilik agar secret diganti.
- Tambahkan tes untuk perilaku baru, terutama yang menyangkut login, hak akses, dan data pengguna.
- Satu PR = satu topik. Jelaskan **mengapa** perubahan dibuat, bukan hanya apa.
- Laporan kerentanan keamanan **jangan** dibuka sebagai issue publik; hubungi pemilik repo langsung.

## Untuk pemilik repo (agar PR dari luar aman)
Atur di GitHub *Settings*:
- *Branches → Add rule* untuk `master`: wajib Pull Request, wajib status check CI hijau, dan blokir force-push.
- *Actions → General → Fork pull request workflows*: pilih **Require approval for all outside collaborators** supaya CI dari PR orang asing tidak jalan otomatis (mencegah penyalahgunaan runner/secret). Workflow di repo ini tidak memakai secret.
- Aktifkan *Dependabot alerts* dan *Secret scanning*.
