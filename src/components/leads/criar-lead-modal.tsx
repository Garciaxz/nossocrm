"use client";

import { useState, type FormEvent } from "react";
import { criarCliente } from "@/lib/supabase/cliente";
import {
  ROTULO_TIPO_CLIENTE,
  ROTULO_AMBIENTE,
  type TipoCliente,
  type TipoAmbiente,
  type PapelUsuario,
} from "@/lib/tipos";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";
const classeRotulo = "mb-1 block text-sm font-medium text-neutral-700";

export function CriarLeadModal({
  aberto,
  onFechar,
  onCriado,
  linhas,
  vendedores,
  papel,
  meuId,
}: {
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
  linhas: { id: string; nome: string }[];
  vendedores: { id: string; nome: string }[];
  papel: PapelUsuario;
  meuId: string;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [linhaId, setLinhaId] = useState("");
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("nao_definido");
  const [tipoAmbiente, setTipoAmbiente] = useState<TipoAmbiente>("nao_definido");
  const [metragem, setMetragem] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  function limpar() {
    setNome("");
    setTelefone("");
    setBairro("");
    setLinhaId("");
    setTipoCliente("nao_definido");
    setTipoAmbiente("nao_definido");
    setMetragem("");
    setValorEstimado("");
    setResponsavelId("");
    setErro(null);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!telefone.trim()) {
      setErro("Telefone é obrigatório.");
      return;
    }

    setSalvando(true);
    const supabase = criarCliente();

    const { error } = await supabase.from("leads").insert({
      nome: nome.trim() || null,
      telefone: telefone.trim(),
      bairro: bairro.trim() || null,
      linha_id: linhaId || null,
      tipo_cliente: tipoCliente,
      tipo_ambiente: tipoAmbiente,
      metragem_m2: metragem ? Number(metragem) : null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      responsavel_id: papel === "vendedor" ? meuId : responsavelId || null,
      origem: "direto",
      etapa: "novo",
    });

    setSalvando(false);

    if (error) {
      setErro(
        error.message.includes("idx_leads_telefone")
          ? "Já existe um lead com esse telefone."
          : "Não foi possível criar o lead. Confira o telefone."
      );
      return;
    }

    limpar();
    onCriado();
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={salvar}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-sm font-semibold text-marca-900">Novo lead</h2>

        <label className={classeRotulo}>Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className={`${classeCampo} mb-3`} />

        <label className={classeRotulo}>Telefone *</label>
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(91) 98058-4728"
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Bairro</label>
        <input value={bairro} onChange={(e) => setBairro(e.target.value)} className={`${classeCampo} mb-3`} />

        <label className={classeRotulo}>Linha</label>
        <select value={linhaId} onChange={(e) => setLinhaId(e.target.value)} className={`${classeCampo} mb-3`}>
          <option value="">Não definida</option>
          {linhas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={classeRotulo}>Tipo de cliente</label>
            <select
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value as TipoCliente)}
              className={classeCampo}
            >
              {Object.entries(ROTULO_TIPO_CLIENTE).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={classeRotulo}>Ambiente</label>
            <select
              value={tipoAmbiente}
              onChange={(e) => setTipoAmbiente(e.target.value as TipoAmbiente)}
              className={classeCampo}
            >
              {Object.entries(ROTULO_AMBIENTE).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={classeRotulo}>Metragem (m²)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={metragem}
              onChange={(e) => setMetragem(e.target.value)}
              className={classeCampo}
            />
          </div>
          <div>
            <label className={classeRotulo}>Valor estimado</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(e.target.value)}
              className={classeCampo}
            />
          </div>
        </div>

        {papel === "gerente" && (
          <div className="mb-3">
            <label className={classeRotulo}>Responsável</label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className={classeCampo}
            >
              <option value="">Sem responsável</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              limpar();
              onFechar();
            }}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-marca-800 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Criar lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
