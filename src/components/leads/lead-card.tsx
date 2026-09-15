import Link from "next/link";
import type { LeadCompleto } from "@/lib/tipos";
import { telefone, moeda, tempoRelativo } from "@/lib/formato";

export function LeadCard({
  lead,
  arrastavel,
  onArrastar,
  mostrarPuxar,
  onPuxar,
}: {
  lead: LeadCompleto;
  arrastavel: boolean;
  onArrastar: (id: string) => void;
  mostrarPuxar: boolean;
  onPuxar: (id: string) => void;
}) {
  return (
    <div
      draggable={arrastavel}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        onArrastar(lead.id);
      }}
      className="cursor-grab rounded-lg border border-marca-200 bg-white p-3 active:cursor-grabbing"
    >
      <Link href={`/leads/${lead.id}`} className="block">
        <p className="text-sm font-semibold text-marca-900">{lead.nome ?? "Sem nome"}</p>
        <p className="text-xs text-neutral-500">{telefone(lead.telefone)}</p>
        {lead.linha_nome && <p className="mt-1 text-xs text-neutral-500">{lead.linha_nome}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{tempoRelativo(lead.criado_em)}</span>
          {lead.valor_estimado != null && (
            <span className="text-xs font-medium text-marca-900">{moeda(lead.valor_estimado)}</span>
          )}
        </div>
        {!lead.responsavel_id && (
          <p className="mt-1 text-xs font-medium text-marca-600">Sem responsável</p>
        )}
      </Link>
      {mostrarPuxar && !lead.responsavel_id && (
        <button
          onClick={() => onPuxar(lead.id)}
          className="mt-2 w-full rounded-md border border-marca-200 py-1 text-xs font-medium text-marca-800 hover:bg-marca-50"
        >
          Puxar pra mim
        </button>
      )}
    </div>
  );
}
