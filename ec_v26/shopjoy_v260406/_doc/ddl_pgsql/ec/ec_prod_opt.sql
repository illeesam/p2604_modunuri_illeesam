CREATE TABLE ec_prod_opt (
    opt_id      VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    opt_grp_id      VARCHAR(16)     NOT NULL,
    prod_id         VARCHAR(16)     NOT NULL,
    opt_nm      VARCHAR(100)    NOT NULL,               -- 예: 블랙, M, 화이트
    opt_code    VARCHAR(50),                            -- 예: BLACK, SIZE_M
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (opt_id)
);

COMMENT ON TABLE  ec_prod_opt                IS '상품 옵션 값';
COMMENT ON COLUMN ec_prod_opt.opt_id     IS '옵션값ID';
COMMENT ON COLUMN ec_prod_opt.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_opt.opt_grp_id     IS '옵션그룹ID';
COMMENT ON COLUMN ec_prod_opt.prod_id        IS '상품ID';
COMMENT ON COLUMN ec_prod_opt.opt_nm     IS '옵션값명 (예: 블랙, M)';
COMMENT ON COLUMN ec_prod_opt.opt_code   IS '옵션값코드 (예: BLACK, SIZE_M)';
COMMENT ON COLUMN ec_prod_opt.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_prod_opt.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN ec_prod_opt.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt.reg_date       IS '등록일';
COMMENT ON COLUMN ec_prod_opt.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt.upd_date       IS '수정일';

-- 상품 옵션 SKU (옵션 조합별 재고/가격)
-- 옵션 없는 상품: opt_id_1, opt_id_2 모두 NULL
-- 색상만 있는 상품(사이즈 없음): opt_id_1만 설정, opt_id_2 = NULL
-- 색상+사이즈 조합: opt_id_1, opt_id_2 모두 설정
