const db = require('../config/database');

async function cadastrarVendedor({ nome, meta_mensal, percentual_base }) {
  const [resultado] = await db.execute(
    'INSERT INTO vendedores (nome, meta_mensal, percentual_base) VALUES (?, ?, ?)',
    [nome, meta_mensal, percentual_base]
  );
  return { id_vendedor: resultado.insertId, nome, meta_mensal: Number(meta_mensal), percentual_base: Number(percentual_base), ativo: true };
}

async function listarVendedores(id) {
  const sql = id
    ? 'SELECT * FROM vendedores WHERE id_vendedor = ?'
    : 'SELECT * FROM vendedores ORDER BY id_vendedor';
  const [resultados] = await db.execute(sql, id ? [id] : []);
  return id ? resultados[0] || null : resultados;
}

async function atualizarVendedor(id, { meta_mensal, percentual_base }) {
  const [resultado] = await db.execute(
    'UPDATE vendedores SET meta_mensal = ?, percentual_base = ? WHERE id_vendedor = ?',
    [meta_mensal, percentual_base, id]
  );
  return resultado.affectedRows > 0;
}

async function desativarVendedor(id) {
  const [resultado] = await db.execute('UPDATE vendedores SET ativo = 0 WHERE id_vendedor = ? AND ativo = 1', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { cadastrarVendedor, listarVendedores, atualizarVendedor, desativarVendedor };
