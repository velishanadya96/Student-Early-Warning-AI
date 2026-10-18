"""Latih ulang model risiko 4 fitur (sesuai SKPL: tanpa data LMS) dan simpan ke ml/model_final.pkl.

Jalankan dari folder backend:   python ml/latih_model.py
Versi scikit-learn harus sama dengan requirements.txt supaya file .pkl bisa dimuat.
"""
import json
import os
import pickle
import sys

import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "data", "college_student_management_data.csv")
OUT = os.path.join(HERE, "model_final.pkl")

# Urutan kolom WAJIB sama dengan yang dipakai backend (app/risk.py).
FITUR = ["GPA", "avg_course_grade", "attendance_rate", "assignment_submission_rate"]
LABELS = ["Low", "Medium", "High"]
THRESHOLD = 0.4  # peluang High >= 0.4 -> kategori High (peringatan dini: lebih baik lebih peka)

d = pd.read_csv(CSV).drop_duplicates()
# Nilai mustahil dijadikan kosong (imputer di dalam pipeline yang mengisinya)
rentang = {"GPA": (0, 4), "avg_course_grade": (0, 100), "attendance_rate": (0, 1), "assignment_submission_rate": (0, 1)}
for kolom, (lo, hi) in rentang.items():
    d.loc[(d[kolom] < lo) | (d[kolom] > hi), kolom] = np.nan

X, y = d[FITUR], d["risk_level"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)


def buat_pipe():
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(n_estimators=200, max_depth=6, class_weight="balanced", random_state=42)),
    ])


def prediksi_akhir(pipe, data, threshold=THRESHOLD):
    proba = pipe.predict_proba(data)
    kelas = list(pipe.classes_)
    i_high = kelas.index("High")
    lain = proba.copy()
    lain[:, i_high] = -1
    pred_lain = np.array(kelas)[lain.argmax(axis=1)]
    return np.where(proba[:, i_high] >= threshold, "High", pred_lain), proba[:, i_high]


# 1) Pilih threshold dengan cross-validation pada DATA LATIH saja
cv = StratifiedKFold(5, shuffle=True, random_state=42)
p_cv = cross_val_predict(buat_pipe(), X_tr, y_tr, cv=cv, method="predict_proba")
i_high = sorted(y_tr.unique()).index("High")
tabel_threshold = {}
for t in (0.2, 0.3, 0.4, 0.5, 0.6):
    pred = np.where(p_cv[:, i_high] >= t, "High", "Non-High")
    biner = np.where(y_tr == "High", "High", "Non-High")
    tabel_threshold[str(t)] = {
        "precision": round(precision_score(biner, pred, pos_label="High", zero_division=0), 3),
        "recall": round(recall_score(biner, pred, pos_label="High", zero_division=0), 3),
        "f1": round(f1_score(biner, pred, pos_label="High", zero_division=0), 3),
    }

# 2) Latih model final pada data latih, uji SEKALI pada data uji
model = buat_pipe().fit(X_tr, y_tr)
pred_te, _ = prediksi_akhir(model, X_te)
laporan = classification_report(y_te, pred_te, labels=LABELS, output_dict=True, zero_division=0)

# 3) Latih ulang di seluruh data agar model memakai semua informasi yang ada
final = buat_pipe().fit(X, y)

paket = {
    "jenis": "classification",
    "model": final,
    "threshold": THRESHOLD,
    "fitur": FITUR,
    "target": "risk_level",
    "labels": LABELS,
    "versi_sklearn": sklearn.__version__,
    # Nilai pembanding "sehat" (median data latih) dipakai untuk menjelaskan faktor penyebab risiko
    "referensi": {k: float(X[k].median()) for k in FITUR},
}
with open(OUT, "wb") as f:
    pickle.dump(paket, f)

metrik = {
    "fitur": FITUR, "jumlah_data": int(len(d)), "threshold": THRESHOLD,
    "uji_akurasi": round(float(laporan["accuracy"]), 4),
    "uji_f1_macro": round(float(laporan["macro avg"]["f1-score"]), 4),
    "uji_recall_high": round(float(laporan["High"]["recall"]), 4),
    "threshold_cv_data_latih": tabel_threshold,
    "catatan": "Label di dataset ini tampak dibangkitkan dari aturan ambang pada attendance_rate dan GPA, "
               "sehingga skor mendekati sempurna tidak membuktikan performa di data nyata. Validasi dengan data riil sebelum dipakai untuk keputusan.",
}
with open(os.path.join(HERE, "metrik.json"), "w", encoding="utf-8") as f:
    json.dump(metrik, f, indent=2, ensure_ascii=False)
print(json.dumps(metrik, indent=2, ensure_ascii=False))
print("Model disimpan:", OUT, "| sklearn", sklearn.__version__)
