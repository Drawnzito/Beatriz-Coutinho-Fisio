import { desativarVisaoPaciente } from "@/app/perfil/actions";

export function AvisoModoTeste() {
  return (
    <form action={desativarVisaoPaciente}>
      <button
        type="submit"
        style={{
          display: "block",
          width: "100%",
          border: "none",
          cursor: "pointer",
          background: "#b45309",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        Modo teste: vendo como paciente · toque pra voltar à visão de fisioterapeuta
      </button>
    </form>
  );
}
