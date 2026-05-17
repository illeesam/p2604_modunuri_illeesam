-- pdh_prod_content_chg_hist 테이블 DDL
-- 상품 컨텐츠 변경 이력

CREATE TABLE shopjoy_2604.pdh_prod_content_chg_hist (
    hist_id         VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    prod_id         VARCHAR(21)  NOT NULL,
    prod_content_id VARCHAR(21)  NOT NULL,
    content_type_cd VARCHAR(50) ,
    content_before  TEXT        ,
    content_after   TEXT        ,
    chg_reason      VARCHAR(200),
    chg_user_id     VARCHAR(21) ,
    chg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pdh_prod_content_chg_hist IS '상품 컨텐츠 변경 이력';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.hist_id IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.prod_content_id IS '상품컨텐츠ID (pd_prod_content.)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.content_type_cd IS '컨텐츠유형코드 (상세설명, 사용설명, 배송정보 등)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.content_before IS '변경전 HTML 컨텐츠';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.content_after IS '변경후 HTML 컨텐츠';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.chg_reason IS '변경사유 (예: 내용 오류 수정, 계절 업데이트)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.chg_user_id IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.chg_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_content_chg_hist.upd_date IS '수정일';

CREATE INDEX idx_pdh_prod_content_chg_hist_prod ON shopjoy_2604.pdh_prod_content_chg_hist USING btree (prod_id, chg_date DESC);
CREATE INDEX idx_pdh_prod_content_chg_hist_site ON shopjoy_2604.pdh_prod_content_chg_hist USING btree (site_id);
