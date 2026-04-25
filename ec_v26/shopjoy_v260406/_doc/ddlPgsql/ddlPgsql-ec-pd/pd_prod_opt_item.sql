CREATE TABLE pd_prod_opt_item (
    opt_item_id         VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    opt_id              VARCHAR(21)     NOT NULL,               -- pd_prod_opt.opt_id
    opt_type_cd         VARCHAR(20)     NOT NULL,               -- 코드: OPT_TYPE (COLOR/SIZE/MATERIAL/CUSTOM)
    opt_nm              VARCHAR(100)    NOT NULL,               -- 옵션값 표시명 (예: 빨강, M)
    opt_val             VARCHAR(50),                            -- 실제 저장값 (opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력 가능)
    opt_val_code_id     VARCHAR(50),                            -- OPT_VAL 공통코드 참조ID (sy_code.code_id, NULL이면 직접입력)
    parent_opt_item_id  VARCHAR(21),                            -- 상위 옵션값ID (2단 옵션에서 1단 값 참조, pd_prod_opt_item.opt_item_id)
    sort_ord            INTEGER         DEFAULT 0,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (opt_item_id)
);

COMMENT ON TABLE pd_prod_opt_item IS '상품 옵션 값';
COMMENT ON COLUMN pd_prod_opt_item.opt_item_id        IS '옵션값ID';
COMMENT ON COLUMN pd_prod_opt_item.site_id            IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_id             IS '옵션ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN pd_prod_opt_item.opt_type_cd        IS '옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)';
COMMENT ON COLUMN pd_prod_opt_item.opt_nm             IS '옵션값 표시명 (예: 빨강, M)';
COMMENT ON COLUMN pd_prod_opt_item.opt_val            IS '실제 저장값 — opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용';
COMMENT ON COLUMN pd_prod_opt_item.opt_val_code_id    IS 'OPT_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 opt_val 직접입력';
COMMENT ON COLUMN pd_prod_opt_item.parent_opt_item_id IS '상위 옵션값ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt_item.opt_item_id), NULL이면 독립값(전체 공통)';
COMMENT ON COLUMN pd_prod_opt_item.sort_ord           IS '정렬순서';
COMMENT ON COLUMN pd_prod_opt_item.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_opt_item.reg_by             IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.reg_date           IS '등록일';
COMMENT ON COLUMN pd_prod_opt_item.upd_by             IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_opt_item.upd_date           IS '수정일';

CREATE INDEX idx_pd_prod_opt_item_opt    ON pd_prod_opt_item (opt_id);
CREATE INDEX idx_pd_prod_opt_item_parent ON pd_prod_opt_item (parent_opt_item_id);

-- ============================================================
-- 값 결정 규칙
-- opt_val_code_id 선택 시 → opt_val = 해당 코드의 codeValue (자동 채움)
-- opt_val_code_id = NULL  → opt_val = 직접입력값 (CUSTOM 또는 임의 문자열)
-- opt_val 은 항상 실제 저장값; opt_val=NULL 는 허용하지 않음 (앱에서 검증)
-- ============================================================

-- ============================================================
-- parent_opt_item_id 사용 규칙
-- ============================================================
-- 1단 옵션 항목: parent_opt_item_id = NULL (상위 없음)
-- 2단 옵션 항목: parent_opt_item_id = NULL   → 어떤 1단 값과도 조합 가능 (전체 공통)
--              parent_opt_item_id = ITEM001  → ITEM001(블랙) 선택 시에만 이 2단 값 노출
-- 예: 색상(블랙)에서는 S/M/L 사이즈만, 색상(화이트)에서는 S/L 사이즈만 제공할 때 사용
-- ============================================================

-- ============================================================
-- 데이터 예제 (상품 P001 — 티셔츠, 색상+사이즈 2단 옵션)
-- pd_prod_opt: OPT001=색상(level=1), OPT002=사이즈(level=2)
-- ============================================================
-- prod_id='P001'
--   ├─ opt_id='OPT001' (COLOR, opt_level=1)
--   │   ├─ opt_item_id='ITEM001', opt_nm='블랙',     opt_val='BLACK', opt_val_code_id=NULL,          parent_opt_item_id=NULL → 저장값: BLACK
--   │   ├─ opt_item_id='ITEM002', opt_nm='화이트',   opt_val='WHITE', opt_val_code_id=NULL,          parent_opt_item_id=NULL → 저장값: WHITE
--   │   └─ opt_item_id='ITEM003', opt_nm='딥네이비', opt_val='NAVY',  opt_val_code_id='DEEP_NAVY',   parent_opt_item_id=NULL → 저장값: NAVY
--   └─ opt_id='OPT002' (SIZE, opt_level=2)
--       ├─ opt_item_id='ITEM004', opt_nm='S', opt_val='S', opt_val_code_id=NULL, parent_opt_item_id=NULL  → 전체 색상 공통
--       ├─ opt_item_id='ITEM005', opt_nm='M', opt_val='M', opt_val_code_id=NULL, parent_opt_item_id=NULL  → 전체 색상 공통
--       └─ opt_item_id='ITEM006', opt_nm='L', opt_val='L', opt_val_code_id=NULL, parent_opt_item_id='ITEM001' → 블랙만 L 사이즈 제공
