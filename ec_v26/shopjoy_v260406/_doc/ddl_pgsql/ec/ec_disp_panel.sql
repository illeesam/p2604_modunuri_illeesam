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
    auth_required   CHAR(1)         DEFAULT 'N',             -- [DEPRECATED] → visibility_targets에 VERIFIED 포함
    auth_grade_cd   VARCHAR(20),                             -- [DEPRECATED] → visibility_targets에 VIP/PREMIUM 포함
    visibility_targets VARCHAR(200),                         -- 공개대상(^CODE^CODE^ 형식), 코드: VISIBILITY_TARGET
    disp_path       VARCHAR(200),                            -- 점(.) 구분 표시경로 (예: FRONT.모바일메인)
    sort_ord        INTEGER         DEFAULT 0,
    condition_type_cd VARCHAR(30),                           -- [DEPRECATED] ALL/GRADE/LOGIN — visibility_targets로 대체
    disp_panel_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: DISP_STATUS
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
COMMENT ON COLUMN ec_disp_panel.auth_required  IS '[DEPRECATED] 로그인필요 Y/N — visibility_targets의 VERIFIED로 대체';
COMMENT ON COLUMN ec_disp_panel.auth_grade_cd  IS '[DEPRECATED] 노출등급 — visibility_targets의 VIP/PREMIUM으로 대체';
COMMENT ON COLUMN ec_disp_panel.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식, 하나라도 해당하면 노출)';
COMMENT ON COLUMN ec_disp_panel.sort_ord       IS '정렬순서';
COMMENT ON COLUMN ec_disp_panel.condition_type_cd IS '[DEPRECATED] 노출조건 (코드: DISP_CONDITION_TYPE — ALL/GRADE/LOGIN) — visibility_targets로 대체';
COMMENT ON COLUMN ec_disp_panel.disp_panel_status_cd IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN ec_disp_panel.content_json   IS '확장데이터 (JSON)';
COMMENT ON COLUMN ec_disp_panel.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_disp_panel.reg_date       IS '등록일';
COMMENT ON COLUMN ec_disp_panel.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_disp_panel.upd_date       IS '수정일';

-- 패널에 배치된 위젯 인스턴스
COMMENT ON COLUMN ec_disp_panel.disp_path IS '점(.) 구분 표시경로';
