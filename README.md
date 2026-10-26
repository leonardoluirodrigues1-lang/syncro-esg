# Syncro ESG

Plataforma web de gestão ESG (Ambiental, Social e Governança) para pequenas e médias empresas.
Projeto Integrador — IFSP.

A empresa registra ações do dia a dia (consumo de energia, água, resíduos, treinamentos,
políticas...), define metas por trimestre e acompanha:

- **Score ESG** de 0 a 100 por pilar e geral (`0,40·E + 0,30·S + 0,30·G`);
- **Status das metas** (No prazo / Atenção / Em risco), comparando o progresso com o tempo já decorrido do trimestre;
- **Emissões de escopo 2** (tCO₂e), calculadas a partir do consumo de energia e do fator médio do SIN (MCTI);
- **Relatório** do trimestre, comparado com o anterior, que pode ser salvo em PDF.

Os cálculos (score, status das metas, valor de cada indicador e emissões) são feitos por
**views do PostgreSQL** em `backend/db/schema.sql`. O backend só consulta essas views.

## Tecnologias

| Parte    | Tecnologias |
|----------|-------------|
| Backend  | NestJS + TypeScript, `pg` (SQL direto, sem ORM), JWT (`@nestjs/jwt`), `bcryptjs`, `class-validator` |
| Frontend | React + Vite + TypeScript, `react-router-dom`, `recharts`, CSS próprio |
| Banco    | PostgreSQL (Neon em produção) |
| Deploy   | Vercel (dois projetos: backend e frontend) |

## Estrutura

```
syncro-esg/
  backend/
    db/schema.sql           tabelas, catálogo de indicadores, fatores de emissão e views
    scripts/setup-db.mjs    aplica o schema (--reset apaga tudo e recria)
    scripts/seed-demo.mjs   cria a empresa de demonstração
    src/
      main.ts               inicia a API (CORS e validação)
      banco/                pool de conexões com o PostgreSQL
      auth/                 cadastro, login, perfil e o guard que exige o token
      periodos/             trimestres da empresa
      indicadores/          catálogo e prévia de emissões
      acoes/                lançamentos (CRUD)
      metas/                metas por trimestre
      painel/               painel e relatório (só leitura)
  frontend/
    src/
      api.ts                chamadas ao backend e token no localStorage
      formatos.ts           números e datas no formato brasileiro, cores dos pilares
      components/           menu lateral, seletor de trimestre, barra, selo de status
      pages/                Login, Cadastro, Painel, Acoes, Metas, Relatorio
      estilos.css           todo o visual, incluindo celular e impressão
    vercel.json             manda todas as rotas para o index.html
```

## Rodar localmente

Pré-requisitos: **Node.js 22 ou mais novo** e um **PostgreSQL 14+** (local ou um banco no Neon).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edite DATABASE_URL e JWT_SECRET
npm run db:setup          # cria tabelas e views (só na primeira vez)
npm run db:seed           # cria a Padaria Estrela (demonstração)
npm run start:dev         # API em http://localhost:3000
```

Para apagar tudo e recriar o banco: `npm run db:reset` e depois `npm run db:seed`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # site em http://localhost:5173
```

### Conta de demonstração

- E-mail: **demo@syncro.com**
- Senha: **demo1234**

A demo tem os dois trimestres anteriores e o atual (calculados a partir da data de hoje),
com lançamentos que melhoram a cada trimestre e metas em todos eles. Rodar `npm run db:seed`
de novo apaga a demo e recria.

O seed lê quanto do trimestre atual já passou (o mesmo `ritmo_esperado` da view
`vw_meta_status`) e calcula os valores a partir disso. Assim, em qualquer data o painel mostra
**2 metas "No prazo", 1 "Atenção" e 1 "Em risco"**, e o score geral sobe nos três trimestres.
No final, o seed imprime os status e scores lidos das views, para conferência.

Dois cuidados:

- **Rode o seed perto da apresentação** (no dia ou na véspera). Os status são calculados com a
  data do dia em que o seed rodou; com o passar dos dias o ritmo esperado aumenta e,
  depois de cerca de 10 dias, a meta "Atenção" passa a "Em risco".
- **Nos primeiros ~23 dias de um trimestre não dá para ter "Em risco"**: esse status exige estar
  mais de 25 pontos atrás do ritmo, e o progresso nunca é menor que 0%. Antes disso, a demo
  mostra "Atenção" no lugar (e, nos primeiros ~9 dias, todas as metas ficam "No prazo").
  O score continua subindo nos três trimestres em qualquer data.

## Variáveis de ambiente

**backend**

| Variável       | Exemplo | Para quê |
|----------------|---------|----------|
| `DATABASE_URL` | `postgres://usuario:senha@host/banco?sslmode=require` | conexão com o PostgreSQL |
| `JWT_SECRET`   | um texto longo e aleatório | assinar os tokens de login |
| `FRONTEND_URL` | `https://syncro-esg.vercel.app` | endereço do site liberado no CORS |

**frontend**

| Variável       | Exemplo | Para quê |
|----------------|---------|----------|
| `VITE_API_URL` | `https://syncro-esg-api.vercel.app` | endereço da API |

## Rotas da API

Todas exigem `Authorization: Bearer <token>`, exceto `GET /`, `POST /auth/cadastro` e `POST /auth/login`.
Sem `periodoId`, vale o trimestre atual (fuso de São Paulo).

| Método | Rota | O que faz |
|--------|------|-----------|
| GET    | `/` | `{ status: 'ok' }` |
| POST   | `/auth/cadastro` | cria empresa + responsável ESG; devolve token e perfil |
| POST   | `/auth/login` | devolve token e perfil |
| GET    | `/auth/perfil` | usuário logado e empresa |
| GET    | `/periodos` | trimestres da empresa |
| GET    | `/indicadores` | catálogo de indicadores |
| GET    | `/indicadores/previa-emissao?kwh=&data=` | tCO₂e para um consumo de energia |
| GET    | `/acoes?periodoId=` | lançamentos do trimestre |
| POST / PUT / DELETE | `/acoes`, `/acoes/:id` | cria, edita e exclui lançamentos (o trimestre vem da data) |
| GET    | `/metas?periodoId=` | metas com progresso e status |
| POST / DELETE | `/metas`, `/metas/:id` | cria e exclui metas |
| GET    | `/painel?periodoId=` | tudo do painel em uma chamada |
| GET    | `/relatorio?periodoId=` | dados do relatório (atual × anterior) |

## Deploy (Neon + GitHub + Vercel)

O backend usa **NestJS 11**, a versão suportada pela Vercel sem configuração
(o arquivo de entrada é `backend/src/main.ts`).

### a) Banco no Neon

1. Crie uma conta em [neon.tech](https://neon.tech) e um **projeto** (plano gratuito;
   escolha a região mais próxima, ex.: São Paulo, se houver).
2. No painel do projeto, clique em **Connect** e copie a **connection string**.
   Ela tem o formato `postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require`.
3. No seu computador, abra `backend/.env` e coloque essa string em `DATABASE_URL`.
4. Dentro de `backend/`, rode:
   ```bash
   npm run db:setup   # cria tabelas, catálogo e views
   npm run db:seed    # cria a Padaria Estrela (demo)
   ```

### b) Código no GitHub

1. No GitHub, crie um **repositório vazio** (sem README, sem .gitignore, sem licença).
2. Na pasta `syncro-esg/` (o repositório git já tem o commit inicial), rode:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/syncro-esg.git
   git push -u origin main
   ```
   Os arquivos `.env` e as pastas `node_modules` não são enviados (estão no `.gitignore`).

### c) Dois projetos na Vercel, do mesmo repositório

1. Em [vercel.com](https://vercel.com): **Add New → Project** e importe o repositório `syncro-esg`.
   - **Root Directory:** `backend` (a Vercel detecta o NestJS).
   - Cadastre as variáveis do backend (passo d) e clique em **Deploy**.
   - Abra o endereço gerado: ele deve responder `{"status":"ok"}`.
2. **Add New → Project** de novo, importando o **mesmo** repositório.
   - **Root Directory:** `frontend` (a Vercel detecta o Vite).
   - Cadastre `VITE_API_URL` (passo d) e clique em **Deploy**.

### d) Variáveis de ambiente

Em cada projeto da Vercel: **Settings → Environment Variables**.

| Projeto  | Variável       | Valor |
|----------|----------------|-------|
| backend  | `DATABASE_URL` | a connection string do Neon |
| backend  | `JWT_SECRET`   | um texto longo e aleatório (ex.: gerado com `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`) |
| backend  | `FRONTEND_URL` | o endereço do frontend publicado, ex.: `https://syncro-esg.vercel.app` (sem `/` no final) |
| frontend | `VITE_API_URL` | o endereço do backend publicado, ex.: `https://syncro-esg-api.vercel.app` (sem `/` no final) |

Ordem certa:

1. Publique o **backend** com `DATABASE_URL` e `JWT_SECRET` (o `FRONTEND_URL` ainda não existe).
2. Publique o **frontend** com `VITE_API_URL` apontando para o backend.
3. Copie o endereço do frontend, cadastre `FRONTEND_URL` no backend e faça um **Redeploy do backend**
   (Deployments → ⋯ → Redeploy). Sem isso, o navegador bloqueia as chamadas por CORS.

> `VITE_API_URL` é lida na hora do build: se mudar essa variável, faça um *Redeploy* do frontend.

## Fora do escopo do MVP

Convite de usuários, planos e pagamento, upload de evidências, link público do relatório,
alertas por e-mail e importação de planilha ou PDF.
