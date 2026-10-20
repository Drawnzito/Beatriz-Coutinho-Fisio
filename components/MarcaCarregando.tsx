import styles from "./marcaCarregando.module.css";

/**
 * Sinal de "estou trabalhando" com a cara da marca.
 *
 * É o mesmo arabesco dos acentos, mas desenhando-se em laço, com o ponto
 * rosa correndo à frente do traço — o gesto da marca, e não uma roda de
 * carregamento genérica. Serve pros dois lugares em que o app fica um
 * instante parado: a troca de tela (dentro do esqueleto) e o salvar.
 */
export function MarcaCarregando({
  tamanho = 64,
  claro = false,
}: {
  tamanho?: number;
  /** Sobre fundo escuro (cabeçalho, selo verde). */
  claro?: boolean;
}) {
  const traco = claro ? "rgba(255,255,255,0.85)" : "var(--cor-primaria)";
  const ponto = claro ? "#f0c6d1" : "var(--cor-acento)";

  return (
    <svg
      className={styles.marca}
      width={tamanho}
      height={(tamanho * 180) / 300}
      viewBox="0 0 300 180"
      role="img"
      aria-label="Carregando"
    >
      {/* O desenho do arabesco ocupa só a faixa x≈130–222 / y≈20–172 — sem
          essa translação ele fica fora do centro do viewBox (300×180),
          puxado pra direita e pra baixo. */}
      <g transform="translate(-26, -6)">
        <path
          className={styles.traco}
          pathLength={1}
          d="M 210 20 C 150 20, 130 70, 150 105 C 165 130, 205 128, 215 150 C 222 165, 210 172, 195 170"
          fill="none"
          stroke={traco}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <circle className={styles.ponto} r={9} fill={ponto}>
          {/* keyTimes/keySplines espelham exatamente os 0%/55%/75%/100% do
              @keyframes desenhaEApaga (CSS, abaixo): sem isso o ponto
              percorre o traço de ponta a ponta sem pausa, enquanto o traço
              desenha, PARA (55%–75%) e só então recolhe — e o ponto some
              longe da ponta visível durante essa pausa. Aqui ele vai até a
              ponta (0→55%), segura ali (55%→75%, igual ao traço parado) e
              volta pra origem acompanhando o recolhimento (75%→100%). */}
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            keyPoints="0;1;1;0"
            keyTimes="0;0.55;0.75;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
            path="M 210 20 C 150 20, 130 70, 150 105 C 165 130, 205 128, 215 150 C 222 165, 210 172, 195 170"
          />
        </circle>
      </g>
    </svg>
  );
}
