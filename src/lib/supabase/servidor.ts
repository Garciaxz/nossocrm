import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieParaGravar = { name: string; value: string; options?: CookieOptions };

/** Cliente de servidor com a sessao do usuario. Respeita o RLS. */
export async function criarClienteServidor() {
  const jar = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (lista: CookieParaGravar[]) => {
          try {
            lista.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // Server Component nao escreve cookie. O middleware cuida da renovacao.
          }
        },
      },
    }
  );
}
