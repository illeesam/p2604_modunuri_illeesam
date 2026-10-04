-- cm_meet_log 테이블 DDL
-- 화상 세션 이벤트 기록 — 2026-10-04 신규 (migration_20261004_cm_meet.sql)
-- 생성·초대·수락/거절·입장/퇴장·열기/시작/종료/취소·내보내기·녹화 시작/끝. WebRTC 신호(offer/answer/ice 등)는 저장하지 않는다.

CREATE TABLE shopjoy_2604.cm_meet_log (
    meet_log_id    VARCHAR(21)  NOT NULL CONSTRAINT cm_meet_log_pk_meet_log_id PRIMARY KEY,
    meet_id        VARCHAR(21)  NOT NULL,
    meet_member_id VARCHAR(21) ,
    event_cd       VARCHAR(20)  NOT NULL,
    event_msg      VARCHAR(500),
    event_date     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    reg_site_id    VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_meet_log IS '화상 세션 이벤트 기록';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.meet_log_id IS '이벤트ID (MEL+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.meet_id IS '화상세션ID (cm_meet.meet_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.meet_member_id IS '관련 참여자ID (cm_meet_member.meet_member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.event_cd IS '이벤트 (코드: MEET_EVENT_CD — CREATE/INVITE/ACCEPT/DECLINE/JOIN/LEAVE/OPEN/START/END/CANCEL/REMOVE/RECORD_START/RECORD_END)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.event_msg IS '이벤트 내용';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.event_date IS '이벤트 일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.reg_by IS '등록자 (이벤트를 일으킨 사람)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_log.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_meet_log_ix01_meet_date ON shopjoy_2604.cm_meet_log USING btree (meet_id, event_date);
