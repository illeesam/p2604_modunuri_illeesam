-- cm_chatt_member 테이블 DDL
-- 채팅 참여자 (2026-06-27 신규)

CREATE TABLE shopjoy_2604.cm_chatt_member (
    chatt_member_id    VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id            VARCHAR(21)  NOT NULL,
    chatt_id           VARCHAR(21)  NOT NULL,
    member_type_cd     VARCHAR(20)  NOT NULL,
    ref_id             VARCHAR(21)  NOT NULL,
    ref_nm             VARCHAR(100),
    unread_cnt         INTEGER      DEFAULT 0,
    join_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    leave_date         TIMESTAMP   ,
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.cm_chatt_member IS '채팅 참여자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.chatt_member_id IS '참여자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.chatt_id IS '채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.member_type_cd IS '참여자유형 (MEMBER: 고객회원 / ADMIN: 관리자)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.ref_id IS '참조ID (MEMBER→mb_member.member_id / ADMIN→sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.ref_nm IS '참여자명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.unread_cnt IS '미읽음 메시지 수';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.join_date IS '참여일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.leave_date IS '퇴장일시 (NULL=현재 참여 중)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.upd_date IS '수정일시';

CREATE INDEX idx_cm_chatt_member_chatt  ON shopjoy_2604.cm_chatt_member USING btree (chatt_id);
CREATE INDEX idx_cm_chatt_member_ref    ON shopjoy_2604.cm_chatt_member USING btree (ref_id);
CREATE INDEX idx_cm_chatt_member_type   ON shopjoy_2604.cm_chatt_member USING btree (member_type_cd);
CREATE INDEX idx_cm_chatt_member_site   ON shopjoy_2604.cm_chatt_member USING btree (site_id);
