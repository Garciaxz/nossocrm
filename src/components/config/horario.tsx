"use client";

import { useState } from "react";
import { criarCliente } from "@/lib/supabase/cliente";

type Horario = { dia_semana: number; abre: string | null; fecha: string | null; atende: boolean };

const NOME_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function Horario({ horariosIniciais }: { horariosIniciais: Horario[] }) {
  const [horarios, setHorarios] = useState(() => {
    const porDia = new Map(horariosIniciais.map((h) => [h.dia_semana, h]));
    return Array.from({ length: 7 }, (_, dia) => porDia.get(dia) ?? { dia_semana: dia, abre: null, fecha: null, atende: false });
  });

  async function salvar(dia: number, dados: Partial<Horario>) {
    setHorarios((atual) => atual.map((h) => (h.dia_semana === dia ? { ...h, ...dados } : h)));
    const atualizado = { ...horarios.find((h) => h.dia_semana === dia), ...dados };
    const supabase = criarCliente();
    await supabase.from("horarios_atendimento").upsert({ dia_semana: dia, ...atualizado });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-marca-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-marca-50 text-left text-neutral-600">
          <tr>
            <th className="px-3 py-2">Dia</th>
            <th className="px-3 py-2">Atende</th>
            <th className="px-3 py-2">Abre</th>
            <th className="px-3 py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map((h) => (
            <tr key={h.dia_semana} className="border-t border-marca-50">
              <td className="px-3 py-2">{NOME_DIA[h.dia_semana]}</td>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={h.atende}
                  onChange={(e) => salvar(h.dia_semana, { atende: e.target.checked })}
                  className="h-4 w-4"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="time"
                  defaultValue={h.abre ?? ""}
                  onBlur={(e) => salvar(h.dia_semana, { abre: e.target.value || null })}
                  disabled={!h.atende}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:bg-neutral-50"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="time"
                  defaultValue={h.fecha ?? ""}
                  onBlur={(e) => salvar(h.dia_semana, { fecha: e.target.value || null })}
                  disabled={!h.atende}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:bg-neutral-50"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
