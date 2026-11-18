import { Injectable } from '@nestjs/common';
import { AcoesService } from '../acoes/acoes.service';
import { BancoService } from '../banco/banco.service';
import { MetasService } from '../metas/metas.service';
import { PeriodosService } from '../periodos/periodos.service';

interface ScoresDoPeriodo {
  periodo_id: string;
  nome: string;
  ambiental: number;
  social: number;
  governanca: number;
  geral: number;
}

// Único cálculo feito no backend: os pesos do score geral.
function calcularScoreGeral(ambiental: number, social: number, governanca: number): number {
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
      `SELECT p.id AS periodo_id, CONCAT(p.trimestre, 'º tri ', p.ano) AS nome,
              MAX(CASE WHEN s.pilar = 'E' THEN s.score END) AS ambiental,
              MAX(CASE WHEN s.pilar = 'S' THEN s.score END) AS social,
              MAX(CASE WHEN s.pilar = 'G' THEN s.score END) AS governanca
       FROM periodo p
       JOIN vw_score_pilar s ON s.periodo_id = p.id
       WHERE p.empresa_id = ?
       GROUP BY p.id, p.trimestre, p.ano, p.data_inicio
       ORDER BY p.data_inicio`,
      [empresaId],
    );
    return linhas.map((linha) => ({
      ...linha,
      geral: calcularScoreGeral(linha.ambiental, linha.social, linha.governanca),
    }));
  }

  async emissoesDoPeriodo(empresaId: string, periodoId: string) {
    const [emissoes] = await this.banco.consultar(
      `SELECT COALESCE(SUM(kwh), 0) AS kwh, COALESCE(SUM(tco2e), 0) AS tco2e
       FROM vw_emissoes WHERE empresa_id = ? AND periodo_id = ?`,
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
