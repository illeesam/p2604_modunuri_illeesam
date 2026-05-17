-- sy_vendor_user 테이블 DDL
-- 판매/배송업체 사용자 (담당자/실무자)

CREATE TABLE shopjoy_2604.sy_vendor_user (
    vendor_user_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id               VARCHAR(21)  NOT NULL,
    vendor_id             VARCHAR(21)  NOT NULL,
    user_id               VARCHAR(21) ,
    role_id               VARCHAR(21) ,
    member_nm             VARCHAR(50)  NOT NULL,
    position_cd           VARCHAR(20) ,
    vendor_user_dept_nm   VARCHAR(100),
    vendor_user_phone     VARCHAR(20) ,
    vendor_user_mobile    VARCHAR(20)  NOT NULL,
    vendor_user_email     VARCHAR(100) NOT NULL,
    birth_date            DATE        ,
    is_main               VARCHAR(1)   DEFAULT 'N'::bpchar,
    auth_yn               VARCHAR(1)   DEFAULT 'N'::bpchar,
    join_date             DATE        ,
    leave_date            DATE        ,
    vendor_user_status_cd VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    vendor_user_remark    VARCHAR(500),
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_vendor_user IS '판매/배송업체 사용자 (담당자/실무자)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_id IS '판매/배송업체사용자ID (PK)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_id IS '판매/배송업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.user_id IS '사용자ID (sy_user.user_id, NULL=비로그인)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.role_id IS '역할ID (sy_role.role_id) - 판매업체/배송업체 역할 트리에서 선택';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.member_nm IS '이름';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.position_cd IS '직위/직책 (코드: POSITION)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_dept_nm IS '부서/팀명';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_phone IS '사무실 전화';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_mobile IS '휴대전화';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_email IS '이메일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.birth_date IS '생년월일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.is_main IS '대표 담당자 여부 (업체당 1명 권장)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.auth_yn IS '업체 관리권한 여부 (Y=업체 정보 수정 가능)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.join_date IS '등록(합류) 일자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.leave_date IS '퇴직/탈퇴 일자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_status_cd IS '상태 (코드: VENDOR_MEMBER_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.vendor_user_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user.upd_date IS '수정일';

CREATE INDEX idx_sy_vendor_user_role ON shopjoy_2604.sy_vendor_user USING btree (role_id);
CREATE INDEX idx_sy_vendor_user_site ON shopjoy_2604.sy_vendor_user USING btree (site_id);
CREATE INDEX idx_sy_vendor_user_status ON shopjoy_2604.sy_vendor_user USING btree (vendor_user_status_cd);
CREATE INDEX idx_sy_vendor_user_user ON shopjoy_2604.sy_vendor_user USING btree (user_id);
CREATE INDEX idx_sy_vendor_user_vendor ON shopjoy_2604.sy_vendor_user USING btree (vendor_id);
CREATE UNIQUE INDEX sy_vendor_user_vendor_id_user_id_key ON shopjoy_2604.sy_vendor_user USING btree (vendor_id, user_id);
