-- ============================================================
-- ec_disp_panel : 디스플레이 패널 / ec_disp_widget_lib : 위젯 라이브러리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_disp_panel (
    disp_panel_id   VARCHAR(16)     NOT NULL,
    area_cd         VARCHAR(50)     NOT NULL,               -- 코드: DISP_AREA (MAIN_TOP/MAIN_BANNER 등)
    panel_name      VARCHAR(100)    NOT NULL,
    widget_type_cd  VARCHAR(30),                            -- 코드: WIDGET_TYPE (BANNER/PRODUCT/HTML 등)
    disp_type_cd    VARCHAR(30),                            -- 코드: DISP_TYPE
    click_action    VARCHAR(30),                            -- LINK/MODAL/NONE
    click_target    VARCHAR(500),
    condition_type  VARCHAR(30),                            -- ALL/GRADE/LOGIN
    auth_required   CHAR(1)         DEFAULT 'N',
    auth_grade_cd   VARCHAR(20),
    sort_ord        INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: DISP_STATUS
    content_json    TEXT,                                   -- 패널별 확장 데이터 (JSON)
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (disp_panel_id)
);

COMMENT ON TABLE  ec_disp_panel                IS '디스플레이 패널';
COMMENT ON COLUMN ec_disp_panel.disp_panel_id  IS '패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_disp_panel.area_cd        IS '영역코드 (코드: DISP_AREA)';
COMMENT ON COLUMN ec_disp_panel.panel_name     IS '패널명';
COMMENT ON COLUMN ec_disp_panel.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN ec_disp_panel.disp_type_cd   IS '표시유형 (코드: DISP_TYPE)';
COMMENT ON COLUMN ec_disp_panel.click_action   IS '클릭동작 (LINK/MODAL/NONE)';
COMMENT ON COLUMN ec_disp_panel.click_target   IS '클릭대상 (URL 또는 ID)';
COMMENT ON COLUMN ec_disp_panel.condition_type IS '노출조건 (ALL/GRADE/LOGIN)';
COMMENT ON COLUMN ec_disp_panel.auth_required  IS '로그인필요 Y/N';
COMMENT ON COLUMN ec_disp_panel.auth_grade_cd  IS '노출등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN ec_disp_panel.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_disp_panel.status_cd      IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN ec_disp_panel.content_json   IS '확장데이터 (JSON)';
COMMENT ON COLUMN ec_disp_panel.reg_date       IS '등록일';
COMMENT ON COLUMN ec_disp_panel.upd_date       IS '수정일';
