import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

// Usado para criar e para editar um lançamento.
export class AcaoDto {
  @IsInt({ message: 'Escolha um indicador.' })
  indicadorId: number;

  @IsNumber({}, { message: 'Informe o valor como número.' })
  @Min(0, { message: 'O valor não pode ser negativo.' })
  valor: number;

  // A data define o trimestre do lançamento.
  @IsDateString({ strict: true }, { message: 'Informe uma data válida.' })
  dataReferencia: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A observação pode ter no máximo 500 caracteres.' })
  descricao?: string;
}
