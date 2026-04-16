CREATE TABLE ec_prod_opt_grp (
    opt_grp_id      VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,
    opt_grp_nm      VARCHAR(50)     NOT NULL,               -- 예: 색상+사이즈 조합
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (opt_grp_id)
);

COMMENT ON TABLE  ec_prod_opt_grp             IS '상품 옵션 그룹 (색상+사이즈 같은 옵션 조합)';
COMMENT ON COLUMN ec_prod_opt_grp.opt_grp_id  IS '옵션그룹ID';
COMMENT ON COLUMN ec_prod_opt_grp.site_id     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_opt_grp.prod_id     IS '상품ID';
COMMENT ON COLUMN ec_prod_opt_grp.opt_grp_nm  IS '옵션그룹명 (예: 색상+사이즈 조합)';
COMMENT ON COLUMN ec_prod_opt_grp.sort_ord    IS '정렬순서';
COMMENT ON COLUMN ec_prod_opt_grp.reg_by      IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt_grp.reg_date    IS '등록일';
COMMENT ON COLUMN ec_prod_opt_grp.upd_by      IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt_grp.upd_date    IS '수정일';

-- 상품 옵션 값 (예: 블랙, M)
