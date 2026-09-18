"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SairBotao() {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid var(--cor-borda)",
        background: "none",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--cor-acento)",
        cursor: "pointer",
      }}
    >
      Sair da conta
    </button>
  );
}
