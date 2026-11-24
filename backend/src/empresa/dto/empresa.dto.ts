import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Campos editáveis da empresa. O CNPJ fica de fora: ele identifica a empresa e não muda.
export class EmpresaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome da empresa.' })
  @MaxLength(150, { message: 'O nome da empresa pode ter no máximo 150 caracteres.' })
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'O setor pode ter no máximo 100 caracteres.' })
  setor?: string;

  @IsOptional()
  @IsIn(['micro', 'pequena', 'media', ''], { message: 'Porte inválido.' })
  porte?: string;
}
