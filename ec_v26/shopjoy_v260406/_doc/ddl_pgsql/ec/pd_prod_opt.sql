-- pd_prod_opt 테이블 DDL
-- 상품 옵션 값 (빨강, M 등 실제 선택 가능한 값)
-- 구 테이블명: pd_prod_opt_item (2026-07-12 rename)

CREATE TABLE shopjoy_2604.pd_prod_opt (
    prod_opt_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21)  NOT NULL,
    prod_id            VARCHAR(21)  NOT NULL,
    prod_opt_type_id   VARCHAR(21)  NOT NULL,
    prod_opt_nm        VARCHAR(100) NOT NULL,
    prod_opt_val       VARCHAR(50),
    opt_val_code_id    VARCHAR(50),
    parent_prod_opt_id VARCHAR(21),
    sort_ord           INTEGER      DEFAULT 0,
    use_yn             VARCHAR(1)   DEFAULT 'Y'::bpchar,
    opt_style          VARCHAR(200),
    reg_by             VARCHAR(30),
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30),
    upd_date           TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_opt IS '상품 옵션 값 (빨강, M 등 실제 선택 가능한 값)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.prod_opt_id IS '옵션값ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.prod_id IS '상품ID (pd_prod.prod_id) — 비정규화 캐시 컬럼';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.prod_opt_type_id IS '옵션유형ID (pd_prod_opt_type.prod_opt_type_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.prod_opt_nm IS '옵션항목명 (예: 빨강, M)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.prod_opt_val IS '실제 저장값 — opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.opt_val_code_id IS 'OPT_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 prod_opt_val 직접입력';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.parent_prod_opt_id IS '상위 옵션값ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt.prod_opt_id), NULL이면 독립값';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.opt_style IS '옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열). 비어 있으면 표시명 텍스트만 사용';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.upd_date IS '수정일시';

CREATE INDEX idx_pd_prod_opt_opt_type ON shopjoy_2604.pd_prod_opt USING btree (prod_opt_type_id);
CREATE INDEX idx_pd_prod_opt_prod ON shopjoy_2604.pd_prod_opt USING btree (prod_id);
CREATE INDEX idx_pd_prod_opt_parent ON shopjoy_2604.pd_prod_opt USING btree (parent_prod_opt_id);
CREATE INDEX idx_pd_prod_opt_site ON shopjoy_2604.pd_prod_opt USING btree (site_id);
