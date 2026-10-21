const db = require('../config/database');

function calcularComissao(valorVenda, percentualBase, percentualCliente, percentualRegiao) {
  const percentuais = [valorVenda, percentualBase, percentualCliente, percentualRegiao].map(Number);
  if (percentuais.some((valor) => !Number.isFinite(valor))) {
    throw new TypeError('Os valores usados no cálculo da comissão devem ser numéricos.');
  }
  return Number((percentuais[0] * (percentuais[1] + percentuais[2] + percentuais[3]) / 100).toFixed(2));
}

async function registrarVenda(dados) {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    const [vendedores] = await conexao.execute(
      'SELECT percentual_base FROM vendedores WHERE id_vendedor = ? AND ativo = 1 FOR UPDATE',
      [dados.id_vendedor]
    );
    if (!vendedores.length) {
      const erro = new Error('Vendedor inexistente ou inativo.'); erro.status = 400; throw erro;
    }
    const [regioes] = await conexao.execute(
      'SELECT percentual_bonus FROM regioes WHERE id_regiao = ?', [dados.id_regiao]
    );
    if (!regioes.length) {
      const erro = new Error('Região não encontrada.'); erro.status = 400; throw erro;
    }
    const bonusCliente = dados.tipo_cliente === 'PJ' ? 3 : 2;
    const comissao = calcularComissao(dados.valor_venda, vendedores[0].percentual_base, bonusCliente, regioes[0].percentual_bonus);
    const campos = ['id_vendedor', 'id_regiao', 'data_venda', 'valor_venda', 'tipo_cliente', 'valor_comissao'];
    const valores = [dados.id_vendedor, dados.id_regiao, dados.data_venda || new Date(), dados.valor_venda, dados.tipo_cliente, comissao];
    if (dados.id_venda !== undefined) { campos.unshift('id_venda'); valores.unshift(dados.id_venda); }
    const placeholders = campos.map(() => '?').join(', ');
    const [resultado] = await conexao.execute(
      `INSERT INTO vendas (${campos.join(', ')}) VALUES (${placeholders})`, valores
    );
    await conexao.commit();
    return { id_venda: dados.id_venda || resultado.insertId, valor_comissao: comissao };
  } catch (erro) {
    await conexao.rollback();
    if (erro.code === 'ER_DUP_ENTRY') { erro.status = 409; erro.message = 'Código de venda já cadastrado.'; }
    throw erro;
  } finally { conexao.release(); }
}

async function listarVendas(filtros = {}) {
  const condicoes = [];
  const parametros = [];
  if (filtros.id_vendedor) { condicoes.push('v.id_vendedor = ?'); parametros.push(filtros.id_vendedor); }
  if (filtros.id_regiao) { condicoes.push('v.id_regiao = ?'); parametros.push(filtros.id_regiao); }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const [linhas] = await db.execute(
    `SELECT v.*, ve.nome AS vendedor, r.nome_regiao FROM vendas v
     JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor
     JOIN regioes r ON r.id_regiao = v.id_regiao ${where}
     ORDER BY v.data_venda DESC, v.id_venda DESC`, parametros
  );
  return linhas;
}

async function excluirVenda(id) {
  const [existente] = await db.execute('SELECT id_venda FROM vendas WHERE id_venda = ?', [id]);
  if (!existente.length) return false;
  await db.execute('DELETE FROM vendas WHERE id_venda = ?', [id]);
  return true;
}

module.exports = { calcularComissao, registrarVenda, listarVendas, excluirVenda };
