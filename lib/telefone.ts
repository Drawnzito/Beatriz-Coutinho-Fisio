/**
 * Formatação de telefone, compartilhada pelos campos de WhatsApp.
 *
 * Estava duplicada dentro de components/CampoWhatsApp — saiu de lá quando a
 * Beatriz passou a poder cadastrar também o número da clínica e o da paciente.
 */

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarTelefone(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (!digitos) return "";

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  let saida = `(${ddd}`;
  if (digitos.length > 2) {
    // Celular (9 dígitos) quebra em 5+4; fixo antigo, em 4+4.
    const quebraEm = digitos.length > 10 ? 5 : 4;
    const parte1 = resto.slice(0, quebraEm);
    const parte2 = resto.slice(quebraEm);
    saida += `) ${parte1}`;
    if (parte2) saida += `-${parte2}`;
  }
  return saida;
}

/** Número pronto pro wa.me: com o 55 do Brasil quando não veio escrito. */
export function linkWhatsapp(numero: string) {
  const digitos = somenteDigitos(numero);
  const comPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comPais}`;
}
