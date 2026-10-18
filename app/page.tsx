import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Database, FileBarChart, GraduationCap, HeartHandshake, MessageCircle, UsersRound } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Radar } from "@/components/ui/Radar";
import { CountUp, RevealRoot, Ticker } from "@/components/landing/LandingEffects";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Student Early Warning AI | Peringatan dini risiko akademik",
  description: "Sistem peringatan dini risiko akademik mahasiswa: skor risiko 0 sampai 1 beserta penyebabnya, dan kabar ke orang tua lewat WhatsApp.",
};

const KATA = ["jarang hadir", "nilainya turun", "tugasnya telat", "IPK-nya anjlok"];
const MARQUEE = ["IPK", "Rata-rata nilai", "Kehadiran", "Tugas", "Random Forest", "WhatsApp"];

const ROLES = [
  { icon: UsersRound, nama: "Dosen PA", teks: "Radar dan daftar prioritas mahasiswa bimbingan, lengkap dengan penyebab risikonya dan tombol kirim WhatsApp ke orang tua.", href: "/login" },
  { icon: GraduationCap, nama: "Mahasiswa", teks: "Skor risiko, faktor penyebabnya, dan langkah yang bisa dilakukan minggu ini.", href: "/login" },
  { icon: HeartHandshake, nama: "Orang tua", teks: "Kondisi akademik anak dan pesan peringatan lewat WhatsApp, tanpa menunggu nilai keluar.", href: "/login-ortu" },
  { icon: FileBarChart, nama: "Kaprodi", teks: "Ringkasan risiko per angkatan, penyebab terbanyak, dan laporan Excel atau PDF untuk prodi.", href: "/login" },
  { icon: Database, nama: "Admin", teks: "Impor CSV nilai, presensi, dan tugas, hitung ulang risiko, lalu kelola pengguna.", href: "/login" },
];

const CSV = [["V3924001", "3.64", "96%", "12/12"], ["V3924002", "3.12", "88%", "11/12"], ["V3924003", "2.31", "62%", "7/12", "bad"], ["V3924004", "2.89", "78%", "10/12"], ["V3924005", "2.48", "71%", "8/12"]];
const BARS: [string, number, string][] = [["Kehadiran", 62, "62%"], ["IPK", 58, "2.31"], ["Tugas", 58, "7/12"], ["Rata-rata nilai", 61, "61"]];
const RADAR = ["high", "high", "medium", "medium", "low", "low", "low", "medium", "low", "low"] as const;

function Mark() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5 19 19M5 19l3.5-3.5M15.5 8.5 19 5" /></svg>;
}

export default function Home() {
  return (
    <main className="lp min-h-screen">
      <header className="nav">
        <div className="wrap nav-in">
          <Link href="/" className="logo" aria-label="Student Early Warning AI"><Mark />Student Early Warning</Link>
          <nav className="lk" aria-label="Navigasi landing page"><a href="#cara-kerja">Cara kerja</a><a href="#peran">Peran</a><a href="#mulai">Mulai</a></nav>
          <div className="rt">
            <ThemeToggle />
            <Link href="/login" className="btn btn-g sm">Masuk</Link>
            <Link href="/register" className="btn btn-p sm">Daftar</Link>
          </div>
        </div>
      </header>

      <div className="wrap">
        <section className="b-hero">
          <p className="eyebrow">Student Early Warning AI</p>
          <h1 className="b-h1">
            <span className="ln"><span style={{ "--i": 0 } as React.CSSProperties}>Mahasiswa yang</span></span>
            <span className="ln"><span style={{ "--i": 1 } as React.CSSProperties}><Ticker words={KATA} /></span></span>
            <span className="ln"><span style={{ "--i": 2 } as React.CSSProperties}>terlihat lebih awal.</span></span>
          </h1>
          <div className="b-meta">
            <div>
              <p className="lead rv">Sistem membaca IPK, rata-rata nilai, kehadiran, dan tugas, lalu memberi skor risiko 0 sampai 1. Dosen PA dan orang tua dikabari lewat WhatsApp sebelum masalahnya membesar.</p>
              <div className="cta rv" style={{ "--d": "140ms" } as React.CSSProperties}>
                <Link href="/register" className="btn btn-p">Mulai sekarang<ArrowRight /></Link>
                <a href="#cara-kerja" className="btn btn-g">Lihat cara kerjanya</a>
              </div>
            </div>
            <div className="b-score inv rv" style={{ "--d": "200ms" } as React.CSSProperties}>
              <div className="top"><span className="pill">Risiko tinggi</span><small>Contoh: Citra Lestari · NIM V3924003</small></div>
              <div className="big"><CountUp to={0.82} decimals={2} /></div>
              <div className="trk" aria-hidden="true"><i style={{ width: "82%" }} /></div>
              <small>Kehadiran 62% · IPK 2.31 · tugas 7 dari 12</small>
            </div>
          </div>
        </section>
      </div>

      <div className="mq" aria-hidden="true"><div className="mq-t">{[0, 1].map((k) => MARQUEE.map((w) => <span key={`${k}-${w}`}>{w}</span>))}</div></div>

      <div className="wrap">
        <div className="b-sec-h" id="cara-kerja"><p className="eyebrow">Empat langkah</p><h2 className="rv">Dari file CSV sampai pesan WhatsApp.</h2></div>
        <div className="b-stack">
          <article className="sc" style={{ "--k": 0 } as React.CSSProperties}>
            <div><div className="no" aria-hidden="true">1</div><h3>Impor data</h3><p>Admin mengunggah CSV nilai, presensi, dan tugas. Baris yang bermasalah dilewati dan dicatat di riwayat impor.</p></div>
            <div className="vis"><div className="vcsv" aria-hidden="true"><div className="hd"><span>NIM</span><span>IPK</span><span>Hadir</span><span>Tugas</span></div>{CSV.map((r, n) => <div key={r[0]} className={`rw ${r[4] ?? ""}`} style={{ "--n": n } as React.CSSProperties}><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><span>{r[3]}</span></div>)}</div></div>
          </article>
          <article className="sc inv" style={{ "--k": 1 } as React.CSSProperties}>
            <div><div className="no" aria-hidden="true">2</div><h3>Hitung risiko</h3><p>Model Random Forest memberi skor 0 sampai 1 dari empat faktor, lalu menandainya tinggi, sedang, atau rendah.</p></div>
            <div className="vis" aria-hidden="true">
              <div className="vg"><svg viewBox="0 0 200 108"><path className="t" pathLength="100" d="M20 100A80 80 0 0 1 180 100" /><path className="v" pathLength="100" d="M20 100A80 80 0 0 1 180 100" /></svg><b>0.82</b></div>
              <div className="vbars">{BARS.map(([l, p, v]) => <div key={l}><span>{l}</span><span className="tr"><i style={{ "--w": `${p}%` } as React.CSSProperties} /></span><span>{v}</span></div>)}</div>
            </div>
          </article>
          <article className="sc" style={{ "--k": 2 } as React.CSSProperties}>
            <div><div className="no" aria-hidden="true">3</div><h3>Tindak lanjut</h3><p>Dosen PA melihat radar dan daftar prioritas. Mahasiswa berisiko tinggi muncul paling atas.</p></div>
            <div className="vis" aria-hidden="true"><div className="vlist"><div className="rd"><Radar levels={[...RADAR]} /></div>{[["CL", "Citra Lestari", "0.82"], ["EP", "Eka Pratama", "0.77"]].map(([a, n, s]) => <div key={a} className="it"><span className="av">{a}</span>{n}<em>{s}</em></div>)}</div></div>
          </article>
          <article className="sc inv" style={{ "--k": 3 } as React.CSSProperties}>
            <div><div className="no" aria-hidden="true">4</div><h3>Kabari orang tua</h3><p>Pesan WhatsApp sudah tersusun. Dosen PA tinggal menekan kirim, dengan mode manual, Fonnte, atau log.</p></div>
            <div className="vis" aria-hidden="true"><div className="vwa"><small><i />WhatsApp · Fonnte</small>Peringatan Akademik. Risiko Citra Lestari saat ini TINGGI (skor 0.82). Penyebab utama: kehadiran 62%.<div className="f"><span>14.02</span><span>Terkirim</span></div></div></div>
          </article>
        </div>

        <div className="b-stats">
          <div className="rv"><b><CountUp to={4} /></b><span>faktor risiko</span><small>IPK, nilai, kehadiran, tugas</small></div>
          <div className="rv" style={{ "--d": "120ms" } as React.CSSProperties}><b><CountUp to={5} /></b><span>peran pengguna</span><small>satu sistem untuk semua</small></div>
          <div className="rv" style={{ "--d": "240ms" } as React.CSSProperties}><b><CountUp to={3} /></b><span>mode WhatsApp</span><small>manual, Fonnte, log</small></div>
        </div>

        <div className="b-sec-h" id="peran"><p className="eyebrow">Untuk siapa</p><h2 className="rv">Lima peran, satu tampilan masing-masing.</h2></div>
        <div className="b-roles">
          {ROLES.map(({ icon: Icon, nama, teks, href }) => (
            <Link key={nama} href={href} className="br" aria-label={`Masuk sebagai ${nama}`}>
              <span className="ico"><Icon /></span><h3>{nama}</h3><p>{teks}</p><span className="go"><ArrowUpRight /></span>
            </Link>
          ))}
        </div>

        <section className="b-cta inv" id="mulai">
          <h2 className="rv">Mulai dari satu file CSV.</h2>
          <div className="row">
            <p className="rv">Unggah data semester ini dan lihat siapa yang butuh perhatian hari ini.</p>
            <div className="cta rv"><Link href="/register" className="btn btn-p">Daftar sekarang<ArrowRight /></Link><Link href="/login" className="btn btn-g">Masuk</Link></div>
          </div>
        </section>
        <footer className="ft"><span>© 2026 Student Early Warning AI</span><span>Proyek D3 Teknik Informatika · Manajemen Proyek</span></footer>
      </div>
      <RevealRoot />
    </main>
  );
}
