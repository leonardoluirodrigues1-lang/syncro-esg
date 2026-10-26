import { Type } from 'class-transformer';
import { IsDateString, IsNumber, Min } from 'class-validator';

export class PreviaEmissaoDto {
  // Na query string tudo chega como texto; @Type converte para número.
  @Type(() => Number)
  @IsNumber({}, { message: 'Informe os kWh como número.' })
  @Min(0, { message: 'Os kWh não podem ser negativos.' })
  kwh: number;

  @IsDateString({ strict: true }, { message: 'Informe uma data válida.' })
  data: string;
}
