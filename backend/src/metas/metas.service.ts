import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { PeriodosService } from '../periodos/periodos.service';
import { MetaDto } from './dto/meta.dto';

@Injectable()
export class MetasService {
  constructor(
    private banco: BancoService,
    private indicadores: IndicadoresService,
    private periodos: PeriodosService,
  ) {}

  // Progresso, ritmo esperado e status vêm prontos da view vw_meta_status.
  listar(empresaId: string, periodoId: string) {
    return this.banco.consultar(
      `SELECT meta_id AS id, indicador_id, codigo, indicador, pilar, unidade, direcao,
              valor_base::float AS valor_base, valor_alvo::float AS valor_alvo,
              valor_atual::float AS valor_atual, lancamentos::int AS lancamentos,
              ritmo_esperado::float AS ritmo_esperado, progresso::float AS progresso, status
       FROM vw_meta_status
       WHERE empresa_id = $1 AND periodo_id = $2
       ORDER BY pilar, codigo`,
      [empresaId, periodoId],
    );
  }

  async criar(empresaId: string, dados: MetaDto) {
    const indicador = await this.indicadores.buscarDigitavel(dados.indicadorId);

    // A meta precisa apontar na direção em que o indicador melhora.
    if (indicador.direcao === 'reduzir' && dados.valorAlvo >= dados.valorBase) {
      throw new BadRequestException('Este indicador deve diminuir: o valor alvo precisa ser menor que o valor base.');
    }
    if (indicador.direcao === 'aumentar' && dados.valorAlvo <= dados.valorBase) {
      throw new BadRequestException('Este indicador deve aumentar: o valor alvo precisa ser maior que o valor base.');
    }

    const periodo = await this.periodos.buscar(empresaId, dados.periodoId);
    try {
      const [meta] = await this.banco.consultar(
        `INSERT INTO meta_esg (empresa_id, periodo_id, indicador_id, valor_base, valor_alvo)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [empresaId, periodo.id, dados.indicadorId, dados.valorBase, dados.valorAlvo],
      );
      return meta;
    } catch (erro: any) {
      // 23505 = violou a regra uq_meta (uma meta por indicador por período).
      if (erro.code === '23505') {
        throw new ConflictException('Já existe uma meta para este indicador neste trimestre.');
      }
      throw erro;
    }
  }

  async excluir(empresaId: string, id: string) {
    const [meta] = await this.banco.consultar(
      'DELETE FROM meta_esg WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresaId],
    );
    if (!meta) throw new NotFoundException('Meta não encontrada.');
    return meta;
  }
}
