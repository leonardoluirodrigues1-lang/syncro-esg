import { Module } from '@nestjs/common';
import { AcoesModule } from './acoes/acoes.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BancoModule } from './banco/banco.module';
import { IndicadoresModule } from './indicadores/indicadores.module';
import { MetasModule } from './metas/metas.module';
import { PainelModule } from './painel/painel.module';
import { PeriodosModule } from './periodos/periodos.module';

@Module({
  imports: [
    BancoModule,
    AuthModule,
    PeriodosModule,
    IndicadoresModule,
    AcoesModule,
    MetasModule,
    PainelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
