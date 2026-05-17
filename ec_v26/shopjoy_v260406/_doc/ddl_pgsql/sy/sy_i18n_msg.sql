-- sy_i18n_msg 테이블 DDL
-- 다국어 메시지 (언어별)

CREATE TABLE shopjoy_2604.sy_i18n_msg (
    i18n_msg_id VARCHAR(21) NOT NULL PRIMARY KEY,
    i18n_id     VARCHAR(21) NOT NULL,
    lang_cd     VARCHAR(10) NOT NULL,
    i18n_msg    TEXT        NOT NULL,
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP  ,
    site_id     VARCHAR(21) NOT NULL,
    CONSTRAINT fk_sy_i18n_msg_i18n FOREIGN KEY (i18n_id) REFERENCES shopjoy_2604.sy_i18n (i18n_id)
);

COMMENT ON TABLE  shopjoy_2604.sy_i18n_msg IS '다국어 메시지 (언어별)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.i18n_msg_id IS '다국어 메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.i18n_id IS '다국어ID (sy_i18n.i18n_id)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.lang_cd IS '언어코드 (코드: LANG_CODE — ko/en/ja/in)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.i18n_msg IS '번역 메시지 (플레이스홀더: {0},{1} 지원)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_i18n_msg.upd_date IS '수정일';

CREATE INDEX idx_sy_i18n_msg_i18n ON shopjoy_2604.sy_i18n_msg USING btree (i18n_id);
CREATE INDEX idx_sy_i18n_msg_lang ON shopjoy_2604.sy_i18n_msg USING btree (lang_cd);
CREATE INDEX idx_sy_i18n_msg_site ON shopjoy_2604.sy_i18n_msg USING btree (site_id);
CREATE UNIQUE INDEX sy_i18n_msg_i18n_id_lang_cd_key ON shopjoy_2604.sy_i18n_msg USING btree (i18n_id, lang_cd);
