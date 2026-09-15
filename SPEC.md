# SPEC — CRM RD Revestimentos

Documento de especificação para implementação. O banco já está pronto e testado
(ver `supabase/README.md`). Este spec cobre a aplicação.

---

## 1. Contexto

CRM interno da RD Revestimentos, empresa de revestimentos e drywall em Belém-PA
(R. Silva Castro, 336 — Guamá). Substitui o controle atual, que não existe: hoje
os atendimentos chegam no WhatsApp e morrem lá.

**O problema que o sistema resolve:** a estratégia de tráfego pago manda todo lead
para o WhatsApp. Sem captura automática, não há como medir CPL, taxa de fechamento
nem saber qual campanha traz venda. E um CRM que dependa de vendedor digitar
atendimento apodrece em duas semanas.

**A solução:** a Evolution API entrega cada mensagem ao webhook, que cria o lead,
classifica o produto lendo a primeira mensagem e distribui. O vendedor atende
dentro do próprio CRM, não no WhatsApp.

### Usuários

| Papel | Quem | Acesso |
|---|---|---|
| `gerente` | Garcia (Gerente Comercial) | tudo |
| `vendedor` | equipe da loja (entra depois) | próprios leads + fila |
| `diretoria` | sócios | só números agregados |

No início só existe o gerente. O sistema precisa permitir criar usuário pela interface.

### Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Postgres, Auth, Storage, Realtime)
- Tailwind CSS
- Deploy na Vercel (plano Pro — Hobby é uso não comercial)
- Evolution API em VPS Hostinger (KVM, não hospedagem compartilhada)

---

## 2. Regras de negócio

Estas regras já estão implementadas no banco. A aplicação deve respeitá-las, não reimplementá-las.

### 2.1 Captura de lead

1. Mensagem chega no webhook da Evolution
2. Normaliza o telefone (`fn_normalizar_telefone`) — DDI incluído
3. Procura lead por `telefone_normalizado`. Existe? reabre a conversa. Não existe? cria
4. Classifica o produto com `fn_classificar_linha(texto)` sobre a **primeira** mensagem
5. Se a classificação veio de palavra-chave de criativo, marca `origem = meta_ads`
6. Se veio `ctwa_clid` ou referral da Meta, grava campanha, conjunto e criativo
7. Distribui: rodízio se `distribuicao_automatica` estiver ligado, senão deixa sem dono
8. Fora do horário (`fn_dentro_horario`), envia o script `fora_horario` **uma vez por conversa**

### 2.2 SLA

- Meta: responder em até 5 minutos, dentro do expediente (08h–18h, seg a sex)
- `primeira_resposta_em` só é carimbado por **mensagem humana**. A automática de fora
  do horário não para o cronômetro — senão o indicador mente
- Estourou: alerta no sistema e no WhatsApp do gerente (número diferente do número da loja)
- Fonte: view `vw_sla_estourado`

### 2.3 Funil

`novo` → `em_atendimento` → `medicao` → `orcamento_enviado` → `negociacao` → `ganho` / `perdido`

- `medicao` só aparece se `fn_elegivel_instalacao(lead)` retornar true
  (linha aceita instalação **e** metragem ≥ 40 m² — só piso vinílico)
- `perdido` exige `motivo_perda` preenchido
- `ganho` dispara o pedido no Bling (fase 2)

### 2.4 Orçamento

- Itens calculam caixas com `fn_caixas_necessarias(metragem, m2_por_caixa, perda)`, perda padrão 10%
- `preco_m2` e `preco_unidade` estão **nulos** no catálogo. Quando nulo, o vendedor digita
  o valor. Quando preenchido, o sistema calcula. Os dois caminhos precisam funcionar
- Instalação é **valor fechado digitado**, nunca calculado — é terceirizada
- `valor_total` é coluna gerada: materiais + instalação − desconto. Não calcular no front

### 2.5 Distribuição

- Padrão: manual (`distribuicao_automatica = false`)
- Automática: rodízio simples via `fn_proximo_vendedor()`. Se o último foi o vendedor 1,
  o próximo vai para o 2. Ao fim da fila, volta ao começo
- Vendedor pode puxar lead sem dono. **Não pode** repassar para colega nem devolver à fila
  (o RLS bloqueia). Só gerente redistribui

---

## 3. Telas

### 3.1 Login (`/login`)
Email e senha via Supabase Auth. Sem cadastro público — usuário é criado pelo gerente.

### 3.2 Painel (`/`)
- Cards de KPI conforme `kpis_painel` do usuário (ligáveis e desligáveis)
- Alerta de SLA estourado no topo, se houver
- Funil resumido com contagem por etapa
- Últimos leads recebidos
- Diretoria vê esta tela lendo `vw_diretoria_mensal` — **sem** lista de leads

### 3.3 Leads (`/leads`)
- Kanban por etapa, arrastável
- Filtros: linha de produto, origem, responsável, período, bairro
- Busca por nome e telefone
- Alternar entre kanban e tabela (tabela funciona melhor no celular)
- Botão de criar lead manual

### 3.4 Lead (`/leads/[id]`)
Três áreas:

**Dados** — nome, telefone, bairro, linha, produto, metragem, ambiente, tipo de cliente,
valor estimado, responsável, etapa. Edição inline.

**Conversa** — histórico completo, envio de mensagem, anexar mídia da biblioteca.
Atualização em tempo real via Supabase Realtime na tabela `mensagens`.

**Trilha** — atividades, medições e orçamentos do lead.

Botão de agendar medição aparece só se `elegivel_instalacao` for true.

### 3.5 Relatórios (`/relatorios`)
- Modo simples e modo detalhado
- KPIs configuráveis
- Fontes: `vw_metricas_mensais`, `vw_funil_atual`, `vw_diretoria_mensal`
- Lançamento manual de investimento em `investimentos_midia` (isso alimenta CPL, CAC e ROAS)
- Exportar CSV e PDF

### 3.6 Biblioteca (`/biblioteca`)
Mídias para mandar ao cliente. Filtro por linha de produto **e** por ambiente
(sala, banheiro, cozinha, fachada, recepção). Upload para o Supabase Storage.
Incrementar `vezes_enviada` quando usada.

### 3.7 Configurações (`/config`) — só gerente
- Usuários: criar, desativar, mudar papel, ligar e desligar do rodízio
- Catálogo: editar produto e **preencher preços**
- Regras de classificação: adicionar termo
- Scripts de mensagem
- Horário de atendimento
- Chaves da Evolution

---

## 4. Webhook da Evolution

`POST /api/webhook/evolution` — ver implementação de referência em
`src/app/api/webhook/evolution/route.ts`.

### Segurança

1. Header `apikey` conferido contra `EVOLUTION_WEBHOOK_TOKEN` em **comparação de tempo constante**
2. Usa `service_role`, que **ignora RLS por definição do Postgres**. Só pode existir
   em Route Handler. Nunca em componente de cliente, nunca em `NEXT_PUBLIC_`
3. Ignora `fromMe` para não criar lead a partir de mensagem da própria loja
4. Idempotente por `id_externo` — a Evolution reenvia em caso de falha

### Eventos

- `messages.upsert` — principal
- `connection.update` — registrar estado da instância
- Demais: responder 200 e ignorar

Sempre responder **200**, mesmo em erro interno. Status de erro faz a Evolution
reenviar em loop.

---

## 5. Fora de escopo agora

| Item | Por quê | O que já está pronto |
|---|---|---|
| Instagram DM | Evolution não faz Instagram. Exige Instagram Messaging API e revisão da permissão `instagram_manage_messages` pela Meta, que leva semanas | `canal_tipo` já tem `instagram_dm`; tabelas aceitam |
| Bling | Homologação da API leva tempo | `orcamentos.bling_pedido_id` reservado |
| Investimento automático | API do Meta e do Google | `investimentos_midia` aceita lançamento manual hoje |
| Expurgo de conversa | Precisa de job agendado | `retencao_mensagens_meses = 12` já configurado |

---

## 6. Convenções

- **Tudo em português**: rotas, variáveis, componentes, mensagens de erro. O banco está em português, o código acompanha
- Sem travessão (—) em texto de interface
- Datas em `America/Belem`
- Moeda em BRL com `Intl.NumberFormat('pt-BR')`
- Telefone exibido como `(91) 98058-4728`, armazenado normalizado
- Mobile importa: o vendedor usa celular na loja e computador na mesa

## 7. Ordem sugerida de implementação

1. Auth, middleware e layout
2. Webhook (sem ele não entra dado)
3. Lista e kanban de leads
4. Detalhe do lead e inbox
5. Orçamento e medição
6. Relatórios
7. Biblioteca e configurações

O item 2 antes do 3 é proposital: com o webhook de pé, você acumula lead real
enquanto constrói o resto, e testa com dado de verdade em vez de seed falso.
