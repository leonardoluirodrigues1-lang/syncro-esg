import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { PerfilDto, SenhaDto } from './dto/perfil.dto';
import { Publico } from './publico.decorator';
import { UsuarioLogado, type UsuarioToken } from './usuario-logado.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Publico()
  @Post('cadastro')
  cadastrar(@Body() dados: CadastroDto) {
    return this.authService.cadastrar(dados);
  }

  @Publico()
  @Post('login')
  @HttpCode(200)
  entrar(@Body() dados: LoginDto) {
    return this.authService.entrar(dados);
  }

  @Get('perfil')
  perfil(@UsuarioLogado() usuario: UsuarioToken) {
    return this.authService.buscarPerfil(usuario.usuarioId);
  }

  // Nome e e-mail do próprio usuário (sempre o do token).
  @Put('perfil')
  editarPerfil(@UsuarioLogado() usuario: UsuarioToken, @Body() dados: PerfilDto) {
    return this.authService.editarPerfil(usuario.usuarioId, dados);
  }

  @Put('senha')
  trocarSenha(@UsuarioLogado() usuario: UsuarioToken, @Body() dados: SenhaDto) {
    return this.authService.trocarSenha(usuario.usuarioId, dados);
  }
}
