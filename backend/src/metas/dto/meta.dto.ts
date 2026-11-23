import { IsInt, IsNumber, IsOptional, IsUUID } from 'class-validator';

// Valores que podem ser alterados ao editar uma meta (PUT /metas/:id).
export class MetaValoresDto {
  @IsNumber({}, { message: 'Informe o valor base como número.' })
  valorBase: number;

  @IsNumber({}, { message: 'Informe o valor alvo como número.' })
  valorAlvo: number;
}

// Criação (POST /metas): os valores acima + indicador e período.
export class MetaDto extends MetaValoresDto {
  @IsInt({ message: 'Escolha um indicador.' })
  indicadorId: number;

  // Sem período, a meta vale para o trimestre atual.
  @IsOptional()
  @IsUUID(undefined, { message: 'Período inválido.' })
  periodoId?: string;
}
