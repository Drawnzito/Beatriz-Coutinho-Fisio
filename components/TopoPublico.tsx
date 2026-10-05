import Link from "next/link";
import { Marca } from "./Marca";
import { CLINICA } from "@/lib/clinica";

/** Barra de topo das páginas abertas (blog). A home tem o próprio herói. */
export function TopoPublico() {
  return (
    <header
      style={{
        background: "linear-gradient(140deg, var(--cor-primaria), var(--cor-primaria-escura))",
        color: "#fff",
      }}
    >
      <div
        className="faixa-interna"
        style={{
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}
        >
          <Marca tamanho={34} corB="#ffffff" corC="rgba(255,255,255,0.8)" />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{CLINICA.profissional}</span>
        </Link>

        <Link
          href="/login"
          style={{
            padding: "8px 15px",
            borderRadius: 999,
            background: "#fff",
            color: "var(--cor-primaria-escura)",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
