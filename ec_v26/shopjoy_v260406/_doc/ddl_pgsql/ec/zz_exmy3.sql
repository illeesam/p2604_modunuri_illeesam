-- zz_exmy3 테이블 DDL
-- zz_exmy3

CREATE TABLE shopjoy_2604.zz_exmy3 (
    exmy1_id VARCHAR(21)  NOT NULL,
    exmy2_id VARCHAR(21)  NOT NULL,
    exmy3_id VARCHAR(21)  NOT NULL,
    col31    VARCHAR(200),
    col32    VARCHAR(200),
    col33    VARCHAR(200),
    col34    VARCHAR(200),
    col35    VARCHAR(200),
    reg_by   VARCHAR(30) ,
    reg_date TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by   VARCHAR(30) ,
    upd_date TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.zz_exmy3 IS 'zz_exmy3';

CREATE UNIQUE INDEX pk_zz_exmy3 ON shopjoy_2604.zz_exmy3 USING btree (exmy1_id, exmy2_id, exmy3_id);
