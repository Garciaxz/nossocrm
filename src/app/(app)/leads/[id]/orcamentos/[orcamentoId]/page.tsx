import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Orcamento } from "@/lib/tipos";
import { CabecalhoOrcamento } from "@/components/orcamento/cabecalho-orcamento";
import { TabelaItens } from "@/components/orcamento/tabela-itens";

export default async function OrcamentoPage({
  params,
}: {
  params: Promise<{ id: string; orcamentoId: string }>;
}) {
  const { id: leadId, orcamentoId } = await params;
  const supabase = await criarClienteServidor();

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", orcamentoId)
    .eq("lead_id", leadId)
    .maybeSingle<Orcamento>();

  if (!orcamento) notFound();

  const { data: lead } = await supabase.from("leads").select("linha_id").eq("id", leadId).single();

  const [{ data: itens }, { data: produtos }] = await Promise.all([
    supabase
      .from("orcamento_itens")
      .select("*")
      .eq("orcamento_id", orcamentoId)
      .order("ordem"),
    supabase
      .from("produtos")
      .select("id, modelo, m2_por_caixa, preco_m2, preco_unidade, unidade_venda")
      .eq("ativo", true)
      .eq("linha_id", lead?.linha_id ?? ""),
  ]);

  const travado = orcamento.status !== "rascunho";

  return (
    <div>
      <div className="mb-4">
        <Link href={`/leads/${leadId}`} className="text-sm text-neutral-500 hover:text-marca-800">
          ← Voltar ao lead
        </Link>
      </div>

      <CabecalhoOrcamento orcamento={orcamento} leadId={leadId} />

      <TabelaItens
        orcamentoId={orcamentoId}
        leadId={leadId}
        itens={itens ?? []}
        produtos={produtos ?? []}
        travado={travado}
      />
    </div>
  );
}
