// Cria a empresa de demonstração "Padaria Estrela" com 3 trimestres de dados:
// os dois anteriores e o atual, calculados a partir da data de hoje.
// Login: demo@syncro.com / demo1234
// Rodar de novo apaga a demo anterior e recria.
//
// Objetivo: o painel ficar igual em qualquer data em que o seed rodar:
//   - 2 metas "No prazo", 1 "Atenção" e 1 "Em risco" no trimestre atual;
//   - score geral subindo nos três trimestres.
// Como o status depende de quanto do trimestre já passou (ritmo_esperado da
// view vw_meta_status), os valores do trimestre atual são calculados a partir
// dessa fração. Por isso, rode o seed de novo perto da apresentação.
//
// Limite matemático: "Em risco" exige estar mais de 25 pontos atrás do ritmo,
// o que só é possível depois de ~25% do trimestre (por volta do dia 23).
import bcrypt from 'bcryptjs';
import pg from 'pg';

const CNPJ_DEMO = '12345678000190';
const EMAIL_DEMO = 'demo@syncro.com';

// Metas: [base, alvo] em cada trimestre (do mais antigo ao atual).
// As faixas não se sobrepõem, então o valor medido melhora a cada trimestre.
const METAS = {
  'ENE-01': [[4900, 4600], [4600, 4350], [4350, 4000]], // kWh, reduzir
  'AGU-01': [[42, 38], [38, 35], [35, 30]], // m³, reduzir
  'SOC-02': [[20, 25], [25, 30], [30, 40]], // %, aumentar
  'GOV-02': [[30, 40], [40, 55], [55, 80]], // %, aumentar
};

// Status que cada meta deve mostrar no trimestre atual.
const STATUS_NO_TRIMESTRE_ATUAL = {
  'ENE-01': 'no_prazo',
  'GOV-02': 'no_prazo',
  'AGU-01': 'atencao',
  'SOC-02': 'em_risco',
};

// Nos trimestres anteriores, cada meta avançou só uma fração do que avança no atual.
const FRACAO_DO_PROGRESSO = [0.3, 0.6, 1];

// Outras leituras mensais (sem meta). null = a empresa ainda não media.
const MENSAIS = {
  'RES-01': [null, 480, 450], // kg
  'RES-02': [30, 38, 45], // %
  'SOC-03': [12, 10, 8], // %
};

// Lançamentos pontuais: [valores por trimestre, descrição]. null = não houve.
const PONTUAIS = {
  'SOC-01': [[null, 6, 8], 'Treinamento de boas práticas de manipulação de alimentos'],
  'SOC-04': [[1, 2, 2], 'Doação de pães para a ONG do bairro'],
  'GOV-01': [[null, null, 2], 'Política publicada no mural e enviada à equipe'],
};
// Os null acima deixam a cobertura menor nos trimestres antigos
// (E 2/3, S 1/2, G 1/2 -> E 1, S 1, G 1/2 -> tudo coberto), o que também faz o score subir.

// Progresso que produz cada status, dado o ritmo esperado (fração do trimestre decorrida).
// Na view: desvio = progresso - ritmo; >= -0,10 no prazo; >= -0,25 atenção; abaixo, em risco.
function progressoPara(status, ritmo) {
  if (status === 'no_prazo') return Math.min(1, ritmo + 0.05); // 5 pontos à frente do ritmo
  if (status === 'atencao') return Math.max(0, ritmo - 0.12); // 12 pontos atrás
  return Math.max(0, ritmo - 0.4); // em risco: 40 pontos atrás
}

function dataISO(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Os 3 trimestres: dois anteriores e o atual.
function calcularTrimestres(hoje) {
  const [anoHoje, mesHoje] = hoje.split('-').map(Number);
  const atual = anoHoje * 4 + Math.floor((mesHoje - 1) / 3); // trimestres contados desde o ano 0
  return [atual - 2, atual - 1, atual].map((n) => {
    const ano = Math.floor(n / 4);
    const trimestre = (n % 4) + 1;
    const primeiroMes = (trimestre - 1) * 3 + 1;
    const ultimoDia = new Date(Date.UTC(ano, primeiroMes + 2, 0)).getUTCDate();
    return {
      ano,
      trimestre,
      primeiroMes,
      inicio: dataISO(ano, primeiroMes, 1),
      fim: dataISO(ano, primeiroMes + 2, ultimoDia),
    };
  });
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();

try {
  await cliente.query('BEGIN');

  // Usa a mesma data que as views usam (CURRENT_DATE do banco).
  const { rows: [{ hoje }] } = await cliente.query('SELECT CURRENT_DATE::text AS hoje');

  // acao_esg -> periodo é RESTRICT, então os lançamentos saem antes da empresa.
  await cliente.query(
    'DELETE FROM acao_esg WHERE empresa_id IN (SELECT id FROM empresa WHERE cnpj = $1)',
    [CNPJ_DEMO],
  );
  await cliente.query('DELETE FROM empresa WHERE cnpj = $1', [CNPJ_DEMO]);
  await cliente.query('DELETE FROM usuario WHERE email = $1', [EMAIL_DEMO]);

  const empresa = await cliente.query(
    `INSERT INTO empresa (nome, cnpj, setor, porte)
     VALUES ('Padaria Estrela', $1, 'Alimentação', 'micro') RETURNING id`,
    [CNPJ_DEMO],
  );
  const empresaId = empresa.rows[0].id;

  const usuario = await cliente.query(
    `INSERT INTO usuario (empresa_id, nome, email, senha_hash)
     VALUES ($1, 'Responsável Demo', $2, $3) RETURNING id`,
    [empresaId, EMAIL_DEMO, await bcrypt.hash('demo1234', 10)],
  );
  const usuarioId = usuario.rows[0].id;

  const indicadores = await cliente.query('SELECT id, codigo FROM indicador');
  const idDoIndicador = Object.fromEntries(indicadores.rows.map((i) => [i.codigo, i.id]));

  async function lancar(periodoId, codigo, valor, data, descricao = null) {
    await cliente.query(
      `INSERT INTO acao_esg (empresa_id, periodo_id, usuario_id, indicador_id, valor, data_referencia, descricao)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [empresaId, periodoId, usuarioId, idDoIndicador[codigo], valor, data, descricao],
    );
  }

  const trimestres = calcularTrimestres(hoje);

  // Fração do trimestre atual já decorrida: a mesma conta do ritmo_esperado da view.
  const atual = trimestres[2];
  const { rows: [{ ritmo }] } = await cliente.query(
    `SELECT LEAST(GREATEST((CURRENT_DATE - $1::date)::numeric / ($2::date - $1::date), 0), 1)::float AS ritmo`,
    [atual.inicio, atual.fim],
  );

  for (const [indice, t] of trimestres.entries()) {
    const periodo = await cliente.query(
      `INSERT INTO periodo (empresa_id, tipo, ano, trimestre, data_inicio, data_fim)
       VALUES ($1, 'trimestre', $2, $3, $4, $5) RETURNING id`,
      [empresaId, t.ano, t.trimestre, t.inicio, t.fim],
    );
    const periodoId = periodo.rows[0].id;

    // Valor mensal de cada indicador neste trimestre.
    const valores = {};
    for (const [codigo, faixas] of Object.entries(METAS)) {
      const [base, alvo] = faixas[indice];
      const progresso = progressoPara(STATUS_NO_TRIMESTRE_ATUAL[codigo], ritmo) * FRACAO_DO_PROGRESSO[indice];
      valores[codigo] = Math.round((base + progresso * (alvo - base)) * 100) / 100;

      await cliente.query(
        `INSERT INTO meta_esg (empresa_id, periodo_id, indicador_id, valor_base, valor_alvo)
         VALUES ($1, $2, $3, $4, $5)`,
        [empresaId, periodoId, idDoIndicador[codigo], base, alvo],
      );
    }
    for (const [codigo, porTrimestre] of Object.entries(MENSAIS)) {
      if (porTrimestre[indice] !== null) valores[codigo] = porTrimestre[indice];
    }

    // Uma leitura no dia 1 de cada mês; no trimestre atual, só dos meses que já começaram.
    // Os indicadores mensais usam média, então o valor do trimestre é o próprio valor mensal.
    for (let mes = t.primeiroMes; mes < t.primeiroMes + 3; mes++) {
      const data = dataISO(t.ano, mes, 1);
      if (data > hoje) continue;
      for (const [codigo, valor] of Object.entries(valores)) {
        await lancar(periodoId, codigo, valor, data);
      }
    }

    // Lançamentos pontuais no dia 12 do primeiro mês (ou hoje, se ainda não chegou).
    const dataPlanejada = dataISO(t.ano, t.primeiroMes, 12);
    const dataPontual = dataPlanejada > hoje ? hoje : dataPlanejada;
    for (const [codigo, [porTrimestre, descricao]] of Object.entries(PONTUAIS)) {
      if (porTrimestre[indice] !== null) {
        await lancar(periodoId, codigo, porTrimestre[indice], dataPontual, descricao);
      }
    }
  }

  await cliente.query('COMMIT');

  // Conferência: lê o resultado direto das views.
  const metas = await cliente.query(
    `SELECT m.codigo, ROUND(m.progresso, 2)::float AS progresso, m.status
     FROM vw_meta_status m JOIN periodo p ON p.id = m.periodo_id
     WHERE m.empresa_id = $1 AND p.data_inicio = $2 ORDER BY m.codigo`,
    [empresaId, atual.inicio],
  );
  const scores = await cliente.query(
    `SELECT p.trimestre || 'º tri ' || p.ano AS nome,
            string_agg(s.pilar || '=' || s.score, ' ' ORDER BY s.pilar) AS pilares
     FROM vw_score_pilar s JOIN periodo p ON p.id = s.periodo_id
     WHERE s.empresa_id = $1 GROUP BY p.id ORDER BY p.data_inicio`,
    [empresaId],
  );

  console.log(`Demo criada: Padaria Estrela. Hoje ${hoje}, ${Math.round(ritmo * 100)}% do trimestre decorrido.`);
  console.log('Metas do trimestre atual:', metas.rows.map((m) => `${m.codigo} ${m.status}`).join(', '));
  console.log('Scores por pilar:', scores.rows.map((s) => `${s.nome}: ${s.pilares}`).join(' | '));
  console.log(`Login: ${EMAIL_DEMO} / demo1234`);
} catch (erro) {
  await cliente.query('ROLLBACK');
  console.error('Erro ao criar a demo:', erro.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
