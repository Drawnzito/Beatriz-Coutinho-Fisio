import type { UsoEmails } from "@/lib/usoEmails";
import { usandoRemetenteDeTeste } from "@/lib/email";

/**
 * Quanto do envio de e-mails do mês já foi usado.
 *
 * O app para de enviar sozinho ao chegar no teto, pra nunca gerar cobrança —
 * mas parava em silêncio: do lado da Beatriz parecia que a paciente tinha
 * sido avisada. Aqui o número fica à vista antes de o limite chegar.
 */
export function MedidorEmails({ uso }: { uso: UsoEmails }) {
  const cor = uso.esgotado ? "#9c4259" : uso.atencao ? "#8a6a42" : "var(--cor-primaria)";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Contar envio não é o mesmo que entregar: com o remetente de teste o
          Resend aceita a chamada e recusa a entrega pra qualquer endereço que
          não seja o da conta. O medidor subiria normalmente com ninguém
          recebendo nada, então o aviso vem antes do número. */}
      {usandoRemetenteDeTeste() && (
        <p
          style={{
            margin: 0,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#f7e4e8",
            color: "#8c2f45",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          Os e-mails estão saindo pelo remetente de teste do Resend, que só entrega pro e-mail do dono da
          conta — as pacientes não estão recebendo nada. Pra resolver: verifique um domínio no Resend e
          preencha a variável <code>RESEND_FROM</code> na Vercel com um endereço desse domínio.
        </p>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 20, color: cor }}>
          {uso.enviados.toLocaleString("pt-BR")}
        </strong>
        <span style={{ fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
          de {uso.limite.toLocaleString("pt-BR")} neste mês
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={uso.porcentagem}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="E-mails enviados no mês"
        style={{ height: 8, borderRadius: 999, background: "var(--cor-borda)", overflow: "hidden" }}
      >
        <div style={{ width: `${Math.max(2, uso.porcentagem)}%`, height: "100%", background: cor }} />
      </div>

      <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)", lineHeight: 1.45 }}>
        {uso.esgotado ? (
          <>
            O limite do mês foi atingido: os avisos por e-mail estão pausados e voltam sozinhos em{" "}
            {uso.diasAteVirarOMes} dia{uso.diasAteVirarOMes === 1 ? "" : "s"}, quando o mês virar. Enquanto isso,
            fale com as pacientes pelo WhatsApp.
          </>
        ) : uso.atencao ? (
          <>
            Faltam {uso.restantes.toLocaleString("pt-BR")} envios e ainda há {uso.diasAteVirarOMes} dia
            {uso.diasAteVirarOMes === 1 ? "" : "s"} até o mês virar. Ao chegar no teto os envios param sozinhos,
            sem gerar custo.
          </>
        ) : (
          <>
            Contagem reiniciada todo dia 1º. O app para de enviar sozinho ao chegar no teto, pra nunca gerar
            cobrança.
          </>
        )}
      </p>
    </div>
  );
}
