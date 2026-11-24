import { useEffect, useState, type FormEvent } from 'react';
import { api, comPeriodo } from '../api';
import Barra from '../components/Barra';
import SeletorPeriodo from '../components/SeletorPeriodo';
import SeloStatus from '../components/SeloStatus';
import { agruparPorPilar, formatarNumero, formatarPercentual, mediaMensal, periodoAtualId, PILARES } from '../formatos';
import type { Indicador, Meta, Periodo } from '../tipos';

const FORMULARIO_VAZIO = { indicadorId: '', valorBase: '', valorAlvo: '' };

export default function Metas() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [metas, setMetas] = useState<Meta[]>([]);
  const [versao, setVersao] = useState(0); // muda para forçar o recarregamento da lista
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null); // meta sendo editada (null = criando)
  const [erro, setErro] = useState('');

  const indicador = indicadores.find((i) => String(i.id) === formulario.indicadorId);
  const nomePeriodo = periodos.find((p) => p.id === periodoId)?.nome ?? '';

  useEffect(() => {
    api<Indicador[]>('/indicadores').then(setIndicadores).catch((e) => setErro(e.message));
    api<Periodo[]>('/periodos')
      .then((lista) => {
        setPeriodos(lista);
        setPeriodoId(periodoAtualId(lista));
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!periodoId) return;
    api<Meta[]>(comPeriodo('/metas', periodoId))
      .then(setMetas)
      .catch((e) => setErro(e.message));
  }, [periodoId, versao]);

  function alterar(campo: keyof typeof FORMULARIO_VAZIO, valor: string) {
    setFormulario({ ...formulario, [campo]: valor });
  }

  function limparFormulario() {
    setFormulario(FORMULARIO_VAZIO);
    setEditandoId(null);
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    const valores = { valorBase: Number(formulario.valorBase), valorAlvo: Number(formulario.valorAlvo) };
    try {
      if (editandoId) {
        // Na edição só a base e o alvo mudam; indicador e trimestre continuam os mesmos.
        await api(`/metas/${editandoId}`, { metodo: 'PUT', corpo: valores });
      } else {
        await api('/metas', {
          metodo: 'POST',
          corpo: { indicadorId: Number(formulario.indicadorId), ...valores, periodoId },
        });
      }
      limparFormulario();
      setVersao((v) => v + 1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  // Preenche o formulário de cima com a meta escolhida, como na tela de ações.
  function editar(meta: Meta) {
    setEditandoId(meta.id);
    setFormulario({
      indicadorId: String(meta.indicador_id),
      valorBase: String(meta.valor_base),
      valorAlvo: String(meta.valor_alvo),
    });
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluir(meta: Meta) {
    if (!window.confirm(`Excluir a meta de ${meta.indicador}?`)) return;
    try {
      await api(`/metas/${meta.id}`, { metodo: 'DELETE' });
      if (editandoId === meta.id) limparFormulario();
      setVersao((v) => v + 1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Metas</h1>
          {/* Frase de apoio: para que serve a tela e qual é a ação principal. */}
          <p className="descricao-pagina nao-imprimir">
            Defina aonde a empresa quer chegar em cada indicador no trimestre. O sistema compara o progresso com o tempo que já passou.
          </p>
        </div>
        <SeletorPeriodo periodos={periodos} valor={periodoId} aoMudar={setPeriodoId} />
      </header>

      <form className="cartao formulario" onSubmit={salvar}>
        <h2>{editandoId ? `Editar meta do ${nomePeriodo}` : `Nova meta para o ${nomePeriodo}`}</h2>
        <label>
          Indicador
          <select
            value={formulario.indicadorId} onChange={(e) => alterar('indicadorId', e.target.value)}
            disabled={editandoId !== null} // o indicador não muda na edição
            required
          >
            <option value="">Selecione um indicador</option>
            {agruparPorPilar(indicadores).map((grupo) => (
              <optgroup key={grupo.pilar} label={PILARES[grupo.pilar].nome}>
                {grupo.itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.codigo} · {i.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {indicador && (
          <p className="info-indicador">
            {indicador.direcao === 'reduzir'
              ? `↓ Este indicador deve diminuir: o alvo precisa ser menor que a base (${indicador.unidade}).`
              : `↑ Este indicador deve aumentar: o alvo precisa ser maior que a base (${indicador.unidade}).`}
          </p>
        )}

        <div className="linha-campos">
          <label>
            Valor base
            <input
              type="number"
              max={indicador?.unidade === '%' ? 100 : undefined} // percentuais vão até 100
              step="any"
              value={formulario.valorBase}
              onChange={(e) => alterar('valorBase', e.target.value)}
              required
            />
          </label>
          <label>
            Valor alvo
            <input
              type="number"
              max={indicador?.unidade === '%' ? 100 : undefined} // percentuais vão até 100
              step="any"
              value={formulario.valorAlvo}
              onChange={(e) => alterar('valorAlvo', e.target.value)}
              required
            />
          </label>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
        <div className="botoes">
          <button type="submit" className="botao">
            {editandoId ? 'Salvar alterações' : 'Criar meta'}
          </button>
          {editandoId && (
            <button type="button" className="botao botao-secundario" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <section className="cartao">
        <h2>Metas do trimestre</h2>
        {metas.length === 0 ? (
          <p className="texto-suave">Nenhuma meta cadastrada neste trimestre.</p>
        ) : (
          <div className="tabela-rolavel">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th className="numero">Base → Alvo</th>
                  <th className="numero">Atual</th>
                  <th>Progresso</th>
                  <th className="numero">Tempo decorrido</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {metas.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="ponto-pilar" style={{ background: PILARES[m.pilar].cor }} />
                      {m.indicador}
                    </td>
                    <td className="numero">
                      {formatarNumero(m.valor_base)} → {formatarNumero(m.valor_alvo)} {m.unidade}
                      {mediaMensal(m.codigo)}
                    </td>
                    <td className="numero">
                      {m.lancamentos > 0
                        ? `${formatarNumero(m.valor_atual)} ${m.unidade}${mediaMensal(m.codigo)}`
                        : 'sem lançamentos'}
                    </td>
                    <td className="celula-progresso">
                      <Barra fracao={m.progresso} cor={PILARES[m.pilar].cor} />
                      <span>{formatarPercentual(m.progresso)}</span>
                    </td>
                    <td className="numero">{formatarPercentual(m.ritmo_esperado)}</td>
                    <td>
                      <SeloStatus status={m.status} />
                    </td>
                    <td className="acoes-linha">
                      <button type="button" className="botao-link" onClick={() => editar(m)}>
                        Editar
                      </button>
                      <button type="button" className="botao-link perigo" onClick={() => excluir(m)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
