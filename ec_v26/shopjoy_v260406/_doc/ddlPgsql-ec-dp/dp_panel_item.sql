-- ============================================================
-- dp_panel_item : 디스플레이 패널 항목 (위젯 인스턴스)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 참조 방식: dp_widget_lib 참조 OR 직접 콘텐츠 생성
-- ============================================================
CREATE TABLE dp_panel_item (
    panel_item_id           VARCHAR(21)     NOT NULL,
    panel_id                VARCHAR(21)     NOT NULL,              -- FK: dp_panel.panel_id
    widget_lib_id           VARCHAR(21),                            -- FK: dp_widget_lib.widget_lib_id (선택사항)
    widget_type_cd          VARCHAR(30),                            -- 위젯유형 (코드: WIDGET_TYPE)
    widget_title            VARCHAR(200),                           -- 위젯 타이틀
    widget_content          TEXT,                                   -- 위젯 내용 (HTML 에디터)
    title_show_yn           CHAR(1)         DEFAULT 'Y',            -- 타이틀 표시 여부
    widget_lib_ref_yn       CHAR(1)         DEFAULT 'N',            -- dp_widget_lib 참조 여부
    content_type_cd         VARCHAR(30),                            -- 콘텐츠 유형 (WIDGET/HTML/TEXT/IMAGE 등)
    item_sort_ord           INTEGER         DEFAULT 0,              -- 항목정렬순서
    widget_config_json      TEXT,                                   -- 위젯별 설정 (JSON - 위젯 특정 설정)
    visibility_targets      VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    disp_yn                 CHAR(1)         DEFAULT 'Y',            -- 전시여부 Y/N
    disp_start_date         DATE,                                   -- 전시시작일
    disp_start_time         TIME,                                   -- 전시시작시간
    disp_end_date           DATE,                                   -- 전시종료일
    disp_end_time           TIME,                                   -- 전시종료시간
    disp_env                VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    use_yn                  CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,
    PRIMARY KEY (panel_item_id),
    FOREIGN KEY (panel_id) REFERENCES dp_panel(panel_id),
    FOREIGN KEY (widget_lib_id) REFERENCES dp_widget_lib(widget_lib_id)
);

COMMENT ON TABLE dp_panel_item IS '디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성)';
COMMENT ON COLUMN dp_panel_item.panel_item_id         IS '패널항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_panel_item.panel_id              IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN dp_panel_item.widget_lib_id         IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)';
COMMENT ON COLUMN dp_panel_item.widget_type_cd        IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN dp_panel_item.widget_title          IS '위젯타이틀';
COMMENT ON COLUMN dp_panel_item.widget_content        IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN dp_panel_item.title_show_yn         IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.widget_lib_ref_yn     IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.content_type_cd       IS '콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)';
COMMENT ON COLUMN dp_panel_item.item_sort_ord         IS '항목정렬순서';
COMMENT ON COLUMN dp_panel_item.widget_config_json    IS '위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)';
COMMENT ON COLUMN dp_panel_item.visibility_targets    IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_panel_item.disp_yn               IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN dp_panel_item.disp_start_date       IS '전시시작일';
COMMENT ON COLUMN dp_panel_item.disp_start_time       IS '전시시작시간';
COMMENT ON COLUMN dp_panel_item.disp_end_date         IS '전시종료일';
COMMENT ON COLUMN dp_panel_item.disp_end_time         IS '전시종료시간';
COMMENT ON COLUMN dp_panel_item.disp_env             IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_panel_item.use_yn                IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel_item.reg_date              IS '등록일';
COMMENT ON COLUMN dp_panel_item.upd_by                IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel_item.upd_date              IS '수정일';

CREATE INDEX idx_dp_panel_item_panel ON dp_panel_item (panel_id);
CREATE INDEX idx_dp_panel_item_widget_lib ON dp_panel_item (widget_lib_id);
CREATE INDEX idx_dp_panel_item_ord ON dp_panel_item (panel_id, item_sort_ord);
CREATE INDEX idx_dp_panel_item_disp_yn ON dp_panel_item (disp_yn);
CREATE INDEX idx_dp_panel_item_disp_date ON dp_panel_item (disp_start_date, disp_end_date);
CREATE INDEX idx_dp_panel_item_disp_env ON dp_panel_item (disp_env);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_panel_item.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }
