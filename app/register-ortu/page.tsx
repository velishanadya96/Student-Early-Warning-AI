import RegisterOrtuForm from "@/components/auth/RegisterOrtuForm";
import AuthShell from "@/components/auth/AuthShell";

export default function RegisterOrtuPage() {
  return (
    <AuthShell roleSwitch={{ mode: "register", role: "ortu" }} title="Daftar orang tua" subtitle="Verifikasi dengan NIM dan email mahasiswa (anak Anda)." wide>
      <RegisterOrtuForm />
    </AuthShell>
  );
}
