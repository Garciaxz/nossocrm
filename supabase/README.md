# Banco — CRM RD Revestimentos

Postgres no Supabase. Testado localmente no Postgres 16 com stub de `auth`.

## Como executar

No SQL Editor do Supabase, **nesta ordem**:

1. `01_schema.sql` — tipos, tabelas, funções, triggers, views
2. `02_rls.sql` — políticas de acesso
3. `03_seed.sql` — catálogo RD, regras de classificação, horário, scripts
4. `04_realtime.sql` — habilita Realtime na tabela `mensagens`
5. `05_storage.sql` — cria o bucket `biblioteca` e as políticas de Storage
6. `06_instancias.sql` — tabela que guarda o último estado (`connection.update`) de cada instância da Evolution

O seed é idempotente nas tabelas com chave natural: rodar de novo não duplica linha de produto, script nem configuração.

## O que já está no banco

- **16 linhas de produto** e **62 SKUs** do catálogo, com código `3.650.XXXX`, dimensão e metragem por caixa
- **47 regras de classificação** para identificar o produto pela primeira mensagem
- Horário 08h–18h de segunda a sexta, fuso `America/Belem`
- Script de resposta automática fora do horário
- 10 KPIs de painel, ligáveis e desligáveis por pessoa

## Decisões que valem saber

**Preço em branco de propósito.** `produtos.preco_m2` e `preco_unidade` estão nulos. O orçamento funciona dos dois jeitos: calcula sozinho quando o preço existe, aceita valor digitado quando não existe. Preencher depois não exige mudar código.

**Instalação.** `linhas_produto.aceita_instalacao` está ligado só nas quatro linhas de piso vinílico, com mínimo de 40 m². A função `fn_elegivel_instalacao` decide se o botão de agendar medição aparece. O valor é fechado, digitado em `orcamentos.valor_instalacao`.

**Cálculo de caixas.** `fn_caixas_necessarias(metragem, m2_por_caixa, perda)` usa 10% de perda por padrão. Para 45 m² de Volga dá 22 caixas, entregando 49,5 m². Piso na diagonal pede mais perda: passe o terceiro parâmetro.

**Classificação em dois níveis.** O termo descritivo decide a linha, e o mais longo ganha: "teto vinílico" vence "vinílico". A palavra-chave de criativo (`VINILICO`, `BAMBOO`, `STONE`) só decide a linha quando nada descritivo casou, mas sempre marca a origem como `meta_ads`. Sem essa regra, um cliente perguntando de teto vinílico cairia no funil de piso.

**Telefone normalizado.** Todo lead guarda `telefone_normalizado` com DDI, e há índice único nele. Sem isso o mesmo cliente vira dois leads quando escreve de formatos diferentes.

**SLA.** `primeira_resposta_em` só é carimbado por mensagem humana. A resposta automática de fora do horário não para o cronômetro, senão o indicador mentiria. A view `vw_sla_estourado` lista quem passou de 5 minutos dentro do expediente.

## Acessos

| Papel | Leads | Conversa | Relatório |
|---|---|---|---|
| gerente | todos | todas | completo |
| vendedor | os próprios + sem dono | dos próprios leads | completo |
| diretoria | **nenhum** | nenhuma | só agregado |

A diretoria lê `vw_diretoria_mensal` e `vw_diretoria_funil`, que rodam com `security_invoker = off` e não expõem nome, telefone nem email. Foi o jeito de atender "agregado" sem depender de o front lembrar de esconder coluna.

Vendedor pode puxar lead sem dono para si, mas o `with check` obriga que ele fique como responsável: não dá para repassar para colega nem devolver para a fila. Só gerente redistribui.

## ⚠️ Chave service_role

O webhook da Evolution precisa de `service_role`, que **ignora RLS por definição do Postgres**. Essa chave só pode existir em Route Handler do servidor, nunca em componente de cliente nem em variável `NEXT_PUBLIC_`. Vazou, vazou o banco inteiro.

## Rodar os testes

Precisa de Postgres local. `testes/00_stub_local.sql` recria o mínimo do Supabase (`auth.users`, `auth.uid()`, papéis).

```bash
createdb rdcrm_teste
psql -d rdcrm_teste -f testes/00_stub_local.sql \
                    -f 01_schema.sql -f 02_rls.sql -f 03_seed.sql
psql -d rdcrm_teste -f testes/01_classificacao.sql   # 19 mensagens reais
psql -d rdcrm_teste -f testes/02_funcoes.sql         # telefone, caixas, horário
psql -d rdcrm_teste -f testes/03_rls.sql             # isolamento entre papéis
```

O teste de RLS confere seis coisas: gerente vê 3 leads, vendedor vê 2, diretoria vê 0 mas enxerga o agregado, vendedor não rouba lead do colega e não consegue se promover a gerente.

## Ainda não está aqui

- Instagram DM: `canal_tipo` já tem o valor `instagram_dm` e as tabelas aceitam, mas depende da aprovação da Meta
- Bling: `orcamentos.bling_pedido_id` está reservado, a integração vem depois
- Expurgo de conversa com mais de 12 meses: a configuração existe, falta a rotina agendada
