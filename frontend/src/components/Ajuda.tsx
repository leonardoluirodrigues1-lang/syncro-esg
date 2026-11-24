import type { ReactNode } from 'react';

// "?" que abre e fecha uma explicação curta, no mesmo estilo do "Como é calculado?" do painel.
// <details>/<summary> já funciona com teclado (Tab + Enter/Espaço) e com leitor de tela, sem JavaScript.
// A classe nao-imprimir tira a explicação do PDF do relatório.
export default function Ajuda({ pergunta, children }: { pergunta: string; children: ReactNode }) {
  return (
    <details className="como-calculado ajuda nao-imprimir">
      <summary>
        <span className="ajuda-icone" aria-hidden="true">
          ?
        </span>{' '}
        {pergunta}
      </summary>
      {children}
    </details>
  );
}
