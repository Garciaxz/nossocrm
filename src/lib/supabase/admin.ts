import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role.
 *
 * IGNORA RLS por definicao do Postgres. Use apenas em Route Handler
 * ou Server Action. Se esta chave chegar ao navegador, o banco inteiro
 * fica exposto.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
