"use client";

import { useState } from "react";
import { criarCliente } from "@/lib/supabase/cliente";

type ProdutoCatalogo = {
  id: string;
  linha_id: string;
  modelo: string;
  codigo: string | null;
  preco_m2: number | null;
  preco_unidade: number | null;
};

export function Catalogo({
  produtosIniciais,
  linhas,
}: {
  produtosIniciais: ProdutoCatalogo[];
  linhas: { id: string; nome: string }[];
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const nomeLinha = new Map(linhas.map((l) => [l.id, l.nome]));

  async function salvarPreco(id: string, campo: "preco_m2" | "preco_unidade", valor: string) {
    const numerico = valor === "" ? null : Number(valor);
    setProdutos((atual) => atual.map((p) => (p.id === id ? { ...p, [campo]: numerico } : p)));
    const supabase = criarCliente();
    await supabase.from("produtos").update({ [campo]: numerico }).eq("id", id);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-marca-50 text-left text-neutral-600">
          <tr>
            <th className="px-3 py-2">Linha</th>
            <th className="px-3 py-2">Produto</th>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Preço / m²</th>
            <th className="px-3 py-2">Preço / unidade</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-t border-marca-50">
              <td className="px-3 py-2">{nomeLinha.get(p.linha_id) ?? "—"}</td>
              <td className="px-3 py-2">{p.modelo}</td>
              <td className="px-3 py-2">{p.codigo ?? "—"}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={p.preco_m2 ?? ""}
                  onBlur={(e) => salvarPreco(p.id, "preco_m2", e.target.value)}
                  placeholder="—"
                  className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={p.preco_unidade ?? ""}
                  onBlur={(e) => salvarPreco(p.id, "preco_unidade", e.target.value)}
                  placeholder="—"
                  className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
                />
              </td>
            </tr>
          ))}
          {!produtos.length && (
            <tr>
              <td className="px-3 py-6 text-center text-neutral-400" colSpan={5}>
                Nenhum produto cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
