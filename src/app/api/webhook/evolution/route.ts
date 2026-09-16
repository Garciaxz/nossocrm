import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarTexto } from "@/lib/evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook da Evolution API.
 *
 * SEMPRE responde 200. Status de erro faz a Evolution reenviar em loop,
 * e um bug nosso viraria tempestade de requisicao.
 *
 * Usa service_role, que ignora RLS por definicao do Postgres. Por isso
 * este arquivo nunca pode virar componente de cliente.
 */

type MensagemEvolution = {
  event?: string;
  instance?: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string };
    pushName?: string;
    messageType?: string;
    message?: Record<string, unknown>;
    messageTimestamp?: number;
    contextInfo?: {
      // referral do click-to-WhatsApp da Meta
      externalAdReply?: Record<string, unknown>;
      conversionSource?: string;
    };
    // connection.update: estado da instancia (open, close, connecting...)
    state?: string;
  };
};

function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.EVOLUTION_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  // timingSafeEqual exige mesmo tamanho, senao ele mesmo vaza informacao
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Extrai texto de qualquer formato de mensagem da Evolution. */
function extrairTexto(msg: Record<string, unknown> | undefined): string {
  if (!msg) return "";
  const m = msg as Record<string, any>;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    m.documentMessage?.caption ??
    m.buttonsResponseMessage?.selectedDisplayText ??
    m.listResponseMessage?.title ??
    ""
  );
}

function mapearTipo(messageType?: string): string {
  const mapa: Record<string, string> = {
    conversation: "texto",
    extendedTextMessage: "texto",
    imageMessage: "imagem",
    videoMessage: "video",
    audioMessage: "audio",
    documentMessage: "documento",
    locationMessage: "localizacao",
  };
  return mapa[messageType ?? ""] ?? "outro";
}

/** remoteJid vem como 5591999998888@s.whatsapp.net */
function telefoneDoJid(jid: string): string {
  return jid.split("@")[0].split(":")[0];
}

export async function POST(req: NextRequest) {
  try {
    if (!tokenConfere(req.headers.get("apikey"))) {
      // 401 aqui e proposital: token errado nao e falha de processamento
      return NextResponse.json({ erro: "nao autorizado" }, { status: 401 });
    }

    const corpo = (await req.json()) as MensagemEvolution;

    if (corpo.event === "connection.update") {
      if (!corpo.instance) {
        return NextResponse.json({ ok: true, ignorado: "connection.update sem instance" });
      }
      const supabase = criarClienteAdmin();
      await supabase.from("instancias_evolution").upsert({
        instancia: corpo.instance,
        estado: corpo.data?.state ?? null,
        dados: corpo.data ?? null,
        atualizado_em: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (corpo.event !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignorado: corpo.event });
    }

    const dados = corpo.data;
    const jid = dados?.key?.remoteJid;
    const idExterno = dados?.key?.id;

    if (!jid || dados?.key?.fromMe) {
      // fromMe = mensagem que a propria loja mandou. Nao cria lead.
      return NextResponse.json({ ok: true, ignorado: "fromMe ou sem jid" });
    }
    if (jid.endsWith("@g.us")) {
      return NextResponse.json({ ok: true, ignorado: "grupo" });
    }

    const supabase = criarClienteAdmin();
    const telefone = telefoneDoJid(jid);
    const texto = extrairTexto(dados?.message);
    const tipo = mapearTipo(dados?.messageType);
    const nomeContato = dados?.pushName ?? null;
    const instancia = corpo.instance ?? null;
    const enviadaEm = dados?.messageTimestamp
      ? new Date(dados.messageTimestamp * 1000).toISOString()
      : new Date().toISOString();

    // Idempotencia: a Evolution reenvia quando nao recebe 200 a tempo
    if (idExterno) {
      const { data: jaExiste } = await supabase
        .from("mensagens")
        .select("id")
        .eq("id_externo", idExterno)
        .maybeSingle();
      if (jaExiste) {
        return NextResponse.json({ ok: true, duplicada: true });
      }
    }

    // ---- lead ----
    const { data: telNormalizado } = await supabase.rpc("fn_normalizar_telefone", {
      p_telefone: telefone,
    });

    const { data: leadExistente } = await supabase
      .from("leads")
      .select("id, linha_id, responsavel_id, primeira_mensagem_em")
      .eq("telefone_normalizado", telNormalizado)
      .maybeSingle();

    let leadId: string;
    let ehPrimeiroContato = false;

    if (leadExistente) {
      leadId = leadExistente.id;
      if (nomeContato) {
        // so preenche nome se ainda estiver vazio, para nao sobrescrever
        // o nome que o vendedor corrigiu na mao
        await supabase
          .from("leads")
          .update({ nome: nomeContato })
          .eq("id", leadId)
          .is("nome", null);
      }
    } else {
      ehPrimeiroContato = true;

      // Classifica lendo a primeira mensagem
      const { data: classificacao } = await supabase.rpc("fn_classificar_linha", {
        p_texto: texto,
      });
      const achou = Array.isArray(classificacao) ? classificacao[0] : classificacao;

      // Referral da Meta (click-to-WhatsApp)
      const anuncio = dados?.contextInfo?.externalAdReply as
        | Record<string, any>
        | undefined;

      // Distribuicao automatica, se ligada
      const { data: cfg } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "distribuicao_automatica")
        .maybeSingle();

      let responsavelId: string | null = null;
      if (cfg?.valor === true) {
        const { data: proximo } = await supabase.rpc("fn_proximo_vendedor");
        responsavelId = proximo ?? null;
      }

      const { data: novoLead, error: erroLead } = await supabase
        .from("leads")
        .insert({
          nome: nomeContato,
          telefone,
          linha_id: achou?.linha_id ?? null,
          palavra_chave: achou?.termo ?? null,
          origem: anuncio ? "meta_ads" : achou?.origem_sugerida ?? "desconhecida",
          campanha: anuncio?.sourceId ?? null,
          criativo: anuncio?.title ?? null,
          ctwa_clid: anuncio?.ctwaClid ?? null,
          responsavel_id: responsavelId,
          primeira_mensagem_em: enviadaEm,
          etapa: "novo",
        })
        .select("id")
        .single();

      if (erroLead || !novoLead) {
        console.error("[webhook] falha ao criar lead", erroLead);
        return NextResponse.json({ ok: true, erro: "lead" });
      }
      leadId = novoLead.id;
    }

    // ---- conversa ----
    const { data: conversa } = await supabase
      .from("conversas")
      .upsert(
        {
          lead_id: leadId,
          canal: "whatsapp",
          identificador: telefone,
          instancia,
          aberta: true,
        },
        { onConflict: "lead_id,canal,identificador" }
      )
      .select("id")
      .single();

    if (!conversa) {
      console.error("[webhook] falha na conversa");
      return NextResponse.json({ ok: true, erro: "conversa" });
    }

    // ---- mensagem ----
    await supabase.from("mensagens").insert({
      conversa_id: conversa.id,
      lead_id: leadId,
      direcao: "entrada",
      tipo,
      conteudo: texto || null,
      id_externo: idExterno ?? null,
      enviada_em: enviadaEm,
    });

    // ---- resposta automatica fora do horario ----
    // Só no primeiro contato. Repetir a cada mensagem seria spam.
    if (ehPrimeiroContato) {
      const { data: dentroHorario } = await supabase.rpc("fn_dentro_horario");

      if (dentroHorario === false) {
        const { data: script } = await supabase
          .from("scripts_mensagem")
          .select("conteudo")
          .eq("chave", "fora_horario")
          .eq("ativo", true)
          .maybeSingle();

        if (script?.conteudo && instancia) {
          const enviou = await enviarTexto(instancia, telefone, script.conteudo);
          if (enviou) {
            // automatica = true faz o SLA NAO parar aqui.
            // O cronometro so para quando um humano responde.
            await supabase.from("mensagens").insert({
              conversa_id: conversa.id,
              lead_id: leadId,
              direcao: "saida",
              tipo: "texto",
              conteudo: script.conteudo,
              automatica: true,
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, lead_id: leadId });
  } catch (e) {
    // 200 mesmo em excecao: erro nosso nao pode virar loop de reenvio
    console.error("[webhook] excecao", e);
    return NextResponse.json({ ok: true, erro: "interno" });
  }
}

export async function GET() {
  return NextResponse.json({ status: "webhook da Evolution ativo" });
}
