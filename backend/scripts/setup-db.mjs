// Cria as tabelas, o catálogo e as views a partir de db/schema.sql.
// Uso: npm run db:setup          (banco vazio)
//      npm run db:reset          (apaga TUDO e recria)
import { readFileSync } from 'node:fs';
import pg from 'pg';

const resetar = process.argv.includes('--reset');
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (arquivo .env ou variável de ambiente).');
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();

try {
  if (resetar) {
    // Apagar o schema public remove tabelas, views, tipos e funções de uma vez.
    await cliente.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Banco apagado.');
  }
  await cliente.query(schema);
  console.log('Banco configurado com sucesso.');
} catch (erro) {
  // 42710 = tipo já existe: o schema já foi aplicado antes.
  if (erro.code === '42710') {
    console.error('O banco já está configurado. Para recriar do zero: npm run db:reset');
  } else {
    console.error('Erro ao configurar o banco:', erro.message);
  }
  process.exitCode = 1;
} finally {
  await cliente.end();
}
