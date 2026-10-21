# API de Vendas e Comissões

API REST em Node.js, Express e MySQL para cadastrar vendedores, registrar vendas, calcular comissões e acompanhar metas. O cálculo soma os percentuais: base do vendedor + bônus do tipo de cliente + bônus da região. A venda guarda o valor de comissão calculado no momento do registro para manter o histórico.

## Requisitos

- Node.js 18 ou superior
- MySQL 8.0 ou superior

## Instalação

1. Importe `database/schema.sql` no MySQL. O script cria `db_vendas`, tabelas, quatro regiões, cinco vendedores e quinze vendas de exemplo.
2. Instale as dependências com `npm install`.
3. Copie `.env.example` para `.env` e preencha usuário, senha e dados de conexão do banco.
4. Inicie com `npm start` (ou `npm run dev` durante o desenvolvimento).
5. Confira `GET http://localhost:3000/health`.

Credenciais ficam somente no `.env`, que é ignorado pelo Git. O serviço usa `mysql2/promise`, pool de conexões, `async/await`, transação no registro e consultas parametrizadas.

## Regras de comissão

`valor_venda × (percentual_base + bônus_cliente + bônus_região) / 100`.

PF recebe 2%; PJ recebe 3%. Norte e Nordeste recebem 1%, Sudeste 0% e Sul 0,5%. Exemplo do enunciado: R$ 2.000,00, base 5%, PJ e Norte resulta em R$ 180,00.

## Endpoints

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | `/vendedores` | Cadastra vendedor (`nome`, `meta_mensal`, `percentual_base`) |
| GET | `/vendedores` | Lista todos |
| GET | `/vendedores/:id` | Consulta um vendedor |
| PUT | `/vendedores/:id` | Atualiza `meta_mensal` e `percentual_base` |
| PATCH | `/vendedores/:id/desativar` | Desativa sem apagar vendas |
| POST | `/vendas` | Registra venda e calcula comissão |
| GET | `/vendas` | Lista vendas com vendedor e região |
| GET | `/vendas/vendedor/:id` | Filtra por vendedor |
| GET | `/vendas/regiao/:id` | Filtra por região |
| DELETE | `/vendas/:id` | Exclui venda existente |
| GET | `/relatorios/performance?inicio=2026-10-01&fim=2026-10-31` | Relatório do período |
| GET | `/health` | Verifica API e banco |

Corpo para `POST /vendas` (o código é opcional; quando informado deve ser único):

```json
{
  "id_venda": 2001,
  "id_vendedor": 1,
  "id_regiao": 1,
  "data_venda": "2026-10-20 10:30:00",
  "valor_venda": 2000,
  "tipo_cliente": "PJ"
}
```

O relatório retorna quantidade e valor total, totais por região e cliente, melhor vendedor por valor, maior comissão acumulada, quantidade de metas atingidas e médias de comissão geral e por região. O período de vendas é inclusivo para as datas informadas; as metas usam a soma de vendas nesse período para comparar com a meta mensal cadastrada.

## Testes manuais no Insomnia

No Insomnia, use **Import** e selecione `insomnia/collection.json`. A coleção contém requisições para cadastro/listagem, venda e comissão, duplicidade, vendedor inativo/inexistente, atualização, filtros, exclusão e relatório. O ambiente já define `baseUrl=http://localhost:3000`.

Para reproduzir do zero, execute o script SQL uma única vez em um banco vazio. O script vem com cinco vendedores e quinze vendas distribuídas nas quatro regiões e em PF/PJ. A coleção serve para conferir os códigos HTTP e os corpos JSON; as capturas de tela podem ser feitas no Insomnia após executar as requisições.

## Organização

- `src/config/database.js`: pool MySQL
- `src/services/`: operações assíncronas e regra central de comissão
- `src/routes/api.js`: endpoints, validação e códigos HTTP
- `database/schema.sql`: schema e dados de demonstração
- `insomnia/collection.json`: coleção para importar no Insomnia
