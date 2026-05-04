-- ============================================================
-- syh_access_log — API 요청/응답 액세스 로그
-- 수집 시점: AccessLogFilter → 비동기 큐 → 워커 스레드 저장
-- 대상: app.access-log.filter 에 매칭되는 요청만 선택 수집
-- ============================================================
CREATE TABLE shopjoy_2604.syh_access_log (

    log_id          VARCHAR(20)  NOT NULL,          -- PK  AL + yyMMddHHmmss + rand4

    -- 요청 정보
    req_method      VARCHAR(10),                    -- HTTP 메서드
    req_host        VARCHAR(200),                   -- Host 헤더
    req_path        VARCHAR(500),                   -- 요청 URI
    req_query       VARCHAR(1000),                  -- 쿼리스트링 (nullable)
    req_ip          VARCHAR(45),                    -- 클라이언트 IP
    req_ua          VARCHAR(500),                   -- User-Agent (nullable)
    req_body        TEXT,                           -- 요청 바디 (max-body-size 이하, nullable)

    -- 인증 정보
    app_type_cd     VARCHAR(20),                    -- 코드: APP_TYPE (BO/FO/EXT/-)
    user_id         VARCHAR(50),                    -- sy_user.user_id 또는 ec_member.member_id
    role_id         VARCHAR(50),                    -- 역할 ID (nullable)
    dept_id         VARCHAR(50),                    -- 부서 ID (nullable)
    vendor_id       VARCHAR(50),                    -- 업체 ID (nullable)
    locale_id       VARCHAR(20),                    -- 로케일 (nullable, 추후 설정)

    -- 응답 정보
    resp_status     INT,                            -- HTTP 응답 코드
    resp_time_ms    BIGINT,                         -- 처리 시간 (ms)
    resp_body       TEXT,                           -- 응답 바디 (max-body-size 이하, nullable)

    -- 실행 환경
    server_nm       VARCHAR(100),                   -- 서버 호스트명
    profile         VARCHAR(50),                    -- 활성 Spring 프로파일
    thread_nm       VARCHAR(100),                   -- 실행 스레드명

    req_dt          TIMESTAMP    NOT NULL,          -- 요청 수신 시각
    reg_date        TIMESTAMP    DEFAULT now(),     -- DB 저장 시각

    CONSTRAINT pk_syh_access_log PRIMARY KEY (log_id)
);

-- 조회용 인덱스
CREATE INDEX idx_syh_al_req_dt     ON shopjoy_2604.syh_access_log (req_dt DESC);
CREATE INDEX idx_syh_al_user_id    ON shopjoy_2604.syh_access_log (user_id);
CREATE INDEX idx_syh_al_req_path   ON shopjoy_2604.syh_access_log (req_path);
CREATE INDEX idx_syh_al_resp_status ON shopjoy_2604.syh_access_log (resp_status);

COMMENT ON TABLE  shopjoy_2604.syh_access_log                 IS 'API 요청/응답 액세스 로그 (비동기 선택 수집)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.log_id          IS 'PK: AL+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_method      IS 'HTTP 메서드';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_host        IS 'Host 헤더 값';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_path        IS '요청 URI 경로';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_query       IS '쿼리 파라미터 문자열';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_ip          IS '클라이언트 실제 IP';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_ua          IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_body        IS '요청 바디 (설정된 최대 크기까지)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.app_type_cd     IS '호출 앱 유형 (코드: APP_TYPE — BO/FO/EXT/-, JWT 클레임)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.user_id         IS '인증 사용자 ID';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.role_id         IS '역할 ID';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_status     IS 'HTTP 응답 상태 코드';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_time_ms    IS '요청 처리 시간 (밀리초)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_body       IS '응답 바디 (설정된 최대 크기까지)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.server_nm       IS '서버 호스트명';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.profile         IS '활성 Spring 프로파일';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.thread_nm       IS '처리 스레드명';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_dt          IS '요청 수신 시각';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.reg_date        IS 'DB 저장 시각';
