import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    # Debugger Werkzeug hanya untuk development dan hanya di localhost (debugger terbuka = eksekusi kode jarak jauh).
    debug = app.config["APP_ENV"] == "development"
    app.run(host=os.getenv("FLASK_RUN_HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=debug)
