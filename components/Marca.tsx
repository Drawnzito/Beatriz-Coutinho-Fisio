import styles from "./marca.module.css";

export function Marca({
  animada = false,
  tamanho = 64,
  corB = "var(--cor-primaria-escura)",
  corC = "var(--cor-primaria)",
}: {
  animada?: boolean;
  tamanho?: number;
  corB?: string;
  corC?: string;
}) {
  return (
    <svg
      className={animada ? undefined : styles.estatico}
      width={tamanho}
      height={(tamanho * 230) / 300}
      viewBox="0 0 300 230"
      role="img"
      aria-label="Beatriz Coutinho Fisioterapia"
    >
      <path
        className={styles.arco}
        pathLength={1}
        d="M 46 205 C 30 150, 60 60, 150 40 C 205 28, 245 45, 272 18"
      />
      <circle className={styles.ponto} cx="150" cy="40" r="5.5" />
      <text
        className={`${styles.letra} ${styles.b}`}
        x="18"
        y="188"
        fontFamily="var(--fonte-titulo)"
        fontWeight={700}
        fontSize={160}
        fill={corB}
      >
        B
      </text>
      <text
        className={`${styles.letra} ${styles.c}`}
        x="128"
        y="188"
        fontFamily="var(--fonte-titulo)"
        fontWeight={700}
        fontSize={160}
        fill={corC}
      >
        C
      </text>
    </svg>
  );
}
