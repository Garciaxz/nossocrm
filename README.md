# CRM RD Revestimentos

Base do projeto. Continuar no Claude Code, seguindo `SPEC.md`.

---

## Estado de verificação

Sendo direto sobre o que foi testado de verdade e o que não foi.

### Verificado

| O quê | Como |
|---|---|
| Schema completo | Executado em Postgres 16 real, do zero, sem erro |
| Classificação automática | 19 mensagens de WhatsApp realistas, todas corretas |
| Normalização de telefone | 5 formatos diferentes convergindo para o mesmo valor |
| Cálculo de caixas | 45 m² em 4 produtos, com perda de 10% |
| Horário de atendimento | Dentro, fora e fim de semana, fuso `America/Belem` |
| Políticas de acesso | 6 cenários: gerente vê 3, vendedor vê 2, diretoria vê 0, vendedor não rouba lead nem se promove |
| Build do Next.js | `next build` passando, 0 erro de tipo |
| Segurança do webhook | Sem token → 401. Token errado → 401. Token certo → 200 |
| Filtros do webhook | `fromMe`, grupo e evento não tratado ignorados corretamente |

Dois bugs reais foram encontrados e corrigidos durante os testes do banco.
O maior: a palavra-chave `VINILICO` tinha prioridade absoluta e sequestrava
"teto vinílico" para o funil de piso. Está documentado em `supabase/README.md`.

### Não verificado

**O webhook gravando no banco de ponta a ponta.** Tentei emular a API do Supabase
com PostgREST localmente e não consegui manter a stack de pé de forma confiável.
A lógica está escrita e revisada, mas não vi um lead nascer de uma mensagem.

Esse é o **primeiro teste a fazer** depois de subir o Supabase. Está descrito abaixo.

---

## Passo a passo

### 1. Supabase

Criar projeto e rodar no SQL Editor, nesta ordem:

1. `supabase/01_schema.sql`
2. `supabase/02_rls.sql`
3. `supabase/03_seed.sql`

Criar o primeiro usuário em Authentication → Users, depois promover a gerente:

```sql
update perfis set papel = 'gerente' where email = 'seu@email.com';
```

### 2. Projeto

```bash
npm install
cp .env.example .env.local   # preencher
npm run dev
```

Gerar os tipos do banco (deixa o TypeScript conhecer as tabelas):

```bash
npx supabase gen types typescript --project-id SEU_ID > src/lib/banco.types.ts
```

### 3. Evolution API

VPS Hostinger com plano **KVM**. Hospedagem compartilhada não roda Docker nem
mantém processo de pé.

Configurar o webhook apontando para:

```
https://SEU_APP.vercel.app/api/webhook/evolution
```

Evento: `MESSAGES_UPSERT`. Header `apikey` com o mesmo valor de
`EVOLUTION_WEBHOOK_TOKEN`.

### 4. Primeiro teste, antes de construir qualquer tela

```bash
curl -X POST https://SEU_APP.vercel.app/api/webhook/evolution \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_TOKEN" \
  -d '{
    "event":"messages.upsert",
    "instance":"rd-loja",
    "data":{
      "key":{"remoteJid":"5591991234567@s.whatsapp.net","fromMe":false,"id":"TESTE001"},
      "pushName":"Cliente Teste",
      "messageType":"conversation",
      "message":{"conversation":"bom dia, queria saber o preco do piso vinilico"},
      "messageTimestamp":1789000000
    }
  }'
```

Conferir no Supabase:

```sql
select l.nome, l.telefone_normalizado, lp.nome as linha, l.palavra_chave, l.origem
from leads l left join linhas_produto lp on lp.id = l.linha_id;
```

Esperado: um lead com a linha **Piso Vinílico Clicado — Linha FIT**.

Mandar o **mesmo comando de novo**: deve responder `{"duplicada":true}` e não criar
segundo lead. É o teste de idempotência, e importa porque a Evolution reenvia quando
não recebe 200 a tempo.

### 5. Seguir o SPEC

Ordem sugerida em `SPEC.md`, seção 7. O webhook vem antes das telas de propósito:
com ele de pé, você acumula lead real enquanto constrói o resto e testa com dado
de verdade em vez de seed inventado.

---

## O que já está escrito

```
src/lib/supabase/cliente.ts    navegador, chave anon, respeita RLS
src/lib/supabase/servidor.ts   servidor com sessão, respeita RLS
src/lib/supabase/admin.ts      service_role, IGNORA RLS
src/lib/evolution.ts           enviar texto e mídia
src/lib/tipos.ts               enums e tipos espelhando o banco
src/lib/formato.ts             moeda, telefone, data, metragem, duração
src/middleware.ts              proteção de rota, webhook fora do matcher
src/app/api/webhook/evolution/route.ts   captura completa
```

As telas em `src/app` são esqueleto, só para o build validar as rotas.

---

## ⚠️ Antes de tudo

**`SUPABASE_SERVICE_ROLE_KEY` ignora RLS por definição do Postgres.** Só pode viver
em Route Handler ou Server Action. Nunca em componente de cliente, nunca com prefixo
`NEXT_PUBLIC_`. Se vazar para o navegador, o banco inteiro vai junto.

**Vercel Hobby é para uso não comercial.** CRM de empresa precisa do plano Pro.
Alternativa: rodar o Next.js na mesma VPS da Evolution.

**Supabase gratuito** tem 500 MB de banco e pausa com 7 dias sem acesso. Guardar
conversa inteira mais biblioteca de imagens consome isso rápido.

**Instagram DM não sai nesta semana.** Evolution não faz Instagram. Depende da
Instagram Messaging API e da revisão da permissão `instagram_manage_messages` pela
Meta, que leva de dias a semanas. O banco já aceita o canal; é ligar quando aprovar.
