-- sy_user_bookmark 테이블 DDL
-- 관리자 사용자-메뉴 매핑 (N:M)

CREATE TABLE shopjoy_2604.sy_user_bookmark (
    user_bookmark_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    user_id              VARCHAR(21)  NOT NULL,
    menu_id              VARCHAR(21)  NOT NULL,
    grant_user_id        VARCHAR(21) ,
    grant_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valid_from           DATE        ,
    valid_to             DATE        ,
    user_bookmark_remark VARCHAR(500),
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   ,
    site_id              VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.sy_user_bookmark IS '관리자 사용자-메뉴 매핑 (N:M)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.user_bookmark_id IS '사용자메뉴ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.user_id IS '사용자ID (sy_user.user_id, UNIQUE with menu_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.menu_id IS '메뉴ID (sy_menu.menu_id, UNIQUE with user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_bookmark.upd_date IS '수정일';

CREATE INDEX idx_sy_user_bookmark_site ON shopjoy_2604.sy_user_bookmark USING btree (site_id);
CREATE INDEX idx_sy_user_bookmark_user ON shopjoy_2604.sy_user_bookmark USING btree (user_id);
CREATE UNIQUE INDEX sy_user_bookmark_user_id_menu_id_key ON shopjoy_2604.sy_user_bookmark USING btree (user_id, menu_id);
