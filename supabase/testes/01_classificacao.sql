select
  msg,
  coalesce(lp.nome, '>>> NAO CLASSIFICOU <<<') as linha,
  c.termo
from (values
  ('VINILICO'),
  ('Oi, vi o anuncio. BAMBOO'),
  ('STONE'),
  ('bom dia, queria saber o preco do piso vinilico'),
  ('Voces tem piso vinilio pra sala?'),
  ('quanto custa placa de gesso drywall'),
  ('preciso de rodape branco 10cm'),
  ('to procurando revestimento de pedra pra parede da sala'),
  ('voces trabalham com painel ripado?'),
  ('quero forro mineral pro escritorio'),
  ('Preço do carpete modular'),
  ('bom dia'),
  ('gostaria de um orcamento'),
  ('teto vinilico carvalho tem?'),
  ('quanto ta o m2 do vinilico colado'),
  ('AUTOCOLANTE'),
  ('manta hospitalar pra clinica'),
  ('kit porta branco'),
  ('preciso de gesso em po')
) as t(msg)
left join lateral fn_classificar_linha(t.msg) c on true
left join linhas_produto lp on lp.id = c.linha_id;
