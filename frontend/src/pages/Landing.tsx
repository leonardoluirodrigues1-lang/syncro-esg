import { Link } from 'react-router-dom';
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
