import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { MidiaBiblioteca } from "@/lib/tipos";
import { BibliotecaClient } from "./biblioteca-client";

export default async function Biblioteca() {
  const supabase = await criarClienteServidor();

  const [{ data: midias }, { data: linhas }] = await Promise.all([
    supabase
      .from("biblioteca_midia")
      .select("*, linhas_produto(nome)")
      .order("criado_em", { ascending: false }),
    supabase.from("linhas_produto").select("id, nome").eq("ativo", true).order("ordem"),
  ]);

  const midiasComLinha = (midias ?? []).map((m) => ({
    ...(m as MidiaBiblioteca),
    linha_nome: (m as unknown as { linhas_produto: { nome: string } | null }).linhas_produto?.nome ?? null,
  }));

  return <BibliotecaClient midiasIniciais={midiasComLinha} linhas={linhas ?? []} />;
}
