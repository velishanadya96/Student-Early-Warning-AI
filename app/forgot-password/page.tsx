import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password | Student Early Warning AI",
  robots: { index: false },
};

export default function Page() {
  return (
    <AuthCard title="Lupa password?" subtitle="Masukkan email akunmu. Kami kirim tautan untuk membuat password baru.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
