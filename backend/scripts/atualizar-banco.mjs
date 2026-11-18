// Atualiza um banco que já existe, sem apagar nada e sem mexer nas tabelas:
//   1. insere os fatores de emissão do schema.sql que ainda não estão no banco;
//   2. recria as views (CREATE OR REPLACE) com a versão atual do schema.sql.
// Pode rodar quantas vezes quiser: o resultado é sempre o mesmo.
// Uso: npm run db:atualizar
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL (arquivo .env ou variável de ambiente).');
  process.exit(1);
}

// Linhas do INSERT de fator_emissao, ex.: (2025, 5, 0.03090, 'MCTI/SIRENE - ...')
const insertFatores = schema.match(/INSERT INTO fator_emissao[\s\S]*?;/)[0];
const fatores = [...insertFatores.matchAll(/\((\d{4}),\s*(\d+|NULL),\s*([\d.]+),\s*'([^']+)'\)/g)].map((m) => ({
  ano: Number(m[1]),
  mes: m[2] === 'NULL' ? null : Number(m[2]),
  valor: m[3],
  fonte: m[4],
}));

// Cada view termina no primeiro ';' depois do CREATE (não há ';' dentro delas).
const views = schema.match(/CREATE OR REPLACE VIEW[\s\S]*?;/g);

const local = ['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname);
const conexao = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: local ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true }, // o TiDB exige
});

try {
  let inseridos = 0;
  for (const f of fatores) {
    // NOT EXISTS em vez da chave única: a regra uq_fator não barra duas linhas com mes NULL (fator anual).
    const [resultado] = await conexao.query(
      `INSERT INTO fator_emissao (ano, mes, valor, fonte)
       SELECT ?, ?, ?, ? FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM fator_emissao WHERE ano = ? AND mes <=> ?)`,
      [f.ano, f.mes, f.valor, f.fonte, f.ano, f.mes],
    );
    inseridos += resultado.affectedRows;
  }
  console.log(`Fatores de emissão: ${inseridos} inseridos, ${fatores.length - inseridos} já existiam.`);

  for (const view of views) await conexao.query(view);
  console.log(`Views recriadas: ${views.length}.`);
} catch (erro) {
  console.error('Erro ao atualizar o banco:', erro.message);
  process.exitCode = 1;
} finally {
  await conexao.end();
}
