-- syh_access_error_log 테이블 DDL
-- HTTP 요청 에러 로그 (비동기 수집)

CREATE TABLE shopjoy_2604.syh_access_error_log (
    log_id       VARCHAR(20)   NOT NULL PRIMARY KEY,
    req_method   VARCHAR(10)  ,
    req_host     VARCHAR(200) ,
    req_path     VARCHAR(500) ,
    req_query    VARCHAR(1000),
    req_ip       VARCHAR(45)  ,
    req_ua       VARCHAR(500) ,
    app_type_cd  VARCHAR(20)  ,
    user_id      VARCHAR(50)  ,
    role_id      VARCHAR(50)  ,
    dept_id      VARCHAR(50)  ,
    vendor_id    VARCHAR(50)  ,
    locale_id    VARCHAR(20)  ,
    resp_time_ms BIGINT       ,
    error_type   VARCHAR(300) ,
    error_msg    TEXT         ,
    stack_trace  TEXT         ,
    server_nm    VARCHAR(100) ,
    profile      VARCHAR(50)  ,
    thread_nm    VARCHAR(100) ,
    logger_nm    VARCHAR(200) ,
    log_dt       TIMESTAMP     NOT NULL,
    reg_date     TIMESTAMP     DEFAULT now(),
    ui_nm        VARCHAR(200) ,
    cmd_nm       VARCHAR(200) ,
    file_nm      VARCHAR(200) ,
    func_nm      VARCHAR(200) ,
    line_no      VARCHAR(10)  ,
    trace_id     VARCHAR(50)  ,
    site_id      VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.syh_access_error_log IS 'HTTP 요청 에러 로그 (비동기 수집)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.log_id IS 'PK: EL+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_method IS 'HTTP 메서드';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_host IS 'Host 헤더 값';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_path IS '요청 URI 경로';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_query IS '쿼리 파라미터 문자열';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_ip IS '클라이언트 실제 IP (X-Forwarded-For 우선)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.req_ua IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.app_type_cd IS '호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.user_id IS '인증 사용자 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.role_id IS '역할 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.dept_id IS '부서 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.vendor_id IS '업체 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.locale_id IS '지역 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.resp_time_ms IS '요청 처리 시간 (밀리초)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.error_type IS '예외 클래스 FQCN';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.error_msg IS '예외 메시지';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.stack_trace IS '스택 트레이스 (최대 3000자)';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.server_nm IS '서버 호스트명';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.profile IS '활성 Spring 프로파일';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.thread_nm IS '로그 발생 스레드명';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.logger_nm IS '로거 클래스 이름';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.log_dt IS '에러 발생 시각';
COMMENT ON COLUMN shopjoy_2604.syh_access_error_log.reg_date IS 'DB 저장 시각';

CREATE INDEX idx_syh_access_error_log_site ON shopjoy_2604.syh_access_error_log USING btree (site_id);
CREATE INDEX idx_syh_ael_error_type ON shopjoy_2604.syh_access_error_log USING btree (error_type);
CREATE INDEX idx_syh_ael_log_dt ON shopjoy_2604.syh_access_error_log USING btree (log_dt DESC);
CREATE INDEX idx_syh_ael_req_path ON shopjoy_2604.syh_access_error_log USING btree (req_path);
CREATE INDEX idx_syh_ael_user_id ON shopjoy_2604.syh_access_error_log USING btree (user_id);
CREATE UNIQUE INDEX pk_syh_access_error_log ON shopjoy_2604.syh_access_error_log USING btree (log_id);
