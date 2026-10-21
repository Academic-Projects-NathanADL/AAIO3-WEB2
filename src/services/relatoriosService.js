const db = require('../config/database');

async function gerarRelatorioPerformance(inicio, fim) {
  const parametros = [inicio, fim];
  const [total] = await db.execute(
    'SELECT COUNT(*) AS quantidade_vendas, COALESCE(SUM(valor_venda),0) AS valor_total, COALESCE(AVG(valor_comissao),0) AS comissao_media FROM vendas WHERE data_venda >= ? AND data_venda < DATE_ADD(?, INTERVAL 1 DAY)',
    parametros
  );
  const [porRegiao] = await db.execute(
    `SELECT r.id_regiao, r.nome_regiao, COUNT(v.id_venda) AS quantidade_vendas,
            COALESCE(SUM(v.valor_venda),0) AS valor_total, COALESCE(AVG(v.valor_comissao),0) AS comissao_media
     FROM regioes r LEFT JOIN vendas v ON v.id_regiao = r.id_regiao
       AND v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY r.id_regiao, r.nome_regiao ORDER BY r.id_regiao`, parametros
  );
  const [porCliente] = await db.execute(
    `SELECT tipo_cliente, COUNT(*) AS quantidade_vendas, SUM(valor_venda) AS valor_total
     FROM vendas WHERE data_venda >= ? AND data_venda < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY tipo_cliente`, parametros
  );
  const [melhor] = await db.execute(
    `SELECT ve.id_vendedor, ve.nome, SUM(v.valor_venda) AS valor_total
     FROM vendas v JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor
     WHERE v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY ve.id_vendedor, ve.nome ORDER BY valor_total DESC LIMIT 1`, parametros
  );
  const [maiorComissao] = await db.execute(
    `SELECT ve.id_vendedor, ve.nome, SUM(v.valor_comissao) AS comissao_total
     FROM vendas v JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor
     WHERE v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY ve.id_vendedor, ve.nome ORDER BY comissao_total DESC LIMIT 1`, parametros
  );
  const [metas] = await db.execute(
    `SELECT COUNT(*) AS vendedores_que_atingiram_meta FROM (
       SELECT ve.id_vendedor, ve.meta_mensal, COALESCE(SUM(v.valor_venda),0) AS total_vendido
       FROM vendedores ve LEFT JOIN vendas v ON v.id_vendedor = ve.id_vendedor
         AND v.data_venda >= ? AND v.data_venda < DATE_ADD(?, INTERVAL 1 DAY)
       WHERE ve.ativo = 1 GROUP BY ve.id_vendedor, ve.meta_mensal
       HAVING total_vendido >= ve.meta_mensal
     ) metas_atingidas`, parametros
  );
  return {
    periodo: { inicio, fim },
    total_vendas: Number(total[0].quantidade_vendas),
    valor_total_vendido: Number(total[0].valor_total),
    vendas_por_regiao: porRegiao,
    vendas_por_tipo_cliente: porCliente,
    melhor_vendedor: melhor[0] || null,
    vendedor_maior_comissao: maiorComissao[0] || null,
    vendedores_que_atingiram_meta: Number(metas[0].vendedores_que_atingiram_meta),
    comissao_media_geral: Number(total[0].comissao_media),
    comissao_media_por_regiao: porRegiao.map(({ nome_regiao, comissao_media }) => ({ nome_regiao, comissao_media }))
  };
}

module.exports = { gerarRelatorioPerformance };
