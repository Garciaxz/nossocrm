"use client";

import { useMemo, useState, type FormEvent } from "react";
import { moeda } from "@/lib/formato";
import { adicionarItem, removerItem } from "@/app/(app)/leads/[id]/orcamentos/[orcamentoId]/acoes";

type Produto = {
  id: string;
  modelo: string;
  m2_por_caixa: number | null;
  preco_m2: number | null;
  preco_unidade: number | null;
  unidade_venda: string;
};

type Item = {
  id: string;
  produto_id: string | null;
  descricao: string;
  metragem_m2: number | null;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  subtotal: number;
};

const PERDA_PADRAO = 10;

function caixasNecessarias(metragem: number, m2PorCaixa: number, perda = PERDA_PADRAO): number {
  return Math.ceil((metragem * (1 + perda / 100)) / m2PorCaixa);
}

export function TabelaItens({
  orcamentoId,
  leadId,
  itens,
  produtos,
  travado,
}: {
  orcamentoId: string;
  leadId: string;
  itens: Item[];
  produtos: Produto[];
  travado: boolean;
}) {
  const [produtoId, setProdutoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metragem, setMetragem] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [unidade, setUnidade] = useState("caixa");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const produto = useMemo(() => produtos.find((p) => p.id === produtoId) ?? null, [produtos, produtoId]);

  function aplicarProduto(id: string) {
    setProdutoId(id);
    const p = produtos.find((x) => x.id === id);
    if (!p) return;
    setDescricao(p.modelo);
    setUnidade(p.unidade_venda || "caixa");
    recalcular(metragem, p);
  }

  function aplicarMetragem(valor: string) {
    setMetragem(valor);
    recalcular(valor, produto);
  }

  function recalcular(metragemStr: string, p: Produto | null) {
    const m = Number(metragemStr);
    if (p?.m2_por_caixa && m > 0) {
      setQuantidade(String(caixasNecessarias(m, p.m2_por_caixa)));
    }
    if (p?.preco_m2 && p.m2_por_caixa) {
      setPrecoUnitario((p.preco_m2 * p.m2_por_caixa).toFixed(2));
    } else if (p?.preco_unidade) {
      setPrecoUnitario(p.preco_unidade.toFixed(2));
    }
  }

  function limpar() {
    setProdutoId("");
    setDescricao("");
    setMetragem("");
    setQuantidade("1");
    setUnidade("caixa");
    setPrecoUnitario("");
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!descricao.trim() || !quantidade || !precoUnitario) {
      setErro("Descrição, quantidade e preço unitário são obrigatórios.");
      return;
    }

    setSalvando(true);
    try {
      await adicionarItem(orcamentoId, leadId, {
        produtoId: produtoId || null,
        descricao: descricao.trim(),
        metragemM2: metragem ? Number(metragem) : null,
        quantidade: Number(quantidade),
        unidade,
        precoUnitario: Number(precoUnitario),
      });
      limpar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível adicionar o item.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(itemId: string) {
    await removerItem(itemId, orcamentoId, leadId);
  }

  const classeCampo =
    "rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-marca-600 focus:outline-none";

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-marca-50 text-left text-neutral-600">
            <tr>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Metragem</th>
              <th className="px-3 py-2">Qtd.</th>
              <th className="px-3 py-2">Unid.</th>
              <th className="px-3 py-2">Preço unit.</th>
              <th className="px-3 py-2">Subtotal</th>
              {!travado && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-t border-marca-50">
                <td className="px-3 py-2">{i.descricao}</td>
                <td className="px-3 py-2">{i.metragem_m2 ? `${i.metragem_m2} m²` : "—"}</td>
                <td className="px-3 py-2">{i.quantidade}</td>
                <td className="px-3 py-2">{i.unidade}</td>
                <td className="px-3 py-2">{moeda(i.preco_unitario)}</td>
                <td className="px-3 py-2 font-medium">{moeda(i.subtotal)}</td>
                {!travado && (
                  <td className="px-3 py-2">
                    <button onClick={() => remover(i.id)} className="text-xs text-red-600 hover:underline">
                      Remover
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!itens.length && (
              <tr>
                <td className="px-3 py-6 text-center text-neutral-400" colSpan={7}>
                  Nenhum item ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!travado && (
        <form onSubmit={adicionar} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-marca-200 p-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Produto</label>
            <select value={produtoId} onChange={(e) => aplicarProduto(e.target.value)} className={classeCampo}>
              <option value="">Item avulso</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.modelo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={`${classeCampo} w-40`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Metragem (m²)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={metragem}
              onChange={(e) => aplicarMetragem(e.target.value)}
              className={`${classeCampo} w-24`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Qtd.</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className={`${classeCampo} w-20`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Unidade</label>
            <input value={unidade} onChange={(e) => setUnidade(e.target.value)} className={`${classeCampo} w-20`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Preço unit.</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precoUnitario}
              onChange={(e) => setPrecoUnitario(e.target.value)}
              className={`${classeCampo} w-28`}
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {salvando ? "Adicionando..." : "Adicionar"}
          </button>
          {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
        </form>
      )}
    </div>
  );
}
