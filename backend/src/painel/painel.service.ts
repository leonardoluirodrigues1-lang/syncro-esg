import { Injectable } from '@nestjs/common';
import { AcoesService } from '../acoes/acoes.service';
import { BancoService } from '../banco/banco.service';
import { MetasService } from '../metas/metas.service';
import { PeriodosService } from '../periodos/periodos.service';

export interface ScoresDoPeriodo {
  periodo_id: string;
  nome: string;
  ambiental: number;
  social: number;
  governanca: number;
  geral: number;
}

// Único cálculo feito no backend: os pesos do score geral.
export function calcularScoreGeral(ambiental: number, social: number, governanca: number): number {
  return Math.round(0.4 * ambiental + 0.3 * social + 0.3 * governanca);
}

@Injectable()
export class PainelService {
  constructor(
    private banco: BancoService,
    private periodos: PeriodosService,
    private metas: MetasService,
    private acoes: AcoesService,
  ) {}

  // Scores de todos os trimestres da empresa, do mais antigo ao mais recente.
  // A view vw_score_pilar tem uma linha por pilar; aqui viram colunas.
  async scoresPorPeriodo(empresaId: string): Promise<ScoresDoPeriodo[]> {
    const linhas = await this.banco.consultar(
      `SELECT p.id AS periodo_id, p.trimestre || 'º tri ' || p.ano AS nome,
              MAX(s.score) FILTER (WHERE s.pilar = 'E') AS ambiental,
              MAX(s.score) FILTER (WHERE s.pilar = 'S') AS social,
              MAX(s.score) FILTER (WHERE s.pilar = 'G') AS governanca
       FROM periodo p
       JOIN vw_score_pilar s ON s.periodo_id = p.id
       WHERE p.empresa_id = $1
       GROUP BY p.id
       ORDER BY p.data_inicio`,
      [empresaId],
    );
    return linhas.map((linha) => ({
      ...linha,
      geral: calcularScoreGeral(linha.ambiental, linha.social, linha.governanca),
    }));
  }

  // Total de kWh e tCO₂e do período (view vw_emissoes).
  async emissoesDoPeriodo(empresaId: string, periodoId: string) {
    const [emissoes] = await this.banco.consultar(
      `SELECT COALESCE(SUM(kwh), 0)::float AS kwh, COALESCE(SUM(tco2e), 0)::float AS tco2e
       FROM vw_emissoes WHERE empresa_id = $1 AND periodo_id = $2`,
      [empresaId, periodoId],
    );
    return emissoes;
  }

  // Tudo o que a tela do painel precisa, em uma chamada só.
  async montar(empresaId: string, periodoId?: string) {
    const periodo = await this.periodos.buscar(empresaId, periodoId);
    const [periodos, historico, metas, emissoes, lancamentos] = await Promise.all([
      this.periodos.listar(empresaId),
      this.scoresPorPeriodo(empresaId),
      this.metas.listar(empresaId, periodo.id),
      this.emissoesDoPeriodo(empresaId, periodo.id),
      this.acoes.listar(empresaId, periodo.id),
    ]);

    return {
      periodo,
      periodos,
      scores: historico.find((h) => h.periodo_id === periodo.id),
      metas,
      emissoes,
      ultimosLancamentos: lancamentos.slice(0, 5),
      historico,
    };
  }
}
