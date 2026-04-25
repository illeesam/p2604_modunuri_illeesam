-- ============================================================
-- sy_prop : 프로퍼티 (환경설정/공통 파라미터)
-- disp_path 는 점(.) 구분 표시경로 (예: 'site.email.smtp.host')
-- 좌측 트리 빌드 시 disp_path(표시경로) 의 점을 기준으로 계층 생성
-- ============================================================
CREATE TABLE sy_prop (
    prop_id         BIGSERIAL       NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id (NULL = 전역)
    disp_path       VARCHAR(200)    NOT NULL,               -- 점 구분 표시경로 (aa.bb.cc)
    prop_key        VARCHAR(100)    NOT NULL,               -- 키 (코드 식별자, snake_case 권장)
    prop_value      TEXT,                                   -- 값 (JSON/문자열/숫자 등)
    prop_label      VARCHAR(200)    NOT NULL,               -- 표시명
    prop_type_cd    VARCHAR(20)     DEFAULT 'STRING',       -- 코드: PROP_TYPE (STRING/NUMBER/BOOLEAN/JSON)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    prop_remark     VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prop_id),
    UNIQUE (site_id, disp_path, prop_key)                   -- 사이트 + 표시경로 + 키 조합 유일
);

COMMENT ON TABLE  sy_prop              IS '프로퍼티 (환경설정/공통 파라미터)';
COMMENT ON COLUMN sy_prop.prop_id      IS '프로퍼티ID (PK, auto)';
COMMENT ON COLUMN sy_prop.site_id      IS '사이트ID (sy_site.site_id, NULL=전역)';
COMMENT ON COLUMN sy_prop.disp_path    IS '점(.) 구분 표시경로 (aa.bb.cc)';
COMMENT ON COLUMN sy_prop.prop_key     IS '키 (코드 식별자)';
COMMENT ON COLUMN sy_prop.prop_value   IS '값';
COMMENT ON COLUMN sy_prop.prop_label   IS '표시명';
COMMENT ON COLUMN sy_prop.prop_type_cd IS '값 타입 (코드: PROP_TYPE — STRING/NUMBER/BOOLEAN/JSON)';
COMMENT ON COLUMN sy_prop.sort_ord     IS '같은 표시경로 내 정렬순서';
COMMENT ON COLUMN sy_prop.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN sy_prop.prop_remark  IS '비고';

CREATE INDEX idx_sy_disp_path  ON sy_prop (disp_path);
CREATE INDEX idx_sy_prop_site  ON sy_prop (site_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_prop.prop_type_cd (값 타입) : PROP_TYPE { STRING:문자열, NUMBER:숫자, BOOLEAN:불리언, JSON:JSON }
