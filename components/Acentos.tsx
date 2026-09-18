/**
 * Traços decorativos derivados da marca BC — "Arabesque" e "Cadência".
 * Usados como flourish discreto em telas específicas, não como logo.
 */

export function AcentoCadencia({
  largura = 240,
  cor = "var(--cor-acento)",
  opacidade = 0.85,
  className,
  style,
}: {
  largura?: number;
  cor?: string;
  opacidade?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={largura}
      height={(largura * 26) / 340}
      viewBox="0 0 340 26"
      aria-hidden="true"
    >
      <path
        d="M 4 18 C 22 4, 38 24, 60 12 C 82 -2, 98 22, 120 10 C 142 -2, 158 20, 180 8 C 202 -4, 220 18, 242 6 C 262 -4, 282 14, 304 4"
        fill="none"
        stroke={cor}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={opacidade}
      />
    </svg>
  );
}

export function AcentoArabesque({
  tamanho = 160,
  cor = "var(--cor-acento)",
  opacidade = 1,
  className,
  style,
}: {
  tamanho?: number;
  cor?: string;
  opacidade?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={tamanho}
      height={(tamanho * 180) / 300}
      viewBox="0 0 300 180"
      aria-hidden="true"
    >
      <path
        d="M 210 20 C 150 20, 130 70, 150 105 C 165 130, 205 128, 215 150 C 222 165, 210 172, 195 170"
        fill="none"
        stroke={cor}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={opacidade}
      />
    </svg>
  );
}
