import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { AcentoArabesque } from "@/components/Acentos";
import { AtivarNotificacoes } from "@/components/AtivarNotificacoes";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SairBotao } from "./SairBotao";
import { InfoContatoClinica } from "@/components/InfoContatoClinica";
import { AvaliarApp } from "@/components/AvaliarApp";
import { VerGuiaBotao } from "@/components/VerGuiaBotao";
import { IndicarAmiga } from "@/components/IndicarAmiga";
import {
  SecaoPerfil,
  CartaoPerfil,
  IconeTelefone,
  IconeSino,
  IconeEstrela,
  IconeBussola,
  IconeOlho,
  IconeMala,
} from "@/components/perfil/SecaoPerfil";
import { ativarVisaoPaciente, desativarVisaoPaciente } from "./actions";
import { CampoWhatsApp } from "@/components/CampoWhatsApp";
import { CampoWhatsappClinica } from "@/components/CampoWhatsappClinica";
import { MedidorEmails } from "@/components/MedidorEmails";
import { buscarUsoEmails } from "@/lib/usoEmails";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { indicar?: string; salvo?: string; erro?: string };
}) {
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
  // Só a fisioterapeuta vê o consumo de e-mails — e só ela pode ler a tabela.
  const usoEmails = papel === "admin" ? await buscarUsoEmails() : null;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const vendoComoPaciente = cookies().get("ver_como_paciente")?.value === "1";
  const comoPaciente = papel !== "admin" || vendoComoPaciente;

  return (
    <>
      <main className="conteudo" style={{ position: "relative", overflow: "hidden" }}>
        <AcentoArabesque
          tamanho={260}
          opacidade={0.16}
          style={{ position: "absolute", top: 4, right: -6, zIndex: -1, pointerEvents: "none" }}
        />

        {/* Salvar aqui não dava sinal nenhum de que deu certo — e quando
            falhava calado, parecia que tinha salvado. */}
        {(searchParams.salvo || searchParams.erro) && (
          <p
            style={{
              margin: "0 0 14px",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: searchParams.erro ? "var(--cor-acento-suave)" : "#dff0e4",
              color: searchParams.erro ? "var(--cor-acento)" : "#2f7a4f",
            }}
          >
            {searchParams.erro ? `Não deu pra salvar: ${searchParams.erro}` : "Pronto, salvo!"}
          </p>
        )}

        {/* ---------- Identificação ---------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 22px",
            borderRadius: 16,
            border: "1px solid var(--cor-borda)",
            background: "var(--cor-superficie)",
            flexWrap: "wrap",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--cor-acento-suave)",
                flexShrink: 0,
              }}
            />
          )}

          <div style={{ flex: 1, minWidth: 180 }}>
            <h1
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: 22,
                color: "var(--cor-primaria)",
                margin: "0 0 3px",
              }}
            >
              {perfil?.nome || "Sem nome"}
            </h1>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
              {perfil?.email}
            </p>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 999,
                background: papel === "admin" ? "var(--cor-primaria)" : "var(--cor-acento-suave)",
                color: papel === "admin" ? "#fff" : "var(--cor-acento)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {papel === "admin" ? "FISIOTERAPEUTA" : "PACIENTE"}
            </span>
          </div>
        </div>

        {/* ---------- Indique uma amiga ----------
            Visível pra todo mundo, inclusive pra Beatriz: ela também indica. */}
        <div id="indicar" style={{ marginTop: 20 }}>
          <IndicarAmiga comecarAberto={searchParams.indicar === "1"} />
        </div>

        {/* ---------- Seus dados ---------- */}
        <SecaoPerfil titulo="Seus dados">
          {/* "Seu WhatsApp" é o canal paciente→Beatriz. Pra própria Beatriz ele
              não serve pra nada, e com os dois campos parecidos na mesma tela
              era fácil cadastrar aqui o número da clínica e ficar sem entender
              por que o botão das pacientes não aparecia. */}
          {comoPaciente && (
            <CartaoPerfil
              icone={<IconeTelefone />}
              titulo="Seu WhatsApp"
              descricao="Pra Beatriz falar com você sobre as sessões"
            >
              <CampoWhatsApp valorInicial={perfil?.whatsapp} />
            </CartaoPerfil>
          )}

          <CartaoPerfil
            icone={<IconeSino />}
            titulo="Lembretes"
            descricao="Um aviso de manhã, nos dias em que você tem sessão"
          >
            <AtivarNotificacoes chavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
          </CartaoPerfil>
        </SecaoPerfil>

        {/* ---------- Aplicativo ---------- */}
        {comoPaciente && (
          <SecaoPerfil titulo="Aplicativo">
            <CartaoPerfil
              icone={<IconeEstrela />}
              titulo="Avaliar o app"
              descricao="Conta o que dá pra melhorar aqui"
            >
              <AvaliarApp />
            </CartaoPerfil>

            <CartaoPerfil
              icone={<IconeBussola />}
              titulo="Primeiros passos"
              descricao="Rever o guia rápido de como usar"
            >
              <VerGuiaBotao />
            </CartaoPerfil>
          </SecaoPerfil>
        )}

        {/* ---------- Área da fisioterapeuta ---------- */}
        {papel === "admin" && (
          <SecaoPerfil
            titulo="Área da fisioterapeuta"
            descricao="Só você enxerga esta parte."
          >
            <CartaoPerfil
              icone={<IconeOlho />}
              titulo={vendoComoPaciente ? "Modo de teste ligado" : "Ver como paciente"}
              descricao={
                vendoComoPaciente
                  ? "Início e Exercícios estão mostrando a visão de uma paciente."
                  : "Liga um modo de teste pra conferir a visão da paciente."
              }
              destaque={vendoComoPaciente}
            >
              <form action={vendoComoPaciente ? desativarVisaoPaciente : ativarVisaoPaciente}>
                <button type="submit" style={botaoSecundario}>
                  {vendoComoPaciente ? "Voltar pra visão de fisioterapeuta" : "Ativar modo de teste"}
                </button>
              </form>
            </CartaoPerfil>

            {!vendoComoPaciente && (
              <>
                <CartaoPerfil
                  icone={<IconeSino />}
                  titulo="Avisos por e-mail"
                  descricao="Solicitação de sessão, aprovação e recusa"
                  destaque={usoEmails?.atencao}
                >
                  {usoEmails && <MedidorEmails uso={usoEmails} />}
                </CartaoPerfil>

                <CartaoPerfil
                  icone={<IconeMala />}
                  titulo="WhatsApp da clínica"
                  descricao="O número que as pacientes veem no botão de falar com você."
                  destaque={!configClinica?.whatsapp_contato}
                >
                  <CampoWhatsappClinica valorInicial={configClinica?.whatsapp_contato} />
                </CartaoPerfil>
              </>
            )}
          </SecaoPerfil>
        )}

        {/* ---------- Atendimento (no fim, logo acima de sair) ---------- */}
        <SecaoPerfil titulo="Onde a Beatriz atende" colunas={1}>
          <InfoContatoClinica
            whatsapp={configClinica?.whatsapp_contato}
            mostrarBotaoWhatsapp={comoPaciente}
          />
        </SecaoPerfil>

        {/* ---------- Sair ---------- */}
        <div
          style={{
            marginTop: 26,
            paddingTop: 20,
            borderTop: "1px solid var(--cor-borda)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SairBotao />
        </div>
      </main>

      <BottomNav papel={vendoComoPaciente ? "paciente" : papel} />
    </>
  );
}

const campoTexto: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  fontSize: 13.5,
  fontFamily: "var(--fonte-corpo)",
};

const botaoSecundario: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-fundo)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
