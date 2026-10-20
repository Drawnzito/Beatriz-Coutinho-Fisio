"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarIndicacao } from "@/app/perfil/actions";

export function IndicarAmiga({ comecarAberto = false }: { comecarAberto?: boolean }) {
  // Quem chega pelo destaque já clicou uma vez: abrir o formulário fechado
  // obrigaria a clicar de novo pra fazer a mesma coisa.
  const [aberto, setAberto] = useState(comecarAberto);

  // O "enviado" vem da resposta do servidor, não do clique: antes era um
  // useState ligado no onSubmit, então o agradecimento aparecia na hora e
  // continuava aparecendo mesmo quando a gravação falhava.
  const [estado, enviar] = useFormState(criarIndicacao, null);
  const enviado = estado?.ok === true;

  return (
    <div
      style={{
        textAlign: "left",
        padding: 16,
        borderRadius: 14,
        background: "linear-gradient(135deg, var(--cor-primaria-escura), var(--cor-primaria))",
        color: "#fff",
      }}
    >
      <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 16 }}>Indique uma amiga 💛</strong>
      <p style={{ margin: "6px 0 12px", fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
        Indique alguém pra fisioterapia pélvica domiciliar e ela ganha <strong>50% na primeira sessão</strong>.
        Válido só pra atendimento domiciliar.
      </p>

      {enviado ? (
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Indicação enviada! Obrigada 🙏</p>
      ) : !aberto ? (
        <button type="button" onClick={() => setAberto(true)} style={botaoAbrir}>
          Indicar uma amiga
        </button>
      ) : (
        /* Sem indicador global: este formulário não redireciona (o resultado
           volta pelo useFormState), e o véu de "Salvando…" só se desfaz na
           troca de URL — ficaria na tela até a trava de 12s. O próprio botão
           mostra o progresso. */
        <form action={enviar} data-sem-indicador="1" style={{ display: "grid", gap: 8 }}>
          <input name="nome_indicada" placeholder="Nome da amiga" required style={campo} />
          <input name="contato_indicada" placeholder="WhatsApp ou email dela" required style={campo} />

          {estado && !estado.ok && (
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#ffe3e3" }}>{estado.erro}</p>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <BotaoEnviar />
            <button type="button" onClick={() => setAberto(false)} style={botaoCancelar}>cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Precisa ser um componente separado: useFormStatus só lê o form acima dele. */
function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ ...botaoEnviar, opacity: pending ? 0.7 : 1 }}>
      {pending ? "Enviando…" : "Enviar indicação"}
    </button>
  );
}

const campo: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.4)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontSize: 13.5,
  fontFamily: "var(--fonte-corpo)",
};

const botaoAbrir: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const botaoEnviar: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "none",
  background: "#fff",
  color: "var(--cor-primaria-escura)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const botaoCancelar: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.8)",
  fontSize: 12.5,
  cursor: "pointer",
};
