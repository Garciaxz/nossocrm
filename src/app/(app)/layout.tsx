import { obterPerfilAtual } from "@/lib/supabase/perfil";
import { NavAutenticada } from "@/components/nav-autenticada";

export default async function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const perfil = await obterPerfilAtual();

  // Middleware ja garante sessao valida. Perfil ausente aqui e inconsistencia
  // de dados (usuario criado no Auth sem linha em `perfis`), nao fluxo normal.
  if (!perfil) {
    return (
      <main className="p-8 text-sm text-neutral-600">
        Perfil não encontrado. Fale com o gerente para configurar seu acesso.
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <NavAutenticada papel={perfil.papel} nome={perfil.nome} />
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
