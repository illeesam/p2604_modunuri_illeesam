-- ============================================================
-- ec_tag : 태그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_tag (
    tag_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    tag_nm          VARCHAR(100)    NOT NULL,
    tag_desc        VARCHAR(300),
    use_count       INTEGER         DEFAULT 0,              -- 사용 빈도
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (tag_id),
    UNIQUE (site_id, tag_nm)
);

COMMENT ON TABLE pd_tag IS '태그';
COMMENT ON COLUMN pd_tag.tag_id          IS '태그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_tag.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_tag.tag_nm          IS '태그명';
COMMENT ON COLUMN pd_tag.tag_desc        IS '태그설명';
COMMENT ON COLUMN pd_tag.use_count       IS '사용 빈도';
COMMENT ON COLUMN pd_tag.sort_ord        IS '정렬순서';
COMMENT ON COLUMN pd_tag.use_yn          IS '사용여부 Y/N';
COMMENT ON COLUMN pd_tag.reg_by          IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_tag.reg_date        IS '등록일';
COMMENT ON COLUMN pd_tag.upd_by          IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_tag.upd_date        IS '수정일';

CREATE INDEX idx_pd_tag_nm ON pd_tag (tag_nm);
