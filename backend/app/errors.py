"""Format error konsisten (NFR-07): {"code": "...", "message": "..."} berbahasa Indonesia."""
from flask import jsonify


class ApiError(Exception):
    def __init__(self, code, message, status=400):
        self.code, self.message, self.status = code, message, status


def error_response(code, message, status):
    return jsonify(code=code, message=message), status


def register_error_handlers(app, jwt):
    @app.errorhandler(ApiError)
    def _api(e):
        return error_response(e.code, e.message, e.status)

    @app.errorhandler(404)
    def _404(_):
        return error_response("TIDAK_DITEMUKAN", "Endpoint tidak ditemukan.", 404)

    @app.errorhandler(405)
    def _405(_):
        return error_response("METODE_TIDAK_DIIZINKAN", "Metode HTTP tidak diizinkan.", 405)

    @app.errorhandler(429)
    def _429(_):
        return error_response("TERLALU_BANYAK_PERCOBAAN", "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", 429)

    @app.errorhandler(500)
    def _500(_):
        return error_response("KESALAHAN_SERVER", "Terjadi kesalahan pada server.", 500)

    @jwt.unauthorized_loader
    def _no_token(_):
        return error_response("TOKEN_TIDAK_ADA", "Silakan login terlebih dahulu.", 401)

    @jwt.invalid_token_loader
    def _bad_token(_):
        return error_response("TOKEN_TIDAK_VALID", "Token tidak valid. Silakan login ulang.", 401)

    @jwt.expired_token_loader
    def _expired(_h, _p):
        return error_response("TOKEN_KEDALUWARSA", "Sesi berakhir. Silakan login ulang.", 401)
