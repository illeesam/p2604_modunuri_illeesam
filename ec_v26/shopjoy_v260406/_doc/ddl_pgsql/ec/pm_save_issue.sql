-- pm_save_issue 테이블 DDL
-- 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)

CREATE TABLE shopjoy_2604.pm_save_issue (
    save_issue_id          VARCHAR(21)  NOT NULL CONSTRAINT pm_save_issue_pk_save_issue_id PRIMARY KEY,
    reg_site_id                VARCHAR(21)  NOT NULL,
    member_id              VARCHAR(21)  NOT NULL,
    save_issue_type_cd     VARCHAR(20)  NOT NULL,
    save_amt               BIGINT       NOT NULL,
    save_rate              NUMERIC(5,2),
    ref_type_cd            VARCHAR(20) ,
    ref_id                 VARCHAR(21) ,
    order_id               VARCHAR(21) ,
    order_item_id          VARCHAR(21) ,
    prod_id                VARCHAR(21) ,
    expire_date            TIMESTAMP   ,
    issue_status_cd        VARCHAR(20)  DEFAULT 'PENDING'::character varying,
    issue_status_cd_before VARCHAR(20) ,
    save_memo              VARCHAR(300),
    reg_by                 VARCHAR(30) ,
    reg_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30) ,
    upd_date               TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_save_issue IS '적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.save_issue_id IS '적립지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.save_issue_type_cd IS '지급유형 (코드: SAVE_ISSUE_TYPE — ORDER/EVENT/REVIEW/REFERRAL/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.save_amt IS '지급 적립금액';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.save_rate IS '적립률 (%, 구매적립 시)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.ref_type_cd IS '참조유형 (ORDER/EVENT/REVIEW/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.ref_id IS '참조ID (order_id / event_id 등)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.order_id IS '주문ID (od_order.order_id, 구매적립 시)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.order_item_id IS '주문상품ID (od_order_item.order_item_id, 상품별 적립 시)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.prod_id IS '상품ID (pd_prod.prod_id, 적립 기준 상품)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.expire_date IS '소멸예정일';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.issue_status_cd IS '지급상태 (코드: SAVE_ISSUE_STATUS — PENDING/CONFIRMED/EXPIRED/CANCELED)';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.issue_status_cd_before IS '변경 전 지급상태';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.save_memo IS '지급 메모';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_save_issue.upd_date IS '수정일';

CREATE INDEX pm_save_issue_ix01_expire_date ON shopjoy_2604.pm_save_issue USING btree (expire_date);
CREATE INDEX pm_save_issue_ix05_order_item_id ON shopjoy_2604.pm_save_issue USING btree (order_item_id);
CREATE INDEX pm_save_issue_ix03_member_id ON shopjoy_2604.pm_save_issue USING btree (member_id);
CREATE INDEX pm_save_issue_ix04_order_id ON shopjoy_2604.pm_save_issue USING btree (order_id);
CREATE INDEX pm_save_issue_ix02_issue_status_cd ON shopjoy_2604.pm_save_issue USING btree (issue_status_cd);
CREATE INDEX pm_save_issue_ix08_save_issue_type_cd ON shopjoy_2604.pm_save_issue USING btree (save_issue_type_cd);
CREATE INDEX pm_save_issue_ix06_prod_id ON shopjoy_2604.pm_save_issue USING btree (prod_id);
CREATE INDEX pm_save_issue_ix07_ref_id ON shopjoy_2604.pm_save_issue USING btree (ref_id);
