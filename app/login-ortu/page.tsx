import LoginOrtuForm from "@/components/auth/LoginOrtuForm";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginOrtuPage() {
  return (
    <AuthShell roleSwitch={{ mode: "login", role: "ortu" }} title="Masuk orang tua" subtitle="Masukkan NIM dan email mahasiswa, lalu password akun orang tua.">
      <LoginOrtuForm />
    </AuthShell>
  );
}
