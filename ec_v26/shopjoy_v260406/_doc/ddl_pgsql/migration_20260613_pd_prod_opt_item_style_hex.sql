-- ============================================================
-- migration: pd_prod_opt_item.opt_style 색상값 순수 hex 표준화
--
-- 사유:
--   색상(COLOR) 옵션 아이템의 opt_style 에 'background-color:#000000' 형태의
--   CSS 조각이 저장되어 있어, FO 상품상세의 색상 버튼이 hex 를 인식하지 못하고
--   회색으로만 표시되었다.
--   프론트는 cofHexColor() 로 'background-color:#xxxxxx' 도 파싱하도록 보완했으나,
--   DB 값 자체도 표준(순수 hex '#xxxxxx')으로 통일해 둔다.
--
-- 영향 범위:
--   - opt_type_cd = 'COLOR' 이고 opt_style 안에 hex(#rgb / #rrggbb)가 들어있는 행만 변경
--   - 이미 순수 hex 인 행, hex 가 없는 행(named color 등)은 변경하지 않음 (값 유실 방지)
--   - 사이즈(SIZE) 등 다른 옵션 타입은 건드리지 않음
--
-- 비고:
--   - 색상↔사이즈 종속(parent_opt_item_id)은 본 데이터에서 의도적으로 비어 있다.
--     (1단=색상, 2단=사이즈 독립 구조 + SKU 전조합). 따라서 parent 연결은 채우지 않는다.
--     사이즈 미표시는 프론트 cfAllowedSizeNms 폴백(트리 없으면 전체 노출)으로 해결됨.
-- 적용일: 2026-06-13
-- ============================================================

-- 변경 전 영향 행 수 확인용 (참고)
-- SELECT count(*) FROM shopjoy_2604.pd_prod_opt_item
--  WHERE opt_type_cd = 'COLOR'
--    AND opt_style ~ '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})'
--    AND opt_style !~ '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$';

UPDATE shopjoy_2604.pd_prod_opt_item AS oi
   SET opt_style = '#' || (regexp_match(oi.opt_style, '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})'))[1]
 WHERE oi.opt_type_cd = 'COLOR'
   AND oi.opt_style ~ '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})'        -- hex 가 포함된 행만
   AND oi.opt_style !~ '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$';    -- 아직 순수 hex 가 아닌 행만

-- 검증: 변경 후 COLOR opt_style 분포
-- SELECT opt_nm, opt_style, count(*)
--   FROM shopjoy_2604.pd_prod_opt_item
--  WHERE opt_type_cd = 'COLOR'
--  GROUP BY opt_nm, opt_style
--  ORDER BY opt_nm;
