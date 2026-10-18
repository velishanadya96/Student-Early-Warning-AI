from flask import request, jsonify

from . import import_bp
from .common import periode_valid
from .. import impor
from ..errors import ApiError
from ..security import roles_required


def _file():
    f = request.files.get("file")
    if not f or not f.filename:
        raise ApiError("VALIDASI_GAGAL", "Pilih file .csv atau .xlsx pada field 'file'.", 422)
    return f


@import_bp.post("/akademik")
@roles_required("admin")
def impor_akademik():
    """Nilai + presensi per mata kuliah (FR-02). Form-data: file, periode (mis. 2026-1)."""
    periode = periode_valid(request.form.get("periode"))
    return jsonify(impor.impor_akademik(_file(), periode)), 201


@import_bp.post("/tugas")
@roles_required("admin")
def impor_tugas():
    """Pengumpulan tugas (FR-03). Form-data: file, periode."""
    periode = periode_valid(request.form.get("periode"))
    return jsonify(impor.impor_tugas(_file(), periode)), 201


@import_bp.get("/format")
@roles_required("admin")
def format_impor():
    return jsonify(impor.KOLOM)
