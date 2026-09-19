import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TreinoExecucao } from "./TreinoExecucao";

export const dynamic = "force-dynamic";

export default async function TreinoPage({ params }: { params: { planoId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plano } = await supabase
    .from("planos")
    .select("id, titulo, paciente_id, plano_exercicios(id, series, repeticoes, ordem, exercicios(*))")
    .eq("id", params.planoId)
    .single();

  if (!plano || plano.paciente_id !== user.id) {
    redirect("/exercicios");
  }

  const itens = (plano.plano_exercicios ?? [])
    .sort((a: any, b: any) => a.ordem - b.ordem)
    .map((item: any) => ({
      id: item.id as string,
      titulo: item.exercicios.titulo as string,
      descricao: item.exercicios.descricao as string | null,
      video_url: item.exercicios.video_url as string | null,
      series: (item.series ?? item.exercicios.series_padrao) as number | null,
      repeticoes: (item.repeticoes ?? item.exercicios.repeticoes_padrao) as number | null,
    }));

  return <TreinoExecucao tituloPlano={plano.titulo} itens={itens} />;
}
