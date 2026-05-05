-- sy_menu 테이블 DDL
-- 메뉴

CREATE TABLE shopjoy_2604.sy_menu (
    menu_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21) ,
    menu_code      VARCHAR(50)  NOT NULL,
    menu_nm        VARCHAR(100) NOT NULL,
    parent_menu_id VARCHAR(21) ,
    menu_url       VARCHAR(200),
    menu_type_cd   VARCHAR(20)  DEFAULT 'PAGE',
    icon_class     VARCHAR(100),
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y',
    menu_remark    VARCHAR(300),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_menu IS '메뉴';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_id IS '메뉴ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_menu.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_code IS '메뉴코드';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_nm IS '메뉴명';
COMMENT ON COLUMN shopjoy_2604.sy_menu.parent_menu_id IS '상위메뉴ID';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_url IS '메뉴URL';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_type_cd IS '메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)';
COMMENT ON COLUMN shopjoy_2604.sy_menu.icon_class IS '아이콘 CSS 클래스';
COMMENT ON COLUMN shopjoy_2604.sy_menu.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_menu.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_menu.menu_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_menu.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_menu.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_menu.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_menu.upd_date IS '수정일';

CREATE UNIQUE INDEX sy_menu_menu_code_key ON shopjoy_2604.sy_menu USING btree (menu_code);
