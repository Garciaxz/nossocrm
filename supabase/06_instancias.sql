-- ============================================================
-- ESTADO DA INSTANCIA EVOLUTION
-- Registra o ultimo evento connection.update recebido pelo webhook,
-- para a tela de configuracoes mostrar se a instancia esta conectada.
-- ============================================================

create table if not exists instancias_evolution (
  instancia     text primary key,
  estado        text,
  dados         jsonb,
  atualizado_em timestamptz not null default now()
);

comment on table instancias_evolution is
  'Um registro por instancia da Evolution. Atualizado pelo webhook (service_role) a cada connection.update, nunca pelo app.';

alter table instancias_evolution enable row level security;

create policy instancias_le on instancias_evolution
  for select using (auth.uid() is not null);
