"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { criarCliente } from "@/lib/supabase/cliente";
import { AMBIENTES_BIBLIOTECA, type AmbienteBiblioteca, type MidiaBiblioteca } from "@/lib/tipos";
import { UploadMidiaModal } from "@/components/biblioteca/upload-midia-modal";

function caminhoDoStorage(url: string): string | null {
  const marcador = "/biblioteca/";
  const i = url.indexOf(marcador);
  return i === -1 ? null : url.slice(i + marcador.length);
}

export function BibliotecaClient({
  midiasIniciais,
  linhas,
}: {
  midiasIniciais: (MidiaBiblioteca & { linha_nome: string | null })[];
  linhas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [midias, setMidias] = useState(midiasIniciais);
  useEffect(() => setMidias(midiasIniciais), [midiasIniciais]);
  const [linhaId, setLinhaId] = useState("");
  const [ambiente, setAmbiente] = useState<AmbienteBiblioteca | "">("");
  const [uploadAberto, setUploadAberto] = useState(false);

  const midiasFiltradas = useMemo(
    () =>
      midias.filter((m) => {
        if (linhaId && m.linha_id !== linhaId) return false;
        if (ambiente && m.ambiente !== ambiente) return false;
        return true;
      }),
    [midias, linhaId, ambiente]
  );

  async function remover(m: MidiaBiblioteca) {
    if (!confirm(`Remover "${m.titulo}"?`)) return;

    const supabase = criarCliente();
    await supabase.from("biblioteca_midia").delete().eq("id", m.id);

    const caminho = caminhoDoStorage(m.url);
    if (caminho) await supabase.storage.from("biblioteca").remove([caminho]);

    setMidias((atual) => atual.filter((x) => x.id !== m.id));
  }

  const classeCampo =
    "rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-marca-600 focus:outline-none";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-marca-900">Biblioteca</h1>
        <button
          onClick={() => setUploadAberto(true)}
          className="rounded-md bg-marca-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-900"
        >
          Enviar mídia
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={linhaId} onChange={(e) => setLinhaId(e.target.value)} className={classeCampo}>
          <option value="">Todas as linhas</option>
          {linhas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <select
          value={ambiente}
          onChange={(e) => setAmbiente(e.target.value as AmbienteBiblioteca)}
          className={classeCampo}
        >
          <option value="">Todos os ambientes</option>
          {AMBIENTES_BIBLIOTECA.map((a) => (
            <option key={a.chave} value={a.chave}>
              {a.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {midiasFiltradas.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-lg border border-marca-200 bg-white">
            {m.mime?.startsWith("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.titulo} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                {m.mime?.startsWith("video") ? "Vídeo" : "Arquivo"}
              </div>
            )}
            <div className="p-2">
              <p className="line-clamp-1 text-sm font-medium text-marca-900">{m.titulo}</p>
              <p className="text-xs text-neutral-500">
                {m.linha_nome ?? "Todas as linhas"}
                {m.ambiente && ` · ${m.ambiente}`}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Enviada {m.vezes_enviada}x</span>
                <button onClick={() => remover(m)} className="text-xs text-red-600 hover:underline">
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
        {!midiasFiltradas.length && (
          <p className="col-span-full text-sm text-neutral-400">Nenhuma mídia encontrada.</p>
        )}
      </div>

      {uploadAberto && (
        <UploadMidiaModal
          linhas={linhas}
          onFechar={() => setUploadAberto(false)}
          onEnviado={() => router.refresh()}
        />
      )}
    </div>
  );
}
