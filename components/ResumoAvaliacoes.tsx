type Avaliacao = {
  nota_1: number;
  nota_2: number;
  nota_3: number;
  comentario: string | null;
  criado_em: string;
  perfis?: { nome: string | null; email: string | null } | null;
};

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function Estrelas({ valor }: { valor: number }) {
  return (
    <span style={{ color: "var(--cor-acento)", fontSize: 14, letterSpacing: 1 }}>
      {"★".repeat(Math.round(valor))}
      <span style={{ color: "var(--cor-borda)" }}>{"★".repeat(5 - Math.round(valor))}</span>
      <span style={{ color: "var(--cor-texto-suave)", fontSize: 12, marginLeft: 4 }}>
        {valor ? valor.toFixed(1) : "—"}
      </span>
    </span>
  );
}

export function ResumoAvaliacoes({
  titulo,
  perguntas,
  itens,
}: {
  titulo: string;
  perguntas: string[];
  itens: Avaliacao[];
}) {
  const geral = media(itens.flatMap((a) => [a.nota_1, a.nota_2, a.nota_3]));
  const porPergunta = [
    media(itens.map((a) => a.nota_1)),
    media(itens.map((a) => a.nota_2)),
    media(itens.map((a) => a.nota_3)),
  ];
  const comentarios = itens.filter((a) => a.comentario);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <strong style={{ fontSize: 15, fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria)" }}>{titulo}</strong>
        <span style={{ fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
          {itens.length} avaliaç{itens.length === 1 ? "ão" : "ões"}
        </span>
      </div>

      {itens.length === 0 ? (
        <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>Nenhuma avaliação recebida ainda.</p>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <Estrelas valor={geral} />
          </div>

          <div style={{ display: "grid", gap: 6, marginBottom: 18 }}>
            {perguntas.map((pergunta, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
                <span style={{ color: "var(--cor-texto-suave)" }}>{pergunta}</span>
                <Estrelas valor={porPergunta[i]} />
              </div>
            ))}
          </div>

          {comentarios.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {comentarios.slice(0, 10).map((a, i) => (
                <div
                  key={i}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--cor-borda)", background: "var(--cor-superficie)" }}
                >
                  <p style={{ margin: 0, fontSize: 13 }}>{a.comentario}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
                    {a.perfis?.nome || a.perfis?.email || "Paciente"} · {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
