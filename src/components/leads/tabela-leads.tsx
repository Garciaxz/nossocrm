import Link from "next/link";
import { ETAPAS, type LeadCompleto } from "@/lib/tipos";
import { telefone, moeda, data } from "@/lib/formato";

export function TabelaLeads({ leads }: { leads: LeadCompleto[] }) {
  const rotuloEtapa = new Map(ETAPAS.map((e) => [e.chave, e.rotulo]));

  return (
    <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-marca-50 text-left text-neutral-600">
          <tr>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Telefone</th>
            <th className="px-4 py-2">Bairro</th>
            <th className="px-4 py-2">Linha</th>
            <th className="px-4 py-2">Etapa</th>
            <th className="px-4 py-2">Responsável</th>
            <th className="px-4 py-2">Valor</th>
            <th className="px-4 py-2">Recebido</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-marca-50">
              <td className="px-4 py-2">
                <Link href={`/leads/${l.id}`} className="font-medium text-marca-900 hover:underline">
                  {l.nome ?? "Sem nome"}
                </Link>
              </td>
              <td className="px-4 py-2">{telefone(l.telefone)}</td>
              <td className="px-4 py-2">{l.bairro ?? "—"}</td>
              <td className="px-4 py-2">{l.linha_nome ?? "—"}</td>
              <td className="px-4 py-2">{rotuloEtapa.get(l.etapa) ?? l.etapa}</td>
              <td className="px-4 py-2">{l.responsavel_nome ?? "Sem dono"}</td>
              <td className="px-4 py-2">{moeda(l.valor_estimado)}</td>
              <td className="px-4 py-2">{data(l.criado_em)}</td>
            </tr>
          ))}
          {!leads.length && (
            <tr>
              <td className="px-4 py-6 text-center text-neutral-400" colSpan={8}>
                Nenhum lead encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
