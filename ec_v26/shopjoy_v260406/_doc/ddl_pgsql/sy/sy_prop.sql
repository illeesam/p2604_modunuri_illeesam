-- sy_prop 테이블 DDL
-- 프로퍼티 (환경설정/공통 파라미터)

CREATE TABLE shopjoy_2604.sy_prop (
    prop_id      VARCHAR(21)  NOT NULL DEFAULT nextval('sy_prop_prop_id_seq'::regclass) PRIMARY KEY,
    site_id      VARCHAR(21)  NOT NULL,
    path_id      VARCHAR(21)  NOT NULL,
    prop_key     VARCHAR(100) NOT NULL,
    prop_value   TEXT        ,
    prop_label   VARCHAR(200) NOT NULL,
    prop_type_cd VARCHAR(20)  DEFAULT 'STRING'::character varying,
    sort_ord     INTEGER      DEFAULT 0,
    use_yn       VARCHAR(1)   DEFAULT 'Y'::bpchar,
    prop_remark  VARCHAR(500),
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30) ,
    upd_date     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_prop IS '프로퍼티 (환경설정/공통 파라미터)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_id IS '프로퍼티ID (PK, auto)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.site_id IS '사이트ID (sy_site.site_id, NULL=전역)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.path_id IS '점(.) 구분 표시경로 (aa.bb.cc)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_key IS '키 (코드 식별자)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_value IS '값';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_label IS '표시명';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_type_cd IS '값 타입 (코드: PROP_TYPE — STRING/NUMBER/BOOLEAN/JSON)';
COMMENT ON COLUMN shopjoy_2604.sy_prop.sort_ord IS '같은 표시경로 내 정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_prop.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_remark IS '비고';

CREATE INDEX idx_sy_disp_path ON shopjoy_2604.sy_prop USING btree (path_id);
CREATE INDEX idx_sy_prop_site ON shopjoy_2604.sy_prop USING btree (site_id);
CREATE UNIQUE INDEX sy_prop_site_id_disp_path_prop_key_key ON shopjoy_2604.sy_prop USING btree (site_id, path_id, prop_key);
