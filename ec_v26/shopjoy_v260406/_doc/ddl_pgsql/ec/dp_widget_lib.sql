-- dp_widget_lib 테이블 DDL
-- 디스플레이 위젯 라이브러리

CREATE TABLE shopjoy_2604.dp_widget_lib (
    widget_lib_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21) ,
    widget_code     VARCHAR(50)  NOT NULL,
    widget_nm       VARCHAR(100) NOT NULL,
    widget_type_cd  VARCHAR(30)  NOT NULL,
    widget_lib_desc TEXT        ,
    path_id         VARCHAR(21) ,
    thumbnail_url   VARCHAR(500),
    template_html   TEXT        ,
    config_schema   TEXT        ,
    is_system       VARCHAR(1)   DEFAULT 'N',
    sort_ord        INTEGER      DEFAULT 0,
    use_yn          VARCHAR(1)   DEFAULT 'Y',
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.dp_widget_lib IS '디스플레이 위젯 라이브러리';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.widget_lib_id IS '위젯라이브러리ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.widget_code IS '위젯코드';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.widget_nm IS '위젯명';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE — BANNER/PRODUCT/CATEGORY/HTML/SLIDER)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.widget_lib_desc IS '위젯라이브러리설명';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.path_id IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.thumbnail_url IS '미리보기 썸네일URL';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.template_html IS '위젯 HTML 템플릿';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.config_schema IS '설정 스키마 (JSON)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.is_system IS '시스템기본위젯 Y/N';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget_lib.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_widget_lib_widget_code_key ON shopjoy_2604.dp_widget_lib USING btree (widget_code);
