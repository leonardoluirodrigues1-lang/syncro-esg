import { Controller, Get } from '@nestjs/common';
import { UsuarioLogado, type UsuarioToken } from '../auth/usuario-logado.decorator';
import { hojeEmSaoPaulo, PeriodosService } from './periodos.service';

@Controller('periodos')
export class PeriodosController {
  constructor(private periodosService: PeriodosService) {}

  @Get()
  async listar(@UsuarioLogado() usuario: UsuarioToken) {
    // Garante que o trimestre atual aparece na lista, mesmo logo após a virada do trimestre.
    await this.periodosService.trimestreDaData(usuario.empresaId, hojeEmSaoPaulo());
    return this.periodosService.listar(usuario.empresaId);
  }
}
