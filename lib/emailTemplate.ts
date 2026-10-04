const URL_LOGO = "https://beatriz-coutinho-fisio.vercel.app/marca/logo-com-nome-cartao.png";

export function envolverEmailComMarca(conteudoHtml: string): string {
  return `
<div style="background:#f1ece0; padding:24px 16px; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width:480px; margin:0 auto;">
    <div style="background:linear-gradient(135deg, #163f3c, #1f5c57); padding:22px 24px; border-radius:16px 16px 0 0;">
      <p style="margin:0; color:#ffffff; font-size:20px; font-weight:bold; font-family: Georgia, 'Times New Roman', serif;">
        Beatriz Coutinho Fisioterapia
      </p>
    </div>

    <div style="background:#ffffff; padding:26px 24px; border:1px solid #e4ded4; border-top:none; color:#24312f; font-size:14px; line-height:1.6;">
      ${conteudoHtml}
    </div>

    <div style="text-align:center; padding:28px 0 8px;">
      <img src="${URL_LOGO}" width="220" alt="Beatriz Coutinho Fisioterapia" style="border-radius:12px; display:inline-block;" />
      <p style="margin:12px 0 0; font-size:11.5px; color:#5c6b68; font-family: Arial, sans-serif;">
        R. Cel. João Rufino, 53 - Poço da Panela, Recife - PE
      </p>
    </div>
  </div>
</div>
`.trim();
}
