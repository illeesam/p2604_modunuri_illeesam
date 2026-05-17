-- zz_exam2 테이블 DDL
-- zz_exam2

CREATE TABLE shopjoy_2604.zz_exam2 (
    exam1_id VARCHAR(21)  NOT NULL,
    exam2_id VARCHAR(21)  NOT NULL,
    col21    VARCHAR(200),
    col22    VARCHAR(200),
    col23    VARCHAR(200),
    col24    VARCHAR(200),
    col25    VARCHAR(200)
);

COMMENT ON TABLE  shopjoy_2604.zz_exam2 IS 'zz_exam2';

CREATE UNIQUE INDEX pk_zz_exam2 ON shopjoy_2604.zz_exam2 USING btree (exam1_id, exam2_id);
