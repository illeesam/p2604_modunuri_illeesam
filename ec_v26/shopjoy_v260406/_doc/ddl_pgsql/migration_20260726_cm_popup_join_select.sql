-- ============================================================================
-- cm_popup / cm_popup_item — 조인 + 출력식 + 드라이빙 별칭 a 통일 (2026-07-26)
--
-- ① 드라이빙 별칭 e → a
--    생성 JPQL 의 주 엔티티 별칭을 항상 a 로 고정했다. order_by / base_where 는
--    DB 에 별칭이 박힌 문자열이므로 함께 바꿔준다 (33건 전부 'e.' 를 쓰고 있었다).
--
-- ② cm_popup.join_clause  — 라벨을 끌어오는 LEFT JOIN 절
--    형태 제한: LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>  (반복 가능)
--    별칭은 a 를 피해 b, c, d … 를 쓴다.
--    to-one 만 허용한다 — to-many 를 걸면 드라이빙 행이 불어나 COUNT/페이징이 어긋난다.
--
-- ③ cm_popup_item.select_expr — 출력식
--    비우면 드라이빙 엔티티의 field_nm 값을 그대로 쓴다(기존 동작).
--    값이 있으면 그 표현식을 SELECT 에 덧붙여 가져오고, 결과 맵에는 field_nm 키로 담는다.
--    즉 field_nm='deptNm' + select_expr='b.deptNm' → row.deptNm 으로 내려간다.
--
--    ※ 유형이 CODE 인 항목(예: saveTypeCd)은 조인이 필요 없다 —
--      code_grp 을 주면 프론트가 sy_code 라벨로 표시한다(codeMap). 조인은
--      FK 라벨(부서명·브랜드명·업체명처럼 다른 테이블에 이름이 있는 경우)에 쓴다.
-- ============================================================================

-- ── ① 별칭 e → a (단어 경계 기준으로만 치환) ────────────────────────────────
UPDATE shopjoy_2604.cm_popup
   SET order_by   = regexp_replace(order_by,   '(^|[^A-Za-z0-9_])e\.', '\1a.', 'g')
 WHERE order_by IS NOT NULL AND order_by ~ '(^|[^A-Za-z0-9_])e\.';

UPDATE shopjoy_2604.cm_popup
   SET base_where = regexp_replace(base_where, '(^|[^A-Za-z0-9_])e\.', '\1a.', 'g')
 WHERE base_where IS NOT NULL AND base_where ~ '(^|[^A-Za-z0-9_])e\.';

-- ── ② / ③ 컬럼 추가 ────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_popup      ADD COLUMN IF NOT EXISTS join_clause VARCHAR(500);
ALTER TABLE shopjoy_2604.cm_popup_item ADD COLUMN IF NOT EXISTS select_expr VARCHAR(100);

COMMENT ON COLUMN shopjoy_2604.cm_popup.join_clause IS
  'LEFT JOIN 절 (라벨 조인용). 형태: LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>. 드라이빙 별칭은 항상 a, 조인 별칭은 b~z';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.select_expr IS
  '출력식. 비우면 드라이빙(a) 엔티티의 field_nm. 조인 컬럼은 <별칭>.<필드> (예: b.deptNm). 결과는 field_nm 키로 내려간다';

-- ── 적용 예시: user 팝업(SyUser)에 부서명 컬럼 추가 ────────────────────────
-- SyUser 는 dept_id 만 갖고 부서명이 없다. SyDept 를 조인해 목록에 부서명을 보여준다.
UPDATE shopjoy_2604.cm_popup
   SET join_clause = 'LEFT JOIN SyDept b ON b.deptId = a.deptId'
 WHERE popup_code = 'user';

INSERT INTO shopjoy_2604.cm_popup_item
  (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, tree_label_yn, link_yn, col_align,
   select_expr, required_yn, sort_ord, use_yn, remark,
   reg_by, reg_date, upd_by, upd_date)
SELECT 'POI2607260009001', p.site_id, p.popup_id, 'deptNm', '부서', 'TEXT',
       'N', NULL, 'Y', 'N', 'N', NULL,
       'b.deptNm', 'N', 25, 'Y', '조인 출력 — SyDept.deptNm',
       'SYSTEM', now(), 'SYSTEM', now()
  FROM shopjoy_2604.cm_popup p
 WHERE p.popup_code = 'user'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = 'POI2607260009001');

-- ── 적용 예시: myVendorProd 에 브랜드명 추가 (조인 2개 동시) ────────────────
UPDATE shopjoy_2604.cm_popup
   SET join_clause = 'LEFT JOIN SyBrand b ON b.brandId = a.brandId LEFT JOIN SyVendor c ON c.vendorId = a.vendorId'
 WHERE popup_code = 'myVendorProd';

INSERT INTO shopjoy_2604.cm_popup_item
  (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, tree_label_yn, link_yn, col_align,
   select_expr, required_yn, sort_ord, use_yn, remark,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.iid, p.site_id, p.popup_id, v.fn, v.lb, 'TEXT',
       'N', NULL, 'Y', 'N', 'N', NULL,
       v.se, 'N', v.so, 'Y', '조인 출력',
       'SYSTEM', now(), 'SYSTEM', now()
  FROM shopjoy_2604.cm_popup p,
       (VALUES ('POI2607260009011', 'brandNm',  '브랜드', 'b.brandNm',  25),
               ('POI2607260009012', 'vendorNm', '업체',   'c.vendorNm', 26)
       ) AS v(iid, fn, lb, se, so)
 WHERE p.popup_code = 'myVendorProd'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.iid);
