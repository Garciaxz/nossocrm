/** Chamadas a Evolution API. Só servidor: a chave nao pode vazar. */

const URL_BASE = process.env.EVOLUTION_API_URL;
const CHAVE = process.env.EVOLUTION_API_KEY;

/** Evolution espera o numero sem sufixo, so digitos com DDI. */
function limpar(numero: string): string {
  return numero.replace(/\D/g, "");
}

export async function enviarTexto(
  instancia: string,
  numero: string,
  texto: string
): Promise<boolean> {
  if (!URL_BASE || !CHAVE) {
    console.error("[evolution] configuracao ausente");
    return false;
  }

  try {
    const r = await fetch(`${URL_BASE}/message/sendText/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CHAVE },
      body: JSON.stringify({ number: limpar(numero), text: texto }),
    });

    if (!r.ok) {
      console.error("[evolution] envio falhou", r.status, await r.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[evolution] excecao no envio", e);
    return false;
  }
}

export async function enviarMidia(
  instancia: string,
  numero: string,
  url: string,
  tipo: "image" | "video" | "document",
  legenda?: string
): Promise<boolean> {
  if (!URL_BASE || !CHAVE) return false;

  try {
    const r = await fetch(`${URL_BASE}/message/sendMedia/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CHAVE },
      body: JSON.stringify({
        number: limpar(numero),
        mediatype: tipo,
        media: url,
        caption: legenda,
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("[evolution] excecao na midia", e);
    return false;
  }
}
