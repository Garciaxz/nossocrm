const LINHAS = [
  { chave: "EVOLUTION_API_URL", rotulo: "URL da API" },
  { chave: "EVOLUTION_API_KEY", rotulo: "Chave da API" },
  { chave: "EVOLUTION_INSTANCIA", rotulo: "Instância padrão" },
  { chave: "EVOLUTION_WEBHOOK_TOKEN", rotulo: "Token do webhook" },
];

export function Evolution({ presentes }: { presentes: Record<string, boolean> }) {
  return (
    <div>
      <p className="mb-3 text-sm text-neutral-500">
        Essas chaves vivem em variável de ambiente (Vercel ou onde o app estiver rodando), nunca no
        banco. Mudar valor aqui exigiria reimplantar o app — por segurança, esta tela só confirma o que
        já está configurado.
      </p>
      <div className="overflow-hidden rounded-lg border border-marca-200 bg-white">
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
    </div>
  );
}
