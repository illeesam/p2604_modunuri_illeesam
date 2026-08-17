-- ============================================================
-- cm_popup / cm_popup_item 추가 — 클레임 선택(claim) / 주문항목 선택(orderItem)
-- 주문 칸반 보드(OdOrderKanban.js) 조건란 커스텀 모달을 공통팝업으로 대체하며 신설
-- ============================================================

INSERT INTO shopjoy_2604.cm_popup
 (popup_id, reg_site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, tree_entity_nm, tree_id_field, tree_nm_field, tree_link_field,
  site_field, order_by, base_where, multi_yn, paging_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000027','2604010000000001','claim','클레임 선택',1,'OdClaim','claimId','claimId',
  NULL,NULL,NULL,NULL,NULL,NULL,'a.regDate DESC',NULL,'N','Y',10,'1000px','Y',270,'SYSTEM',CURRENT_TIMESTAMP),
 ('POP0000000000000028','2604010000000001','orderItem','주문항목 선택',1,'OdOrderItem','orderItemId','prodNm',
  NULL,NULL,NULL,NULL,NULL,NULL,'a.regDate DESC',NULL,'N','Y',10,'1000px','Y',280,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, reg_site_id, popup_id, field_nm, field_label, field_type_cd, code_grp,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 -- claim (POP..27)
 ('PPI000000000000271','2604010000000001','POP0000000000000027','claimId','클레임번호','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000272','2604010000000001','POP0000000000000027','claimTypeCd','유형','CODE','CLAIM_TYPE_CD','N','EQ','Y','N','80px','center','N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000273','2604010000000001','POP0000000000000027','orderId','주문번호','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000274','2604010000000001','POP0000000000000027','memberNm','회원','TEXT',NULL,'Y','LIKE','Y','N','100px',NULL,'N',40,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000275','2604010000000001','POP0000000000000027','claimStatusCd','상태','CODE','CLAIM_STATUS_CD','N','EQ','Y','N','90px','center','N',50,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000276','2604010000000001','POP0000000000000027','regDate','생성일시','DATE',NULL,'N','LIKE','Y','N','150px','center','N',60,'Y','SYSTEM',CURRENT_TIMESTAMP),
 -- orderItem (POP..28)
 ('PPI000000000000281','2604010000000001','POP0000000000000028','orderItemId','항목ID','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000282','2604010000000001','POP0000000000000028','orderId','주문ID','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000283','2604010000000001','POP0000000000000028','prodNm','상품명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000284','2604010000000001','POP0000000000000028','orderQty','수량','NUMBER',NULL,'N','EQ','Y','N','60px','center','N',40,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000285','2604010000000001','POP0000000000000028','itemOrderAmt','주문금액','NUMBER',NULL,'N','EQ','Y','N','100px','right','N',50,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000286','2604010000000001','POP0000000000000028','orderItemStatusCd','상태','CODE','ORDER_ITEM_STATUS_CD','N','EQ','Y','N','90px','center','N',60,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;
