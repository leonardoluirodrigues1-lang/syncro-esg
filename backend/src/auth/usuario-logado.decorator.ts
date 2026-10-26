import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Dados guardados dentro do token JWT.
export interface UsuarioToken {
  usuarioId: string;
  empresaId: string;
}

// Entrega ao controller o usuário que o AuthGuard colocou na requisição.
export const UsuarioLogado = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioToken =>
    contexto.switchToHttp().getRequest().usuario,
);
