import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BancoService } from '../banco/banco.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { PeriodosService } from '../periodos/periodos.service';
import { MetaDto, MetaValoresDto } from './dto/meta.dto';

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
    await this.validarValores(dados.indicadorId, dados);

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

  // Edita só a base e o alvo. O indicador e o trimestre da meta não mudam.
  async editar(empresaId: string, id: string, dados: MetaValoresDto) {
    // Filtrar pela empresa do token: meta de outra empresa responde 404, como se não existisse.
    const [meta] = await this.banco.consultar<{ indicador_id: number }>(
      'SELECT indicador_id FROM meta_esg WHERE id = ? AND empresa_id = ?',
      [id, empresaId],
    );
    if (!meta) throw new NotFoundException('Meta não encontrada.');

    await this.validarValores(meta.indicador_id, dados);
    await this.banco.executar('UPDATE meta_esg SET valor_base = ?, valor_alvo = ? WHERE id = ? AND empresa_id = ?', [
      dados.valorBase,
      dados.valorAlvo,
      id,
      empresaId,
    ]);
    return { id };
  }

  // Regras usadas na criação e na edição: percentual até 100 e alvo na direção em que o indicador melhora
  // (como a comparação é estrita, o alvo também nunca pode ser igual à base).
  private async validarValores(indicadorId: number, dados: MetaValoresDto) {
    const indicador = await this.indicadores.buscarDigitavel(indicadorId);
    this.indicadores.validarPercentual(indicador, dados.valorBase, dados.valorAlvo);

    if (indicador.direcao === 'reduzir' && dados.valorAlvo >= dados.valorBase) {
      throw new BadRequestException('Este indicador deve diminuir: o valor alvo precisa ser menor que o valor base.');
    }
    if (indicador.direcao === 'aumentar' && dados.valorAlvo <= dados.valorBase) {
      throw new BadRequestException('Este indicador deve aumentar: o valor alvo precisa ser maior que o valor base.');
    }
  }

  async excluir(empresaId: string, id: string) {
    const excluidas = await this.banco.executar('DELETE FROM meta_esg WHERE id = ? AND empresa_id = ?', [id, empresaId]);
    if (!excluidas) throw new NotFoundException('Meta não encontrada.');
    return { id };
  }
}
