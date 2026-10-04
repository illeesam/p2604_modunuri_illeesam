-- ═══════════════════════════════════════════════════════════
--  공통코드 "적용 사이트 매핑" 개편 — 2단계 (나중에 실행: 안 쓰는 컬럼 삭제)
--  작성일: 2026-10-05
--
--  ※ 지금 실행하지 않는다. 아래 조건이 모두 맞은 뒤에 실행한다.
--     1) 1단계(migration_20261005_code_grp_site.sql) 실행 완료
--     2) sy_code_grp_site 를 읽는 새 백엔드(ecBeBo)가 개발·운영 모두 배포되어 안정적으로 돌고 있음
--        — 새 백엔드는 module_cd·child_code_values 를 읽지도 쓰지도 않는다(엔티티에서 뺐다).
--        — 옛 백엔드(SyCodeGrp.moduleCd / SyCode.childCodeValues 를 매핑한 버전)가 하나라도 돌고 있으면
--          컬럼이 없어지는 순간 코드 조회가 실패한다. 옛 버전으로 되돌릴 일이 없다고 판단된 뒤에 실행할 것.
--     3) 아래 "사전 확인" 조회가 예상대로 나옴
--
--  하는 일:
--     · sy_code_grp.module_cd 삭제 — 적용 사이트는 sy_code_grp_site 로 옮겼다
--     · sy_code.child_code_values 삭제 — MEET_STATUS_CD 3건은 parent_code_value 방식으로 옮겼다
--     · 뷰 vw_sy_code 를 child_code_values 없이 다시 만든다(뷰가 이 컬럼을 물고 있어 그냥은 삭제되지 않는다)
--
--  다시 실행해도 안전하다(IF EXISTS). 삭제한 컬럼의 값은 되돌릴 수 없으므로 실행 전에 아래 백업 조회 결과를 저장해 둔다.
--  되돌리기: ALTER TABLE … ADD COLUMN module_cd VARCHAR(20) / child_code_values VARCHAR(500) 뒤 백업 값으로 UPDATE.
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 0) 사전 확인 (눈으로 확인) · 백업
-- ───────────────────────────────────────────────────────────
-- module_cd 가 있는데 매핑이 없는 그룹 — 0행이어야 한다(있으면 1단계를 다시 실행)
-- SELECT g.code_grp_id, g.code_grp, g.module_cd FROM shopjoy_2604.sy_code_grp g
--  WHERE COALESCE(g.module_cd, '') <> ''
--    AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m WHERE m.code_grp_id = g.code_grp_id);
-- 백업용(결과를 저장해 둘 것)
-- SELECT code_grp_id, code_grp, module_cd FROM shopjoy_2604.sy_code_grp WHERE COALESCE(module_cd, '') <> '' ORDER BY code_grp;
-- SELECT c.code_id, g.code_grp, c.code_value, c.child_code_values FROM shopjoy_2604.sy_code c
--   JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id WHERE COALESCE(c.child_code_values, '') <> '';

DO $$
DECLARE
    v_left INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_code_grp' AND column_name = 'module_cd') THEN
        EXECUTE 'SELECT COUNT(*) FROM shopjoy_2604.sy_code_grp g
                  WHERE COALESCE(g.module_cd, '''') <> ''''
                    AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp_site m WHERE m.code_grp_id = g.code_grp_id)'
           INTO v_left;
    END IF;
    IF v_left > 0 THEN
        RAISE EXCEPTION 'module_cd 가 있는데 적용 사이트 매핑이 없는 그룹이 %개 있습니다. 1단계를 먼저 다시 실행하세요.', v_left;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 1) 뷰를 내리고 컬럼 삭제 뒤 다시 만든다 (한 트랜잭션)
-- ───────────────────────────────────────────────────────────
BEGIN;

DROP VIEW IF EXISTS shopjoy_2604.vw_sy_code;

ALTER TABLE shopjoy_2604.sy_code     DROP COLUMN IF EXISTS child_code_values;
ALTER TABLE shopjoy_2604.sy_code_grp DROP COLUMN IF EXISTS module_cd;

CREATE VIEW shopjoy_2604.vw_sy_code AS
SELECT c.code_id,
       c.code_grp_id,
       g.code_grp,
       g.grp_nm,
       c.code_value,
       c.code_label,
       c.sort_ord,
       c.use_yn,
       c.parent_code_value,
       c.code_remark,
       c.code_level,
       c.code_opt1,
       c.reg_by,
       c.reg_date,
       c.upd_by,
       c.upd_date
  FROM shopjoy_2604.sy_code c
  LEFT JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id::text = c.code_grp_id::text;
COMMENT ON VIEW shopjoy_2604.vw_sy_code IS '공통코드 + 그룹명 (목록의 코드 라벨 조인용)';

COMMIT;

-- ───────────────────────────────────────────────────────────
-- 2) 확인용 조회
-- ───────────────────────────────────────────────────────────
SELECT table_name, column_name
  FROM information_schema.columns
 WHERE table_schema = 'shopjoy_2604'
   AND ((table_name = 'sy_code_grp' AND column_name = 'module_cd')
     OR (table_name IN ('sy_code', 'vw_sy_code') AND column_name = 'child_code_values'));   -- 예상 0행
SELECT COUNT(*) AS vw_cnt FROM shopjoy_2604.vw_sy_code;
