import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BancoService } from '../banco/banco.service';
import { hojeEmSaoPaulo, PeriodosService } from '../periodos/periodos.service';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private banco: BancoService,
    private jwt: JwtService,
    private periodos: PeriodosService,
  ) {}

  async cadastrar(dados: CadastroDto) {
    const cnpj = dados.cnpj.replace(/\D/g, ''); // remove pontos, barra e traço da máscara
    if (cnpj.length !== 14) {
      throw new BadRequestException('O CNPJ deve ter 14 dígitos.');
    }
    const email = dados.email.trim().toLowerCase();

    const [emailUsado] = await this.banco.consultar('SELECT 1 FROM usuario WHERE email = $1', [email]);
    if (emailUsado) throw new ConflictException('Este e-mail já está cadastrado.');
    const [cnpjUsado] = await this.banco.consultar('SELECT 1 FROM empresa WHERE cnpj = $1', [cnpj]);
    if (cnpjUsado) throw new ConflictException('Já existe uma empresa cadastrada com este CNPJ.');

    const senhaHash = await bcrypt.hash(dados.senha, 10);
    // Um único comando cria empresa e usuário: ou os dois são gravados, ou nenhum.
    const [usuario] = await this.banco.consultar(
      `WITH nova_empresa AS (
         INSERT INTO empresa (nome, cnpj, setor, porte) VALUES ($1, $2, $3, $4) RETURNING id
       )
       INSERT INTO usuario (empresa_id, nome, email, senha_hash)
       SELECT id, $5, $6, $7 FROM nova_empresa
       RETURNING id, empresa_id`,
      [dados.nomeEmpresa.trim(), cnpj, dados.setor || null, dados.porte || null, dados.nome.trim(), email, senhaHash],
    );

    await this.periodos.trimestreDaData(usuario.empresa_id, hojeEmSaoPaulo());
    return this.criarSessao(usuario.id);
  }

  async entrar(dados: LoginDto) {
    const [usuario] = await this.banco.consultar(
      'SELECT id, senha_hash FROM usuario WHERE email = $1',
      [dados.email.trim().toLowerCase()],
    );
    const senhaCorreta = usuario && (await bcrypt.compare(dados.senha, usuario.senha_hash));
    if (!senhaCorreta) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return this.criarSessao(usuario.id);
  }

  async buscarPerfil(usuarioId: string) {
    const [perfil] = await this.banco.consultar(
      `SELECT u.id, u.nome, u.email, u.papel,
              e.id AS empresa_id, e.nome AS empresa, e.cnpj
       FROM usuario u
       JOIN empresa e ON e.id = u.empresa_id
       WHERE u.id = $1`,
      [usuarioId],
    );
    if (!perfil) throw new UnauthorizedException('Usuário não encontrado. Faça login novamente.');
    return perfil;
  }

  // Token + perfil: o frontend guarda o token e mostra o nome da empresa.
  private async criarSessao(usuarioId: string) {
    const perfil = await this.buscarPerfil(usuarioId);
    const token = this.jwt.sign({ usuarioId, empresaId: perfil.empresa_id });
    return { token, perfil };
  }
}
