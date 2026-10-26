import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROTA_PUBLICA } from './publico.decorator';

// Guard global: toda rota exige token, exceto as marcadas com @Publico().
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;

    const requisicao = contexto.switchToHttp().getRequest();
    const [tipo, token] = (requisicao.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    try {
      requisicao.usuario = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    return true;
  }
}
