-- cf_token — 현재 발급된(만료 전) accessToken/refreshToken 정보. EcAdminApi 등 호출자가 여러 대일
-- 수 있다는 전제로, BO 의 "1세션(로그인마다 기존 삭제)" 이 아니라 FO 의 "멀티디바이스(행 추가,
-- 삭제 없음)" 정책을 따른다 — 한 client_id 로 여러 인스턴스가 동시에 로그인해도 서로의 세션을
-- 안 지운다. issued_ip 로 어느 호출자(인스턴스)가 발급받았는지 구분한다(2026-09-06).
CREATE TABLE IF NOT EXISTS cf_token (
    token_id            VARCHAR(20)   NOT NULL,
    client_id           VARCHAR(40)   NOT NULL,
    access_token        TEXT          NOT NULL,
    refresh_token       TEXT          NOT NULL,
    access_token_exp    TIMESTAMP     NOT NULL,
    refresh_token_exp   TIMESTAMP     NOT NULL,
    access_token_ttl_sec   INTEGER,   -- 발급 당시 적용된 accessToken 유효시간(초) — 설정값이 나중에 바뀌어도 그 시점 값 보존
    refresh_token_ttl_sec  INTEGER,   -- 발급 당시 적용된 refreshToken 유효시간(초)
    reason               VARCHAR(200), -- 최근 발급/재발급 사유(cf_token_hist 의 최신 값 미러 — 조인 없이 바로 조회용)
    issued_ip           VARCHAR(64),
    requester_system_nm VARCHAR(100), -- 요청 시스템 이름(X-Caller-System 헤더, 예: 'EcAdminApi') — 마이크로서비스 환경에서 IP만으론 "어느 서비스"인지 모호할 때 구분용
    reg_by              VARCHAR(40),  -- 등록자(= client_id, 자기 자신의 로그인으로 생성됨)
    reg_date            TIMESTAMP     NOT NULL DEFAULT now(),
    upd_by              VARCHAR(40),  -- 수정자(= client_id, 자기 자신의 refresh 로 갱신됨)
    upd_date            TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_cf_token PRIMARY KEY (token_id),
    CONSTRAINT fk_cf_token_client FOREIGN KEY (client_id) REFERENCES cf_client (client_id)
);

CREATE INDEX IF NOT EXISTS ix_cf_token_client ON cf_token (client_id);

COMMENT ON TABLE  cf_token                    IS 'EcCdnApi 발급 토큰(만료 전) — client 당 다건 가능(멀티 인스턴스 호출자 대비)';
COMMENT ON COLUMN cf_token.token_id           IS '토큰 발급 ID (CT+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cf_token.client_id          IS '발급 대상 계정(cf_client.client_id)';
COMMENT ON COLUMN cf_token.access_token       IS 'accessToken(JWT, 30초)';
COMMENT ON COLUMN cf_token.refresh_token      IS 'refreshToken(JWT, 7일)';
COMMENT ON COLUMN cf_token.access_token_exp   IS 'accessToken 만료 시각';
COMMENT ON COLUMN cf_token.refresh_token_exp  IS 'refreshToken 만료 시각';
COMMENT ON COLUMN cf_token.access_token_ttl_sec  IS '발급 당시 accessToken 유효시간(초)';
COMMENT ON COLUMN cf_token.refresh_token_ttl_sec IS '발급 당시 refreshToken 유효시간(초)';
COMMENT ON COLUMN cf_token.reason             IS '최근 발급/재발급 사유(cf_token_hist 최신값 미러)';
COMMENT ON COLUMN cf_token.issued_ip          IS '발급 요청자 IP — EcAdminApi 인스턴스가 여러 대일 때 구분용';
COMMENT ON COLUMN cf_token.requester_system_nm IS '요청 시스템 이름(X-Caller-System 헤더)';
COMMENT ON COLUMN cf_token.reg_by             IS '등록자(= client_id)';
COMMENT ON COLUMN cf_token.reg_date           IS '최초 발급(로그인) 일시';
COMMENT ON COLUMN cf_token.upd_by             IS '수정자(= client_id)';
COMMENT ON COLUMN cf_token.upd_date           IS '마지막 재발급(refresh) 일시';
