-- pdh_prod_view_log 테이블 DDL
-- 상품/페이지 조회 로그

CREATE TABLE shopjoy_2604.pdh_prod_view_log (
    log_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id     VARCHAR(21) ,
    member_id   VARCHAR(21) ,
    session_key VARCHAR(100),
    prod_id     VARCHAR(21)  NOT NULL,
    ref_id      VARCHAR(21) ,
    ref_nm      VARCHAR(200),
    search_kw   VARCHAR(200),
    ip          VARCHAR(50) ,
    device      VARCHAR(200),
    referrer    VARCHAR(500),
    view_date   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by      VARCHAR(30) ,
    reg_date    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30) ,
    upd_date    TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pdh_prod_view_log IS '상품/페이지 조회 로그';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.member_id IS '회원ID (비회원 NULL)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.session_key IS '비회원 세션키';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.ref_id IS '참조ID (prod_id 등)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.ref_nm IS '참조명 스냅샷';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.search_kw IS '검색어 (SEARCH 유형)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.ip IS 'IP주소';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.device IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.referrer IS '유입경로 URL';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.view_date IS '조회일시';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_view_log.upd_date IS '수정일';

CREATE INDEX idx_ec_pvl_date ON shopjoy_2604.pdh_prod_view_log USING btree (view_date);
CREATE INDEX idx_ec_pvl_member ON shopjoy_2604.pdh_prod_view_log USING btree (member_id);
CREATE INDEX idx_ec_pvl_ref ON shopjoy_2604.pdh_prod_view_log USING btree (prod_id, ref_id);
