-- zd_meta_domain 테이블 DDL
-- DB메타 — 표준 도메인 (운영지원 > DB메타관리 > 도메인관리)
-- 분류어(컬럼 끝 단어)별로 허용하는 데이터 타입을 정한다. 예: …_amt = bigint, …_yn = varchar(1)
-- 같은 분류어에 도메인을 여러 개 둘 수 있다(예: …_date = date 또는 timestamp) — 표준점검은 그중 하나라도 맞으면 통과.

CREATE TABLE shopjoy_2604.zd_meta_domain (
    domain_id        VARCHAR(21)  NOT NULL CONSTRAINT zd_meta_domain_pk_domain_id PRIMARY KEY,
    reg_site_id      VARCHAR(21)  NOT NULL,
    domain_nm        VARCHAR(100) NOT NULL,
    class_word_abbr  VARCHAR(30) ,
    data_type        VARCHAR(50)  NOT NULL,
    data_len         INTEGER     ,
    data_scale       INTEGER     ,
    domain_desc      VARCHAR(500),
    sort_ord         INTEGER      DEFAULT 0,
    use_yn           VARCHAR(1)   DEFAULT 'Y'::character varying,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    CONSTRAINT zd_meta_domain_uk_domain_nm UNIQUE (domain_nm)
);

COMMENT ON TABLE  shopjoy_2604.zd_meta_domain IS 'DB메타 표준 도메인';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.domain_id IS '도메인ID (MED+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.domain_nm IS '도메인명 예: 금액, 코드, 여부, 일시';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.class_word_abbr IS '분류어 — 이 단어로 끝나는 컬럼에 적용 (zd_meta_word.word_abbr) 예: amt';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.data_type IS '데이터 타입(PostgreSQL) 예: bigint, integer, numeric, varchar, text, date, timestamp';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.data_len IS '길이(varchar) 또는 전체 자릿수(numeric) — 비우면 길이 무관';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.data_scale IS '소수 자릿수(numeric)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.domain_desc IS '설명';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_domain.upd_date IS '수정일시';

CREATE INDEX zd_meta_domain_ix01_class_word_abbr ON shopjoy_2604.zd_meta_domain USING btree (class_word_abbr);
