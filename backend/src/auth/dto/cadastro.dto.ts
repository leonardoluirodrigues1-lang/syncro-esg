import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CadastroDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome da empresa.' })
  @MaxLength(150, { message: 'O nome da empresa pode ter no máximo 150 caracteres.' })
  nomeEmpresa: string;

  // Aceita com ou sem máscara; a limpeza é feita no AuthService.
  @IsString({ message: 'Informe o CNPJ.' })
  cnpj: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'O setor pode ter no máximo 100 caracteres.' })
  setor?: string;

  @IsOptional()
  @IsIn(['micro', 'pequena', 'media'], { message: 'Porte inválido.' })
  porte?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o seu nome.' })
  @MaxLength(120, { message: 'O nome pode ter no máximo 120 caracteres.' })
  nome: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha: string;
}
