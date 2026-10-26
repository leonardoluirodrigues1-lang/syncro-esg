import { Injectable } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';
import { MetasService } from '../metas/metas.service';
import { PeriodosService } from '../periodos/periodos.service';
import { PainelService } from './painel.service';

@Injectable()
export class RelatorioService {
  constructor(
    private banco: BancoService,
    private periodos: PeriodosService,
    private metas: MetasService,
    private painel: PainelService,
  ) {}

  async montar(empresaId: string, periodoId?: string) {
    const periodo = await this.periodos.buscar(empresaId, periodoId);
    const periodoAnterior = await this.periodos.anterior(empresaId, periodo);

    const [empresas, historico, metas, indicadores] = await Promise.all([
      this.banco.consultar('SELECT nome, cnpj, setor, porte FROM empresa WHERE id = $1', [empresaId]),
      this.painel.scoresPorPeriodo(empresaId),
      this.metas.listar(empresaId, periodo.id),
      this.tabelaDeIndicadores(periodo.id, periodoAnterior?.id ?? null),
    ]);

    return {
      empresa: empresas[0],
      periodo,
      periodoAnterior,
      scores: historico.find((h) => h.periodo_id === periodo.id),
      metas,
      indicadores,
    };
  }

  // Valor de cada indicador no período atual e no anterior.
  // As emissões (indicador calculado) vêm da vw_emissoes e entram como mais uma linha.
  private tabelaDeIndicadores(periodoId: string, periodoAnteriorId: string | null) {
    return this.banco.consultar(
      `SELECT i.codigo, i.nome, i.pilar, i.unidade, i.direcao,
              CASE WHEN i.calculado
                   THEN (SELECT SUM(e.tco2e) FROM vw_emissoes e WHERE e.periodo_id = $1)
                   ELSE atual.valor END::float AS atual,
              CASE WHEN i.calculado
                   THEN (SELECT SUM(e.tco2e) FROM vw_emissoes e WHERE e.periodo_id = $2)
                   ELSE anterior.valor END::float AS anterior
       FROM indicador i
       LEFT JOIN vw_indicador_periodo atual
              ON atual.indicador_id = i.id AND atual.periodo_id = $1
       LEFT JOIN vw_indicador_periodo anterior
              ON anterior.indicador_id = i.id AND anterior.periodo_id = $2::uuid
       ORDER BY i.pilar, i.codigo`,
      [periodoId, periodoAnteriorId],
    );
  }
}
