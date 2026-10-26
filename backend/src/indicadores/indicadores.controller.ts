import { Controller, Get, Query } from '@nestjs/common';
import { PreviaEmissaoDto } from './dto/previa-emissao.dto';
import { IndicadoresService } from './indicadores.service';

@Controller('indicadores')
export class IndicadoresController {
  constructor(private indicadoresService: IndicadoresService) {}

  @Get()
  listar() {
    return this.indicadoresService.listar();
  }

  @Get('previa-emissao')
  previaEmissao(@Query() consulta: PreviaEmissaoDto) {
    return this.indicadoresService.previaEmissao(consulta.kwh, consulta.data);
  }
}
