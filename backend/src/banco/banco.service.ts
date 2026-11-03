import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, types } from 'pg';

// Colunas DATE chegam como texto 'AAAA-MM-DD'. Sem isso o pg cria um Date
// à meia-noite do fuso local e a data pode "voltar" um dia no JSON.
types.setTypeParser(types.builtins.DATE, (valor) => valor);

@Injectable()
export class BancoService implements OnModuleDestroy {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  async consultar<T = any>(sql: string, parametros: unknown[] = []): Promise<T[]> {
    const resultado = await this.pool.query(sql, parametros);
    return resultado.rows;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
