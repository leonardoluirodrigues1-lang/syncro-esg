interface Props {
  fracao: number; // de 0 a 1
  cor: string;
}

export default function Barra({ fracao, cor }: Props) {
  const largura = Math.max(0, Math.min(1, fracao)) * 100;
  return (
    <div className="barra" role="progressbar" aria-valuenow={Math.round(largura)} aria-valuemin={0} aria-valuemax={100}>
      <div className="barra-preenchida" style={{ width: `${largura}%`, background: cor }} />
    </div>
  );
}
