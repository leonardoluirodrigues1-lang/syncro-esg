import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, comPeriodo } from '../api';
import Ajuda from '../components/Ajuda';
import Barra from '../components/Barra';
import SeletorPeriodo from '../components/SeletorPeriodo';
import CabecalhoPagina from '../components/CabecalhoPagina';
import SeloStatus from '../components/SeloStatus';
import { formatarData, formatarNumero, formatarPercentual, mediaMensal, PILARES } from '../formatos';
import type { DadosPainel } from '../tipos';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Painel() {
  const [periodoId, setPeriodoId] = useState(''); // vazio = trimestre atual
  const [dados, setDados] = useState<DadosPainel | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api<DadosPainel>(comPeriodo('/painel', periodoId))
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, [periodoId]);

  if (erro) return <p className="mensagem-erro">{erro}</p>;
  if (!dados) return <p className="texto-suave">Carregando...</p>;

  const { scores } = dados;
  const pilares = [
    { ...PILARES.E, score: scores.ambiental },
    { ...PILARES.S, score: scores.social },
    { ...PILARES.G, score: scores.governanca },
  ];

  return (
    <>
      <CabecalhoPagina titulo="Painel" descricao="Resumo do desempenho ESG da empresa no trimestre: notas, metas, emissões e últimos lançamentos. Escolha o trimestre ao lado para comparar.">
        <SeletorPeriodo periodos={dados.periodos} valor={dados.periodo.id} aoMudar={setPeriodoId} />
      </CabecalhoPagina>

      <section className="grade-scores">
        <div className="cartao cartao-score-geral">
          <span className="rotulo">Score ESG geral</span>
          <strong className="score-grande">{scores.geral}</strong>
          <span className="texto-suave">de 100 · {dados.periodo.nome}</span>
          {/* <details> abre e fecha sem JavaScript e funciona com teclado. */}
          <details className="como-calculado">
            <summary>
              <span className="ajuda-icone" aria-hidden="true">
                ?
              </span>{' '}
              Como é calculado?
            </summary>
            <p>
              Cada pilar = 70% do progresso médio das metas + 30% da cobertura (indicadores obrigatórios com
              lançamento no trimestre).
            </p>
            <p>Geral = 40% Ambiental + 30% Social + 30% Governança.</p>
          </details>
        </div>
        {pilares.map((p) => (
          <div className="cartao" key={p.nome}>
            <span className="rotulo" style={{ color: p.cor }}>
              {p.nome}
            </span>
            <strong className="score-medio">{p.score}</strong>
            <Barra fracao={p.score / 100} cor={p.cor} />
          </div>
        ))}
      </section>

      <section className="grade-duas-colunas">
        <div className="cartao">
          <h2>Metas do trimestre</h2>
          <Ajuda pergunta="O que significa o status?">
            <p>
              O sistema compara o progresso da meta com o tempo que já passou no trimestre. No prazo: no máximo 10
              pontos atrás do tempo. Atenção: de 10 a 25 pontos atrás. Em risco: mais de 25 pontos atrás.
            </p>
            <p>Exemplo: com metade do trimestre passada (50%) e 30% de progresso, a meta está 20 pontos atrás: Atenção.</p>
          </Ajuda>
          {dados.metas.length === 0 && <p className="texto-suave">Nenhuma meta cadastrada neste trimestre.</p>}
          <ul className="lista-metas">
            {dados.metas.map((m) => (
              <li key={m.id}>
                <div className="linha-meta">
                  <span>{m.indicador}</span>
                  <SeloStatus status={m.status} />
                </div>
                <Barra fracao={m.progresso} cor={PILARES[m.pilar].cor} />
                <span className="texto-suave">
                  {formatarPercentual(m.progresso)} · {formatarNumero(m.valor_base)} → {formatarNumero(m.valor_alvo)}{' '}
                  {m.unidade}
                  {mediaMensal(m.codigo)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="coluna">
          <div className="cartao">
            <h2>Emissões (escopo 2)</h2>
            <Ajuda pergunta="Como as emissões são calculadas?">
              <p>
                Escopo 2 são as emissões indiretas da energia elétrica que a empresa compra. Multiplicamos os kWh
                lançados pelo fator de emissão do SIN (Sistema Interligado Nacional, a rede elétrica do país) do mês,
                publicado pelo MCTI (Ministério da Ciência, Tecnologia e Inovação).
              </p>
            </Ajuda>
            <strong className="score-medio">{formatarNumero(dados.emissoes.tco2e, 4)} tCO₂e</strong>
            <p className="texto-suave">
              Toneladas de CO₂ equivalente (tCO₂e), calculadas a partir de {formatarNumero(dados.emissoes.kwh)} kWh de energia elétrica lançados no trimestre.
            </p>
            {dados.emissoes.fatores.length > 0 && (
              <p className="referencia">
                Fator do SIN (Sistema Interligado Nacional) usado:{' '}
                {dados.emissoes.fatores
                  .map((f) => `${formatarNumero(f.valor, 4)} tCO₂/MWh (${f.mes ? `${MESES[f.mes - 1]}/` : 'anual '}${f.ano})`)
                  .join('; ')}
                . Fonte: MCTI/SIRENE.
              </p>
            )}
            <p className="referencia">Metodologia: GHG Protocol – escopo 2 (abordagem por localização).</p>
          </div>

          <div className="cartao">
            <h2>Score geral por trimestre</h2>
            <div className="grafico">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dados.historico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} width={32} />
                  <Tooltip formatter={(valor) => [valor, 'Score geral']} />
                  <Bar dataKey="geral" fill="#2d5a27" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="cartao">
        <h2>Últimos lançamentos</h2>
        {dados.ultimosLancamentos.length === 0 && <p className="texto-suave">Nenhum lançamento neste trimestre.</p>}
        <ul className="lista-simples">
          {dados.ultimosLancamentos.map((a) => (
            <li key={a.id}>
              <span>
                {formatarData(a.data_referencia)} · {a.indicador}
              </span>
              <strong>
                {formatarNumero(a.valor)} {a.unidade}
              </strong>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
