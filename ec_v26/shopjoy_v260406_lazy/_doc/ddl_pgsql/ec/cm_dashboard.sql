-- cm_dashboard 테이블 DDL
-- 대시보드 정의 헤더

CREATE TABLE shopjoy_2604.cm_dashboard (
    dashboard_id     character varying(21)       NOT NULL,
    dashboard_nm     character varying(200)      NOT NULL,
    ui_comp_nm       character varying(100)      NOT NULL,
    layout_cols      integer                     DEFAULT 4,
    sort_ord         integer                     DEFAULT 1,
    use_yn           character varying(1)        DEFAULT 'Y'::character varying,
    remark           character varying(500)     ,
    reg_by           character varying(30)      ,
    reg_date         timestamp without time zone,
    upd_by           character varying(30)      ,
    upd_date         timestamp without time zone,
    owner_user_id    character varying(21)      ,
    share_scope_cd   character varying(10)      ,
    share_dept_id    character varying(2000)    ,
    share_user_ids   character varying(2000)    ,
    share_vendor_ids character varying(1000)    ,
    reg_site_id      character varying(21)      ,
    CONSTRAINT cm_dashboard_pk_dashboard_id PRIMARY KEY (dashboard_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard IS '대시보드 정의 헤더';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dashboard_id IS '대시보드ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.dashboard_nm IS '대시보드명 (화면 표시용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.ui_comp_nm IS '프론트 컴포넌트명 (DashboardBoEc01 등)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.layout_cols IS '그리드 열 수 (기본 4)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.use_yn IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.owner_user_id IS '소유 사용자ID (개인화 대시보드, NULL=공용)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_scope_cd IS '공개여부 — PUBLIC:전체공개 / PRIVATE:비공개(소유자+공유대상) (NULL=PRIVATE)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_dept_id IS '공유 부서ID 목록 (^구분 예: ^DEPT001^DEPT002^)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_user_ids IS '공유 사용자ID 목록 (^구분 예: ^US001^US002^)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_vendor_ids IS '공유대상 업체ID 멀티값 (^V1^V2^). 부서·사용자와 OR 로 판정';

CREATE INDEX cm_dashboard_ix01_owner_user_id ON shopjoy_2604.cm_dashboard USING btree (owner_user_id);
CREATE INDEX cm_dashboard_ix02_share_dept_id ON shopjoy_2604.cm_dashboard USING btree (share_dept_id);
CREATE INDEX cm_dashboard_ix03_ui_comp_nm ON shopjoy_2604.cm_dashboard USING btree (ui_comp_nm);

