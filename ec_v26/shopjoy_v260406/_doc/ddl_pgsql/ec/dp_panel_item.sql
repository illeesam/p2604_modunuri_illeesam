-- dp_panel_item 테이블 DDL
-- 디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성)

CREATE TABLE shopjoy_2604.dp_panel_item (
    panel_item_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    panel_id           VARCHAR(21)  NOT NULL,
    widget_lib_id      VARCHAR(21) ,
    widget_type_cd     VARCHAR(30) ,
    widget_title       VARCHAR(200),
    widget_content     TEXT        ,
    title_show_yn      VARCHAR(1)   DEFAULT 'Y',
    widget_lib_ref_yn  VARCHAR(1)   DEFAULT 'N',
    content_type_cd    VARCHAR(30) ,
    item_sort_ord      INTEGER      DEFAULT 0,
    widget_config_json TEXT        ,
    visibility_targets VARCHAR(200),
    disp_yn            VARCHAR(1)   DEFAULT 'Y',
    disp_start_date    DATE        ,
    disp_start_time    TIME        ,
    disp_end_date      DATE        ,
    disp_end_time      TIME        ,
    disp_env           VARCHAR(50)  DEFAULT '^PROD^',
    use_yn             VARCHAR(1)   DEFAULT 'Y',
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.dp_panel_item IS '디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.panel_item_id IS '패널항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.panel_id IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_lib_id IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_title IS '위젯타이틀';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_content IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.title_show_yn IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_lib_ref_yn IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.content_type_cd IS '콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.item_sort_ord IS '항목정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.widget_config_json IS '위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.visibility_targets IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_yn IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_start_date IS '전시시작일';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_start_time IS '전시시작시간';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_end_date IS '전시종료일';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_end_time IS '전시종료시간';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.disp_env IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_panel_item.upd_date IS '수정일';
