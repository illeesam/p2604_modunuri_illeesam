-- cf_client — EcCdnApi 를 호출하는 내부 서비스 계정(id/pwd 로그인 → accessToken 30초/refreshToken 7일).
-- 현재 유일한 호출자는 EcAdminApi. 같은 Postgres 서버/스키마(shopjoy_2604)에 EcCdnApi 전용 테이블로 신설.
CREATE TABLE IF NOT EXISTS cf_client (
    client_id     VARCHAR(40)   NOT NULL,
    client_pwd    VARCHAR(200)  NOT NULL,      -- BCrypt 해시. 평문 저장 금지
    client_nm     VARCHAR(100)  NOT NULL,
    use_yn        VARCHAR(1)    NOT NULL DEFAULT 'Y',
    reg_date      TIMESTAMP     NOT NULL DEFAULT now(),
    upd_date      TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_cf_client PRIMARY KEY (client_id)
);

COMMENT ON TABLE  cf_client               IS 'EcCdnApi 호출용 내부 서비스 계정';
COMMENT ON COLUMN cf_client.client_id     IS '클라이언트 ID (로그인 id, 예: ecadminapi)';
COMMENT ON COLUMN cf_client.client_pwd    IS '비밀번호 BCrypt 해시';
COMMENT ON COLUMN cf_client.client_nm     IS '클라이언트 명칭(예: EcAdminApi 내부연동)';
COMMENT ON COLUMN cf_client.use_yn        IS '사용여부 Y/N';
COMMENT ON COLUMN cf_client.reg_date      IS '등록일시';
COMMENT ON COLUMN cf_client.upd_date      IS '수정일시';
