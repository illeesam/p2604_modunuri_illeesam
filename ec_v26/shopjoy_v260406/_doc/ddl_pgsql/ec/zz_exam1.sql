-- zz_exam1 테이블 DDL
-- zz_exam1

CREATE TABLE shopjoy_2604.zz_exam1 (
    exam1_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    col11    VARCHAR(200),
    col12    VARCHAR(200),
    col13    VARCHAR(200),
    col14    VARCHAR(200),
    col15    VARCHAR(200)
);

COMMENT ON TABLE  shopjoy_2604.zz_exam1 IS 'zz_exam1';

CREATE UNIQUE INDEX pk_zz_exam1 ON shopjoy_2604.zz_exam1 USING btree (exam1_id);
