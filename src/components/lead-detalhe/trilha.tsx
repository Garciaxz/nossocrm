"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Atividade, Medicao, Orcamento } from "@/lib/tipos";
import { ROTULO_STATUS_MEDICAO, ROTULO_STATUS_ORCAMENTO } from "@/lib/tipos";
import { dataHora, moeda } from "@/lib/formato";
import { adicionarNota, atualizarMedicao } from "@/app/(app)/leads/[id]/acoes";
import { criarOrcamento } from "@/app/(app)/leads/[id]/orcamentos/[orcamentoId]/acoes";
import { AgendarMedicaoModal } from "./agendar-medicao-modal";

export function Trilha({
  leadId,
  atividades,
  medicoes,
  orcamentos,
  elegivelInstalacao,
  enderecoSugerido,
}: {
  leadId: string;
  atividades: Atividade[];
  medicoes: Medicao[];
  orcamentos: Orcamento[];
  elegivelInstalacao: boolean;
  enderecoSugerido: string;
}) {
  const router = useRouter();
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [criandoOrcamento, setCriandoOrcamento] = useState(false);

  async function novoOrcamento() {
    setCriandoOrcamento(true);
    try {
      const orcamentoId = await criarOrcamento(leadId);
      router.push(`/leads/${leadId}/orcamentos/${orcamentoId}`);
    } finally {
      setCriandoOrcamento(false);
    }
  }

  async function salvarNota(e: FormEvent) {
    e.preventDefault();
    if (!nota.trim()) return;
    setEnviando(true);
    try {
      await adicionarNota(leadId, nota.trim());
      setNota("");
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatusMedicao(medicaoId: string, status: string) {
    let metragemAferida: number | undefined;
    if (status === "realizada") {
      const valor = window.prompt("Metragem aferida (m²), opcional:");
      if (valor) metragemAferida = Number(valor);
    }
    await atualizarMedicao(medicaoId, leadId, { status, metragemAferida });
  }

  return (
    <div className="rounded-lg border border-marca-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Trilha</h2>

      <form onSubmit={salvarNota} className="mb-4 flex gap-2">
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Adicionar nota"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando || !nota.trim()}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      {!!medicoes.length && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Medições</h3>
          <ul className="space-y-2">
            {medicoes.map((m) => (
              <li key={m.id} className="rounded-md bg-neutral-50 p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-marca-900">{dataHora(m.agendada_para)}</p>
                  <select
                    value={m.status}
                    onChange={(e) => mudarStatusMedicao(m.id, e.target.value)}
                    className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs"
                  >
                    {Object.entries(ROTULO_STATUS_MEDICAO).map(([chave, rotulo]) => (
                      <option key={chave} value={chave}>
                        {rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-neutral-600">{m.endereco}</p>
                {m.metragem_aferida != null && (
                  <p className="text-xs text-neutral-500">Aferido: {m.metragem_aferida} m²</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {elegivelInstalacao && (
        <button
          onClick={() => setModalAberto(true)}
          className="mb-4 w-full rounded-md border border-marca-200 py-2 text-sm font-medium text-marca-800 hover:bg-marca-50"
        >
          Agendar medição
        </button>
      )}

      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Orçamentos</h3>
        {!!orcamentos.length && (
          <ul className="mb-2 space-y-2">
            {orcamentos.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/leads/${leadId}/orcamentos/${o.id}`}
                  className="block rounded-md bg-neutral-50 p-2 text-sm hover:bg-marca-50"
                >
                  <p className="font-medium text-marca-900">
                    #{o.numero} · {ROTULO_STATUS_ORCAMENTO[o.status]}
                  </p>
                  <p className="text-neutral-600">{moeda(o.valor_total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={novoOrcamento}
          disabled={criandoOrcamento}
          className="w-full rounded-md border border-marca-200 py-2 text-sm font-medium text-marca-800 hover:bg-marca-50 disabled:opacity-50"
        >
          {criandoOrcamento ? "Criando..." : "Novo orçamento"}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Atividades</h3>
        <ul className="space-y-2">
          {atividades.map((a) => (
            <li key={a.id} className="text-sm">
              <p className="text-neutral-700">{a.descricao}</p>
              <p className="text-xs text-neutral-400">{dataHora(a.criado_em)}</p>
            </li>
          ))}
          {!atividades.length && <p className="text-sm text-neutral-400">Nenhuma atividade ainda.</p>}
        </ul>
      </div>

      {modalAberto && (
        <AgendarMedicaoModal
          leadId={leadId}
          enderecoSugerido={enderecoSugerido}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
