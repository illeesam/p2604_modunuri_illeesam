-- dp_widget 테이블 DDL
-- 디스플레이 위젯 (라이브러리 참조 또는 직접 생성)

CREATE TABLE shopjoy_2604.dp_widget (
    widget_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    widget_lib_id      VARCHAR(21) ,
    site_id            VARCHAR(21)  NOT NULL,
    widget_nm          VARCHAR(100) NOT NULL,
    widget_type_cd     VARCHAR(30)  NOT NULL,
    widget_desc        VARCHAR(300),
    widget_title       VARCHAR(200),
    widget_content     TEXT        ,
    title_show_yn      VARCHAR(1)   DEFAULT 'Y'::bpchar,
    widget_lib_ref_yn  VARCHAR(1)   DEFAULT 'N'::bpchar,
    widget_config_json TEXT        ,
    thumbnail_url      VARCHAR(500),
    sort_ord           INTEGER      DEFAULT 0,
    use_yn             VARCHAR(1)   DEFAULT 'Y'::bpchar,
    disp_env           VARCHAR(50)  DEFAULT '^PROD^'::character varying,
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   ,
    CONSTRAINT dp_widget_widget_lib_id_fkey FOREIGN KEY (widget_lib_id) REFERENCES shopjoy_2604.dp_widget_lib (widget_lib_id)
);

COMMENT ON TABLE  shopjoy_2604.dp_widget IS '디스플레이 위젯 (라이브러리 참조 또는 직접 생성)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_id IS '위젯ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_lib_id IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 참조 선택사항)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_nm IS '위젯명';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_type_cd IS '위젯유형 (코드: WIDGET_TYPE)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_desc IS '위젯설명';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_title IS '위젯타이틀';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_content IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.title_show_yn IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_lib_ref_yn IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.widget_config_json IS '위젯추가설정 (JSON)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.thumbnail_url IS '미리보기 썸네일URL';
COMMENT ON COLUMN shopjoy_2604.dp_widget.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.dp_widget.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.disp_env IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.dp_widget.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.dp_widget.upd_date IS '수정일';

CREATE UNIQUE INDEX dp_widget_site_id_widget_nm_key ON shopjoy_2604.dp_widget USING btree (site_id, widget_nm);
CREATE INDEX idx_dp_widget_disp_env ON shopjoy_2604.dp_widget USING btree (disp_env);
CREATE INDEX idx_dp_widget_lib ON shopjoy_2604.dp_widget USING btree (widget_lib_id);
CREATE INDEX idx_dp_widget_site ON shopjoy_2604.dp_widget USING btree (site_id);
CREATE INDEX idx_dp_widget_type ON shopjoy_2604.dp_widget USING btree (widget_type_cd);
