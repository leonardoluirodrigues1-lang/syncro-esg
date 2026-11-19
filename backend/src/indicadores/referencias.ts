// Referência de cada indicador do catálogo nos padrões reconhecidos:
//   GRI = item de divulgação dos GRI Standards; ODS = Objetivo de Desenvolvimento Sustentável da ONU.
// Sem ODS equivalente claro, mostra só a referência GRI.
export const REFERENCIAS: Record<string, string> = {
  'ENE-01': 'GRI 302-1 · ODS 7', // consumo de energia dentro da organização
  'AGU-01': 'GRI 303-5 · ODS 6', // consumo de água
  'RES-01': 'GRI 306-3 · ODS 12', // resíduos gerados
  'RES-02': 'GRI 306-4 · ODS 12', // resíduos não destinados à disposição final (reciclagem)
  'EMI-01': 'GRI 305-2 · ODS 13 · GHG Protocol escopo 2', // emissões indiretas pela energia comprada
  'SOC-01': 'GRI 404-1 · ODS 4', // média de horas de treinamento por funcionário
  'SOC-02': 'GRI 405-1 · ODS 5', // diversidade nos órgãos de governança e empregados
  'SOC-03': 'GRI 401-1 · ODS 8', // novas contratações e rotatividade
  'SOC-04': 'GRI 413-1', // operações com engajamento da comunidade local
  'GOV-01': 'GRI 2-23 · ODS 16', // compromissos de política
  'GOV-02': 'GRI 414-1 · ODS 8', // fornecedores selecionados com critérios sociais
};

// Acrescenta o campo "referencia" a cada linha que tem o código do indicador.
export function comReferencia<T extends { codigo: string }>(linhas: T[]) {
  return linhas.map((linha) => ({ ...linha, referencia: REFERENCIAS[linha.codigo] ?? '—' }));
}
