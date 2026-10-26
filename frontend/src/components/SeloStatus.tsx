import { STATUS } from '../formatos';
import type { Status } from '../tipos';

// Selo colorido: verde "No prazo", âmbar "Atenção", vermelho "Em risco".
export default function SeloStatus({ status }: { status: Status }) {
  return <span className={`selo selo-${status}`}>{STATUS[status]}</span>;
}
