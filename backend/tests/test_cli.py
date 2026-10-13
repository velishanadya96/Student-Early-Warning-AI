from app.models import User
from app.security import check_password


def run(app, args, input_text):
    return app.test_cli_runner().invoke(args=args, input=input_text)


def test_create_admin_membuat_admin_terverifikasi(app):
    result = run(app, ["create-admin", "--email", "baru@student.uns.ac.id", "--name", "Admin Baru"], "Rahasia-12345\nRahasia-12345\n")
    assert result.exit_code == 0, result.output
    user = User.query.filter_by(email="baru@student.uns.ac.id").first()
    assert user.role == "admin" and user.email_verified_at is not None
    assert check_password("Rahasia-12345", user.password_hash)


def test_create_admin_menolak_email_non_sso_password_pendek_dan_duplikat(app):
    assert run(app, ["create-admin", "--email", "x@gmail.com", "--name", "Admin X"], "Rahasia-12345\nRahasia-12345\n").exit_code != 0
    assert run(app, ["create-admin", "--email", "y@student.uns.ac.id", "--name", "Admin Y"], "pendek\npendek\n").exit_code != 0
    dup = run(app, ["create-admin", "--email", "admin@student.uns.ac.id", "--name", "Dobel"], "Rahasia-12345\nRahasia-12345\n")
    assert dup.exit_code != 0 and "sudah terdaftar" in dup.output
