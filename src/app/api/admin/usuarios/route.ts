import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Criacao de usuario exige a Auth Admin API (service_role). Por isso
 * vive num Route Handler, nunca em Server Action ou componente de
 * cliente: e a unica forma de manter a chave fora do navegador com a
 * garantia de que o app nao a reexporta sem querer.
 */
export async function POST(req: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", user.id).single();
  if (perfil?.papel !== "gerente") {
    return NextResponse.json({ erro: "só o gerente cria usuário" }, { status: 403 });
  }

  const { nome, email, senha, papel } = await req.json();
  if (!nome || !email || !senha) {
    return NextResponse.json({ erro: "nome, email e senha são obrigatórios" }, { status: 400 });
  }

  const admin = criarClienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, papel: papel ?? "vendedor" },
  });

  if (error) return NextResponse.json({ erro: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: data.user?.id });
}
