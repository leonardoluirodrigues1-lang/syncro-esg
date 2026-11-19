import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lerToken } from "./api";
import Layout from "./components/Layout";
import Acoes from "./pages/Acoes";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Metas from "./pages/Metas";
import Painel from "./pages/Painel";
import Relatorio from "./pages/Relatorio";

function AreaLogada() {
  return lerToken() ? <Layout /> : <Navigate to="/login" replace />;
}

// Login e cadastro: quem já está logado vai direto para o painel.
function SoDeslogado({ children }: { children: ReactElement }) {
  return lerToken() ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { pathname } = useLocation();

  // Ao trocar de rota, a nova página começa do topo.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <SoDeslogado>
            <Login />
          </SoDeslogado>
        }
      />
      <Route
        path="/cadastro"
        element={
          <SoDeslogado>
            <Cadastro />
          </SoDeslogado>
        }
      />
      <Route element={<AreaLogada />}>
        <Route path="/" element={<Painel />} />
        <Route path="/acoes" element={<Acoes />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/relatorio" element={<Relatorio />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
