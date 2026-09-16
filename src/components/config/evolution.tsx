const LINHAS = [
  { chave: "EVOLUTION_API_URL", rotulo: "URL da API" },
  { chave: "EVOLUTION_API_KEY", rotulo: "Chave da API" },
  { chave: "EVOLUTION_INSTANCIA", rotulo: "Instância padrão" },
  { chave: "EVOLUTION_WEBHOOK_TOKEN", rotulo: "Token do webhook" },
];

type InstanciaEvolution = { instancia: string; estado: string | null; atualizado_em: string };

export function Evolution({
  presentes,
  instancias,
}: {
  presentes: Record<string, boolean>;
  instancias: InstanciaEvolution[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-neutral-500">
        Essas chaves vivem em variável de ambiente (Vercel ou onde o app estiver rodando), nunca no
        banco. Mudar valor aqui exigiria reimplantar o app — por segurança, esta tela só confirma o que
        já está configurado.
      </p>
      <div className="mb-4 overflow-hidden rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {LINHAS.map((l) => (
              <tr key={l.chave} className="border-t border-marca-50 first:border-t-0">
                <td className="px-4 py-2 font-mono text-xs text-neutral-500">{l.chave}</td>
                <td className="px-4 py-2">{l.rotulo}</td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      presentes[l.chave] ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {presentes[l.chave] ? "Configurada" : "Ausente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-marca-900">Instâncias</h3>
      <p className="mb-3 text-sm text-neutral-500">
        Estado relatado pelo evento <code className="font-mono text-xs">connection.update</code> do
        webhook. Sem histórico ainda, se a lista estiver vazia.
      </p>
      <div className="overflow-hidden rounded-lg border border-marca-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-marca-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-2">Instância</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {instancias.map((i) => (
              <tr key={i.instancia} className="border-t border-marca-50">
                <td className="px-4 py-2 font-mono text-xs">{i.instancia}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      i.estado === "open"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {i.estado ?? "desconhecido"}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {new Date(i.atualizado_em).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
            {!instancias.length && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={3}>
                  Nenhum evento de conexão recebido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
