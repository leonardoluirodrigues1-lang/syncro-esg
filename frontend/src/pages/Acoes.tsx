import { useEffect, useState, type FormEvent } from 'react';
import { api, comPeriodo } from '../api';
import SeletorPeriodo from '../components/SeletorPeriodo';
import { agruparPorPilar, formatarData, formatarNumero, hojeIso, periodoAtualId, PILARES } from '../formatos';
import type { Acao, Indicador, Periodo } from '../tipos';

const FORMULARIO_VAZIO = { indicadorId: '', valor: '', data: hojeIso(), descricao: '' };

export default function Acoes() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [versao, setVersao] = useState(0); // muda para forçar o recarregamento da tabela
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [previa, setPrevia] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const indicador = indicadores.find((i) => String(i.id) === formulario.indicadorId);

  useEffect(() => {
    api<Indicador[]>('/indicadores').then(setIndicadores).catch((e) => setErro(e.message));
    carregarPeriodos();
  }, []);

  useEffect(() => {
    if (!periodoId) return;
    api<Acao[]>(comPeriodo('/acoes', periodoId))
      .then(setAcoes)
      .catch((e) => setErro(e.message));
  }, [periodoId, versao]);

  // Prévia de emissões: só para energia elétrica, quando há valor e data.
  useEffect(() => {
    setPrevia(null);
    if (indicador?.codigo !== 'ENE-01' || !formulario.valor || !formulario.data) return;
    let atual = true; // ignora respostas antigas se o usuário continuar digitando
    api<{ tco2e: number }>(`/indicadores/previa-emissao?kwh=${formulario.valor}&data=${formulario.data}`)
      .then((r) => atual && setPrevia(r.tco2e))
      .catch(() => atual && setPrevia(null));
    return () => {
      atual = false;
    };
  }, [indicador?.codigo, formulario.valor, formulario.data]);

  function carregarPeriodos() {
    return api<Periodo[]>('/periodos')
      .then((lista) => {
        setPeriodos(lista);
        setPeriodoId((escolhido) => escolhido || periodoAtualId(lista));
      })
      .catch((e) => setErro(e.message));
  }

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
    setAviso('');
    const corpo = {
      indicadorId: Number(formulario.indicadorId),
      valor: Number(formulario.valor),
      dataReferencia: formulario.data,
      descricao: formulario.descricao || undefined,
    };
    try {
      const resposta = editandoId
        ? await api<{ periodo_id: string }>(`/acoes/${editandoId}`, { metodo: 'PUT', corpo })
        : await api<{ periodo_id: string }>('/acoes', { metodo: 'POST', corpo });
      setAviso(editandoId ? 'Lançamento atualizado.' : 'Lançamento registrado.');
      limparFormulario();
      // A data pode ter caído em outro trimestre (até um novo): mostra a tabela dele.
      await carregarPeriodos();
      setPeriodoId(resposta.periodo_id);
      setVersao((v) => v + 1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function editar(acao: Acao) {
    setEditandoId(acao.id);
    setFormulario({
      indicadorId: String(acao.indicador_id),
      valor: String(acao.valor),
      data: acao.data_referencia,
      descricao: acao.descricao ?? '',
    });
    setAviso('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluir(acao: Acao) {
    if (!window.confirm(`Excluir o lançamento de ${acao.indicador} em ${formatarData(acao.data_referencia)}?`)) return;
    try {
      await api(`/acoes/${acao.id}`, { metodo: 'DELETE' });
      if (editandoId === acao.id) limparFormulario();
      setVersao((v) => v + 1);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <>
      <header className="cabecalho-pagina">
        <h1>Registrar ações</h1>
      </header>

      <form className="cartao formulario" onSubmit={salvar}>
        <h2>{editandoId ? 'Editar lançamento' : 'Novo lançamento'}</h2>
        <label>
          Indicador
          <select value={formulario.indicadorId} onChange={(e) => alterar('indicadorId', e.target.value)} required>
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
            <span style={{ color: PILARES[indicador.pilar].cor }}>{PILARES[indicador.pilar].nome}</span> · Unidade:{' '}
            {indicador.unidade} ·{' '}
            {indicador.agregacao === 'soma'
              ? 'os lançamentos do trimestre são somados'
              : 'o trimestre usa a média dos lançamentos'}
          </p>
        )}

        <div className="linha-campos">
          <label>
            Valor {indicador && `(${indicador.unidade})`}
            <input
              type="number"
              min="0"
              step="any"
              value={formulario.valor}
              onChange={(e) => alterar('valor', e.target.value)}
              required
            />
          </label>
          <label>
            Data
            <input type="date" value={formulario.data} onChange={(e) => alterar('data', e.target.value)} required />
          </label>
        </div>

        {previa !== null && (
          <p className="previa-emissao">
            Emissão estimada: <strong>{formatarNumero(previa, 4)} tCO₂e</strong> (fator médio do SIN)
          </p>
        )}

        <label>
          Observação (opcional)
          <textarea value={formulario.descricao} onChange={(e) => alterar('descricao', e.target.value)} rows={2} />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {aviso && <p className="mensagem-sucesso">{aviso}</p>}
        <div className="botoes">
          <button type="submit" className="botao">
            {editandoId ? 'Salvar alterações' : 'Registrar'}
          </button>
          {editandoId && (
            <button type="button" className="botao botao-secundario" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <section className="cartao">
        <div className="cabecalho-cartao">
          <h2>Lançamentos do trimestre</h2>
          <SeletorPeriodo periodos={periodos} valor={periodoId} aoMudar={setPeriodoId} />
        </div>
        {acoes.length === 0 ? (
          <p className="texto-suave">Nenhum lançamento neste trimestre.</p>
        ) : (
          <div className="tabela-rolavel">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Indicador</th>
                  <th className="numero">Valor</th>
                  <th>Observação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {acoes.map((a) => (
                  <tr key={a.id}>
                    <td>{formatarData(a.data_referencia)}</td>
                    <td>
                      <span className="ponto-pilar" style={{ background: PILARES[a.pilar].cor }} />
                      {a.indicador}
                    </td>
                    <td className="numero">
                      {formatarNumero(a.valor)} {a.unidade}
                    </td>
                    <td className="texto-suave">{a.descricao}</td>
                    <td className="acoes-linha">
                      <button type="button" className="botao-link" onClick={() => editar(a)}>
                        Editar
                      </button>
                      <button type="button" className="botao-link perigo" onClick={() => excluir(a)}>
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
