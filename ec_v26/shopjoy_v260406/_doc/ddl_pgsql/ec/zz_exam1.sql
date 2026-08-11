-- zz_exam1 테이블 DDL
-- zz_exam1

CREATE TABLE shopjoy_2604.zz_exam1 (
    exam1_id VARCHAR(21)  NOT NULL CONSTRAINT zz_exam1_pk_exam1_id PRIMARY KEY,
    col11    VARCHAR(200),
    col12    VARCHAR(200),
    col13    VARCHAR(200),
    col14    VARCHAR(200),
    col15    VARCHAR(200)
);

COMMENT ON TABLE  shopjoy_2604.zz_exam1 IS 'zz_exam1';
