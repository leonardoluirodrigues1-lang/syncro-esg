import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
              valor_base, valor_alvo, valor_atual, lancamentos, ritmo_esperado, progresso, status
       FROM vw_meta_status
       WHERE empresa_id = ? AND periodo_id = ?
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
      const id = randomUUID();
      await this.banco.executar(
        `INSERT INTO meta_esg (id, empresa_id, periodo_id, indicador_id, valor_base, valor_alvo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, empresaId, periodo.id, dados.indicadorId, dados.valorBase, dados.valorAlvo],
      );
      return { id };
    } catch (erro: any) {
      // 1062 (ER_DUP_ENTRY) = violou a regra uq_meta (uma meta por indicador por período).
      if (erro.errno === 1062) {
        throw new ConflictException('Já existe uma meta para este indicador neste trimestre.');
      }
      throw erro;
    }
  }

  async excluir(empresaId: string, id: string) {
    const excluidas = await this.banco.executar('DELETE FROM meta_esg WHERE id = ? AND empresa_id = ?', [id, empresaId]);
    if (!excluidas) throw new NotFoundException('Meta não encontrada.');
    return { id };
  }
}
