import type { Periodo } from '../tipos';

interface Props {
  periodos: Periodo[];
  valor: string;
  aoMudar: (periodoId: string) => void;
}

export default function SeletorPeriodo({ periodos, valor, aoMudar }: Props) {
  return (
    <label className="seletor-periodo">
      Trimestre
      <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {periodos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
