-- ============================================================
-- dp_panel_item : 디스플레이 패널 항목 (위젯 인스턴스)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 참조 방식: dp_widget_lib 참조 OR 직접 콘텐츠 생성
-- ============================================================
CREATE TABLE dp_panel_item (
    panel_item_id           VARCHAR(16)     NOT NULL,
    panel_id                VARCHAR(16)     NOT NULL,              -- FK: dp_panel.panel_id
    widget_lib_id           VARCHAR(16),                            -- FK: dp_widget_lib.widget_lib_id (선택사항)
    widget_type_cd          VARCHAR(30),                            -- 위젯유형 (코드: WIDGET_TYPE)
    widget_title            VARCHAR(200),                           -- 위젯 타이틀
    widget_content          TEXT,                                   -- 위젯 내용 (HTML 에디터)
    title_show_yn           CHAR(1)         DEFAULT 'Y',            -- 타이틀 표시 여부
    widget_lib_ref_yn       CHAR(1)         DEFAULT 'N',            -- dp_widget_lib 참조 여부
    content_type_cd         VARCHAR(30),                            -- 콘텐츠 유형 (WIDGET/HTML/TEXT/IMAGE 등)
    item_sort_ord           INTEGER         DEFAULT 0,              -- 항목정렬순서
    widget_config_json      TEXT,                                   -- 위젯별 설정 (JSON - 위젯 특정 설정)
    visibility_targets      VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    use_yn                  CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
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
COMMENT ON COLUMN dp_panel_item.use_yn                IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_panel_item.reg_by                IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_panel_item.reg_date              IS '등록일';
COMMENT ON COLUMN dp_panel_item.upd_by                IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN dp_panel_item.upd_date              IS '수정일';

CREATE INDEX idx_dp_panel_item_panel ON dp_panel_item (panel_id);
CREATE INDEX idx_dp_panel_item_widget_lib ON dp_panel_item (widget_lib_id);
CREATE INDEX idx_dp_panel_item_ord ON dp_panel_item (panel_id, item_sort_ord);
