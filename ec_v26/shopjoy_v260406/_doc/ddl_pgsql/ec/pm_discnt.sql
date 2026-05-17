-- pm_discnt 테이블 DDL
-- 할인정책

CREATE TABLE shopjoy_2604.pm_discnt (
    discnt_id               VARCHAR(21)   NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21)   NOT NULL,
    discnt_nm               VARCHAR(100)  NOT NULL,
    discnt_type_cd          VARCHAR(20)   NOT NULL,
    discnt_target_cd        VARCHAR(20)   DEFAULT 'ALL'::character varying,
    discnt_value            NUMERIC(10,2) DEFAULT 0,
    min_order_amt           BIGINT        DEFAULT 0,
    min_order_qty           INTEGER      ,
    max_discnt_amt          BIGINT       ,
    start_date              TIMESTAMP    ,
    end_date                TIMESTAMP    ,
    discnt_status_cd        VARCHAR(20)   DEFAULT 'ACTIVE'::character varying,
    discnt_status_cd_before VARCHAR(20)  ,
    discnt_desc             TEXT         ,
    mem_grade_cd            VARCHAR(20)  ,
    self_cdiv_rate          NUMERIC(5,2)  DEFAULT 100,
    seller_cdiv_rate        NUMERIC(5,2)  DEFAULT 0,
    dvc_pc_yn               VARCHAR(1)    DEFAULT 'Y'::bpchar,
    dvc_mweb_yn             VARCHAR(1)    DEFAULT 'Y'::bpchar,
    dvc_mapp_yn             VARCHAR(1)    DEFAULT 'Y'::bpchar,
    use_yn                  VARCHAR(1)    DEFAULT 'Y'::bpchar,
    reg_by                  VARCHAR(30)  ,
    reg_date                TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30)  ,
    upd_date                TIMESTAMP    
);

COMMENT ON TABLE  shopjoy_2604.pm_discnt IS '할인정책';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_id IS '할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_nm IS '할인명';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_type_cd IS '할인유형 (코드: DISCNT_TYPE — RATE/FIXED/FREE_SHIP)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_target_cd IS '할인대상 (코드: DISCNT_TARGET — ALL/CATEGORY/PRODUCT/MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_value IS '할인값 (정률이면 %, 정액이면 원)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.min_order_amt IS '최소주문금액';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.min_order_qty IS '최소주문수량 (NULL=제한없음)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.max_discnt_amt IS '최대할인한도 (NULL=무제한)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.start_date IS '할인 시작일시';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.end_date IS '할인 종료일시';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_status_cd IS '상태 (코드: DISCNT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_desc IS '할인 설명';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.mem_grade_cd IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.self_cdiv_rate IS '자사(사이트) 분담율 (%) — 기본 100%';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.seller_cdiv_rate IS '판매자(업체) 분담율 (%) — 기본 0%';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.dvc_pc_yn IS 'PC 채널 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.dvc_mweb_yn IS '모바일WEB 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.dvc_mapp_yn IS '모바일APP 적용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.upd_date IS '수정일';

CREATE INDEX idx_pm_discnt_date ON shopjoy_2604.pm_discnt USING btree (start_date, end_date);
CREATE INDEX idx_pm_discnt_grade ON shopjoy_2604.pm_discnt USING btree (mem_grade_cd);
CREATE INDEX idx_pm_discnt_site ON shopjoy_2604.pm_discnt USING btree (site_id);
CREATE INDEX idx_pm_discnt_status ON shopjoy_2604.pm_discnt USING btree (discnt_status_cd);
