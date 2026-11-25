import { useEffect } from 'react';
import { Link } from 'react-router-dom';
// Fontes self-hosted (sem Google Fonts), só neste chunk. O Fontsource já usa font-display: swap.
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '../landing.css';

const TITULO = 'Syncro ESG — metas ESG para pequenas empresas';
const DEMO = '/login?demo=1';

// Página pública de apresentação, mostrada em "/" para quem não está logado.
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
        {/* seções */}
      </main>
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
          <Link to="/login" className="l-link-entrar">
            Entrar
          </Link>
          <Link to={DEMO} className="l-botao">
            Testar a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
