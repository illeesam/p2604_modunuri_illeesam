-- pm_gift 테이블 DDL
-- 사은품

CREATE TABLE shopjoy_2604.pm_gift (
    gift_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id               VARCHAR(21)  NOT NULL,
    gift_nm               VARCHAR(100) NOT NULL,
    gift_type_cd          VARCHAR(20)  DEFAULT 'PRODUCT'::character varying,
    prod_id               VARCHAR(21) ,
    gift_stock            INTEGER      DEFAULT 0,
    gift_desc             TEXT        ,
    start_date            TIMESTAMP   ,
    end_date              TIMESTAMP   ,
    gift_status_cd        VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    gift_status_cd_before VARCHAR(20) ,
    mem_grade_cd          VARCHAR(20) ,
    min_order_amt         BIGINT       DEFAULT 0,
    min_order_qty         INTEGER     ,
    self_cdiv_rate        NUMERIC(5,2) DEFAULT 100,
    seller_cdiv_rate      NUMERIC(5,2) DEFAULT 0,
    use_yn                VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_gift IS '사은품';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_id IS '사은품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_nm IS '사은품명';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_type_cd IS '사은품유형 (코드: GIFT_TYPE — PRODUCT/SAMPLE/ETC)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.prod_id IS '연결 상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_stock IS '사은품 재고';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_desc IS '사은품 설명';
COMMENT ON COLUMN shopjoy_2604.pm_gift.start_date IS '시작일시';
COMMENT ON COLUMN shopjoy_2604.pm_gift.end_date IS '종료일시';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_status_cd IS '상태 (코드: GIFT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.gift_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.pm_gift.mem_grade_cd IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.min_order_amt IS '최소주문금액 — 사은품 지급 기준 금액';
COMMENT ON COLUMN shopjoy_2604.pm_gift.min_order_qty IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN shopjoy_2604.pm_gift.self_cdiv_rate IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN shopjoy_2604.pm_gift.seller_cdiv_rate IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN shopjoy_2604.pm_gift.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_gift.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_gift.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_gift.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_gift.upd_date IS '수정일';

CREATE INDEX idx_pm_gift_grade ON shopjoy_2604.pm_gift USING btree (mem_grade_cd);
CREATE INDEX idx_pm_gift_site ON shopjoy_2604.pm_gift USING btree (site_id);
CREATE INDEX idx_pm_gift_status ON shopjoy_2604.pm_gift USING btree (gift_status_cd);
