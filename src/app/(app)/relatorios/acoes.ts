"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { KpiChave, OrigemLead } from "@/lib/tipos";

async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

export async function alternarKpi(chave: KpiChave, visivel: boolean) {
  const { supabase, userId } = await usuarioAtual();

  const { error } = await supabase
    .from("kpis_painel")
    .upsert({ perfil_id: userId, chave, visivel }, { onConflict: "perfil_id,chave" });
  if (error) throw new Error(error.message);

  revalidatePath("/relatorios");
  revalidatePath("/");
}

export async function lancarInvestimento(dados: {
  canal: OrigemLead;
  referencia: string; // primeiro dia do mes, YYYY-MM-DD
  valor: number;
  observacao?: string;
}) {
  const { supabase, userId } = await usuarioAtual();

  const { error } = await supabase.from("investimentos_midia").upsert(
    {
      canal: dados.canal,
      referencia: dados.referencia,
      valor: dados.valor,
      observacao: dados.observacao || null,
      criado_por: userId,
    },
    { onConflict: "canal,referencia" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/relatorios");
}
