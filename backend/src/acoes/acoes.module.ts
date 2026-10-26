import { Module } from '@nestjs/common';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { AcoesController } from './acoes.controller';
import { AcoesService } from './acoes.service';

@Module({
  imports: [IndicadoresModule, PeriodosModule],
  controllers: [AcoesController],
  providers: [AcoesService],
  exports: [AcoesService],
})
export class AcoesModule {}
