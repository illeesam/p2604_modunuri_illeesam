-- cm_meet_note 테이블 DDL
-- 화상 세션 노트 (면접 평가 EVAL / 상담 기록 CONSULT / 메모 MEMO) — 2026-10-04 신규 (migration_20261004_cm_meet.sql)
-- 열람: 작성자 본인 + 호스트·면접관·상담사. 지원자·상담 고객·참관·게스트는 자기가 쓴 노트만 (ecBeBo CmMeetRule.canReadAllNotes)

CREATE TABLE shopjoy_2604.cm_meet_note (
    meet_note_id     VARCHAR(21)  NOT NULL CONSTRAINT cm_meet_note_pk_meet_note_id PRIMARY KEY,
    meet_id          VARCHAR(21)  NOT NULL,
    writer_member_id VARCHAR(21)  NOT NULL,
    target_member_id VARCHAR(21) ,
    note_type_cd     VARCHAR(20)  NOT NULL,
    score            INTEGER     ,
    note_text        TEXT        ,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    reg_site_id      VARCHAR(21)  NOT NULL,
    CONSTRAINT cm_meet_note_ck01_score CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

COMMENT ON TABLE  shopjoy_2604.cm_meet_note IS '화상 세션 노트 (면접 평가/상담 기록/메모)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.meet_note_id IS '노트ID (MEN+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.meet_id IS '화상세션ID (cm_meet.meet_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.writer_member_id IS '작성 참여자ID (cm_meet_member.meet_member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.target_member_id IS '대상 참여자ID (cm_meet_member.meet_member_id — 예: 지원자)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.note_type_cd IS '노트 유형 (코드: MEET_NOTE_TYPE_CD — EVAL 면접 평가/CONSULT 상담 기록/MEMO 메모)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.score IS '면접 점수 (0~100, EVAL 만, NULL 가능)';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.note_text IS '노트 내용';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet_note.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_meet_note_ix01_meet_id ON shopjoy_2604.cm_meet_note USING btree (meet_id);
CREATE INDEX cm_meet_note_ix02_writer ON shopjoy_2604.cm_meet_note USING btree (writer_member_id);
