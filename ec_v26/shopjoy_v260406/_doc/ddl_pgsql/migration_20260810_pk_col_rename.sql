-- =====================================================================
-- PK 컬럼명 정책 정합 — {테이블명(도메인접두어 제외)}_id 로 통일 (2026-08-10)
--
-- 정책: 모든 테이블의 PK 는 자기 테이블명 기반 단일 컬럼.
--       (base.인덱스튜닝정책.md §3-3)
-- 예외: 로그(*_log)·이력(*_hist) 18건은 정책 예외라 제외.
--
-- 대상 12건. 사전 확인 완료:
--   · 대상 테이블에 새 컬럼명이 이미 존재하는 경우 없음 (충돌 0건)
--   · pm_coupon_issue 는 참조측(od_order_discnt / od_order_item_discnt / st_settle_raw)이
--     이미 coupon_issue_id 로 부르고 있어, 원본 PK 만 issue_id 였던 불일치를 바로잡는다
--   · pd_prod_plan.plan_id 는 pm_plan.plan_id 와 이름이 겹쳐 의미가 혼동됐다 → prod_plan_id 로 분리
--
-- 컬럼 rename 후 PK 제약명도 함께 맞춘다(제약명에 컬럼명이 들어가는 명명 규칙).
--
-- ⚠ 이 파일은 이미 적용 완료(2026-08-10). 재실행하지 말 것.
--    보존해야 할 인접 컬럼(rename 대상 아님): cm_blog_reply.parent_comment_id,
--    cm_dashboard_menu.parent_node_id, mb_like.like_id, pm_plan.plan_id, pm_plan_item.plan_id
-- =====================================================================

ALTER TABLE shopjoy_2604.cm_blog_file RENAME COLUMN blog_img_id TO blog_file_id;
ALTER TABLE shopjoy_2604.cm_blog_file RENAME CONSTRAINT cm_blog_file_pk_blog_img_id TO cm_blog_file_pk_blog_file_id;

ALTER TABLE shopjoy_2604.cm_blog_good RENAME COLUMN like_id TO blog_good_id;
ALTER TABLE shopjoy_2604.cm_blog_good RENAME CONSTRAINT cm_blog_good_pk_like_id TO cm_blog_good_pk_blog_good_id;

ALTER TABLE shopjoy_2604.cm_blog_reply RENAME COLUMN comment_id TO blog_reply_id;
ALTER TABLE shopjoy_2604.cm_blog_reply RENAME CONSTRAINT cm_blog_reply_pk_comment_id TO cm_blog_reply_pk_blog_reply_id;

ALTER TABLE shopjoy_2604.cm_dashboard_item_data RENAME COLUMN item_data_id TO dashboard_item_data_id;
ALTER TABLE shopjoy_2604.cm_dashboard_item_data RENAME CONSTRAINT cm_dashboard_item_data_pk_item_data_id TO cm_dashboard_item_data_pk_dashboard_item_data_id;

ALTER TABLE shopjoy_2604.cm_dashboard_menu RENAME COLUMN menu_node_id TO dashboard_menu_id;
ALTER TABLE shopjoy_2604.cm_dashboard_menu RENAME CONSTRAINT cm_dashboard_menu_pk_menu_node_id TO cm_dashboard_menu_pk_dashboard_menu_id;

ALTER TABLE shopjoy_2604.od_order_item_discnt RENAME COLUMN item_discnt_id TO order_item_discnt_id;
ALTER TABLE shopjoy_2604.od_order_item_discnt RENAME CONSTRAINT od_order_item_discnt_pk_item_discnt_id TO od_order_item_discnt_pk_order_item_discnt_id;

ALTER TABLE shopjoy_2604.pd_prod_bundle_item RENAME COLUMN bundle_item_id TO prod_bundle_item_id;
ALTER TABLE shopjoy_2604.pd_prod_bundle_item RENAME CONSTRAINT pd_prod_bundle_item_pk_bundle_item_id TO pd_prod_bundle_item_pk_prod_bundle_item_id;

ALTER TABLE shopjoy_2604.pd_prod_plan RENAME COLUMN plan_id TO prod_plan_id;
ALTER TABLE shopjoy_2604.pd_prod_plan RENAME CONSTRAINT pd_prod_plan_pk_plan_id TO pd_prod_plan_pk_prod_plan_id;

ALTER TABLE shopjoy_2604.pd_prod_set_item RENAME COLUMN set_item_id TO prod_set_item_id;
ALTER TABLE shopjoy_2604.pd_prod_set_item RENAME CONSTRAINT pd_prod_set_item_pk_set_item_id TO pd_prod_set_item_pk_prod_set_item_id;

ALTER TABLE shopjoy_2604.pm_coupon_issue RENAME COLUMN issue_id TO coupon_issue_id;
ALTER TABLE shopjoy_2604.pm_coupon_issue RENAME CONSTRAINT pm_coupon_issue_pk_issue_id TO pm_coupon_issue_pk_coupon_issue_id;

ALTER TABLE shopjoy_2604.pm_coupon_usage RENAME COLUMN usage_id TO coupon_usage_id;
ALTER TABLE shopjoy_2604.pm_coupon_usage RENAME CONSTRAINT pm_coupon_usage_pk_usage_id TO pm_coupon_usage_pk_coupon_usage_id;

ALTER TABLE shopjoy_2604.pm_event_benefit RENAME COLUMN benefit_id TO event_benefit_id;
ALTER TABLE shopjoy_2604.pm_event_benefit RENAME CONSTRAINT pm_event_benefit_pk_benefit_id TO pm_event_benefit_pk_event_benefit_id;

ANALYZE;
