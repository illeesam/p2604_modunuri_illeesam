-- cm_meet_member 테이블 DDL
-- 화상 세션 참여자 — 2026-10-04 신규 (migration_20261004_cm_meet.sql)
-- 회원(MEMBER)·BO 사용자(USER)·비회원(GUEST) 모두 한 행. 비회원은 ref_id 없이 초대 토큰 SHA-256 해시 + 만료일시로 확인.
-- join_date 가 있고 leave_date 가 NULL 이면 지금 방 안.

CREATE TABLE shopjoy_2604.cm_meet_member (
    meet_member_id        VARCHAR(21)  NOT NULL CONSTRAINT cm_meet_member_pk_meet_member_id PRIMARY KEY,
    meet_id               VARCHAR(21)  NOT NULL,
    member_type_cd        VARCHAR(20)  NOT NULL,
    ref_id                VARCHAR(21) ,
    ref_nm                VARCHAR(100),
    guest_contact         VARCHAR(200),
    role_cd               VARCHAR(20)  NOT NULL,
    invite_status_cd      VARCHAR(20)  NOT NULL DEFAULT 'INVITED',
    invite_token_hash     VARCHAR(64) ,
    invite_token_exp_date TIMESTAMP   ,
    join_date             TIMESTAMP   ,
    leave_date            TIMESTAMP   ,
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   ,
    reg_site_id           VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_meet_member IS '화상 세션 참여자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.meet_member_id IS '참여자ID (MEM+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.meet_id IS '화상세션ID (cm_meet.meet_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.member_type_cd IS '참여자 유형 (코드: MEET_MEMBER_TYPE_CD — MEMBER 회원/USER BO 사용자/GUEST 비회원)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.ref_id IS '참조ID (MEMBER→mb_member.member_id / USER→sy_user.user_id / GUEST→NULL)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.ref_nm IS '참여자명 (비정규화 캐시, GUEST 는 초대·입장 때 입력한 이름)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.guest_contact IS '비회원 연락처 (이메일/휴대폰 — 초대 안내용, 호스트·관리자만 봄)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.role_cd IS '역할 (코드: MEET_ROLE_CD — HOST/GUEST/INTERVIEWER 면접관/CANDIDATE 지원자/COUNSELOR 상담사/CLIENT 상담 고객/OBSERVER 참관)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.invite_status_cd IS '초대 상태 (코드: MEET_INVITE_STATUS_CD — INVITED/ACCEPTED/DECLINED)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.invite_token_hash IS '비회원 초대 토큰 해시 (SHA-256 hex, 평문 저장 금지)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.invite_token_exp_date IS '비회원 초대 토큰 만료일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.join_date IS '최근 입장일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.leave_date IS '최근 퇴장일시 (join_date 이후 NULL=현재 방 안)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_member.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_meet_member_ix01_meet_id ON shopjoy_2604.cm_meet_member USING btree (meet_id);
CREATE INDEX cm_meet_member_ix02_ref ON shopjoy_2604.cm_meet_member USING btree (member_type_cd, ref_id);
CREATE UNIQUE INDEX cm_meet_member_uk01_meet_ref ON shopjoy_2604.cm_meet_member USING btree (meet_id, member_type_cd, ref_id) WHERE ref_id IS NOT NULL;
CREATE UNIQUE INDEX cm_meet_member_uk02_invite_token ON shopjoy_2604.cm_meet_member USING btree (invite_token_hash) WHERE invite_token_hash IS NOT NULL;
