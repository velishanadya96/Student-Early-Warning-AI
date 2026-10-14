"use client";

import { useEffect, useRef, useState } from "react";
import { renderGoogleButton } from "@/lib/google";

/** Tombol resmi Google. onCredential menerima ID token Google (dikirim ke backend untuk diverifikasi). */
export default function GoogleButton({ clientId, onCredential, text = "signin_with" }: {
  clientId: string; onCredential: (credential: string) => void; text?: "signin_with" | "signup_with";
}) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!box.current) return;
    renderGoogleButton(box.current, clientId, (c) => cb.current(c), text).catch((e) => setError(e instanceof Error ? e.message : "Tombol Google gagal dimuat."));
  }, [clientId, text]);

  return (
    <div>
      <div ref={box} className="flex min-h-[44px] justify-center" aria-label="Tombol Google" />
      {error && <p role="alert" className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
