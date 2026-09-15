\echo '=== TELEFONE (mesmo cliente nao pode virar 2 leads) ==='
select entrada, fn_normalizar_telefone(entrada) as normalizado
from (values ('(91) 98058-4728'),('91980584728'),('5591980584728'),('+55 91 98058-4728'),('98058-4728')) t(entrada);

\echo ''
\echo '=== CAIXAS (perda de 10%) ==='
select
  l.nome as linha, p.modelo, p.m2_por_caixa,
  fn_caixas_necessarias(45, p.m2_por_caixa) as cx_45m2,
  round(fn_caixas_necessarias(45, p.m2_por_caixa) * p.m2_por_caixa, 2) as entrega_m2
from produtos p join linhas_produto l on l.id=p.linha_id
where p.modelo in ('Volga','Girassol','Cielo','Stone 3D') limit 5;

\echo ''
\echo '=== HORARIO (08-18 seg-sex, America/Belem) ==='
select momento::text, fn_dentro_horario(momento) as atende
from (values
  ('2026-09-15 09:00-03'::timestamptz),
  ('2026-09-15 19:30-03'::timestamptz),
  ('2026-09-15 07:30-03'::timestamptz),
  ('2026-09-13 10:00-03'::timestamptz)
) t(momento);
