"use client";

import { useState } from "react";
import { ETAPAS, type EtapaLead, type LeadCompleto, type PapelUsuario } from "@/lib/tipos";
import { LeadCard } from "./lead-card";

export function Kanban({
  leads,
  papel,
  meuId,
  onMover,
  onPuxar,
}: {
  leads: LeadCompleto[];
  papel: PapelUsuario;
  meuId: string;
  onMover: (leadId: string, novaEtapa: EtapaLead, motivoPerda?: string) => void;
  onPuxar: (leadId: string) => void;
}) {
  const [colunaSobre, setColunaSobre] = useState<EtapaLead | null>(null);

  function podeArrastar(lead: LeadCompleto): boolean {
    return papel === "gerente" || !lead.responsavel_id || lead.responsavel_id === meuId;
  }

  function soltar(destino: EtapaLead, leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa === destino) return;

    if (!podeArrastar(lead)) return;

    if (destino === "medicao" && !lead.elegivel_instalacao) {
      alert("Esse lead não é elegível pra medição (linha não instala, ou metragem abaixo do mínimo).");
      return;
    }

    if (destino === "perdido") {
      const motivo = window.prompt("Motivo da perda:");
      if (!motivo) return;
      onMover(leadId, destino, motivo);
      return;
    }

    onMover(leadId, destino);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ETAPAS.map((etapa) => {
        const leadsDaColuna = leads.filter((l) => l.etapa === etapa.chave);
        return (
          <div
            key={etapa.chave}
            onDragOver={(e) => {
              e.preventDefault();
              setColunaSobre(etapa.chave);
            }}
            onDragLeave={() => setColunaSobre((atual) => (atual === etapa.chave ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              setColunaSobre(null);
              const leadId = e.dataTransfer.getData("text/plain");
              soltar(etapa.chave, leadId);
            }}
            className={`w-64 shrink-0 rounded-lg p-2 ${
              colunaSobre === etapa.chave ? "bg-marca-50" : "bg-neutral-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {etapa.rotulo}
              </h3>
              <span className="text-xs text-neutral-400">{leadsDaColuna.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {leadsDaColuna.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  arrastavel={podeArrastar(lead)}
                  onArrastar={() => {}}
                  mostrarPuxar={papel === "vendedor"}
                  onPuxar={onPuxar}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
