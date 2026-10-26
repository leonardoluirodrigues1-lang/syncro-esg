// Em desenvolvimento lê o arquivo .env; na Vercel as variáveis já vêm do ambiente.
try {
  process.loadEnvFile();
} catch {
  // sem .env: segue com as variáveis de ambiente
}
