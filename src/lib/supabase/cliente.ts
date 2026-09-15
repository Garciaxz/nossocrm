"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador. Usa a chave anon e respeita o RLS. */
export function criarCliente() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
