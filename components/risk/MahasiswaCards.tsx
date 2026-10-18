import { Avatar, FaktorChips, KategoriBadge } from "@/components/risk/RiskParts";
import { pct } from "@/lib/dataApi";
import type { BarisMahasiswa } from "@/lib/types";

/** Daftar mahasiswa versi HP (pengganti tabel lebar). Tampil di bawah lebar md; tabel dipakai di layar besar. */
export function MahasiswaCards({ rows, extra, className = "" }: { rows: BarisMahasiswa[]; extra?: (m: BarisMahasiswa) => React.ReactNode; className?: string }) {
  return (
    <ul className={`space-y-2.5 md:hidden ${className}`}>
      {rows.map((m) => (
        <li key={m.nim} className="rounded-[20px] border border-slate-200 bg-white p-3.5">
          <div className="flex items-center gap-3">
            <Avatar nama={m.nama} high={m.kategori === "High"} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight">{m.nama}</p>
              <p className="truncate text-xs text-slate-500">NIM {m.nim}{m.fitur.attendance_rate != null ? ` · hadir ${pct(m.fitur.attendance_rate)}` : ""}</p>
            </div>
            <div className="grid shrink-0 justify-items-end gap-1">
              <span className="text-lg font-extrabold leading-none tabular-nums">{m.skor === null ? "-" : m.skor.toFixed(2)}</span>
              <KategoriBadge kategori={m.kategori} />
            </div>
          </div>
          {m.faktor.length > 0 && <div className="mt-2.5"><FaktorChips faktor={m.faktor} /></div>}
          {extra?.(m)}
        </li>
      ))}
    </ul>
  );
}
