import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Student Early Warning AI",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  return (
    <AuthCard title="Buat Password Baru" subtitle="Masukkan password baru untuk akunmu.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
