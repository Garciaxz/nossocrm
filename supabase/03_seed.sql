-- ============================================================
-- SEED — catalogo RD, regras de classificacao, configuracao
-- ============================================================

-- ------------------------------------------------------------
-- HORARIO: seg a sex 08h-18h, sabado e domingo fechado
-- ------------------------------------------------------------
insert into horarios_atendimento (dia_semana, abre, fecha, atende) values
  (0, null, null, false),
  (1, '08:00', '18:00', true),
  (2, '08:00', '18:00', true),
  (3, '08:00', '18:00', true),
  (4, '08:00', '18:00', true),
  (5, '08:00', '18:00', true),
  (6, null, null, false)
on conflict (dia_semana) do nothing;

-- ------------------------------------------------------------
-- LINHAS DE PRODUTO
-- ------------------------------------------------------------
insert into linhas_produto (slug, nome, categoria, aceita_instalacao, metragem_minima_instalacao, prioridade_trafego, ordem, descricao) values
  ('piso-vinilico-fit',   'Piso Vinílico Clicado — Linha FIT',  'piso',      true,  40, true,  1, 'SPC com manta IXPE, sistema click sem cola. Residencial e comercial de médio tráfego.'),
  ('piso-vinilico-lev',   'Piso Vinílico Colado — Linha LEV',   'piso',      true,  40, true,  2, 'LVT colado com adesivo. Uso residencial interno.'),
  ('piso-vinilico-job',   'Piso Vinílico Colado — Linha JOB',   'piso',      true,  40, true,  3, 'LVT régua e quadrado. Alto tráfego, corporativo e comercial.'),
  ('piso-vinilico-vitta', 'Manta Hospitalar — Linha VITTA PUR', 'piso',      true,  40, false, 4, 'Manta PVC em rolo. Tráfego pesado, comercial e industrial.'),
  ('bambu-core',          'Bambu Core',                         'parede',    false, null, true,  5, 'Placa PVC 1,20 x 2,90 x 6mm, cinco cores. Resistente à umidade.'),
  ('stone-3d',            'Stone 3D',                           'parede',    false, null, true,  6, 'Placa PU 0,60 x 1,20, preta e bege. Leve, efeito pedra natural.'),
  ('placa-vinilica',      'Placa Vinílica de Parede',           'parede',    false, null, false, 7, 'SPC 2750x1220x3mm, fixação com adesivo PU. Efeito mármore.'),
  ('painel-ripado',       'Painéis Ripados',                    'parede',    false, null, false, 8, 'EPS Slim e Wide, uso interno, resistente a umidade.'),
  ('teto-vinilico',       'Teto Vinílico — Linha inTeto',       'teto',      false, null, false, 9, 'PVC com lâmina vinílica, encaixe macho-fêmea.'),
  ('rodape-alizar',       'Rodapés e Alizares',                 'acabamento',false, null, false, 10, 'Linhas Lineare, Slim, Base, Nature, Essence e Decor.'),
  ('drywall',             'Drywall',                            'estrutura', false, null, false, 11, 'Chapas Standard, RU e RF.'),
  ('fachada-cimenticia',  'Fachada Cimentícia',                 'estrutura', false, null, false, 12, 'Gboard Rockshield, NBR 16831, incombustível A1.'),
  ('forro',               'Forros',                             'forro',     false, null, false, 13, 'Hi-Clean, Mineral e Forro de Lã PET.'),
  ('carpete',             'Carpetes Corporativos',              'piso',      false, null, false, 14, 'Rolo e modular, 100% Solution Dyed Nylon.'),
  ('porta',               'Elo Portas',                         'porta',     false, null, false, 15, 'Kit completo: folha, batente, alizar e dobradiças.'),
  ('gesso',               'Gesso e Acessórios',                 'estrutura', false, null, false, 16, 'Gesso em pó, gesso cola, placas e acessórios.')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- PRODUTOS
-- ------------------------------------------------------------

-- Piso Vinílico Clicado FIT — 2,25 m² por caixa
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'SPC + Manta IXPE 1mm', '5x183x1230mm', 2.25
from linhas_produto, (values
  ('3.650.6926','Sena'), ('3.650.6927','Araguaia'), ('3.650.8299','Danúbio'),
  ('3.650.8298','Lena'), ('3.650.8297','Amur'), ('3.650.8382','Reno'), ('3.650.8381','Volga')
) as c(codigo, modelo)
where slug = 'piso-vinilico-fit'
on conflict (codigo) do nothing;

-- Piso Vinílico Colado LEV — 4,34 m² por caixa
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'LVT', '2x180x1220mm', 4.34
from linhas_produto, (values
  ('3.650.6916','Margarida'), ('3.650.6917','Hortência'), ('3.650.6918','Hibisco'),
  ('3.650.6919','Magnólia'), ('3.650.6920','Girassol'), ('3.650.6921','Orquídea'),
  ('3.650.6922','Gardênia'), ('3.650.6923','Peônia'), ('3.650.6924','Narciso')
) as c(codigo, modelo)
where slug = 'piso-vinilico-lev'
on conflict (codigo) do nothing;

-- Piso Vinílico Colado JOB — régua 2,82 m² / quadrado 5,02 m²
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'LVT', '3x180x1220mm (régua)', 2.82
from linhas_produto, (values
  ('3.650.8390','Cielo'), ('3.650.8391','Sole'), ('3.650.8392','Sud')
) as c(codigo, modelo)
where slug = 'piso-vinilico-job'
on conflict (codigo) do nothing;

insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'LVT', '3x914,4x914,4mm (quadrado)', 5.02
from linhas_produto, (values
  ('3.650.8398','Petra'), ('3.650.8396','Roccia'), ('3.650.8397','Creta')
) as c(codigo, modelo)
where slug = 'piso-vinilico-job'
on conflict (codigo) do nothing;

-- Manta VITTA PUR — 40 m² por rolo
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, c.codigo, c.modelo, 'PVC', '2x2000x20000mm', 40.0, 'rolo'
from linhas_produto, (values
  ('3.650.8417','Scudo'), ('3.650.8418','Solid'), ('3.650.8419','Stark')
) as c(codigo, modelo)
where slug = 'piso-vinilico-vitta'
on conflict (codigo) do nothing;

-- Bambu Core — 1,20 x 2,90 = 3,48 m² por placa
insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, c.modelo, 'PVC', '1,20 x 2,90 x 6mm', 3.48, 'placa'
from linhas_produto, (values
  ('Cor 1'), ('Cor 2'), ('Cor 3'), ('Cor 4'), ('Cor 5')
) as c(modelo)
where slug = 'bambu-core';

-- Stone 3D — 0,60 x 1,20 = 0,72 m² por placa
insert into produtos (linha_id, modelo, cor, material, dimensoes, m2_por_caixa, unidade_venda)
select id, 'Stone 3D', c.cor, 'PU', '0,60 x 1,20m', 0.72, 'placa'
from linhas_produto, (values ('Preta'), ('Bege')) as c(cor)
where slug = 'stone-3d';

-- Placa Vinílica de parede — 3 peças de 2750x1220 = 10,065 m²
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'SPC', '2750x1220x3mm', 10.065
from linhas_produto, (values
  ('3.650.8359','Bianco Fosca'), ('3.650.8360','Pietra'), ('3.650.8361','Perlato'),
  ('3.650.8362','Sierra'), ('3.650.8363','Vulcano'), ('3.650.8364','Caliza')
) as c(codigo, modelo)
where slug = 'placa-vinilica'
on conflict (codigo) do nothing;

-- Painéis Ripados — Slim 6,189 m² / Wide 3,526 m²
insert into produtos (linha_id, codigo, modelo, cor, material, dimensoes, m2_por_caixa)
select id, c.codigo, 'Slim', c.cor, 'EPS', '122x12mm', 6.189
from linhas_produto, (values
  ('3.650.7757','Orus'), ('3.650.7758','Canis'), ('3.650.7759','Lira')
) as c(codigo, cor)
where slug = 'painel-ripado'
on conflict (codigo) do nothing;

insert into produtos (linha_id, codigo, modelo, cor, material, dimensoes, m2_por_caixa)
select id, c.codigo, 'Wide', c.cor, 'EPS', '103x21mm', 3.526
from linhas_produto, (values
  ('3.650.7760','Orus'), ('3.650.7761','Canis'), ('3.650.7762','Lira')
) as c(codigo, cor)
where slug = 'painel-ripado'
on conflict (codigo) do nothing;

-- Teto Vinílico — 10 réguas de 0,217 x 5,95 = 12,91 m²
insert into produtos (linha_id, codigo, modelo, material, dimensoes, m2_por_caixa)
select id, c.codigo, c.modelo, 'PVC com lâmina vinílica', '21,7x5950x8mm', 12.91
from linhas_produto, (values
  ('3.650.9155','Pinus'), ('3.650.9156','Carvalho'), ('3.650.9157','Freijó'),
  ('3.650.9158','Tauari'), ('3.650.9159','Carvalho Grey'), ('3.650.9160','Angelim')
) as c(codigo, modelo)
where slug = 'teto-vinilico'
on conflict (codigo) do nothing;

-- Drywall
insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, c.modelo, 'Gesso', '1,20 x 2,90m', 3.48, 'chapa'
from linhas_produto, (values
  ('Standard (ST)'), ('Resistente à Umidade (RU)'), ('Resistente ao Fogo (RF)')
) as c(modelo)
where slug = 'drywall';

-- Fachada cimentícia — 1,20 x 1,80 = 2,16 m²
insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, 'Gboard Rockshield', 'Gesso aditivado + véu de fibra de vidro', '1,20 x 1,80 x 12,5mm', 2.16, 'chapa'
from linhas_produto where slug = 'fachada-cimenticia';

-- Forros
insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, c.modelo, c.material, c.dim, c.m2, 'placa'
from linhas_produto, (values
  ('Hi-Clean 625x625',  'Gesso com película de PVC', '625 x 625 x 8mm',  0.3906),
  ('Hi-Clean 625x1250', 'Gesso com película de PVC', '625 x 1250 x 8mm', 0.7813),
  ('Mineral',           'Fibras minerais biossolúveis', '1,20 x 2,90m',  3.48),
  ('Lã de PET',         'Fibras de poliéster recicladas', '25 x 1250 x 625mm', 0.7813)
) as c(modelo, material, dim, m2)
where slug = 'forro';

-- Carpetes
insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, 'Carpete em Rolo', '100% Solution Dyed Nylon', '3,66m x 30m', 109.8, 'rolo'
from linhas_produto where slug = 'carpete';

insert into produtos (linha_id, modelo, material, dimensoes, m2_por_caixa, unidade_venda)
select id, 'Carpete Modular', '100% Solution Dyed Nylon', 'Placas 50 x 50cm', 5.0, 'caixa'
from linhas_produto where slug = 'carpete';

-- Portas
insert into produtos (linha_id, modelo, cor, material, unidade_venda)
select id, 'Kit Porta Prime', c.cor, 'Kit completo com batente, alizar e dobradiças', 'kit'
from linhas_produto, (values ('Branco'), ('Curupixa Terra')) as c(cor)
where slug = 'porta';

-- ------------------------------------------------------------
-- REGRAS DE CLASSIFICACAO
-- Peso 100 = palavra-chave de criativo. O cliente so digita porque
-- o anuncio mandou, entao e o sinal mais confiavel de origem.
-- ------------------------------------------------------------

-- Palavras-chave dos criativos de trafego
insert into regras_classificacao (termo, linha_id, origem_sugerida, peso, exige_isolado)
select t.termo, lp.id, 'meta_ads'::origem_lead, 100, true
from (values
  ('VINILICO',    'piso-vinilico-fit'),
  ('AUTOCOLANTE', 'piso-vinilico-lev'),
  ('BAMBOO',      'bambu-core'),
  ('BAMBU',       'bambu-core'),
  ('STONE',       'stone-3d'),
  ('PARCERIA',    'stone-3d')
) as t(termo, slug)
join linhas_produto lp on lp.slug = t.slug;

-- Termos longos primeiro: "piso vinilico" precisa ganhar de "piso"
insert into regras_classificacao (termo, linha_id, peso)
select t.termo, lp.id, t.peso
from (values
  ('piso vinilico clicado',    'piso-vinilico-fit',   60),
  ('vinilico clicado',         'piso-vinilico-fit',   55),
  ('piso vinilico colado',     'piso-vinilico-lev',   60),
  ('vinilico colado',          'piso-vinilico-lev',   55),
  ('manta hospitalar',         'piso-vinilico-vitta', 60),
  ('manta vinilica',           'piso-vinilico-vitta', 55),
  ('piso vinilico',            'piso-vinilico-fit',   50),
  ('piso vinilio',             'piso-vinilico-fit',   45),
  ('vinilico',                 'piso-vinilico-fit',   40),
  ('vinilica',                 'placa-vinilica',      40),
  ('placa vinilica',           'placa-vinilica',      55),
  ('bambu core',               'bambu-core',          60),
  ('bamboo core',              'bambu-core',          60),
  ('stone 3d',                 'stone-3d',            60),
  ('pedra 3d',                 'stone-3d',            50),
  ('revestimento de pedra',    'stone-3d',            50),
  ('parede de pedra',          'stone-3d',            50),
  ('painel ripado',            'painel-ripado',       60),
  ('ripado',                   'painel-ripado',       45),
  ('painel de parede',         'painel-ripado',       40),
  ('teto vinilico',            'teto-vinilico',       60),
  ('forro de pvc',             'teto-vinilico',       50),
  ('rodape',                   'rodape-alizar',       50),
  ('alizar',                   'rodape-alizar',       50),
  ('guarnicao',                'rodape-alizar',       45),
  ('drywall',                  'drywall',             60),
  ('gesso acartonado',         'drywall',             55),
  ('placa de gesso',           'drywall',             50),
  ('parede de gesso',          'drywall',             50),
  ('fachada cimenticia',       'fachada-cimenticia',  60),
  ('fachada',                  'fachada-cimenticia',  40),
  ('forro mineral',            'forro',               60),
  ('forro de la',              'forro',               60),
  ('hi clean',                 'forro',               55),
  ('forro',                    'forro',               35),
  ('carpete',                  'carpete',             55),
  ('porta',                    'porta',               45),
  ('kit porta',                'porta',               55),
  ('gesso em po',              'gesso',               55),
  ('gesso cola',               'gesso',               55),
  ('gesso',                    'gesso',               30)
) as t(termo, slug, peso)
join linhas_produto lp on lp.slug = t.slug;

-- ------------------------------------------------------------
-- SCRIPT FORA DO HORARIO
-- ------------------------------------------------------------
insert into scripts_mensagem (chave, titulo, conteudo) values
(
  'fora_horario',
  'Resposta automática fora do horário',
  E'Olá! Aqui é a RD Revestimentos 👋\n\n' ||
  E'Recebemos sua mensagem. Nosso atendimento é de segunda a sexta, das 8h às 18h, ' ||
  E'e um consultor responde assim que abrirmos.\n\n' ||
  E'Se quiser adiantar, já pode mandar por aqui:\n' ||
  E'• O produto que procura\n' ||
  E'• A metragem aproximada em m²\n' ||
  E'• O ambiente (sala, banheiro, loja, escritório)\n\n' ||
  E'Assim seu orçamento sai logo no início do expediente. Até já!'
)
on conflict (chave) do nothing;

-- ------------------------------------------------------------
-- CONFIGURACOES
-- ------------------------------------------------------------
insert into configuracoes (chave, valor, descricao) values
  ('sla_minutos',          '5'::jsonb,                     'Minutos até o alerta de lead sem resposta'),
  ('perda_padrao_pct',     '10'::jsonb,                    'Perda técnica no cálculo de caixas'),
  ('distribuicao_automatica','false'::jsonb,               'Rodízio automático ligado ou desligado'),
  ('validade_orcamento_dias','15'::jsonb,                  'Validade padrão do orçamento'),
  ('metragem_min_instalacao','40'::jsonb,                  'Mínimo em m² para oferecer instalação'),
  ('retencao_mensagens_meses','12'::jsonb,                 'Meses até expurgar conversas antigas'),
  ('alerta_whatsapp_numero','"null"'::jsonb,               'Número que recebe o alerta de SLA'),
  ('bling_gerar_pedido_no_ganho','true'::jsonb,            'Gera pedido no Bling quando o lead vira ganho')
on conflict (chave) do nothing;

-- ------------------------------------------------------------
-- KPIS PADRAO DO PAINEL
-- ------------------------------------------------------------
insert into kpis_painel (perfil_id, chave, visivel, ordem) values
  (null, 'volume_leads',      true,  1),
  (null, 'cpl',               true,  2),
  (null, 'taxa_qualificacao', true,  3),
  (null, 'taxa_fechamento',   true,  4),
  (null, 'cac',               true,  5),
  (null, 'roas',              true,  6),
  (null, 'tempo_resposta',    true,  7),
  (null, 'ticket_medio',      false, 8),
  (null, 'leads_por_linha',   false, 9),
  (null, 'leads_por_bairro',  false, 10);
