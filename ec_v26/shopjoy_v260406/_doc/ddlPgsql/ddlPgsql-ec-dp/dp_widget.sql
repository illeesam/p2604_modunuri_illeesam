-- ============================================================
-- dp_widget : 디스플레이 위젯 정의 (라이브러리 참조 또는 직접 생성)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_widget (
    widget_id            VARCHAR(21)     NOT NULL,
    widget_lib_id        VARCHAR(21),                            -- FK: dp_widget_lib.widget_lib_id (선택사항)
    site_id              VARCHAR(21),                            -- sy_site.site_id
    widget_nm            VARCHAR(100)    NOT NULL,
    widget_type_cd       VARCHAR(30)     NOT NULL,              -- 코드: WIDGET_TYPE (image_banner/product_slider 등)
    widget_desc          VARCHAR(300),
    widget_title         VARCHAR(200),                           -- 위젯 타이틀
    widget_content       TEXT,                                   -- 위젯 내용 (HTML 에디터)
    title_show_yn        CHAR(1)         DEFAULT 'Y',            -- 타이틀 표시 여부
    widget_lib_ref_yn    CHAR(1)         DEFAULT 'N',            -- dp_widget_lib 참조 여부
    widget_config_json   TEXT,                                  -- 위젯의 추가 설정 (JSON)
    preview_img_url      VARCHAR(500),                          -- 미리보기 이미지
    sort_ord             INTEGER         DEFAULT 0,
    use_yn               CHAR(1)         DEFAULT 'Y',
    disp_env             VARCHAR(50)     DEFAULT '^PROD^',       -- 전시 환경 (^PROD^DEV^TEST^ 형식)
    reg_by               VARCHAR(30),
    reg_date             TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30),
    upd_date             TIMESTAMP,
    PRIMARY KEY (widget_id),
    UNIQUE (site_id, widget_nm),
    FOREIGN KEY (widget_lib_id) REFERENCES dp_widget_lib(widget_lib_id)
);

COMMENT ON TABLE dp_widget IS '디스플레이 위젯 (라이브러리 참조 또는 직접 생성)';
COMMENT ON COLUMN dp_widget.widget_id            IS '위젯ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_widget.widget_lib_id        IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 참조 선택사항)';
COMMENT ON COLUMN dp_widget.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_widget.widget_nm            IS '위젯명';
COMMENT ON COLUMN dp_widget.widget_type_cd       IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN dp_widget.widget_desc          IS '위젯설명';
COMMENT ON COLUMN dp_widget.widget_title         IS '위젯타이틀';
COMMENT ON COLUMN dp_widget.widget_content       IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN dp_widget.title_show_yn        IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN dp_widget.widget_lib_ref_yn    IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN dp_widget.widget_config_json   IS '위젯추가설정 (JSON)';
COMMENT ON COLUMN dp_widget.preview_img_url      IS '미리보기이미지URL';
COMMENT ON COLUMN dp_widget.sort_ord             IS '정렬순서';
COMMENT ON COLUMN dp_widget.use_yn               IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_widget.disp_env             IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN dp_widget.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget.reg_date             IS '등록일';
COMMENT ON COLUMN dp_widget.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_widget.upd_date             IS '수정일';

CREATE INDEX idx_dp_widget_lib ON dp_widget (widget_lib_id);
CREATE INDEX idx_dp_widget_site ON dp_widget (site_id);
CREATE INDEX idx_dp_widget_type ON dp_widget (widget_type_cd);
CREATE INDEX idx_dp_widget_disp_env ON dp_widget (disp_env);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_widget.widget_type_cd (위젯유형) : WIDGET_TYPE { image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선형차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:캐쉬배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운, markdown:마크다운, video_player:비디오, map_widget:지도 }
