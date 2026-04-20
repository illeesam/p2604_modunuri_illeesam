-- ============================================================
-- sy_menu : 메뉴
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_menu (
    menu_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    menu_code       VARCHAR(50)     NOT NULL,
    menu_nm         VARCHAR(100)    NOT NULL,
    parent_menu_id       VARCHAR(21),
    menu_url        VARCHAR(200),
    menu_type_cd    VARCHAR(20)     DEFAULT 'PAGE',         -- 코드: MENU_TYPE (PAGE/FOLDER/LINK)
    icon_class      VARCHAR(100),
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    menu_remark     VARCHAR(300),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (menu_id),
    UNIQUE (menu_code)
);

COMMENT ON TABLE  sy_menu                IS '메뉴';
COMMENT ON COLUMN sy_menu.menu_id        IS '메뉴ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_menu.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_menu.menu_code      IS '메뉴코드';
COMMENT ON COLUMN sy_menu.menu_nm        IS '메뉴명';
COMMENT ON COLUMN sy_menu.parent_menu_id      IS '상위메뉴ID';
COMMENT ON COLUMN sy_menu.menu_url       IS '메뉴URL';
COMMENT ON COLUMN sy_menu.menu_type_cd   IS '메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)';
COMMENT ON COLUMN sy_menu.icon_class     IS '아이콘 CSS 클래스';
COMMENT ON COLUMN sy_menu.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_menu.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_menu.menu_remark    IS '비고';
COMMENT ON COLUMN sy_menu.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_menu.reg_date       IS '등록일';
COMMENT ON COLUMN sy_menu.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_menu.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_menu.menu_type_cd (메뉴유형) : MENU_TYPE { PAGE:페이지, FOLDER:폴더, LINK:링크 }
