"use client";

import { useState, type FormEvent } from "react";
import { ROTULO_ORIGEM, type OrigemLead } from "@/lib/tipos";
import { lancarInvestimento } from "@/app/(app)/relatorios/acoes";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";
const classeRotulo = "mb-1 block text-sm font-medium text-neutral-700";

function primeiroDiaDoMesAtual(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`;
}

export function LancarInvestimentoModal({ onFechar }: { onFechar: () => void }) {
  const [canal, setCanal] = useState<OrigemLead>("meta_ads");
  const [mes, setMes] = useState(primeiroDiaDoMesAtual().slice(0, 7));
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!valor) {
      setErro("Valor é obrigatório.");
      return;
    }

    setSalvando(true);
    try {
      await lancarInvestimento({
        canal,
        referencia: `${mes}-01`,
        valor: Number(valor),
        observacao: observacao.trim(),
      });
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={salvar} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-marca-900">Lançar investimento em mídia</h2>

        <label className={classeRotulo}>Canal</label>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value as OrigemLead)}
          className={`${classeCampo} mb-3`}
        >
          {Object.entries(ROTULO_ORIGEM).map(([chave, rotulo]) => (
            <option key={chave} value={chave}>
              {rotulo}
            </option>
          ))}
        </select>

        <label className={classeRotulo}>Mês</label>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Valor investido</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Observação</label>
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className={`${classeCampo} mb-3`}
        />

        {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-marca-800 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
