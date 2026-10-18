# KONTRAK MODEL AI
## Student Early Warning AI

### 1. Artefak yang digunakan

Model:
`models/model_final.pkl`

Target:
`risk_level`

Kelas:
Low, Medium, High

Threshold untuk kelas High:
0.4

### 2. Input dari backend

Backend menerima data mahasiswa dengan fitur berikut.

Fitur (urutan kolom WAJIB sama, semuanya numerik):
GPA, avg_course_grade, attendance_rate, assignment_submission_rate

Satuan: GPA 0-4; avg_course_grade 0-100; attendance_rate dan
assignment_submission_rate berupa pecahan 0-1 (bukan persen).

Rentang data latih (nilai di luar rentang tetap bisa diprediksi tetapi
kurang dapat dipercaya): {"GPA": [2.0, 4.0], "avg_course_grade": [60.0, 100.0], "attendance_rate": [0.6, 1.0], "assignment_submission_rate": [0.5, 1.0]}

Kolom berikut TIDAK digunakan:
- student_id
- enrollment_status
- risk_level
- age, gender, major (atribut demografis, tidak dipakai untuk keputusan)
- 4 kolom LMS (tidak tersedia di sistem; terbukti tidak menambah akurasi)

`enrollment_status` tidak digunakan karena status tersebut dapat
diketahui setelah masa studi dan dapat menyebabkan data leakage.

### 3. Preprocessing

Preprocessing sudah tersimpan di dalam pipeline model.

Backend TIDAK perlu melakukan scaling atau encoding secara manual.

Model akan melakukan preprocessing sesuai pipeline yang tersimpan
di `model_final.pkl`.

### 4. Aturan prediksi

Model menghasilkan probabilitas untuk kelas:

Low, Medium, High.

Jika probabilitas kelas High >= threshold (0.4),
maka hasil akhir adalah:

High

Jika tidak, hasil akhir dipilih dari kelas selain High dengan
probabilitas terbesar.

### 5. Contoh INPUT

{
  "GPA": 3.36,
  "avg_course_grade": 92.4,
  "attendance_rate": 0.97,
  "assignment_submission_rate": 0.66
}

### 6. Contoh PROSES

Probabilitas High:
0.006

Threshold:
0.4

### 7. Contoh OUTPUT

{
  "kategori": "Low",
  "probabilitas_high": 0.006
}

### 8. Catatan

Model digunakan untuk memberikan peringatan awal berdasarkan data
akademik. Hasil model bukan keputusan akademik otomatis dan tetap
membutuhkan validasi manusia.

Label pada dataset latih tampak dibangkitkan dari aturan ambang
attendance_rate dan GPA, sehingga akurasi mendekati 100% pada dataset ini
tidak membuktikan performa pada data kampus nyata.

Penjelasan penyebab risiko dihitung backend dengan membandingkan peluang
High sebelum/sesudah satu fitur diganti nilai tipikal (`referensi`).
