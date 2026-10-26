// Formato dos dados que chegam do backend (mesmos nomes das colunas do banco).

export type Pilar = 'E' | 'S' | 'G';
export type Status = 'no_prazo' | 'atencao' | 'em_risco';

export interface Periodo {
  id: string;
  ano: number;
  trimestre: number;
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
  obrigatorio: boolean;
  calculado: boolean;
}

export interface Acao {
  id: string;
  indicador_id: number;
  codigo: string;
  indicador: string;
  pilar: Pilar;
  unidade: string;
  valor: number;
  data_referencia: string;
  descricao: string | null;
}

export interface Meta {
  id: string;
  indicador_id: number;
  codigo: string;
  indicador: string;
  pilar: Pilar;
  unidade: string;
  direcao: 'reduzir' | 'aumentar';
  valor_base: number;
  valor_alvo: number;
  valor_atual: number;
  lancamentos: number;
  ritmo_esperado: number;
  progresso: number;
  status: Status;
}

export interface Scores {
  periodo_id: string;
  nome: string;
  ambiental: number;
  social: number;
  governanca: number;
  geral: number;
}

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  empresa: string;
  cnpj: string;
}

export interface DadosPainel {
  periodo: Periodo;
  periodos: Periodo[];
  scores: Scores;
  metas: Meta[];
  emissoes: { kwh: number; tco2e: number };
  ultimosLancamentos: Acao[];
  historico: Scores[];
}

export interface LinhaRelatorio {
  codigo: string;
  nome: string;
  pilar: Pilar;
  unidade: string;
  direcao: 'reduzir' | 'aumentar';
  atual: number | null;
  anterior: number | null;
}

export interface DadosRelatorio {
  empresa: { nome: string; cnpj: string; setor: string | null; porte: string | null };
  periodo: Periodo;
  periodoAnterior: Periodo | null;
  scores: Scores;
  metas: Meta[];
  indicadores: LinhaRelatorio[];
}
