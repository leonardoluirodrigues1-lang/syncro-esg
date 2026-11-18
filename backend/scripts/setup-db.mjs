// Cria as tabelas, o catálogo e as views a partir de db/schema.sql.
// Uso: npm run db:setup          (banco vazio)
//      npm run db:reset          (apaga TUDO e recria)
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const resetar = process.argv.includes('--reset');
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (arquivo .env ou variável de ambiente).');
  process.exit(1);
}

const local = ['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname);
const conexao = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: local ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true }, // o TiDB exige
  multipleStatements: true, // o schema.sql tem vários comandos
});

try {
  if (resetar) {
    // Views primeiro; tabelas na ordem inversa das chaves estrangeiras.
    await conexao.query(`
      DROP VIEW IF EXISTS vw_score_pilar, vw_meta_status, vw_indicador_periodo, vw_emissoes;
      DROP TABLE IF EXISTS meta_esg, acao_esg, fator_emissao, indicador, periodo, usuario, empresa;`);
    console.log('Banco apagado.');
  }
  await conexao.query(schema);
  console.log('Banco configurado com sucesso.');
} catch (erro) {
  // 1050 = tabela já existe: o schema já foi aplicado antes.
  if (erro.errno === 1050) {
    console.error('O banco já está configurado. Para recriar do zero: npm run db:reset');
  } else {
    console.error('Erro ao configurar o banco:', erro.message);
  }
  process.exitCode = 1;
} finally {
  await conexao.end();
}
