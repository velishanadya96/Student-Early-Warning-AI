import RegisterForm from "@/components/auth/RegisterForm";
import AuthShell from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell roleSwitch={{ mode: "register", role: "staf" }} title="Buat akun mahasiswa" subtitle="Daftar dengan akun Google dan NIM kamu." wide>
      <RegisterForm />
    </AuthShell>
  );
}
