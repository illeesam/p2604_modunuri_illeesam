-- ============================================================
CREATE TABLE mb_member_group (
    group_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    group_nm        VARCHAR(100)    NOT NULL,
    group_memo      TEXT,
    use_yn          VARCHAR(1)      DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (group_id)
);

COMMENT ON TABLE mb_member_group IS '회원그룹';
COMMENT ON COLUMN mb_member_group.group_id   IS '그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_group.site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member_group.group_nm   IS '그룹명';
COMMENT ON COLUMN mb_member_group.group_memo IS '메모';
COMMENT ON COLUMN mb_member_group.use_yn     IS '사용여부 Y/N';
COMMENT ON COLUMN mb_member_group.reg_by     IS '등록자ID';
COMMENT ON COLUMN mb_member_group.reg_date   IS '등록일시';
COMMENT ON COLUMN mb_member_group.upd_by     IS '수정자ID';
COMMENT ON COLUMN mb_member_group.upd_date   IS '수정일시';

-- 회원-그룹 매핑
CREATE TABLE mb_member_group_map (
    group_id        VARCHAR(21)     NOT NULL,               -- mb_member_group.group_id
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, member_id)
);

COMMENT ON TABLE mb_member_group_map IS '회원그룹-회원 매핑';
COMMENT ON COLUMN mb_member_group_map.group_id   IS '그룹ID (mb_member_group.group_id)';
COMMENT ON COLUMN mb_member_group_map.member_id  IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_member_group_map.reg_by     IS '등록자ID';
COMMENT ON COLUMN mb_member_group_map.reg_date   IS '등록일시';

CREATE INDEX idx_mb_member_group_site      ON mb_member_group (site_id);
CREATE INDEX idx_mb_member_group_map_mem   ON mb_member_group_map (member_id);
