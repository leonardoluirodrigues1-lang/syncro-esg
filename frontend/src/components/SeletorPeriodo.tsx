import type { Periodo } from '../tipos';
import Ajuda from './Ajuda';

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
        <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {/* "?" ao lado do seletor: a dica não cabe na linha do cabeçalho sem empurrar os botões. */}
      <Ajuda pergunta="O que é o trimestre?" compacta>
        <p>Período de 3 meses (1º tri = jan a mar) que agrupa lançamentos e metas.</p>
      </Ajuda>
    </div>
  );
}
