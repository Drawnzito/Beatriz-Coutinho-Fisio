import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { TiraSemana } from "@/components/TiraSemana";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { semanaAtual } from "@/lib/semana";
import { hojeIsoBrasil } from "@/lib/dataBrasil";
import { rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";

export const dynamic = "force-dynamic";

function rotuloData(iso: string, hojeIso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const dataUtc = Date.UTC(ano, mes - 1, dia);
  const [anoH, mesH, diaH] = hojeIso.split("-").map(Number);
  const hojeUtc = Date.UTC(anoH, mesH - 1, diaH);
  const diffDias = Math.round((dataUtc - hojeUtc) / 86400000);

  if (diffDias === 0) return "Hoje";
  if (diffDias === -1) return "Ontem";
  if (diffDias === 1) return "Amanhã";

  return new Date(dataUtc).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
}

export default async function InicioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel")
    .eq("id", user.id)
    .single();

  const vendoComoPaciente = perfil?.papel === "admin" && cookies().get("ver_como_paciente")?.value === "1";
  const ehAdmin = perfil?.papel === "admin" && !vendoComoPaciente;

  const dias = semanaAtual();
  const inicioSemana = dias[0].iso;
  const fimSemana = dias[6].iso;
  const hojeIso = hojeIsoBrasil();

  let consultaSemana = supabase
    .from("sessoes")
    .select(
      "id, data, hora, status, tipo, observacoes, perfis(nome, email), planos(id, titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*)))"
    )
    .gte("data", inicioSemana)
    .lte("data", fimSemana)
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
  if (!ehAdmin) consultaSemana = consultaSemana.eq("paciente_id", user.id);

  let consultaOutras = supabase
    .from("sessoes")
    .select("id, data, hora, tipo, perfis(nome, email), planos(titulo)")
    .or(`data.lt.${inicioSemana},data.gt.${fimSemana}`)
    .order("data", { ascending: false })
    .limit(8);
  if (!ehAdmin) consultaOutras = consultaOutras.eq("paciente_id", user.id);

  const [{ data: avisos }, { data: sessoesSemana }, { data: outrasSessoes }] = await Promise.all([
    supabase
      .from("avisos")
      .select("*")
      .eq("ativo", true)
      .or(`validade.is.null,validade.gte.${hojeIso}`)
      .order("criado_em", { ascending: false }),
    consultaSemana,
    consultaOutras,
  ]);

  const contagens: Record<string, number> = {};
  for (const s of sessoesSemana ?? []) {
    contagens[s.data] = (contagens[s.data] ?? 0) + 1;
  }

  const gruposSemana = new Map<string, { itens: any[] }>();
  for (const s of (sessoesSemana ?? []) as any[]) {
    if (!gruposSemana.has(s.data)) gruposSemana.set(s.data, { itens: [] });
    gruposSemana.get(s.data)!.itens.push(s);
  }
  const gruposSemanaOrdenados = [...gruposSemana.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const hrefsSemana = Object.fromEntries(
    dias.map((d) => [d.iso, contagens[d.iso] ? `#dia-${d.iso}` : undefined])
  );

  const totalSemana = sessoesSemana?.length ?? 0;

  return (
    <>
      <Header
        titulo={`Olá, ${perfil?.nome?.split(" ")[0] || "por aqui"}`}
        subtitulo="Beatriz Coutinho Fisioterapia"
        avatarUrl={user.user_metadata?.avatar_url}
      />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 100px" }}>
        {/* ---------- Mural de avisos ---------- */}
        <h2 style={tituloSecao}>Mural de avisos</h2>

        {(!avisos || avisos.length === 0) && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nenhum aviso publicado no momento.
          </p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {(avisos ?? []).map((a) => (
            <div key={a.id} style={avisoCartao}>
              <strong style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria-escura)", fontSize: 14.5 }}>
                {a.titulo}
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: 14 }}>{a.conteudo}</p>
            </div>
          ))}
        </div>

        {/* ---------- Sua semana ---------- */}
        <h2 style={{ ...tituloSecao, marginTop: 36 }}>{ehAdmin ? "Pacientes desta semana" : "Sua semana"}</h2>

        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
          {totalSemana === 0
            ? "Nenhuma sessão agendada essa semana."
            : ehAdmin
            ? `${totalSemana} sessão${totalSemana > 1 ? "ões" : ""} de pacientes essa semana.`
            : `Você tem ${totalSemana} sessão${totalSemana > 1 ? "ões" : ""} agendada${totalSemana > 1 ? "s" : ""} essa semana.`}
        </p>

        <TiraSemana dias={dias} hrefs={hrefsSemana} contagens={contagens} />

        <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
          {gruposSemanaOrdenados.map(([iso, { itens }]) => (
            <div key={iso} id={`dia-${iso}`} style={{ scrollMarginTop: 90 }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--cor-texto-suave)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {rotuloData(iso, hojeIso)}
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                {itens.map((item) => (
                  <div key={item.id} style={sessaoCartao}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: corTipoSessao(item.tipo),
                          flexShrink: 0,
                        }}
                      />
                      <strong style={{ color: "var(--cor-primaria)", fontSize: 13 }}>
                        {ehAdmin && (item.perfis?.nome || item.perfis?.email) ? `${item.perfis.nome || item.perfis.email} · ` : ""}
                        {rotuloTipoSessao(item.tipo)}
                        {item.hora ? ` · ${item.hora.slice(0, 5)}` : ""}
                      </strong>
                    </div>

                    {item.observacoes && (
                      <p style={{ margin: "6px 0 0", fontSize: 14 }}>{item.observacoes}</p>
                    )}

                    {item.planos && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                            Plano: {item.planos.titulo}
                          </p>
                          {!ehAdmin && (item.planos.plano_exercicios ?? []).length > 0 && (
                            <Link
                              href={`/treino/${item.planos.id}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#fff",
                                background: "var(--cor-primaria)",
                                padding: "5px 10px",
                                borderRadius: 999,
                                textDecoration: "none",
                              }}
                            >
                              ▶ Iniciar
                            </Link>
                          )}
                        </div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {(item.planos.plano_exercicios ?? [])
                            .sort((a: any, b: any) => a.ordem - b.ordem)
                            .map((pe: any) => {
                              const ex = pe.exercicios;
                              return (
                                <div key={pe.id} style={exercicioMiniCartao}>
                                  <strong style={{ fontSize: 13 }}>{ex.titulo}</strong>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--cor-texto-suave)" }}>
                                    {pe.series ?? ex.series_padrao ?? "-"} séries ×{" "}
                                    {pe.repeticoes ?? ex.repeticoes_padrao ?? "-"} repetições
                                  </p>
                                  {ex.video_url && (
                                    <div style={{ marginTop: 6 }}>
                                      <MidiaExercicio url={ex.video_url} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Outras sessões (fora da semana atual) ---------- */}
        {outrasSessoes && outrasSessoes.length > 0 && (
          <>
            <h2 style={{ ...tituloSecao, marginTop: 36 }}>Outras sessões</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {outrasSessoes.map((s: any) => (
                <div key={s.id} style={{ ...sessaoCartao, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <strong>{new Date(`${s.data}T00:00:00`).toLocaleDateString("pt-BR")}</strong>
                    {s.hora ? ` às ${s.hora.slice(0, 5)}` : ""} · {rotuloTipoSessao(s.tipo)}
                    {ehAdmin && (s.perfis?.nome || s.perfis?.email) ? ` · ${s.perfis.nome || s.perfis.email}` : ""}
                    {s.planos?.titulo ? ` · ${s.planos.titulo}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav papel={ehAdmin ? "admin" : "paciente"} />
    </>
  );
}

const tituloSecao: React.CSSProperties = {
  fontFamily: "var(--fonte-titulo)",
  color: "var(--cor-primaria)",
  fontSize: 18,
  marginBottom: 14,
};

const avisoCartao: React.CSSProperties = {
  background: "var(--cor-acento-suave)",
  borderRadius: "0 12px 12px 0",
  borderLeft: "3px solid var(--cor-acento)",
  padding: "12px 16px",
};

const sessaoCartao: React.CSSProperties = {
  background: "var(--cor-superficie)",
  border: "1px solid var(--cor-borda)",
  borderRadius: 10,
  padding: "12px 14px",
};

const exercicioMiniCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--cor-fundo)",
};
