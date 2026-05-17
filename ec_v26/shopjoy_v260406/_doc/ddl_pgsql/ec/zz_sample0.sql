-- zz_sample0 테이블 DDL
-- ZzSample0 - 샘플 데이터 관리 테이블 0

CREATE TABLE shopjoy_2604.zz_sample0 (
    sample0_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    sample_name  VARCHAR(100),
    sample_desc  VARCHAR(500),
    sample_value VARCHAR(100),
    sort_ord     INTEGER      DEFAULT 0,
    use_yn       VARCHAR(1)   DEFAULT 'Y'::bpchar,
    col01        VARCHAR(200),
    col02        VARCHAR(200),
    col03        VARCHAR(200),
    col04        VARCHAR(200),
    col05        VARCHAR(200),
    col06        VARCHAR(200),
    col07        VARCHAR(200),
    col08        VARCHAR(200),
    col09        VARCHAR(200),
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30) ,
    upd_date     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.zz_sample0 IS 'ZzSample0 - 샘플 데이터 관리 테이블 0';
