-- syh_access_log 테이블 DDL
-- API 요청/응답 액세스 로그 (비동기 선택 수집)

CREATE TABLE shopjoy_2604.syh_access_log (
    log_id       VARCHAR(20)   NOT NULL CONSTRAINT syh_access_log_pk_log_id PRIMARY KEY,
    req_method   VARCHAR(10)  ,
    req_host     VARCHAR(200) ,
    req_path     VARCHAR(500) ,
    req_query    VARCHAR(1000),
    req_ip       VARCHAR(45)  ,
    req_ua       VARCHAR(500) ,
    req_body     TEXT         ,
    app_type_cd  VARCHAR(20)  ,
    user_id      VARCHAR(50)  ,
    role_id      VARCHAR(50)  ,
    dept_id      VARCHAR(50)  ,
    vendor_id    VARCHAR(50)  ,
    locale_id    VARCHAR(20)  ,
    resp_status  INTEGER      ,
    resp_time_ms BIGINT       ,
    resp_body    TEXT         ,
    server_nm    VARCHAR(100) ,
    profile      VARCHAR(50)  ,
    thread_nm    VARCHAR(100) ,
    req_dt       TIMESTAMP     NOT NULL,
    reg_date     TIMESTAMP     DEFAULT now(),
    ui_nm        VARCHAR(200) ,
    cmd_nm       VARCHAR(200) ,
    file_nm      VARCHAR(200) ,
    func_nm      VARCHAR(200) ,
    line_no      VARCHAR(10)  ,
    trace_id     VARCHAR(50)
    /* reg_site_id 없음 — 2026-08-20 라이브 DB information_schema 직접 조회로 확인.
       이 파일에 한때 `reg_site_id VARCHAR(21) NOT NULL` 이 있었으나 실제 DB엔 없었다(stale 문서).
       syh_access_log 는 BaseEntity 를 상속하지 않아(reqDt/regDate 자체 관리) site_id 자동주입 대상이 아니다. */
);

COMMENT ON TABLE  shopjoy_2604.syh_access_log IS 'API 요청/응답 액세스 로그 (비동기 선택 수집)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.log_id IS 'PK: AL+yyMMddHHmmss+rand4';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_method IS 'HTTP 메서드';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_host IS 'Host 헤더 값';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_path IS '요청 URI 경로';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_query IS '쿼리 파라미터 문자열';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_ip IS '클라이언트 실제 IP';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_ua IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_body IS '요청 바디 (설정된 최대 크기까지)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.app_type_cd IS '호출 앱 유형 (코드: APP_TYPE — FO/BO/SO/DO/CO/-)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.user_id IS '인증 사용자 ID';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.role_id IS '역할 ID';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.dept_id IS '부서 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.vendor_id IS '업체 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.locale_id IS '지역 ID (MDC)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_status IS 'HTTP 응답 상태 코드';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_time_ms IS '요청 처리 시간 (밀리초)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.resp_body IS '응답 바디 (설정된 최대 크기까지)';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.server_nm IS '서버 호스트명';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.profile IS '활성 Spring 프로파일';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.thread_nm IS '처리 스레드명';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.req_dt IS '요청 수신 시각';
COMMENT ON COLUMN shopjoy_2604.syh_access_log.reg_date IS 'DB 저장 시각';

CREATE INDEX syh_access_log_ix01_req_dt ON shopjoy_2604.syh_access_log USING btree (req_dt DESC);
CREATE INDEX syh_access_log_ix02_req_path ON shopjoy_2604.syh_access_log USING btree (req_path);
CREATE INDEX syh_access_log_ix03_resp_status ON shopjoy_2604.syh_access_log USING btree (resp_status);
CREATE INDEX syh_access_log_ix05_user_id ON shopjoy_2604.syh_access_log USING btree (user_id);
CREATE INDEX syh_access_log_ix04_trace_id ON shopjoy_2604.syh_access_log USING btree (trace_id);
