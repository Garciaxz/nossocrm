"use client";

import { useState, type FormEvent } from "react";
import { criarCliente } from "@/lib/supabase/cliente";
import { AMBIENTES_BIBLIOTECA, type AmbienteBiblioteca } from "@/lib/tipos";

const classeCampo =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none";
const classeRotulo = "mb-1 block text-sm font-medium text-neutral-700";

export function UploadMidiaModal({
  linhas,
  onFechar,
  onEnviado,
}: {
  linhas: { id: string; nome: string }[];
  onFechar: () => void;
  onEnviado: () => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [linhaId, setLinhaId] = useState("");
  const [ambiente, setAmbiente] = useState<AmbienteBiblioteca | "">("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!arquivo) {
      setErro("Escolha um arquivo.");
      return;
    }

    setEnviando(true);
    const supabase = criarCliente();

    const extensao = arquivo.name.split(".").pop();
    const caminho = `${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage.from("biblioteca").upload(caminho, arquivo);
    if (erroUpload) {
      setErro("Falha no upload: " + erroUpload.message);
      setEnviando(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("biblioteca").getPublicUrl(caminho);

    const { error: erroInsert } = await supabase.from("biblioteca_midia").insert({
      titulo: titulo.trim() || arquivo.name,
      url: publicUrl,
      mime: arquivo.type,
      linha_id: linhaId || null,
      ambiente: ambiente || null,
    });

    setEnviando(false);

    if (erroInsert) {
      setErro("Falha ao salvar: " + erroInsert.message);
      return;
    }

    onEnviado();
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-marca-900">Enviar mídia</h2>

        <label className={classeRotulo}>Arquivo *</label>
        <input
          type="file"
          accept="image/*,video/*,application/pdf"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          required
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Título</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={arquivo?.name}
          className={`${classeCampo} mb-3`}
        />

        <label className={classeRotulo}>Linha</label>
        <select value={linhaId} onChange={(e) => setLinhaId(e.target.value)} className={`${classeCampo} mb-3`}>
          <option value="">Todas as linhas</option>
          {linhas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>

        <label className={classeRotulo}>Ambiente</label>
        <select
          value={ambiente}
          onChange={(e) => setAmbiente(e.target.value as AmbienteBiblioteca)}
          className={`${classeCampo} mb-3`}
        >
          <option value="">Não definido</option>
          {AMBIENTES_BIBLIOTECA.map((a) => (
            <option key={a.chave} value={a.chave}>
              {a.rotulo}
            </option>
          ))}
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
            disabled={enviando}
            className="rounded-md bg-marca-800 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
