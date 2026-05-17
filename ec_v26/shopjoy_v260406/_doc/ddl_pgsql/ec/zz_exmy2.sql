-- zz_exmy2 테이블 DDL
-- zz_exmy2

CREATE TABLE shopjoy_2604.zz_exmy2 (
    exmy1_id VARCHAR(21)  NOT NULL,
    exmy2_id VARCHAR(21)  NOT NULL,
    col21    VARCHAR(200),
    col22    VARCHAR(200),
    col23    VARCHAR(200),
    col24    VARCHAR(200),
    col25    VARCHAR(200),
    reg_by   VARCHAR(30) ,
    reg_date TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by   VARCHAR(30) ,
    upd_date TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.zz_exmy2 IS 'zz_exmy2';

CREATE UNIQUE INDEX pk_zz_exmy2 ON shopjoy_2604.zz_exmy2 USING btree (exmy1_id, exmy2_id);
