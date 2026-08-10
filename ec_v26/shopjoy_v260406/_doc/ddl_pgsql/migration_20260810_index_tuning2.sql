-- =====================================================================
-- 인덱스 튜닝 2차 — 고객(mb) / 주문(od) / 정산(st) / 시스템(sy) (2026-08-10)
--
-- 1차(migration_20260810_index_tuning.sql)는 행수 100건 이상 테이블만 대상이라
-- 이 4개 도메인이 대부분 제외됐다. 이 DB 의 mb/od/st 샘플 데이터가 수십 건뿐이기 때문.
--
-- ⚠ 이번엔 "현재 행수" 가 아니라 "구조적 역할" 로 판단했다.
--    주문·클레임·정산·이력은 운영에서 가장 크게 자라는 테이블이라
--    지금 행수(수십 건)로 판단하면 정작 필요한 인덱스를 놓친다.
--
-- 근거: 구조적 등치 필터가 실제로 쓰인다.
--    .prodId.eq() 39회 / .memberId.eq() 30회 / .orderId.eq() 21회 /
--    .orderItemId.eq() 7회 / .claimId.eq() 5회
--    Spring Data 파생쿼리 findByDlivId / findBySettleId / findByProdId 등
--
-- ⚠ 제외한 것과 근거 (되살리지 말 것)
--   1) odh_* 13개 테이블의 chg_user_id
--        QdslUtil.FieldDef.like → UPPER(col) LIKE '%값%' 로 조립된다.
--        선두 와일드카드 + 컬럼에 함수 적용이라 btree 를 못 탄다.
--        게다가 이력 테이블은 운영에서 가장 커지므로 안 쓰이는 인덱스의 쓰기 비용이 크다.
--   2) mbh_member_login_log.login_id : 위와 동일(자유검색 LIKE 전용)
--   3) 고정 크기 설정 테이블의 path_id
--        sy_alarm(11) sy_batch(20) sy_bbm(18) sy_brand(17) sy_role(52)
--        sy_site(17) sy_template(59) sy_vendor(17)
--        — 표시경로 그룹핑용이고 테이블이 수십 건에서 더 자라지 않는다. 플래너가 쓰지 않는다.
--        (반대로 sy_bbs.path_id 는 게시글이라 무한 증가 → 생성함)
--   4) reg_site_id : 1차와 동일 — 고유값 1개. 정책서 base.인덱스튜닝정책.md §1 참조
-- =====================================================================

-- ── [1] 고객 (mb / mbh) ───────────────────────────────────────────────
--   ⭐ mb_member_sns 는 SocialAuthService 가
--      findBySnsChannelCdAndSnsUserId(채널, SNS사용자ID) 로 조회한다(소셜 로그인 경로).
--      단독 sns_user_id 가 아니라 조회 순서대로 복합 인덱스를 만들어야 그대로 탄다.
CREATE INDEX IF NOT EXISTS idx_mb_member_sns_channel_user ON shopjoy_2604.mb_member_sns (sns_channel_cd, sns_user_id);
CREATE INDEX IF NOT EXISTS idx_mb_like_target ON shopjoy_2604.mb_like (target_id);
CREATE INDEX IF NOT EXISTS idx_mbh_member_login_log_auth ON shopjoy_2604.mbh_member_login_log (auth_id);
CREATE INDEX IF NOT EXISTS idx_mbh_member_login_log_trace ON shopjoy_2604.mbh_member_login_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_mbh_member_token_log_auth ON shopjoy_2604.mbh_member_token_log (auth_id);
CREATE INDEX IF NOT EXISTS idx_mbh_member_token_log_trace ON shopjoy_2604.mbh_member_token_log (trace_id);

-- ── [2] 주문 / 클레임 / 배송 (od) ─────────────────────────────────────
--   운영 최대 증가 테이블군. 부모 1건 조회 시 자식 전체를 끌어오는 경로라 인덱스 효과가 크다.
CREATE INDEX IF NOT EXISTS idx_od_cart_prod_sku ON shopjoy_2604.od_cart (prod_sku_id);

CREATE INDEX IF NOT EXISTS idx_od_claim_outbound_dliv ON shopjoy_2604.od_claim (outbound_dliv_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_inbound_dliv ON shopjoy_2604.od_claim (inbound_dliv_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_proc_user ON shopjoy_2604.od_claim (proc_user_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_appr_req_user ON shopjoy_2604.od_claim (appr_req_user_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_appr_aprv_user ON shopjoy_2604.od_claim (appr_aprv_user_id);

--   ⭐ od_claim_item.claim_id — 클레임 상세에서 항목을 끌어오는 핵심 경로
CREATE INDEX IF NOT EXISTS idx_od_claim_item_claim ON shopjoy_2604.od_claim_item (claim_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_item_order_item ON shopjoy_2604.od_claim_item (order_item_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_item_prod ON shopjoy_2604.od_claim_item (prod_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_item_prod_sku ON shopjoy_2604.od_claim_item (prod_sku_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_item_new_prod ON shopjoy_2604.od_claim_item (new_prod_id);
CREATE INDEX IF NOT EXISTS idx_od_claim_item_new_prod_sku ON shopjoy_2604.od_claim_item (new_prod_sku_id);

CREATE INDEX IF NOT EXISTS idx_od_dliv_member ON shopjoy_2604.od_dliv (member_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_vendor ON shopjoy_2604.od_dliv (vendor_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_parent_dliv ON shopjoy_2604.od_dliv (parent_dliv_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_appr_req_user ON shopjoy_2604.od_dliv (appr_req_user_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_appr_aprv_user ON shopjoy_2604.od_dliv (appr_aprv_user_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_item_order_item ON shopjoy_2604.od_dliv_item (order_item_id);
CREATE INDEX IF NOT EXISTS idx_od_dliv_item_prod ON shopjoy_2604.od_dliv_item (prod_id);

CREATE INDEX IF NOT EXISTS idx_od_order_coupon ON shopjoy_2604.od_order (coupon_id);
CREATE INDEX IF NOT EXISTS idx_od_order_appr_req_user ON shopjoy_2604.od_order (appr_req_user_id);
CREATE INDEX IF NOT EXISTS idx_od_order_appr_aprv_user ON shopjoy_2604.od_order (appr_aprv_user_id);
CREATE INDEX IF NOT EXISTS idx_od_order_item_prod_sku ON shopjoy_2604.od_order_item (prod_sku_id);
CREATE INDEX IF NOT EXISTS idx_od_order_item_dliv_tmplt ON shopjoy_2604.od_order_item (dliv_tmplt_id);
CREATE INDEX IF NOT EXISTS idx_od_order_item_gift ON shopjoy_2604.od_order_item (gift_id);
CREATE INDEX IF NOT EXISTS idx_od_order_discnt_coupon_issue ON shopjoy_2604.od_order_discnt (coupon_issue_id);
CREATE INDEX IF NOT EXISTS idx_od_order_item_discnt_coupon_issue ON shopjoy_2604.od_order_item_discnt (coupon_issue_id);
CREATE INDEX IF NOT EXISTS idx_od_refund_method_pg_refund ON shopjoy_2604.od_refund_method (pg_refund_id);

-- ── [3] 정산 (st) ─────────────────────────────────────────────────────
--   정산은 vendor 단위 집계가 기본이라 vendor_id 가 거의 모든 테이블의 주 필터다.
CREATE INDEX IF NOT EXISTS idx_st_settle_vendor ON shopjoy_2604.st_settle (vendor_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_item_order_item ON shopjoy_2604.st_settle_item (order_item_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_item_prod ON shopjoy_2604.st_settle_item (prod_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_config_vendor ON shopjoy_2604.st_settle_config (vendor_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_config_category ON shopjoy_2604.st_settle_config (category_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_vendor ON shopjoy_2604.st_settle_raw (vendor_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_claim_item ON shopjoy_2604.st_settle_raw (claim_item_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_coupon_issue ON shopjoy_2604.st_settle_raw (coupon_issue_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_discnt ON shopjoy_2604.st_settle_raw (discnt_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_gift ON shopjoy_2604.st_settle_raw (gift_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_voucher ON shopjoy_2604.st_settle_raw (voucher_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_voucher_issue ON shopjoy_2604.st_settle_raw (voucher_issue_id);
CREATE INDEX IF NOT EXISTS idx_st_recon_settle_raw ON shopjoy_2604.st_recon (settle_raw_id);
CREATE INDEX IF NOT EXISTS idx_st_recon_vendor ON shopjoy_2604.st_recon (vendor_id);
CREATE INDEX IF NOT EXISTS idx_st_erp_voucher_vendor ON shopjoy_2604.st_erp_voucher (vendor_id);

-- ── [4] 시스템 (sy) — 무한 증가 테이블 + 트리 자기참조 ────────────────
--   게시판/문의는 콘텐츠라 무한 증가한다.
CREATE INDEX IF NOT EXISTS idx_sy_bbs_bbm ON shopjoy_2604.sy_bbs (bbm_id);
CREATE INDEX IF NOT EXISTS idx_sy_bbs_member ON shopjoy_2604.sy_bbs (member_id);
CREATE INDEX IF NOT EXISTS idx_sy_bbs_parent_bbs ON shopjoy_2604.sy_bbs (parent_bbs_id);
CREATE INDEX IF NOT EXISTS idx_sy_bbs_attach_grp ON shopjoy_2604.sy_bbs (attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_sy_bbs_path ON shopjoy_2604.sy_bbs (path_id);

CREATE INDEX IF NOT EXISTS idx_sy_contact_member ON shopjoy_2604.sy_contact (member_id);
CREATE INDEX IF NOT EXISTS idx_sy_contact_answer_user ON shopjoy_2604.sy_contact (answer_user_id);
CREATE INDEX IF NOT EXISTS idx_sy_contact_content_attach_grp ON shopjoy_2604.sy_contact (content_attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_sy_contact_answer_attach_grp ON shopjoy_2604.sy_contact (answer_attach_grp_id);

CREATE INDEX IF NOT EXISTS idx_sy_user_dept ON shopjoy_2604.sy_user (dept_id);
CREATE INDEX IF NOT EXISTS idx_sy_user_role_col ON shopjoy_2604.sy_user (role_id);
CREATE INDEX IF NOT EXISTS idx_sy_user_profile_attach ON shopjoy_2604.sy_user (profile_attach_id);
CREATE INDEX IF NOT EXISTS idx_sy_user_role_grant_user ON shopjoy_2604.sy_user_role (grant_user_id);
CREATE INDEX IF NOT EXISTS idx_sy_user_bookmark_menu ON shopjoy_2604.sy_user_bookmark (menu_id);
CREATE INDEX IF NOT EXISTS idx_sy_vendor_user_role_grant_user ON shopjoy_2604.sy_vendor_user_role (grant_user_id);

--   트리 자기참조 — 재귀 조회 경로
CREATE INDEX IF NOT EXISTS idx_sy_menu_parent_menu ON shopjoy_2604.sy_menu (parent_menu_id);
CREATE INDEX IF NOT EXISTS idx_sy_dept_parent_dept ON shopjoy_2604.sy_dept (parent_dept_id);
CREATE INDEX IF NOT EXISTS idx_sy_dept_manager ON shopjoy_2604.sy_dept (manager_id);
CREATE INDEX IF NOT EXISTS idx_sy_role_parent_role ON shopjoy_2604.sy_role (parent_role_id);

CREATE INDEX IF NOT EXISTS idx_sy_brand_vendor ON shopjoy_2604.sy_brand (vendor_id);
CREATE INDEX IF NOT EXISTS idx_sy_notice_attach_grp ON shopjoy_2604.sy_notice (attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_sy_vendor_content_attach_grp ON shopjoy_2604.sy_vendor_content (attach_grp_id);
CREATE INDEX IF NOT EXISTS idx_sy_alarm_template ON shopjoy_2604.sy_alarm (template_id);
CREATE INDEX IF NOT EXISTS idx_sy_alarm_target ON shopjoy_2604.sy_alarm (target_id);

ANALYZE;
