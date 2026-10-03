-- zd_meta_word 테이블 DDL
-- DB메타 — 표준 단어사전 (운영지원 > DB메타관리 > 단어사전관리)
-- 컬럼명을 '_' 로 나눈 각 조각(영문약어)이 무슨 뜻인지 정의한다. 예: amt = 금액, cd = 코드

CREATE TABLE shopjoy_2604.zd_meta_word (
    word_id        VARCHAR(21)  NOT NULL CONSTRAINT zd_meta_word_pk_word_id PRIMARY KEY,
    reg_site_id    VARCHAR(21)  NOT NULL,
    word_nm        VARCHAR(100) NOT NULL,
    word_abbr      VARCHAR(30)  NOT NULL,
    word_eng_nm    VARCHAR(100),
    word_type_cd   VARCHAR(20)  DEFAULT 'GENERAL'::character varying,
    synonym_abbrs  VARCHAR(300),
    word_desc      VARCHAR(500),
    use_yn         VARCHAR(1)   DEFAULT 'Y'::character varying,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    CONSTRAINT zd_meta_word_uk_word_abbr UNIQUE (word_abbr)
);

COMMENT ON TABLE  shopjoy_2604.zd_meta_word IS 'DB메타 표준 단어사전';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_id IS '단어ID (MEW+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_nm IS '단어명(한글) 예: 금액';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_abbr IS '영문약어 — 컬럼명에 쓰는 형태(소문자) 예: amt';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_eng_nm IS '영문명(풀네임) 예: amount';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_type_cd IS '단어유형 — GENERAL:일반어, CLASS:분류어(컬럼 끝에 와서 데이터 성격을 정함: id, cd, nm, yn, amt, date …)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.synonym_abbrs IS '같은 뜻의 비표준 약어(쉼표 구분) 예: cnt 의 동의어 count — 표준점검에서 이 약어를 쓴 컬럼을 찾아낸다';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.word_desc IS '설명';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_word.upd_date IS '수정일시';

CREATE INDEX zd_meta_word_ix01_word_nm ON shopjoy_2604.zd_meta_word USING btree (word_nm);
