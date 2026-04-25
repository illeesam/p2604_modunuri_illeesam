-- ============================================================
-- ec_disp_widget_lib : 디스플레이 위젯 라이브러리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_widget_lib (
    widget_lib_id   VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    widget_code     VARCHAR(50)     NOT NULL,
    widget_nm       VARCHAR(100)    NOT NULL,
    widget_type_cd  VARCHAR(30)     NOT NULL,               -- 코드: WIDGET_TYPE (BANNER/PRODUCT/CATEGORY/HTML/SLIDER)
    widget_lib_desc TEXT,
    disp_path       VARCHAR(500),                            -- 점(.) 구분 표시경로(다중: 콤마 구분)
    thumbnail_url   VARCHAR(500),
    template_html   TEXT,                                   -- 위젯 기본 HTML 템플릿
    config_schema   TEXT,                                   -- 설정 스키마 (JSON)
    is_system       CHAR(1)         DEFAULT 'N',            -- 시스템 기본 위젯 Y/N
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (widget_lib_id),
    UNIQUE (widget_code)
);

COMMENT ON TABLE dp_widget_lib IS '디스플레이 위젯 라이브러리';
COMMENT ON COLUMN dp_widget_lib.widget_lib_id  IS '위젯라이브러리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_widget_lib.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_widget_lib.widget_code    IS '위젯코드';
COMMENT ON COLUMN dp_widget_lib.widget_nm      IS '위젯명';
COMMENT ON COLUMN dp_widget_lib.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE — BANNER/PRODUCT/CATEGORY/HTML/SLIDER)';
COMMENT ON COLUMN dp_widget_lib.widget_lib_desc IS '위젯라이브러리설명';
COMMENT ON COLUMN dp_widget_lib.thumbnail_url  IS '미리보기 썸네일URL';
COMMENT ON COLUMN dp_widget_lib.template_html  IS '위젯 HTML 템플릿';
COMMENT ON COLUMN dp_widget_lib.config_schema  IS '설정 스키마 (JSON)';
COMMENT ON COLUMN dp_widget_lib.is_system      IS '시스템기본위젯 Y/N';
COMMENT ON COLUMN dp_widget_lib.sort_ord       IS '정렬순서';
COMMENT ON COLUMN dp_widget_lib.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN dp_widget_lib.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget_lib.reg_date       IS '등록일';
COMMENT ON COLUMN dp_widget_lib.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget_lib.upd_date       IS '수정일';
COMMENT ON COLUMN dp_widget_lib.disp_path IS '점(.) 구분 표시경로';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_widget_lib.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }
