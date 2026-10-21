require('dotenv').config();
const express = require('express');
const db = require('./config/database');
const api = require('./routes/api');

const app = express();
app.use(express.json());
app.get('/health', async (_req, res, next) => {
  try { await db.query('SELECT 1'); res.json({ status: 'ok', banco: 'conectado' }); }
  catch (erro) { next(erro); }
});
app.use(api);
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((erro, _req, res, _next) => {
  console.error(`[${new Date().toISOString()}]`, erro);
  const status = erro.status || 500;
  const mensagem = status < 500 ? erro.message : 'Erro interno. Verifique a conexão e os logs da API.';
  res.status(status).json({ erro: mensagem });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`API disponível em http://localhost:${port}`));
async function encerrar() { server.close(); await db.end(); process.exit(0); }
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
