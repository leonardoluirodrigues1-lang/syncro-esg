import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UsuarioToken } from '../auth/usuario-logado.decorator';
import { BancoService } from '../banco/banco.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { PeriodosService } from '../periodos/periodos.service';
import { AcaoDto } from './dto/acao.dto';

@Injectable()
export class AcoesService {
  constructor(
    private banco: BancoService,
    private indicadores: IndicadoresService,
    private periodos: PeriodosService,
  ) {}

  listar(empresaId: string, periodoId: string) {
    return this.banco.consultar(
      `SELECT a.id, a.indicador_id, i.codigo, i.nome AS indicador, i.pilar, i.unidade,
              a.valor, a.data_referencia, a.descricao, e.tco2e
       FROM acao_esg a
       JOIN indicador i ON i.id = a.indicador_id
       LEFT JOIN vw_emissoes e ON e.acao_id = a.id
       WHERE a.empresa_id = ? AND a.periodo_id = ?
       ORDER BY a.data_referencia DESC, a.criado_em DESC`,
      [empresaId, periodoId],
    );
  }

  async criar(usuario: UsuarioToken, dados: AcaoDto) {
    await this.indicadores.buscarDigitavel(dados.indicadorId);
    const periodo = await this.periodos.trimestreDaData(usuario.empresaId, dados.dataReferencia);

    const id = randomUUID();
    await this.banco.executar(
      `INSERT INTO acao_esg (id, empresa_id, periodo_id, usuario_id, indicador_id, valor, data_referencia, descricao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        usuario.empresaId,
        periodo.id,
        usuario.usuarioId,
        dados.indicadorId,
        dados.valor,
        dados.dataReferencia,
        dados.descricao || null,
      ],
    );
    return { id, periodo_id: periodo.id };
  }

  async atualizar(empresaId: string, id: string, dados: AcaoDto) {
    await this.indicadores.buscarDigitavel(dados.indicadorId);
    // Se a data mudou de trimestre, o lançamento muda de período junto.
    const periodo = await this.periodos.trimestreDaData(empresaId, dados.dataReferencia);

    const alteradas = await this.banco.executar(
      `UPDATE acao_esg
       SET periodo_id = ?, indicador_id = ?, valor = ?, data_referencia = ?, descricao = ?
       WHERE id = ? AND empresa_id = ?`,
      [periodo.id, dados.indicadorId, dados.valor, dados.dataReferencia, dados.descricao || null, id, empresaId],
    );
    if (!alteradas) throw new NotFoundException('Lançamento não encontrado.');
    return { id, periodo_id: periodo.id };
  }

  async excluir(empresaId: string, id: string) {
    const excluidas = await this.banco.executar('DELETE FROM acao_esg WHERE id = ? AND empresa_id = ?', [id, empresaId]);
    if (!excluidas) throw new NotFoundException('Lançamento não encontrado.');
    return { id };
  }
}
