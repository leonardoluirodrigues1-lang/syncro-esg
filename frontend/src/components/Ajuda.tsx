import type { ReactNode } from 'react';

interface Props {
  pergunta: string;
  children: ReactNode;
  // compacta: mostra só o "?" (a pergunta fica para o leitor de tela) e o texto abre
  // flutuando, sem empurrar o que está ao lado. Usada junto do seletor de trimestre.
  compacta?: boolean;
}

// "?" que abre e fecha uma explicação curta, no mesmo estilo do "Como é calculado?" do painel.
// <details>/<summary> já funciona com teclado (Tab + Enter/Espaço) e com leitor de tela, sem JavaScript.
// A classe nao-imprimir tira a explicação do PDF do relatório.
export default function Ajuda({ pergunta, children, compacta = false }: Props) {
  return (
    <details className={`como-calculado ajuda nao-imprimir ${compacta ? 'ajuda-compacta' : ''}`}>
      <summary>
        <span className="ajuda-icone" aria-hidden="true">
          ?
        </span>{' '}
        <span className={compacta ? 'so-leitor-de-tela' : ''}>{pergunta}</span>
      </summary>
      <div className="ajuda-texto">{children}</div>
    </details>
  );
}
