-- ============================================================================
-- cm_popup / cm_popup_item — 3차 정비 (2026-07-26)
--
-- ⚠ 실행 순서 (cm_popup_v2.sql 다음)
--    1. _doc/ddl_pgsql/ec/cm_popup.sql
--    2. _doc/ddl_pgsql/ec/cm_popup_item.sql
--    3. _doc/ddl_pgsql/migration_20260726_cm_popup_tree_entity.sql
--    4. _doc/sample_insert_pgsql/cm_popup.sql        (1차 시드 19종)
--    5. _doc/sample_insert_pgsql/cm_popup_v2.sql     (2차 정비 → 21종)
--    6. 이 파일                                       (3차 → 최종 22종)
--
-- 내용
--  (1) 'code' 팝업 신설
--      BoCodeGrpModal 은 "코드그룹"이 아니라 지정된 그룹 "안의 코드"를 고르는 모달이라
--      SyCode 대상 팝업이 따로 필요하다. 호출부가 codeGrp 을 고정 필터로 넘긴다.
--  (2) 'path' 팝업의 bizCd 를 EQ 로 (표시경로 선택은 업무코드가 정확히 일치해야 한다)
--      LIKE 면 ec_disp_area 를 찾을 때 ec_disp_area_xxx 까지 딸려 나온다.
-- ============================================================================

-- ── (1) 공통코드 값 선택 팝업 ────────────────────────────────────────────────
INSERT INTO shopjoy_2604.cm_popup
 (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, tree_entity_nm, tree_id_field, tree_nm_field, tree_link_field,
  site_field, order_by, base_where, multi_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000023','2604010000000001','code','공통코드 선택',1,'SyCode','codeValue','codeLabel',
  NULL,NULL,NULL,NULL,NULL,
  'siteId','e.sortOrd ASC, e.codeLabel ASC','e.useYn = ''Y''','N',10,'820px','Y',230,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd, code_grp,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 ('PPI000000000000221','2604010000000001','POP0000000000000023','codeLabel','코드명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000222','2604010000000001','POP0000000000000023','codeValue','코드값','TEXT',NULL,'Y','LIKE','Y','N','180px','center','N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000223','2604010000000001','POP0000000000000023','codeGrp','코드그룹','TEXT',NULL,'Y','EQ','Y','N','180px','center','N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000224','2604010000000001','POP0000000000000023','codeRemark','설명','TEXT',NULL,'N','LIKE','Y','N',NULL,NULL,'N',40,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;

-- ── (2) 표시경로 팝업의 업무코드는 정확히 일치 검색 ──────────────────────────
UPDATE shopjoy_2604.cm_popup_item SET search_type_cd = 'EQ'
 WHERE field_nm = 'bizCd'
   AND popup_id = (SELECT popup_id FROM shopjoy_2604.cm_popup WHERE popup_code = 'path');
