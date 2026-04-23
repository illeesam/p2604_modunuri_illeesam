-- ============================================================
-- sy_vendor_user_role : 업체 사용자 역할 (M:N 연결 테이블)
-- ID 규칙: VUR + YYMMDDhhmmss + random(4) = VARCHAR(21)
-- 한 업체 사용자(vendor_user)는 복수의 역할(role)을 가질 수 있음
-- ============================================================
CREATE TABLE sy_vendor_user_role (
    vendor_user_role_id VARCHAR(21)     NOT NULL,
    vendor_id           VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    user_id             VARCHAR(21)     NOT NULL,               -- sy_vendor_user.vendor_user_id
    role_id             VARCHAR(21)     NOT NULL,               -- sy_role.role_id
    grant_user_id       VARCHAR(21),                            -- 부여자 (sy_user.user_id)
    grant_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    valid_from          DATE,                                   -- 유효 시작일
    valid_to            DATE,                                   -- 유효 종료일
    vendor_user_role_remark VARCHAR(500),
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (vendor_user_role_id),
    UNIQUE (vendor_id, user_id, role_id)
);

COMMENT ON TABLE  sy_vendor_user_role                      IS '업체 사용자 역할 연결';
COMMENT ON COLUMN sy_vendor_user_role.vendor_user_role_id  IS '업체사용자역할ID (PK)';
COMMENT ON COLUMN sy_vendor_user_role.vendor_id            IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_user_role.user_id              IS '업체사용자ID (sy_vendor_user.vendor_user_id)';
COMMENT ON COLUMN sy_vendor_user_role.role_id              IS '역할ID (sy_role.role_id)';
COMMENT ON COLUMN sy_vendor_user_role.grant_user_id        IS '역할 부여자 (sy_user.user_id)';
COMMENT ON COLUMN sy_vendor_user_role.grant_date           IS '역할 부여일시';
COMMENT ON COLUMN sy_vendor_user_role.valid_from           IS '유효 시작일';
COMMENT ON COLUMN sy_vendor_user_role.valid_to             IS '유효 종료일';
COMMENT ON COLUMN sy_vendor_user_role.vendor_user_role_remark IS '비고';
COMMENT ON COLUMN sy_vendor_user_role.reg_by               IS '등록자';
COMMENT ON COLUMN sy_vendor_user_role.reg_date             IS '등록일';
COMMENT ON COLUMN sy_vendor_user_role.upd_by               IS '수정자';
COMMENT ON COLUMN sy_vendor_user_role.upd_date             IS '수정일';

CREATE INDEX idx_sy_vendor_user_role_vendor ON sy_vendor_user_role (vendor_id);
CREATE INDEX idx_sy_vendor_user_role_user   ON sy_vendor_user_role (user_id);
CREATE INDEX idx_sy_vendor_user_role_role   ON sy_vendor_user_role (role_id);
