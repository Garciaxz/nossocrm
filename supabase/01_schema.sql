-- ============================================================
-- CRM RD REVESTIMENTOS — SCHEMA
-- Postgres / Supabase
-- Execute na ordem: 01_schema.sql, 02_rls.sql, 03_seed.sql
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ============================================================
-- TIPOS
-- ============================================================

create type papel_usuario as enum ('gerente', 'vendedor', 'diretoria');

create type etapa_lead as enum (
  'novo',
  'em_atendimento',
  'medicao',
  'orcamento_enviado',
  'negociacao',
  'ganho',
  'perdido'
);

create type origem_lead as enum (
  'meta_ads',
  'google_ads',
  'organico',
  'indicacao',
  'direto',
  'desconhecida'
);

create type tipo_cliente as enum (
  'consumidor_final',
  'arquiteto_designer',
  'lojista_revenda',
  'construtora',
  'nao_definido'
);

create type tipo_ambiente as enum (
  'residencial',
  'comercial',
  'corporativo',
  'industrial',
  'nao_definido'
);

create type canal_tipo as enum ('whatsapp', 'instagram_dm', 'manual');

create type direcao_mensagem as enum ('entrada', 'saida');

create type tipo_midia as enum ('texto', 'imagem', 'video', 'audio', 'documento', 'localizacao', 'outro');

create type status_medicao as enum ('agendada', 'realizada', 'cancelada', 'nao_compareceu');

create type status_orcamento as enum ('rascunho', 'enviado', 'aceito', 'recusado', 'expirado');

-- ============================================================
-- PERFIS (espelha auth.users)
-- ============================================================

create table perfis (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null,
  email         text not null,
  papel         papel_usuario not null default 'vendedor',
  telefone      text,
  ativo         boolean not null default true,
  recebe_rodizio boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column perfis.recebe_rodizio is
  'Se false, o vendedor fica fora da distribuicao automatica mas continua atendendo o que ja tem.';

-- Cria o perfil automaticamente quando nasce um usuario no auth
create or replace function fn_criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfis (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'papel')::papel_usuario, 'vendedor')
  );
  return new;
end;
$$;

create trigger trg_criar_perfil
  after insert on auth.users
  for each row execute function fn_criar_perfil();

-- ============================================================
-- CATALOGO
-- ============================================================

create table linhas_produto (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  nome          text not null,
  categoria     text not null,              -- piso, parede, forro, teto, estrutura, porta, carpete
  descricao     text,
  aceita_instalacao boolean not null default false,
  metragem_minima_instalacao numeric(10,2), -- 40 m2 no piso vinilico
  prioridade_trafego boolean not null default false,
  ativo         boolean not null default true,
  ordem         int not null default 0
);

comment on table linhas_produto is
  'Linha comercial. E o nivel que o webhook consegue identificar sozinho na primeira mensagem.';

create table produtos (
  id              uuid primary key default gen_random_uuid(),
  linha_id        uuid not null references linhas_produto(id) on delete restrict,
  codigo          text unique,              -- 3.650.XXXX do catalogo
  modelo          text not null,            -- Volga, Orus, Bianco Fosca
  cor             text,
  material        text,
  dimensoes       text,
  m2_por_caixa    numeric(10,4),            -- permite calcular caixas a partir do m2 do cliente
  unidade_venda   text not null default 'caixa',
  preco_m2        numeric(12,2),            -- a preencher
  preco_unidade   numeric(12,2),            -- a preencher
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create index idx_produtos_linha on produtos(linha_id) where ativo;
create index idx_produtos_codigo on produtos(codigo);

-- Termos que o cliente realmente digita no WhatsApp
create table regras_classificacao (
  id          uuid primary key default gen_random_uuid(),
  termo       text not null,
  linha_id    uuid references linhas_produto(id) on delete cascade,
  origem_sugerida origem_lead,
  peso        int not null default 10,      -- maior vence em caso de empate
  exige_isolado boolean not null default false,
  ativo       boolean not null default true
);

create index idx_regras_termo on regras_classificacao(termo) where ativo;

comment on column regras_classificacao.peso is
  'Palavra-chave de criativo (VINILICO, BAMBOO, STONE) recebe peso alto porque foi a marca que ensinou o cliente a mandar.';

-- ============================================================
-- LEADS
-- ============================================================

create table leads (
  id                  uuid primary key default gen_random_uuid(),

  -- identificacao
  nome                text,
  telefone            text not null,
  telefone_normalizado text not null,       -- so digitos, com DDI
  email               text,
  bairro              text,
  cidade              text default 'Belém',

  -- qualificacao
  linha_id            uuid references linhas_produto(id) on delete set null,
  produto_id          uuid references produtos(id) on delete set null,
  metragem_m2         numeric(10,2),
  tipo_ambiente       tipo_ambiente not null default 'nao_definido',
  tipo_cliente        tipo_cliente not null default 'nao_definido',

  -- funil
  etapa               etapa_lead not null default 'novo',
  responsavel_id      uuid references perfis(id) on delete set null,
  valor_estimado      numeric(12,2),
  motivo_perda        text,

  -- origem
  origem              origem_lead not null default 'desconhecida',
  campanha            text,
  conjunto            text,
  criativo            text,
  palavra_chave       text,                 -- VINILICO, BAMBOO, STONE...
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  ctwa_clid           text,                 -- click-to-WhatsApp da Meta

  -- SLA
  primeira_mensagem_em timestamptz,
  primeira_resposta_em timestamptz,
  ultima_interacao_em  timestamptz,
  sla_alertado         boolean not null default false,

  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),

  constraint chk_metragem check (metragem_m2 is null or metragem_m2 > 0),
  constraint chk_valor check (valor_estimado is null or valor_estimado >= 0)
);

create unique index idx_leads_telefone on leads(telefone_normalizado);
create index idx_leads_etapa on leads(etapa);
create index idx_leads_responsavel on leads(responsavel_id);
create index idx_leads_origem on leads(origem);
create index idx_leads_linha on leads(linha_id);
create index idx_leads_criado on leads(criado_em desc);
create index idx_leads_sla on leads(primeira_mensagem_em)
  where primeira_resposta_em is null and etapa = 'novo';

-- Tempo de resposta em segundos, calculado
create or replace function fn_tempo_resposta_seg(l leads)
returns int
language sql
immutable
as $$
  select case
    when l.primeira_resposta_em is null or l.primeira_mensagem_em is null then null
    else extract(epoch from (l.primeira_resposta_em - l.primeira_mensagem_em))::int
  end;
$$;

-- Elegivel a instalacao: linha aceita e metragem passa do minimo
create or replace function fn_elegivel_instalacao(l leads)
returns boolean
language sql
stable
as $$
  select coalesce((
    select lp.aceita_instalacao
       and l.metragem_m2 is not null
       and l.metragem_m2 >= coalesce(lp.metragem_minima_instalacao, 0)
    from linhas_produto lp
    where lp.id = l.linha_id
  ), false);
$$;

-- ============================================================
-- CONVERSAS E MENSAGENS
-- ============================================================

create table conversas (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references leads(id) on delete cascade,
  canal           canal_tipo not null default 'whatsapp',
  identificador   text not null,            -- numero ou @ do instagram
  instancia       text,                     -- instancia da Evolution
  aberta          boolean not null default true,
  ultima_mensagem_em timestamptz,
  criado_em       timestamptz not null default now(),
  unique (lead_id, canal, identificador)
);

create index idx_conversas_lead on conversas(lead_id);

create table mensagens (
  id                uuid primary key default gen_random_uuid(),
  conversa_id       uuid not null references conversas(id) on delete cascade,
  lead_id           uuid not null references leads(id) on delete cascade,
  direcao           direcao_mensagem not null,
  tipo              tipo_midia not null default 'texto',
  conteudo          text,
  midia_url         text,
  midia_mime        text,
  autor_id          uuid references perfis(id) on delete set null,  -- null = cliente ou automacao
  automatica        boolean not null default false,
  id_externo        text,                   -- id da mensagem na Evolution, evita duplicata
  enviada_em        timestamptz not null default now(),
  criado_em         timestamptz not null default now()
);

create unique index idx_mensagens_externo on mensagens(id_externo) where id_externo is not null;
create index idx_mensagens_conversa on mensagens(conversa_id, enviada_em desc);
create index idx_mensagens_lead on mensagens(lead_id, enviada_em desc);

-- ============================================================
-- ATIVIDADES (trilha de auditoria do lead)
-- ============================================================

create table atividades (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  autor_id    uuid references perfis(id) on delete set null,
  tipo        text not null,                -- nota, etapa, atribuicao, sistema
  descricao   text not null,
  dados       jsonb,
  criado_em   timestamptz not null default now()
);

create index idx_atividades_lead on atividades(lead_id, criado_em desc);

-- ============================================================
-- MEDICAO
-- ============================================================

create table medicoes (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references leads(id) on delete cascade,
  agendada_para     timestamptz not null,
  endereco          text not null,
  responsavel_nome  text,                   -- medidor terceirizado
  responsavel_telefone text,
  status            status_medicao not null default 'agendada',
  metragem_aferida  numeric(10,2),
  observacoes       text,
  criado_por        uuid references perfis(id) on delete set null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create index idx_medicoes_lead on medicoes(lead_id);
create index idx_medicoes_data on medicoes(agendada_para) where status = 'agendada';

-- ============================================================
-- ORCAMENTOS
-- ============================================================

create table orcamentos (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references leads(id) on delete cascade,
  numero            serial unique,
  status            status_orcamento not null default 'rascunho',

  valor_materiais   numeric(12,2) not null default 0,
  valor_instalacao  numeric(12,2) not null default 0,   -- valor fechado, digitado
  desconto          numeric(12,2) not null default 0,
  valor_total       numeric(12,2) generated always as
                      (valor_materiais + valor_instalacao - desconto) stored,

  validade_dias     int not null default 15,
  observacoes       text,

  bling_pedido_id   text,                   -- preenchido quando o lead vira ganho
  bling_sincronizado_em timestamptz,

  criado_por        uuid references perfis(id) on delete set null,
  enviado_em        timestamptz,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create index idx_orcamentos_lead on orcamentos(lead_id);
create index idx_orcamentos_status on orcamentos(status);

create table orcamento_itens (
  id              uuid primary key default gen_random_uuid(),
  orcamento_id    uuid not null references orcamentos(id) on delete cascade,
  produto_id      uuid references produtos(id) on delete set null,
  descricao       text not null,            -- congela o nome, caso o produto mude depois
  metragem_m2     numeric(10,2),
  quantidade      numeric(10,2) not null default 1,
  unidade         text not null default 'caixa',
  preco_unitario  numeric(12,2) not null default 0,
  subtotal        numeric(12,2) generated always as (quantidade * preco_unitario) stored,
  ordem           int not null default 0
);

create index idx_itens_orcamento on orcamento_itens(orcamento_id);

-- Quantas caixas para cobrir X m2, com a perda tecnica
create or replace function fn_caixas_necessarias(
  p_metragem numeric,
  p_m2_por_caixa numeric,
  p_perda_pct numeric default 10
)
returns int
language sql
immutable
as $$
  select case
    when p_metragem is null or p_m2_por_caixa is null or p_m2_por_caixa <= 0 then null
    else ceil((p_metragem * (1 + p_perda_pct / 100.0)) / p_m2_por_caixa)::int
  end;
$$;

comment on function fn_caixas_necessarias is
  'Perda padrao de 10 por cento. Piso assentado na diagonal ou ambiente recortado pede mais.';

-- ============================================================
-- SCRIPTS E MIDIA
-- ============================================================

create table scripts_mensagem (
  id          uuid primary key default gen_random_uuid(),
  chave       text not null unique,         -- fora_horario, saudacao, follow_up_1
  titulo      text not null,
  conteudo    text not null,
  ativo       boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create table biblioteca_midia (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  url         text not null,
  mime        text,
  linha_id    uuid references linhas_produto(id) on delete set null,
  produto_id  uuid references produtos(id) on delete set null,
  ambiente    text,                         -- sala, banheiro, cozinha, fachada, recepcao
  tags        text[],
  vezes_enviada int not null default 0,
  criado_por  uuid references perfis(id) on delete set null,
  criado_em   timestamptz not null default now()
);

create index idx_midia_linha on biblioteca_midia(linha_id);
create index idx_midia_ambiente on biblioteca_midia(ambiente);
create index idx_midia_tags on biblioteca_midia using gin(tags);

-- ============================================================
-- CONFIGURACAO E METRICAS
-- ============================================================

create table configuracoes (
  chave       text primary key,
  valor       jsonb not null,
  descricao   text,
  atualizado_em timestamptz not null default now()
);

create table investimentos_midia (
  id          uuid primary key default gen_random_uuid(),
  canal       origem_lead not null,
  referencia  date not null,                -- primeiro dia do mes
  valor       numeric(12,2) not null,
  observacao  text,
  criado_por  uuid references perfis(id) on delete set null,
  criado_em   timestamptz not null default now(),
  unique (canal, referencia)
);

comment on table investimentos_midia is
  'Lancamento manual por enquanto. A API do Meta e do Google preenche isso depois sem mudar o schema.';

create table kpis_painel (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid references perfis(id) on delete cascade,
  chave       text not null,                -- cpl, volume_leads, taxa_fechamento, cac, roas
  visivel     boolean not null default true,
  ordem       int not null default 0,
  unique (perfil_id, chave)
);

comment on table kpis_painel is
  'Cada pessoa liga e desliga os KPIs do painel. perfil_id nulo = padrao do sistema.';

-- ============================================================
-- HORARIO DE ATENDIMENTO
-- ============================================================

create table horarios_atendimento (
  dia_semana  int primary key check (dia_semana between 0 and 6),  -- 0 = domingo
  abre        time,
  fecha       time,
  atende      boolean not null default true
);

create or replace function fn_dentro_horario(p_momento timestamptz default now())
returns boolean
language plpgsql
stable
as $$
declare
  v_local timestamp;
  v_dia int;
  v_hora time;
  v_reg horarios_atendimento%rowtype;
begin
  v_local := p_momento at time zone 'America/Belem';
  v_dia := extract(dow from v_local)::int;
  v_hora := v_local::time;

  select * into v_reg from horarios_atendimento where dia_semana = v_dia;

  if not found or not v_reg.atende or v_reg.abre is null then
    return false;
  end if;

  return v_hora >= v_reg.abre and v_hora < v_reg.fecha;
end;
$$;

-- ============================================================
-- CLASSIFICACAO AUTOMATICA
-- ============================================================

create or replace function fn_normalizar(p_texto text)
returns text
language sql
immutable
as $$
  select lower(unaccent(coalesce(p_texto, '')));
$$;

create or replace function fn_classificar_linha(p_texto text)
returns table (linha_id uuid, termo text, origem_sugerida origem_lead)
language sql
stable
as $$
  with candidatos as (
    select r.linha_id, r.termo, r.origem_sugerida, r.peso, r.exige_isolado
    from regras_classificacao r
    where r.ativo
      and fn_normalizar(p_texto) like '%' || fn_normalizar(r.termo) || '%'
      and (
        not r.exige_isolado
        or fn_normalizar(p_texto) ~ ('(^|\s|[[:punct:]])' || fn_normalizar(r.termo) || '($|\s|[[:punct:]])')
      )
  ),
  descritivo as (
    select * from candidatos where not exige_isolado
    order by length(termo) desc, peso desc limit 1
  ),
  criativo as (
    select * from candidatos where exige_isolado
    order by peso desc, length(termo) desc limit 1
  )
  select
    coalesce(d.linha_id, c.linha_id),
    coalesce(d.termo, c.termo),
    coalesce(c.origem_sugerida, d.origem_sugerida)
  from (select 1) x
  left join descritivo d on true
  left join criativo  c on true
  where coalesce(d.linha_id, c.linha_id) is not null;
$$;

comment on function fn_classificar_linha is
  'Termo descritivo decide a linha (o mais longo ganha: "teto vinilico" vence "vinilico"). A palavra-chave de criativo so decide a linha quando nada descritivo casou, mas sempre define a origem como meta_ads.';

-- Telefone sempre no mesmo formato, senao o mesmo cliente vira dois leads
create or replace function fn_normalizar_telefone(p_telefone text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  if v = '' then return null; end if;

  -- tira o 9 extra de celular quando vem com DDI e 13 digitos
  if length(v) = 13 and left(v, 2) = '55' then
    return v;
  elsif length(v) = 12 and left(v, 2) = '55' then
    return v;
  elsif length(v) in (10, 11) then
    return '55' || v;
  else
    return v;
  end if;
end;
$$;

create or replace function fn_set_telefone_normalizado()
returns trigger
language plpgsql
as $$
begin
  new.telefone_normalizado := fn_normalizar_telefone(new.telefone);
  if new.telefone_normalizado is null then
    raise exception 'Telefone invalido: %', new.telefone;
  end if;
  return new;
end;
$$;

create trigger trg_leads_telefone
  before insert or update of telefone on leads
  for each row execute function fn_set_telefone_normalizado();

-- ============================================================
-- RODIZIO DE VENDEDORES
-- ============================================================

create or replace function fn_proximo_vendedor()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ultimo uuid;
  v_proximo uuid;
begin
  select (valor->>'perfil_id')::uuid into v_ultimo
  from configuracoes where chave = 'rodizio_ultimo';

  -- proximo da fila depois do ultimo atendido
  select p.id into v_proximo
  from perfis p
  where p.ativo and p.recebe_rodizio and p.papel in ('vendedor', 'gerente')
    and (v_ultimo is null or p.criado_em > (select criado_em from perfis where id = v_ultimo))
  order by p.criado_em
  limit 1;

  -- deu a volta, volta pro primeiro
  if v_proximo is null then
    select p.id into v_proximo
    from perfis p
    where p.ativo and p.recebe_rodizio and p.papel in ('vendedor', 'gerente')
    order by p.criado_em
    limit 1;
  end if;

  if v_proximo is not null then
    insert into configuracoes (chave, valor, descricao)
    values ('rodizio_ultimo', jsonb_build_object('perfil_id', v_proximo), 'Ultimo que recebeu lead no rodizio')
    on conflict (chave) do update
      set valor = excluded.valor, atualizado_em = now();
  end if;

  return v_proximo;
end;
$$;

comment on function fn_proximo_vendedor is
  'Rodizio simples: se o ultimo foi o vendedor 1, o proximo vai pro 2. Volta ao inicio ao fim da fila.';

-- ============================================================
-- TRIGGERS DE TRILHA E SLA
-- ============================================================

create or replace function fn_touch()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_leads_touch before update on leads
  for each row execute function fn_touch();
create trigger trg_orcamentos_touch before update on orcamentos
  for each row execute function fn_touch();
create trigger trg_medicoes_touch before update on medicoes
  for each row execute function fn_touch();

-- Registra mudanca de etapa e de dono na trilha
create or replace function fn_log_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.etapa is distinct from old.etapa then
    insert into atividades (lead_id, autor_id, tipo, descricao, dados)
    values (
      new.id, auth.uid(), 'etapa',
      format('Etapa mudou de %s para %s', old.etapa, new.etapa),
      jsonb_build_object('de', old.etapa, 'para', new.etapa)
    );
  end if;

  if new.responsavel_id is distinct from old.responsavel_id then
    insert into atividades (lead_id, autor_id, tipo, descricao, dados)
    values (
      new.id, auth.uid(), 'atribuicao',
      case when new.responsavel_id is null then 'Lead devolvido para a fila'
           else format('Lead atribuido a %s', (select nome from perfis where id = new.responsavel_id))
      end,
      jsonb_build_object('de', old.responsavel_id, 'para', new.responsavel_id)
    );
  end if;

  return new;
end;
$$;

create trigger trg_log_lead after update on leads
  for each row execute function fn_log_lead();

-- Primeira resposta humana carimba o SLA
create or replace function fn_marcar_sla()
returns trigger
language plpgsql
as $$
begin
  if new.direcao = 'saida' and not new.automatica then
    update leads
    set primeira_resposta_em = coalesce(primeira_resposta_em, new.enviada_em),
        ultima_interacao_em  = new.enviada_em
    where id = new.lead_id;
  else
    update leads
    set ultima_interacao_em = new.enviada_em,
        primeira_mensagem_em = coalesce(primeira_mensagem_em, new.enviada_em)
    where id = new.lead_id;
  end if;

  update conversas set ultima_mensagem_em = new.enviada_em where id = new.conversa_id;
  return new;
end;
$$;

create trigger trg_marcar_sla after insert on mensagens
  for each row execute function fn_marcar_sla();

comment on function fn_marcar_sla is
  'Mensagem automatica fora do horario nao conta como resposta: o SLA so para quando um humano responde.';

-- ============================================================
-- VISOES DE RELATORIO
-- ============================================================

create or replace view vw_leads_completo as
select
  l.*,
  lp.nome  as linha_nome,
  lp.slug  as linha_slug,
  p.modelo as produto_modelo,
  p.codigo as produto_codigo,
  resp.nome as responsavel_nome,
  fn_tempo_resposta_seg(l) as tempo_resposta_seg,
  fn_elegivel_instalacao(l) as elegivel_instalacao,
  (select count(*) from mensagens m where m.lead_id = l.id) as total_mensagens
from leads l
left join linhas_produto lp on lp.id = l.linha_id
left join produtos p        on p.id  = l.produto_id
left join perfis resp       on resp.id = l.responsavel_id;

create or replace view vw_metricas_mensais as
with base as (
  select
    date_trunc('month', l.criado_em)::date as mes,
    l.origem,
    count(*)                                             as leads,
    count(*) filter (where l.etapa = 'ganho')            as ganhos,
    count(*) filter (where l.etapa = 'perdido')          as perdidos,
    count(*) filter (where l.tipo_cliente <> 'nao_definido'
                       and l.metragem_m2 is not null)    as qualificados,
    sum(l.valor_estimado) filter (where l.etapa = 'ganho') as receita,
    avg(fn_tempo_resposta_seg(l))                        as tempo_resposta_medio
  from leads l
  group by 1, 2
)
select
  b.*,
  i.valor as investimento,
  case when b.leads > 0 and i.valor is not null
       then round(i.valor / b.leads, 2) end               as cpl,
  case when b.ganhos > 0 and i.valor is not null
       then round(i.valor / b.ganhos, 2) end              as cac,
  case when i.valor > 0 and b.receita is not null
       then round(b.receita / i.valor, 2) end             as roas,
  case when b.leads > 0
       then round(100.0 * b.ganhos / b.leads, 2) end      as taxa_fechamento_pct,
  case when b.leads > 0
       then round(100.0 * b.qualificados / b.leads, 2) end as taxa_qualificacao_pct
from base b
left join investimentos_midia i
  on i.canal = b.origem and i.referencia = b.mes;

create or replace view vw_funil_atual as
select
  etapa,
  count(*) as total,
  sum(valor_estimado) as valor_total
from leads
where etapa not in ('ganho', 'perdido')
group by etapa;

-- Leads estourando o SLA de 5 minutos dentro do horario comercial
create or replace view vw_sla_estourado as
select
  l.id, l.nome, l.telefone, l.primeira_mensagem_em, l.responsavel_id,
  extract(epoch from (now() - l.primeira_mensagem_em))::int as segundos_esperando
from leads l
where l.primeira_resposta_em is null
  and l.primeira_mensagem_em is not null
  and l.etapa = 'novo'
  and fn_dentro_horario(l.primeira_mensagem_em)
  and now() - l.primeira_mensagem_em > interval '5 minutes'
order by l.primeira_mensagem_em;
