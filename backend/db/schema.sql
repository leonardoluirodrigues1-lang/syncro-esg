-- =====================================================================
-- SYNCRO ESG - Banco de dados do MVP
-- MySQL 8 (TiDB Cloud em producao, MySQL local em desenvolvimento)
-- 7 tabelas: subconjunto do modelo completo de 14 tabelas (ver DER).
-- Rodar com:  npm run db:setup
--
-- Para funcionar tambem no TiDB, o schema usa so tabelas, indices e views
-- (nada de function, procedure ou trigger).
-- Os ids (UUID) sao gerados no backend com crypto.randomUUID().
-- utf8mb4_bin: textos comparados exatamente como gravados
-- (sem ignorar acentos ou maiusculas), o padrao do TiDB.
-- =====================================================================

-- ------------------------- 1. EMPRESA ------------------------------
CREATE TABLE empresa (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    cnpj        CHAR(14)     NOT NULL UNIQUE,
    setor       VARCHAR(100),
    porte       ENUM('micro', 'pequena', 'media'),
    criado_em   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_cnpj CHECK (cnpj REGEXP '^[0-9]{14}$')
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- ------------------------- 2. USUARIO ------------------------------
CREATE TABLE usuario (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    empresa_id  CHAR(36)     NOT NULL,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    papel       ENUM('responsavel_esg', 'gestor', 'visualizador') NOT NULL DEFAULT 'responsavel_esg',
    criado_em   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;
CREATE INDEX idx_usuario_empresa ON usuario(empresa_id);

-- ------------------------- 3. PERIODO ------------------------------
CREATE TABLE periodo (
    id           CHAR(36) NOT NULL PRIMARY KEY,
    empresa_id   CHAR(36) NOT NULL,
    tipo         ENUM('trimestre', 'ano') NOT NULL DEFAULT 'trimestre',
    ano          SMALLINT NOT NULL,
    trimestre    SMALLINT,
    data_inicio  DATE NOT NULL,
    data_fim     DATE NOT NULL,
    CONSTRAINT fk_periodo_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
    CONSTRAINT chk_trimestre CHECK (
        (tipo = 'trimestre' AND trimestre BETWEEN 1 AND 4)
     OR (tipo = 'ano' AND trimestre IS NULL)),
    CONSTRAINT chk_datas CHECK (data_fim > data_inicio),
    CONSTRAINT uq_periodo UNIQUE (empresa_id, tipo, ano, trimestre)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- ------------------------- 4. INDICADOR (catalogo global) ----------
-- agregacao: como varios lancamentos no mesmo periodo viram um numero.
--   soma  -> contagens e horas (ex.: acoes comunitarias, horas de treino)
--   media -> leituras mensais e percentuais (ex.: kWh por mes, %)
CREATE TABLE indicador (
    id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    codigo       VARCHAR(10)  NOT NULL UNIQUE,
    nome         VARCHAR(150) NOT NULL,
    pilar        ENUM('E', 'S', 'G') NOT NULL,
    unidade      VARCHAR(15)  NOT NULL,
    direcao      ENUM('reduzir', 'aumentar') NOT NULL,
    agregacao    ENUM('soma', 'media') NOT NULL,
    obrigatorio  BOOLEAN NOT NULL DEFAULT FALSE,  -- conta na cobertura do score
    calculado    BOOLEAN NOT NULL DEFAULT FALSE   -- gerado pelo sistema, nao digitado
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- ------------------------- 5. FATOR_EMISSAO (catalogo global) ------
-- Fator medio de emissao do SIN publicado pelo MCTI. valor em tCO2/MWh.
-- mes NULL = fator anual.
CREATE TABLE fator_emissao (
    id      INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ano     SMALLINT NOT NULL,
    mes     SMALLINT,
    valor   DECIMAL(8,5) NOT NULL,
    fonte   VARCHAR(120) NOT NULL,
    CONSTRAINT chk_mes CHECK (mes IS NULL OR mes BETWEEN 1 AND 12),
    CONSTRAINT uq_fator UNIQUE (ano, mes)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- ------------------------- 6. ACAO_ESG -----------------------------
CREATE TABLE acao_esg (
    id               CHAR(36) NOT NULL PRIMARY KEY,
    empresa_id       CHAR(36) NOT NULL,
    periodo_id       CHAR(36) NOT NULL,
    usuario_id       CHAR(36),
    indicador_id     INT      NOT NULL,
    valor            DECIMAL(14,4) NOT NULL,
    data_referencia  DATE NOT NULL,
    descricao        TEXT,
    criado_em        TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_acao_empresa   FOREIGN KEY (empresa_id)   REFERENCES empresa(id)   ON DELETE CASCADE,
    CONSTRAINT fk_acao_periodo   FOREIGN KEY (periodo_id)   REFERENCES periodo(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_acao_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario(id)   ON DELETE SET NULL,
    CONSTRAINT fk_acao_indicador FOREIGN KEY (indicador_id) REFERENCES indicador(id) ON DELETE RESTRICT,
    CONSTRAINT chk_valor CHECK (valor >= 0)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;
CREATE INDEX idx_acao_periodo ON acao_esg(periodo_id, indicador_id);
CREATE INDEX idx_acao_empresa ON acao_esg(empresa_id, data_referencia DESC);

-- ------------------------- 7. META_ESG -----------------------------
-- status NAO e coluna: e calculado em tempo de execucao (vw_meta_status).
CREATE TABLE meta_esg (
    id            CHAR(36) NOT NULL PRIMARY KEY,
    empresa_id    CHAR(36) NOT NULL,
    periodo_id    CHAR(36) NOT NULL,
    indicador_id  INT      NOT NULL,
    valor_base    DECIMAL(14,4) NOT NULL,
    valor_alvo    DECIMAL(14,4) NOT NULL,
    criado_em     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_meta_empresa   FOREIGN KEY (empresa_id)   REFERENCES empresa(id)   ON DELETE CASCADE,
    CONSTRAINT fk_meta_periodo   FOREIGN KEY (periodo_id)   REFERENCES periodo(id)   ON DELETE CASCADE,
    CONSTRAINT fk_meta_indicador FOREIGN KEY (indicador_id) REFERENCES indicador(id) ON DELETE RESTRICT,
    CONSTRAINT uq_meta UNIQUE (periodo_id, indicador_id),
    CONSTRAINT chk_alvo CHECK (valor_alvo <> valor_base)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_bin;

-- =====================================================================
-- CATALOGO DE INDICADORES (11)
-- Ids fixos: no TiDB o AUTO_INCREMENT pode pular numeros.
-- =====================================================================
INSERT INTO indicador (id, codigo, nome, pilar, unidade, direcao, agregacao, obrigatorio, calculado) VALUES
( 1,'ENE-01','Consumo de energia elétrica',           'E','kWh',  'reduzir',  'media', TRUE,  FALSE),
( 2,'AGU-01','Consumo de água',                       'E','m³',   'reduzir',  'media', TRUE,  FALSE),
( 3,'RES-01','Resíduos gerados',                      'E','kg',   'reduzir',  'media', TRUE,  FALSE),
( 4,'RES-02','Resíduos destinados à reciclagem',      'E','%',    'aumentar', 'media', FALSE, FALSE),
( 5,'EMI-01','Emissões escopo 2 (energia)',           'E','tCO₂e','reduzir',  'soma',  FALSE, TRUE),
( 6,'SOC-01','Horas de treinamento por funcionário',  'S','h',    'aumentar', 'soma',  TRUE,  FALSE),
( 7,'SOC-02','Mulheres em cargos de liderança',       'S','%',    'aumentar', 'media', TRUE,  FALSE),
( 8,'SOC-03','Rotatividade (turnover)',               'S','%',    'reduzir',  'media', FALSE, FALSE),
( 9,'SOC-04','Ações comunitárias realizadas',         'S','un',   'aumentar', 'soma',  FALSE, FALSE),
(10,'GOV-01','Políticas internas publicadas',         'G','un',   'aumentar', 'soma',  TRUE,  FALSE),
(11,'GOV-02','Fornecedores com código de conduta',    'G','%',    'aumentar', 'media', TRUE,  FALSE);

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
-- VIEW: emissoes de escopo 2 por lancamento de energia
-- tCO2e = kWh / 1000 x fator (tCO2/MWh)
--
-- Fator vigente na data do lancamento (subconsulta abaixo):
--   o fator mais recente que comeca ate a data. Um fator mensal vale a
--   partir do dia 1 do mes; o anual conta como dezembro do seu ano, entao
--   no mesmo ano o mensal tem preferencia. Se nenhum fator comecar ate a
--   data, usa o mais recente disponivel.
-- A mesma regra esta em IndicadoresService.previaEmissao (backend).
-- =====================================================================
CREATE OR REPLACE VIEW vw_emissoes AS
SELECT a.empresa_id, a.periodo_id, a.id AS acao_id, a.data_referencia,
       a.valor AS kwh,
       ROUND(a.valor / 1000 * (
           SELECT f.valor FROM fator_emissao f
           ORDER BY
             (f.ano * 100 + COALESCE(f.mes, 12)
                <= YEAR(a.data_referencia) * 100 + MONTH(a.data_referencia)) DESC,
             f.ano DESC, COALESCE(f.mes, 0) DESC
           LIMIT 1
       ), 4) AS tco2e
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
-- Os COALESCE(..., 0) dentro do GREATEST repetem o comportamento do
-- PostgreSQL, onde GREATEST ignora NULL (no MySQL, NULL anula o resultado).
-- =====================================================================
CREATE OR REPLACE VIEW vw_meta_status AS
SELECT prog.*,
  CASE WHEN progresso - ritmo_esperado >= -0.10 THEN 'no_prazo'
       WHEN progresso - ritmo_esperado >= -0.25 THEN 'atencao'
       ELSE 'em_risco' END AS status
FROM (
  SELECT base.*,
         LEAST(GREATEST(COALESCE(
           (valor_atual - valor_base) / NULLIF(valor_alvo - valor_base, 0), 0), 0), 1) AS progresso
  FROM (
    SELECT m.id AS meta_id, m.empresa_id, m.periodo_id, m.indicador_id,
           i.codigo, i.nome AS indicador, i.pilar, i.unidade, i.direcao,
           m.valor_base, m.valor_alvo,
           COALESCE(v.valor, m.valor_base) AS valor_atual,
           COALESCE(v.lancamentos, 0) AS lancamentos,
           LEAST(GREATEST(COALESCE(
             DATEDIFF(CURRENT_DATE, p.data_inicio)
               / NULLIF(DATEDIFF(p.data_fim, p.data_inicio), 0), 0), 0), 1) AS ritmo_esperado
    FROM meta_esg m
    JOIN periodo p   ON p.id = m.periodo_id
    JOIN indicador i ON i.id = m.indicador_id
    LEFT JOIN vw_indicador_periodo v
           ON v.periodo_id = m.periodo_id AND v.indicador_id = m.indicador_id
  ) AS base
) AS prog;

-- =====================================================================
-- VIEW: score por pilar em cada periodo (0 a 100)
--   score = 100 x (0,7 x media do progresso das metas + 0,3 x cobertura)
--   cobertura = indicadores obrigatorios com lancamento / total obrigatorios
-- O termo de cobertura impede o score de ser inflado por uma meta facil.
-- Score geral (calculado no backend): 0,40 x E + 0,30 x S + 0,30 x G
-- =====================================================================
CREATE OR REPLACE VIEW vw_score_pilar AS
SELECT pl.empresa_id, pl.periodo_id, pl.pilar,
       ROUND(100 * (0.7 * COALESCE(m.media_progresso, 0)
                  + 0.3 * COALESCE(c.cobertura, 0)), 0) AS score,
       ROUND(COALESCE(c.cobertura, 0), 2) AS cobertura,
       COALESCE(m.metas, 0) AS metas
FROM (
  -- uma linha por periodo e pilar (E, S e G)
  SELECT p.id AS periodo_id, p.empresa_id, x.pilar
  FROM periodo p
  CROSS JOIN (SELECT 'E' AS pilar UNION ALL SELECT 'S' UNION ALL SELECT 'G') AS x
) AS pl
LEFT JOIN (
  SELECT p.id AS periodo_id, i.pilar,
         COUNT(DISTINCT a.indicador_id) / NULLIF(COUNT(DISTINCT i.id), 0) AS cobertura
  FROM periodo p
  JOIN indicador i ON i.obrigatorio
  LEFT JOIN acao_esg a ON a.periodo_id = p.id AND a.indicador_id = i.id
  GROUP BY p.id, i.pilar
) AS c ON c.periodo_id = pl.periodo_id AND c.pilar = pl.pilar
LEFT JOIN (
  -- SUM / COUNT em vez de AVG por compatibilidade com o TiDB: ele falha no AVG
  -- de um numero com 30 casas decimais (o progresso). A conta e a mesma.
  SELECT periodo_id, pilar, SUM(progresso) / COUNT(progresso) AS media_progresso, COUNT(*) AS metas
  FROM vw_meta_status GROUP BY periodo_id, pilar
) AS m ON m.periodo_id = pl.periodo_id AND m.pilar = pl.pilar;
