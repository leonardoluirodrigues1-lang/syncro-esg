import { Module } from '@nestjs/common';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { MetasController } from './metas.controller';
import { MetasService } from './metas.service';

@Module({
  imports: [IndicadoresModule, PeriodosModule],
  controllers: [MetasController],
  providers: [MetasService],
  exports: [MetasService],
})
export class MetasModule {}
