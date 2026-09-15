import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil } from "@/lib/tipos";

/**
 * Perfil do usuario logado, ou null se nao autenticado. Respeita RLS.
 * cache() evita repetir a consulta quando o layout e a page da mesma
 * requisicao chamam essa funcao.
 */
export const obterPerfilAtual = cache(async (): Promise<Perfil | null> => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, email, papel, telefone, ativo, recebe_rodizio")
    .eq("id", user.id)
    .single();

  return (perfil as Perfil | null) ?? null;
});
