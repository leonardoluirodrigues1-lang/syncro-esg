import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class PerfilDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o seu nome.' })
  @MaxLength(120, { message: 'O nome pode ter no máximo 120 caracteres.' })
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}

export class SenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha atual.' })
  senhaAtual: string;

  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' })
  novaSenha: string;
}
