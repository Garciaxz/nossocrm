import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterPerfilAtual } from "@/lib/supabase/perfil";
import type { LeadCompleto } from "@/lib/tipos";
import { LeadsClient } from "./leads-client";

export default async function Leads() {
  const perfil = await obterPerfilAtual();
  const supabase = await criarClienteServidor();

  const [{ data: leads }, { data: linhas }, { data: vendedores }] = await Promise.all([
    supabase
      .from("vw_leads_completo")
      .select("*")
      .order("criado_em", { ascending: false })
      .returns<LeadCompleto[]>(),
    supabase.from("linhas_produto").select("id, nome").eq("ativo", true).order("ordem"),
    supabase
      .from("perfis")
      .select("id, nome")
      .in("papel", ["vendedor", "gerente"])
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <LeadsClient
      leadsIniciais={leads ?? []}
      linhas={linhas ?? []}
      vendedores={vendedores ?? []}
      papel={perfil!.papel}
      meuId={perfil!.id}
    />
  );
}
