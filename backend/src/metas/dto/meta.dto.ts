import { IsInt, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class MetaDto {
  @IsInt({ message: 'Escolha um indicador.' })
  indicadorId: number;

  @IsNumber({}, { message: 'Informe o valor base como número.' })
  valorBase: number;

  @IsNumber({}, { message: 'Informe o valor alvo como número.' })
  valorAlvo: number;

  // Sem período, a meta vale para o trimestre atual.
  @IsOptional()
  @IsUUID(undefined, { message: 'Período inválido.' })
  periodoId?: string;
}
