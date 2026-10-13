"""Perintah CLI Flask. Dipakai untuk membuat admin pertama di server tanpa menjalankan seed akun demo."""
import click
from pydantic import ValidationError

from .errors import ApiError
from .schemas import UserCreateIn
from .services import create_user_with_profile


def register_cli(app):
    @app.cli.command("create-admin")
    @click.option("--email", prompt=True, help="Email admin (harus @student.uns.ac.id).")
    @click.option("--name", prompt="Nama lengkap", help="Nama admin.")
    @click.password_option(help="Password (minimal 8 karakter); dibaca tersembunyi.")
    def create_admin(email, name, password):
        """Buat akun Admin yang langsung terverifikasi."""
        try:
            data = UserCreateIn.model_validate({"role": "admin", "name": name, "email": email, "password": password})
        except ValidationError as error:
            raise click.ClickException(error.errors()[0]["msg"].removeprefix("Value error, "))
        try:
            user = create_user_with_profile(role="admin", name=data.name, email=data.email, password=data.password, verified=True)
        except ApiError as error:
            raise click.ClickException(error.message)
        click.echo(f"Admin dibuat: {user.email}")
