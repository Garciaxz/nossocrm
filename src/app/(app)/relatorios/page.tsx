import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterPerfilAtual } from "@/lib/supabase/perfil";
import type { KpiChave, MetricaMensal, OrigemLead } from "@/lib/tipos";
import { RelatoriosClient } from "./relatorios-client";

type LinhaFunil = { etapa: string; total: number; valor_total: number | null };

export default async function Relatorios() {
  const perfil = await obterPerfilAtual();
  const supabase = await criarClienteServidor();

  const ehDiretoria = perfil?.papel === "diretoria";

  const [{ data: metricas }, { data: funil }, { data: kpisConfig }] = await Promise.all([
    ehDiretoria
      ? supabase
          .from("vw_diretoria_mensal")
          .select("mes, origem, leads, ganhos, perdidos, receita")
          .order("mes", { ascending: false })
          .returns<
            { mes: string; origem: OrigemLead; leads: number; ganhos: number; perdidos: number; receita: number | null }[]
          >()
      : supabase
          .from("vw_metricas_mensais")
          .select("*")
          .order("mes", { ascending: false })
          .returns<MetricaMensal[]>(),
    ehDiretoria
      ? supabase.from("vw_diretoria_funil").select("*")
      : supabase.from("vw_funil_atual").select("*"),
    supabase
      .from("kpis_painel")
      .select("chave, visivel, perfil_id")
      .or(`perfil_id.is.null,perfil_id.eq.${perfil?.id}`),
  ]);

  // Normaliza a linha da diretoria pro mesmo formato de vw_metricas_mensais,
  // so que sem investimento/cpl/cac/roas (a view dela nao tem essas colunas).
  const metricasNormalizadas: MetricaMensal[] = ehDiretoria
    ? (metricas ?? []).map((m) => ({
        mes: m.mes,
        origem: m.origem,
        leads: m.leads,
        ganhos: m.ganhos,
        perdidos: m.perdidos,
        qualificados: 0,
        receita: m.receita,
        tempo_resposta_medio: null,
        investimento: null,
        cpl: null,
        cac: null,
        roas: null,
        taxa_fechamento_pct: m.leads ? Math.round((10000 * m.ganhos) / m.leads) / 100 : null,
        taxa_qualificacao_pct: null,
      }))
    : (metricas as MetricaMensal[]) ?? [];

  // Preferencia do usuario tem prioridade sobre o padrao do sistema (perfil_id null)
  const preferencias = new Map<KpiChave, boolean>();
  for (const k of kpisConfig ?? []) {
    if (k.perfil_id === null && !preferencias.has(k.chave)) preferencias.set(k.chave, k.visivel);
  }
  for (const k of kpisConfig ?? []) {
    if (k.perfil_id !== null) preferencias.set(k.chave, k.visivel);
  }

  return (
    <RelatoriosClient
      metricas={metricasNormalizadas}
      funil={(funil as LinhaFunil[]) ?? []}
      preferenciasKpi={Object.fromEntries(preferencias)}
      papel={perfil!.papel}
    />
  );
}
