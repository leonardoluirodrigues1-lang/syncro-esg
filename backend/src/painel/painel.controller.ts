import { Controller, Get, Query } from '@nestjs/common';
import { UsuarioLogado, type UsuarioToken } from '../auth/usuario-logado.decorator';
import { validarId } from '../comum/validar-id.pipe';
import { PainelService } from './painel.service';
import { RelatorioService } from './relatorio.service';

@Controller()
export class PainelController {
  constructor(
    private painelService: PainelService,
    private relatorioService: RelatorioService,
  ) {}

  @Get('painel')
  painel(@UsuarioLogado() usuario: UsuarioToken, @Query('periodoId', validarId(true)) periodoId?: string) {
    return this.painelService.montar(usuario.empresaId, periodoId);
  }

  @Get('relatorio')
  relatorio(@UsuarioLogado() usuario: UsuarioToken, @Query('periodoId', validarId(true)) periodoId?: string) {
    return this.relatorioService.montar(usuario.empresaId, periodoId);
  }
}
