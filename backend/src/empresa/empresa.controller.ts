import { Body, Controller, Put } from '@nestjs/common';
import { UsuarioLogado, type UsuarioToken } from '../auth/usuario-logado.decorator';
import { EmpresaDto } from './dto/empresa.dto';
import { EmpresaService } from './empresa.service';

@Controller('empresa')
export class EmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Put()
  editar(@UsuarioLogado() usuario: UsuarioToken, @Body() dados: EmpresaDto) {
    return this.empresaService.editar(usuario.empresaId, dados);
  }
}
