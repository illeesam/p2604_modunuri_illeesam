-- ============================================================================
-- cm_popup — 적용 UI 메모 컬럼 + my* (세션 한정) 팝업 사전 등록 (2026-07-26)
--
-- apply_ui_memo : 이 팝업을 쓰는 화면 파일명 나열 (예: PdProdDtl.js, OdOrderDtl.js).
--                 팝업 정의를 고치면 여기 적힌 화면 전부에 즉시 반영되므로,
--                 수정 전 영향 범위를 이 컬럼으로 확인한다.
--                 아래 UPDATE 값은 소스에서 popup-code="..." 사용처를 추출한 결과다.
--
-- my* 팝업     : 팝업코드 규칙 my{신원}{대상}. 항목에 session_cond_field 를 두어
--                 서버가 로그인 본인 것만 내려준다(클라이언트 조작 불가, 미로그인 거절).
--                 각 엔티티에 해당 소유자 컬럼이 실제 존재하는지 확인 후 등록했다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS apply_ui_memo VARCHAR(500);

COMMENT ON COLUMN shopjoy_2604.cm_popup.apply_ui_memo IS '이 팝업을 사용하는 화면 파일명 나열 (영향 범위 확인용)';

-- ── myMemberClaim : 내 클레임 선택  (OdClaim.memberId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000110', '2604010000000001', 'myMemberClaim', '내 클레임 선택', 1, 'OdClaim', 'claimId', 'claimId', 'siteId', 'e.regDate DESC', 'N', '^FO^', 'Y', 10, '860px', 'Y', 201, '', '세션 memberId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myMemberClaim');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000110', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001100', 'memberId', '회원', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'memberId', 'Y', 1),
    ('POI2607260001101', 'claimId', '클레임번호', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001102', 'orderId', '주문번호', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 30),
    ('POI2607260001103', 'claimTypeCd', '유형', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 40),
    ('POI2607260001104', 'claimStatusCd', '상태', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 50)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myMemberCoupon : 내 쿠폰 선택  (PmCouponIssue.memberId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000111', '2604010000000001', 'myMemberCoupon', '내 쿠폰 선택', 1, 'PmCouponIssue', 'issueId', 'issueId', 'siteId', 'e.issueDate DESC', 'N', '^FO^', 'Y', 10, '760px', 'Y', 202, '', '세션 memberId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myMemberCoupon');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000111', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001105', 'memberId', '회원', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'memberId', 'Y', 1),
    ('POI2607260001106', 'issueId', '발급번호', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001107', 'couponId', '쿠폰', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 30),
    ('POI2607260001108', 'issueDate', '발급일시', 'DATE', 'N', NULL, 'Y', 'center', 'N', NULL, 'N', 40),
    ('POI2607260001109', 'useYn', '사용여부', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 50)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myMemberAddr : 내 배송지 선택  (MbMemberAddr.memberId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000112', '2604010000000001', 'myMemberAddr', '내 배송지 선택', 1, 'MbMemberAddr', 'memberAddrId', 'addrNm', 'siteId', 'e.regDate DESC', 'N', '^FO^', 'Y', 10, '760px', 'Y', 203, '', '세션 memberId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myMemberAddr');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000112', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001110', 'memberId', '회원', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'memberId', 'Y', 1),
    ('POI2607260001111', 'addrNm', '배송지명', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001112', 'recvNm', '수령인', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 30),
    ('POI2607260001113', 'recvPhone', '연락처', 'TEXT', 'N', NULL, 'Y', 'center', 'N', NULL, 'N', 40),
    ('POI2607260001114', 'addr', '주소', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 50)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myMemberReview : 내 리뷰 선택  (PdReview.memberId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000113', '2604010000000001', 'myMemberReview', '내 리뷰 선택', 1, 'PdReview', 'reviewId', 'reviewTitle', 'siteId', 'e.reviewDate DESC', 'N', '^FO^', 'Y', 10, '820px', 'Y', 204, '', '세션 memberId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myMemberReview');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000113', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001115', 'memberId', '회원', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'memberId', 'Y', 1),
    ('POI2607260001116', 'reviewTitle', '제목', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001117', 'rating', '평점', 'NUMBER', 'N', NULL, 'Y', 'center', 'N', NULL, 'N', 30),
    ('POI2607260001118', 'reviewDate', '작성일시', 'DATE', 'N', NULL, 'Y', 'center', 'N', NULL, 'N', 40),
    ('POI2607260001119', 'reviewStatusCd', '상태', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 50)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myMemberQna : 내 상품문의 선택  (PdProdQna.memberId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000114', '2604010000000001', 'myMemberQna', '내 상품문의 선택', 1, 'PdProdQna', 'prodQnaId', 'prodQnaTitle', 'siteId', 'e.regDate DESC', 'N', '^FO^', 'Y', 10, '820px', 'Y', 205, '', '세션 memberId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myMemberQna');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000114', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001120', 'memberId', '회원', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'memberId', 'Y', 1),
    ('POI2607260001121', 'prodQnaTitle', '제목', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001122', 'prodQnaTypeCd', '유형', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 30),
    ('POI2607260001123', 'answYn', '답변여부', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 40)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myVendorProd : 내 업체 상품 선택  (PdProd.vendorId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000115', '2604010000000001', 'myVendorProd', '내 업체 상품 선택', 1, 'PdProd', 'prodId', 'prodNm', 'siteId', 'e.prodNm ASC', 'N', '^BO^', 'Y', 10, '900px', 'Y', 206, '', '세션 vendorId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myVendorProd');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000115', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001124', 'vendorId', '업체', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'vendorId', 'Y', 1),
    ('POI2607260001125', 'prodNm', '상품명', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001126', 'prodCode', '상품코드', 'TEXT', 'Y', 'LIKE', 'Y', 'center', 'N', NULL, 'N', 30),
    ('POI2607260001127', 'prodStatusCd', '상태', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 40)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── myDeptUser : 내 부서 사용자 선택  (SyUser.deptId) ──
INSERT INTO shopjoy_2604.cm_popup (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, order_by, multi_yn, sys_scope, paging_yn, page_size, modal_width,
   use_yn, sort_ord, apply_ui_memo, remark, reg_by, reg_date, upd_by, upd_date)
SELECT 'PO260726000000116', '2604010000000001', 'myDeptUser', '내 부서 사용자 선택', 1, 'SyUser', 'userId', 'userNm', 'siteId', 'e.userNm ASC', 'N', '^BO^', 'Y', 10, '820px', 'Y', 207, '', '세션 deptId 자동 한정 — 로그인 본인 것만',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myDeptUser');
INSERT INTO shopjoy_2604.cm_popup_item (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, col_align, link_yn, tree_label_yn, session_cond_field, required_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, '2604010000000001', 'PO260726000000116', v.fn, v.lb, v.ty, v.sy, v.st, v.ly, v.al, v.lk, 'N', v.sc, v.rq, v.so, 'Y',
       'SYSTEM', now(), 'SYSTEM', now() FROM (VALUES
    ('POI2607260001128', 'deptId', '부서', 'TEXT', 'N', 'EQ', 'N', NULL, 'N', 'deptId', 'Y', 1),
    ('POI2607260001129', 'userNm', '이름', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'Y', NULL, 'N', 20),
    ('POI2607260001130', 'loginId', '로그인ID', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 30),
    ('POI2607260001131', 'userEmail', '이메일', 'TEXT', 'Y', 'LIKE', 'Y', NULL, 'N', NULL, 'N', 40),
    ('POI2607260001132', 'userStatusCd', '상태', 'CODE', 'Y', 'EQ', 'Y', 'center', 'N', NULL, 'N', 50)
  ) AS v(iid, fn, lb, ty, sy, st, ly, al, lk, sc, rq, so)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);

-- ── 적용 UI 메모 채우기 (소스에서 popup-code 사용처 추출) ──────────────────
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Sample04.js, SyBbsDtl.js' WHERE popup_code = 'bbm';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PmCacheDtl.js, PmCouponDtl.js, PmDiscntDtl.js, PmGiftDtl.js, PmSaveDtl.js' WHERE popup_code = 'brand';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdCategoryMng.js, PdProdDtl.js, PdProdMng.js, PmCacheDtl.js, PmCouponDtl.js, PmDiscntDtl.js, PmGiftDtl.js, PmSaveDtl.js, Sample04.js, Sample11.js, Sample12.js, Sample13.js, Sample14.js' WHERE popup_code = 'category';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js' WHERE popup_code = 'code';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js, ZdSimulCouponMng.js, ZdSimulOrderMng.js, ZdSimulPromoMng.js' WHERE popup_code = 'coupon';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'CmDashboardMyMng.js, Sample04.js, SyDeptMng.js, SyUserDtl.js' WHERE popup_code = 'dept';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js, ZdSimulDiscntMng.js, ZdSimulOrderMng.js, ZdSimulPromoMng.js' WHERE popup_code = 'discnt';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'ZdSimulEventMng.js' WHERE popup_code = 'event';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js' WHERE popup_code = 'gift';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'MbCustInfoMng.js, OdCartMng.js, OdClaimDtl.js, OdClaimMng.js, OdDlivMng.js, OdOrderDtl.js, OdOrderMng.js, Sample04.js, ZdSimulClaimMng.js, ZdSimulMemberMng.js, ZdSimulOrderMng.js, boApp.js' WHERE popup_code = 'member';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Sample04.js, SyMenuMng.js' WHERE popup_code = 'menu';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'OdClaimDtl.js, OdOrderDtl.js, Sample04.js, ZdSimulClaimMng.js, ZdSimulOrderMng.js, boApp.js' WHERE popup_code = 'order';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'BoComp.js, CmFaqDtl.js, DpDispAreaDtl.js, DpDispPanelDtl.js, DpDispUiDtl.js, DpDispWidgetDtl.js, DpDispWidgetLibDtl.js, SyAlarmDtl.js, SyAlarmMng.js, SyBatchMng.js, SyBbmDtl.js, SyRoleMng.js, SySiteDtl.js, SySiteMng.js, SyTemplateMng.js' WHERE popup_code = 'path';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'ZdSimulPlanMng.js' WHERE popup_code = 'plan';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'OdOrderDtl.js, PdCategoryProdMng.js, PdProdDtl.js, PmEventDtl.js, PmPlanDtl.js, ZdSimulOrderMng.js, ZdSimulProdMng.js' WHERE popup_code = 'prod';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js, PmCacheDtl.js, PmCouponDtl.js, PmDiscntDtl.js, PmGiftDtl.js, PmSaveDtl.js' WHERE popup_code = 'prodByCategory';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Sample04.js, SyRoleMng.js' WHERE popup_code = 'role';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PdProdDtl.js' WHERE popup_code = 'save';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Sample04.js, boApp.js' WHERE popup_code = 'site';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'CmDashboardMyMng.js, PdProdDtl.js, ZdSimulUserMng.js' WHERE popup_code = 'user';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Sample04.js, SyRoleMng.js, boApp.js' WHERE popup_code = 'userByDept';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'PmCacheDtl.js, PmCouponDtl.js, PmDiscntDtl.js, PmEventDtl.js, PmGiftDtl.js, PmPlanDtl.js, PmSaveDtl.js, PmVoucherDtl.js, Sample04.js, ZdSimulVendorMng.js, boApp.js' WHERE popup_code = 'vendor';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'ZdSimulVoucherMng.js' WHERE popup_code = 'voucher';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'DpDispPanelDtl.js, DpDispWidgetDtl.js, DpDispWidgetLibDtl.js' WHERE popup_code = 'widgetLib';
UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = 'Contact.js' WHERE popup_code = 'myMemberOrder';
