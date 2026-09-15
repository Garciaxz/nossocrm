"use client";

import { useState, type FormEvent } from "react";
import { agendarMedicao } from "@/app/(app)/leads/[id]/acoes";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";
const classeRotulo = "mb-1 block text-sm font-medium text-neutral-700";

export function AgendarMedicaoModal({
  leadId,
  enderecoSugerido,
  onFechar,
}: {
  leadId: string;
  enderecoSugerido: string;
  onFechar: () => void;
}) {
  const [agendadaPara, setAgendadaPara] = useState("");
  const [endereco, setEndereco] = useState(enderecoSugerido);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelTelefone, setResponsavelTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!agendadaPara || !endereco.trim()) {
      setErro("Data e endereço são obrigatórios.");
      return;
    }

    setSalvando(true);
    try {
      await agendarMedicao(leadId, {
        agendadaPara: new Date(agendadaPara).toISOString(),
        endereco: endereco.trim(),
        responsavelNome: responsavelNome.trim(),
        responsavelTelefone: responsavelTelefone.trim(),
      });
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível agendar.");
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={salvar} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-marca-900">Agendar medição</h2>

        <label className={classeRotulo}>Data e hora *</label>
        <input
          type="datetime-local"
          value={agendadaPara}
          onChange={(e) => setAgendadaPara(e.target.value)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Endereço *</label>
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Medidor (nome)</label>
        <input
          value={responsavelNome}
          onChange={(e) => setResponsavelNome(e.target.value)}
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Medidor (telefone)</label>
        <input
          value={responsavelTelefone}
          onChange={(e) => setResponsavelTelefone(e.target.value)}
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
            {salvando ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </form>
    </div>
  );
}
