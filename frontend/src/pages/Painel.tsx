import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, comPeriodo } from '../api';
import Barra from '../components/Barra';
import SeletorPeriodo from '../components/SeletorPeriodo';
import SeloStatus from '../components/SeloStatus';
import { formatarData, formatarNumero, formatarPercentual, PILARES } from '../formatos';
import type { DadosPainel } from '../tipos';

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
      <header className="cabecalho-pagina">
        <h1>Painel</h1>
        <SeletorPeriodo periodos={dados.periodos} valor={dados.periodo.id} aoMudar={setPeriodoId} />
      </header>

      <section className="grade-scores">
        <div className="cartao cartao-score-geral">
          <span className="rotulo">Score ESG geral</span>
          <strong className="score-grande">{scores.geral}</strong>
          <span className="texto-suave">de 100 · {dados.periodo.nome}</span>
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
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="coluna">
          <div className="cartao">
            <h2>Emissões (escopo 2)</h2>
            <strong className="score-medio">{formatarNumero(dados.emissoes.tco2e, 4)} tCO₂e</strong>
            <p className="texto-suave">
              Calculadas a partir de {formatarNumero(dados.emissoes.kwh)} kWh de energia elétrica lançados no trimestre.
            </p>
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
