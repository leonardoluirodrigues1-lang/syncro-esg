// Comunicação com o backend e guarda do token de login.

const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const CHAVE_TOKEN = 'syncro_token';

// localStorage pode falhar (modo privado, bloqueio do navegador): por isso o try/catch.
export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token: string) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    // sem armazenamento: o login vale só até recarregar a página
  }
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // nada a apagar
  }
  window.location.href = '/login';
}

// Acrescenta ?periodoId=... só quando há um período escolhido.
export function comPeriodo(caminho: string, periodoId: string) {
  return periodoId ? `${caminho}?periodoId=${periodoId}` : caminho;
}

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
}

// Faz a requisição e devolve o JSON. Em caso de erro, lança a mensagem do backend.
export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const token = lerToken();
  let resposta: Response;
  try {
    resposta = await fetch(URL_API + caminho, {
      method: opcoes.metodo ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  // Token vencido ou inválido: sai e volta para o login.
  if (resposta.status === 401 && token) {
    sair();
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = dados?.message;
    // O ValidationPipe do backend devolve uma lista de mensagens.
    throw new Error(Array.isArray(mensagem) ? mensagem.join(' ') : (mensagem ?? 'Erro inesperado no servidor.'));
  }
  return dados as T;
}
