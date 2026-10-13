"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="p-8">
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <h2 className="font-bold">Terjadi kesalahan</h2>
        <p className="mt-1 text-sm">Data mahasiswa tidak dapat ditampilkan.</p>
        <button type="button" onClick={() => reset()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
          Coba lagi
        </button>
      </div>
    </main>
  );
}
