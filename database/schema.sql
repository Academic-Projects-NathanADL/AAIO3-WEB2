CREATE DATABASE IF NOT EXISTS db_vendas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_vendas;

CREATE TABLE IF NOT EXISTS vendedores (
  id_vendedor INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  meta_mensal DECIMAL(12,2) NOT NULL,
  percentual_base DECIMAL(5,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_vendedor_meta CHECK (meta_mensal > 0),
  CONSTRAINT chk_vendedor_percentual CHECK (percentual_base >= 0 AND percentual_base <= 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS regioes (
  id_regiao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_regiao VARCHAR(50) NOT NULL UNIQUE,
  percentual_bonus DECIMAL(5,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_regiao_percentual CHECK (percentual_bonus >= 0 AND percentual_bonus <= 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendas (
  id_venda INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_vendedor INT UNSIGNED NOT NULL,
  id_regiao INT UNSIGNED NOT NULL,
  data_venda DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor_venda DECIMAL(12,2) NOT NULL,
  tipo_cliente ENUM('PF','PJ') NOT NULL,
  valor_comissao DECIMAL(12,2) NOT NULL,
  CONSTRAINT chk_venda_valor CHECK (valor_venda > 0),
  CONSTRAINT chk_venda_comissao CHECK (valor_comissao >= 0),
  CONSTRAINT fk_venda_vendedor FOREIGN KEY (id_vendedor) REFERENCES vendedores(id_vendedor)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venda_regiao FOREIGN KEY (id_regiao) REFERENCES regioes(id_regiao)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_venda_data (data_venda),
  INDEX idx_venda_vendedor_data (id_vendedor, data_venda),
  INDEX idx_venda_regiao_data (id_regiao, data_venda)
) ENGINE=InnoDB;

INSERT INTO regioes (nome_regiao, percentual_bonus) VALUES
  ('Norte', 1.00), ('Nordeste', 1.00), ('Sudeste', 0.00), ('Sul', 0.50)
ON DUPLICATE KEY UPDATE percentual_bonus = VALUES(percentual_bonus);

INSERT INTO vendedores (nome, meta_mensal, percentual_base, ativo) VALUES
  ('Ana Souza', 10000.00, 5.00, TRUE),
  ('Bruno Lima', 12000.00, 5.00, TRUE),
  ('Carla Mendes', 9000.00, 6.00, TRUE),
  ('Diego Alves', 15000.00, 4.50, TRUE),
  ('Elisa Rocha', 8000.00, 5.50, TRUE);

-- 15 registros em outubro/2026; as comissões seguem percentual base + bônus cliente + bônus regional.
INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES
 (1001,1,1,'2026-10-02 09:15:00',2000.00,'PJ',180.00),
 (1002,1,2,'2026-10-04 11:30:00',1500.00,'PF',120.00),
 (1003,1,3,'2026-10-06 14:00:00',1800.00,'PJ',144.00),
 (1004,2,4,'2026-10-03 10:10:00',2500.00,'PJ',200.00),
 (1005,2,1,'2026-10-07 16:25:00',3000.00,'PF',240.00),
 (1006,2,2,'2026-10-09 13:45:00',1800.00,'PJ',162.00),
 (1007,3,3,'2026-10-05 08:50:00',2200.00,'PF',176.00),
 (1008,3,4,'2026-10-10 12:10:00',2600.00,'PJ',247.00),
 (1009,3,1,'2026-10-12 15:35:00',2400.00,'PJ',240.00),
 (1010,4,2,'2026-10-08 09:20:00',3500.00,'PJ',297.50),
 (1011,4,3,'2026-10-13 10:45:00',2800.00,'PF',182.00),
 (1012,4,4,'2026-10-14 17:05:00',3200.00,'PJ',256.00),
 (1013,5,1,'2026-10-11 11:15:00',1900.00,'PF',161.50),
 (1014,5,2,'2026-10-15 14:40:00',2100.00,'PJ',199.50),
 (1015,5,3,'2026-10-18 16:00:00',2300.00,'PJ',195.50)
ON DUPLICATE KEY UPDATE valor_venda = VALUES(valor_venda);
