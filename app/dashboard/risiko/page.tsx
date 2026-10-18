import type { Metadata } from "next";
import RiskPage from "@/components/risk/RiskPage";

export const metadata: Metadata = {
  title: "Skor Risiko | Student Early Warning AI",
};

export default function RisikoPage() {
  return <RiskPage />;
}