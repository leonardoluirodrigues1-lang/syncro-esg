import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, salvarToken } from '../api';
import { formatarCnpj } from '../formatos';

export default function Cadastro() {
  const navegar = useNavigate();
  const [dados, setDados] = useState({
    nomeEmpresa: '',
    cnpj: '',
    setor: '',
    porte: '',
    nome: '',
    email: '',
    senha: '',
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterar(campo: keyof typeof dados, valor: string) {
    setDados({ ...dados, [campo]: valor });
  }

  async function cadastrar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const corpo = { ...dados, setor: dados.setor || undefined, porte: dados.porte || undefined };
      const resposta = await api<{ token: string }>('/auth/cadastro', { metodo: 'POST', corpo });
      salvarToken(resposta.token);
      navegar('/');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-acesso">
      <form className="cartao cartao-acesso cartao-cadastro" onSubmit={cadastrar}>
        <h1 className="marca">
          Syncro <span>ESG</span>
        </h1>

        <fieldset>
          <legend>Dados da empresa</legend>
          <label>
            Nome da empresa
            <input value={dados.nomeEmpresa} onChange={(e) => alterar('nomeEmpresa', e.target.value)} required />
          </label>
          <label>
            CNPJ
            <input
              value={dados.cnpj}
              onChange={(e) => alterar('cnpj', formatarCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              required
            />
          </label>
          <div className="linha-campos">
            <label>
              Setor
              <input value={dados.setor} onChange={(e) => alterar('setor', e.target.value)} placeholder="Ex.: Alimentação" />
            </label>
            <label>
              Porte
              <select value={dados.porte} onChange={(e) => alterar('porte', e.target.value)}>
                <option value="">Selecione</option>
                <option value="micro">Micro</option>
                <option value="pequena">Pequena</option>
                <option value="media">Média</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Responsável ESG</legend>
          <label>
            Seu nome
            <input value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} required />
          </label>
          <label>
            E-mail
            <input type="email" value={dados.email} onChange={(e) => alterar('email', e.target.value)} required />
          </label>
          <label>
            Senha (mínimo 6 caracteres)
            <input
              type="password"
              value={dados.senha}
              onChange={(e) => alterar('senha', e.target.value)}
              minLength={6}
              required
            />
          </label>
        </fieldset>

        {erro && <p className="mensagem-erro">{erro}</p>}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Criar conta'}
        </button>
        <p className="texto-suave">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
