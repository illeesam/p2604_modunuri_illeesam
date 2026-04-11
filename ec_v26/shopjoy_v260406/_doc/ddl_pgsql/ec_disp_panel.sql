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
    description     VARCHAR(300),
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
COMMENT ON COLUMN ec_disp_area.area_code    IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN ec_disp_area.area_nm      IS '영역명';
COMMENT ON COLUMN ec_disp_area.area_type    IS '영역유형 (FULL/SIDEBAR/POPUP 등)';
COMMENT ON COLUMN ec_disp_area.description  IS '설명';
COMMENT ON COLUMN ec_disp_area.sort_ord     IS '정렬순서';
COMMENT ON COLUMN ec_disp_area.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN ec_disp_area.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_area.reg_date     IS '등록일';
COMMENT ON COLUMN ec_disp_area.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_area.upd_date     IS '수정일';

-- ============================================================
-- ec_disp_panel : 디스플레이 패널
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_disp_panel (
    panel_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    area_cd         VARCHAR(50)     NOT NULL,               -- 코드: DISP_AREA (MAIN_TOP/MAIN_BANNER 등)
    panel_nm        VARCHAR(100)    NOT NULL,
    widget_type_cd  VARCHAR(30),                            -- 코드: WIDGET_TYPE (BANNER/PRODUCT/HTML 등)
    panel_type_cd    VARCHAR(30),                            -- 코드: DISP_TYPE
    click_action    VARCHAR(30),                            -- LINK/MODAL/NONE
    click_target    VARCHAR(500),
    condition_type  VARCHAR(30),                            -- ALL/GRADE/LOGIN
    auth_required   CHAR(1)         DEFAULT 'N',
    auth_grade_cd   VARCHAR(20),
    sort_ord        INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: DISP_STATUS
    content_json    TEXT,                                   -- 패널별 확장 데이터 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (panel_id)
);

COMMENT ON TABLE  ec_disp_panel                IS '디스플레이 패널';
COMMENT ON COLUMN ec_disp_panel.panel_id  IS '패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_disp_panel.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_disp_panel.area_cd        IS '영역코드 (코드: DISP_AREA)';
COMMENT ON COLUMN ec_disp_panel.panel_nm       IS '패널명';
COMMENT ON COLUMN ec_disp_panel.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN ec_disp_panel.panel_type_cd   IS '표시유형 (코드: DISP_TYPE)';
COMMENT ON COLUMN ec_disp_panel.click_action   IS '클릭동작 (LINK/MODAL/NONE)';
COMMENT ON COLUMN ec_disp_panel.click_target   IS '클릭대상 (URL 또는 ID)';
COMMENT ON COLUMN ec_disp_panel.condition_type IS '노출조건 (ALL/GRADE/LOGIN)';
COMMENT ON COLUMN ec_disp_panel.auth_required  IS '로그인필요 Y/N';
COMMENT ON COLUMN ec_disp_panel.auth_grade_cd  IS '노출등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN ec_disp_panel.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_disp_panel.status_cd      IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN ec_disp_panel.content_json   IS '확장데이터 (JSON)';
COMMENT ON COLUMN ec_disp_panel.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_panel.reg_date       IS '등록일';
COMMENT ON COLUMN ec_disp_panel.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_panel.upd_date       IS '수정일';

-- 패널에 배치된 위젯 인스턴스
CREATE TABLE ec_disp_widget (
    widget_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    panel_id   VARCHAR(16)     NOT NULL,              -- ec_disp_panel.panel_id
    widget_lib_id   VARCHAR(16),                           -- ec_disp_widget_lib.widget_lib_id (NULL 허용: 커스텀 위젯)
    widget_nm       VARCHAR(100),
    widget_type_cd  VARCHAR(30),                           -- 코드: WIDGET_TYPE (image_banner/product_slider 등)
    click_action    VARCHAR(30),                           -- LINK/MODAL/NONE
    click_target    VARCHAR(500),                          -- URL 또는 대상 ID
    sort_ord        INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',      -- 코드: DISP_STATUS
    content_json    TEXT,                                  -- 위젯별 콘텐츠 데이터 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (widget_id)
);

COMMENT ON TABLE  ec_disp_widget                IS '디스플레이 위젯 인스턴스 (패널 배치 위젯)';
COMMENT ON COLUMN ec_disp_widget.widget_id      IS '위젯ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_disp_widget.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_disp_widget.panel_id  IS '패널ID (ec_disp_panel.panel_id)';
COMMENT ON COLUMN ec_disp_widget.widget_lib_id  IS '위젯라이브러리ID (ec_disp_widget_lib.widget_lib_id)';
COMMENT ON COLUMN ec_disp_widget.widget_nm      IS '위젯명';
COMMENT ON COLUMN ec_disp_widget.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN ec_disp_widget.click_action   IS '클릭동작 (LINK/MODAL/NONE)';
COMMENT ON COLUMN ec_disp_widget.click_target   IS '클릭대상 (URL 또는 ID)';
COMMENT ON COLUMN ec_disp_widget.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_disp_widget.status_cd      IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN ec_disp_widget.content_json   IS '위젯 콘텐츠 데이터 (JSON)';
COMMENT ON COLUMN ec_disp_widget.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_widget.reg_date       IS '등록일';
COMMENT ON COLUMN ec_disp_widget.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_disp_widget.upd_date       IS '수정일';
