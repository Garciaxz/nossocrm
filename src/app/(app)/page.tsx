import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterPerfilAtual } from "@/lib/supabase/perfil";
import { ETAPAS } from "@/lib/tipos";
import { moeda, telefone, tempoRelativo, duracao } from "@/lib/formato";

type LinhaFunil = { etapa: string; total: number; valor_total: number | null };
type LinhaSla = {
  id: string;
  nome: string | null;
  telefone: string;
  segundos_esperando: number;
};
type LeadRecente = {
  id: string;
  nome: string | null;
  telefone: string;
  etapa: string;
  criado_em: string;
  linha_nome: string | null;
};
type LinhaDiretoria = {
  mes: string;
  origem: string;
  linha: string | null;
  leads: number;
  ganhos: number;
  perdidos: number;
  receita: number | null;
};

export default async function Painel() {
  const perfil = await obterPerfilAtual();
  const supabase = await criarClienteServidor();

  if (perfil?.papel === "diretoria") {
    const { data } = await supabase
      .from("vw_diretoria_mensal")
      .select("*")
      .order("mes", { ascending: false })
      .returns<LinhaDiretoria[]>();

    return (
      <div>
        <h1 className="mb-6 text-xl font-semibold text-marca-900">Painel</h1>
        <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-marca-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-2">Mês</th>
                <th className="px-4 py-2">Origem</th>
                <th className="px-4 py-2">Linha</th>
                <th className="px-4 py-2">Leads</th>
                <th className="px-4 py-2">Ganhos</th>
                <th className="px-4 py-2">Perdidos</th>
                <th className="px-4 py-2">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((linha, i) => (
                <tr key={i} className="border-t border-marca-50">
                  <td className="px-4 py-2">{new Date(linha.mes).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-2">{linha.origem}</td>
                  <td className="px-4 py-2">{linha.linha ?? "—"}</td>
                  <td className="px-4 py-2">{linha.leads}</td>
                  <td className="px-4 py-2">{linha.ganhos}</td>
                  <td className="px-4 py-2">{linha.perdidos}</td>
                  <td className="px-4 py-2">{moeda(linha.receita)}</td>
                </tr>
              ))}
              {!data?.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-400" colSpan={7}>
                    Sem dados ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const [{ data: funil }, { data: sla }, { data: recentes }] = await Promise.all([
    supabase.from("vw_funil_atual").select("*").returns<LinhaFunil[]>(),
    supabase
      .from("vw_sla_estourado")
      .select("id, nome, telefone, segundos_esperando")
      .returns<LinhaSla[]>(),
    supabase
      .from("vw_leads_completo")
      .select("id, nome, telefone, etapa, criado_em, linha_nome")
      .order("criado_em", { ascending: false })
      .limit(8)
      .returns<LeadRecente[]>(),
  ]);

  const porEtapa = new Map((funil ?? []).map((f) => [f.etapa, f]));
  const totalAtivos = (funil ?? []).reduce((soma, f) => soma + f.total, 0);
  const valorEmAberto = (funil ?? []).reduce((soma, f) => soma + (f.valor_total ?? 0), 0);
  const semDono = porEtapa.get("novo")?.total ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-marca-900">Painel</h1>

      {!!sla?.length && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="mb-2 text-sm font-medium text-red-700">
            {sla.length} lead{sla.length > 1 ? "s" : ""} com SLA estourado
          </p>
          <ul className="space-y-1 text-sm text-red-700">
            {sla.slice(0, 5).map((l) => (
              <li key={l.id}>
                {l.nome ?? telefone(l.telefone)} · esperando há {duracao(l.segundos_esperando)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CardKpi rotulo="Leads ativos" valor={String(totalAtivos)} />
        <CardKpi rotulo="Valor em aberto" valor={moeda(valorEmAberto)} />
        <CardKpi rotulo="Novos sem dono" valor={String(semDono)} />
        <CardKpi rotulo="SLA estourado" valor={String(sla?.length ?? 0)} />
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Funil
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ETAPAS.filter((e) => e.chave !== "ganho" && e.chave !== "perdido").map((e) => (
          <div key={e.chave} className="rounded-lg border border-marca-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{e.rotulo}</p>
            <p className="text-xl font-semibold text-marca-900">
              {porEtapa.get(e.chave)?.total ?? 0}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Últimos leads recebidos
      </h2>
      <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-marca-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">Linha</th>
              <th className="px-4 py-2">Etapa</th>
              <th className="px-4 py-2">Recebido</th>
            </tr>
          </thead>
          <tbody>
            {recentes?.map((l) => (
              <tr key={l.id} className="border-t border-marca-50">
                <td className="px-4 py-2">{l.nome ?? "—"}</td>
                <td className="px-4 py-2">{telefone(l.telefone)}</td>
                <td className="px-4 py-2">{l.linha_nome ?? "—"}</td>
                <td className="px-4 py-2">{l.etapa}</td>
                <td className="px-4 py-2">{tempoRelativo(l.criado_em)}</td>
              </tr>
            ))}
            {!recentes?.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={5}>
                  Nenhum lead ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
