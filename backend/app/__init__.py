import logging
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config, validate_config
from .extensions import db, migrate, jwt, limiter
from .errors import register_error_handlers


def create_app(config_overrides=None):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)
    validate_config(app.config)
    if app.config["TRUSTED_PROXIES"]:
        from werkzeug.middleware.proxy_fix import ProxyFix

        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=app.config["TRUSTED_PROXIES"])

    CORS(app, origins=app.config["CORS_ORIGINS"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    register_error_handlers(app, jwt)

    from . import models  # noqa: F401  (daftarkan semua tabel)

    @jwt.token_in_blocklist_loader
    def _is_revoked(_header, payload):
        return models.RevokedToken.query.filter_by(jti=payload["jti"]).first() is not None

    from .auth import auth_bp
    from .users import users_bp

    from .cli import register_cli

    register_cli(app)
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")

    @app.get("/api/v1/health")
    def health():
        return jsonify(status="ok")

    return app
