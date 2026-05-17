-- pm_event_benefit 테이블 DDL
-- 이벤트 혜택

CREATE TABLE shopjoy_2604.pm_event_benefit (
    benefit_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    event_id        VARCHAR(21)  NOT NULL,
    benefit_nm      VARCHAR(100) NOT NULL,
    benefit_type_cd VARCHAR(20) ,
    condition_desc  VARCHAR(200),
    benefit_value   VARCHAR(100),
    coupon_id       VARCHAR(21) ,
    sort_ord        INTEGER      DEFAULT 0,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_event_benefit IS '이벤트 혜택';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.benefit_id IS '혜택ID';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.event_id IS '이벤트ID';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.benefit_nm IS '혜택명';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.benefit_type_cd IS '혜택유형 (코드: BENEFIT_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.condition_desc IS '조건 설명';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.benefit_value IS '혜택 값';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.coupon_id IS '연결 쿠폰ID';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_benefit.upd_date IS '수정일';

CREATE INDEX idx_pm_event_benefit_event ON shopjoy_2604.pm_event_benefit USING btree (event_id);
CREATE INDEX idx_pm_event_benefit_site ON shopjoy_2604.pm_event_benefit USING btree (site_id);
