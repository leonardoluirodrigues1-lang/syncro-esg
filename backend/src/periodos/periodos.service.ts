import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BancoService } from '../banco/banco.service';

interface Periodo {
  id: string;
  ano: number;
  trimestre: number;
  data_inicio: string;
  data_fim: string;
  nome: string; // ex.: "4º tri 2026"
}

const COLUNAS = `p.id, p.ano, p.trimestre, p.data_inicio, p.data_fim,
                 CONCAT(p.trimestre, 'º tri ', p.ano) AS nome`;

// Data de hoje no fuso de São Paulo (AAAA-MM-DD), independente do fuso do servidor.
export function hojeEmSaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

@Injectable()
export class PeriodosService {
  constructor(private banco: BancoService) {}

  listar(empresaId: string): Promise<Periodo[]> {
    return this.banco.consultar(
      `SELECT ${COLUNAS} FROM periodo p WHERE p.empresa_id = ? ORDER BY p.data_inicio DESC`,
      [empresaId],
    );
  }

  // Devolve o trimestre que contém a data; cria o trimestre se ainda não existir.
  // A data já vem como 'AAAA-MM-DD' no fuso de São Paulo (hojeEmSaoPaulo ou o formulário).
  async trimestreDaData(empresaId: string, data: string): Promise<Periodo> {
    // Início e fim do trimestre calculados aqui, sem INTERVAL no SQL (compatível com o TiDB).
    const [ano, mes] = data.split('-').map(Number);
    const trimestre = Math.floor((mes - 1) / 3) + 1;
    const primeiroMes = (trimestre - 1) * 3 + 1;
    const ultimoDia = new Date(Date.UTC(ano, primeiroMes + 2, 0)).getUTCDate(); // dia 0 = último dia do mês anterior
    const doisDigitos = (n: number) => String(n).padStart(2, '0');
    const inicio = `${ano}-${doisDigitos(primeiroMes)}-01`;
    const fim = `${ano}-${doisDigitos(primeiroMes + 2)}-${ultimoDia}`;

    // Se o trimestre já existe (regra uq_periodo), o ON DUPLICATE KEY não altera nada.
    await this.banco.executar(
      `INSERT INTO periodo (id, empresa_id, tipo, ano, trimestre, data_inicio, data_fim)
       VALUES (?, ?, 'trimestre', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [randomUUID(), empresaId, ano, trimestre, inicio, fim],
    );
    const [periodo] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p
       WHERE p.empresa_id = ? AND p.tipo = 'trimestre' AND CAST(? AS DATE) BETWEEN p.data_inicio AND p.data_fim`,
      [empresaId, data],
    );
    return periodo;
  }

  // Período pedido pelo usuário ou, se nenhum for informado, o trimestre atual.
  async buscar(empresaId: string, periodoId?: string): Promise<Periodo> {
    if (!periodoId) return this.trimestreDaData(empresaId, hojeEmSaoPaulo());

    const [periodo] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p WHERE p.id = ? AND p.empresa_id = ?`,
      [periodoId, empresaId],
    );
    if (!periodo) throw new NotFoundException('Período não encontrado.');
    return periodo;
  }

  async anterior(empresaId: string, periodo: Periodo): Promise<Periodo | null> {
    const [anterior] = await this.banco.consultar<Periodo>(
      `SELECT ${COLUNAS} FROM periodo p
       WHERE p.empresa_id = ? AND p.data_fim < ?
       ORDER BY p.data_inicio DESC LIMIT 1`,
      [empresaId, periodo.data_inicio],
    );
    return anterior ?? null;
  }
}
