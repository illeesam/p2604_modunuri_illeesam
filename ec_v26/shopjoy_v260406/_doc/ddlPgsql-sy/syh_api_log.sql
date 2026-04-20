-- ============================================================
-- syh_api_log : 외부 API 연동 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 용도: PG사, 물류사, 카카오, 네이버 등 외부 API 호출 추적
-- ============================================================
CREATE TABLE syh_api_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    api_type_cd     VARCHAR(50)     NOT NULL,              -- 연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)
    api_nm          VARCHAR(100),                          -- API명 (예: 결제승인, 운송장등록)
    method_cd       VARCHAR(10),                           -- HTTP 메서드 (GET/POST/PUT/DELETE)
    endpoint        VARCHAR(500),                          -- 호출 URL
    req_body        TEXT,                                  -- 요청 파라미터 (민감정보 마스킹)
    res_body        TEXT,                                  -- 응답 본문
    http_status     SMALLINT,                             -- HTTP 응답코드
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- SUCCESS/FAIL
    error_msg       VARCHAR(500),                          -- 오류 메시지
    elapsed_ms      INTEGER,                               -- 응답시간 (ms)
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/DLIV/PUSH 등)
    ref_id          VARCHAR(21),                           -- 연관ID
    call_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_api_log              IS '외부 API 연동 로그';
COMMENT ON COLUMN syh_api_log.log_id       IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_api_log.site_id      IS '사이트ID';
COMMENT ON COLUMN syh_api_log.api_type_cd  IS '연동유형코드 (PG/LOGISTICS/KAKAO/NAVER/SMS 등)';
COMMENT ON COLUMN syh_api_log.api_nm       IS 'API명 (예: 결제승인)';
COMMENT ON COLUMN syh_api_log.method_cd    IS 'HTTP 메서드';
COMMENT ON COLUMN syh_api_log.endpoint     IS '호출 URL';
COMMENT ON COLUMN syh_api_log.req_body     IS '요청 파라미터 (민감정보 마스킹 처리)';
COMMENT ON COLUMN syh_api_log.res_body     IS '응답 본문';
COMMENT ON COLUMN syh_api_log.http_status  IS 'HTTP 응답코드';
COMMENT ON COLUMN syh_api_log.result_cd    IS '처리결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN syh_api_log.error_msg    IS '오류 메시지';
COMMENT ON COLUMN syh_api_log.elapsed_ms   IS '응답시간 (밀리초)';
COMMENT ON COLUMN syh_api_log.ref_type_cd  IS '연관유형코드 (ORDER/DLIV/PUSH 등)';
COMMENT ON COLUMN syh_api_log.ref_id       IS '연관ID';
COMMENT ON COLUMN syh_api_log.call_date    IS 'API 호출일시';
COMMENT ON COLUMN syh_api_log.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_api_log.reg_date     IS '등록일';
COMMENT ON COLUMN syh_api_log.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_api_log.upd_date     IS '수정일';

CREATE INDEX idx_syh_api_log_type ON syh_api_log (api_type_cd, result_cd);
CREATE INDEX idx_syh_api_log_date ON syh_api_log (call_date);
CREATE INDEX idx_syh_api_log_ref  ON syh_api_log (ref_type_cd, ref_id);
