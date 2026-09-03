-- cf_token_hist — 토큰 발급/재발급 이력(감사로그). action_cd=NEW(최초 로그인)일 때는 그 시점의
-- 계정정보(client_nm) 를 스냅샷으로 같이 남긴다(요청사항: "토큰신규발급이면 계정정보도 기록").
CREATE TABLE IF NOT EXISTS cf_token_hist (
    hist_id       VARCHAR(20)   NOT NULL,
    client_id     VARCHAR(40)   NOT NULL,
    token_id      VARCHAR(20),          -- cf_token.token_id(해당 시점 토큰 행) — FK 미설정(토큰 삭제돼도 이력은 남아야 함)
    action_cd     VARCHAR(10)   NOT NULL,   -- NEW(로그인 시도) / REFRESH(재발급 시도) / REVOKE(강제폐기)
    result_cd     VARCHAR(10)   NOT NULL DEFAULT 'SUCCESS', -- SUCCESS / FAIL — 요청사항: 실패 이력도 기록
    result_msg    VARCHAR(300),         -- 결과내용 — 실패 사유(비밀번호 불일치 등) 또는 성공 상세
    reason        VARCHAR(200),         -- 코멘트: "최초 로그인", "accessToken 만료로 재발급" 등
    client_nm     VARCHAR(100),         -- action_cd=NEW 일 때만 채움(계정정보 스냅샷)
    refresh_token TEXT,                 -- 이 시점 발급/관여된 refreshToken 값 스냅샷(요청사항 — 실패 건은 NULL)
    access_token_exp   TIMESTAMP,       -- 이 시점 accessToken 만료 일시
    refresh_token_exp  TIMESTAMP,       -- 이 시점 refreshToken 만료 일시
    access_token_ttl_sec   INTEGER,     -- 이 시점 적용된 accessToken 유효시간(초)
    refresh_token_ttl_sec  INTEGER,     -- 이 시점 적용된 refreshToken 유효시간(초, REFRESH 는 갱신 안 되므로 NEW 때 값 유지)
    issued_ip     VARCHAR(64),
    requester_system_nm VARCHAR(100),   -- 요청 시스템 이름(X-Caller-System 헤더)
    reg_by        VARCHAR(40),          -- 등록자(= client_id) — 이력은 불변이라 upd_by/upd_date 없음(EcAdminApi Hist 테이블과 동일 관례)
    reg_date      TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_cf_token_hist PRIMARY KEY (hist_id)
);

CREATE INDEX IF NOT EXISTS ix_cf_token_hist_client ON cf_token_hist (client_id);
CREATE INDEX IF NOT EXISTS ix_cf_token_hist_reg_date ON cf_token_hist (reg_date);

COMMENT ON TABLE  cf_token_hist                IS 'EcCdnApi 토큰 발급/재발급 이력(감사로그)';
COMMENT ON COLUMN cf_token_hist.hist_id        IS '이력 ID (CH+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cf_token_hist.client_id      IS '대상 계정(cf_client.client_id)';
COMMENT ON COLUMN cf_token_hist.token_id       IS '관련 cf_token.token_id (참조용, FK 아님)';
COMMENT ON COLUMN cf_token_hist.action_cd      IS 'NEW=로그인 시도 / REFRESH=재발급 시도 / REVOKE=강제폐기';
COMMENT ON COLUMN cf_token_hist.result_cd      IS '결과 SUCCESS/FAIL';
COMMENT ON COLUMN cf_token_hist.result_msg     IS '결과내용(실패 사유 등)';
COMMENT ON COLUMN cf_token_hist.reason         IS '사유 코멘트';
COMMENT ON COLUMN cf_token_hist.client_nm      IS 'NEW 일 때 계정명 스냅샷(REFRESH 는 NULL)';
COMMENT ON COLUMN cf_token_hist.refresh_token  IS '이 시점 관여된 refreshToken 값 스냅샷(실패 건은 NULL)';
COMMENT ON COLUMN cf_token_hist.access_token_exp   IS '이 시점 accessToken 만료 일시';
COMMENT ON COLUMN cf_token_hist.refresh_token_exp  IS '이 시점 refreshToken 만료 일시';
COMMENT ON COLUMN cf_token_hist.access_token_ttl_sec  IS '이 시점 accessToken 유효시간(초)';
COMMENT ON COLUMN cf_token_hist.refresh_token_ttl_sec IS '이 시점 refreshToken 유효시간(초)';
COMMENT ON COLUMN cf_token_hist.issued_ip      IS '요청자 IP';
COMMENT ON COLUMN cf_token_hist.requester_system_nm IS '요청 시스템 이름(X-Caller-System 헤더)';
COMMENT ON COLUMN cf_token_hist.reg_by         IS '등록자(= client_id)';
COMMENT ON COLUMN cf_token_hist.reg_date       IS '발생 일시';
