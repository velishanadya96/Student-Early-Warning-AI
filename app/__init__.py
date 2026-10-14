import logging
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .extensions import db, migrate, jwt, limiter
from .errors import register_error_handlers


def create_app(config_overrides=None):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    CORS(app, origins=app.config["CORS_ORIGINS"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    register_error_handlers(app, jwt)

    from . import models  # noqa: F401  (daftarkan semua tabel)
    from .auth import auth_bp
    from .users import users_bp
    from .kontak import kontak_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(kontak_bp, url_prefix="/api/v1/kontak")

    @app.get("/api/v1/health")
    def health():
        return jsonify(status="ok")

    return app
