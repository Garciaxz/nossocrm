# DESIGN.md — sistema visual do CRM

Este arquivo documenta o **método** (escala de tipo, espaçamento, hierarquia)
usado em todas as telas do CRM. A **identidade** (paleta `marca`, fonte
Archivo) já está fixada em `tailwind.config.ts` e não muda por tela.

Não é uma cópia de nenhuma marca de referência: é uma escala neutra,
adequada a um painel denso em dados (CRM), definida do zero para este
projeto. Regra prática pra manter consistência: nenhuma tela introduz um
tamanho de fonte, cor ou espaçamento fora do que está aqui. Se faltar um
caso, ele entra neste arquivo antes de entrar no código.

---

## 1. Escala tipográfica

| Papel | Classe Tailwind | Uso |
|---|---|---|
| Título de página | `text-xl font-semibold text-marca-900` | H1 único por tela: "Painel", "Leads" |
| Título de seção | `text-xs font-semibold uppercase tracking-wide text-neutral-500` | Rótulo acima de um bloco: "Funil", "Últimos leads recebidos" |
| Título de card/modal | `text-sm font-semibold text-marca-900` | Cabeçalho de card individual, modal |
| Valor de destaque | `text-xl font-semibold text-marca-900` | Número grande: KPI, contagem de coluna do funil |
| Corpo | `text-sm text-neutral-900` | Texto padrão: tabelas, formulários, listas |
| Legenda / metadado | `text-xs text-neutral-500` | Timestamp, contagem, texto auxiliar abaixo de um campo |

Nunca mais de um H1 por tela. Título de seção é sempre maiúsculo com
`tracking-wide` — é o que diferencia visualmente "rótulo de bloco" de
"conteúdo", sem precisar de mais uma cor.

## 2. Espaçamento

Unidade base 4px (padrão Tailwind). Ritmo fixo, não inventar valor novo:

| Contexto | Valor |
|---|---|
| Padding da página | `p-4` no mobile, `sm:p-8` no desktop |
| Padding de card | `p-4` |
| Gap entre cards de uma grade (KPIs, funil) | `gap-3` |
| Espaço entre seções da página | `mb-6` |
| Espaço entre rótulo de seção e seu conteúdo | `mb-3` |
| Espaço entre campos de formulário | `mb-4` |

## 3. Cor e contraste

A paleta `marca` (`tailwind.config.ts`) é a identidade da RD Revestimentos
e não é decorativa: cada tom tem um papel fixo.

| Tom | Papel |
|---|---|
| `marca-900` | Texto de título, marca/logo |
| `marca-800` | Fundo de elemento ativo/selecionado (nav ativa, botão primário) |
| `marca-600` / `marca-400` | Acentos de dados (barras de funil, gráficos) |
| `marca-200` | Borda padrão de card e tabela |
| `marca-50` | Fundo de página e de cabeçalho de tabela |

Fora da paleta `marca`, só os neutros (`neutral-*`) para texto/borda
secundária, e semânticas fixas:

| Papel | Cor |
|---|---|
| Alerta / SLA estourado | `red-50` fundo, `red-300` borda, `red-600`/`red-700` texto |
| Sucesso / ganho | `emerald-600` |
| Perdido / inativo | `neutral-400` |

Não introduzir uma cor nova pra resolver um problema de hierarquia — o
problema quase sempre é de tipografia ou espaçamento, não de cor (ver
seção 1 do resumo do método: título grande, corpo pequeno, sem cor extra
no meio disso).

## 4. Componentes recorrentes

- **Card de KPI**: `rounded-lg border border-marca-200 bg-white p-4`, rótulo
  em legenda (`text-xs text-neutral-500`), valor em valor de destaque
  (`text-xl font-semibold text-marca-900`).
- **Tabela**: container `overflow-x-auto rounded-lg border border-marca-200
  bg-white`; cabeçalho `bg-marca-50 text-left text-neutral-600`; linha
  `border-t border-marca-50`; célula `px-4 py-2 text-sm`.
- **Badge de etapa**: usa a cor de `ETAPAS` em `src/lib/tipos.ts` — não
  redefinir cor de etapa em outro lugar do código.
- **Botão primário**: `bg-marca-800 text-white hover:bg-marca-900`.
- **Botão secundário**: `border border-neutral-300 hover:bg-neutral-50`.

## 5. Teste do reconhecimento

Antes de considerar uma tela pronta: ela usa só o que está listado aqui,
e mostrar pra alguém de fora não faz a pessoa lembrar de nenhum outro
produto — só da RD Revestimentos.
