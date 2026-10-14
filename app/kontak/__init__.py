from flask import Blueprint

kontak_bp = Blueprint("kontak", __name__)

from . import routes  # noqa: E402,F401
