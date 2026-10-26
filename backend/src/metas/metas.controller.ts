import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UsuarioLogado, type UsuarioToken } from '../auth/usuario-logado.decorator';
import { validarId } from '../comum/validar-id.pipe';
import { PeriodosService } from '../periodos/periodos.service';
import { MetaDto } from './dto/meta.dto';
import { MetasService } from './metas.service';

@Controller('metas')
export class MetasController {
  constructor(
    private metasService: MetasService,
    private periodosService: PeriodosService,
  ) {}

  @Get()
  async listar(
    @UsuarioLogado() usuario: UsuarioToken,
    @Query('periodoId', validarId(true)) periodoId?: string,
  ) {
    const periodo = await this.periodosService.buscar(usuario.empresaId, periodoId);
    return this.metasService.listar(usuario.empresaId, periodo.id);
  }

  @Post()
  criar(@UsuarioLogado() usuario: UsuarioToken, @Body() dados: MetaDto) {
    return this.metasService.criar(usuario.empresaId, dados);
  }

  @Delete(':id')
  excluir(@UsuarioLogado() usuario: UsuarioToken, @Param('id', validarId()) id: string) {
    return this.metasService.excluir(usuario.empresaId, id);
  }
}
