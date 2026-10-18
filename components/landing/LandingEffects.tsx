"use client";

import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Kata yang berganti otomatis di headline. Tanpa JavaScript, kata pertama tetap terbaca. */
export function Ticker({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [snap, setSnap] = useState(false);
  const list = [...words, words[0] ?? ""];

  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => { setSnap(false); setI((v) => v + 1); }, 2300);
    return () => clearInterval(t);
  }, []);

  // Setelah sampai kata terakhir (= kata pertama lagi), lompat ke awal tanpa animasi.
  useEffect(() => {
    if (i !== words.length) return;
    const t = setTimeout(() => { setSnap(true); setI(0); }, 900);
    return () => clearTimeout(t);
  }, [i, words.length]);

  return (
    <span className="tk" aria-label={words[0]}>
      <span className={`tk-in ${snap ? "snap" : ""}`} style={{ transform: `translateY(calc(${i} * -1.06em))` }} aria-hidden="true">
        {list.map((w, k) => <span key={k}>{w}</span>)}
      </span>
    </span>
  );
}

/** Angka yang menghitung naik saat terlihat. Nilai akhir sudah tertulis sejak awal (aman tanpa JS). */
export function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const run = () => {
      const t0 = performance.now(), d = 1100;
      const f = (t: number) => {
        const k = Math.min(1, (t - t0) / d), v = to * (1 - Math.pow(1 - k, 3));
        el.textContent = v.toFixed(decimals);
        if (k < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, decimals]);
  return <span ref={ref}>{to.toFixed(decimals)}</span>;
}

/** Elemen ".rv" yang ada di bawah layar baru muncul (naik pelan) saat di-scroll. Yang sudah terlihat tidak disentuh. */
export function RevealRoot() {
  useEffect(() => {
    if (reduced()) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lp .rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.95) { el.classList.add("pre"); io.observe(el); }
    });
    return () => io.disconnect();
  }, []);
  return null;
}
