-- sy_exceldown 테이블 DDL
-- 엑셀 다운로드 요청/이력 (동기·비동기 전부 기록)
--
-- 설계 요지
--  · 동기(SYNC)/비동기(ASYNC) 를 한 테이블에 기록해 "누가 무엇을 언제 얼마나 받아갔나" 를 단일 창구로 조회
--
--  · 동시 실행 제어를 이 테이블로 수행한다 — MSA 멀티 pod 환경에서는 인메모리 세마포어가 무용하므로
--    PostgreSQL 부분 유니크 인덱스로 DB 가 직접 "사이트당 RUNNING 1건" 을 강제한다(uk01)
--
--  · 예약(ASYNC)은 @Async 즉시실행이 아니라 대기열 방식이다.
--      요청 → WAITING INSERT 후 즉시 응답
--      → 전용 @Scheduled 폴러가 FOR UPDATE SKIP LOCKED 로 1건만 claim → RUNNING
--    이유: pod 가 죽어도 WAITING 행은 DB 에 남아 살아있는 다른 pod 가 이어받는다(자동 failover).
--    @Async 는 스레드와 함께 잡이 증발한다. 또 대기열이 있어야 "동시 1건 초과 = 거부" 대신
--    "접수됨, 앞에 N건 대기중" 안내가 가능하다.
--    ※ sy_batch 잡으로 만들면 안 된다 — jenkins.enabled=true(운영)에서 cron 이 등록되지 않아
--      예약다운로드가 영영 실행되지 않는다. 반드시 별도 @Scheduled 빈으로 둔다.
--
--  · 타임아웃 판정은 start_date 가 아니라 upd_date(heartbeat) 기준 3분 무응답이다.
--    실행 중 청크마다 done_count/upd_date 를 갱신하므로, 20만건이 정상적으로 5분 걸려도 살아남고
--    pod 가 죽어 멈춘 고아만 TIMEOUT 으로 회수된다. start_date 기준으로 하면 정상 잡을 죽인다.
--
--  · 생성 파일은 sy_attach 에 등록한다(ref_table_nm='sy_exceldown', ref_id=exceldown_id).
--    분할 저장(기본 5만행/파일) 시 같은 ref_id 로 N행이 달리므로 별도 배열 컬럼이 필요 없다.
--    attach_id 는 대표(첫) 파일만 담아 알림에서의 원클릭 다운로드에 쓴다.
CREATE TABLE shopjoy_2604.sy_exceldown (
    exceldown_id        VARCHAR(21)  NOT NULL CONSTRAINT sy_exceldown_pk_exceldown_id PRIMARY KEY,
    reg_site_id         VARCHAR(21)  NOT NULL,
    domain_cd           VARCHAR(50)  NOT NULL,
    domain_nm           VARCHAR(100),
    ui_nm               VARCHAR(100),
    api_url             VARCHAR(300),
    api_method_cd       VARCHAR(10),
    run_type_cd         VARCHAR(20)  NOT NULL DEFAULT 'SYNC',
    exceldown_status_cd VARCHAR(20)  NOT NULL DEFAULT 'RUNNING',
    search_param_json   TEXT,
    search_cond_text    TEXT,
    excel_columns       TEXT,
    total_count         INTEGER      DEFAULT 0,
    done_count          INTEGER      DEFAULT 0,
    file_nm             VARCHAR(300),
    file_size           BIGINT,
    file_count          INTEGER      DEFAULT 0,
    total_file_size     BIGINT,
    attach_id           VARCHAR(21),
    download_count      INTEGER      DEFAULT 0,
    last_download_date  TIMESTAMP,
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    elapsed_ms          INTEGER,
    error_msg           TEXT,
    expire_date         TIMESTAMP,
    pod_id              VARCHAR(100),
    cancel_by           VARCHAR(30),
    cancel_date         TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP
);

-- 동시 실행 제어 — 사이트당 RUNNING 1건만 허용 (부분 유니크 인덱스, 멀티 pod 안전)
CREATE UNIQUE INDEX sy_exceldown_uk01_running
    ON shopjoy_2604.sy_exceldown (reg_site_id)
    WHERE exceldown_status_cd = 'RUNNING';

-- 목록 조회 — 내 요청 + 최신순
CREATE INDEX sy_exceldown_ix01_reg_by_x2   ON shopjoy_2604.sy_exceldown (reg_by, reg_date DESC);
-- 대기열 pick — WAITING 을 등록순으로 1건 claim (FOR UPDATE SKIP LOCKED)
CREATE INDEX sy_exceldown_ix02_status_x2   ON shopjoy_2604.sy_exceldown (exceldown_status_cd, reg_date);
CREATE INDEX sy_exceldown_ix03_expire_date ON shopjoy_2604.sy_exceldown (expire_date);
-- 고아 회수 — RUNNING 중 heartbeat(upd_date) 가 끊긴 건 스캔
CREATE INDEX sy_exceldown_ix04_status_upd_x2 ON shopjoy_2604.sy_exceldown (exceldown_status_cd, upd_date);

COMMENT ON TABLE  shopjoy_2604.sy_exceldown                     IS '엑셀 다운로드 요청/이력 (동기·비동기 전부 기록)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.exceldown_id        IS '엑셀다운로드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.reg_site_id         IS '등록사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.domain_cd           IS '엑셀 도메인 키 (ExcelDomainHandler.key, 예: memberLoginLog)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.domain_nm           IS '도메인 한글명 (예: 회원 로그인 로그)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.ui_nm               IS '요청 화면명 (X-UI-Nm)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.api_url             IS '다운로드 실행 backend API 경로 (예: /api/bo/excel/memberLoginLog/excel)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.api_method_cd       IS 'HTTP 메서드 (GET/POST)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.run_type_cd         IS '실행유형 (SYNC: 즉시다운로드 / ASYNC: 예약다운로드)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.exceldown_status_cd IS '상태 (WAITING: 대기열 / RUNNING: 진행중 / DONE: 완료 / FAIL: 실패 / TIMEOUT: 시간초과 / CANCELED: 강제취소)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.search_param_json   IS '요청 시점 검색조건 스냅샷 (JSON, 재실행·표시용)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.search_cond_text    IS '검색조건 사람이 읽는 형태 (화면 라벨 기준, 이력 화면 표시용)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.excel_columns       IS '다운로드 컬럼 헤더명 (그리드 헤더 순서대로, 쉼표 구분)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.total_count         IS '예상 다운로드 건수 (요청 시점 countList 결과 — 실행 시점엔 데이터가 바뀌어 있을 수 있음)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.done_count          IS '실제 다운로드(처리) 건수. 진행중엔 청크 단위로 갱신되어 진행률로도 쓰이고, DONE/FAIL 종료 시점엔 실제 처리된 최종 건수를 담는다';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.file_nm             IS '대표(첫) 파일명 — 분할 시 1/N 파일';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.file_size           IS '대표(첫) 파일 크기 (byte)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.file_count          IS '생성 파일 수 (분할 시 N, 미분할 1)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.total_file_size     IS '전체 파일 크기 합계 (byte)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.attach_id           IS '대표(첫) 첨부파일ID — 알림 원클릭 다운로드용. 전체 목록은 sy_attach(ref_table_nm=sy_exceldown, ref_id=exceldown_id) 로 조회';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.download_count      IS '다운로드 횟수';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.last_download_date  IS '최종 다운로드일시';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.start_date          IS '실행 시작일시 (3분 초과 시 TIMEOUT 판정 기준)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.end_date            IS '실행 종료일시';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.elapsed_ms          IS '소요시간 (ms)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.error_msg           IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.expire_date         IS '파일 보관 만료일시 (정리 배치 대상)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.pod_id              IS '실행 pod 식별자 (HOSTNAME) — MSA 장애 추적용';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.cancel_by           IS '강제취소 실행자';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.cancel_date         IS '강제취소일시';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.reg_by              IS '요청자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.reg_date            IS '요청일시';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.upd_by              IS '수정자';
COMMENT ON COLUMN shopjoy_2604.sy_exceldown.upd_date            IS '수정일시';
