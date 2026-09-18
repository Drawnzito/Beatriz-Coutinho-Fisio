"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Feedback({ mensagem }: { mensagem?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!mensagem) return;
    setVisivel(true);
    const escondeTimer = setTimeout(() => setVisivel(false), 2600);
    const limpaTimer = setTimeout(() => router.replace(pathname, { scroll: false }), 3000);
    return () => {
      clearTimeout(escondeTimer);
      clearTimeout(limpaTimer);
    };
  }, [mensagem, pathname, router]);

  if (!mensagem) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: visivel ? 16 : -60,
        left: "50%",
        transform: "translateX(-50%)",
        transition: "top 0.35s ease",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 999,
        background: "var(--cor-primaria)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(31, 92, 87, 0.28)",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
        <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {mensagem}
    </div>
  );
}
