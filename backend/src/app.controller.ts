import { Controller, Get } from '@nestjs/common';
import { Publico } from './auth/publico.decorator';

// Rota de saúde: confirma que a API está no ar.
@Controller()
export class AppController {
  @Publico()
  @Get()
  status() {
    return { status: 'ok' };
  }
}
