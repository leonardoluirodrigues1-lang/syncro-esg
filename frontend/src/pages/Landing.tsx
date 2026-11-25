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

// Página pública de apresentação, mostrada em "/" para quem não está logado.
export default function Landing() {
  return (
    <main className="landing">
      <h1>A sua pequena empresa já faz ESG. O Syncro mostra quanto.</h1>
      <Link to="/login">Entrar</Link>
    </main>
  );
}
