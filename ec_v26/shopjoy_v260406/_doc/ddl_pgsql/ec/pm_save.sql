-- pm_save 테이블 DDL
-- 마일리지 적립/사용 이력

CREATE TABLE shopjoy_2604.pm_save (
    save_id      VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id      VARCHAR(21),
    member_id    VARCHAR(21) NOT NULL,
    save_type_cd VARCHAR(20) NOT NULL,
    save_amt     BIGINT      NOT NULL,
    balance_amt  BIGINT      DEFAULT 0,
    ref_type_cd  VARCHAR(30),
    ref_id       VARCHAR(21),
    expire_date  TIMESTAMP  ,
    save_memo    TEXT       ,
    reg_by       VARCHAR(30),
    reg_date     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30),
    upd_date     TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_save IS '마일리지 적립/사용 이력';
COMMENT ON COLUMN shopjoy_2604.pm_save.save_id IS '마일리지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_save.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_save.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save.save_type_cd IS '유형 (코드: SAVE_TYPE — EARN/USE/EXPIRE/CANCEL/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.pm_save.save_amt IS '변동액 (양수:적립, 음수:차감)';
COMMENT ON COLUMN shopjoy_2604.pm_save.balance_amt IS '처리 후 잔액';
COMMENT ON COLUMN shopjoy_2604.pm_save.ref_type_cd IS '연관유형 (ORDER/EVENT/ADMIN 등)';
COMMENT ON COLUMN shopjoy_2604.pm_save.ref_id IS '연관ID';
COMMENT ON COLUMN shopjoy_2604.pm_save.expire_date IS '소멸예정일';
COMMENT ON COLUMN shopjoy_2604.pm_save.save_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.pm_save.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save.reg_date IS '등록일';

CREATE INDEX idx_pm_save_expire ON shopjoy_2604.pm_save USING btree (expire_date);
CREATE INDEX idx_pm_save_member ON shopjoy_2604.pm_save USING btree (member_id);
CREATE INDEX idx_pm_save_type ON shopjoy_2604.pm_save USING btree (save_type_cd);
