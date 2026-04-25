-- 다국어 키 마스터
CREATE TABLE sy_i18n (
    i18n_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id (NULL=전체 공용)
    i18n_key        VARCHAR(200)    NOT NULL,               -- 다국어 키 (예: common.bt.save)
    i18n_desc       VARCHAR(200),                           -- 키 설명
    i18n_scope_cd   VARCHAR(20)     DEFAULT 'COMMON',       -- 코드: I18N_SCOPE (FO/BO/COMMON)
    i18n_category   VARCHAR(50),                            -- 키 첫 세그먼트 (common/error/link 등)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (i18n_id),
    UNIQUE (i18n_key, i18n_scope_cd)
);

COMMENT ON TABLE  sy_i18n                  IS '다국어 키 마스터';
COMMENT ON COLUMN sy_i18n.i18n_id          IS '다국어ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_i18n.site_id          IS '사이트ID (sy_site.site_id, NULL=전체 공용)';
COMMENT ON COLUMN sy_i18n.i18n_key         IS '다국어 키 (예: common.bt.save, error.FORBIDDEN)';
COMMENT ON COLUMN sy_i18n.i18n_desc        IS '키 설명 (번역자 참고용)';
COMMENT ON COLUMN sy_i18n.i18n_scope_cd    IS '적용범위 (코드: I18N_SCOPE — FO/BO/COMMON)';
COMMENT ON COLUMN sy_i18n.i18n_category    IS '키 첫 세그먼트 (common/error/link/paging 등)';
COMMENT ON COLUMN sy_i18n.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_i18n.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_i18n.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n.reg_date         IS '등록일';
COMMENT ON COLUMN sy_i18n.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_i18n.upd_date         IS '수정일';

CREATE INDEX idx_sy_i18n_scope    ON sy_i18n (i18n_scope_cd, use_yn);
CREATE INDEX idx_sy_i18n_category ON sy_i18n (i18n_category);
CREATE INDEX idx_sy_i18n_site     ON sy_i18n (site_id) WHERE site_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_i18n.i18n_scope_cd (적용범위) : I18N_SCOPE: FO/BO/COMMON
