import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterPerfilAtual } from "@/lib/supabase/perfil";
import { ETAPAS, type Atividade, type LeadCompleto, type Medicao, type Mensagem, type Orcamento } from "@/lib/tipos";
import { telefone as formatarTelefone } from "@/lib/formato";
import { DadosLead } from "@/components/lead-detalhe/dados-lead";
import { Conversa } from "@/components/lead-detalhe/conversa";
import { Trilha } from "@/components/lead-detalhe/trilha";

export default async function DetalheLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await obterPerfilAtual();
  const supabase = await criarClienteServidor();

  const { data: lead } = await supabase
    .from("vw_leads_completo")
    .select("*")
    .eq("id", id)
    .maybeSingle<LeadCompleto>();

  if (!lead) notFound();

  const [{ data: conversa }, { data: linhas }, { data: produtos }, { data: vendedores }, { data: atividades }, { data: medicoes }, { data: orcamentos }] =
    await Promise.all([
      supabase
        .from("conversas")
        .select("id")
        .eq("lead_id", id)
        .order("ultima_mensagem_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("linhas_produto").select("id, nome").eq("ativo", true).order("ordem"),
      supabase.from("produtos").select("id, linha_id, modelo").eq("ativo", true),
      supabase.from("perfis").select("id, nome").in("papel", ["vendedor", "gerente"]).eq("ativo", true).order("nome"),
      supabase.from("atividades").select("*").eq("lead_id", id).order("criado_em", { ascending: false }).returns<Atividade[]>(),
      supabase.from("medicoes").select("*").eq("lead_id", id).order("agendada_para", { ascending: false }).returns<Medicao[]>(),
      supabase.from("orcamentos").select("*").eq("lead_id", id).order("criado_em", { ascending: false }).returns<Orcamento[]>(),
    ]);

  const { data: mensagens } = conversa
    ? await supabase
        .from("mensagens")
        .select("*")
        .eq("conversa_id", conversa.id)
        .order("enviada_em", { ascending: true })
        .returns<Mensagem[]>()
    : { data: [] };

  const { data: midias } = await supabase
    .from("biblioteca_midia")
    .select("id, titulo, url, mime")
    .or(lead.linha_id ? `linha_id.eq.${lead.linha_id},linha_id.is.null` : "linha_id.is.null")
    .order("criado_em", { ascending: false })
    .limit(30);

  const rotuloEtapa = new Map(ETAPAS.map((e) => [e.chave, e.rotulo]));

  return (
    <div>
      <div className="mb-4">
        <Link href="/leads" className="text-sm text-neutral-500 hover:text-marca-800">
          ← Leads
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-marca-900">{lead.nome ?? "Sem nome"}</h1>
          <p className="text-sm text-neutral-500">{formatarTelefone(lead.telefone)}</p>
        </div>
        <span className="rounded-full bg-marca-50 px-3 py-1 text-xs font-semibold text-marca-800">
          {rotuloEtapa.get(lead.etapa) ?? lead.etapa}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="order-2 lg:order-1">
          <Conversa
            leadId={lead.id}
            conversaId={conversa?.id ?? null}
            mensagensIniciais={mensagens ?? []}
            midias={midias ?? []}
          />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <DadosLead
            lead={lead}
            papel={perfil!.papel}
            linhas={linhas ?? []}
            produtos={produtos ?? []}
            vendedores={vendedores ?? []}
          />
          <Trilha
            leadId={lead.id}
            atividades={atividades ?? []}
            medicoes={medicoes ?? []}
            orcamentos={orcamentos ?? []}
            elegivelInstalacao={lead.elegivel_instalacao}
            enderecoSugerido={lead.bairro ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
