import { BadRequestException, Injectable } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';

interface Indicador {
  id: number;
  codigo: string;
  nome: string;
  pilar: 'E' | 'S' | 'G';
  unidade: string;
  direcao: 'reduzir' | 'aumentar';
  agregacao: 'soma' | 'media';
  obrigatorio: boolean;
  calculado: boolean;
}

@Injectable()
export class IndicadoresService {
  constructor(private banco: BancoService) {}

  listar(): Promise<Indicador[]> {
    return this.banco.consultar('SELECT * FROM indicador ORDER BY pilar, codigo');
  }

  // Indicador que o usuário pode digitar. Os calculados (emissões) são gerados pelo sistema.
  async buscarDigitavel(indicadorId: number): Promise<Indicador> {
    const [indicador] = await this.banco.consultar<Indicador>('SELECT * FROM indicador WHERE id = $1', [
      indicadorId,
    ]);
    if (!indicador) throw new BadRequestException('Indicador não encontrado.');
    if (indicador.calculado) {
      throw new BadRequestException('Este indicador é calculado pelo sistema e não pode ser digitado.');
    }
    return indicador;
  }

  // tCO₂e = kWh / 1000 × fator do SIN vigente na data (função do banco).
  async previaEmissao(kwh: number, data: string) {
    const [previa] = await this.banco.consultar(
      'SELECT ROUND($1::numeric / 1000 * fator_vigente($2::date), 4)::float AS tco2e',
      [kwh, data],
    );
    return previa;
  }
}
