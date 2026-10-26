import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UsuarioLogado, type UsuarioToken } from '../auth/usuario-logado.decorator';
import { validarId } from '../comum/validar-id.pipe';
import { PeriodosService } from '../periodos/periodos.service';
import { AcoesService } from './acoes.service';
import { AcaoDto } from './dto/acao.dto';

@Controller('acoes')
export class AcoesController {
  constructor(
    private acoesService: AcoesService,
    private periodosService: PeriodosService,
  ) {}

  @Get()
  async listar(
    @UsuarioLogado() usuario: UsuarioToken,
    @Query('periodoId', validarId(true)) periodoId?: string,
  ) {
    const periodo = await this.periodosService.buscar(usuario.empresaId, periodoId);
    return this.acoesService.listar(usuario.empresaId, periodo.id);
  }

  @Post()
  criar(@UsuarioLogado() usuario: UsuarioToken, @Body() dados: AcaoDto) {
    return this.acoesService.criar(usuario, dados);
  }

  @Put(':id')
  atualizar(
    @UsuarioLogado() usuario: UsuarioToken,
    @Param('id', validarId()) id: string,
    @Body() dados: AcaoDto,
  ) {
    return this.acoesService.atualizar(usuario.empresaId, id, dados);
  }

  @Delete(':id')
  excluir(@UsuarioLogado() usuario: UsuarioToken, @Param('id', validarId()) id: string) {
    return this.acoesService.excluir(usuario.empresaId, id);
  }
}
