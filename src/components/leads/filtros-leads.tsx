import { ROTULO_ORIGEM, type OrigemLead } from "@/lib/tipos";

export type Filtros = {
  busca: string;
  linhaId: string;
  origem: string;
  responsavelId: string;
  bairro: string;
  de: string;
  ate: string;
};

export const FILTROS_VAZIOS: Filtros = {
  busca: "",
  linhaId: "",
  origem: "",
  responsavelId: "",
  bairro: "",
  de: "",
  ate: "",
};

export function FiltrosLeads({
  filtros,
  onMudar,
  linhas,
  vendedores,
}: {
  filtros: Filtros;
  onMudar: (filtros: Filtros) => void;
  linhas: { id: string; nome: string }[];
  vendedores: { id: string; nome: string }[];
}) {
  function set<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    onMudar({ ...filtros, [campo]: valor });
  }

  const classeCampo =
    "rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-marca-600 focus:outline-none";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Buscar por nome ou telefone"
        value={filtros.busca}
        onChange={(e) => set("busca", e.target.value)}
        className={`${classeCampo} w-56`}
      />

      <select
        value={filtros.linhaId}
        onChange={(e) => set("linhaId", e.target.value)}
        className={classeCampo}
      >
        <option value="">Todas as linhas</option>
        {linhas.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </select>

      <select
        value={filtros.origem}
        onChange={(e) => set("origem", e.target.value)}
        className={classeCampo}
      >
        <option value="">Todas as origens</option>
        {Object.entries(ROTULO_ORIGEM).map(([chave, rotulo]) => (
          <option key={chave} value={chave as OrigemLead}>
            {rotulo}
          </option>
        ))}
      </select>

      <select
        value={filtros.responsavelId}
        onChange={(e) => set("responsavelId", e.target.value)}
        className={classeCampo}
      >
        <option value="">Todos os responsáveis</option>
        <option value="sem_dono">Sem responsável</option>
        {vendedores.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nome}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Bairro"
        value={filtros.bairro}
        onChange={(e) => set("bairro", e.target.value)}
        className={`${classeCampo} w-32`}
      />

      <input
        type="date"
        value={filtros.de}
        onChange={(e) => set("de", e.target.value)}
        className={classeCampo}
        aria-label="Data inicial"
      />
      <input
        type="date"
        value={filtros.ate}
        onChange={(e) => set("ate", e.target.value)}
        className={classeCampo}
        aria-label="Data final"
      />

      {JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS) && (
        <button
          onClick={() => onMudar(FILTROS_VAZIOS)}
          className="text-xs font-medium text-neutral-500 hover:text-marca-800"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
