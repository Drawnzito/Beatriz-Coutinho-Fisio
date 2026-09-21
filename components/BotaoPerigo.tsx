"use client";

export function BotaoPerigo({
  mensagemConfirmacao,
  children,
  style,
}: {
  mensagemConfirmacao: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(mensagemConfirmacao)) e.preventDefault();
      }}
      style={style}
    >
      {children}
    </button>
  );
}
