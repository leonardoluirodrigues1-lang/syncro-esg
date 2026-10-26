import { Global, Module } from '@nestjs/common';
import { BancoService } from './banco.service';

// Global: todos os módulos usam o mesmo pool de conexões.
@Global()
@Module({
  providers: [BancoService],
  exports: [BancoService],
})
export class BancoModule {}
