CREATE TABLE pd_prod_opt (
    opt_id            VARCHAR(21)     NOT NULL,
    site_id           VARCHAR(21),                            -- sy_site.site_id
    prod_id           VARCHAR(21)     NOT NULL,
    opt_grp_nm        VARCHAR(50)     NOT NULL,               -- 예: 색상, 사이즈
    opt_level         INTEGER         NOT NULL DEFAULT 1,     -- 옵션 차원 순서 (1=첫번째, 2=두번째)
    opt_type_cd       VARCHAR(20),                            -- 코드: OPT_TYPE (COLOR/SIZE/MATERIAL/CUSTOM)
    opt_input_type_cd VARCHAR(20)     DEFAULT 'SELECT',       -- 코드: OPT_INPUT_TYPE (SELECT/SELECT_INPUT/MULTI_SELECT)
    sort_ord          INTEGER         DEFAULT 0,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    PRIMARY KEY (opt_id)
);

COMMENT ON TABLE pd_prod_opt IS '상품 옵션 (색상, 사이즈 등 옵션 차원)';
COMMENT ON COLUMN pd_prod_opt.opt_id            IS '옵션ID';
COMMENT ON COLUMN pd_prod_opt.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_opt.prod_id           IS '상품ID';
COMMENT ON COLUMN pd_prod_opt.opt_grp_nm        IS '옵션명 (예: 색상, 사이즈)';
COMMENT ON COLUMN pd_prod_opt.opt_level         IS '옵션 차원 순서 — 1=첫번째(색상), 2=두번째(사이즈)';
COMMENT ON COLUMN pd_prod_opt.opt_type_cd       IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN pd_prod_opt.opt_input_type_cd IS '옵션입력방식 (코드: OPT_INPUT_TYPE — SELECT/SELECT_INPUT/MULTI_SELECT)';
COMMENT ON COLUMN pd_prod_opt.sort_ord          IS '정렬순서';
COMMENT ON COLUMN pd_prod_opt.reg_by            IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt.reg_date          IS '등록일';
COMMENT ON COLUMN pd_prod_opt.upd_by            IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt.upd_date          IS '수정일';

-- 상품 옵션 항목 (예: 빨강, M) → pd_prod_opt_item

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상+사이즈 2단 옵션)
-- ============================================================
-- prod_id='P001'
--   ├─ opt_id='OPT001', opt_level=1, opt_type_cd='COLOR', opt_grp_nm='색상',   opt_input_type_cd='SELECT'
--   └─ opt_id='OPT002', opt_level=2, opt_type_cd='SIZE',  opt_grp_nm='사이즈', opt_input_type_cd='SELECT'
