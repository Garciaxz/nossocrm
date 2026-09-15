import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterPerfilAtual } from "@/lib/supabase/perfil";
import type { Perfil } from "@/lib/tipos";
import { ConfigClient } from "./config-client";

export default async function Config() {
  const perfil = await obterPerfilAtual();

  if (perfil?.papel !== "gerente") {
    return <p className="text-sm text-neutral-500">Só o gerente acessa as configurações.</p>;
  }

  const supabase = await criarClienteServidor();

  const [{ data: perfis }, { data: linhas }, { data: produtos }, { data: regras }, { data: scripts }, { data: horarios }] =
    await Promise.all([
      supabase.from("perfis").select("*").order("nome").returns<Perfil[]>(),
      supabase.from("linhas_produto").select("id, nome").eq("ativo", true).order("ordem"),
      supabase.from("produtos").select("id, linha_id, modelo, codigo, preco_m2, preco_unidade").order("modelo"),
      supabase.from("regras_classificacao").select("*").order("termo"),
      supabase.from("scripts_mensagem").select("*").order("chave"),
      supabase.from("horarios_atendimento").select("*").order("dia_semana"),
    ]);

  const evolutionPresente = {
    EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
    EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
    EVOLUTION_INSTANCIA: !!process.env.EVOLUTION_INSTANCIA,
    EVOLUTION_WEBHOOK_TOKEN: !!process.env.EVOLUTION_WEBHOOK_TOKEN,
  };

  return (
    <ConfigClient
      perfis={perfis ?? []}
      linhas={linhas ?? []}
      produtos={produtos ?? []}
      regras={regras ?? []}
      scripts={scripts ?? []}
      horarios={horarios ?? []}
      evolutionPresente={evolutionPresente}
    />
  );
}
