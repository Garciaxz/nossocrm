"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ETAPAS,
  ROTULO_AMBIENTE,
  ROTULO_TIPO_CLIENTE,
  type EtapaLead,
  type LeadCompleto,
  type PapelUsuario,
  type TipoAmbiente,
  type TipoCliente,
} from "@/lib/tipos";
import { atualizarDadosLead } from "@/app/(app)/leads/[id]/acoes";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500";
const classeRotulo = "mb-1 block text-xs font-medium text-neutral-500";

type Produto = { id: string; linha_id: string; modelo: string };

export function DadosLead({
  lead,
  papel,
  linhas,
  produtos,
  vendedores,
}: {
  lead: LeadCompleto;
  papel: PapelUsuario;
  linhas: { id: string; nome: string }[];
  produtos: Produto[];
  vendedores: { id: string; nome: string }[];
}) {
  const [nome, setNome] = useState(lead.nome ?? "");
  const [telefone, setTelefone] = useState(lead.telefone);
  const [bairro, setBairro] = useState(lead.bairro ?? "");
  const [linhaId, setLinhaId] = useState(lead.linha_id ?? "");
  const [produtoId, setProdutoId] = useState(lead.produto_id ?? "");
  const [metragem, setMetragem] = useState(lead.metragem_m2?.toString() ?? "");
  const [tipoAmbiente, setTipoAmbiente] = useState<TipoAmbiente>(lead.tipo_ambiente);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>(lead.tipo_cliente);
  const [valorEstimado, setValorEstimado] = useState(lead.valor_estimado?.toString() ?? "");
  const [responsavelId, setResponsavelId] = useState(lead.responsavel_id ?? "");
  const [etapa, setEtapa] = useState<EtapaLead>(lead.etapa);
  const [motivoPerda, setMotivoPerda] = useState(lead.motivo_perda ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const produtosDaLinha = useMemo(
    () => produtos.filter((p) => p.linha_id === linhaId),
    [produtos, linhaId]
  );

  const etapasDisponiveis = ETAPAS.filter(
    (e) => e.chave !== "medicao" || lead.elegivel_instalacao || lead.etapa === "medicao"
  );

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);

    if (etapa === "perdido" && !motivoPerda.trim()) {
      setErro("Motivo da perda é obrigatório pra marcar como perdido.");
      return;
    }

    setSalvando(true);
    try {
      await atualizarDadosLead(lead.id, {
        nome: nome.trim() || null,
        telefone: telefone.trim(),
        bairro: bairro.trim() || null,
        linha_id: linhaId || null,
        produto_id: produtoId || null,
        metragem_m2: metragem ? Number(metragem) : null,
        tipo_ambiente: tipoAmbiente,
        tipo_cliente: tipoCliente,
        valor_estimado: valorEstimado ? Number(valorEstimado) : null,
        responsavel_id: papel === "gerente" ? responsavelId || null : lead.responsavel_id,
        etapa,
        motivo_perda: etapa === "perdido" ? motivoPerda.trim() : null,
      });
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="rounded-lg border border-marca-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Dados</h2>

      <label className={classeRotulo}>Nome</label>
      <input value={nome} onChange={(e) => setNome(e.target.value)} className={`${classeCampo} mb-3`} />

      <label className={classeRotulo}>Telefone</label>
      <input
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        className={`${classeCampo} mb-3`}
      />

      <label className={classeRotulo}>Bairro</label>
      <input value={bairro} onChange={(e) => setBairro(e.target.value)} className={`${classeCampo} mb-3`} />

      <label className={classeRotulo}>Linha</label>
      <select
        value={linhaId}
        onChange={(e) => {
          setLinhaId(e.target.value);
          setProdutoId("");
        }}
        className={`${classeCampo} mb-3`}
      >
        <option value="">Não definida</option>
        {linhas.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </select>

      <label className={classeRotulo}>Produto</label>
      <select
        value={produtoId}
        onChange={(e) => setProdutoId(e.target.value)}
        disabled={!linhaId}
        className={`${classeCampo} mb-3`}
      >
        <option value="">Não definido</option>
        {produtosDaLinha.map((p) => (
          <option key={p.id} value={p.id}>
            {p.modelo}
          </option>
        ))}
      </select>

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

      <div className="mb-3 grid grid-cols-2 gap-3">
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
      </div>

      <label className={classeRotulo}>Responsável</label>
      <select
        value={responsavelId}
        onChange={(e) => setResponsavelId(e.target.value)}
        disabled={papel !== "gerente"}
        className={`${classeCampo} mb-3`}
      >
        <option value="">Sem responsável</option>
        {vendedores.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nome}
          </option>
        ))}
      </select>

      <label className={classeRotulo}>Etapa</label>
      <select
        value={etapa}
        onChange={(e) => setEtapa(e.target.value as EtapaLead)}
        className={`${classeCampo} mb-3`}
      >
        {etapasDisponiveis.map((e) => (
          <option key={e.chave} value={e.chave}>
            {e.rotulo}
          </option>
        ))}
      </select>

      {etapa === "perdido" && (
        <>
          <label className={classeRotulo}>Motivo da perda</label>
          <input
            value={motivoPerda}
            onChange={(e) => setMotivoPerda(e.target.value)}
            className={`${classeCampo} mb-3`}
          />
        </>
      )}

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      {ok && <p className="mb-3 text-sm text-emerald-600">Salvo.</p>}

      <button
        type="submit"
        disabled={salvando}
        className="w-full rounded-md bg-marca-800 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
