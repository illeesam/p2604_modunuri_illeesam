-- ============================================================
-- sy_user_role : 관리자 사용자 ↔ 역할 매핑 (N:M)
-- 한 사용자는 여러 역할을, 한 역할은 여러 사용자에 할당 가능
-- ============================================================
CREATE TABLE sy_user_role (
    user_role_id    VARCHAR(21)     NOT NULL,                -- 사용자역할ID (YYMMDDhhmmss+rand4)
    user_id         VARCHAR(21)     NOT NULL,               -- sy_user.user_id
    role_id         VARCHAR(21)     NOT NULL,               -- sy_role.role_id
    grant_user_id   VARCHAR(21),                            -- 부여자 (sy_user.user_id)
    grant_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    valid_from      DATE,                                   -- 적용 시작일 (NULL = 즉시)
    valid_to        DATE,                                   -- 적용 종료일 (NULL = 무기한)
    user_role_remark VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (user_role_id),
    UNIQUE (user_id, role_id)
);

COMMENT ON TABLE  sy_user_role             IS '관리자 사용자-역할 매핑 (N:M)';
COMMENT ON COLUMN sy_user_role.user_role_id IS '사용자역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_user_role.user_id     IS '사용자ID (sy_user.user_id, UNIQUE with role_id)';
COMMENT ON COLUMN sy_user_role.role_id     IS '역할ID (sy_role.role_id, UNIQUE with user_id)';
COMMENT ON COLUMN sy_user_role.grant_user_id IS '부여자 (sy_user.user_id)';
COMMENT ON COLUMN sy_user_role.grant_date  IS '부여일시';
COMMENT ON COLUMN sy_user_role.valid_from  IS '적용 시작일';
COMMENT ON COLUMN sy_user_role.valid_to    IS '적용 종료일';
COMMENT ON COLUMN sy_user_role.user_role_remark IS '비고';
COMMENT ON COLUMN sy_user_role.reg_by      IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user_role.reg_date    IS '등록일';
COMMENT ON COLUMN sy_user_role.upd_by      IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user_role.upd_date    IS '수정일';

CREATE INDEX idx_sy_user_role_user ON sy_user_role (user_id);
CREATE INDEX idx_sy_user_role_role ON sy_user_role (role_id);
