-- ============================================================
-- ec_disp_area : 디스플레이 영역
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_disp_area (
    area_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    area_cd         VARCHAR(50)     NOT NULL,               -- 예: MAIN_TOP, MAIN_BANNER, SIDEBAR_MID
    area_nm         VARCHAR(100)    NOT NULL,
    area_type       VARCHAR(30),                            -- FULL/SIDEBAR/POPUP 등
    desc            VARCHAR(300),
    disp_path       VARCHAR(200),                            -- 점(.) 구분 표시경로 (예: FRONT.모바일메인)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (area_id),
    UNIQUE (site_id, area_cd)
);

COMMENT ON TABLE  ec_disp_area              IS '디스플레이 영역';
COMMENT ON COLUMN ec_disp_area.area_id      IS '영역ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_disp_area.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_disp_area.area_cd     IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN ec_disp_area.area_nm      IS '영역명';
COMMENT ON COLUMN ec_disp_area.area_type    IS '영역유형 (FULL/SIDEBAR/POPUP 등)';
COMMENT ON COLUMN ec_disp_area.desc         IS '설명';
COMMENT ON COLUMN ec_disp_area.sort_ord     IS '정렬순서';
COMMENT ON COLUMN ec_disp_area.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN ec_disp_area.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_disp_area.reg_date     IS '등록일';
COMMENT ON COLUMN ec_disp_area.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_disp_area.upd_date     IS '수정일';

-- ============================================================
-- ec_disp_panel : 디스플레이 패널
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
COMMENT ON COLUMN ec_disp_area.disp_path IS '점(.) 구분 표시경로';
