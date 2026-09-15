"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";

async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

export async function criarOrcamento(leadId: string): Promise<string> {
  const { supabase, userId } = await usuarioAtual();

  const { data, error } = await supabase
    .from("orcamentos")
    .insert({ lead_id: leadId, criado_por: userId })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar o orçamento.");

  revalidatePath(`/leads/${leadId}`);
  return data.id;
}

async function recalcularValorMateriais(orcamentoId: string, leadId: string) {
  const supabase = await criarClienteServidor();
  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("subtotal")
    .eq("orcamento_id", orcamentoId);

  const total = (itens ?? []).reduce((soma, i) => soma + Number(i.subtotal), 0);

  await supabase.from("orcamentos").update({ valor_materiais: total }).eq("id", orcamentoId);
  revalidatePath(`/leads/${leadId}/orcamentos/${orcamentoId}`);
}

export async function adicionarItem(
  orcamentoId: string,
  leadId: string,
  item: {
    produtoId: string | null;
    descricao: string;
    metragemM2: number | null;
    quantidade: number;
    unidade: string;
    precoUnitario: number;
  }
) {
  const { supabase } = await usuarioAtual();

  const { error } = await supabase.from("orcamento_itens").insert({
    orcamento_id: orcamentoId,
    produto_id: item.produtoId,
    descricao: item.descricao,
    metragem_m2: item.metragemM2,
    quantidade: item.quantidade,
    unidade: item.unidade,
    preco_unitario: item.precoUnitario,
  });
  if (error) throw new Error(error.message);

  await recalcularValorMateriais(orcamentoId, leadId);
}

export async function removerItem(itemId: string, orcamentoId: string, leadId: string) {
  const { supabase } = await usuarioAtual();

  const { error } = await supabase.from("orcamento_itens").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  await recalcularValorMateriais(orcamentoId, leadId);
}

export async function atualizarOrcamento(
  orcamentoId: string,
  leadId: string,
  dados: {
    valorInstalacao?: number;
    desconto?: number;
    validadeDias?: number;
    observacoes?: string | null;
    status?: string;
  }
) {
  const { supabase } = await usuarioAtual();

  const atualizacao: Record<string, unknown> = {};
  if (dados.valorInstalacao != null) atualizacao.valor_instalacao = dados.valorInstalacao;
  if (dados.desconto != null) atualizacao.desconto = dados.desconto;
  if (dados.validadeDias != null) atualizacao.validade_dias = dados.validadeDias;
  if (dados.observacoes !== undefined) atualizacao.observacoes = dados.observacoes;
  if (dados.status) {
    atualizacao.status = dados.status;
    if (dados.status === "enviado") {
      const { data: atual } = await supabase.from("orcamentos").select("enviado_em").eq("id", orcamentoId).single();
      if (!atual?.enviado_em) atualizacao.enviado_em = new Date().toISOString();
    }
  }

  const { error } = await supabase.from("orcamentos").update(atualizacao).eq("id", orcamentoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}/orcamentos/${orcamentoId}`);
  revalidatePath(`/leads/${leadId}`);
}
