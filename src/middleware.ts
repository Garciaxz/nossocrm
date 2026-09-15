import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieParaGravar = { name: string; value: string; options?: CookieOptions };

const PUBLICAS = ["/login", "/auth"];

export async function middleware(req: NextRequest) {
  let resposta = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (lista: CookieParaGravar[]) => {
          lista.forEach(({ name, value }) => req.cookies.set(name, value));
          resposta = NextResponse.next({ request: req });
          lista.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser revalida com o servidor. getSession leria so o cookie,
  // que o cliente pode ter adulterado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = req.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (!user && !ehPublica) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("destino", caminho);
    return NextResponse.redirect(url);
  }

  if (user && caminho === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("destino");
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: [
    // tudo, menos estaticos e o webhook (que autentica por token proprio)
    "/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
