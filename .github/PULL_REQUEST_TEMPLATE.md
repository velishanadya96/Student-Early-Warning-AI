## Ringkasan
<!-- Apa yang berubah dan KENAPA? -->

## Jenis perubahan
- [ ] Perbaikan bug
- [ ] Fitur baru
- [ ] Dokumentasi / tooling
- [ ] Menyentuh login, hak akses, atau data pengguna (butuh review ekstra)

## Checklist
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` lolos (jika menyentuh frontend)
- [ ] `APP_ENV=testing pytest` lolos (jika menyentuh backend)
- [ ] Ada tes untuk perilaku baru
- [ ] Tidak ada rahasia (`.env`, password, kunci) di commit
- [ ] Migrasi dan `database/schema.sql` diperbarui (jika mengubah model)
- [ ] Dokumentasi diperbarui bila perlu

## Cara menguji
<!-- Langkah untuk mencoba perubahan ini -->
