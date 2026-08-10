-- =====================================================================
-- 인덱스 튜닝 3차 — 잔여 참조컬럼 + 접두중복 인덱스 정리 (2026-08-10)
--
-- 1·2차에서 남은 것을 전 스키마 대상으로 마무리한다.
--   [1] 잔여 참조컬럼 인덱스 생성 (채팅/대시보드/이력/카테고리트리 등)
--   [2] 접두중복(prefix-redundant) 단일 인덱스 제거 25건
-- =====================================================================

-- ── [1] 잔여 참조컬럼 ─────────────────────────────────────────────────

--   채팅 — 채팅방별 메시지 조회가 핵심 경로
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_room ON shopjoy_2604.cm_chatt_msg (chatt_room_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_attach_grp ON shopjoy_2604.cm_chatt_msg (attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_cm_chatt_msg_ref ON shopjoy_2604.cm_chatt_msg (ref_id);

--   대시보드
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_owner_user ON shopjoy_2604.cm_dashboard (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_share_dept ON shopjoy_2604.cm_dashboard (share_dept_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_menu_dashboard ON shopjoy_2604.cm_dashboard_menu (dashboard_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_menu_owner_user ON shopjoy_2604.cm_dashboard_menu (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cm_dashboard_menu_parent_node ON shopjoy_2604.cm_dashboard_menu (parent_node_id);

--   블로그 / FAQ / 경로 트리
CREATE INDEX IF NOT EXISTS idx_cm_blog_content_attach_grp ON shopjoy_2604.cm_blog (content_attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_cm_faq_answer_attach_grp ON shopjoy_2604.cm_faq (answer_attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_cm_blog_cate_parent ON shopjoy_2604.cm_blog_cate (parent_blog_cate_id);
CREATE INDEX IF NOT EXISTS idx_cm_path_parent ON shopjoy_2604.cm_path (parent_path_id);

--   상품 — ⭐ pd_category 트리는 FO/BO 전 화면이 재귀 조회한다
CREATE INDEX IF NOT EXISTS idx_pd_category_parent ON shopjoy_2604.pd_category (parent_category_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_dliv_tmplt ON shopjoy_2604.pd_prod (dliv_tmplt_id);
CREATE INDEX IF NOT EXISTS idx_pd_review_comment_parent_reply ON shopjoy_2604.pd_review_comment (parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_pd_review_comment_writer ON shopjoy_2604.pd_review_comment (writer_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_qna_answ_user ON shopjoy_2604.pd_prod_qna (answ_user_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_qna_order ON shopjoy_2604.pd_prod_qna (order_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_qna_prod_sku ON shopjoy_2604.pd_prod_qna (prod_sku_id);
CREATE INDEX IF NOT EXISTS idx_pd_restock_noti_prod_sku ON shopjoy_2604.pd_restock_noti (prod_sku_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_bundle_item_sku ON shopjoy_2604.pd_prod_bundle_item (item_sku_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_set_item_prod ON shopjoy_2604.pd_prod_set_item (item_prod_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_set_item_sku ON shopjoy_2604.pd_prod_set_item (item_sku_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_set_item_set_prod ON shopjoy_2604.pd_prod_set_item (set_prod_id);

--   상품 이력 — 운영에서 크게 자란다. 단 chg_user_id 는 제외(LIKE 전용, odh_ 와 동일 사유)
CREATE INDEX IF NOT EXISTS idx_pdh_prod_chg_hist_prod ON shopjoy_2604.pdh_prod_chg_hist (prod_id);
CREATE INDEX IF NOT EXISTS idx_pdh_prod_content_chg_hist_content ON shopjoy_2604.pdh_prod_content_chg_hist (prod_content_id);
CREATE INDEX IF NOT EXISTS idx_pdh_prod_status_hist_proc_user ON shopjoy_2604.pdh_prod_status_hist (proc_user_id);

--   프로모션 — ref_id 는 적립/캐시의 발생 원천(주문·클레임 등) 역참조
CREATE INDEX IF NOT EXISTS idx_pm_save_ref ON shopjoy_2604.pm_save (ref_id);
CREATE INDEX IF NOT EXISTS idx_pm_cache_ref ON shopjoy_2604.pm_cache (ref_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_issue_ref ON shopjoy_2604.pm_save_issue (ref_id);
CREATE INDEX IF NOT EXISTS idx_pm_event_benefit_coupon ON shopjoy_2604.pm_event_benefit (coupon_id);
CREATE INDEX IF NOT EXISTS idx_pm_gift_prod ON shopjoy_2604.pm_gift (prod_id);

--   시스템 이력/발송 — 무한 증가 테이블
CREATE INDEX IF NOT EXISTS idx_syh_alarm_send_hist_alarm ON shopjoy_2604.syh_alarm_send_hist (alarm_id);
CREATE INDEX IF NOT EXISTS idx_syh_alarm_send_hist_member ON shopjoy_2604.syh_alarm_send_hist (member_id);
CREATE INDEX IF NOT EXISTS idx_syh_alarm_send_hist_user ON shopjoy_2604.syh_alarm_send_hist (user_id);
CREATE INDEX IF NOT EXISTS idx_syh_batch_hist_batch ON shopjoy_2604.syh_batch_hist (batch_id);
CREATE INDEX IF NOT EXISTS idx_syh_user_token_log_auth ON shopjoy_2604.syh_user_token_log (auth_id);
CREATE INDEX IF NOT EXISTS idx_syh_user_token_log_trace ON shopjoy_2604.syh_user_token_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_syh_user_login_log_trace ON shopjoy_2604.syh_user_login_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_syh_api_log_trace ON shopjoy_2604.syh_api_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_syh_api_log_ref ON shopjoy_2604.syh_api_log (ref_id);
CREATE INDEX IF NOT EXISTS idx_syh_send_email_log_ref ON shopjoy_2604.syh_send_email_log (ref_id);
CREATE INDEX IF NOT EXISTS idx_syh_send_msg_log_ref ON shopjoy_2604.syh_send_msg_log (ref_id);
CREATE INDEX IF NOT EXISTS idx_cmh_push_log_ref ON shopjoy_2604.cmh_push_log (ref_id);
CREATE INDEX IF NOT EXISTS idx_cmh_push_log_template ON shopjoy_2604.cmh_push_log (template_id);
CREATE INDEX IF NOT EXISTS idx_sy_user_bookmark_grant_user ON shopjoy_2604.sy_user_bookmark (grant_user_id);

-- ── [2] 접두중복(prefix-redundant) 단일 인덱스 제거 ───────────────────
--
--   단일컬럼 인덱스 (a) 가 이미 존재하는 복합 인덱스 (a, b, ...) 의 선두와 같으면,
--   복합 인덱스가 a 단독 조회도 그대로 처리한다. 단일 인덱스는 중복이며
--   INSERT/UPDATE 마다 쓰기 비용과 저장 공간만 추가로 쓴다.
--
--   ⚠ 완전 동일(1차에서 제거한 유형)이 아니라 "선두 일치" 유형이라
--     pg_index.indkey 완전비교로는 안 잡힌다. 별도 점검이 필요하다
--     (정책서 base.인덱스튜닝정책.md §2 STEP5).
--
--   되돌리려면 각 줄의 컬럼으로 CREATE INDEX 하면 된다.

DROP INDEX IF EXISTS shopjoy_2604.idx_cm_bltn_good_blog;            -- (blog_id) ⊂ cm_bltn_good_blog_id_user_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_item_dashboard_id; -- (dashboard_id) ⊂ uq_cm_dashboard_item_key
DROP INDEX IF EXISTS shopjoy_2604.idx_cm_dashboard_item_data_item_id; -- (dashboard_item_id) ⊂ uq_cm_dashboard_item_data_key
DROP INDEX IF EXISTS shopjoy_2604.idx_mb_like_member;               -- (member_id) ⊂ idx_mb_like_unique
DROP INDEX IF EXISTS shopjoy_2604.idx_mb_member_sns_channel;        -- (sns_channel_cd) ⊂ idx_mb_member_sns_channel_user (2차에서 생성)
DROP INDEX IF EXISTS shopjoy_2604.idx_mb_member_sns_member;         -- (member_id) ⊂ mb_sns_member_member_id_sns_channel_cd_key
DROP INDEX IF EXISTS shopjoy_2604.idx_od_refund_method_refund;      -- (refund_id) ⊂ idx_od_refund_method_prio
DROP INDEX IF EXISTS shopjoy_2604.idx_pd_prod_tag_prod;             -- (prod_id) ⊂ pd_prod_tag_prod_id_tag_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pd_restock_noti_prod;         -- (prod_id) ⊂ pd_restock_noti_prod_id_sku_id_member_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_coupon_item_coupon;        -- (coupon_id) ⊂ pm_coupon_item_coupon_id_target_type_cd_target_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_coupon_prod_coupon;        -- (coupon_id) ⊂ pm_coupon_prod_pkey
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_discnt_item_discnt;        -- (discnt_id) ⊂ pm_discnt_item_discnt_id_target_type_cd_target_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_discnt_prod_discnt;        -- (discnt_id) ⊂ pm_discnt_prod_pkey
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_event_item_event;          -- (event_id) ⊂ pm_event_item_event_id_target_type_cd_target_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_event_prod_event;          -- (event_id) ⊂ pm_event_prod_pkey
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_plan_item_plan;            -- (plan_id) ⊂ pm_plan_item_plan_id_prod_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_save_prod_save;            -- (save_id) ⊂ pm_save_prod_pkey
DROP INDEX IF EXISTS shopjoy_2604.idx_st_erp_voucher_line_voucher;  -- (erp_voucher_id) ⊂ st_erp_voucher_line_erp_voucher_id_line_no_key
DROP INDEX IF EXISTS shopjoy_2604.idx_st_settle_item_settle;        -- (settle_id) ⊂ st_settle_item_settle_id_order_item_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_i18n_msg_i18n;             -- (i18n_id) ⊂ sy_i18n_msg_i18n_id_lang_cd_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_user_bookmark_user;        -- (user_id) ⊂ sy_user_bookmark_user_id_menu_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_user_role_user;            -- (user_id) ⊂ sy_user_role_user_id_role_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_vendor_brand_vendor;       -- (vendor_id) ⊂ sy_vendor_brand_vendor_id_brand_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_vendor_user_vendor;        -- (vendor_id) ⊂ sy_vendor_user_vendor_id_user_id_key
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_vendor_user_role_vendor;   -- (vendor_id) ⊂ sy_vendor_user_role_vendor_id_user_id_role_id_key

ANALYZE;
