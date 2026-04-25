-- ============================================================
-- pm_save : 마일리지 적립/사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 용도: 구매 시 자동 적립, 유효기간 소멸 있는 포인트
-- ============================================================
CREATE TABLE pm_save (
    save_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    save_type_cd        VARCHAR(20)     NOT NULL,               -- 코드: SAVE_TYPE (EARN:구매적립/USE:사용/EXPIRE:소멸/CANCEL:적립취소/ADMIN:관리자조정)
    save_amt            BIGINT          NOT NULL,               -- 마일리지 변동액 (양수:적립/음수:차감)
    balance_amt         BIGINT          DEFAULT 0,              -- 처리 후 잔액
    ref_type_cd         VARCHAR(30),                            -- 연관유형 (ORDER/EVENT/ADMIN 등)
    ref_id              VARCHAR(21),                            -- 연관ID (order_id 등)
    expire_date         TIMESTAMP,                              -- 소멸예정일 (EARN 시 설정)
    save_memo           TEXT,                                   -- 메모
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (save_id)
);

COMMENT ON TABLE pm_save IS '마일리지 적립/사용 이력';
COMMENT ON COLUMN pm_save.save_id       IS '마일리지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save.site_id       IS '사이트ID';
COMMENT ON COLUMN pm_save.member_id     IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save.save_type_cd  IS '유형 (코드: SAVE_TYPE — EARN/USE/EXPIRE/CANCEL/ADMIN)';
COMMENT ON COLUMN pm_save.save_amt      IS '변동액 (양수:적립, 음수:차감)';
COMMENT ON COLUMN pm_save.balance_amt   IS '처리 후 잔액';
COMMENT ON COLUMN pm_save.ref_type_cd   IS '연관유형 (ORDER/EVENT/ADMIN 등)';
COMMENT ON COLUMN pm_save.ref_id        IS '연관ID';
COMMENT ON COLUMN pm_save.expire_date   IS '소멸예정일';
COMMENT ON COLUMN pm_save.save_memo     IS '메모';
COMMENT ON COLUMN pm_save.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_save.reg_date      IS '등록일';
COMMENT ON COLUMN pm_save.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_save.upd_date IS '수정일';

CREATE INDEX idx_pm_save_member ON pm_save (member_id);
CREATE INDEX idx_pm_save_type   ON pm_save (save_type_cd);
CREATE INDEX idx_pm_save_expire ON pm_save (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_save.save_type_cd (유형) : SAVE_TYPE { EARN:적립, USE:사용, EXPIRE:소멸, CANCEL:취소, ADMIN:관리자 }
