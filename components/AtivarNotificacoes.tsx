"use client";

import { useEffect, useState } from "react";
import { salvarInscricaoPush, removerInscricaoPush } from "@/app/perfil/actions";

type Status = "carregando" | "nao_suportado" | "ativo" | "inativo";

function paraUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const dados = atob(base64);
  return Uint8Array.from([...dados].map((c) => c.charCodeAt(0)));
}

export function AtivarNotificacoes({ chavePublica }: { chavePublica?: string }) {
  const [status, setStatus] = useState<Status>("carregando");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function checar() {
      if (!chavePublica || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("nao_suportado");
        return;
      }
      const registro = await navigator.serviceWorker.register("/sw.js");
      const inscricao = await registro.pushManager.getSubscription();
      setStatus(inscricao ? "ativo" : "inativo");
    }
    checar().catch(() => setStatus("nao_suportado"));
  }, [chavePublica]);

  async function ativar() {
    if (!chavePublica) return;
    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setStatus("inativo");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: paraUint8Array(chavePublica),
      });
      const json = inscricao.toJSON();
      await salvarInscricaoPush({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      });
      setStatus("ativo");
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setCarregando(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (inscricao) {
        await removerInscricaoPush(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setStatus("inativo");
    } finally {
      setCarregando(false);
    }
  }

  if (status === "carregando") return null;

  if (status === "nao_suportado") {
    return (
      <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", maxWidth: 320, margin: "0 auto" }}>
        Esse navegador não suporta notificações. No iPhone, primeiro adicione o app à Tela de Início
        (compartilhar → Adicionar à Tela de Início) e abra por lá.
      </p>
    );
  }

  return (
    <button onClick={status === "ativo" ? desativar : ativar} disabled={carregando} style={botao}>
      {status === "ativo" ? "Desativar lembrete diário" : "Ativar lembrete diário"}
    </button>
  );
}

const botao: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
};
