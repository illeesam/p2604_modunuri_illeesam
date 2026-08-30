INSERT INTO shopjoy_2604.cm_popup
 (popup_id, reg_site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, tree_entity_nm, tree_id_field, tree_nm_field, tree_link_field,
  site_field, order_by, base_where, multi_yn, paging_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000024','2604010000000001','event','이벤트 선택',1,'PmEvent','eventId','eventNm',
  NULL,NULL,NULL,NULL,NULL,'siteId','e.eventNm ASC',NULL,'N','Y',10,'900px','Y',240,'SYSTEM',CURRENT_TIMESTAMP),
 ('POP0000000000000025','2604010000000001','plan','기획전 선택',1,'PmPlan','planId','planNm',
  NULL,NULL,NULL,NULL,NULL,'siteId','e.planNm ASC',NULL,'N','Y',10,'900px','Y',250,'SYSTEM',CURRENT_TIMESTAMP),
 ('POP0000000000000026','2604010000000001','voucher','상품권 선택',1,'PmVoucher','voucherId','voucherNm',
  NULL,NULL,NULL,NULL,NULL,'siteId','e.voucherNm ASC',NULL,'N','Y',10,'900px','Y',260,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, reg_site_id, popup_id, field_nm, field_label, field_type_cd, code_grp,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 ('PPI000000000000241','2604010000000001','POP0000000000000024','eventNm','이벤트명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000242','2604010000000001','POP0000000000000024','eventTitle','제목','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000243','2604010000000001','POP0000000000000024','startDate','시작일','DATE',NULL,'N','LIKE','Y','N','120px','center','N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000251','2604010000000001','POP0000000000000025','planNm','기획전명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000252','2604010000000001','POP0000000000000025','planTitle','제목','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000261','2604010000000001','POP0000000000000026','voucherNm','상품권명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000262','2604010000000001','POP0000000000000026','voucherValue','금액','NUMBER',NULL,'N','LIKE','Y','N','120px','right','N',20,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;
