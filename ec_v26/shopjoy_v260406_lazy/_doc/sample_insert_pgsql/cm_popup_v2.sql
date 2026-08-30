-- ============================================================================
-- cm_popup / cm_popup_item — 2차 정비 (2026-07-26)
--
-- ⚠ 실행 순서 (신규 DB 구축 시 반드시 이 순서로)
--    1. _doc/ddl_pgsql/ec/cm_popup.sql                        (테이블)
--    2. _doc/ddl_pgsql/ec/cm_popup_item.sql                   (테이블)
--    3. _doc/ddl_pgsql/migration_20260726_cm_popup_tree_entity.sql  (교차트리 컬럼 4개)
--    4. _doc/sample_insert_pgsql/cm_popup.sql                 (1차 시드 19종)
--    5. 이 파일                                                (2차 정비 → 최종 21종)
--    4번 없이 5번만 돌리면 UPDATE 대상이 없어 패턴/코드그룹이 반영되지 않는다.
--
-- 1) 화면패턴 재정의
--      1 = 조회 + 목록
--      2 = 조회 + 트리 + 목록   (트리는 목록을 좁히는 필터. 트리 엔티티가 달라도 됨)
--      3 = 트리 전용            (목록 없이 노드 자체를 고른다)
--    선택목록(칩)은 "다중선택일 때 자동"이므로 더 이상 패턴이 아니다.
--    → 기존 패턴2 로 등록했던 트리형 팝업(dept/role/menu/category/path)을 3 으로 옮긴다.
--
-- 2) 다중선택 의미 정리
--    같은 팝업이라도 화면에 따라 단일/다중이 갈리므로 다중은 호출부의 :multi 옵션이 우선.
--    cm_popup.multi_yn 은 호출부 미지정 시의 기본값일 뿐이다.
--    → 중복으로 만들었던 'userMulti' 팝업 제거 (user + :multi="true" 로 대체)
--
-- 3) CODE 유형 항목에 code_grp 지정
--    지정해야 목록이 코드 라벨로 표시되고 검색이 드롭다운으로 렌더된다.
--
-- 4) 신규 팝업 3종
--    userByDept     : 부서 트리 + 사용자 목록 (교차 엔티티 트리)
--    prodByCategory : 카테고리 트리 + 상품 목록 (교차 엔티티 트리)
--    widgetLib      : 전시 위젯 라이브러리
-- ============================================================================

-- ── 1) 트리형 팝업을 "트리 전용"(패턴3)으로 ────────────────────────────────
UPDATE shopjoy_2604.cm_popup SET popup_pattern = 3, modal_width = '760px'
 WHERE popup_code IN ('dept','role','menu','category','path');

-- ── 2) 중복 팝업 제거 ─────────────────────────────────────────────────────
DELETE FROM shopjoy_2604.cm_popup_item WHERE popup_id = 'POP0000000000000019';
DELETE FROM shopjoy_2604.cm_popup      WHERE popup_id = 'POP0000000000000019';

-- ── 3) CODE 유형 항목에 code_grp 지정 ─────────────────────────────────────
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'USER_STATUS'    WHERE field_nm = 'userStatusCd'    AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'MEMBER_GRADE'   WHERE field_nm = 'gradeCd'         AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'VENDOR_STATUS'  WHERE field_nm = 'vendorStatusCd'  AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'BBM_TYPE'       WHERE field_nm = 'bbmTypeCd'       AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'PROD_STATUS'    WHERE field_nm = 'prodStatusCd'    AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'ORDER_STATUS'   WHERE field_nm = 'orderStatusCd'   AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'COUPON_TYPE'    WHERE field_nm = 'couponTypeCd'    AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'COUPON_STATUS'  WHERE field_nm = 'couponStatusCd'  AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'SAVE_TYPE'      WHERE field_nm = 'saveTypeCd'      AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'DISCNT_TYPE'    WHERE field_nm = 'discntTypeCd'    AND field_type_cd = 'CODE';
UPDATE shopjoy_2604.cm_popup_item SET code_grp = 'GIFT_TYPE'      WHERE field_nm = 'giftTypeCd'      AND field_type_cd = 'CODE';

-- 상태/유형 코드는 드롭다운 검색이 유용하므로 조회항목으로 승격 (EQ)
UPDATE shopjoy_2604.cm_popup_item SET search_yn = 'Y', search_type_cd = 'EQ'
 WHERE field_type_cd = 'CODE' AND code_grp IS NOT NULL;

-- ── 4) 신규 팝업 ──────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.cm_popup
 (popup_id, reg_site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, tree_entity_nm, tree_id_field, tree_nm_field, tree_link_field,
  site_field, order_by, base_where, multi_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000020','2604010000000001','userByDept','사용자 선택 (부서)',2,'SyUser','userId','userNm',
  'parentDeptId','SyDept','deptId','deptNm','deptId',
  'siteId','e.userNm ASC',NULL,'N',10,'1040px','Y',200,'SYSTEM',CURRENT_TIMESTAMP),
 ('POP0000000000000021','2604010000000001','prodByCategory','상품 선택 (카테고리)',2,'PdProd','prodId','prodNm',
  'parentCategoryId','PdCategory','categoryId','categoryNm','categoryId',
  'siteId','e.prodNm ASC',NULL,'N',10,'1100px','Y',210,'SYSTEM',CURRENT_TIMESTAMP),
 ('POP0000000000000022','2604010000000001','widgetLib','위젯 선택',1,'DpWidgetLib','widgetLibId','widgetNm',
  NULL,NULL,NULL,NULL,NULL,
  'siteId','e.sortOrd ASC, e.widgetNm ASC','e.useYn = ''Y''','N',10,'900px','Y',220,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, reg_site_id, popup_id, field_nm, field_label, field_type_cd, code_grp,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 -- userByDept (목록 = SyUser, 트리 = SyDept)
 ('PPI000000000000191','2604010000000001','POP0000000000000020','userNm','사용자명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000192','2604010000000001','POP0000000000000020','loginId','로그인ID','TEXT',NULL,'Y','LIKE','Y','N','140px',NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000193','2604010000000001','POP0000000000000020','userEmail','이메일','TEXT',NULL,'Y','LIKE','Y','N','180px',NULL,'N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000194','2604010000000001','POP0000000000000020','userStatusCd','상태','CODE','USER_STATUS','Y','EQ','Y','N','90px','center','N',40,'Y','SYSTEM',CURRENT_TIMESTAMP),
 -- prodByCategory (목록 = PdProd, 트리 = PdCategory)
 ('PPI000000000000201','2604010000000001','POP0000000000000021','prodNm','상품명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000202','2604010000000001','POP0000000000000021','prodCode','상품코드','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000203','2604010000000001','POP0000000000000021','salePrice','판매가','NUMBER',NULL,'N','EQ','Y','N','110px','right','N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000204','2604010000000001','POP0000000000000021','prodStatusCd','상태','CODE','PROD_STATUS','Y','EQ','Y','N','90px','center','N',40,'Y','SYSTEM',CURRENT_TIMESTAMP),
 -- widgetLib
 ('PPI000000000000211','2604010000000001','POP0000000000000022','widgetNm','위젯명','TEXT',NULL,'Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000212','2604010000000001','POP0000000000000022','widgetCode','위젯코드','TEXT',NULL,'Y','LIKE','Y','N','150px',NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000213','2604010000000001','POP0000000000000022','widgetTypeCd','위젯유형','CODE','DISP_WIDGET_TYPE','Y','EQ','Y','N','160px','center','N',30,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;
