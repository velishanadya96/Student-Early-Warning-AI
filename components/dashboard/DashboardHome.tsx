import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import DashboardRiskTable from "./DashboardRiskTable";
import DashboardStats from "./DashboardStats";

export default function DashboardHome() {
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Dosen PA</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard Risiko Akademik</h1>
          <p className="mt-1 text-sm text-slate-500">Pantau kondisi mahasiswa bimbingan berdasarkan hasil risk scoring.</p>
        </div>
        <Badge variant="neutral">Update: {today}</Badge>
      </div>

      <DashboardStats />

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Mahasiswa yang Perlu Perhatian</h2>
          <p className="text-sm text-slate-500">Prioritas berdasarkan kategori risiko.</p>
        </div>
        <DashboardRiskTable />
      </Card>
    </section>
  );
}
