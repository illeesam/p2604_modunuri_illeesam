CREATE TABLE ec_prod_opt (
    opt_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    opt_grp_id      VARCHAR(16)     NOT NULL,
    prod_id         VARCHAR(16)     NOT NULL,
    opt_seq         INTEGER         NOT NULL,              -- 옵션 순서 (1=색상, 2=사이즈 등)
    opt_type_nm     VARCHAR(50)     NOT NULL,              -- 옵션 종류명 (예: 색상, 사이즈)
    opt_level       INTEGER         DEFAULT 1,             -- 옵션 레벨 (같은 opt_seq 내에서의 깊이)
    opt_nm          VARCHAR(100)    NOT NULL,              -- 옵션값명 (예: 빨강, M, 파랑)
    opt_code        VARCHAR(50),                           -- 옵션값코드 (예: RED, SIZE_M, BLUE)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (opt_id)
);

COMMENT ON TABLE  ec_prod_opt                IS '상품 옵션 값 (구조: 옵션그룹→옵션순서→옵션값)';
COMMENT ON COLUMN ec_prod_opt.opt_id         IS '옵션값ID';
COMMENT ON COLUMN ec_prod_opt.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_opt.opt_grp_id     IS '옵션그룹ID';
COMMENT ON COLUMN ec_prod_opt.prod_id        IS '상품ID';
COMMENT ON COLUMN ec_prod_opt.opt_seq        IS '옵션 순서 (1=색상, 2=사이즈 등)';
COMMENT ON COLUMN ec_prod_opt.opt_type_nm    IS '옵션 종류명 (예: 색상, 사이즈, 무게)';
COMMENT ON COLUMN ec_prod_opt.opt_level      IS '옵션 레벨 (같은 opt_seq 내에서의 계층)';
COMMENT ON COLUMN ec_prod_opt.opt_nm         IS '옵션값명 (예: 빨강, M, XX)';
COMMENT ON COLUMN ec_prod_opt.opt_code       IS '옵션값코드 (예: RED, SIZE_M, SIZE_XX)';
COMMENT ON COLUMN ec_prod_opt.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_prod_opt.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN ec_prod_opt.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_prod_opt.reg_date       IS '등록일';
COMMENT ON COLUMN ec_prod_opt.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_prod_opt.upd_date       IS '수정일';

-- 구조 예시:
-- 옵션 그룹 (opt_grp_id = 'GRP-001')
--   ├─ opt_seq=1, opt_type_nm='색상'
--   │   ├─ opt_level=1, opt_nm='빨강', opt_code='RED'
--   │   ├─ opt_level=2, opt_nm='파랑', opt_code='BLUE'
--   │   └─ opt_level=3, opt_nm='녹색', opt_code='GREEN'
--   └─ opt_seq=2, opt_type_nm='사이즈'
--       ├─ opt_level=1, opt_nm='S', opt_code='SIZE_S'
--       ├─ opt_level=2, opt_nm='M', opt_code='SIZE_M'
--       └─ opt_level=3, opt_nm='L', opt_code='SIZE_L'
--
-- SKU 조합 (ec_prod_sku 테이블)
-- 옵션 없는 상품: opt_id_1=NULL, opt_id_2=NULL, opt_id_3=NULL
-- 색상만: opt_id_1=색상옵션ID, opt_id_2=NULL, opt_id_3=NULL
-- 색상+사이즈: opt_id_1=색상ID, opt_id_2=사이즈ID, opt_id_3=NULL
