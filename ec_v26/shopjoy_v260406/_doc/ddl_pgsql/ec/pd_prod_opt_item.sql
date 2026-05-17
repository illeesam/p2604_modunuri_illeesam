-- pd_prod_opt_item 테이블 DDL
-- 상품 옵션 값

CREATE TABLE shopjoy_2604.pd_prod_opt_item (
    opt_item_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21)  NOT NULL,
    opt_id             VARCHAR(21)  NOT NULL,
    opt_type_cd        VARCHAR(20)  NOT NULL,
    opt_nm             VARCHAR(100) NOT NULL,
    opt_val            VARCHAR(50) ,
    opt_val_code_id    VARCHAR(50) ,
    parent_opt_item_id VARCHAR(21) ,
    sort_ord           INTEGER      DEFAULT 0,
    use_yn             VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   ,
    opt_style          VARCHAR(200)
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_opt_item IS '상품 옵션 값';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_item_id IS '옵션값ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_id IS '옵션ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_type_cd IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_nm IS '옵션값 표시명 (예: 빨강, M)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_val IS '실제 저장값 — opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_val_code_id IS 'OPT_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 opt_val 직접입력';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.parent_opt_item_id IS '상위 옵션값ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt_item.opt_item_id), NULL이면 독립값(전체 공통)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_style IS '옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열). 비어 있으면 표시명 텍스트만 사용';

CREATE INDEX idx_pd_prod_opt_item_opt ON shopjoy_2604.pd_prod_opt_item USING btree (opt_id);
CREATE INDEX idx_pd_prod_opt_item_parent ON shopjoy_2604.pd_prod_opt_item USING btree (parent_opt_item_id);
CREATE INDEX idx_pd_prod_opt_item_site ON shopjoy_2604.pd_prod_opt_item USING btree (site_id);
