"use client";

import { useState, type FormEvent } from "react";
import { criarCliente } from "@/lib/supabase/cliente";
import type { PapelUsuario, Perfil } from "@/lib/tipos";

const ROTULO_PAPEL: Record<PapelUsuario, string> = {
  gerente: "Gerente",
  vendedor: "Vendedor",
  diretoria: "Diretoria",
};

export function Usuarios({ perfisIniciais }: { perfisIniciais: Perfil[] }) {
  const [perfis, setPerfis] = useState(perfisIniciais);
  const [modalAberto, setModalAberto] = useState(false);

  async function atualizar(id: string, dados: Partial<Perfil>) {
    setPerfis((atual) => atual.map((p) => (p.id === id ? { ...p, ...dados } : p)));
    const supabase = criarCliente();
    await supabase.from("perfis").update(dados).eq("id", id);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setModalAberto(true)}
          className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900"
        >
          Criar usuário
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-marca-50 text-left text-neutral-600">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Rodízio</th>
              <th className="px-3 py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {perfis.map((p) => (
              <tr key={p.id} className="border-t border-marca-50">
                <td className="px-3 py-2">{p.nome}</td>
                <td className="px-3 py-2">{p.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={p.papel}
                    onChange={(e) => atualizar(p.id, { papel: e.target.value as PapelUsuario })}
                    className="rounded border border-neutral-300 px-1.5 py-1 text-sm"
                  >
                    {Object.entries(ROTULO_PAPEL).map(([chave, rotulo]) => (
                      <option key={chave} value={chave}>
                        {rotulo}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={p.recebe_rodizio}
                    onChange={(e) => atualizar(p.id, { recebe_rodizio: e.target.checked })}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => atualizar(p.id, { ativo: !p.ativo })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.ativo ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <CriarUsuarioModal
          onFechar={() => setModalAberto(false)}
          onCriado={(novo) => setPerfis((atual) => [...atual, novo])}
        />
      )}
    </div>
  );
}

function CriarUsuarioModal({
  onFechar,
  onCriado,
}: {
  onFechar: () => void;
  onCriado: (perfil: Perfil) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<PapelUsuario>("vendedor");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const classeCampo =
    "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const r = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, papel }),
    });
    const corpo = await r.json();

    if (!r.ok) {
      setErro(corpo.erro ?? "Não foi possível criar o usuário.");
      setSalvando(false);
      return;
    }

    onCriado({
      id: corpo.id,
      nome,
      email,
      papel,
      telefone: null,
      ativo: true,
      recebe_rodizio: true,
    });
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={salvar} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-marca-900">Criar usuário</h2>

        <label className="mb-1 block text-sm font-medium text-neutral-700">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required className={`${classeCampo} mb-3`} />

        <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700">Senha provisória</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          className={`${classeCampo} mb-3`}
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700">Papel</label>
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as PapelUsuario)}
          className={`${classeCampo} mb-3`}
        >
          <option value="vendedor">Vendedor</option>
          <option value="gerente">Gerente</option>
          <option value="diretoria">Diretoria</option>
        </select>

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
            {salvando ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}
