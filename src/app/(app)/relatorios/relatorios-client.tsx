"use client";

import { useMemo, useState } from "react";
import { ETAPAS, ROTULO_ORIGEM, type KpiChave, type MetricaMensal, type PapelUsuario } from "@/lib/tipos";
import { moeda, numero } from "@/lib/formato";
import { ConfigKpis } from "@/components/relatorios/config-kpis";
import { LancarInvestimentoModal } from "@/components/relatorios/lancar-investimento-modal";

type LinhaFunil = { etapa: string; total: number; valor_total: number | null };

function rotuloMes(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function exportarCsv(metricas: MetricaMensal[]) {
  const cabecalho = [
    "mes",
    "origem",
    "leads",
    "ganhos",
    "perdidos",
    "receita",
    "investimento",
    "cpl",
    "cac",
    "roas",
    "taxa_fechamento_pct",
  ];
  const linhas = metricas.map((m) =>
    [
      m.mes,
      m.origem,
      m.leads,
      m.ganhos,
      m.perdidos,
      m.receita ?? "",
      m.investimento ?? "",
      m.cpl ?? "",
      m.cac ?? "",
      m.roas ?? "",
      m.taxa_fechamento_pct ?? "",
    ].join(";")
  );
  const csv = [cabecalho.join(";"), ...linhas].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RelatoriosClient({
  metricas,
  funil,
  preferenciasKpi,
  papel,
}: {
  metricas: MetricaMensal[];
  funil: LinhaFunil[];
  preferenciasKpi: Partial<Record<KpiChave, boolean>>;
  papel: PapelUsuario;
}) {
  const [modo, setModo] = useState<"simples" | "detalhado">("simples");
  const [configAberta, setConfigAberta] = useState(false);
  const [investimentoAberto, setInvestimentoAberto] = useState(false);

  const kpiVisivel = (chave: KpiChave) => preferenciasKpi[chave] ?? true;

  const totais = useMemo(() => {
    const leads = metricas.reduce((s, m) => s + m.leads, 0);
    const ganhos = metricas.reduce((s, m) => s + m.ganhos, 0);
    const investimento = metricas.reduce((s, m) => s + (m.investimento ?? 0), 0);
    const receita = metricas.reduce((s, m) => s + (m.receita ?? 0), 0);
    return {
      leads,
      ganhos,
      investimento,
      receita,
      taxaFechamento: leads > 0 ? (100 * ganhos) / leads : null,
      cpl: leads > 0 && investimento > 0 ? investimento / leads : null,
      cac: ganhos > 0 && investimento > 0 ? investimento / ganhos : null,
      roas: investimento > 0 && receita > 0 ? receita / investimento : null,
    };
  }, [metricas]);

  const porEtapa = new Map(funil.map((f) => [f.etapa, f]));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="text-xl font-semibold text-marca-900">Relatórios</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-neutral-300 text-sm">
            <button
              onClick={() => setModo("simples")}
              className={`rounded-l-md px-3 py-1.5 ${modo === "simples" ? "bg-marca-800 text-white" : "hover:bg-neutral-50"}`}
            >
              Simples
            </button>
            <button
              onClick={() => setModo("detalhado")}
              className={`rounded-r-md border-l border-neutral-300 px-3 py-1.5 ${modo === "detalhado" ? "bg-marca-800 text-white" : "hover:bg-neutral-50"}`}
            >
              Detalhado
            </button>
          </div>
          <button
            onClick={() => setConfigAberta(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            KPIs
          </button>
          {papel === "gerente" && (
            <button
              onClick={() => setInvestimentoAberto(true)}
              className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900"
            >
              Lançar investimento
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpiVisivel("volume_leads") && <CardKpi rotulo="Volume de leads" valor={String(totais.leads)} />}
        {kpiVisivel("taxa_fechamento") && (
          <CardKpi rotulo="Taxa de fechamento" valor={totais.taxaFechamento != null ? `${numero(totais.taxaFechamento)}%` : "—"} />
        )}
        {kpiVisivel("cpl") && <CardKpi rotulo="CPL" valor={totais.cpl != null ? moeda(totais.cpl) : "—"} />}
        {kpiVisivel("cac") && <CardKpi rotulo="CAC" valor={totais.cac != null ? moeda(totais.cac) : "—"} />}
        {kpiVisivel("roas") && <CardKpi rotulo="ROAS" valor={totais.roas != null ? `${numero(totais.roas)}x` : "—"} />}
      </div>

      {modo === "simples" ? (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Funil atual</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ETAPAS.map((e) => (
              <div key={e.chave} className="rounded-lg border border-marca-200 bg-white p-4">
                <p className="text-xs text-neutral-500">{e.rotulo}</p>
                <p className="text-xl font-semibold text-marca-900">{porEtapa.get(e.chave)?.total ?? 0}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Métricas por mês e origem
            </h2>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => exportarCsv(metricas)}
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
              >
                Exportar CSV
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
              >
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-marca-50 text-left text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Mês</th>
                  <th className="px-3 py-2">Origem</th>
                  <th className="px-3 py-2">Leads</th>
                  <th className="px-3 py-2">Ganhos</th>
                  <th className="px-3 py-2">Perdidos</th>
                  <th className="px-3 py-2">Receita</th>
                  <th className="px-3 py-2">Investimento</th>
                  <th className="px-3 py-2">CPL</th>
                  <th className="px-3 py-2">CAC</th>
                  <th className="px-3 py-2">ROAS</th>
                  <th className="px-3 py-2">Fechamento</th>
                </tr>
              </thead>
              <tbody>
                {metricas.map((m, i) => (
                  <tr key={i} className="border-t border-marca-50">
                    <td className="px-3 py-2">{rotuloMes(m.mes)}</td>
                    <td className="px-3 py-2">{ROTULO_ORIGEM[m.origem]}</td>
                    <td className="px-3 py-2">{m.leads}</td>
                    <td className="px-3 py-2">{m.ganhos}</td>
                    <td className="px-3 py-2">{m.perdidos}</td>
                    <td className="px-3 py-2">{moeda(m.receita)}</td>
                    <td className="px-3 py-2">{moeda(m.investimento)}</td>
                    <td className="px-3 py-2">{m.cpl != null ? moeda(m.cpl) : "—"}</td>
                    <td className="px-3 py-2">{m.cac != null ? moeda(m.cac) : "—"}</td>
                    <td className="px-3 py-2">{m.roas != null ? `${numero(m.roas)}x` : "—"}</td>
                    <td className="px-3 py-2">{m.taxa_fechamento_pct != null ? `${numero(m.taxa_fechamento_pct)}%` : "—"}</td>
                  </tr>
                ))}
                {!metricas.length && (
                  <tr>
                    <td className="px-3 py-6 text-center text-neutral-400" colSpan={11}>
                      Sem dados ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {configAberta && <ConfigKpis preferencias={preferenciasKpi} onFechar={() => setConfigAberta(false)} />}
      {investimentoAberto && <LancarInvestimentoModal onFechar={() => setInvestimentoAberto(false)} />}
    </div>
  );
}

function CardKpi({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-marca-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{rotulo}</p>
      <p className="text-xl font-semibold text-marca-900">{valor}</p>
    </div>
  );
}
