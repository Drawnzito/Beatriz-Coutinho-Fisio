import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { AcentoArabesque } from "@/components/Acentos";
import { AtivarNotificacoes } from "@/components/AtivarNotificacoes";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SairBotao } from "./SairBotao";
import { InfoContatoClinica } from "@/components/InfoContatoClinica";
import {
  ativarVisaoPaciente,
  desativarVisaoPaciente,
  atualizarMeuWhatsapp,
  atualizarWhatsappContato,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, email, papel, criado_em, whatsapp")
    .eq("id", user.id)
    .single();

  const { data: configClinica } = await supabase
    .from("configuracoes_clinica")
    .select("whatsapp_contato")
    .eq("id", "global")
    .maybeSingle();

  const papel = perfil?.papel === "admin" ? "admin" : "paciente";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const vendoComoPaciente = cookies().get("ver_como_paciente")?.value === "1";

  return (
    <>
      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "40px 20px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <AcentoArabesque
          tamanho={260}
          opacidade={0.16}
          style={{ position: "absolute", top: 4, right: -6, zIndex: -1, pointerEvents: "none" }}
        />
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={96}
            height={96}
            style={{ borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px" }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "var(--cor-acento-suave)",
              margin: "0 auto 16px",
            }}
          />
        )}

        <h1
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: 22,
            color: "var(--cor-primaria)",
            margin: "0 0 4px",
          }}
        >
          {perfil?.nome || "Sem nome"}
        </h1>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--cor-texto-suave)" }}>
          {perfil?.email}
        </p>
        <p
          style={{
            display: "inline-block",
            marginTop: 8,
            padding: "4px 12px",
            borderRadius: 999,
            background: papel === "admin" ? "var(--cor-primaria)" : "var(--cor-acento-suave)",
            color: papel === "admin" ? "#fff" : "var(--cor-acento)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {papel === "admin" ? "FISIOTERAPEUTA" : "PACIENTE"}
        </p>

        <div style={{ marginTop: 32, textAlign: "left" }}>
          <InfoContatoClinica
            whatsapp={configClinica?.whatsapp_contato}
            mostrarBotaoWhatsapp={papel !== "admin" || vendoComoPaciente}
          />
        </div>

        <div style={{ marginTop: 20, textAlign: "left" }}>
          <form action={atualizarMeuWhatsapp} style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>
              Seu WhatsApp
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="whatsapp"
                placeholder="(81) 9xxxx-xxxx"
                defaultValue={perfil?.whatsapp || ""}
                style={campoWhatsapp}
              />
              <button type="submit" style={botaoTeste}>Salvar</button>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
              Pra Beatriz poder te chamar caso você agende uma sessão e não apareça.
            </p>
          </form>
        </div>

        <div style={{ marginTop: 32, display: "grid", gap: 12, justifyItems: "center" }}>
          <AtivarNotificacoes chavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
          <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--cor-texto-suave)", maxWidth: 300 }}>
            Manda um lembrete uma vez por dia, de manhã, se você tiver sessão marcada pra hoje.
          </p>

          {papel === "admin" && (
            <>
              <form action={vendoComoPaciente ? desativarVisaoPaciente : ativarVisaoPaciente}>
                <button type="submit" style={botaoTeste}>
                  {vendoComoPaciente ? "Voltar pra visão de fisioterapeuta" : "Ver como paciente (teste)"}
                </button>
              </form>
              <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--cor-texto-suave)", maxWidth: 300 }}>
                {vendoComoPaciente
                  ? "Você está vendo o app como se fosse um paciente — Início e Exercícios mostram os seus próprios (se você tiver algum plano atribuído em Montar plano)."
                  : "Liga um modo de teste pra você ver Início e Exercícios como um paciente veria."}
              </p>

              <form action={atualizarWhatsappContato} style={{ display: "grid", gap: 6, width: "100%", maxWidth: 300, textAlign: "left" }}>
                <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>
                  WhatsApp Business (botão que os pacientes veem)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    name="whatsapp_contato"
                    placeholder="(81) 9xxxx-xxxx"
                    defaultValue={configClinica?.whatsapp_contato || ""}
                    style={{ ...campoWhatsapp, flex: 1 }}
                  />
                  <button type="submit" style={botaoTeste}>Salvar</button>
                </div>
              </form>
            </>
          )}

          <SairBotao />
        </div>
      </main>

      <BottomNav papel={vendoComoPaciente ? "paciente" : papel} />
    </>
  );
}

const campoWhatsapp: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  fontSize: 13.5,
};

const botaoTeste: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
};
