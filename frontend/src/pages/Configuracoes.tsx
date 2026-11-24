import { useEffect, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';
import type { ContextoLayout } from '../components/Layout';
import { formatarCnpj } from '../formatos';
import type { Perfil } from '../tipos';

// Mesma regra do backend: a conta de demonstração não troca e-mail nem senha.
const EMAIL_DEMO = 'demo@syncro.com';
const MENSAGEM_DEMO = 'A conta de demonstração não permite trocar e-mail nem senha.';

// Erro e aviso de sucesso de cada formulário, para as mensagens aparecerem no bloco certo.
function useMensagens() {
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  // Roda o envio e mostra o aviso se deu certo, ou a mensagem do backend se falhou.
  async function enviar(acao: () => Promise<unknown>, textoSucesso: string) {
    setErro('');
    setAviso('');
    try {
      await acao();
      setAviso(textoSucesso);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const mensagens = (
    <>
      {erro && <p className="mensagem-erro">{erro}</p>}
      {aviso && <p className="mensagem-sucesso">{aviso}</p>}
    </>
  );
  return { enviar, mensagens, setErro };
}

export default function Configuracoes() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [empresa, setEmpresa] = useState({ nome: '', setor: '', porte: '' });
  const [usuario, setUsuario] = useState({ nome: '', email: '' });
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmacao: '' });

  const { aoRenomearEmpresa } = useOutletContext<ContextoLayout>();
  const msgEmpresa = useMensagens();
  const msgUsuario = useMensagens();
  const msgSenha = useMensagens();

  useEffect(() => {
    api<Perfil>('/auth/perfil')
      .then((p) => {
        setPerfil(p);
        setEmpresa({ nome: p.empresa, setor: p.setor ?? '', porte: p.porte ?? '' });
        setUsuario({ nome: p.nome, email: p.email });
      })
      .catch((e) => setErroCarga(e.message));
  }, []);

  if (erroCarga) return <p className="mensagem-erro">{erroCarga}</p>;
  if (!perfil) return <p className="texto-suave">Carregando...</p>;
  const demo = perfil.email === EMAIL_DEMO;

  function salvarEmpresa(evento: FormEvent) {
    evento.preventDefault();
    msgEmpresa.enviar(async () => {
      const salva = await api<{ nome: string }>('/empresa', { metodo: 'PUT', corpo: empresa });
      aoRenomearEmpresa(salva.nome); // o Relatório já busca o nome de novo ao ser aberto
    }, 'Dados da empresa salvos.');
  }

  function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    msgUsuario.enviar(() => api('/auth/perfil', { metodo: 'PUT', corpo: usuario }), 'Seus dados foram salvos.');
  }

  function trocarSenha(evento: FormEvent) {
    evento.preventDefault();
    // A confirmação é conferida aqui mesmo; o backend recebe só a senha atual e a nova.
    if (senhas.novaSenha !== senhas.confirmacao) {
      msgSenha.setErro('A confirmação não é igual à nova senha.');
      return;
    }
    msgSenha.enviar(async () => {
      await api('/auth/senha', {
        metodo: 'PUT',
        corpo: { senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha },
      });
      setSenhas({ senhaAtual: '', novaSenha: '', confirmacao: '' });
    }, 'Senha alterada.');
  }

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Configurações</h1>
          {/* Frase de apoio: para que serve a tela e qual é a ação principal. */}
          <p className="descricao-pagina nao-imprimir">
            Atualize os dados da empresa e os seus dados de acesso. Altere o que precisar e clique no botão de salvar
            do bloco.
          </p>
        </div>
      </header>

      <form className="cartao formulario" onSubmit={salvarEmpresa}>
        <h2>Dados da empresa</h2>
        <label>
          Nome da empresa
          <input value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} required />
        </label>
        <label>
          CNPJ
          <input value={formatarCnpj(perfil.cnpj)} disabled />
          <small className="dica-campo">
            O CNPJ identifica a empresa no sistema e nos relatórios, por isso não pode ser alterado.
          </small>
        </label>
        <div className="linha-campos">
          <label>
            Setor
            <input
              value={empresa.setor}
              onChange={(e) => setEmpresa({ ...empresa, setor: e.target.value })}
              placeholder="Ex.: Alimentação"
            />
          </label>
          <label>
            Porte
            <select value={empresa.porte} onChange={(e) => setEmpresa({ ...empresa, porte: e.target.value })}>
              <option value="">Selecione</option>
              <option value="micro">Micro</option>
              <option value="pequena">Pequena</option>
              <option value="media">Média</option>
            </select>
          </label>
        </div>
        {msgEmpresa.mensagens}
        <div className="botoes">
          <button type="submit" className="botao">
            Salvar dados da empresa
          </button>
        </div>
      </form>

      <section className="cartao formulario">
        <h2>Meus dados</h2>
        <form className="formulario" onSubmit={salvarUsuario}>
          <div className="linha-campos">
            <label>
              Nome
              <input value={usuario.nome} onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })} required />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={usuario.email}
                onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
                disabled={demo}
                required
              />
              <small className="dica-campo">{demo ? MENSAGEM_DEMO : 'É o e-mail usado para entrar no sistema.'}</small>
            </label>
          </div>
          {msgUsuario.mensagens}
          <div className="botoes">
            <button type="submit" className="botao">
              Salvar meus dados
            </button>
          </div>
        </form>

        <form className="formulario" onSubmit={trocarSenha}>
          <h3>Trocar senha</h3>
          {demo && <p className="dica-campo">{MENSAGEM_DEMO}</p>}
          {/* <fieldset disabled> desativa de uma vez todos os campos e o botão da troca de senha. */}
          <fieldset disabled={demo}>
            <label>
              Senha atual
              <input
                type="password"
                autoComplete="current-password"
                value={senhas.senhaAtual}
                onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })}
                required
              />
            </label>
            <div className="linha-campos">
              <label>
                Nova senha
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={senhas.novaSenha}
                  onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })}
                  required
                />
                <small className="dica-campo">Mínimo de 6 caracteres.</small>
              </label>
              <label>
                Confirme a nova senha
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={senhas.confirmacao}
                  onChange={(e) => setSenhas({ ...senhas, confirmacao: e.target.value })}
                  required
                />
              </label>
            </div>
            {msgSenha.mensagens}
            <div className="botoes">
              <button type="submit" className="botao">
                Trocar senha
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      <section className="cartao sobre">
        <h2>Sobre o Syncro</h2>
        <p>
          O Syncro ESG ajuda pequenas e médias empresas a registrar e acompanhar suas práticas ambientais (E), sociais
          (S) e de governança (G).
        </p>
        <p>
          <strong>Score de cada pilar:</strong> 70% do progresso médio das metas + 30% da cobertura (indicadores
          obrigatórios com lançamento no trimestre). <strong>Score geral:</strong> 40% Ambiental + 30% Social + 30%
          Governança.
        </p>
        <p>
          <strong>Emissões:</strong> calculadas pelo GHG Protocol (protocolo internacional de gases de efeito estufa),
          escopo 2, que são as emissões da energia elétrica comprada. O consumo em kWh é multiplicado pelo fator de
          emissão do SIN (Sistema Interligado Nacional), publicado pelo MCTI (Ministério da Ciência, Tecnologia e
          Inovação).
        </p>
        <p>
          <strong>Referências dos indicadores:</strong> GRI Standards (Global Reporting Initiative, padrão
          internacional de relatórios de sustentabilidade) e ODS (Objetivos de Desenvolvimento Sustentável da ONU).
        </p>
        <p className="texto-suave">Projeto Integrador 2 – IFSP São José do Rio Preto</p>
      </section>
    </>
  );
}
