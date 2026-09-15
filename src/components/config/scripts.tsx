"use client";

import { useState } from "react";
import { criarCliente } from "@/lib/supabase/cliente";

type Script = { id: string; chave: string; titulo: string; conteudo: string; ativo: boolean };

export function Scripts({ scriptsIniciais }: { scriptsIniciais: Script[] }) {
  const [scripts, setScripts] = useState(scriptsIniciais);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  async function salvar(id: string, dados: Partial<Script>) {
    setScripts((atual) => atual.map((s) => (s.id === id ? { ...s, ...dados } : s)));
    setSalvandoId(id);
    const supabase = criarCliente();
    await supabase.from("scripts_mensagem").update(dados).eq("id", id);
    setSalvandoId(null);
  }

  return (
    <div className="space-y-3">
      {scripts.map((s) => (
        <div key={s.id} className="rounded-lg border border-marca-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-neutral-400">{s.chave}</span>
              <input
                defaultValue={s.titulo}
                onBlur={(e) => salvar(s.id, { titulo: e.target.value })}
                className="ml-2 rounded border border-transparent px-1 text-sm font-semibold text-marca-900 hover:border-neutral-300 focus:border-marca-600 focus:outline-none"
              />
            </div>
            <button
              onClick={() => salvar(s.id, { ativo: !s.ativo })}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                s.ativo ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {s.ativo ? "Ativo" : "Inativo"}
            </button>
          </div>
          <textarea
            defaultValue={s.conteudo}
            onBlur={(e) => salvar(s.id, { conteudo: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none"
          />
          {salvandoId === s.id && <p className="mt-1 text-xs text-neutral-400">Salvando...</p>}
        </div>
      ))}
      {!scripts.length && <p className="text-sm text-neutral-400">Nenhum script cadastrado.</p>}
    </div>
  );
}
