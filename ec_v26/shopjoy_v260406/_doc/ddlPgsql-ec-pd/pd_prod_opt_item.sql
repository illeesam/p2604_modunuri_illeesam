CREATE TABLE pd_prod_opt_item (
    opt_item_id     VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    opt_id          VARCHAR(16)     NOT NULL,              -- pd_prod_opt.opt_id
    opt_type_cd     VARCHAR(20)     NOT NULL,              -- 코드: OPT_TYPE (COLOR/SIZE/MATERIAL/CUSTOM)
    opt_nm          VARCHAR(100)    NOT NULL,              -- 옵션값 표시명 (예: 빨강, M)
    opt_val         VARCHAR(50),                           -- OPT_VAL 공통코드 참조 (NULL이면 직접입력)
    opt_cd          VARCHAR(50),                           -- 실제 저장 코드 (NULL이면 opt_val이 코드)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (opt_item_id)
);

COMMENT ON TABLE pd_prod_opt_item IS '상품 옵션 값';
COMMENT ON COLUMN pd_prod_opt_item.opt_item_id IS '옵션값ID';
COMMENT ON COLUMN pd_prod_opt_item.site_id     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_id      IS '옵션ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_type_cd IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN pd_prod_opt_item.opt_nm      IS '옵션값 표시명 (예: 빨강, M)';
COMMENT ON COLUMN pd_prod_opt_item.opt_val     IS 'OPT_VAL 공통코드 참조 — NULL이면 직접입력(CUSTOM)';
COMMENT ON COLUMN pd_prod_opt_item.opt_cd      IS '실제 저장 코드 — NULL이면 opt_val을 코드로 사용, 값이 있으면 커스텀 코드';
COMMENT ON COLUMN pd_prod_opt_item.sort_ord    IS '정렬순서';
COMMENT ON COLUMN pd_prod_opt_item.use_yn      IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_opt_item.reg_by      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.reg_date    IS '등록일';
COMMENT ON COLUMN pd_prod_opt_item.upd_by      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.upd_date    IS '수정일';

-- ============================================================
-- 유효코드 결정 규칙: opt_cd ?? opt_val  (opt_cd 우선, 없으면 opt_val 사용)
-- opt_val=NULL, opt_cd=NULL 는 허용하지 않음 (앱에서 검증)
-- ============================================================

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상+사이즈 2단 옵션)
-- pd_prod_opt: OPT001=색상, OPT002=사이즈
-- ============================================================
-- prod_id='P001'
--   ├─ opt_id='OPT001' (COLOR, opt_level=1)
--   │   ├─ opt_item_id='ITEM001', sort_ord=1, opt_nm='블랙',     opt_val='BLACK', opt_cd=NULL       → 유효코드: BLACK     (프리셋)
--   │   ├─ opt_item_id='ITEM002', sort_ord=2, opt_nm='화이트',   opt_val='WHITE', opt_cd=NULL       → 유효코드: WHITE     (프리셋)
--   │   └─ opt_item_id='ITEM003', sort_ord=3, opt_nm='딥네이비', opt_val='NAVY',  opt_cd='DEEP_NAVY' → 유효코드: DEEP_NAVY (프리셋+커스텀코드)
--   └─ opt_id='OPT002' (SIZE, opt_level=2)
--       ├─ opt_item_id='ITEM004', sort_ord=1, opt_nm='S', opt_val='S', opt_cd=NULL → 유효코드: S
--       ├─ opt_item_id='ITEM005', sort_ord=2, opt_nm='M', opt_val='M', opt_cd=NULL → 유효코드: M
--       └─ opt_item_id='ITEM006', sort_ord=3, opt_nm='L', opt_val='L', opt_cd=NULL → 유효코드: L
