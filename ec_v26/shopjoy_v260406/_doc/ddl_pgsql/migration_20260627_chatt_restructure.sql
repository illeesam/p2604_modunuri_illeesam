-- ============================================================
-- 채팅 테이블 재구조화 마이그레이션
-- 2026-06-27
-- cm_chatt_room → cm_chatt
-- cm_chatt_member (신규)
-- cm_chatt_msg (chatt_room_id→chatt_id, 컬럼 추가)
-- ============================================================

SET search_path TO shopjoy_2604;

-- ============================================================
-- 1. cm_chatt 생성 (cm_chatt_room 대체)
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_chatt (
    chatt_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                VARCHAR(21)  NOT NULL,
    subject                VARCHAR(200),
    chatt_status_cd        VARCHAR(20)  DEFAULT 'PENDING',
    chatt_status_cd_before VARCHAR(20) ,
    last_msg_date          TIMESTAMP   ,
    chatt_memo             TEXT        ,
    close_date             TIMESTAMP   ,
    close_reason           VARCHAR(200),
    reg_by                 VARCHAR(30) ,
    reg_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30) ,
    upd_date               TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.cm_chatt IS '채팅 방';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_id IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.subject IS '채팅주제';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd IS '상태 (PENDING/OPEN/CLOSED)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.last_msg_date IS '마지막 메시지 일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_memo IS '관리자 메모';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.close_date IS '종료일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.close_reason IS '종료사유';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.upd_date IS '수정일시';

CREATE INDEX IF NOT EXISTS idx_cm_chatt_site    ON shopjoy_2604.cm_chatt USING btree (site_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_status  ON shopjoy_2604.cm_chatt USING btree (chatt_status_cd);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_regdate ON shopjoy_2604.cm_chatt USING btree (reg_date DESC);

-- 기존 cm_chatt_room 데이터 이관 (있으면)
INSERT INTO shopjoy_2604.cm_chatt (
    chatt_id, site_id, subject,
    chatt_status_cd, chatt_status_cd_before,
    last_msg_date, chatt_memo, close_date, close_reason,
    reg_by, reg_date, upd_by, upd_date
)
SELECT
    chatt_room_id, site_id, subject,
    chatt_status_cd, chatt_status_cd_before,
    last_msg_date, chatt_memo, close_date, close_reason,
    reg_by, reg_date, upd_by, upd_date
FROM shopjoy_2604.cm_chatt_room
ON CONFLICT (chatt_id) DO NOTHING;

-- ============================================================
-- 2. cm_chatt_member 생성 (신규)
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_chatt_member (
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
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.chatt_id IS '채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.member_type_cd IS '참여자유형 (MEMBER/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.ref_id IS '참조ID (mb_member.member_id 또는 sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.ref_nm IS '참여자명 (비정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.unread_cnt IS '미읽음 메시지 수';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.join_date IS '참여일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.leave_date IS '퇴장일시 (NULL=현재 참여중)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.upd_date IS '수정일시';

CREATE INDEX IF NOT EXISTS idx_cm_chatt_member_chatt  ON shopjoy_2604.cm_chatt_member USING btree (chatt_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_member_ref    ON shopjoy_2604.cm_chatt_member USING btree (ref_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_member_type   ON shopjoy_2604.cm_chatt_member USING btree (member_type_cd);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_member_site   ON shopjoy_2604.cm_chatt_member USING btree (site_id);

-- 기존 cm_chatt_room의 member/admin 정보를 cm_chatt_member로 이관
-- MEMBER 참여자
INSERT INTO shopjoy_2604.cm_chatt_member (
    chatt_member_id, site_id, chatt_id, member_type_cd, ref_id, ref_nm,
    unread_cnt, join_date, reg_by, reg_date, upd_by, upd_date
)
SELECT
    'M' || LPAD(ROW_NUMBER() OVER ()::text, 19, '0'),
    r.site_id, r.chatt_room_id, 'MEMBER', r.member_id, r.member_nm,
    COALESCE(r.member_unread_cnt, 0), r.reg_date, r.reg_by, r.reg_date, r.upd_by, r.upd_date
FROM shopjoy_2604.cm_chatt_room r
WHERE r.member_id IS NOT NULL
ON CONFLICT (chatt_member_id) DO NOTHING;

-- ADMIN 참여자 (담당자 있는 경우)
INSERT INTO shopjoy_2604.cm_chatt_member (
    chatt_member_id, site_id, chatt_id, member_type_cd, ref_id, ref_nm,
    unread_cnt, join_date, reg_by, reg_date, upd_by, upd_date
)
SELECT
    'A' || LPAD(ROW_NUMBER() OVER ()::text, 19, '0'),
    r.site_id, r.chatt_room_id, 'ADMIN', r.admin_user_id, r.admin_user_id,
    COALESCE(r.admin_unread_cnt, 0), r.reg_date, r.reg_by, r.reg_date, r.upd_by, r.upd_date
FROM shopjoy_2604.cm_chatt_room r
WHERE r.admin_user_id IS NOT NULL
ON CONFLICT (chatt_member_id) DO NOTHING;

-- ============================================================
-- 3. cm_chatt_msg 컬럼 재구성
--    chatt_room_id → chatt_id
--    sender_cd → sender_type_cd (+ sender_id, sender_nm 추가)
--    msg_type_cd, attach_grp_id 추가
-- ============================================================

-- 신컬럼 추가
ALTER TABLE shopjoy_2604.cm_chatt_msg
    ADD COLUMN IF NOT EXISTS chatt_id        VARCHAR(21),
    ADD COLUMN IF NOT EXISTS sender_type_cd  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS sender_id       VARCHAR(21),
    ADD COLUMN IF NOT EXISTS sender_nm       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS msg_type_cd     VARCHAR(20)  DEFAULT 'TEXT',
    ADD COLUMN IF NOT EXISTS attach_grp_id   VARCHAR(21);

-- 기존 데이터 이관
UPDATE shopjoy_2604.cm_chatt_msg SET
    chatt_id       = chatt_room_id,
    sender_type_cd = sender_cd,
    sender_id      = 'UNKNOWN',
    msg_type_cd    = 'TEXT'
WHERE chatt_id IS NULL;

-- 이관 후 NOT NULL 제약 적용
ALTER TABLE shopjoy_2604.cm_chatt_msg
    ALTER COLUMN chatt_id      SET NOT NULL,
    ALTER COLUMN sender_type_cd SET NOT NULL,
    ALTER COLUMN sender_id     SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_chatt    ON shopjoy_2604.cm_chatt_msg USING btree (chatt_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_sender   ON shopjoy_2604.cm_chatt_msg USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_senddate ON shopjoy_2604.cm_chatt_msg USING btree (send_date DESC);

-- 코멘트 갱신
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.chatt_id IS '채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_type_cd IS '발신자유형 (MEMBER/ADMIN/SYSTEM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_id IS '발신자ID';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.sender_nm IS '발신자명 (비정규화)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.msg_type_cd IS '메시지유형 (TEXT/IMAGE/FILE/REF/SYSTEM)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_msg.attach_grp_id IS '첨부그룹ID (sy_attach_grp.attach_grp_id)';

-- ============================================================
-- 4. 구 테이블 보존 (rename — 바로 DROP 하지 않음)
-- ============================================================
ALTER TABLE IF EXISTS shopjoy_2604.cm_chatt_room
    RENAME TO cm_chatt_room_bak_20260627;

-- ============================================================
-- 5. sy_code 추가 — CHATT_MEMBER_TYPE, MSG_TYPE
-- ============================================================
-- code_id는 'CD' + 6자리 시퀀스 (2026-06-27 실행 시 MAX=1079, CD000001080~CD000001086 사용)
-- site_id: 2604010000000001 (ShopJoy 메인몰)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, reg_by, reg_date, upd_by, upd_date)
VALUES
  ('CD000001080', '2604010000000001', 'CHATT_MEMBER_TYPE', 'MEMBER', '고객회원', 1, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001081', '2604010000000001', 'CHATT_MEMBER_TYPE', 'ADMIN',  '관리자',   2, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001082', '2604010000000001', 'CHATT_MSG_TYPE',    'TEXT',   '텍스트',   1, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001083', '2604010000000001', 'CHATT_MSG_TYPE',    'IMAGE',  '이미지',   2, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001084', '2604010000000001', 'CHATT_MSG_TYPE',    'FILE',   '파일',     3, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001085', '2604010000000001', 'CHATT_MSG_TYPE',    'REF',    '참조링크', 4, 'Y', 'system', NOW(), 'system', NOW()),
  ('CD000001086', '2604010000000001', 'CHATT_MSG_TYPE',    'SYSTEM', '시스템',   5, 'Y', 'system', NOW(), 'system', NOW())
ON CONFLICT DO NOTHING;
