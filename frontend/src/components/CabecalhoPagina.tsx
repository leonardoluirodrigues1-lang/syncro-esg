import type { ReactNode } from 'react';
import Folhas from './Folhas';

// Cabeçalho das telas internas: título + frase de apoio à esquerda, folha e (se houver) seletor/botões à direita.
export default function CabecalhoPagina({
  titulo,
  descricao,
  classe = '',
  children,
}: {
  titulo: string;
  descricao: ReactNode;
  classe?: string;
  children?: ReactNode;
}) {
  return (
    <header className={`cabecalho-pagina ${classe}`.trim()}>
      <div>
        <h1>{titulo}</h1>
        {/* Frase de apoio: para que serve a tela e qual é a ação principal. */}
        <p className="descricao-pagina nao-imprimir">{descricao}</p>
      </div>
      <Folhas lugar="conteudo" />
      {children}
    </header>
  );
}
