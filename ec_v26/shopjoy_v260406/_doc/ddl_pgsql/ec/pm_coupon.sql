-- pm_coupon 테이블 DDL
-- 쿠폰

CREATE TABLE shopjoy_2604.pm_coupon (
    coupon_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21) ,
    coupon_cd               VARCHAR(50)  NOT NULL,
    coupon_nm               VARCHAR(100) NOT NULL,
    coupon_type_cd          VARCHAR(20)  NOT NULL,
    discount_rate           NUMERIC(5,2) DEFAULT 0,
    discount_amt            BIGINT       DEFAULT 0,
    min_order_amt           BIGINT       DEFAULT 0,
    min_order_qty           INTEGER     ,
    max_discount_amt        BIGINT      ,
    issue_limit             INTEGER     ,
    issue_cnt               INTEGER      DEFAULT 0,
    max_issue_per_mem       INTEGER     ,
    coupon_desc             TEXT        ,
    valid_from              DATE        ,
    valid_to                DATE        ,
    coupon_status_cd        VARCHAR(20)  DEFAULT 'ACTIVE',
    coupon_status_cd_before VARCHAR(20) ,
    use_yn                  VARCHAR(1)   DEFAULT 'Y',
    target_type_cd          VARCHAR(20) ,
    target_value            VARCHAR(200),
    mem_grade_cd            VARCHAR(20) ,
    self_cdiv_rate          NUMERIC(5,2) DEFAULT 100,
    seller_cdiv_rate        NUMERIC(5,2) DEFAULT 0,
    seller_cdiv_remark      VARCHAR(300),
    dvc_pc_yn               VARCHAR(1)   DEFAULT 'Y',
    dvc_mweb_yn             VARCHAR(1)   DEFAULT 'Y',
    dvc_mapp_yn             VARCHAR(1)   DEFAULT 'Y',
    memo                    TEXT        ,
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_coupon IS '쿠폰';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_id IS '쿠폰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_cd IS '쿠폰코드';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_nm IS '쿠폰명';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_type_cd IS '쿠폰유형 (코드: COUPON_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.discount_rate IS '할인률 (%)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.discount_amt IS '할인금액';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.min_order_amt IS '최소주문금액';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.min_order_qty IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.max_discount_amt IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.issue_limit IS '총발급한도 (NULL=무제한)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.issue_cnt IS '발급된 개수';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.max_issue_per_mem IS '회원당 최대발급수 (NULL=무제한)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_desc IS '쿠폰설명';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.valid_from IS '유효기간 시작';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.valid_to IS '유효기간 종료';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_status_cd IS '상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_status_cd_before IS '변경 전 쿠폰상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.target_type_cd IS '적용대상 (코드: COUPON_TARGET)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.target_value IS '적용대상값';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.mem_grade_cd IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.self_cdiv_rate IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.seller_cdiv_rate IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.seller_cdiv_remark IS '판매자 분담 비고';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.dvc_pc_yn IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.dvc_mweb_yn IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.dvc_mapp_yn IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon.upd_date IS '수정일';

CREATE INDEX idx_pm_coupon_code ON shopjoy_2604.pm_coupon USING btree (coupon_cd);
CREATE INDEX idx_pm_coupon_grade ON shopjoy_2604.pm_coupon USING btree (mem_grade_cd);
CREATE INDEX idx_pm_coupon_status ON shopjoy_2604.pm_coupon USING btree (coupon_status_cd);
CREATE INDEX idx_pm_coupon_type ON shopjoy_2604.pm_coupon USING btree (coupon_type_cd);
CREATE UNIQUE INDEX pm_coupon_coupon_cd_key ON shopjoy_2604.pm_coupon USING btree (coupon_cd);
