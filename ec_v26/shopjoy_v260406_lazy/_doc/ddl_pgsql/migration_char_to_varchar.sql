-- ═══════════════════════════════════════════════════════════
--  CHAR(1) → VARCHAR(1) 일괄 마이그레이션
--  대상 스키마: shopjoy_2604
--  작성일: 2026-05-04
-- ═══════════════════════════════════════════════════════════
--  배경:
--   PostgreSQL 의 CHAR(N) 은 내부적으로 bpchar 타입으로 저장되어,
--   JPA(Hibernate) 가 기본으로 매핑하는 VARCHAR 와 타입 검증에서 불일치 발생.
--   "Schema-validation: wrong column type encountered" 오류 해결 목적.
-- ═══════════════════════════════════════════════════════════
--  사용법:
--   psql 또는 DBeaver 에서 shopjoy_2604 스키마를 search_path 로 잡고 일괄 실행.
--   또는 본 파일 첫 줄에 다음을 추가:
--     SET search_path TO shopjoy_2604;
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───── ec.cm ─────
ALTER TABLE cm_blog        ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE cm_blog        ALTER COLUMN is_notice       TYPE VARCHAR(1);
ALTER TABLE cm_blog_cate   ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE cm_chatt_msg   ALTER COLUMN read_yn         TYPE VARCHAR(1);
ALTER TABLE cm_path        ALTER COLUMN use_yn          TYPE VARCHAR(1);

-- ───── ec.dp ─────
ALTER TABLE dp_area        ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE dp_area_panel  ALTER COLUMN disp_yn         TYPE VARCHAR(1);
ALTER TABLE dp_area_panel  ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE dp_panel       ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE dp_panel_item  ALTER COLUMN title_show_yn        TYPE VARCHAR(1);
ALTER TABLE dp_panel_item  ALTER COLUMN widget_lib_ref_yn    TYPE VARCHAR(1);
ALTER TABLE dp_panel_item  ALTER COLUMN disp_yn              TYPE VARCHAR(1);
ALTER TABLE dp_panel_item  ALTER COLUMN use_yn               TYPE VARCHAR(1);
ALTER TABLE dp_ui          ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE dp_ui_area     ALTER COLUMN disp_yn         TYPE VARCHAR(1);
ALTER TABLE dp_ui_area     ALTER COLUMN use_yn          TYPE VARCHAR(1);
ALTER TABLE dp_widget      ALTER COLUMN title_show_yn        TYPE VARCHAR(1);
ALTER TABLE dp_widget      ALTER COLUMN widget_lib_ref_yn    TYPE VARCHAR(1);
ALTER TABLE dp_widget      ALTER COLUMN use_yn               TYPE VARCHAR(1);
ALTER TABLE dp_widget_lib  ALTER COLUMN is_system       TYPE VARCHAR(1);
ALTER TABLE dp_widget_lib  ALTER COLUMN use_yn          TYPE VARCHAR(1);

-- ───── ec.mb ─────
ALTER TABLE mb_member_addr ALTER COLUMN is_default      TYPE VARCHAR(1);

-- ───── ec.od ─────
ALTER TABLE od_cart        ALTER COLUMN is_checked      TYPE VARCHAR(1);
ALTER TABLE od_claim       ALTER COLUMN customer_fault_yn      TYPE VARCHAR(1);
ALTER TABLE od_claim       ALTER COLUMN claim_cancel_yn        TYPE VARCHAR(1);
ALTER TABLE od_claim       ALTER COLUMN shipping_fee_paid_yn   TYPE VARCHAR(1);
ALTER TABLE od_order_discnt ALTER COLUMN restore_yn     TYPE VARCHAR(1);
ALTER TABLE od_order_item  ALTER COLUMN claim_yn        TYPE VARCHAR(1);
ALTER TABLE od_order_item  ALTER COLUMN buy_confirm_yn  TYPE VARCHAR(1);
ALTER TABLE od_order_item  ALTER COLUMN settle_yn       TYPE VARCHAR(1);
ALTER TABLE od_order_item  ALTER COLUMN reserve_sale_yn TYPE VARCHAR(1);

-- ───── ec.pd ─────
ALTER TABLE pd_category_prod    ALTER COLUMN disp_yn          TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN is_new           TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN is_best          TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN adlt_yn          TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN same_day_dliv_yn TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN sold_out_yn      TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN coupon_use_yn    TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN save_use_yn      TYPE VARCHAR(1);
ALTER TABLE pd_prod             ALTER COLUMN discnt_use_yn    TYPE VARCHAR(1);
ALTER TABLE pd_prod_bundle_item ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_prod_content     ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_prod_img         ALTER COLUMN is_thumb         TYPE VARCHAR(1);
ALTER TABLE pd_prod_opt_item    ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_prod_rel         ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_prod_set_item    ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_prod_sku         ALTER COLUMN use_yn           TYPE VARCHAR(1);
ALTER TABLE pd_tag              ALTER COLUMN use_yn           TYPE VARCHAR(1);

-- ───── ec.pm ─────
ALTER TABLE pm_coupon       ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_coupon       ALTER COLUMN dvc_pc_yn      TYPE VARCHAR(1);
ALTER TABLE pm_coupon       ALTER COLUMN dvc_mweb_yn    TYPE VARCHAR(1);
ALTER TABLE pm_coupon       ALTER COLUMN dvc_mapp_yn    TYPE VARCHAR(1);
ALTER TABLE pm_coupon_issue ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_discnt       ALTER COLUMN dvc_pc_yn      TYPE VARCHAR(1);
ALTER TABLE pm_discnt       ALTER COLUMN dvc_mweb_yn    TYPE VARCHAR(1);
ALTER TABLE pm_discnt       ALTER COLUMN dvc_mapp_yn    TYPE VARCHAR(1);
ALTER TABLE pm_discnt       ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_event        ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_gift         ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_plan         ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE pm_voucher      ALTER COLUMN use_yn         TYPE VARCHAR(1);

-- ───── ec.st ─────
ALTER TABLE st_settle_config ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE st_settle_raw    ALTER COLUMN buy_confirm_yn TYPE VARCHAR(1);
ALTER TABLE st_settle_raw    ALTER COLUMN close_yn       TYPE VARCHAR(1);
ALTER TABLE st_settle_raw    ALTER COLUMN erp_send_yn    TYPE VARCHAR(1);

-- ───── sy ─────
ALTER TABLE sy_bbm           ALTER COLUMN allow_comment  TYPE VARCHAR(1);
ALTER TABLE sy_bbm           ALTER COLUMN allow_attach   TYPE VARCHAR(1);
ALTER TABLE sy_bbm           ALTER COLUMN allow_like     TYPE VARCHAR(1);
ALTER TABLE sy_bbm           ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_bbs           ALTER COLUMN is_fixed       TYPE VARCHAR(1);
ALTER TABLE sy_brand         ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_code          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_code_grp      ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_dept          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_i18n          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_menu          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_notice        ALTER COLUMN is_fixed       TYPE VARCHAR(1);
ALTER TABLE sy_path          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_prop          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_role          ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_role          ALTER COLUMN restrict_perm  TYPE VARCHAR(1);
ALTER TABLE sy_template      ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_vendor_brand  ALTER COLUMN is_main        TYPE VARCHAR(1);
ALTER TABLE sy_vendor_brand  ALTER COLUMN use_yn         TYPE VARCHAR(1);
ALTER TABLE sy_vendor_content ALTER COLUMN use_yn        TYPE VARCHAR(1);
ALTER TABLE sy_vendor_user   ALTER COLUMN is_main        TYPE VARCHAR(1);
ALTER TABLE sy_vendor_user   ALTER COLUMN auth_yn        TYPE VARCHAR(1);

-- ═══════════════════════════════════════════════════════════
--  검증 쿼리 (실행 후 모든 결과가 character varying 으로 나와야 정상)
-- ═══════════════════════════════════════════════════════════
-- SELECT table_name, column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND character_maximum_length = 1
-- ORDER BY table_name, column_name;
--
-- bpchar (= 'character') 타입이 남아있는지 확인:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND data_type = 'character'
-- ORDER BY table_name, column_name;
