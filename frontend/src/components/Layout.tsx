import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api, sair } from '../api';
import type { Perfil } from '../tipos';

// Menu lateral + área da página atual.
export default function Layout() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    api<Perfil>('/auth/perfil').then(setPerfil).catch(() => setPerfil(null));
  }, []);

  return (
    <div className="estrutura">
      <aside className="menu-lateral">
        <div className="marca">
          Syncro <span>ESG</span>
        </div>
        <nav>
          <NavLink to="/" end>
            Painel
          </NavLink>
          <NavLink to="/acoes">Registrar ações</NavLink>
          <NavLink to="/metas">Metas</NavLink>
          <NavLink to="/relatorio">Relatório</NavLink>
        </nav>
        <div className="menu-rodape">
          <span className="menu-empresa">{perfil?.empresa ?? ''}</span>
          <button type="button" className="botao-sair" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
