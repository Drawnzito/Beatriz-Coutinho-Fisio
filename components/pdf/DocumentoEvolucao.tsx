import { Document, Page, View, Text, Svg, Path, StyleSheet } from "@react-pdf/renderer";

const CORES = {
  primaria: "#1f5c57",
  primariaEscura: "#163f3c",
  acento: "#a2465a",
  fundo: "#faf8f5",
  texto: "#24312f",
  textoSuave: "#5c6b68",
  borda: "#e4ded4",
};

const estilos = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: CORES.texto,
    backgroundColor: "#ffffff",
  },
  faixaCabecalho: {
    backgroundColor: CORES.primariaEscura,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 40,
    marginBottom: 26,
  },
  clinica: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  titulo: {
    fontFamily: "Times-Bold",
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 14,
  },
  linhaPaciente: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rotuloPaciente: {
    fontFamily: "Helvetica",
    fontSize: 11.5,
    color: "rgba(255,255,255,0.72)",
    marginRight: 5,
  },
  nomePaciente: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#ffffff",
  },
  corpo: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  traco: {
    marginBottom: 18,
  },
  bloco: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: `1px solid ${CORES.borda}`,
  },
  linhaData: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  marcador: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: CORES.acento,
    marginRight: 7,
  },
  data: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: CORES.primariaEscura,
  },
  texto: {
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: CORES.texto,
  },
  rodape: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 9,
    color: CORES.textoSuave,
    textAlign: "center",
  },
});

function TracoCadencia({ cor = CORES.acento }: { cor?: string }) {
  return (
    <Svg width={220} height={17} viewBox="0 0 340 26" style={estilos.traco}>
      <Path
        d="M 4 18 C 22 4, 38 24, 60 12 C 82 -2, 98 22, 120 10 C 142 -2, 158 20, 180 8 C 202 -4, 220 18, 242 6 C 262 -4, 282 14, 304 4"
        stroke={cor}
        strokeWidth={1.6}
        fill="none"
      />
    </Svg>
  );
}

export function DocumentoEvolucao({
  nomePaciente,
  evolucoes,
}: {
  nomePaciente: string;
  evolucoes: { id: string; data: string; texto: string }[];
}) {
  return (
    <Document title={`Evolução — ${nomePaciente}`}>
      <Page size="A4" style={estilos.page}>
        <View style={estilos.faixaCabecalho}>
          <Text style={estilos.clinica}>BEATRIZ COUTINHO FISIOTERAPIA</Text>
          <Text style={estilos.titulo}>Evolução do tratamento</Text>
          <View style={estilos.linhaPaciente}>
            <Text style={estilos.rotuloPaciente}>Paciente:</Text>
            <Text style={estilos.nomePaciente}>{nomePaciente}</Text>
          </View>
        </View>

        <View style={estilos.corpo}>
          <TracoCadencia />

          <View>
            {evolucoes.map((e) => {
              const data = new Date(`${e.data}T00:00:00`);
              const dataFormatada = data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
              return (
                <View key={e.id} style={estilos.bloco} wrap={false}>
                  <View style={estilos.linhaData}>
                    <View style={estilos.marcador} />
                    <Text style={estilos.data}>{dataFormatada}</Text>
                  </View>
                  <Text style={estilos.texto}>{e.texto}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text
          style={estilos.rodape}
          render={({ pageNumber, totalPages }) => `Beatriz Coutinho Fisioterapia · página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
