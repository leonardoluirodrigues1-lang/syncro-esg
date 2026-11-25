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
    <main className="landing">
      <h1>A sua pequena empresa já faz ESG. O Syncro mostra quanto.</h1>
      <Link to="/login">Entrar</Link>
      <Link to="/login?demo=1">Testar a demo</Link>
    </main>
  );
}
