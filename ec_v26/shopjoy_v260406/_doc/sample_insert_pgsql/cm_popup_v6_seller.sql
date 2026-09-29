-- ============================================================
-- cm_popup / cm_popup_item 추가 — 판매자 선택(seller)
-- 셀러 컨셉 Phase 2: BO 상품목록/이벤트/기획전 등에서 판매자(mb_seller) 검색조건 pick 필드로 사용.
-- ecFeBo lib/app/boAppBase.js 에 popup-code="seller" 프론트 배선은 이미 돼 있음(2026-09-30) —
-- 이 시드가 DB에 들어가야 실제로 팝업이 동작함(POP..29 까지 사용 중 확인 후 30으로 채번).
-- ============================================================

INSERT INTO shopjoy_2604.cm_popup
 (popup_id, reg_site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, tree_entity_nm, tree_id_field, tree_nm_field, tree_link_field,
  site_field, order_by, base_where, multi_yn, paging_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000030','2604010000000001','seller','판매자 선택',1,'MbSeller','sellerId','sellerNm',
  NULL,NULL,NULL,NULL,NULL,NULL,'a.regDate DESC',NULL,'N','Y',10,'900px','Y',300,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, reg_site_id, popup_id, field_nm, field_label, field_type_cd, code_grp,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 ('PPI000000000000301','2604010000000001','POP0000000000000030','sellerId','판매자ID','TEXT',NULL,'N','LIKE','Y','N','160px',NULL,'N',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000302','2604010000000001','POP0000000000000030','sellerNm','판매자명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000303','2604010000000001','POP0000000000000030','sellerTypeCd','유형','CODE','SELLER_TYPE_CD','Y','EQ','Y','N','90px','center','N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000304','2604010000000001','POP0000000000000030','sellerStatusCd','상태','CODE','SELLER_STATUS_CD','Y','EQ','Y','N','90px','center','N',40,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;

-- ============================================================
-- 검증
-- ============================================================
-- SELECT * FROM shopjoy_2604.cm_popup WHERE popup_code = 'seller';
-- SELECT * FROM shopjoy_2604.cm_popup_item WHERE popup_id = 'POP0000000000000030' ORDER BY sort_ord;
