// Enfeite: um galho com 7 folhas, desenhado aqui mesmo em SVG (sem imagem externa).
// É só decoração: aria-hidden esconde do leitor de tela e o CSS (.folhas) tira o clique,
// esconde no PDF e nas telas com menos de 480px.
// "lugar" escolhe a posição: acesso (login/cadastro), menu (rodapé do menu) ou conteudo (canto do título).
// "tom": verde (fundo claro, padrão) ou claro (para fundo verde escuro).
const TONS = {
  verde: { galho: '#2d5a27', cores: ['#2d5a27', '#3a9b4c', '#4a7d3f', '#6fae6b', '#8cc49a'] },
  claro: { galho: '#cfe6d3', cores: ['#ffffff', '#cfe6d3', '#a9d3b0', '#e7f3e9', '#ffffff'] },
};

// [x, y, giro, escala, índice da cor]
const FOLHAS = [
  [34, 68, -72, 1.1, 0],
  [56, 64, 22, 1, 1],
  [88, 55, -68, 1.25, 2],
  [112, 47, 18, 1.05, 1],
  [142, 35, -62, 1, 0],
  [162, 27, 14, 0.9, 3],
  [180, 19, -40, 0.7, 4],
];

export default function Folhas({
  lugar,
  tom = 'verde',
}: {
  lugar: 'acesso' | 'menu' | 'conteudo' | 'topo' | 'nota' | 'cta'; // as três últimas são da landing
  tom?: 'verde' | 'claro';
}) {
  const { galho, cores } = TONS[tom];
  return (
    <svg className={`folhas folhas-${lugar}`} viewBox="0 0 200 80" aria-hidden="true" focusable="false">
      <path d="M8 74 Q90 60 194 12" fill="none" strokeWidth="2" strokeLinecap="round" stroke={galho} />
      {FOLHAS.map(([x, y, giro, escala, cor]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
          <path d="M0 0 C5 -9 19 -11 30 -4 C21 4 8 5 0 0 Z" fill={cores[cor]} />
          <path d="M1.5 -0.3 L26 -4" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
