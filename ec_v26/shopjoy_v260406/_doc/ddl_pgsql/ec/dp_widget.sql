CREATE TABLE dp_widget (
    widget_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    panel_id   VARCHAR(16)     NOT NULL,              -- dp_panel.
    widget_lib_id   VARCHAR(16),                           -- dp_widget_lib. (NULL 허용: 커스텀 위젯)
    widget_nm       VARCHAR(100),
    disp_path       VARCHAR(500),                          -- 점(.) 구분 표시경로(다중: 콤마 구분, 예: FRONT.모바일메인,ADMIN.대시보드)
    widget_type_cd  VARCHAR(30),                           -- 코드: WIDGET_TYPE (image_banner/product_slider 등)
    click_action    VARCHAR(30),                           -- LINK/MODAL/NONE
    click_target    VARCHAR(500),                          -- URL 또는 대상 ID
    sort_ord        INTEGER         DEFAULT 0,
    disp_widget_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',      -- 코드: DISP_STATUS
    disp_widget_status_cd_before VARCHAR(20),              -- 변경 전 위젯상태
    content_json    TEXT,                                  -- 위젯별 콘텐츠 데이터 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (widget_id)
);

COMMENT ON TABLE dp_widget IS '디스플레이 위젯 인스턴스 (패널 배치 위젯)';
COMMENT ON COLUMN dp_widget.widget_id      IS '위젯ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_widget.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_widget.panel_id  IS '패널ID (dp_panel.)';
COMMENT ON COLUMN dp_widget.widget_lib_id  IS '위젯라이브러리ID (dp_widget_lib.)';
COMMENT ON COLUMN dp_widget.widget_nm      IS '위젯명';
COMMENT ON COLUMN dp_widget.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN dp_widget.click_action   IS '클릭동작 (LINK/MODAL/NONE)';
COMMENT ON COLUMN dp_widget.click_target   IS '클릭대상 (URL 또는 ID)';
COMMENT ON COLUMN dp_widget.sort_ord       IS '정렬순서';
COMMENT ON COLUMN dp_widget.disp_widget_status_cd IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_widget.disp_widget_status_cd_before IS '변경 전 위젯상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_widget.content_json   IS '위젯 콘텐츠 데이터 (JSON)';
COMMENT ON COLUMN dp_widget.reg_by         IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_widget.reg_date       IS '등록일';
COMMENT ON COLUMN dp_widget.upd_by         IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_widget.upd_date       IS '수정일';
COMMENT ON COLUMN dp_widget.disp_path IS '점(.) 구분 표시경로';
