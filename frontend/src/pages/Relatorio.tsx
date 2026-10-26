import { useEffect, useState } from 'react';
import { api, comPeriodo } from '../api';
import SeletorPeriodo from '../components/SeletorPeriodo';
import SeloStatus from '../components/SeloStatus';
import { formatarCnpj, formatarNumero, formatarPercentual, PILARES } from '../formatos';
import type { DadosRelatorio, LinhaRelatorio, Periodo } from '../tipos';

// Variação do trimestre anterior para o atual e se isso foi melhora ou piora
// (para indicadores "reduzir", cair é bom).
function variacao(linha: LinhaRelatorio) {
  const { atual, anterior } = linha;
  if (atual === null || anterior === null || anterior === 0) return null;
  const melhorou = linha.direcao === 'reduzir' ? atual < anterior : atual > anterior;
  return {
    texto: ((atual - anterior) / anterior).toLocaleString('pt-BR', {
      style: 'percent',
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    }),
    classe: atual === anterior ? '' : melhorou ? 'melhorou' : 'piorou',
  };
}

function valorOuTraco(valor: number | null, unidade: string) {
  return valor === null ? '—' : `${formatarNumero(valor, 4)} ${unidade}`;
}

export default function Relatorio() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState(''); // vazio = trimestre atual
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api<Periodo[]>('/periodos').then(setPeriodos).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    api<DadosRelatorio>(comPeriodo('/relatorio', periodoId))
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, [periodoId]);

  if (erro) return <p className="mensagem-erro">{erro}</p>;
  if (!dados) return <p className="texto-suave">Carregando...</p>;

  const { empresa, scores } = dados;

  return (
    <>
      <header className="cabecalho-pagina nao-imprimir">
        <h1>Relatório</h1>
        <div className="botoes">
          <SeletorPeriodo periodos={periodos} valor={dados.periodo.id} aoMudar={setPeriodoId} />
          {/* O navegador gera o PDF pela opção "Salvar como PDF" da impressão. */}
          <button type="button" className="botao" onClick={() => window.print()}>
            Baixar PDF
          </button>
        </div>
      </header>

      <article className="cartao relatorio">
        <header className="relatorio-cabecalho">
          <div>
            <p className="marca">
              Syncro <span>ESG</span>
            </p>
            <h2>Relatório ESG · {dados.periodo.nome}</h2>
            <p>
              <strong>{empresa.nome}</strong> · CNPJ {formatarCnpj(empresa.cnpj)}
              {empresa.setor && ` · ${empresa.setor}`}
            </p>
          </div>
          <div className="relatorio-score">
            <span className="rotulo">Score geral</span>
            <strong className="score-grande">{scores.geral}</strong>
          </div>
        </header>

        <section className="relatorio-pilares">
          {[
            { ...PILARES.E, score: scores.ambiental },
            { ...PILARES.S, score: scores.social },
            { ...PILARES.G, score: scores.governanca },
          ].map((p) => (
            <div key={p.nome} style={{ borderColor: p.cor }}>
              <span className="rotulo" style={{ color: p.cor }}>
                {p.nome}
              </span>
              <strong>{p.score}</strong>
            </div>
          ))}
        </section>

        <h3>Indicadores</h3>
        <div className="tabela-rolavel">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="numero">{dados.periodo.nome}</th>
                <th className="numero">{dados.periodoAnterior?.nome ?? 'Trimestre anterior'}</th>
                <th className="numero">Variação</th>
              </tr>
            </thead>
            <tbody>
              {dados.indicadores.map((linha) => {
                const v = variacao(linha);
                return (
                  <tr key={linha.codigo}>
                    <td>
                      <span className="ponto-pilar" style={{ background: PILARES[linha.pilar].cor }} />
                      {linha.nome}
                    </td>
                    <td className="numero">{valorOuTraco(linha.atual, linha.unidade)}</td>
                    <td className="numero">{valorOuTraco(linha.anterior, linha.unidade)}</td>
                    <td className={`numero ${v?.classe ?? ''}`}>{v?.texto ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3>Metas</h3>
        {dados.metas.length === 0 ? (
          <p className="texto-suave">Nenhuma meta cadastrada neste trimestre.</p>
        ) : (
          <div className="tabela-rolavel">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th className="numero">Base → Alvo</th>
                  <th className="numero">Atual</th>
                  <th className="numero">Progresso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dados.metas.map((m) => (
                  <tr key={m.id}>
                    <td>{m.indicador}</td>
                    <td className="numero">
                      {formatarNumero(m.valor_base)} → {formatarNumero(m.valor_alvo)} {m.unidade}
                    </td>
                    <td className="numero">
                      {formatarNumero(m.valor_atual)} {m.unidade}
                    </td>
                    <td className="numero">{formatarPercentual(m.progresso)}</td>
                    <td>
                      <SeloStatus status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="texto-suave relatorio-rodape">
          Emitido em {new Date().toLocaleDateString('pt-BR')} pelo Syncro ESG. Emissões de escopo 2 calculadas com o
          fator médio do SIN (MCTI).
        </p>
      </article>
    </>
  );
}
