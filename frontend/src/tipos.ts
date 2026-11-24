// Formato dos dados que chegam do backend (mesmos nomes das colunas do banco).

export type Pilar = 'E' | 'S' | 'G';
export type Status = 'no_prazo' | 'atencao' | 'em_risco';

export interface Periodo {
  id: string;
  data_inicio: string;
  data_fim: string;
  nome: string;
}

export interface Indicador {
  id: number;
  codigo: string;
  nome: string;
  pilar: Pilar;
  unidade: string;
  direcao: 'reduzir' | 'aumentar';
  agregacao: 'soma' | 'media';
  calculado: boolean;
  referencia: string; // ex.: "GRI 302-1 · ODS 7"
}

export interface Acao {
  id: string;
  indicador_id: number;
  indicador: string;
  pilar: Pilar;
  unidade: string;
  valor: number;
  data_referencia: string;
  descricao: string | null;
  referencia: string;
}

export interface Meta {
  id: string;
  indicador_id: number;
  codigo: string;
  indicador: string;
  pilar: Pilar;
  unidade: string;
  valor_base: number;
  valor_alvo: number;
  valor_atual: number;
  lancamentos: number;
  ritmo_esperado: number;
  progresso: number;
  status: Status;
}

export interface Scores {
  nome: string;
  ambiental: number;
  social: number;
  governanca: number;
  geral: number;
}

// Usuário logado e a empresa dele (GET /auth/perfil).
export interface Perfil {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  cnpj: string;
  setor: string | null;
  porte: string | null;
}

export interface DadosPainel {
  periodo: Periodo;
  periodos: Periodo[];
  scores: Scores;
  metas: Meta[];
  emissoes: { kwh: number; tco2e: number; fatores: FatorEmissao[] };
  ultimosLancamentos: Acao[];
  historico: Scores[];
}

// Fator médio do SIN (MCTI) usado no cálculo. mes null = fator anual.
export interface FatorEmissao {
  ano: number;
  mes: number | null;
  valor: number;
  fonte: string;
}

export interface LinhaRelatorio {
  codigo: string;
  nome: string;
  pilar: Pilar;
  unidade: string;
  direcao: 'reduzir' | 'aumentar';
  atual: number | null;
  anterior: number | null;
  referencia: string;
}

export interface DadosRelatorio {
  empresa: { nome: string; cnpj: string; setor: string | null; porte: string | null };
  periodo: Periodo;
  periodoAnterior: Periodo | null;
  scores: Scores;
  metas: Meta[];
  indicadores: LinhaRelatorio[];
}
