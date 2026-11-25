import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, salvarToken } from '../api';
import Folhas from '../components/Folhas';

export default function Login() {
  const navegar = useNavigate();
  // "Testar a demo" na landing chega com ?demo=1: a conta demo já vem preenchida, falta só clicar em Entrar.
  const [parametros] = useSearchParams();
  const demo = parametros.get('demo') === '1';
  const [email, setEmail] = useState(demo ? 'demo@syncro.com' : '');
  const [senha, setSenha] = useState(demo ? 'demo1234' : '');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const resposta = await api<{ token: string }>('/auth/login', { metodo: 'POST', corpo: { email, senha } });
      salvarToken(resposta.token);
      navegar('/painel');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-acesso">
      <Folhas lugar="acesso" />
      <form className="cartao cartao-acesso" onSubmit={entrar}>
        <h1 className="marca">
          Syncro <span>ESG</span>
        </h1>
        <p className="texto-suave">Gestão ESG para pequenas e médias empresas.</p>
        <p className="texto-suave">
          Registre as ações ambientais, sociais e de governança da sua empresa, acompanhe metas e gere o relatório
          ESG do trimestre.
        </p>

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>

        {erro && <p className="mensagem-erro">{erro}</p>}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="texto-suave">
          Ainda não tem conta? <Link to="/cadastro">Cadastre sua empresa</Link>
        </p>
        <p className="texto-suave dica-demo">Demonstração: demo@syncro.com / demo1234</p>
      </form>
    </div>
  );
}
