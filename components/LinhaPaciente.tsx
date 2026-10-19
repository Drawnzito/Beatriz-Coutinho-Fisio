import Link from "next/link";
import styles from "./linhaPaciente.module.css";

/** Primeira letra do nome, pra lista ter um ponto de ancoragem visual. */
function inicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

function rotuloProxima(proxima?: { data: string; hora: string | null }) {
  if (!proxima) return null;

  const data = new Date(`${proxima.data}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias = Math.round((data.getTime() - hoje.getTime()) / 86400000);
  const hora = proxima.hora ? ` às ${proxima.hora.slice(0, 5)}` : "";

  if (dias === 0) return `hoje${hora}`;
  if (dias === 1) return `amanhã${hora}`;
  if (dias < 7) return `${data.toLocaleDateString("pt-BR", { weekday: "long" })}${hora}`;
  return `${data.toLocaleDateString("pt-BR")}${hora}`;
}

export function LinhaPaciente({
  nome,
  href,
  proxima,
}: {
  nome: string;
  href: string;
  proxima?: { data: string; hora: string | null };
}) {
  const quando = rotuloProxima(proxima);

  return (
    <Link href={href} className={styles.linha}>
      <span className={styles.inicial} aria-hidden="true">
        {inicial(nome)}
      </span>

      <span className={styles.textos}>
        <strong className={styles.nome}>{nome}</strong>
        <span className={quando ? styles.proxima : styles.semSessao}>
          {quando ? `Próxima: ${quando}` : "Sem sessão marcada"}
        </span>
      </span>

      <svg
        className={styles.seta}
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
