import { Navigate, Route, Routes } from 'react-router-dom';
import { lerToken } from './api';
import Layout from './components/Layout';
import Acoes from './pages/Acoes';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Metas from './pages/Metas';
import Painel from './pages/Painel';
import Relatorio from './pages/Relatorio';

function AreaLogada() {
  return lerToken() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
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
