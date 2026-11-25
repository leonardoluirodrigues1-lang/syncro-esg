import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lerToken } from '../api';
// Fontes self-hosted (sem Google Fonts), só neste chunk. O Fontsource já usa font-display: swap.
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import Folhas from '../components/Folhas';
import '../landing.css';

const TITULO = 'Syncro ESG — metas ESG para pequenas empresas';
const DEMO = '/login?demo=1';

// Logado: no lugar de Entrar / Testar a demo / Entrar na demo, um único "Ir para o painel".
function BotaoDemo({ texto, classe = 'l-botao' }: { texto: string; classe?: string }) {
  return lerToken() ? (
    <Link to="/painel" className={classe}>
      Ir para o painel
    </Link>
  ) : (
    <Link to={DEMO} className={classe}>
      {texto}
    </Link>
  );
}

// Página pública de apresentação, sempre em "/" (logado ou não).
export default function Landing() {
  // Só o <title> muda na landing; as metatags (description, og:*) ficam fixas no index.html.
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = TITULO;
    return () => {
      document.title = tituloAnterior;
    };
  }, []);

  return (
    <div className="landing">
      <a href="#principal" className="pular-conteudo">
        Pular para o conteúdo
      </a>
      <Menu />
      <main id="principal" tabIndex={-1}>
        <Topo />
        <Numeros />
        <ComoFunciona />
        <Nota />
        <Chamada />
      </main>
      <Rodape />
    </div>
  );
}

// Marca: uma folha só (mesmo desenho das folhas do enfeite).
function FolhaMarca() {
  return (
    <svg className="l-marca-folha" viewBox="-2 -14 34 20" aria-hidden="true" focusable="false">
      <g transform="rotate(-48 14 -4)">
        <path d="M0 0 C5 -9 19 -11 30 -4 C21 4 8 5 0 0 Z" fill="#3a9b4c" />
        <path d="M1.5 -0.3 L26 -4" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Menu() {
  return (
    <header className="l-menu">
      <div className="l-caixa l-menu-linha">
        <a href="#principal" className="l-marca">
          <FolhaMarca />
          Syncro ESG
        </a>
        <nav className="l-menu-links" aria-label="Seções da página">
          <a href="#como-funciona">Como funciona</a>
          <a href="#nota">Como a nota é calculada</a>
          <a href="#sobre">Sobre o projeto</a>
        </nav>
        <div className="l-menu-acoes">
          {!lerToken() && (
            <Link to="/login" className="l-link-entrar">
              Entrar
            </Link>
          )}
          <BotaoDemo texto="Testar a demo" />
        </div>
      </div>
    </header>
  );
}

function Topo() {
  return (
    <section className="l-topo" aria-labelledby="titulo-topo">
      <div className="l-caixa">
        <div className="l-topo-grade">
          <h1 id="titulo-topo">
            A sua pequena empresa já faz ESG. <em>O Syncro mostra quanto.</em>
          </h1>
          <div className="l-topo-lado">
            <Folhas lugar="topo" />
            <p>
              Cadastre metas ambientais, sociais e de governança, lance os números do mês e veja no painel o que está
              em dia e o que ficou para trás. Feito para PMEs que não têm um time de sustentabilidade.
            </p>
            <div className="l-topo-acoes">
              <BotaoDemo texto="Testar a demo" />
              <a href="#como-funciona" className="l-link-sublinhado">
                Ver como funciona
              </a>
            </div>
          </div>
        </div>
        <figure className="l-topo-figura">
          <img
            src="/landing/landing-painel.webp"
            width={1200}
            height={750}
            fetchPriority="high"
            alt="Painel do Syncro ESG: nota geral da empresa, notas de Ambiental, Social e Governança, situação das metas do trimestre, emissões de CO₂ e últimos lançamentos."
          />
          <figcaption>Tela do painel do Syncro com os dados da empresa de demonstração.</figcaption>
        </figure>
      </div>
    </section>
  );
}

// Conferidos no código: pesos em painel.service.ts, fórmula do pilar e fator em db/schema.sql,
// ODS em indicadores/referencias.ts.
const NUMEROS = [
  ['40 · 30 · 30', 'Peso de Ambiental, Social e Governança na nota geral.'],
  ['70 + 30', 'Nota de cada pilar: 70% progresso das metas, 30% cobertura dos indicadores.'],
  ['0,0462', 'tCO₂ por MWh, fator do MCTI para a rede elétrica nacional (set/2026).'],
  ['8 ODS', 'Metas ligadas aos ODS 4, 5, 6, 7, 8, 12, 13 e 16 da ONU.'],
];

function Numeros() {
  return (
    <section className="l-numeros" aria-label="O Syncro em números">
      <dl className="l-caixa l-numeros-grade">
        {NUMEROS.map(([numero, texto]) => (
          <div key={numero} className="l-numero">
            <dt>{numero}</dt>
            <dd>{texto}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Metas da empresa demo (seed-demo.mjs): 2 no prazo, 1 em atenção, 1 em risco.
// Progresso ilustrativo, coerente com a regra da view: desvio = progresso - ritmo esperado.
const RITMO_HOJE = 60;
const METAS_DEMO: [string, number, 'no_prazo' | 'atencao' | 'em_risco', string][] = [
  ['Consumo de energia elétrica', 62, 'no_prazo', 'No prazo'],
  ['Fornecedores com código de conduta', 58, 'no_prazo', 'No prazo'],
  ['Consumo de água', 42, 'atencao', 'Atenção'],
  ['Mulheres em cargos de liderança', 28, 'em_risco', 'Em risco'],
];

const PILARES_DEMO: [string, number][] = [
  ['Ambiental', 65],
  ['Social', 40],
  ['Governança', 71],
];

function TelaMetas() {
  return (
    <div className="l-tela">
      <p className="l-tela-titulo">Metas do trimestre</p>
      <ul className="l-metas">
        {METAS_DEMO.map(([nome, progresso, status, rotulo]) => (
          <li key={nome}>
            <span className="l-meta-nome">{nome}</span>
            <span className="l-barra">
              <span className={`l-barra-cheia l-cor-${status}`} style={{ width: `${progresso}%` }} />
              <span className="l-barra-hoje" style={{ left: `${RITMO_HOJE}%` }} />
            </span>
            <span className={`selo selo-${status}`}>{rotulo}</span>
          </li>
        ))}
      </ul>
      <p className="l-tela-legenda">
        <span className="l-legenda-hoje" /> onde a meta deveria estar hoje
      </p>
    </div>
  );
}

function TelaEmissoes() {
  return (
    <div className="l-tela">
      <p className="l-tela-titulo">Lançar consumo de energia</p>
      <div className="l-campos">
        <span className="l-campo">
          <span className="l-campo-rotulo">Mês</span>
          <span className="l-campo-valor">setembro de 2026</span>
        </span>
        <span className="l-campo">
          <span className="l-campo-rotulo">Consumo (kWh)</span>
          <span className="l-campo-valor l-mono">4.144</span>
        </span>
      </div>
      <div className="l-conta">
        <span className="l-campo-rotulo">Emissões do escopo 2</span>
        <span className="l-mono">
          4.144 kWh × 0,0462 tCO₂/MWh ÷ 1.000 = <strong>0,191 tCO₂e</strong>
        </span>
      </div>
    </div>
  );
}

function TelaRelatorio() {
  return (
    <div className="l-tela">
      <div className="l-relatorio-topo">
        <p className="l-tela-titulo">Relatório ESG do trimestre</p>
        <span className="l-botao l-botao-falso">Baixar PDF</span>
      </div>
      <div className="l-relatorio-geral">
        <span className="l-mono l-relatorio-nota">59</span>
        <span className="l-campo-rotulo">Nota geral</span>
      </div>
      <ul className="l-relatorio-pilares">
        {PILARES_DEMO.map(([pilar, nota]) => (
          <li key={pilar}>
            <span>{pilar}</span>
            <span className="l-barra">
              <span className="l-barra-cheia l-cor-pilar" style={{ width: `${nota}%` }} />
            </span>
            <span className="l-mono">{nota}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PASSOS = [
  {
    titulo: 'Avisa quando uma meta atrasou',
    texto:
      'Cada meta tem prazo. O Syncro compara o progresso com o tempo que já passou e marca o que está em dia, em atenção ou atrasado. Você não precisa abrir planilha nenhuma para saber.',
    resumo:
      'Exemplo de tela: quatro metas da empresa de demonstração. Consumo de energia e fornecedores com código de conduta estão no prazo, consumo de água está em atenção e mulheres em cargos de liderança está em risco.',
    tela: <TelaMetas />,
  },
  {
    titulo: 'Transforma conta de luz em emissões',
    texto:
      'Você lança o consumo em kWh. O sistema converte em toneladas de CO₂ do escopo 2 usando o fator oficial do MCTI para o Sistema Interligado Nacional.',
    resumo:
      'Exemplo de tela: 4.144 kWh em setembro de 2026, vezes 0,0462 tCO₂ por MWh, divididos por 1.000, dão 0,191 tonelada de CO₂ equivalente.',
    tela: <TelaEmissoes />,
  },
  {
    titulo: 'Gera o relatório que o cliente pede',
    texto:
      'Baixe em PDF um resumo por pilar, com metas, números e nota. Serve para o cliente, o banco ou o edital que pergunta o que a empresa faz em ESG.',
    resumo: 'Exemplo de tela: relatório com nota geral 59, Ambiental 65, Social 40 e Governança 71, e o botão Baixar PDF.',
    tela: <TelaRelatorio />,
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="l-passos" aria-labelledby="titulo-como-funciona">
      <div className="l-caixa">
        <h2 id="titulo-como-funciona">Três coisas que a planilha não faz por você.</h2>
        <ol className="l-passos-lista">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className={i % 2 ? 'l-passo l-passo-invertido' : 'l-passo'}>
              <div className="l-passo-texto">
                <span className="l-passo-numero" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{passo.titulo}</h3>
                <p>{passo.texto}</p>
                <p className="l-so-leitor">{passo.resumo}</p>
              </div>
              {/* Mini-tela estática só para ver; o resumo acima é o que o leitor de tela lê. */}
              <div className="l-moldura" aria-hidden="true">
                {passo.tela}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Mesmas fórmulas de db/schema.sql (vw_score_pilar, vw_meta_status) e painel.service.ts.
const FORMULAS = `nota do pilar = 0,7 × progresso das metas + 0,3 × cobertura
nota geral    = 0,4 × Ambiental + 0,3 × Social + 0,3 × Governança
status        = progresso comparado com o tempo já decorrido`;

function Nota() {
  return (
    <section id="nota" className="l-nota" aria-labelledby="titulo-nota">
      <div className="l-caixa l-nota-grade">
        <div className="l-nota-texto">
          <h2 id="titulo-nota">Sem caixa-preta.</h2>
          <p>
            Toda nota que aparece no painel pode ser refeita à mão. Os pesos são fixos e estão aqui embaixo, então dá
            para conferir antes de confiar.
          </p>
          <Folhas lugar="nota" />
        </div>
        <pre className="l-formulas">
          <code>{FORMULAS}</code>
        </pre>
      </div>
    </section>
  );
}

function Chamada() {
  return (
    <section className="l-cta" aria-labelledby="titulo-cta">
      <Folhas lugar="cta" tom="claro" />
      <div className="l-caixa l-cta-grade">
        <div className="l-cta-texto">
          <h2 id="titulo-cta">Veja o painel com os dados de uma empresa de demonstração.</h2>
          <p>Não precisa criar conta. A demo já vem com metas, lançamentos e relatório prontos.</p>
        </div>
        <BotaoDemo texto="Entrar na demo" classe="l-botao l-botao-claro" />
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer id="sobre" className="l-rodape">
      <div className="l-caixa l-rodape-linha">
        <p>Syncro ESG · Projeto Integrador 2 · IFSP São José do Rio Preto, 2026</p>
        <p>Leonardo Luís Rodrigues e Cauê Alberto André · Orientação: Profa. Dra. Lairce Castanhera</p>
      </div>
    </footer>
  );
}
