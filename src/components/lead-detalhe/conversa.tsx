"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { criarCliente } from "@/lib/supabase/cliente";
import type { Mensagem } from "@/lib/tipos";
import { dataHora } from "@/lib/formato";
import { enviarMensagem, enviarMidiaDaBiblioteca } from "@/app/(app)/leads/[id]/acoes";
import { SeletorMidia } from "./seletor-midia";

type Midia = { id: string; titulo: string; url: string; mime: string | null };

export function Conversa({
  leadId,
  conversaId,
  mensagensIniciais,
  midias,
}: {
  leadId: string;
  conversaId: string | null;
  mensagensIniciais: Mensagem[];
  midias: Midia[];
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversaId) return;
    const supabase = criarCliente();
    const canal = supabase
      .channel(`mensagens-${conversaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `conversa_id=eq.${conversaId}` },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((atual) => (atual.some((m) => m.id === nova.id) ? atual : [...atual, nova]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [conversaId]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !conversaId) return;
    setErro(null);
    setEnviando(true);
    try {
      await enviarMensagem(leadId, conversaId, texto.trim());
      setTexto("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function escolherMidia(midiaId: string) {
    setSeletorAberto(false);
    if (!conversaId) return;
    try {
      await enviarMidiaDaBiblioteca(leadId, conversaId, midiaId);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar mídia.");
    }
  }

  if (!conversaId) {
    return (
      <div className="rounded-lg border border-marca-200 bg-white p-4 text-sm text-neutral-500">
        Esse lead ainda não tem conversa registrada.
      </div>
    );
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-lg border border-marca-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {!mensagens.length && <p className="text-sm text-neutral-400">Sem mensagens ainda.</p>}
        {mensagens.map((m) => (
          <BolhaMensagem key={m.id} mensagem={m} />
        ))}
        <div ref={fimRef} />
      </div>

      {erro && <p className="px-4 pb-2 text-sm text-red-600">{erro}</p>}

      <form onSubmit={enviar} className="flex items-center gap-2 border-t border-marca-100 p-3">
        <button
          type="button"
          onClick={() => setSeletorAberto(true)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Mídia
        </button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded-md bg-marca-800 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {seletorAberto && (
        <SeletorMidia midias={midias} onFechar={() => setSeletorAberto(false)} onEscolher={escolherMidia} />
      )}
    </div>
  );
}

function BolhaMensagem({ mensagem }: { mensagem: Mensagem }) {
  const minha = mensagem.direcao === "saida";
  return (
    <div className={`mb-2 flex ${minha ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          minha ? "bg-marca-800 text-white" : "bg-neutral-100 text-neutral-900"
        }`}
      >
        {mensagem.midia_url ? (
          <a href={mensagem.midia_url} target="_blank" rel="noreferrer" className="underline">
            {mensagem.conteudo || "Mídia"}
          </a>
        ) : (
          <p>{mensagem.conteudo}</p>
        )}
        <p className={`mt-1 text-xs ${minha ? "text-marca-100" : "text-neutral-400"}`}>
          {dataHora(mensagem.enviada_em)}
          {mensagem.automatica && " · automática"}
        </p>
      </div>
    </div>
  );
}
