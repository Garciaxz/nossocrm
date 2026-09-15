"use client";

import { useState, type FormEvent } from "react";
import type { Orcamento } from "@/lib/tipos";
import { ROTULO_STATUS_ORCAMENTO } from "@/lib/tipos";
import { moeda } from "@/lib/formato";
import { atualizarOrcamento } from "@/app/(app)/leads/[id]/orcamentos/[orcamentoId]/acoes";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";
const classeRotulo = "mb-1 block text-xs font-medium text-neutral-500";

export function CabecalhoOrcamento({ orcamento, leadId }: { orcamento: Orcamento; leadId: string }) {
  const [valorInstalacao, setValorInstalacao] = useState(orcamento.valor_instalacao.toString());
  const [desconto, setDesconto] = useState(orcamento.desconto.toString());
  const [validadeDias, setValidadeDias] = useState(orcamento.validade_dias.toString());
  const [status, setStatus] = useState(orcamento.status);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    setSalvando(true);
    try {
      await atualizarOrcamento(orcamento.id, leadId, {
        valorInstalacao: Number(valorInstalacao) || 0,
        desconto: Number(desconto) || 0,
        validadeDias: Number(validadeDias) || 15,
        status,
      });
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mb-4 rounded-lg border border-marca-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-marca-900">Orçamento #{orcamento.numero}</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={classeCampo}
          style={{ width: "auto" }}
        >
          {Object.entries(ROTULO_STATUS_ORCAMENTO).map(([chave, rotulo]) => (
            <option key={chave} value={chave}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={classeRotulo}>Instalação (fechado)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={valorInstalacao}
            onChange={(e) => setValorInstalacao(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label className={classeRotulo}>Desconto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label className={classeRotulo}>Validade (dias)</label>
          <input
            type="number"
            min="1"
            value={validadeDias}
            onChange={(e) => setValidadeDias(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label className={classeRotulo}>Materiais (dos itens)</label>
          <p className="rounded-md border border-transparent px-3 py-2 text-sm text-neutral-700">
            {moeda(orcamento.valor_materiais)}
          </p>
        </div>
      </div>

      <div className="mb-3 rounded-md bg-marca-50 p-3 text-sm">
        <span className="text-neutral-600">Total: </span>
        <span className="font-semibold text-marca-900">{moeda(orcamento.valor_total)}</span>
      </div>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      {ok && <p className="mb-3 text-sm text-emerald-600">Salvo.</p>}

      <button
        type="submit"
        disabled={salvando}
        className="rounded-md bg-marca-800 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
