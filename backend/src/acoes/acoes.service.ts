import { Injectable, NotFoundException } from '@nestjs/common';
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

  // Lançamentos do período, do mais recente para o mais antigo.
  listar(empresaId: string, periodoId: string) {
    return this.banco.consultar(
      `SELECT a.id, a.indicador_id, i.codigo, i.nome AS indicador, i.pilar, i.unidade,
              a.valor::float AS valor, a.data_referencia, a.descricao, e.tco2e::float AS tco2e
       FROM acao_esg a
       JOIN indicador i ON i.id = a.indicador_id
       LEFT JOIN vw_emissoes e ON e.acao_id = a.id
       WHERE a.empresa_id = $1 AND a.periodo_id = $2
       ORDER BY a.data_referencia DESC, a.criado_em DESC`,
      [empresaId, periodoId],
    );
  }

  async criar(usuario: UsuarioToken, dados: AcaoDto) {
    await this.indicadores.buscarDigitavel(dados.indicadorId);
    const periodo = await this.periodos.trimestreDaData(usuario.empresaId, dados.dataReferencia);

    const [acao] = await this.banco.consultar(
      `INSERT INTO acao_esg (empresa_id, periodo_id, usuario_id, indicador_id, valor, data_referencia, descricao)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, periodo_id`,
      [
        usuario.empresaId,
        periodo.id,
        usuario.usuarioId,
        dados.indicadorId,
        dados.valor,
        dados.dataReferencia,
        dados.descricao || null,
      ],
    );
    return acao;
  }

  async atualizar(empresaId: string, id: string, dados: AcaoDto) {
    await this.indicadores.buscarDigitavel(dados.indicadorId);
    // Se a data mudou de trimestre, o lançamento muda de período junto.
    const periodo = await this.periodos.trimestreDaData(empresaId, dados.dataReferencia);

    const [acao] = await this.banco.consultar(
      `UPDATE acao_esg
       SET periodo_id = $3, indicador_id = $4, valor = $5, data_referencia = $6, descricao = $7
       WHERE id = $1 AND empresa_id = $2
       RETURNING id, periodo_id`,
      [id, empresaId, periodo.id, dados.indicadorId, dados.valor, dados.dataReferencia, dados.descricao || null],
    );
    if (!acao) throw new NotFoundException('Lançamento não encontrado.');
    return acao;
  }

  async excluir(empresaId: string, id: string) {
    const [acao] = await this.banco.consultar(
      'DELETE FROM acao_esg WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresaId],
    );
    if (!acao) throw new NotFoundException('Lançamento não encontrado.');
    return acao;
  }
}
