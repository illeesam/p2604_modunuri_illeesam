-- 역할-메뉴 권한 매핑
CREATE TABLE sy_role_menu (
    role_menu_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    role_id         VARCHAR(21)     NOT NULL,
    menu_id         VARCHAR(21)     NOT NULL,
    perm_level      SMALLINT        DEFAULT 1,              -- 1:조회 / 2:수정 / 3:삭제
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (role_menu_id),
    UNIQUE (role_id, menu_id)
);

COMMENT ON TABLE  sy_role_menu              IS '역할-메뉴 권한 매핑';
COMMENT ON COLUMN sy_role_menu.role_menu_id IS '역할메뉴ID';
COMMENT ON COLUMN sy_role_menu.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_role_menu.role_id      IS '역할ID';
COMMENT ON COLUMN sy_role_menu.menu_id      IS '메뉴ID';
COMMENT ON COLUMN sy_role_menu.perm_level   IS '권한레벨 (1:조회/2:수정/3:삭제)';
COMMENT ON COLUMN sy_role_menu.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role_menu.reg_date     IS '등록일';
COMMENT ON COLUMN sy_role_menu.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_role_menu.upd_date     IS '수정일';
