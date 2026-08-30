-- md_cb_symbol 테이블 DDL
-- 코바늘 도안 기호 사전 (참조 데이터)

CREATE TABLE shopjoy_2604.md_cb_symbol (
    symbol_id       VARCHAR(21)  NOT NULL CONSTRAINT md_cb_symbol_pk_symbol_id PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    reg_site_id     VARCHAR(21)  NOT NULL,
    symbol_cd       VARCHAR(30)  NOT NULL,
    symbol_nm       VARCHAR(100) NOT NULL,
    symbol_char     VARCHAR(10)  NOT NULL,
    symbol_desc     VARCHAR(300),
    stitch_consume  INTEGER      DEFAULT 1,
    stitch_produce  INTEGER      DEFAULT 1,
    sort_ord        INTEGER      DEFAULT 0,
    use_yn          VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_cb_symbol IS '코바늘 도안 기호 사전 (참조 데이터)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.symbol_id IS '기호ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.symbol_cd IS '기호코드 (UNIQUE, 예: CHAIN/SLIP/SC/HDC/DC/TR/INC/DEC)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.symbol_nm IS '기호명 (한글, 예: 사슬뜨기/짧은뜨기/한길긴뜨기)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.symbol_char IS '격자에 표시할 기호 문자(유니코드 기호 1~2자)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.symbol_desc IS '기호 설명 (뜨는 방법 요약)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.stitch_consume IS '이 기호 1개가 소모하는 전단 코 수 (기본 1, 짧은뜨기2코모아뜨기=2)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.stitch_produce IS '이 기호 1개가 생성하는 코 수 (기본 1, 두길긴뜨기2코=2)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.sort_ord IS '기호 팔레트 표시 정렬순서';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_symbol.upd_date IS '수정일';

CREATE UNIQUE INDEX md_cb_symbol_uk_symbol_cd ON shopjoy_2604.md_cb_symbol USING btree (symbol_cd);
