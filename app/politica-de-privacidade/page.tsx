import type { Metadata } from "next";
import Link from "next/link";
import { TopoPublico } from "@/components/TopoPublico";
import { CLINICA, urlDoSite } from "@/lib/clinica";

export const metadata: Metadata = {
  metadataBase: new URL(urlDoSite()),
  title: `Política de privacidade — ${CLINICA.nome}`,
  description:
    "Como o aplicativo da Beatriz Coutinho Fisioterapia trata os dados das pacientes.",
  alternates: { canonical: "/politica-de-privacidade" },
  robots: { index: true, follow: true },
};

/**
 * Página aberta, sem login: a LGPD exige que a informação sobre tratamento
 * de dados esteja acessível a qualquer pessoa, inclusive antes do cadastro.
 */
export default function PoliticaPage() {
  return (
    <>
      <TopoPublico />

      <main className="conteudo" style={{ maxWidth: 760, paddingBottom: 56 }}>
        <h1
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: 28,
            color: "var(--cor-primaria)",
            margin: "0 0 6px",
          }}
        >
          Política de privacidade
        </h1>
        <p style={{ margin: "0 0 30px", fontSize: 13, color: "var(--cor-texto-suave)" }}>
          Última atualização: outubro de 2026
        </p>

        <Secao titulo="Quem trata os seus dados">
          <p style={paragrafo}>
            O responsável pelo tratamento dos dados é <strong>{CLINICA.profissional}</strong>,
            fisioterapeuta, com atendimento em {CLINICA.local}, {CLINICA.endereco}.
          </p>
        </Secao>

        <Secao titulo="Quais dados coletamos">
          <p style={paragrafo}>
            <strong>Dados de cadastro:</strong> nome, e-mail e foto de perfil, fornecidos pela
            sua conta Google quando você entra no aplicativo. Telefone/WhatsApp, se você
            preencher.
          </p>
          <p style={paragrafo}>
            <strong>Dados de atendimento:</strong> sessões agendadas, presença confirmada,
            especialidade do atendimento, plano de exercícios atribuído e anotações clínicas
            feitas pela fisioterapeuta.
          </p>
          <p style={paragrafo}>
            <strong>Dados que você envia:</strong> avaliações do atendimento e do aplicativo,
            e indicações de outras pessoas, quando você decide enviá-las.
          </p>
          <p style={paragrafo}>
            Não coletamos dados de navegação para publicidade. Não há Google Analytics,
            pixel de rede social nem qualquer rastreador de terceiros neste aplicativo.
          </p>
        </Secao>

        <Secao titulo="Para que usamos">
          <p style={paragrafo}>
            Exclusivamente para prestar e organizar o atendimento fisioterapêutico: manter a
            agenda, disponibilizar o seu plano de exercícios, registrar a evolução do
            tratamento e entrar em contato sobre as suas sessões. Seus dados não são
            vendidos, alugados nem usados para publicidade.
          </p>
        </Secao>

        <Secao titulo="Dados de saúde">
          <p style={paragrafo}>
            Informações sobre o seu tratamento são <strong>dados pessoais sensíveis</strong> pela
            LGPD (Lei 13.709/2018) e recebem proteção reforçada. As anotações clínicas são
            visíveis apenas para a fisioterapeuta. Nenhuma paciente enxerga dados de outra:
            isso é garantido por regras aplicadas no próprio banco de dados, não apenas na
            tela do aplicativo.
          </p>
        </Secao>

        <Secao titulo="Cookies">
          <p style={paragrafo}>
            Usamos apenas cookies <strong>estritamente necessários</strong>, que mantêm você
            conectada entre uma tela e outra e guardam preferências simples de uso. Sem eles o
            aplicativo não funciona — por isso a legislação não exige consentimento prévio
            para esse tipo de cookie, apenas que você seja informada, que é o que esta seção
            faz.
          </p>
          <p style={paragrafo}>
            Não utilizamos cookies de publicidade, de análise de audiência nem de
            rastreamento entre sites. Caso isso mude, pediremos o seu consentimento antes.
          </p>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p style={paragrafo}>
            Apenas com os serviços necessários para o aplicativo funcionar, e somente no que
            é indispensável: <strong>Supabase</strong> (banco de dados e autenticação),
            <strong> Vercel</strong> (hospedagem), <strong>Google</strong> (login) e,
            quando houver envio de e-mail de aviso, o serviço de e-mail contratado. Nenhum
            deles recebe os seus dados para uso próprio.
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p style={paragrafo}>
            Os registros de atendimento são mantidos pelo prazo exigido da documentação
            fisioterapêutica. Se você encerrar o acompanhamento, pode pedir o arquivamento do
            seu cadastro — o acesso ao aplicativo é mantido e o histórico fica preservado —
            ou a exclusão completa dos seus dados.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p style={paragrafo}>
            A LGPD garante a você: confirmar que tratamos seus dados, acessá-los, corrigir o
            que estiver errado ou desatualizado, pedir a exclusão, saber com quem foram
            compartilhados e revogar consentimento. Para exercer qualquer um desses direitos,
            fale com a Beatriz pelo WhatsApp da clínica ou pelo e-mail de contato.
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p style={paragrafo}>
            Se algo relevante mudar na forma como tratamos seus dados, esta página será
            atualizada e a data no topo mudará junto.
          </p>
        </Secao>

        <div style={{ marginTop: 36 }}>
          <Link href="/" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--cor-acento)" }}>
            ← Voltar para o início
          </Link>
        </div>
      </main>
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: 18,
          color: "var(--cor-primaria)",
          margin: "0 0 8px",
        }}
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const paragrafo: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 14.5,
  lineHeight: 1.65,
};
