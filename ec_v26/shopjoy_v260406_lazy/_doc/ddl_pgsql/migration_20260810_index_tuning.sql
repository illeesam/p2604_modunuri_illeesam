-- =====================================================================
-- 인덱스 튜닝 마이그레이션 (2026-08-10)
--
-- 선정 근거: pg_stats 의 n_distinct / null_frac 실측값 기준.
--   - 참조 컬럼(*_id) 중 선두 컬럼 인덱스가 없는 것을 전수 추출
--   - 카디널리티가 실제로 있는 것만 생성 (아래 "제외" 참조)
--   - 중복 인덱스(PK/UNIQUE 와 동일 구성) 제거
--
-- ⚠ 제외한 것과 그 이유 (되살리지 말 것 — 근거 있는 미생성)
--   1) reg_site_id (172개 테이블) : 현재 고유값 1개.
--        단일 값이 전체 행을 덮으므로 플래너가 인덱스를 쓰지 않는다.
--        멀티사이트 데이터가 실제로 쌓이면 단독이 아니라
--        (reg_site_id, 자주쓰는필터컬럼) 복합 인덱스로 만들 것.
--   2) syh_access_log.role_id(2) / syh_access_error_log.role_id(4) :
--        로그 테이블 + 저카디널리티. 인덱스가 선택도를 못 낸다.
--   3) syh_*_log.dept_id / locale_id / vendor_id : 대부분 NULL.
--   4) pd_prod_img.attach_id : 전 행 NULL.
--   5) syh_user_login_log.login_id : QSyhUserLoginLogRepositoryImpl 이
--        LIKE 검색(FieldDef.like)만 한다. 선두 와일드카드는 btree 미사용.
--   6) pd_prod.dliv_tmplt_id : 카디널리티/NULL 비율이 기준 미달.
-- =====================================================================

-- ── [1] 선언된 FK 제약인데 인덱스가 없는 것 ───────────────────────────
--   FK 는 조인뿐 아니라 부모 행 DELETE/UPDATE 시 자식 검사에도 쓰인다.
--   인덱스가 없으면 부모 1건 삭제마다 자식 전체 seq scan 이 돈다.
CREATE INDEX IF NOT EXISTS idx_dp_panel_item_widget_lib ON shopjoy_2604.dp_panel_item (widget_lib_id);
CREATE INDEX IF NOT EXISTS idx_mb_member_role_grant_user ON shopjoy_2604.mb_member_role (grant_user_id);

-- ── [2] 상품 도메인 ───────────────────────────────────────────────────
--   pd_prod_sku.prod_id : 9,507행 / 595 고유값 — 이번 튜닝 최대 효과.
--   상품 상세·옵션·재고 화면이 전부 prod_id 로 SKU 를 끌어온다.
CREATE INDEX IF NOT EXISTS idx_pd_prod_sku_prod ON shopjoy_2604.pd_prod_sku (prod_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_content_prod ON shopjoy_2604.pd_prod_content (prod_id);
CREATE INDEX IF NOT EXISTS idx_pd_review_comment_review ON shopjoy_2604.pd_review_comment (review_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_category ON shopjoy_2604.pd_prod (category_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_brand ON shopjoy_2604.pd_prod (brand_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_vendor ON shopjoy_2604.pd_prod (vendor_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_md_user ON shopjoy_2604.pd_prod (md_user_id);

-- ── [3] 프로모션 도메인 ───────────────────────────────────────────────
--   *_item.target_id 는 프로모션 대상(상품/카테고리) 매핑 — 카디널리티 높음.
CREATE INDEX IF NOT EXISTS idx_pm_coupon_issue_coupon ON shopjoy_2604.pm_coupon_issue (coupon_id);
CREATE INDEX IF NOT EXISTS idx_pm_coupon_issue_member ON shopjoy_2604.pm_coupon_issue (member_id);
CREATE INDEX IF NOT EXISTS idx_pm_coupon_issue_order ON shopjoy_2604.pm_coupon_issue (order_id);
CREATE INDEX IF NOT EXISTS idx_pm_coupon_item_target ON shopjoy_2604.pm_coupon_item (target_id);
CREATE INDEX IF NOT EXISTS idx_pm_event_item_target ON shopjoy_2604.pm_event_item (target_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_item_target ON shopjoy_2604.pm_save_item (target_id);
CREATE INDEX IF NOT EXISTS idx_pm_discnt_item_target ON shopjoy_2604.pm_discnt_item (target_id);
CREATE INDEX IF NOT EXISTS idx_pm_gift_cond_target ON shopjoy_2604.pm_gift_cond (target_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_issue_prod ON shopjoy_2604.pm_save_issue (prod_id);
CREATE INDEX IF NOT EXISTS idx_pm_cache_member ON shopjoy_2604.pm_cache (member_id);
CREATE INDEX IF NOT EXISTS idx_pm_cache_proc_user ON shopjoy_2604.pm_cache (proc_user_id);

-- ── [4] 시스템/전시 도메인 ────────────────────────────────────────────
--   sy_role_menu : 튜닝 전 seq_scan 2,857 / idx_scan 0 이었다.
--   권한 체크 경로라 호출 빈도가 높다.
CREATE INDEX IF NOT EXISTS idx_sy_role_menu_menu ON shopjoy_2604.sy_role_menu (menu_id);
CREATE INDEX IF NOT EXISTS idx_sy_code_grp_path ON shopjoy_2604.sy_code_grp (path_id);
CREATE INDEX IF NOT EXISTS idx_dp_widget_lib_path ON shopjoy_2604.dp_widget_lib (path_id);
CREATE INDEX IF NOT EXISTS idx_cm_blog_reply_writer ON shopjoy_2604.cm_blog_reply (writer_id);

-- ── [5] 로그 추적 ─────────────────────────────────────────────────────
--   trace_id 는 거의 유니크(-0.99 / -0.31). "이 요청 하나 찾기" 의 유일한 경로다.
--   액세스 로그는 비동기 큐(AccessLogQueue)로 적재돼 인덱스 쓰기 비용 영향이 작다.
CREATE INDEX IF NOT EXISTS idx_syh_access_log_trace ON shopjoy_2604.syh_access_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_syh_access_error_log_trace ON shopjoy_2604.syh_access_error_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_syh_user_login_log_auth ON shopjoy_2604.syh_user_login_log (auth_id);

-- ── [6] 중복 인덱스 제거 ──────────────────────────────────────────────
--   동일 컬럼 구성의 PK/UNIQUE 인덱스가 이미 있어 조회에 그대로 쓰인다.
--   중복분은 INSERT/UPDATE 마다 쓰기 비용만 추가로 발생시킨다.
DROP INDEX IF EXISTS shopjoy_2604.idx_sy_site_site;     -- = sy_site_pkey (site_id)
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_coupon_code;   -- = pm_coupon_coupon_cd_key (coupon_cd)

ANALYZE;
