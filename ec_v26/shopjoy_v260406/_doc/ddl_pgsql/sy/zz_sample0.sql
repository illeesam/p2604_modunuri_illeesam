-- zz_sample0 테이블 DDL
-- 샘플 데이터 0: 기본 정보 관리

CREATE TABLE shopjoy_2604.zz_sample0 (
    sample0_id        VARCHAR(20) NOT NULL PRIMARY KEY,
    sample_name       VARCHAR(100),
    sample_desc       TEXT,
    sample_value      VARCHAR(255),
    sort_ord          INTEGER DEFAULT 0,
    use_yn            VARCHAR(1) DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    col01             VARCHAR(200),
    col02             VARCHAR(200),
    col03             VARCHAR(200),
    col04             VARCHAR(200),
    col05             VARCHAR(200),
    col06             VARCHAR(200),
    col07             VARCHAR(200),
    col08             VARCHAR(200),
    col09             VARCHAR(200),
    reg_by            VARCHAR(50),
    reg_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(50),
    upd_date          TIMESTAMP
);

COMMENT ON TABLE shopjoy_2604.zz_sample0 IS 'ZzSample0 - 샘플 데이터 관리 테이블 0';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.sample0_id IS '샘플0 ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.sample_name IS '샘플 이름';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.sample_desc IS '샘플 설명';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.sample_value IS '샘플 값';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.sort_ord IS '정렬 순서';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.use_yn IS '사용 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col01 IS '범용 컬럼01';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col02 IS '범용 컬럼02';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col03 IS '범용 컬럼03';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col04 IS '범용 컬럼04';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col05 IS '범용 컬럼05';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col06 IS '범용 컬럼06';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col07 IS '범용 컬럼07';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col08 IS '범용 컬럼08';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.col09 IS '범용 컬럼09';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.reg_date IS '등록 날짜';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zz_sample0.upd_date IS '수정 날짜';
