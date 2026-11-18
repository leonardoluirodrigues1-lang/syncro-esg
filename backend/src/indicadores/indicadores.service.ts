import { BadRequestException, Injectable } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';
import { comReferencia } from './referencias';

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

  async listar() {
    const indicadores = await this.banco.consultar<Indicador>('SELECT * FROM indicador ORDER BY pilar, codigo');
    return comReferencia(indicadores);
  }

  // Indicadores em % não podem passar de 100 (vale para lançamentos e metas).
  // Fica aqui, e não no DTO, porque a unidade só é conhecida depois de buscar o indicador no banco.
  validarPercentual(indicador: Indicador, ...valores: number[]) {
    if (indicador.unidade === '%' && valores.some((v) => v > 100)) {
      throw new BadRequestException('Este indicador é um percentual: o valor deve ficar entre 0 e 100.');
    }
  }

  // Indicador que o usuário pode digitar. Os calculados (emissões) são gerados pelo sistema.
  async buscarDigitavel(indicadorId: number): Promise<Indicador> {
    const [indicador] = await this.banco.consultar<Indicador>('SELECT * FROM indicador WHERE id = ?', [
      indicadorId,
    ]);
    if (!indicador) throw new BadRequestException('Indicador não encontrado.');
    if (indicador.calculado) {
      throw new BadRequestException('Este indicador é calculado pelo sistema e não pode ser digitado.');
    }
    return indicador;
  }

  // tCO₂e = kWh / 1000 × fator do SIN vigente na data.
  // Mesma regra de fator da view vw_emissoes (ver db/schema.sql).
  async previaEmissao(kwh: number, data: string) {
    const [previa] = await this.banco.consultar(
      `SELECT ROUND(? / 1000 * (
                SELECT f.valor FROM fator_emissao f
                ORDER BY (f.ano * 100 + COALESCE(f.mes, 12) <= YEAR(x.d) * 100 + MONTH(x.d)) DESC,
                         f.ano DESC, COALESCE(f.mes, 0) DESC
                LIMIT 1
              ), 4) AS tco2e
       FROM (SELECT CAST(? AS DATE) AS d) AS x`,
      [kwh, data],
    );
    return previa;
  }
}
