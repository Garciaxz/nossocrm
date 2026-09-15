"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { criarCliente } from "@/lib/supabase/cliente";
import type { EtapaLead, LeadCompleto, PapelUsuario } from "@/lib/tipos";
import { Kanban } from "@/components/leads/kanban";
import { TabelaLeads } from "@/components/leads/tabela-leads";
import { FiltrosLeads, FILTROS_VAZIOS, type Filtros } from "@/components/leads/filtros-leads";
import { CriarLeadModal } from "@/components/leads/criar-lead-modal";

export function LeadsClient({
  leadsIniciais,
  linhas,
  vendedores,
  papel,
  meuId,
}: {
  leadsIniciais: LeadCompleto[];
  linhas: { id: string; nome: string }[];
  vendedores: { id: string; nome: string }[];
  papel: PapelUsuario;
  meuId: string;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadsIniciais);
  useEffect(() => setLeads(leadsIniciais), [leadsIniciais]);

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [modo, setModo] = useState<"kanban" | "tabela">("kanban");
  const [criarAberto, setCriarAberto] = useState(false);

  const leadsFiltrados = useMemo(() => {
    const buscaNorm = filtros.busca.trim().toLowerCase();
    const buscaDigitos = filtros.busca.replace(/\D/g, "");

    return leads.filter((l) => {
      if (buscaNorm) {
        const nomeOk = !!l.nome?.toLowerCase().includes(buscaNorm);
        const telOk = !!buscaDigitos && l.telefone.includes(buscaDigitos);
        if (!nomeOk && !telOk) return false;
      }
      if (filtros.linhaId && l.linha_id !== filtros.linhaId) return false;
      if (filtros.origem && l.origem !== filtros.origem) return false;
      if (filtros.responsavelId === "sem_dono" && l.responsavel_id) return false;
      if (
        filtros.responsavelId &&
        filtros.responsavelId !== "sem_dono" &&
        l.responsavel_id !== filtros.responsavelId
      )
        return false;
      if (filtros.bairro && !l.bairro?.toLowerCase().includes(filtros.bairro.toLowerCase())) return false;
      if (filtros.de && l.criado_em < filtros.de) return false;
      if (filtros.ate && l.criado_em > `${filtros.ate}T23:59:59`) return false;
      return true;
    });
  }, [leads, filtros]);

  async function aplicarAtualizacao(leadId: string, atualizacao: Partial<LeadCompleto>) {
    setLeads((atual) => atual.map((l) => (l.id === leadId ? { ...l, ...atualizacao } : l)));

    const supabase = criarCliente();
    const { error } = await supabase.from("leads").update(atualizacao).eq("id", leadId);
    if (error) {
      alert("Não foi possível salvar: " + error.message);
      router.refresh();
    }
  }

  function moverEtapa(leadId: string, novaEtapa: EtapaLead, motivoPerda?: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const atualizacao: Partial<LeadCompleto> = { etapa: novaEtapa };
    if (motivoPerda) atualizacao.motivo_perda = motivoPerda;
    if (papel === "vendedor" && !lead.responsavel_id) atualizacao.responsavel_id = meuId;

    aplicarAtualizacao(leadId, atualizacao);
  }

  function puxarLead(leadId: string) {
    aplicarAtualizacao(leadId, { responsavel_id: meuId });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-marca-900">Leads</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-neutral-300 text-sm">
            <button
              onClick={() => setModo("kanban")}
              className={`rounded-l-md px-3 py-1.5 ${modo === "kanban" ? "bg-marca-800 text-white" : "hover:bg-neutral-50"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setModo("tabela")}
              className={`rounded-r-md border-l border-neutral-300 px-3 py-1.5 ${modo === "tabela" ? "bg-marca-800 text-white" : "hover:bg-neutral-50"}`}
            >
              Tabela
            </button>
          </div>
          <button
            onClick={() => setCriarAberto(true)}
            className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900"
          >
            Novo lead
          </button>
        </div>
      </div>

      <FiltrosLeads filtros={filtros} onMudar={setFiltros} linhas={linhas} vendedores={vendedores} />

      {modo === "kanban" ? (
        <Kanban leads={leadsFiltrados} papel={papel} meuId={meuId} onMover={moverEtapa} onPuxar={puxarLead} />
      ) : (
        <TabelaLeads leads={leadsFiltrados} />
      )}

      <CriarLeadModal
        aberto={criarAberto}
        onFechar={() => setCriarAberto(false)}
        onCriado={() => router.refresh()}
        linhas={linhas}
        vendedores={vendedores}
        papel={papel}
        meuId={meuId}
      />
    </div>
  );
}
