-- syh_api_log 테이블 DDL
-- 외부 API 연동 로그

CREATE TABLE shopjoy_2604.syh_api_log (
    log_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id     VARCHAR(21) ,
    api_type_cd VARCHAR(50)  NOT NULL,
    api_nm      VARCHAR(100),
    method_cd   VARCHAR(10) ,
    endpoint    VARCHAR(500),
    req_body    TEXT        ,
    res_body    TEXT        ,
    http_status INTEGER     ,
    result_cd   VARCHAR(20)  DEFAULT 'SUCCESS',
    error_msg   VARCHAR(500),
    elapsed_ms  INTEGER     ,
    ref_type_cd VARCHAR(30) ,
    ref_id      VARCHAR(21) ,
    call_date   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by      VARCHAR(30) ,
    reg_date    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30) ,
    upd_date    TIMESTAMP   ,
    ui_nm       VARCHAR(100),
    cmd_nm      VARCHAR(50) ,
    file_nm     VARCHAR(200),
    func_nm     VARCHAR(200),
    line_no     VARCHAR(10) ,
    trace_id    VARCHAR(50) 
);

COMMENT ON TABLE  shopjoy_2604.syh_api_log IS '외부 API 연동 로그';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.api_type_cd IS '연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.api_nm IS 'API명 (예: 결제승인)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.method_cd IS 'HTTP 메서드';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.endpoint IS '호출 URL';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.req_body IS '요청 파라미터 (민감정보 마스킹 처리)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.res_body IS '응답 본문';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.http_status IS 'HTTP 응답코드';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.result_cd IS '처리결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.error_msg IS '오류 메시지';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.elapsed_ms IS '응답시간 (밀리초)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.ref_type_cd IS '연관유형코드 (ORDER/DLIV/PUSH 등)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.ref_id IS '연관ID';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.call_date IS 'API 호출일시';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.ui_nm IS '화면명 (X-UI-Nm 헤더)';
COMMENT ON COLUMN shopjoy_2604.syh_api_log.cmd_nm IS '작업명 (X-Cmd-Nm 헤더)';

CREATE INDEX idx_syh_api_log_date ON shopjoy_2604.syh_api_log USING btree (call_date);
CREATE INDEX idx_syh_api_log_ref ON shopjoy_2604.syh_api_log USING btree (ref_type_cd, ref_id);
CREATE INDEX idx_syh_api_log_type ON shopjoy_2604.syh_api_log USING btree (api_type_cd, result_cd);
