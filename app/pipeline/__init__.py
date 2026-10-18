from flask import Blueprint

import_bp = Blueprint("import_data", __name__)
risk_bp = Blueprint("risk", __name__)
dashboard_bp = Blueprint("dashboard", __name__)
catatan_bp = Blueprint("catatan", __name__)
laporan_bp = Blueprint("laporan", __name__)
notifikasi_bp = Blueprint("notifikasi", __name__)

from . import impor_routes, risk_routes, dashboard_routes, catatan_routes, laporan_routes, notifikasi_routes  # noqa: E402,F401
