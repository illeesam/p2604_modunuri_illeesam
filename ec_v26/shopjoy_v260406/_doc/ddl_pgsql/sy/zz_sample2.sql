-- zz_sample2 테이블 DDL
-- 다목적 샘플/코드성 데이터 저장소 2
-- cd_grp로 도메인을 구분하고 col01~col09에 도메인별 속성을 자유롭게 매핑
-- (zz_sample1과 동일 구조)

CREATE TABLE shopjoy_2604.zz_sample2 (
    sample2_id    VARCHAR(20)  NOT NULL,
    cd_grp        VARCHAR(50),
    cd_vl         VARCHAR(20),
    cd_nm         VARCHAR(200),
    srtord_vl     NUMERIC(10,2),
    attr_nm1      VARCHAR(200),
    attr_nm2      VARCHAR(200),
    attr_nm3      VARCHAR(200),
    attr_nm4      VARCHAR(200),
    expln_cn      VARCHAR(2000),
    cd_infw_se_cd VARCHAR(20),
    use_yn        VARCHAR(20)  DEFAULT 'Y',
    rgtr          VARCHAR(20),
    reg_dt        DATE,
    mdfr          VARCHAR(20),
    mdfcn_dt      DATE,
    group_cd      VARCHAR(200),
    col01         VARCHAR(200),
    col02         VARCHAR(200),
    col03         VARCHAR(200),
    col04         VARCHAR(200),
    col05         VARCHAR(200),
    col06         VARCHAR(200),
    col07         VARCHAR(200),
    col08         VARCHAR(200),
    col09         VARCHAR(200),
    status_cd     VARCHAR(20),
    type_cd       VARCHAR(20),
    div_cd        VARCHAR(20),
    kind_cd       VARCHAR(20),
    cate_cds      VARCHAR(100),
    CONSTRAINT pk_zz_sample2 PRIMARY KEY (sample2_id)
);

COMMENT ON TABLE  shopjoy_2604.zz_sample2 IS '다목적 샘플/코드성 데이터 저장소 2';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.sample2_id    IS '샘플2 ID (ZS2+YYMMDDHHmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.cd_grp        IS '도메인 구분 키';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.cd_vl         IS '코드 값';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.cd_nm         IS '코드명 / 대표 텍스트';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.srtord_vl     IS '정렬 순서';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.attr_nm1      IS '속성명1';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.attr_nm2      IS '속성명2';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.attr_nm3      IS '속성명3';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.attr_nm4      IS '속성명4';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.expln_cn      IS '설명 내용';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.cd_infw_se_cd IS '코드 유입 구분 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.use_yn        IS '사용 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.rgtr          IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.reg_dt        IS '등록일';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.mdfr          IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.mdfcn_dt      IS '수정일';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.group_cd      IS '그룹 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col01         IS '범용 컬럼01';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col02         IS '범용 컬럼02';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col03         IS '범용 컬럼03';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col04         IS '범용 컬럼04';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col05         IS '범용 컬럼05';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col06         IS '범용 컬럼06';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col07         IS '범용 컬럼07';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col08         IS '범용 컬럼08';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.col09         IS '범용 컬럼09';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.status_cd     IS '상태 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.type_cd       IS '유형 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.div_cd        IS '구분 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.kind_cd       IS '종류 코드';
COMMENT ON COLUMN shopjoy_2604.zz_sample2.cate_cds      IS '카테고리 코드 목록';
