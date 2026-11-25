import { Link } from 'react-router-dom';

// Página pública de apresentação, mostrada em "/" para quem não está logado.
export default function Landing() {
  return (
    <main>
      <h1>A sua pequena empresa já faz ESG. O Syncro mostra quanto.</h1>
      <Link to="/login">Entrar</Link>
    </main>
  );
}
