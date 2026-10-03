-- zd_meta_term 테이블 DDL
-- DB메타 — 표준 용어사전 (운영지원 > DB메타관리 > 용어사전관리)
-- 업무 용어(한글)와 그 용어를 쓰는 표준 컬럼명을 짝지어 둔다. 예: 주문수량 = order_qty (도메인: 수량)

CREATE TABLE shopjoy_2604.zd_meta_term (
    term_id        VARCHAR(21)  NOT NULL CONSTRAINT zd_meta_term_pk_term_id PRIMARY KEY,
    reg_site_id    VARCHAR(21)  NOT NULL,
    term_nm        VARCHAR(200) NOT NULL,
    col_nm         VARCHAR(100) NOT NULL,
    domain_id      VARCHAR(21) ,
    term_desc      VARCHAR(500),
    use_yn         VARCHAR(1)   DEFAULT 'Y'::character varying,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    CONSTRAINT zd_meta_term_uk_col_nm UNIQUE (col_nm)
);

COMMENT ON TABLE  shopjoy_2604.zd_meta_term IS 'DB메타 표준 용어사전';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.term_id IS '용어ID (MET+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.term_nm IS '용어명(한글) 예: 주문수량';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.col_nm IS '표준 컬럼명(소문자 snake_case) 예: order_qty';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.domain_id IS '도메인ID (zd_meta_domain.domain_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.term_desc IS '설명';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_term.upd_date IS '수정일시';

CREATE INDEX zd_meta_term_ix01_term_nm ON shopjoy_2604.zd_meta_term USING btree (term_nm);
CREATE INDEX zd_meta_term_ix02_domain_id ON shopjoy_2604.zd_meta_term USING btree (domain_id);
