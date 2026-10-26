-- =====================================================================
-- SYNCRO ESG - Banco de dados do MVP
-- PostgreSQL 14+ (Neon em producao, Postgres local em desenvolvimento)
-- 7 tabelas: subconjunto do modelo completo de 14 tabelas (ver DER).
-- Rodar com:  npm run db:setup
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------- TIPOS -----------------------------------
CREATE TYPE papel_usuario  AS ENUM ('responsavel_esg', 'gestor', 'visualizador');
CREATE TYPE pilar_esg      AS ENUM ('E', 'S', 'G');
CREATE TYPE direcao_ind    AS ENUM ('reduzir', 'aumentar');
CREATE TYPE agregacao_ind  AS ENUM ('soma', 'media');
CREATE TYPE tipo_periodo   AS ENUM ('trimestre', 'ano');
CREATE TYPE porte_empresa  AS ENUM ('micro', 'pequena', 'media');

-- ------------------------- 1. EMPRESA ------------------------------
CREATE TABLE empresa (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(150) NOT NULL,
    cnpj        CHAR(14)     NOT NULL UNIQUE,
    setor       VARCHAR(100),
    porte       porte_empresa,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_cnpj CHECK (cnpj ~ '^[0-9]{14}$')
);

-- ------------------------- 2. USUARIO ------------------------------
CREATE TABLE usuario (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    papel       papel_usuario NOT NULL DEFAULT 'responsavel_esg',
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usuario_empresa ON usuario(empresa_id);

-- ------------------------- 3. PERIODO ------------------------------
CREATE TABLE periodo (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id   UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    tipo         tipo_periodo NOT NULL DEFAULT 'trimestre',
    ano          SMALLINT NOT NULL,
    trimestre    SMALLINT,
    data_inicio  DATE NOT NULL,
    data_fim     DATE NOT NULL,
    CONSTRAINT chk_trimestre CHECK (
        (tipo = 'trimestre' AND trimestre BETWEEN 1 AND 4)
     OR (tipo = 'ano' AND trimestre IS NULL)),
    CONSTRAINT chk_datas CHECK (data_fim > data_inicio),
    CONSTRAINT uq_periodo UNIQUE (empresa_id, tipo, ano, trimestre)
);

-- ------------------------- 4. INDICADOR (catalogo global) ----------
-- agregacao: como varios lancamentos no mesmo periodo viram um numero.
--   soma  -> contagens e horas (ex.: acoes comunitarias, horas de treino)
--   media -> leituras mensais e percentuais (ex.: kWh por mes, %)
CREATE TABLE indicador (
    id           SERIAL PRIMARY KEY,
    codigo       VARCHAR(10)  NOT NULL UNIQUE,
    nome         VARCHAR(150) NOT NULL,
    pilar        pilar_esg    NOT NULL,
    unidade      VARCHAR(15)  NOT NULL,
    direcao      direcao_ind  NOT NULL,
    agregacao    agregacao_ind NOT NULL,
    obrigatorio  BOOLEAN NOT NULL DEFAULT FALSE,  -- conta na cobertura do score
    calculado    BOOLEAN NOT NULL DEFAULT FALSE   -- gerado pelo sistema, nao digitado
);

-- ------------------------- 5. FATOR_EMISSAO (catalogo global) ------
-- Fator medio de emissao do SIN publicado pelo MCTI. valor em tCO2/MWh.
-- mes NULL = fator anual.
CREATE TABLE fator_emissao (
    id      SERIAL PRIMARY KEY,
    ano     SMALLINT NOT NULL,
    mes     SMALLINT,
    valor   NUMERIC(8,5) NOT NULL,
    fonte   VARCHAR(120) NOT NULL,
    CONSTRAINT chk_mes CHECK (mes IS NULL OR mes BETWEEN 1 AND 12),
    CONSTRAINT uq_fator UNIQUE (ano, mes)
);

-- ------------------------- 6. ACAO_ESG -----------------------------
CREATE TABLE acao_esg (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       UUID NOT NULL REFERENCES empresa(id)   ON DELETE CASCADE,
    periodo_id       UUID NOT NULL REFERENCES periodo(id)   ON DELETE RESTRICT,
    usuario_id       UUID          REFERENCES usuario(id)   ON DELETE SET NULL,
    indicador_id     INT  NOT NULL REFERENCES indicador(id) ON DELETE RESTRICT,
    valor            NUMERIC(14,4) NOT NULL CHECK (valor >= 0),
    data_referencia  DATE NOT NULL,
    descricao        TEXT,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_acao_periodo ON acao_esg(periodo_id, indicador_id);
CREATE INDEX idx_acao_empresa ON acao_esg(empresa_id, data_referencia DESC);

-- ------------------------- 7. META_ESG -----------------------------
-- status NAO e coluna: e calculado em tempo de execucao (vw_meta_status).
CREATE TABLE meta_esg (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id    UUID NOT NULL REFERENCES empresa(id)   ON DELETE CASCADE,
    periodo_id    UUID NOT NULL REFERENCES periodo(id)   ON DELETE CASCADE,
    indicador_id  INT  NOT NULL REFERENCES indicador(id) ON DELETE RESTRICT,
    valor_base    NUMERIC(14,4) NOT NULL,
    valor_alvo    NUMERIC(14,4) NOT NULL,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_meta UNIQUE (periodo_id, indicador_id),
    CONSTRAINT chk_alvo CHECK (valor_alvo <> valor_base)
);

-- =====================================================================
-- CATALOGO DE INDICADORES (11)
-- =====================================================================
INSERT INTO indicador (codigo, nome, pilar, unidade, direcao, agregacao, obrigatorio, calculado) VALUES
('ENE-01','Consumo de energia elétrica',           'E','kWh',  'reduzir',  'media', TRUE,  FALSE),
('AGU-01','Consumo de água',                       'E','m³',   'reduzir',  'media', TRUE,  FALSE),
('RES-01','Resíduos gerados',                      'E','kg',   'reduzir',  'media', TRUE,  FALSE),
('RES-02','Resíduos destinados à reciclagem',      'E','%',    'aumentar', 'media', FALSE, FALSE),
('EMI-01','Emissões escopo 2 (energia)',           'E','tCO₂e','reduzir',  'soma',  FALSE, TRUE),
('SOC-01','Horas de treinamento por funcionário',  'S','h',    'aumentar', 'soma',  TRUE,  FALSE),
('SOC-02','Mulheres em cargos de liderança',       'S','%',    'aumentar', 'media', TRUE,  FALSE),
('SOC-03','Rotatividade (turnover)',               'S','%',    'reduzir',  'media', FALSE, FALSE),
('SOC-04','Ações comunitárias realizadas',         'S','un',   'aumentar', 'soma',  FALSE, FALSE),
('GOV-01','Políticas internas publicadas',         'G','un',   'aumentar', 'soma',  TRUE,  FALSE),
('GOV-02','Fornecedores com código de conduta',    'G','%',    'aumentar', 'media', TRUE,  FALSE);

-- =====================================================================
-- FATORES MEDIOS DE EMISSAO DO SIN (MCTI / SIRENE), em tCO2/MWh.
-- Para lancamentos sem fator do proprio mes, usa-se o mais recente.
-- Atualize com os meses mais recentes publicados pelo MCTI.
-- =====================================================================
INSERT INTO fator_emissao (ano, mes, valor, fonte) VALUES
(2023, NULL, 0.03850, 'MCTI - fator médio anual SIN 2023'),
(2025, 1,    0.02370, 'MCTI/SIRENE - fator médio mensal SIN'),
(2025, 2,    0.02480, 'MCTI/SIRENE - fator médio mensal SIN'),
(2025, 3,    0.02150, 'MCTI/SIRENE - fator médio mensal SIN'),
(2025, 4,    0.02890, 'MCTI/SIRENE - fator médio mensal SIN');

-- =====================================================================
-- FUNCAO: fator vigente para uma data
-- (o mais recente ate a data; se nao houver, o mais recente disponivel)
-- =====================================================================
CREATE OR REPLACE FUNCTION fator_vigente(p_data DATE) RETURNS NUMERIC AS $$
    SELECT valor FROM fator_emissao
    ORDER BY
      (make_date(ano, COALESCE(mes, 12), 1) <= p_data) DESC,
      ano DESC, COALESCE(mes, 0) DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =====================================================================
-- VIEW: emissoes de escopo 2 por lancamento de energia
-- tCO2e = kWh / 1000 x fator (tCO2/MWh)
-- =====================================================================
CREATE OR REPLACE VIEW vw_emissoes AS
SELECT a.empresa_id, a.periodo_id, a.id AS acao_id, a.data_referencia,
       a.valor AS kwh,
       ROUND(a.valor / 1000 * fator_vigente(a.data_referencia), 4) AS tco2e
FROM acao_esg a
JOIN indicador i ON i.id = a.indicador_id
WHERE i.codigo = 'ENE-01';

-- =====================================================================
-- VIEW: valor de cada indicador em cada periodo (soma ou media)
-- =====================================================================
CREATE OR REPLACE VIEW vw_indicador_periodo AS
SELECT a.empresa_id, a.periodo_id, i.id AS indicador_id,
       CASE WHEN i.agregacao = 'soma' THEN SUM(a.valor) ELSE AVG(a.valor) END AS valor,
       COUNT(*) AS lancamentos
FROM acao_esg a
JOIN indicador i ON i.id = a.indicador_id
GROUP BY a.empresa_id, a.periodo_id, i.id, i.agregacao;

-- =====================================================================
-- VIEW: progresso e status de cada meta (calculado, nunca armazenado)
--   progresso = (atual - base) / (alvo - base), limitado entre 0 e 1
--     (o sinal de alvo - base ja carrega a direcao: reduzir ou aumentar)
--   ritmo_esperado = fracao do periodo ja decorrida
--   desvio = progresso - ritmo_esperado
--     >= -0,10 no_prazo | entre -0,25 e -0,10 atencao | < -0,25 em_risco
-- =====================================================================
CREATE OR REPLACE VIEW vw_meta_status AS
WITH base AS (
  SELECT m.id AS meta_id, m.empresa_id, m.periodo_id, m.indicador_id,
         i.codigo, i.nome AS indicador, i.pilar, i.unidade, i.direcao,
         m.valor_base, m.valor_alvo,
         COALESCE(v.valor, m.valor_base) AS valor_atual,
         COALESCE(v.lancamentos, 0) AS lancamentos,
         LEAST(GREATEST((CURRENT_DATE - p.data_inicio)::NUMERIC
               / NULLIF(p.data_fim - p.data_inicio, 0), 0), 1) AS ritmo_esperado
  FROM meta_esg m
  JOIN periodo p   ON p.id = m.periodo_id
  JOIN indicador i ON i.id = m.indicador_id
  LEFT JOIN vw_indicador_periodo v
         ON v.periodo_id = m.periodo_id AND v.indicador_id = m.indicador_id
), prog AS (
  SELECT *, LEAST(GREATEST(
       (valor_atual - valor_base) / NULLIF(valor_alvo - valor_base, 0), 0), 1) AS progresso
  FROM base
)
SELECT *,
  CASE WHEN progresso - ritmo_esperado >= -0.10 THEN 'no_prazo'
       WHEN progresso - ritmo_esperado >= -0.25 THEN 'atencao'
       ELSE 'em_risco' END AS status
FROM prog;

-- =====================================================================
-- VIEW: score por pilar em cada periodo (0 a 100)
--   score = 100 x (0,7 x media do progresso das metas + 0,3 x cobertura)
--   cobertura = indicadores obrigatorios com lancamento / total obrigatorios
-- O termo de cobertura impede o score de ser inflado por uma meta facil.
-- Score geral (calculado no backend): 0,40 x E + 0,30 x S + 0,30 x G
-- =====================================================================
CREATE OR REPLACE VIEW vw_score_pilar AS
WITH pilares AS (
  SELECT p.id AS periodo_id, p.empresa_id, x.pilar
  FROM periodo p CROSS JOIN (VALUES ('E'::pilar_esg),('S'),('G')) x(pilar)
), cob AS (
  SELECT pl.periodo_id, pl.pilar,
         COUNT(DISTINCT a.indicador_id)::NUMERIC
           / NULLIF(COUNT(DISTINCT i.id), 0) AS cobertura
  FROM pilares pl
  JOIN indicador i ON i.pilar = pl.pilar AND i.obrigatorio
  LEFT JOIN acao_esg a ON a.periodo_id = pl.periodo_id AND a.indicador_id = i.id
  GROUP BY pl.periodo_id, pl.pilar
), met AS (
  SELECT periodo_id, pilar, AVG(progresso) AS media_progresso, COUNT(*) AS metas
  FROM vw_meta_status GROUP BY periodo_id, pilar
)
SELECT pl.empresa_id, pl.periodo_id, pl.pilar,
       ROUND(100 * (0.7 * COALESCE(m.media_progresso, 0)
                  + 0.3 * COALESCE(c.cobertura, 0)), 0)::INT AS score,
       ROUND(COALESCE(c.cobertura, 0), 2) AS cobertura,
       COALESCE(m.metas, 0)::INT AS metas
FROM pilares pl
LEFT JOIN cob c ON c.periodo_id = pl.periodo_id AND c.pilar = pl.pilar
LEFT JOIN met m ON m.periodo_id = pl.periodo_id AND m.pilar = pl.pilar;
