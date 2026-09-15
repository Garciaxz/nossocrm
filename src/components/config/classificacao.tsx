"use client";

import { useState, type FormEvent } from "react";
import { criarCliente } from "@/lib/supabase/cliente";
import { ROTULO_ORIGEM, type OrigemLead } from "@/lib/tipos";

type Regra = {
  id: string;
  termo: string;
  linha_id: string | null;
  origem_sugerida: OrigemLead | null;
  peso: number;
  exige_isolado: boolean;
  ativo: boolean;
};

export function Classificacao({
  regrasIniciais,
  linhas,
}: {
  regrasIniciais: Regra[];
  linhas: { id: string; nome: string }[];
}) {
  const [regras, setRegras] = useState(regrasIniciais);
  const [termo, setTermo] = useState("");
  const [linhaId, setLinhaId] = useState(linhas[0]?.id ?? "");
  const [origemSugerida, setOrigemSugerida] = useState<OrigemLead | "">("");
  const [peso, setPeso] = useState("10");
  const [exigeIsolado, setExigeIsolado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeLinha = new Map(linhas.map((l) => [l.id, l.nome]));

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!termo.trim()) {
      setErro("Termo é obrigatório.");
      return;
    }

    const supabase = criarCliente();
    const { data, error } = await supabase
      .from("regras_classificacao")
      .insert({
        termo: termo.trim().toUpperCase(),
        linha_id: linhaId || null,
        origem_sugerida: origemSugerida || null,
        peso: Number(peso) || 10,
        exige_isolado: exigeIsolado,
      })
      .select("*")
      .single();

    if (error) {
      setErro(error.message);
      return;
    }

    setRegras((atual) => [data as Regra, ...atual]);
    setTermo("");
    setPeso("10");
    setExigeIsolado(false);
  }

  async function alternarAtivo(id: string) {
    const regra = regras.find((r) => r.id === id);
    if (!regra) return;
    const novoValor = !regra.ativo;
    setRegras((atual) => atual.map((r) => (r.id === id ? { ...r, ativo: novoValor } : r)));
    const supabase = criarCliente();
    await supabase.from("regras_classificacao").update({ ativo: novoValor }).eq("id", id);
  }

  const classeCampo =
    "rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-marca-600 focus:outline-none";

  return (
    <div>
      <form onSubmit={adicionar} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-marca-200 p-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Termo</label>
          <input value={termo} onChange={(e) => setTermo(e.target.value)} className={`${classeCampo} w-32`} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Linha</label>
          <select value={linhaId} onChange={(e) => setLinhaId(e.target.value)} className={classeCampo}>
            {linhas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Origem sugerida</label>
          <select
            value={origemSugerida}
            onChange={(e) => setOrigemSugerida(e.target.value as OrigemLead)}
            className={classeCampo}
          >
            <option value="">Nenhuma</option>
            {Object.entries(ROTULO_ORIGEM).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Peso</label>
          <input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className={`${classeCampo} w-16`}
          />
        </div>
        <label className="flex items-center gap-1 text-xs text-neutral-600">
          <input type="checkbox" checked={exigeIsolado} onChange={(e) => setExigeIsolado(e.target.checked)} />
          Exige palavra isolada
        </label>
        <button
          type="submit"
          className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900"
        >
          Adicionar termo
        </button>
        {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-marca-50 text-left text-neutral-600">
            <tr>
              <th className="px-3 py-2">Termo</th>
              <th className="px-3 py-2">Linha</th>
              <th className="px-3 py-2">Origem sugerida</th>
              <th className="px-3 py-2">Peso</th>
              <th className="px-3 py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {regras.map((r) => (
              <tr key={r.id} className="border-t border-marca-50">
                <td className="px-3 py-2 font-mono">{r.termo}</td>
                <td className="px-3 py-2">{r.linha_id ? nomeLinha.get(r.linha_id) : "—"}</td>
                <td className="px-3 py-2">{r.origem_sugerida ? ROTULO_ORIGEM[r.origem_sugerida] : "—"}</td>
                <td className="px-3 py-2">{r.peso}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => alternarAtivo(r.id)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.ativo ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {r.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
