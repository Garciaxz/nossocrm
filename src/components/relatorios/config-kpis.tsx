"use client";

import { useState } from "react";
import { KPIS_DISPONIVEIS, type KpiChave } from "@/lib/tipos";
import { alternarKpi } from "@/app/(app)/relatorios/acoes";

export function ConfigKpis({
  preferencias,
  onFechar,
}: {
  preferencias: Partial<Record<KpiChave, boolean>>;
  onFechar: () => void;
}) {
  const [estado, setEstado] = useState(preferencias);

  async function alternar(chave: KpiChave) {
    const novoValor = !(estado[chave] ?? true);
    setEstado((atual) => ({ ...atual, [chave]: novoValor }));
    await alternarKpi(chave, novoValor);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-marca-900">KPIs visíveis</h2>
          <button onClick={onFechar} className="text-sm text-neutral-500 hover:text-marca-800">
            Fechar
          </button>
        </div>
        <ul className="space-y-2">
          {KPIS_DISPONIVEIS.map((k) => (
            <li key={k.chave} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{k.rotulo}</span>
              <input
                type="checkbox"
                checked={estado[k.chave] ?? true}
                onChange={() => alternar(k.chave)}
                className="h-4 w-4"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
