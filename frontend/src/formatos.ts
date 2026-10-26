import type { Indicador, Periodo, Pilar, Status } from './tipos';

export const PILARES: Record<Pilar, { nome: string; cor: string }> = {
  E: { nome: 'Ambiental', cor: '#2d5a27' },
  S: { nome: 'Social', cor: '#534ab7' },
  G: { nome: 'Governança', cor: '#5b6470' },
};

export const STATUS: Record<Status, string> = {
  no_prazo: 'No prazo',
  atencao: 'Atenção',
  em_risco: 'Em risco',
};

// 4120 -> "4.120"; 0.1191 -> "0,1191"
export function formatarNumero(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

// 0.657 -> "66%"
export function formatarPercentual(fracao: number) {
  return `${Math.round(fracao * 100)}%`;
}

// "2026-10-05" -> "05/10/2026" (sem usar Date, para não mudar o dia por causa do fuso)
export function formatarData(dataIso: string) {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Aplica a máscara 00.000.000/0000-00 conforme o usuário digita.
export function formatarCnpj(texto: string) {
  const d = texto.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// Data de hoje no formato do <input type="date"> (AAAA-MM-DD), no fuso local.
export function hojeIso() {
  return new Date().toLocaleDateString('en-CA');
}

// Id do trimestre que contém a data de hoje.
export function periodoAtualId(periodos: Periodo[]) {
  const hoje = hojeIso();
  return periodos.find((p) => p.data_inicio <= hoje && hoje <= p.data_fim)?.id ?? periodos[0]?.id ?? '';
}

// Indicadores digitáveis agrupados por pilar, para os <optgroup> dos formulários.
export function agruparPorPilar(indicadores: Indicador[]) {
  return (Object.keys(PILARES) as Pilar[]).map((pilar) => ({
    pilar,
    itens: indicadores.filter((i) => i.pilar === pilar && !i.calculado),
  }));
}
