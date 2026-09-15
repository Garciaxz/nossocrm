"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { criarCliente } from "@/lib/supabase/cliente";
import type { PapelUsuario } from "@/lib/tipos";

const ITENS: { href: string; rotulo: string; papeis: PapelUsuario[] }[] = [
  { href: "/", rotulo: "Painel", papeis: ["gerente", "vendedor", "diretoria"] },
  { href: "/leads", rotulo: "Leads", papeis: ["gerente", "vendedor"] },
  { href: "/relatorios", rotulo: "Relatórios", papeis: ["gerente", "vendedor", "diretoria"] },
  { href: "/biblioteca", rotulo: "Biblioteca", papeis: ["gerente", "vendedor"] },
  { href: "/config", rotulo: "Configurações", papeis: ["gerente"] },
];

export function NavAutenticada({ papel, nome }: { papel: PapelUsuario; nome: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    const supabase = criarCliente();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const itensVisiveis = ITENS.filter((item) => item.papeis.includes(papel));

  return (
    <header className="flex flex-col gap-3 border-b border-marca-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-marca-900">RD Revestimentos</span>
        <nav className="flex flex-wrap gap-1">
          {itensVisiveis.map((item) => {
            const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  ativo
                    ? "bg-marca-800 text-white"
                    : "text-neutral-600 hover:bg-marca-50 hover:text-marca-900"
                }`}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <span>{nome}</span>
        <button
          onClick={sair}
          className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
