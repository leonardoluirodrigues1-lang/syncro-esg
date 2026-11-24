import type { Periodo } from '../tipos';

interface Props {
  periodos: Periodo[];
  valor: string;
  aoMudar: (periodoId: string) => void;
}

export default function SeletorPeriodo({ periodos, valor, aoMudar }: Props) {
  return (
    <div className="seletor-periodo-grupo">
      <label className="seletor-periodo">
        Trimestre
        <select value={valor} onChange={(e) => aoMudar(e.target.value)} aria-describedby="dica-trimestre">
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {/* Fora do <label> porque o seletor fica em linha; o aria-describedby liga a dica ao campo. */}
      <small id="dica-trimestre" className="dica-campo nao-imprimir">
        Período de 3 meses (1º tri = jan a mar) que agrupa lançamentos e metas.
      </small>
    </div>
  );
}
