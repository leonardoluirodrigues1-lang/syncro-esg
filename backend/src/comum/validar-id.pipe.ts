import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

// Garante que o id recebido é um UUID, com mensagem em português.
export function validarId(opcional = false) {
  return new ParseUUIDPipe({
    optional: opcional,
    exceptionFactory: () => new BadRequestException('Identificador inválido.'),
  });
}
