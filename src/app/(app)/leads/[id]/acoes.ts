"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { enviarTexto, enviarMidia } from "@/lib/evolution";

async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

export async function enviarMensagem(leadId: string, conversaId: string, texto: string) {
  const { supabase, userId } = await usuarioAtual();

  const [{ data: lead }, { data: conversa }] = await Promise.all([
    supabase.from("leads").select("telefone").eq("id", leadId).single(),
    supabase.from("conversas").select("instancia").eq("id", conversaId).single(),
  ]);

  if (!lead || !conversa) throw new Error("Lead ou conversa não encontrados.");
  if (!conversa.instancia) throw new Error("Essa conversa não tem instância da Evolution configurada.");

  const enviou = await enviarTexto(conversa.instancia, lead.telefone, texto);
  if (!enviou) throw new Error("Falha ao enviar pelo WhatsApp.");

  const { error } = await supabase.from("mensagens").insert({
    conversa_id: conversaId,
    lead_id: leadId,
    direcao: "saida",
    tipo: "texto",
    conteudo: texto,
    autor_id: userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
}

export async function enviarMidiaDaBiblioteca(leadId: string, conversaId: string, midiaId: string) {
  const { supabase, userId } = await usuarioAtual();

  const [{ data: lead }, { data: conversa }, { data: midia }] = await Promise.all([
    supabase.from("leads").select("telefone").eq("id", leadId).single(),
    supabase.from("conversas").select("instancia").eq("id", conversaId).single(),
    supabase.from("biblioteca_midia").select("url, mime, titulo, vezes_enviada").eq("id", midiaId).single(),
  ]);

  if (!lead || !conversa || !midia) throw new Error("Não foi possível localizar a mídia ou a conversa.");
  if (!conversa.instancia) throw new Error("Essa conversa não tem instância da Evolution configurada.");

  const tipo = midia.mime?.startsWith("video") ? "video" : midia.mime?.startsWith("image") ? "image" : "document";
  const enviou = await enviarMidia(conversa.instancia, lead.telefone, midia.url, tipo, midia.titulo);
  if (!enviou) throw new Error("Falha ao enviar a mídia pelo WhatsApp.");

  const { error } = await supabase.from("mensagens").insert({
    conversa_id: conversaId,
    lead_id: leadId,
    direcao: "saida",
    tipo: tipo === "image" ? "imagem" : tipo === "video" ? "video" : "documento",
    conteudo: midia.titulo,
    midia_url: midia.url,
    midia_mime: midia.mime,
    autor_id: userId,
  });
  if (error) throw new Error(error.message);

  await supabase
    .from("biblioteca_midia")
    .update({ vezes_enviada: midia.vezes_enviada + 1 })
    .eq("id", midiaId);

  revalidatePath(`/leads/${leadId}`);
}

export async function adicionarNota(leadId: string, texto: string) {
  const { supabase, userId } = await usuarioAtual();

  const { error } = await supabase.from("atividades").insert({
    lead_id: leadId,
    autor_id: userId,
    tipo: "nota",
    descricao: texto,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
}

export async function agendarMedicao(
  leadId: string,
  dados: {
    agendadaPara: string;
    endereco: string;
    responsavelNome?: string;
    responsavelTelefone?: string;
  }
) {
  const { supabase, userId } = await usuarioAtual();

  const { error } = await supabase.from("medicoes").insert({
    lead_id: leadId,
    agendada_para: dados.agendadaPara,
    endereco: dados.endereco,
    responsavel_nome: dados.responsavelNome || null,
    responsavel_telefone: dados.responsavelTelefone || null,
    criado_por: userId,
  });
  if (error) throw new Error(error.message);

  await supabase.from("leads").update({ etapa: "medicao" }).eq("id", leadId);

  revalidatePath(`/leads/${leadId}`);
}

export async function atualizarDadosLead(leadId: string, dados: Record<string, unknown>) {
  const { supabase } = await usuarioAtual();

  const { error } = await supabase.from("leads").update(dados).eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
}
