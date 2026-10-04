-- cm_meet 테이블 DDL
-- 화상 세션 (화상회의 VIDEO / 면접 INTERVIEW / 상담 CONSULT) — 2026-10-04 신규 (migration_20261004_cm_meet.sql)
-- 상태 흐름: SCHEDULED → OPEN → LIVE → ENDED, SCHEDULED/OPEN → CANCELED (ecBeBo CmMeetRule)
-- 입장 비밀번호는 BCrypt 해시만 저장(평문 금지). 사이트 관계는 site_id, reg_site_id 는 감사 필드.

CREATE TABLE shopjoy_2604.cm_meet (
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

CREATE INDEX cm_meet_ix01_site_status_sched ON shopjoy_2604.cm_meet USING btree (site_id, meet_status_cd, sched_start_date);
CREATE INDEX cm_meet_ix02_host ON shopjoy_2604.cm_meet USING btree (host_type_cd, host_id);
CREATE INDEX cm_meet_ix03_ref ON shopjoy_2604.cm_meet USING btree (ref_type_cd, ref_id);
CREATE INDEX cm_meet_ix04_reg_date ON shopjoy_2604.cm_meet USING btree (reg_date DESC);
