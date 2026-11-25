import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api, sair } from '../api';
import Folhas from './Folhas';
import type { Perfil } from '../tipos';

// O que o Layout entrega às páginas (lido com useOutletContext).
export interface ContextoLayout {
  aoRenomearEmpresa: (nome: string) => void;
}

export default function Layout() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    api<Perfil>('/auth/perfil').then(setPerfil).catch(() => setPerfil(null));
  }, []);

  return (
    <div className="estrutura">
      {/* Primeiro item do Tab: leva direto ao conteúdo, sem passar pelo menu. */}
      <a href="#conteudo" className="pular-conteudo">
        Pular para o conteúdo
      </a>
      <aside className="menu-lateral">
        <div className="marca">
          Syncro <span>ESG</span>
        </div>
        <nav>
          <NavLink to="/painel">
            Painel
          </NavLink>
          <NavLink to="/acoes">Registrar ações</NavLink>
          <NavLink to="/metas">Metas</NavLink>
          <NavLink to="/relatorio">Relatório</NavLink>
          <NavLink to="/configuracoes">Configurações</NavLink>
        </nav>
        <div className="menu-rodape">
          <Folhas lugar="menu" />
          <span className="menu-empresa">{perfil?.empresa ?? ''}</span>
          <button type="button" className="botao-sair" onClick={() => sair()}>
            Sair
          </button>
        </div>
      </aside>
      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Folhas lugar="conteudo" />
        {/* Configurações avisa aqui quando o nome da empresa muda: o rodapé do menu atualiza na hora. */}
        <Outlet
          context={
            { aoRenomearEmpresa: (nome) => setPerfil((p) => (p ? { ...p, empresa: nome } : p)) } satisfies ContextoLayout
          }
        />
      </main>
    </div>
  );
}
