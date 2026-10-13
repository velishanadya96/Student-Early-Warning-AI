import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";
import VerifyEmailPanel from "@/components/auth/VerifyEmailPanel";

export const metadata: Metadata = {
  title: "Verifikasi Email | Student Early Warning AI",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  return (
    <AuthCard title="Verifikasi Email" subtitle="Memeriksa tautan verifikasi dari email kamu.">
      <VerifyEmailPanel token={token} />
    </AuthCard>
  );
}
