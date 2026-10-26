import { Module } from '@nestjs/common';
import { AcoesModule } from '../acoes/acoes.module';
import { MetasModule } from '../metas/metas.module';
import { PeriodosModule } from '../periodos/periodos.module';
import { PainelController } from './painel.controller';
import { PainelService } from './painel.service';
import { RelatorioService } from './relatorio.service';

// Painel e relatório: telas de leitura que juntam dados dos outros módulos.
@Module({
  imports: [PeriodosModule, MetasModule, AcoesModule],
  controllers: [PainelController],
  providers: [PainelService, RelatorioService],
})
export class PainelModule {}
