-- zz_exam3 테이블 DDL
-- zz_exam3

CREATE TABLE shopjoy_2604.zz_exam3 (
    exam1_id VARCHAR(21)  NOT NULL,
    exam2_id VARCHAR(21)  NOT NULL,
    exam3_id VARCHAR(21)  NOT NULL,
    col31    VARCHAR(200),
    col32    VARCHAR(200),
    col33    VARCHAR(200),
    col34    VARCHAR(200),
    col35    VARCHAR(200)
);

COMMENT ON TABLE  shopjoy_2604.zz_exam3 IS 'zz_exam3';

CREATE UNIQUE INDEX pk_zz_exam3 ON shopjoy_2604.zz_exam3 USING btree (exam1_id, exam2_id, exam3_id);
