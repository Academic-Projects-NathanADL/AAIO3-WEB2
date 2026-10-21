const express = require('express');
const vendedores = require('../services/vendedoresService');
const vendas = require('../services/vendasService');
const { gerarRelatorioPerformance } = require('../services/relatoriosService');

const router = express.Router();
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idValido = (valor) => /^\d+$/.test(String(valor)) && Number(valor) > 0;

router.post('/vendedores', asyncRoute(async (req, res) => {
  const { nome, meta_mensal, percentual_base } = req.body;
  if (typeof nome !== 'string' || !nome.trim() || !Number.isFinite(Number(meta_mensal)) || Number(meta_mensal) <= 0 || !Number.isFinite(Number(percentual_base)) || Number(percentual_base) < 0 || Number(percentual_base) > 100) {
    return res.status(400).json({ erro: 'Informe nome, meta_mensal positiva e percentual_base entre 0 e 100.' });
  }
  res.status(201).json(await vendedores.cadastrarVendedor({ nome: nome.trim(), meta_mensal, percentual_base }));
}));

router.get('/vendedores', asyncRoute(async (_req, res) => res.json(await vendedores.listarVendedores())));
router.get('/vendedores/:id', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  const vendedor = await vendedores.listarVendedores(req.params.id);
  return vendedor ? res.json(vendedor) : res.status(404).json({ erro: 'Vendedor não encontrado.' });
}));
router.put('/vendedores/:id', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  const { meta_mensal, percentual_base } = req.body;
  if (!Number.isFinite(Number(meta_mensal)) || Number(meta_mensal) <= 0 || !Number.isFinite(Number(percentual_base)) || Number(percentual_base) < 0 || Number(percentual_base) > 100) return res.status(400).json({ erro: 'Informe meta_mensal positiva e percentual_base entre 0 e 100.' });
  return await vendedores.atualizarVendedor(req.params.id, { meta_mensal, percentual_base })
    ? res.json({ mensagem: 'Vendedor atualizado.' }) : res.status(404).json({ erro: 'Vendedor não encontrado.' });
}));
router.patch('/vendedores/:id/desativar', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  return await vendedores.desativarVendedor(req.params.id)
    ? res.json({ mensagem: 'Vendedor desativado; histórico preservado.' }) : res.status(404).json({ erro: 'Vendedor não encontrado ou já desativado.' });
}));

router.post('/vendas', asyncRoute(async (req, res) => {
  const { id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente } = req.body;
  if (id_venda !== undefined && !idValido(id_venda)) return res.status(400).json({ erro: 'Código de venda inválido.' });
  if (!idValido(id_vendedor) || !idValido(id_regiao) || !Number.isFinite(Number(valor_venda)) || Number(valor_venda) <= 0 || !['PF', 'PJ'].includes(tipo_cliente)) return res.status(400).json({ erro: 'Informe vendedor e região válidos, valor positivo e tipo_cliente PF ou PJ.' });
  if (data_venda && Number.isNaN(Date.parse(data_venda))) return res.status(400).json({ erro: 'data_venda inválida.' });
  res.status(201).json(await vendas.registrarVenda({ id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente }));
}));
router.get('/vendas', asyncRoute(async (req, res) => res.json(await vendas.listarVendas())));
router.get('/vendas/vendedor/:id', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  res.json(await vendas.listarVendas({ id_vendedor: req.params.id }));
}));
router.get('/vendas/regiao/:id', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  res.json(await vendas.listarVendas({ id_regiao: req.params.id }));
}));
router.delete('/vendas/:id', asyncRoute(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  return await vendas.excluirVenda(req.params.id) ? res.status(200).json({ mensagem: 'Venda excluída.' }) : res.status(404).json({ erro: 'Venda não encontrada.' });
}));
router.get('/relatorios/performance', asyncRoute(async (req, res) => {
  const { inicio, fim } = req.query;
  const dataValida = (data) => /^\d{4}-\d{2}-\d{2}$/.test(String(data)) && !Number.isNaN(Date.parse(`${data}T00:00:00Z`));
  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) return res.status(400).json({ erro: 'Informe inicio e fim válidos no formato YYYY-MM-DD, com inicio anterior ou igual a fim.' });
  res.json(await gerarRelatorioPerformance(inicio, fim));
}));

module.exports = router;
