"use client";

import { useState } from "react";
import type { OrigemLead, Perfil } from "@/lib/tipos";
import { Usuarios } from "@/components/config/usuarios";
import { Catalogo } from "@/components/config/catalogo";
import { Classificacao } from "@/components/config/classificacao";
import { Scripts } from "@/components/config/scripts";
import { Horario } from "@/components/config/horario";
import { Evolution } from "@/components/config/evolution";

type Aba = "usuarios" | "catalogo" | "classificacao" | "scripts" | "horario" | "evolution";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "usuarios", rotulo: "Usuários" },
  { chave: "catalogo", rotulo: "Catálogo" },
  { chave: "classificacao", rotulo: "Classificação" },
  { chave: "scripts", rotulo: "Scripts" },
  { chave: "horario", rotulo: "Horário" },
  { chave: "evolution", rotulo: "Evolution" },
];

export function ConfigClient(props: {
  perfis: Perfil[];
  linhas: { id: string; nome: string }[];
  produtos: { id: string; linha_id: string; modelo: string; codigo: string | null; preco_m2: number | null; preco_unidade: number | null }[];
  regras: {
    id: string;
    termo: string;
    linha_id: string | null;
    origem_sugerida: OrigemLead | null;
    peso: number;
    exige_isolado: boolean;
    ativo: boolean;
  }[];
  scripts: { id: string; chave: string; titulo: string; conteudo: string; ativo: boolean }[];
  horarios: { dia_semana: number; abre: string | null; fecha: string | null; atende: boolean }[];
  evolutionPresente: Record<string, boolean>;
  instancias: { instancia: string; estado: string | null; atualizado_em: string }[];
}) {
  const [aba, setAba] = useState<Aba>("usuarios");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-marca-900">Configurações</h1>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-marca-200">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            onClick={() => setAba(a.chave)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              aba === a.chave
                ? "border-b-2 border-marca-800 text-marca-900"
                : "text-neutral-500 hover:text-marca-800"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === "usuarios" && <Usuarios perfisIniciais={props.perfis} />}
      {aba === "catalogo" && <Catalogo produtosIniciais={props.produtos} linhas={props.linhas} />}
      {aba === "classificacao" && <Classificacao regrasIniciais={props.regras} linhas={props.linhas} />}
      {aba === "scripts" && <Scripts scriptsIniciais={props.scripts} />}
      {aba === "horario" && <Horario horariosIniciais={props.horarios} />}
      {aba === "evolution" && (
        <Evolution presentes={props.evolutionPresente} instancias={props.instancias} />
      )}
    </div>
  );
}
