"use client";

type Midia = { id: string; titulo: string; url: string; mime: string | null };

export function SeletorMidia({
  midias,
  onFechar,
  onEscolher,
}: {
  midias: Midia[];
  onFechar: () => void;
  onEscolher: (midiaId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-marca-900">Enviar mídia da biblioteca</h2>
          <button onClick={onFechar} className="text-sm text-neutral-500 hover:text-marca-800">
            Fechar
          </button>
        </div>

        {!midias.length && (
          <p className="text-sm text-neutral-400">Nenhuma mídia cadastrada pra essa linha ainda.</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {midias.map((m) => (
            <button
              key={m.id}
              onClick={() => onEscolher(m.id)}
              className="flex flex-col items-center gap-1 rounded-md border border-marca-200 p-2 text-left hover:bg-marca-50"
            >
              {m.mime?.startsWith("image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.titulo} className="h-20 w-full rounded object-cover" />
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500">
                  Arquivo
                </div>
              )}
              <span className="line-clamp-2 text-xs text-neutral-700">{m.titulo}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
