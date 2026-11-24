import { useEffect, useState } from 'react';
import { api, comPeriodo } from '../api';
import Ajuda from '../components/Ajuda';
import SeletorPeriodo from '../components/SeletorPeriodo';
import SeloStatus from '../components/SeloStatus';
import { formatarCnpj, formatarNumero, formatarPercentual, mediaMensal, PILARES } from '../formatos';
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

// Sem valor no trimestre, a célula diz isso por extenso.
function valorOuSemDado(valor: number | null, unidade: string, codigo: string) {
  return valor === null ? 'sem dado' : `${formatarNumero(valor, 4)} ${unidade}${mediaMensal(codigo)}`;
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
        <div>
          <h1>Relatório</h1>
          {/* Frase de apoio: para que serve a tela e qual é a ação principal. */}
          <p className="descricao-pagina nao-imprimir">
            Resumo do trimestre pronto para apresentar ou enviar. Confira os números e clique em Baixar PDF para salvar.
          </p>
        </div>
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
        <Ajuda pergunta="Como ler a variação?">
          <p>
            A variação mostra quanto o indicador mudou em relação ao trimestre anterior. Verde é melhora e vermelho é
            piora. Nos indicadores que devem diminuir (como o consumo de energia), cair é bom. "sem dado" quer dizer
            que faltou lançamento em um dos dois trimestres.
          </p>
          <p>
            As referências abaixo de cada indicador vêm do GRI (Global Reporting Initiative, padrão internacional de
            relatórios de sustentabilidade) e dos ODS (Objetivos de Desenvolvimento Sustentável da ONU).
          </p>
        </Ajuda>
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
                // Falta valor em um dos trimestres: a variação também mostra "sem dado".
                const semDado = linha.atual === null || linha.anterior === null;
                return (
                  <tr key={linha.codigo}>
                    <td>
                      <span className="ponto-pilar" style={{ background: PILARES[linha.pilar].cor }} />
                      {linha.nome}
                      <small className="referencia">{linha.referencia}</small>
                    </td>
                    <td className="numero">{valorOuSemDado(linha.atual, linha.unidade, linha.codigo)}</td>
                    <td className="numero">{valorOuSemDado(linha.anterior, linha.unidade, linha.codigo)}</td>
                    <td className={`numero ${v?.classe ?? ''}`}>{v?.texto ?? (semDado ? 'sem dado' : '—')}</td>
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
                      {mediaMensal(m.codigo)}
                    </td>
                    <td className="numero">
                      {formatarNumero(m.valor_atual)} {m.unidade}
                      {mediaMensal(m.codigo)}
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
          Emitido em {new Date().toLocaleDateString('pt-BR')} pelo Syncro ESG. Emissões calculadas pelo GHG Protocol –
          escopo 2 (abordagem por localização), com o fator médio do SIN (MCTI). Referências dos indicadores: GRI
          Standards e Objetivos de Desenvolvimento Sustentável (ODS/ONU).
        </p>
      </article>
    </>
  );
}
