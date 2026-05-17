-- zz_sample1 테이블 DDL
-- 다목적 샘플/코드성 데이터 저장소 1

CREATE TABLE shopjoy_2604.zz_sample1 (
    sample1_id    VARCHAR(21)   NOT NULL PRIMARY KEY,
    cd_grp        VARCHAR(50)  ,
    cd_vl         VARCHAR(20)  ,
    cd_nm         VARCHAR(200) ,
    srtord_vl     NUMERIC(10,2),
    attr_nm1      VARCHAR(200) ,
    attr_nm2      VARCHAR(200) ,
    attr_nm3      VARCHAR(200) ,
    attr_nm4      VARCHAR(200) ,
    expln_cn      VARCHAR(2000),
    cd_infw_se_cd VARCHAR(20)  ,
    use_yn        VARCHAR(20)   DEFAULT 'Y'::character varying,
    rgtr          VARCHAR(20)  ,
    reg_dt        DATE         ,
    mdfr          VARCHAR(20)  ,
    mdfcn_dt      DATE         ,
    group_cd      VARCHAR(200) ,
    col01         VARCHAR(200) ,
    col02         VARCHAR(200) ,
    col03         VARCHAR(200) ,
    col04         VARCHAR(200) ,
    col05         VARCHAR(200) ,
    col06         VARCHAR(200) ,
    col07         VARCHAR(200) ,
    col08         VARCHAR(200) ,
    col09         VARCHAR(200) ,
    status_cd     VARCHAR(20)  ,
    type_cd       VARCHAR(20)  ,
    div_cd        VARCHAR(20)  ,
    kind_cd       VARCHAR(20)  ,
    cate_cds      VARCHAR(100) 
);

COMMENT ON TABLE  shopjoy_2604.zz_sample1 IS '다목적 샘플/코드성 데이터 저장소 1';

CREATE UNIQUE INDEX pk_zz_sample1 ON shopjoy_2604.zz_sample1 USING btree (sample1_id);
