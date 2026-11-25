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

// Página pública de apresentação, mostrada em "/" para quem não está logado.
const TITULO = 'Syncro ESG — metas ESG para pequenas empresas';
const DESCRICAO =
  'Cadastre metas ambientais, sociais e de governança, lance os números do mês e veja no painel o que está em dia e o que ficou para trás.';

// Cria ou troca uma <meta> do <head> e devolve a função que desfaz a troca.
function trocarMeta(atributo: 'name' | 'property', chave: string, valor: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${atributo}="${chave}"]`);
  const criada = !tag;
  const anterior = tag?.content ?? '';
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(atributo, chave);
    document.head.appendChild(tag);
  }
  tag.content = valor;
  return () => (criada ? tag.remove() : (tag.content = anterior));
}

export default function Landing() {
  // Título e metatags só valem na landing; ao sair dela, o <head> volta ao que era.
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = TITULO;
    const desfazer = [
      trocarMeta('name', 'description', DESCRICAO),
      trocarMeta('property', 'og:title', TITULO),
      trocarMeta('property', 'og:description', DESCRICAO),
      trocarMeta('property', 'og:image', `${window.location.origin}/landing/landing-painel-og.png`),
    ];
    return () => {
      document.title = tituloAnterior;
      desfazer.forEach((f) => f());
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
