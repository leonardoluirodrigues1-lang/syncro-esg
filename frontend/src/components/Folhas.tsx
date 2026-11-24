// Enfeite: um raminho com 3 folhas, desenhado aqui mesmo em SVG (sem imagem externa).
// É só decoração: aria-hidden esconde do leitor de tela e o CSS (.folhas) deixa
// transparente, sem clique, fora do PDF e fora das telas com menos de 480px.
// "lugar" escolhe a posição: acesso (login/cadastro), menu (rodapé do menu) ou conteudo (canto do título).
export default function Folhas({ lugar }: { lugar: 'acesso' | 'menu' | 'conteudo' }) {
  // Uma folha: duas curvas que se encontram na ponta, com a nervura no meio.
  const folha = (x: number, y: number, giro: number, cor: string) => (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <path d="M0 0 C5 -8 18 -10 28 -4 C20 3 8 5 0 0 Z" fill={cor} />
      <path d="M1 0 L25 -4" stroke="#ffffff" strokeWidth="0.8" />
    </g>
  );

  return (
    <svg className={`folhas folhas-${lugar}`} viewBox="0 0 120 44" aria-hidden="true" focusable="false">
      {/* Galho */}
      <path d="M8 40 Q60 30 114 10" fill="none" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
      {folha(30, 35, -110, '#2d5a27')}
      {folha(62, 29, -60, '#4a7d3f')}
      {folha(92, 20, 20, '#2d5a27')}
    </svg>
  );
}
