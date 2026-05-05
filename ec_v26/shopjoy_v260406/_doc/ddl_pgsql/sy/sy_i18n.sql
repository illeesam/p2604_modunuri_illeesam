-- sy_i18n 테이블 DDL
-- 다국어 키 마스터

CREATE TABLE shopjoy_2604.sy_i18n (
    i18n_id       VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21) ,
    i18n_key      VARCHAR(200) NOT NULL,
    i18n_desc     VARCHAR(200),
    i18n_scope_cd VARCHAR(20)  DEFAULT 'COMMON',
    i18n_category VARCHAR(50) ,
    sort_ord      INTEGER      DEFAULT 0,
    use_yn        VARCHAR(1)   DEFAULT 'Y',
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_i18n IS '다국어 키 마스터';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.i18n_id IS '다국어ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.site_id IS '사이트ID (sy_site.site_id, NULL=전체 공용)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.i18n_key IS '다국어 키 (예: common.bt.save, error.FORBIDDEN)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.i18n_desc IS '키 설명 (번역자 참고용)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.i18n_scope_cd IS '적용범위 (코드: I18N_SCOPE — FO/BO/COMMON)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.i18n_category IS '키 첫 세그먼트 (common/error/link/paging 등)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n.upd_date IS '수정일';

CREATE INDEX idx_sy_i18n_category ON shopjoy_2604.sy_i18n USING btree (i18n_category);
CREATE INDEX idx_sy_i18n_scope ON shopjoy_2604.sy_i18n USING btree (i18n_scope_cd, use_yn);
CREATE INDEX idx_sy_i18n_site ON shopjoy_2604.sy_i18n USING btree (site_id) WHERE (site_id IS NOT NULL);
CREATE UNIQUE INDEX sy_i18n_i18n_key_i18n_scope_cd_key ON shopjoy_2604.sy_i18n USING btree (i18n_key, i18n_scope_cd);
