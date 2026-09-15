/** Tipos do dominio, espelhando os enums do banco. */

export type PapelUsuario = "gerente" | "vendedor" | "diretoria";

export type EtapaLead =
  | "novo"
  | "em_atendimento"
  | "medicao"
  | "orcamento_enviado"
  | "negociacao"
  | "ganho"
  | "perdido";

export type OrigemLead =
  | "meta_ads"
  | "google_ads"
  | "organico"
  | "indicacao"
  | "direto"
  | "desconhecida";

export type TipoCliente =
  | "consumidor_final"
  | "arquiteto_designer"
  | "lojista_revenda"
  | "construtora"
  | "nao_definido";

export type TipoAmbiente =
  | "residencial"
  | "comercial"
  | "corporativo"
  | "industrial"
  | "nao_definido";

export type CanalTipo = "whatsapp" | "instagram_dm" | "manual";
export type DirecaoMensagem = "entrada" | "saida";
export type TipoMidia =
  | "texto" | "imagem" | "video" | "audio" | "documento" | "localizacao" | "outro";
export type StatusMedicao = "agendada" | "realizada" | "cancelada" | "nao_compareceu";
export type StatusOrcamento = "rascunho" | "enviado" | "aceito" | "recusado" | "expirado";

/** Ordem do kanban. A etapa medicao so aparece se o lead for elegivel. */
export const ETAPAS: { chave: EtapaLead; rotulo: string; cor: string }[] = [
  { chave: "novo",              rotulo: "Novo",              cor: "bg-marca-200" },
  { chave: "em_atendimento",    rotulo: "Em atendimento",    cor: "bg-marca-400" },
  { chave: "medicao",           rotulo: "Medição",           cor: "bg-marca-600" },
  { chave: "orcamento_enviado", rotulo: "Orçamento enviado", cor: "bg-marca-600" },
  { chave: "negociacao",        rotulo: "Negociação",        cor: "bg-marca-800" },
  { chave: "ganho",             rotulo: "Ganho",             cor: "bg-emerald-600" },
  { chave: "perdido",           rotulo: "Perdido",           cor: "bg-neutral-400" },
];

export const ROTULO_ORIGEM: Record<OrigemLead, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  organico: "Orgânico",
  indicacao: "Indicação",
  direto: "Direto",
  desconhecida: "Desconhecida",
};

export const ROTULO_TIPO_CLIENTE: Record<TipoCliente, string> = {
  consumidor_final: "Consumidor final",
  arquiteto_designer: "Arquiteto ou designer",
  lojista_revenda: "Lojista ou revenda",
  construtora: "Construtora",
  nao_definido: "Não definido",
};

export const ROTULO_AMBIENTE: Record<TipoAmbiente, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  corporativo: "Corporativo",
  industrial: "Industrial",
  nao_definido: "Não definido",
};

export const ROTULO_STATUS_MEDICAO: Record<StatusMedicao, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  nao_compareceu: "Não compareceu",
};

export const ROTULO_STATUS_ORCAMENTO: Record<StatusOrcamento, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
  expirado: "Expirado",
};

export const AMBIENTES_BIBLIOTECA = [
  { chave: "sala", rotulo: "Sala" },
  { chave: "banheiro", rotulo: "Banheiro" },
  { chave: "cozinha", rotulo: "Cozinha" },
  { chave: "fachada", rotulo: "Fachada" },
  { chave: "recepcao", rotulo: "Recepção" },
] as const;

export type AmbienteBiblioteca = (typeof AMBIENTES_BIBLIOTECA)[number]["chave"];

export type MidiaBiblioteca = {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string;
  mime: string | null;
  linha_id: string | null;
  produto_id: string | null;
  ambiente: string | null;
  tags: string[] | null;
  vezes_enviada: number;
  criado_em: string;
};

export type KpiChave = "volume_leads" | "taxa_fechamento" | "cpl" | "cac" | "roas";

export const KPIS_DISPONIVEIS: { chave: KpiChave; rotulo: string }[] = [
  { chave: "volume_leads", rotulo: "Volume de leads" },
  { chave: "taxa_fechamento", rotulo: "Taxa de fechamento" },
  { chave: "cpl", rotulo: "CPL (custo por lead)" },
  { chave: "cac", rotulo: "CAC (custo por venda)" },
  { chave: "roas", rotulo: "ROAS" },
];

export type MetricaMensal = {
  mes: string;
  origem: OrigemLead;
  leads: number;
  ganhos: number;
  perdidos: number;
  qualificados: number;
  receita: number | null;
  tempo_resposta_medio: number | null;
  investimento: number | null;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  taxa_fechamento_pct: number | null;
  taxa_qualificacao_pct: number | null;
};

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  telefone: string | null;
  ativo: boolean;
  recebe_rodizio: boolean;
};

export type Lead = {
  id: string;
  nome: string | null;
  telefone: string;
  telefone_normalizado: string;
  email: string | null;
  bairro: string | null;
  cidade: string | null;
  linha_id: string | null;
  produto_id: string | null;
  metragem_m2: number | null;
  tipo_ambiente: TipoAmbiente;
  tipo_cliente: TipoCliente;
  etapa: EtapaLead;
  responsavel_id: string | null;
  valor_estimado: number | null;
  motivo_perda: string | null;
  origem: OrigemLead;
  campanha: string | null;
  criativo: string | null;
  palavra_chave: string | null;
  primeira_mensagem_em: string | null;
  primeira_resposta_em: string | null;
  ultima_interacao_em: string | null;
  criado_em: string;
};

/** Linha da view vw_leads_completo. */
export type LeadCompleto = Lead & {
  linha_nome: string | null;
  linha_slug: string | null;
  produto_modelo: string | null;
  produto_codigo: string | null;
  responsavel_nome: string | null;
  tempo_resposta_seg: number | null;
  elegivel_instalacao: boolean;
  total_mensagens: number;
};

export type Mensagem = {
  id: string;
  conversa_id: string;
  lead_id: string;
  direcao: DirecaoMensagem;
  tipo: TipoMidia;
  conteudo: string | null;
  midia_url: string | null;
  autor_id: string | null;
  automatica: boolean;
  enviada_em: string;
};

export type LinhaProduto = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  aceita_instalacao: boolean;
  metragem_minima_instalacao: number | null;
  prioridade_trafego: boolean;
  ativo: boolean;
  ordem: number;
};

export type Produto = {
  id: string;
  linha_id: string;
  codigo: string | null;
  modelo: string;
  cor: string | null;
  material: string | null;
  dimensoes: string | null;
  m2_por_caixa: number | null;
  unidade_venda: string;
  preco_m2: number | null;
  preco_unidade: number | null;
  ativo: boolean;
};

export type Atividade = {
  id: string;
  lead_id: string;
  autor_id: string | null;
  tipo: string;
  descricao: string;
  dados: unknown;
  criado_em: string;
};

export type Medicao = {
  id: string;
  lead_id: string;
  agendada_para: string;
  endereco: string;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  status: StatusMedicao;
  metragem_aferida: number | null;
  observacoes: string | null;
  criado_em: string;
};

export type Orcamento = {
  id: string;
  lead_id: string;
  numero: number;
  status: StatusOrcamento;
  valor_materiais: number;
  valor_instalacao: number;
  desconto: number;
  valor_total: number;
  validade_dias: number;
  enviado_em: string | null;
  criado_em: string;
};
