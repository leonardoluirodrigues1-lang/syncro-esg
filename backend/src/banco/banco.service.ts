import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, type Pool, type ResultSetHeader } from 'mysql2/promise';

// Configuração da conexão a partir do DATABASE_URL (mysql://usuario:senha@host:porta/banco).
function configuracaoDoBanco(url = process.env.DATABASE_URL ?? '') {
  const local = ['localhost', '127.0.0.1'].includes(new URL(url).hostname);
  return {
    uri: url,
    // O TiDB Cloud só aceita conexões criptografadas.
    ssl: local ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    decimalNumbers: true, // DECIMAL chega como número, não como texto
    dateStrings: true, // DATE chega como 'AAAA-MM-DD', sem conversão de fuso
    // BOOLEAN no MySQL é TINYINT(1): devolve true/false como no PostgreSQL.
    typeCast: (campo: any, proximo: () => unknown) => {
      if (campo.type === 'TINY' && campo.length === 1) {
        const valor = campo.string();
        return valor === null ? null : valor === '1';
      }
      return proximo();
    },
  };
}

// Por padrão o MySQL dá só 4 casas decimais a uma divisão (ex.: 48/91 = 0.5275).
// Com 30, progresso, ritmo e cobertura saem com a mesma precisão do PostgreSQL.
const PRECISAO_DA_DIVISAO = 'SET SESSION div_precision_increment = 30';

@Injectable()
export class BancoService implements OnModuleDestroy {
  private pool: Pool = createPool({ ...configuracaoDoBanco(), connectionLimit: 5 });

  constructor() {
    this.pool.on('connection', (conexao) => conexao.query(PRECISAO_DA_DIVISAO));
  }

  // SELECT: devolve as linhas.
  async consultar<T = any>(sql: string, parametros: unknown[] = []): Promise<T[]> {
    const [linhas] = await this.pool.query(sql, parametros);
    return linhas as T[];
  }

  // INSERT, UPDATE e DELETE: devolve quantas linhas foram afetadas.
  async executar(sql: string, parametros: unknown[] = []): Promise<number> {
    const [resultado] = await this.pool.query<ResultSetHeader>(sql, parametros);
    return resultado.affectedRows;
  }

  // Vários comandos que precisam ser gravados juntos: ou todos, ou nenhum.
  async transacao(comandos: [sql: string, parametros: unknown[]][]): Promise<void> {
    const conexao = await this.pool.getConnection();
    try {
      await conexao.beginTransaction();
      for (const [sql, parametros] of comandos) await conexao.query(sql, parametros);
      await conexao.commit();
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
