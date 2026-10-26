import { Injectable, NotFoundException } from '@nestjs/common';
import { BancoService } from '../banco/banco.service';

export interface Periodo {
  id: string;
  ano: number;
  trimestre: number;
  data_inicio: string;
  data_fim: string;
  nome: string; // ex.: "4º tri 2026"
}

const COLUNAS = `p.id, p.ano, p.trimestre, p.data_inicio, p.data_fim,
                 p.trimestre || 'º tri ' || p.ano AS nome`;

// Data de hoje no fuso de São Paulo (AAAA-MM-DD), independente do fuso do servidor.
export function hojeEmSaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

@Injectable()
export class PeriodosService {
  constructor(private banco: BancoService) {}

  listar(empresaId: string): Promise<Periodo[]> {
    return this.banco.consultar(
      `SELECT ${COLUNAS} FROM periodo p WHERE p.empresa_id = $1 ORDER BY p.data_inicio DESC`,
      [empresaId],
    );
  }

  // Devolve o trimestre que contém a data; cria o trimestre se ainda não existir.
  async trimestreDaData(empresaId: string, data: string): Promise<Periodo> {
    await this.banco.consultar(
      `INSERT INTO periodo (empresa_id, tipo, ano, trimestre, data_inicio, data_fim)
       SELECT $1, 'trimestre', EXTRACT(YEAR FROM d), EXTRACT(QUARTER FROM d),
              date_trunc('quarter', d)::date,
              (date_trunc('quarter', d) + INTERVAL '3 months - 1 day')::date
       FROM (SELECT $2::date AS d) AS x
       ON CONFLICT (empresa_id, tipo, ano, trimestre) DO NOTHING`,
      [empresaId, data],
    );
    const [periodo] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p
       WHERE p.empresa_id = $1 AND p.tipo = 'trimestre' AND $2::date BETWEEN p.data_inicio AND p.data_fim`,
      [empresaId, data],
    );
    return periodo;
  }

  // Período pedido pelo usuário ou, se nenhum for informado, o trimestre atual.
  async buscar(empresaId: string, periodoId?: string): Promise<Periodo> {
    if (!periodoId) return this.trimestreDaData(empresaId, hojeEmSaoPaulo());

    const [periodo] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p WHERE p.id = $1 AND p.empresa_id = $2`,
      [periodoId, empresaId],
    );
    if (!periodo) throw new NotFoundException('Período não encontrado.');
    return periodo;
  }

  // Trimestre imediatamente anterior (ou null se for o primeiro).
  async anterior(empresaId: string, periodo: Periodo): Promise<Periodo | null> {
    const [anterior] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p
       WHERE p.empresa_id = $1 AND p.data_fim < $2
       ORDER BY p.data_inicio DESC LIMIT 1`,
      [empresaId, periodo.data_inicio],
    );
    return anterior ?? null;
  }
}
