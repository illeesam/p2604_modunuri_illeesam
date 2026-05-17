-- zz_exmy1 테이블 DDL
-- zz_exmy1

CREATE TABLE shopjoy_2604.zz_exmy1 (
    exmy1_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    col11    VARCHAR(200),
    col12    VARCHAR(200),
    col13    VARCHAR(200),
    col14    VARCHAR(200),
    col15    VARCHAR(200),
    reg_by   VARCHAR(30) ,
    reg_date TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by   VARCHAR(30) ,
    upd_date TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.zz_exmy1 IS 'zz_exmy1';

CREATE UNIQUE INDEX pk_zz_exmy1 ON shopjoy_2604.zz_exmy1 USING btree (exmy1_id);
