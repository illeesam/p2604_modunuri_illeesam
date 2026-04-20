-- ============================================================
-- sy_vendor_user : 판매/배송업체 사용자 (판매/배송업체에 소속된 담당자/실무자)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 한 판매/배송업체(sy_vendor)는 여러 담당자를 가질 수 있고,
-- 한 담당자(user)는 sy_user 와 연결되어 로그인 가능 (선택)
-- 역할(role_id)는 sy_role 의 판매/배송업체 역할 트리에서 선택
-- ============================================================
CREATE TABLE sy_vendor_user (
    vendor_user_id  VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_id       VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    user_id         VARCHAR(21),                            -- sy_user.user_id (NULL = 비로그인 단순 담당자)
    role_id         VARCHAR(21),                            -- sy_role.role_id (판매업체/배송업체 역할)
    member_nm       VARCHAR(50)     NOT NULL,               -- 이름
    position_cd     VARCHAR(20),                            -- 코드: POSITION (대표/이사/팀장/사원 등)
    vendor_user_dept_nm VARCHAR(100),                           -- 부서/팀명
    vendor_user_phone VARCHAR(20),                            -- 사무실 전화
    vendor_user_mobile VARCHAR(20)     NOT NULL,               -- 휴대전화
    vendor_user_email VARCHAR(100)    NOT NULL,               -- 이메일
    birth_date      DATE,                                   -- 생년월일
    is_main         CHAR(1)         DEFAULT 'N',            -- 대표 담당자 여부 Y/N
    auth_yn         CHAR(1)         DEFAULT 'N',            -- 업체 관리권한 여부 Y/N
    join_date       DATE,                                   -- 등록(합류) 일자
    leave_date      DATE,                                   -- 퇴직/탈퇴 일자
    vendor_user_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_MEMBER_STATUS (ACTIVE/LEFT/SUSPENDED)
    vendor_user_remark VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_user_id),
    UNIQUE (vendor_id, user_id)
);

COMMENT ON TABLE  sy_vendor_user                IS '판매/배송업체 사용자 (담당자/실무자)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_id IS '판매/배송업체사용자ID (PK)';
COMMENT ON COLUMN sy_vendor_user.site_id        IS '사이트ID';
COMMENT ON COLUMN sy_vendor_user.vendor_id      IS '판매/배송업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_user.user_id        IS '사용자ID (sy_user.user_id, NULL=비로그인)';
COMMENT ON COLUMN sy_vendor_user.role_id        IS '역할ID (sy_role.role_id) - 판매업체/배송업체 역할 트리에서 선택';
COMMENT ON COLUMN sy_vendor_user.member_nm      IS '이름';
COMMENT ON COLUMN sy_vendor_user.position_cd    IS '직위/직책 (코드: POSITION)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_dept_nm IS '부서/팀명';
COMMENT ON COLUMN sy_vendor_user.vendor_user_phone IS '사무실 전화';
COMMENT ON COLUMN sy_vendor_user.vendor_user_mobile IS '휴대전화';
COMMENT ON COLUMN sy_vendor_user.vendor_user_email IS '이메일';
COMMENT ON COLUMN sy_vendor_user.birth_date     IS '생년월일';
COMMENT ON COLUMN sy_vendor_user.is_main        IS '대표 담당자 여부 (업체당 1명 권장)';
COMMENT ON COLUMN sy_vendor_user.auth_yn        IS '업체 관리권한 여부 (Y=업체 정보 수정 가능)';
COMMENT ON COLUMN sy_vendor_user.join_date      IS '등록(합류) 일자';
COMMENT ON COLUMN sy_vendor_user.leave_date     IS '퇴직/탈퇴 일자';
COMMENT ON COLUMN sy_vendor_user.vendor_user_status_cd IS '상태 (코드: VENDOR_MEMBER_STATUS)';
COMMENT ON COLUMN sy_vendor_user.vendor_user_remark IS '비고';
COMMENT ON COLUMN sy_vendor_user.reg_by         IS '등록자';
COMMENT ON COLUMN sy_vendor_user.reg_date       IS '등록일';
COMMENT ON COLUMN sy_vendor_user.upd_by         IS '수정자';
COMMENT ON COLUMN sy_vendor_user.upd_date       IS '수정일';

CREATE INDEX idx_sy_vendor_user_vendor ON sy_vendor_user (vendor_id);
CREATE INDEX idx_sy_vendor_user_user   ON sy_vendor_user (user_id);
CREATE INDEX idx_sy_vendor_user_role   ON sy_vendor_user (role_id);
CREATE INDEX idx_sy_vendor_user_status ON sy_vendor_user (vendor_user_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_user.position_cd (직위/직책) : POSITION { CEO:대표, DIRECTOR:이사, MANAGER:담당자, EMPLOYEE:직원 }
-- [CODES] sy_vendor_user.vendor_user_status_cd (상태) : VENDOR_USER_STATUS { ACTIVE:재직, LEFT:퇴직, SUSPENDED:정지 }
