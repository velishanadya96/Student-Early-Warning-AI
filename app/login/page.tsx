import LoginForm from "@/components/auth/LoginForm";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell roleSwitch={{ mode: "login", role: "staf" }} title="Masuk ke sistem" subtitle="Masuk dengan email dan password, atau dengan akun Google yang sudah terdaftar.">
      <LoginForm />
    </AuthShell>
  );
}
