-- ============================================================
-- migration: zz_sample 테이블 Entity 정합 정렬
--
-- 사유: validate 프로파일에서 Entity ↔ DB 스키마 불일치 발견.
--       샘플 테이블이므로 데이터 보존 없이 Entity 기준으로 DB 정렬.
-- 적용일: 2026-05-05
-- ============================================================

-- ── zz_sample0: 운영 DB 테이블이 DDL과 너무 어긋나 재구축 ─────
-- (보존할 데이터 없음 확인됨)
DROP TABLE IF EXISTS shopjoy_2604.zz_sample0;

CREATE TABLE shopjoy_2604.zz_sample0 (
    sample0_id    VARCHAR(20)  NOT NULL PRIMARY KEY,
    sample_name   VARCHAR(100),
    sample_desc   TEXT,
    sample_value  VARCHAR(255),
    sort_ord      INTEGER DEFAULT 0,
    use_yn        VARCHAR(1) DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    col01         VARCHAR(200),
    col02         VARCHAR(200),
    col03         VARCHAR(200),
    col04         VARCHAR(200),
    col05         VARCHAR(200),
    col06         VARCHAR(200),
    col07         VARCHAR(200),
    col08         VARCHAR(200),
    col09         VARCHAR(200),
    reg_by        VARCHAR(50),
    reg_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(50),
    upd_date      TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.zz_sample0 IS 'ZzSample0 - 샘플 데이터 관리 테이블 0';

-- ── zz_sample1: 사전 정렬 (운영 DB 기존 정의가 어긋날 가능성 대비) ─
DROP TABLE IF EXISTS shopjoy_2604.zz_sample1;

CREATE TABLE shopjoy_2604.zz_sample1 (
    sample1_id    VARCHAR(20)  NOT NULL,
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
    CONSTRAINT pk_zz_sample1 PRIMARY KEY (sample1_id)
);

COMMENT ON TABLE  shopjoy_2604.zz_sample1 IS '다목적 샘플/코드성 데이터 저장소 1';

-- ── zz_sample2: Entity가 ZzSample1 형태로 정의되어 있음. 재구축 ─
-- (보존할 데이터 없음 확인됨)
DROP TABLE IF EXISTS shopjoy_2604.zz_sample2;

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
