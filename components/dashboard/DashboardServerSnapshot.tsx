import { AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { studentsDb } from "@/lib/mockDb";
import { calculateRisk } from "@/lib/risk";

/**
 * React Server Component used to demonstrate Streaming SSR.
 * It reads server-side data without adding a client bundle for this summary.
 */
export default async function DashboardServerSnapshot() {
  // Simulate a small server-side data preparation step so the Suspense boundary
  // can stream its fallback first, then reveal the result.
  await new Promise((resolve) => setTimeout(resolve, 120));

  const risks = studentsDb.map(calculateRisk);
  const high = risks.filter((risk) => risk.category === "Tinggi").length;
  const medium = risks.filter((risk) => risk.category === "Sedang").length;
  const low = risks.filter((risk) => risk.category === "Rendah").length;

  return (
    <Card className="mb-6 border-blue-100 bg-blue-50/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-lg bg-white p-2 shadow-sm">
              <Users size={18} className="text-blue-600" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-blue-700">Server Snapshot</p>
            <Badge variant="neutral">RSC</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Ringkasan awal dirender di server, sementara data interaktif dashboard
            dilanjutkan oleh TanStack Query di client.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-72">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <CheckCircle2 className="mx-auto mb-1 text-emerald-600" size={18} aria-hidden="true" />
            <p className="font-bold">{low}</p>
            <p className="text-slate-500">Rendah</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <span className="mx-auto mb-1 block text-base font-bold text-amber-600">{medium}</span>
            <p className="text-slate-500">Sedang</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <AlertTriangle className="mx-auto mb-1 text-red-600" size={18} aria-hidden="true" />
            <p className="font-bold">{high}</p>
            <p className="text-slate-500">Tinggi</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
