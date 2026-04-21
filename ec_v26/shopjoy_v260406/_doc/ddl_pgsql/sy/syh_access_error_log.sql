-- ============================================================
-- syh_access_error_log — HTTP 요청 중 발생한 ERROR 레벨 로그
-- 수집 시점: 로그백 DbErrorLogAppender → 비동기 큐 → 워커 스레드 저장
-- ============================================================
CREATE TABLE shopjoy_2604.syh_access_error_log (

    log_id          VARCHAR(20)  NOT NULL,          -- PK  EL + yyMMddHHmmss + rand4

    -- 요청 정보
    req_method      VARCHAR(10),                    -- HTTP 메서드 (GET/POST/PUT/PATCH/DELETE)
    req_host        VARCHAR(200),                   -- Host 헤더
    req_path        VARCHAR(500),                   -- 요청 URI
    req_query       VARCHAR(1000),                  -- 쿼리스트링 (nullable)
    req_ip          VARCHAR(45),                    -- 클라이언트 IP (IPv6 포함)
    req_ua          VARCHAR(500),                   -- User-Agent (nullable)

    -- 인증 정보 (MDC)
    user_type       VARCHAR(20),                    -- USER / MEMBER / EXT / -
    user_id         VARCHAR(50),                    -- sy_user.user_id 또는 ec_member.member_id
    role_id         VARCHAR(50),                    -- 역할 ID (nullable)
    dept_id         VARCHAR(50),                    -- 부서 ID (nullable)
    vendor_id       VARCHAR(50),                    -- 업체 ID (nullable)
    locale_id       VARCHAR(20),                    -- 로케일 (nullable, 추후 설정)

    -- 경과 시간
    resp_time_ms    BIGINT,                         -- 요청 수신부터 에러 발생까지 경과 시간 (ms)

    -- 에러 정보
    error_type      VARCHAR(300),                   -- 예외 클래스 전체 이름
    error_msg       TEXT,                           -- 예외 메시지
    stack_trace     TEXT,                           -- 스택 트레이스 (최대 3000자)

    -- 실행 환경
    server_nm       VARCHAR(100),                   -- 서버 호스트명
    profile         VARCHAR(50),                    -- 활성 Spring 프로파일
    thread_nm       VARCHAR(100),                   -- 실행 스레드명
    logger_nm       VARCHAR(200),                   -- 로거 클래스 이름

    log_dt          TIMESTAMP    NOT NULL,          -- 에러 발생 시각
    reg_date        TIMESTAMP    DEFAULT now(),     -- DB 저장 시각

    CONSTRAINT pk_syh_access_error_log PRIMARY KEY (log_id)
);

-- 조회용 인덱스
CREATE INDEX idx_syh_ael_log_dt     ON shopjoy_2604.syh_access_error_log (log_dt DESC);
CREATE INDEX idx_syh_ael_user_id    ON shopjoy_2604.syh_access_error_log (user_id);
CREATE INDEX idx_syh_ael_req_path   ON shopjoy_2604.syh_access_error_log (req_path);
CREATE INDEX idx_syh_ael_error_type ON shopjoy_2604.syh_access_error_log (error_type);

COMMENT ON TABLE  shopjoy_2604.syh_access_error_log                IS 'HTTP 요청 에러 로그 (비동기 수집)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.log_id         IS 'PK: EL+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_method     IS 'HTTP 메서드';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_host       IS 'Host 헤더 값';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_path       IS '요청 URI 경로';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_query      IS '쿼리 파라미터 문자열';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_ip         IS '클라이언트 실제 IP (X-Forwarded-For 우선)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_ua         IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.user_type      IS 'USER/MEMBER/EXT/- (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.user_id        IS '인증 사용자 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.role_id        IS '역할 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.error_type     IS '예외 클래스 FQCN';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.error_msg      IS '예외 메시지';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.stack_trace    IS '스택 트레이스 (최대 3000자)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.server_nm      IS '서버 호스트명';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.profile        IS '활성 Spring 프로파일';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.thread_nm      IS '로그 발생 스레드명';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.logger_nm      IS '로거 클래스 이름';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.log_dt         IS '에러 발생 시각';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.reg_date       IS 'DB 저장 시각';
