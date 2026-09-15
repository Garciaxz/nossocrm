-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Papeis:
--   gerente   — acesso total
--   vendedor  — ve e edita os proprios leads, pode pegar lead sem dono
--   diretoria — so numero agregado, NAO ve nome nem telefone de cliente
--
-- O service_role do webhook ignora RLS por definicao do Postgres.
-- Por isso a chave service_role NUNCA pode chegar ao navegador:
-- ela vive apenas nas Route Handlers do servidor.
-- ============================================================

alter table perfis                enable row level security;
alter table leads                 enable row level security;
alter table conversas             enable row level security;
alter table mensagens             enable row level security;
alter table atividades            enable row level security;
alter table medicoes              enable row level security;
alter table orcamentos            enable row level security;
alter table orcamento_itens       enable row level security;
alter table linhas_produto        enable row level security;
alter table produtos              enable row level security;
alter table regras_classificacao  enable row level security;
alter table scripts_mensagem      enable row level security;
alter table biblioteca_midia      enable row level security;
alter table configuracoes         enable row level security;
alter table investimentos_midia   enable row level security;
alter table kpis_painel           enable row level security;
alter table horarios_atendimento  enable row level security;

-- ------------------------------------------------------------
-- HELPERS
-- ------------------------------------------------------------
-- security definer + search_path fixo: evita recursao de RLS
-- quando a policy de uma tabela precisa consultar perfis.

create or replace function fn_meu_papel()
returns papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select papel from perfis where id = auth.uid() and ativo;
$$;

create or replace function fn_e_gerente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(fn_meu_papel() = 'gerente', false);
$$;

create or replace function fn_e_diretoria()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(fn_meu_papel() = 'diretoria', false);
$$;

create or replace function fn_opera_leads()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(fn_meu_papel() in ('gerente', 'vendedor'), false);
$$;

-- ------------------------------------------------------------
-- PERFIS
-- ------------------------------------------------------------
create policy perfis_leitura on perfis
  for select using (auth.uid() is not null);

create policy perfis_edita_proprio on perfis
  for update using (id = auth.uid())
  with check (id = auth.uid() and papel = (select papel from perfis where id = auth.uid()));

create policy perfis_gerente_tudo on perfis
  for all using (fn_e_gerente()) with check (fn_e_gerente());

comment on policy perfis_edita_proprio on perfis is
  'A pessoa edita o proprio nome e telefone, mas nao consegue se promover: o papel tem que continuar igual.';

-- ------------------------------------------------------------
-- LEADS
-- ------------------------------------------------------------
-- Diretoria NAO entra aqui. Ela le as views agregadas, que nao
-- expoem nome nem telefone.

create policy leads_vendedor_le on leads
  for select using (
    fn_e_gerente()
    or (fn_opera_leads() and (responsavel_id = auth.uid() or responsavel_id is null))
  );

create policy leads_vendedor_pega on leads
  for update using (
    fn_e_gerente()
    or (fn_opera_leads() and (responsavel_id = auth.uid() or responsavel_id is null))
  )
  with check (
    fn_e_gerente()
    or (fn_opera_leads() and responsavel_id = auth.uid())
  );

create policy leads_insere on leads
  for insert with check (fn_opera_leads());

create policy leads_gerente_apaga on leads
  for delete using (fn_e_gerente());

comment on policy leads_vendedor_pega on leads is
  'Vendedor pode puxar lead sem dono pra si, mas o with check exige que ele fique como responsavel: nao da pra repassar pro colega nem soltar de volta.';

-- ------------------------------------------------------------
-- CONVERSAS E MENSAGENS — seguem o dono do lead
-- ------------------------------------------------------------
create policy conversas_pelo_lead on conversas
  for all using (
    fn_e_gerente()
    or exists (
      select 1 from leads l where l.id = conversas.lead_id
        and fn_opera_leads() and (l.responsavel_id = auth.uid() or l.responsavel_id is null)
    )
  )
  with check (fn_opera_leads());

create policy mensagens_pelo_lead on mensagens
  for all using (
    fn_e_gerente()
    or exists (
      select 1 from leads l where l.id = mensagens.lead_id
        and fn_opera_leads() and (l.responsavel_id = auth.uid() or l.responsavel_id is null)
    )
  )
  with check (fn_opera_leads());

create policy atividades_pelo_lead on atividades
  for select using (
    fn_e_gerente()
    or exists (
      select 1 from leads l where l.id = atividades.lead_id
        and fn_opera_leads() and (l.responsavel_id = auth.uid() or l.responsavel_id is null)
    )
  );

create policy atividades_insere on atividades
  for insert with check (fn_opera_leads());

create policy medicoes_pelo_lead on medicoes
  for all using (
    fn_e_gerente()
    or exists (
      select 1 from leads l where l.id = medicoes.lead_id
        and fn_opera_leads() and (l.responsavel_id = auth.uid() or l.responsavel_id is null)
    )
  )
  with check (fn_opera_leads());

create policy orcamentos_pelo_lead on orcamentos
  for all using (
    fn_e_gerente()
    or exists (
      select 1 from leads l where l.id = orcamentos.lead_id
        and fn_opera_leads() and (l.responsavel_id = auth.uid() or l.responsavel_id is null)
    )
  )
  with check (fn_opera_leads());

create policy itens_pelo_orcamento on orcamento_itens
  for all using (
    exists (select 1 from orcamentos o where o.id = orcamento_itens.orcamento_id)
  )
  with check (fn_opera_leads());

-- ------------------------------------------------------------
-- CATALOGO E APOIO — todo mundo le, gerente escreve
-- ------------------------------------------------------------
create policy catalogo_linhas_le on linhas_produto
  for select using (auth.uid() is not null);
create policy catalogo_linhas_gerente on linhas_produto
  for all using (fn_e_gerente()) with check (fn_e_gerente());

create policy catalogo_produtos_le on produtos
  for select using (auth.uid() is not null);
create policy catalogo_produtos_gerente on produtos
  for all using (fn_e_gerente()) with check (fn_e_gerente());

create policy regras_le on regras_classificacao
  for select using (auth.uid() is not null);
create policy regras_gerente on regras_classificacao
  for all using (fn_e_gerente()) with check (fn_e_gerente());

create policy scripts_le on scripts_mensagem
  for select using (auth.uid() is not null);
create policy scripts_gerente on scripts_mensagem
  for all using (fn_e_gerente()) with check (fn_e_gerente());

create policy horarios_le on horarios_atendimento
  for select using (auth.uid() is not null);
create policy horarios_gerente on horarios_atendimento
  for all using (fn_e_gerente()) with check (fn_e_gerente());

create policy midia_le on biblioteca_midia
  for select using (auth.uid() is not null);
create policy midia_opera on biblioteca_midia
  for all using (fn_opera_leads()) with check (fn_opera_leads());

create policy config_le on configuracoes
  for select using (auth.uid() is not null);
create policy config_gerente on configuracoes
  for all using (fn_e_gerente()) with check (fn_e_gerente());

-- ------------------------------------------------------------
-- INVESTIMENTO — diretoria le, gerente lanca
-- ------------------------------------------------------------
create policy investimento_le on investimentos_midia
  for select using (auth.uid() is not null);
create policy investimento_gerente on investimentos_midia
  for all using (fn_e_gerente()) with check (fn_e_gerente());

-- ------------------------------------------------------------
-- KPIS — cada um mexe no proprio painel
-- ------------------------------------------------------------
create policy kpis_le on kpis_painel
  for select using (perfil_id is null or perfil_id = auth.uid());
create policy kpis_proprio on kpis_painel
  for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- ============================================================
-- VIEWS PARA A DIRETORIA
-- ============================================================
-- security_invoker = off faz a view rodar com o dono, ignorando
-- o RLS de leads. E proposital: a diretoria precisa do numero
-- total sem enxergar cliente nenhum. Nenhuma coluna aqui
-- identifica pessoa.

create or replace view vw_diretoria_mensal
with (security_invoker = off) as
select
  date_trunc('month', l.criado_em)::date as mes,
  l.origem,
  lp.nome as linha,
  count(*) as leads,
  count(*) filter (where l.etapa = 'ganho') as ganhos,
  count(*) filter (where l.etapa = 'perdido') as perdidos,
  sum(l.valor_estimado) filter (where l.etapa = 'ganho') as receita,
  round(avg(l.metragem_m2), 2) as metragem_media,
  round(avg(fn_tempo_resposta_seg(l)) / 60.0, 1) as tempo_resposta_min
from leads l
left join linhas_produto lp on lp.id = l.linha_id
group by 1, 2, 3;

create or replace view vw_diretoria_funil
with (security_invoker = off) as
select etapa, count(*) as total, sum(valor_estimado) as valor_total
from leads
group by etapa;

revoke all on vw_diretoria_mensal from public;
revoke all on vw_diretoria_funil  from public;
grant select on vw_diretoria_mensal to authenticated;
grant select on vw_diretoria_funil  to authenticated;

comment on view vw_diretoria_mensal is
  'Agregado por mes, canal e linha. Sem nome, telefone ou email: e o que a diretoria acessa.';

-- As views operacionais respeitam o RLS de quem consulta
alter view vw_leads_completo   set (security_invoker = on);
alter view vw_sla_estourado    set (security_invoker = on);
alter view vw_funil_atual      set (security_invoker = on);
alter view vw_metricas_mensais set (security_invoker = on);
