-- 3 usuarios de teste
insert into auth.users (id,email,raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','garcia@rd.com','{"nome":"Garcia","papel":"gerente"}'),
 ('22222222-2222-2222-2222-222222222222','silas@rd.com','{"nome":"Silas","papel":"vendedor"}'),
 ('33333333-3333-3333-3333-333333333333','dir@rd.com','{"nome":"Diretoria","papel":"diretoria"}');

insert into leads (nome,telefone,responsavel_id,etapa,valor_estimado,origem) values
 ('Cliente do Silas','91991110001','22222222-2222-2222-2222-222222222222','em_atendimento',5000,'meta_ads'),
 ('Cliente da Sirley','91991110002','11111111-1111-1111-1111-111111111111','negociacao',8000,'google_ads'),
 ('Lead sem dono','91991110003',null,'novo',null,'meta_ads');

grant select,insert,update,delete on all tables in schema public to authenticated;
grant select on all tables in schema public to authenticated;

\echo ''
\echo '### GERENTE — deve ver os 3'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) as leads_visiveis from leads;
reset role;

\echo ''
\echo '### VENDEDOR — deve ver 2 (o proprio + o sem dono), NAO o da Sirley'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as leads_visiveis from leads;
select nome from leads order by nome;
reset role;

\echo ''
\echo '### DIRETORIA — deve ver 0 leads (so agregado)'
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select count(*) as leads_visiveis from leads;
\echo '-- mas ve o agregado:'
select mes, origem, leads, ganhos from vw_diretoria_mensal order by origem;
reset role;

\echo ''
\echo '### VENDEDOR tenta roubar lead do gerente (deve falhar/nao afetar)'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update leads set responsavel_id='22222222-2222-2222-2222-222222222222'
  where nome='Cliente da Sirley';
\echo '-- linhas afetadas acima (esperado: 0)'
reset role;

\echo ''
\echo '### VENDEDOR se promove a gerente (deve falhar)'
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update perfis set papel='gerente' where id='22222222-2222-2222-2222-222222222222';
reset role;
