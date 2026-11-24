import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { BancoService } from '../banco/banco.service';
import { hojeEmSaoPaulo, PeriodosService } from '../periodos/periodos.service';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { PerfilDto, SenhaDto } from './dto/perfil.dto';

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

    const [emailUsado] = await this.banco.consultar('SELECT 1 FROM usuario WHERE email = ?', [email]);
    if (emailUsado) throw new ConflictException('Este e-mail já está cadastrado.');
    const [cnpjUsado] = await this.banco.consultar('SELECT 1 FROM empresa WHERE cnpj = ?', [cnpj]);
    if (cnpjUsado) throw new ConflictException('Já existe uma empresa cadastrada com este CNPJ.');

    const senhaHash = await bcrypt.hash(dados.senha, 10);
    const empresaId = randomUUID();
    const usuarioId = randomUUID();
    // Empresa e usuário na mesma transação: ou os dois são gravados, ou nenhum.
    await this.banco.transacao([
      [
        'INSERT INTO empresa (id, nome, cnpj, setor, porte) VALUES (?, ?, ?, ?, ?)',
        [empresaId, dados.nomeEmpresa.trim(), cnpj, dados.setor || null, dados.porte || null],
      ],
      [
        'INSERT INTO usuario (id, empresa_id, nome, email, senha_hash) VALUES (?, ?, ?, ?, ?)',
        [usuarioId, empresaId, dados.nome.trim(), email, senhaHash],
      ],
    ]);

    await this.periodos.trimestreDaData(empresaId, hojeEmSaoPaulo());
    return this.criarSessao(usuarioId);
  }

  async entrar(dados: LoginDto) {
    const [usuario] = await this.banco.consultar(
      'SELECT id, senha_hash FROM usuario WHERE email = ?',
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
              e.id AS empresa_id, e.nome AS empresa, e.cnpj, e.setor, e.porte
       FROM usuario u
       JOIN empresa e ON e.id = u.empresa_id
       WHERE u.id = ?`,
      [usuarioId],
    );
    if (!perfil) throw new UnauthorizedException('Usuário não encontrado. Faça login novamente.');
    return perfil;
  }

  async editarPerfil(usuarioId: string, dados: PerfilDto) {
    const email = dados.email.trim().toLowerCase();
    // O e-mail é único: não pode ser o de outra conta (o próprio e-mail continua valendo).
    const [emailUsado] = await this.banco.consultar('SELECT 1 FROM usuario WHERE email = ? AND id <> ?', [
      email,
      usuarioId,
    ]);
    if (emailUsado) throw new ConflictException('Este e-mail já está em uso por outra conta.');

    await this.banco.executar('UPDATE usuario SET nome = ?, email = ? WHERE id = ?', [
      dados.nome.trim(),
      email,
      usuarioId,
    ]);
    return this.buscarPerfil(usuarioId);
  }

  async trocarSenha(usuarioId: string, dados: SenhaDto) {
    const [usuario] = await this.banco.consultar('SELECT senha_hash FROM usuario WHERE id = ?', [usuarioId]);
    if (!usuario || !(await bcrypt.compare(dados.senhaAtual, usuario.senha_hash))) {
      throw new BadRequestException('Senha atual incorreta.');
    }
    const senhaHash = await bcrypt.hash(dados.novaSenha, 10);
    await this.banco.executar('UPDATE usuario SET senha_hash = ? WHERE id = ?', [senhaHash, usuarioId]);
    return { mensagem: 'Senha alterada.' };
  }

  // Token + perfil: o frontend guarda o token e mostra o nome da empresa.
  private async criarSessao(usuarioId: string) {
    const perfil = await this.buscarPerfil(usuarioId);
    const token = this.jwt.sign({ usuarioId, empresaId: perfil.empresa_id });
    return { token, perfil };
  }
}
