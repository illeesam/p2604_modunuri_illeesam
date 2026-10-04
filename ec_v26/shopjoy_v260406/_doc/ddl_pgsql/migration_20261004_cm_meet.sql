-- ═══════════════════════════════════════════════════════════
--  화상회의·면접·상담(화상 세션) — cm_meet / cm_meet_member / cm_meet_log / cm_meet_note 신규 + 공통코드 + sy_prop 자리
--  작성일: 2026-10-04
--
--  배경:
--   사용자 요청 "추후에 화상회의, 면접, 상담 도 할거에 그에 대비하여 api 만들어줘".
--   화면 없이 API·DB·실시간 신호 중계(WebRTC 시그널링)까지 먼저 만든다 (ecBeBo 브랜치 feature/meet-api-20261004).
--    - cm_meet        : 세션(방). 종류 VIDEO/INTERVIEW/CONSULT, 상태 SCHEDULED→OPEN→LIVE→ENDED (SCHEDULED/OPEN→CANCELED)
--                       미디어는 P2P 기본, 나중에 LIVEKIT/AGORA/ZOOM 으로 바꿀 수 있게 media_provider_cd·provider_room_id 를 둔다.
--                       입장 비밀번호는 BCrypt 해시만(entry_pwd). 연결 대상(ref_type_cd·ref_id), 옆 채팅방(chatt_id, FK 없음).
--    - cm_meet_member : 참여자(MEMBER/USER/GUEST). 비회원은 초대 토큰 SHA-256 해시 + 만료일시.
--    - cm_meet_log    : 이벤트 기록(생성·초대·입장·시작·종료 …). WebRTC 신호는 저장하지 않는다(서버 메모리에서 중계만).
--    - cm_meet_note   : 면접 평가(EVAL, 점수 0~100)·상담 기록(CONSULT)·메모(MEMO).
--   PK 는 CmUtil.generateId 규칙(접두어 + yyMMddHHmmss + 4자리): ME / MEM / MEL / MEN.
--   reg_site_id 는 감사 필드(EntitySaveListener 가 채움), 사이트 관계는 cm_meet.site_id 로만.
--   sy_prop 는 값 없이 키만 넣는다(값이 비어 있으면 yml app.meet.* 를 쓴다). TURN 공유 비밀은 sy_prop 에 넣지 않는다(환경변수 MEET_TURN_SECRET).
-- ═══════════════════════════════════════════════════════════
--  사용법: 아래 스크립트 전체 실행 (재실행해도 안전 — IF NOT EXISTS / NOT EXISTS)
--  롤백: 맨 아래 "롤백" 블록 (주석 해제 후 실행)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) cm_meet — 화상 세션
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_meet (
    meet_id               VARCHAR(21)  NOT NULL CONSTRAINT cm_meet_pk_meet_id PRIMARY KEY,
    site_id               VARCHAR(21)  NOT NULL,
    meet_type_cd          VARCHAR(20)  NOT NULL,
    meet_status_cd        VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    meet_status_cd_before VARCHAR(20) ,
    meet_title            VARCHAR(200) NOT NULL,
    meet_desc             TEXT        ,
    host_type_cd          VARCHAR(20)  NOT NULL,
    host_id               VARCHAR(21)  NOT NULL,
    host_nm               VARCHAR(100),
    sched_start_date      TIMESTAMP   ,
    sched_end_date        TIMESTAMP   ,
    start_date            TIMESTAMP   ,
    end_date              TIMESTAMP   ,
    max_member_cnt        INTEGER     ,
    entry_pwd             VARCHAR(100),
    media_provider_cd     VARCHAR(20)  DEFAULT 'P2P',
    provider_room_id      VARCHAR(200),
    record_yn             VARCHAR(1)   DEFAULT 'N',
    ref_type_cd           VARCHAR(20) ,
    ref_id                VARCHAR(21) ,
    chatt_id              VARCHAR(21) ,
    meet_memo             TEXT        ,
    end_reason            VARCHAR(200),
    reg_by                VARCHAR(30) ,
    reg_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30) ,
    upd_date              TIMESTAMP   ,
    reg_site_id           VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_meet IS '화상 세션 (화상회의/면접/상담)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_id IS '화상세션ID (ME+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_type_cd IS '세션 종류 (코드: MEET_TYPE_CD — VIDEO 화상회의/INTERVIEW 면접/CONSULT 상담)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_status_cd IS '세션 상태 (코드: MEET_STATUS_CD — SCHEDULED 예약/OPEN 입장 가능/LIVE 진행 중/ENDED 종료/CANCELED 취소)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_title IS '세션 제목';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_desc IS '세션 설명';
COMMENT ON COLUMN shopjoy_2604.cm_meet.host_type_cd IS '호스트 유형 (코드: MEET_HOST_TYPE_CD — MEMBER 회원/USER BO 사용자)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.host_id IS '호스트ID (MEMBER→mb_member.member_id / USER→sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.host_nm IS '호스트명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.sched_start_date IS '예약 시작일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet.sched_end_date IS '예약 종료일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet.start_date IS '실제 시작일시 (LIVE 전환 시각)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.end_date IS '실제 종료일시 (ENDED/CANCELED 전환 시각)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.max_member_cnt IS '최대 동시 참여 인원 (P2P 는 4명 이하 권장, NULL=기본값 app.meet.default-max-member-cnt)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.entry_pwd IS '입장 비밀번호 (BCrypt 해시, NULL=비밀번호 없음, 평문 저장 금지)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.media_provider_cd IS '미디어 제공 방식 (코드: MEET_MEDIA_PROVIDER_CD — P2P 기본/LIVEKIT/AGORA/ZOOM)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.provider_room_id IS '외부 서비스 방ID (LIVEKIT room name, ZOOM meeting id 등 — P2P 는 NULL)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.record_yn IS '녹화 허용 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_meet.ref_type_cd IS '연결 대상 유형 (코드: MEET_REF_TYPE_CD — RECRUIT 채용공고/ORDER 주문/PROD 상품/CONTACT 상담신청/ETC)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.ref_id IS '연결 대상ID (예: sy_contact.contact_id, od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.chatt_id IS '옆 문자 채팅방ID (cm_chatt.chatt_id — FK 없이 값만)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.meet_memo IS '호스트/관리자 메모 (FO 에서는 호스트만 봄)';
COMMENT ON COLUMN shopjoy_2604.cm_meet.end_reason IS '종료/취소 사유';
COMMENT ON COLUMN shopjoy_2604.cm_meet.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_meet.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_meet.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_meet.reg_site_id IS '등록 사이트ID (감사 필드 — 사이트 관계는 site_id)';

CREATE INDEX IF NOT EXISTS cm_meet_ix01_site_status_sched ON shopjoy_2604.cm_meet USING btree (site_id, meet_status_cd, sched_start_date);
CREATE INDEX IF NOT EXISTS cm_meet_ix02_host ON shopjoy_2604.cm_meet USING btree (host_type_cd, host_id);
CREATE INDEX IF NOT EXISTS cm_meet_ix03_ref ON shopjoy_2604.cm_meet USING btree (ref_type_cd, ref_id);
CREATE INDEX IF NOT EXISTS cm_meet_ix04_reg_date ON shopjoy_2604.cm_meet USING btree (reg_date DESC);

-- ───────────────────────────────────────────────────────────
-- 2) cm_meet_member — 참여자
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_meet_member (
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

CREATE INDEX IF NOT EXISTS cm_meet_member_ix01_meet_id ON shopjoy_2604.cm_meet_member USING btree (meet_id);
CREATE INDEX IF NOT EXISTS cm_meet_member_ix02_ref ON shopjoy_2604.cm_meet_member USING btree (member_type_cd, ref_id);
CREATE UNIQUE INDEX IF NOT EXISTS cm_meet_member_uk01_meet_ref ON shopjoy_2604.cm_meet_member USING btree (meet_id, member_type_cd, ref_id) WHERE ref_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cm_meet_member_uk02_invite_token ON shopjoy_2604.cm_meet_member USING btree (invite_token_hash) WHERE invite_token_hash IS NOT NULL;

-- ───────────────────────────────────────────────────────────
-- 3) cm_meet_log — 이벤트 기록
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_meet_log (
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

CREATE INDEX IF NOT EXISTS cm_meet_log_ix01_meet_date ON shopjoy_2604.cm_meet_log USING btree (meet_id, event_date);

-- ───────────────────────────────────────────────────────────
-- 4) cm_meet_note — 면접 평가·상담 기록·메모
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_meet_note (
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

CREATE INDEX IF NOT EXISTS cm_meet_note_ix01_meet_id ON shopjoy_2604.cm_meet_note USING btree (meet_id);
CREATE INDEX IF NOT EXISTS cm_meet_note_ix02_writer ON shopjoy_2604.cm_meet_note USING btree (writer_member_id);

-- ───────────────────────────────────────────────────────────
-- 5) 공통코드 그룹 10개 + 코드 48개 (MEET_*)
--    코드ID 는 CG/CD + 261004 + 07xxxx (같은 날 다른 마이그레이션과 겹치지 않게 07 구간)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT v.code_grp_id, v.code_grp, v.grp_nm, v.path_id, v.code_grp_desc, 'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
FROM (VALUES
    ('CG261004070001', 'MEET_TYPE_CD',           '화상세션종류',     'cs.meet.type',          '화상 세션 종류 (화상회의/면접/상담)'),
    ('CG261004070002', 'MEET_STATUS_CD',         '화상세션상태',     'cs.meet.status',        '화상 세션 상태 (child_code_values = 허용 전이)'),
    ('CG261004070003', 'MEET_HOST_TYPE_CD',      '화상호스트유형',   'cs.meet.host_type',     '화상 세션 호스트 유형 (회원/BO 사용자)'),
    ('CG261004070004', 'MEET_MEDIA_PROVIDER_CD', '화상미디어제공',   'cs.meet.provider',      '화상 미디어 제공 방식 (P2P/외부 서비스)'),
    ('CG261004070005', 'MEET_MEMBER_TYPE_CD',    '화상참여자유형',   'cs.meet.member_type',   '화상 세션 참여자 유형 (회원/BO 사용자/비회원)'),
    ('CG261004070006', 'MEET_ROLE_CD',           '화상참여역할',     'cs.meet.role',          '화상 세션 참여자 역할'),
    ('CG261004070007', 'MEET_INVITE_STATUS_CD',  '화상초대상태',     'cs.meet.invite_status', '화상 세션 초대 상태'),
    ('CG261004070008', 'MEET_EVENT_CD',          '화상세션이벤트',   'cs.meet.event',         '화상 세션 이벤트 기록 종류'),
    ('CG261004070009', 'MEET_NOTE_TYPE_CD',      '화상노트유형',     'cs.meet.note_type',     '화상 세션 노트 유형 (면접 평가/상담 기록/메모)'),
    ('CG261004070010', 'MEET_REF_TYPE_CD',       '화상연결대상유형', 'cs.meet.ref_type',      '화상 세션 연결 대상 유형')
) AS v(code_grp_id, code_grp, grp_nm, path_id, code_grp_desc)
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp g WHERE g.code_grp = v.code_grp);

-- 상태는 허용 전이(child_code_values)까지 넣는다 (ecBeBo CmMeetRule.TRANSITIONS 와 같게 유지)
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, child_code_values, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.child_code_values, g.code_grp_id, 'MIGRATION_20261004', NOW(), 'SI260001'
FROM (VALUES
    ('CD261004070004', 'SCHEDULED', '예약',      1, '^OPEN^LIVE^CANCELED^'),
    ('CD261004070005', 'OPEN',      '입장 가능', 2, '^LIVE^ENDED^CANCELED^'),
    ('CD261004070006', 'LIVE',      '진행 중',   3, '^ENDED^'),
    ('CD261004070007', 'ENDED',     '종료',      4, NULL),
    ('CD261004070008', 'CANCELED',  '취소',      5, NULL)
) AS v(code_id, code_value, code_label, sort_ord, child_code_values)
JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'MEET_STATUS_CD'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c WHERE c.code_grp_id = g.code_grp_id AND c.code_value = v.code_value);

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', g.code_grp_id, 'MIGRATION_20261004', NOW(), 'SI260001'
FROM (VALUES
    ('MEET_TYPE_CD',           'CD261004070001', 'VIDEO',        '화상회의',     1),
    ('MEET_TYPE_CD',           'CD261004070002', 'INTERVIEW',    '면접',         2),
    ('MEET_TYPE_CD',           'CD261004070003', 'CONSULT',      '상담',         3),
    ('MEET_HOST_TYPE_CD',      'CD261004070009', 'MEMBER',       '회원',         1),
    ('MEET_HOST_TYPE_CD',      'CD261004070010', 'USER',         'BO 사용자',    2),
    ('MEET_MEDIA_PROVIDER_CD', 'CD261004070011', 'P2P',          'P2P (브라우저 직접)', 1),
    ('MEET_MEDIA_PROVIDER_CD', 'CD261004070012', 'LIVEKIT',      'LiveKit',      2),
    ('MEET_MEDIA_PROVIDER_CD', 'CD261004070013', 'AGORA',        'Agora',        3),
    ('MEET_MEDIA_PROVIDER_CD', 'CD261004070014', 'ZOOM',         'Zoom',         4),
    ('MEET_MEMBER_TYPE_CD',    'CD261004070015', 'MEMBER',       '회원',         1),
    ('MEET_MEMBER_TYPE_CD',    'CD261004070016', 'USER',         'BO 사용자',    2),
    ('MEET_MEMBER_TYPE_CD',    'CD261004070017', 'GUEST',        '비회원',       3),
    ('MEET_ROLE_CD',           'CD261004070018', 'HOST',         '호스트',       1),
    ('MEET_ROLE_CD',           'CD261004070019', 'GUEST',        '참석자',       2),
    ('MEET_ROLE_CD',           'CD261004070020', 'INTERVIEWER',  '면접관',       3),
    ('MEET_ROLE_CD',           'CD261004070021', 'CANDIDATE',    '지원자',       4),
    ('MEET_ROLE_CD',           'CD261004070022', 'COUNSELOR',    '상담사',       5),
    ('MEET_ROLE_CD',           'CD261004070023', 'CLIENT',       '상담 고객',    6),
    ('MEET_ROLE_CD',           'CD261004070024', 'OBSERVER',     '참관',         7),
    ('MEET_INVITE_STATUS_CD',  'CD261004070025', 'INVITED',      '초대됨',       1),
    ('MEET_INVITE_STATUS_CD',  'CD261004070026', 'ACCEPTED',     '수락',         2),
    ('MEET_INVITE_STATUS_CD',  'CD261004070027', 'DECLINED',     '거절',         3),
    ('MEET_EVENT_CD',          'CD261004070028', 'CREATE',       '생성',         1),
    ('MEET_EVENT_CD',          'CD261004070029', 'INVITE',       '초대',         2),
    ('MEET_EVENT_CD',          'CD261004070030', 'ACCEPT',       '수락',         3),
    ('MEET_EVENT_CD',          'CD261004070031', 'DECLINE',      '거절',         4),
    ('MEET_EVENT_CD',          'CD261004070032', 'JOIN',         '입장',         5),
    ('MEET_EVENT_CD',          'CD261004070033', 'LEAVE',        '퇴장',         6),
    ('MEET_EVENT_CD',          'CD261004070034', 'OPEN',         '열기',         7),
    ('MEET_EVENT_CD',          'CD261004070035', 'START',        '시작',         8),
    ('MEET_EVENT_CD',          'CD261004070036', 'END',          '종료',         9),
    ('MEET_EVENT_CD',          'CD261004070037', 'CANCEL',       '취소',         10),
    ('MEET_EVENT_CD',          'CD261004070038', 'REMOVE',       '내보내기',     11),
    ('MEET_EVENT_CD',          'CD261004070039', 'RECORD_START', '녹화 시작',    12),
    ('MEET_EVENT_CD',          'CD261004070040', 'RECORD_END',   '녹화 끝',      13),
    ('MEET_NOTE_TYPE_CD',      'CD261004070041', 'EVAL',         '면접 평가',    1),
    ('MEET_NOTE_TYPE_CD',      'CD261004070042', 'CONSULT',      '상담 기록',    2),
    ('MEET_NOTE_TYPE_CD',      'CD261004070043', 'MEMO',         '메모',         3),
    ('MEET_REF_TYPE_CD',       'CD261004070044', 'RECRUIT',      '채용공고',     1),
    ('MEET_REF_TYPE_CD',       'CD261004070045', 'ORDER',        '주문',         2),
    ('MEET_REF_TYPE_CD',       'CD261004070046', 'PROD',         '상품',         3),
    ('MEET_REF_TYPE_CD',       'CD261004070047', 'CONTACT',      '상담신청',     4),
    ('MEET_REF_TYPE_CD',       'CD261004070048', 'ETC',          '기타',         5)
) AS v(code_grp, code_id, code_value, code_label, sort_ord)
JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = v.code_grp
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code c WHERE c.code_grp_id = g.code_grp_id AND c.code_value = v.code_value);

-- ───────────────────────────────────────────────────────────
-- 6) sy_prop — ICE 설정 키 자리 (값은 비워 둔다 → yml app.meet.* 사용. 관리자가 BO 프로퍼티 화면에서 채우면 그 값이 우선)
--    TURN 공유 비밀(app.meet.turn-secret)은 넣지 않는다 — 환경변수 MEET_TURN_SECRET 로만.
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (reg_site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
SELECT 'SI260001', 'app.meet', v.prop_key, '', v.prop_label, v.prop_type_cd, v.sort_ord, 'Y', NULL, v.prop_remark, 'MIGRATION_20261004', NOW()
FROM (VALUES
    ('app.meet.stun-urls',    '화상 STUN 서버 주소', 'STRING', 10, '콤마 구분. 비우면 yml(기본 stun:stun.l.google.com:19302)'),
    ('app.meet.turn-urls',    '화상 TURN 서버 주소', 'STRING', 20, '콤마 구분. 예 turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349 — 비밀(MEET_TURN_SECRET)이 있어야 사용'),
    ('app.meet.turn-ttl-sec', '화상 TURN 임시 자격 유효시간(초)', 'NUMBER', 30, '비우면 yml(기본 3600)')
) AS v(prop_key, prop_label, prop_type_cd, sort_ord, prop_remark)
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_prop p WHERE p.prop_key = v.prop_key);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables WHERE table_schema='shopjoy_2604' AND table_name LIKE 'cm_meet%' ORDER BY 1;
--   → cm_meet, cm_meet_log, cm_meet_member, cm_meet_note
-- SELECT g.code_grp, count(c.code_id) FROM shopjoy_2604.sy_code_grp g LEFT JOIN shopjoy_2604.sy_code c ON c.code_grp_id = g.code_grp_id
--  WHERE g.code_grp LIKE 'MEET\_%' GROUP BY g.code_grp ORDER BY 1;
--   → MEET_EVENT_CD 13, MEET_HOST_TYPE_CD 2, MEET_INVITE_STATUS_CD 3, MEET_MEDIA_PROVIDER_CD 4, MEET_MEMBER_TYPE_CD 3,
--     MEET_NOTE_TYPE_CD 3, MEET_REF_TYPE_CD 5, MEET_ROLE_CD 7, MEET_STATUS_CD 5, MEET_TYPE_CD 3  (합계 48)
-- SELECT prop_key, prop_value FROM shopjoy_2604.sy_prop WHERE prop_key LIKE 'app.meet.%';   → 3행 (값 빈 문자열)

-- ═══════════════════════════════════════════════════════════
--  롤백 (필요할 때만 주석 해제 후 실행 — 화상 세션 데이터가 모두 지워진다)
-- ═══════════════════════════════════════════════════════════
-- DELETE FROM shopjoy_2604.sy_prop WHERE prop_key IN ('app.meet.stun-urls','app.meet.turn-urls','app.meet.turn-ttl-sec') AND reg_by = 'MIGRATION_20261004';
-- DELETE FROM shopjoy_2604.sy_code WHERE code_grp_id IN (SELECT code_grp_id FROM shopjoy_2604.sy_code_grp WHERE code_grp IN
--   ('MEET_TYPE_CD','MEET_STATUS_CD','MEET_HOST_TYPE_CD','MEET_MEDIA_PROVIDER_CD','MEET_MEMBER_TYPE_CD','MEET_ROLE_CD','MEET_INVITE_STATUS_CD','MEET_EVENT_CD','MEET_NOTE_TYPE_CD','MEET_REF_TYPE_CD'));
-- DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp IN
--   ('MEET_TYPE_CD','MEET_STATUS_CD','MEET_HOST_TYPE_CD','MEET_MEDIA_PROVIDER_CD','MEET_MEMBER_TYPE_CD','MEET_ROLE_CD','MEET_INVITE_STATUS_CD','MEET_EVENT_CD','MEET_NOTE_TYPE_CD','MEET_REF_TYPE_CD');
-- DROP TABLE IF EXISTS shopjoy_2604.cm_meet_note;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_meet_log;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_meet_member;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_meet;
