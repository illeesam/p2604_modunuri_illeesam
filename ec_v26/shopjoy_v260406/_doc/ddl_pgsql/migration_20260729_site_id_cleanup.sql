-- ============================================================================
-- site_id 체계 재통일 (2026-07-29)
--
-- 2026-06-14 에 한 번 통일했는데 다시 어긋난 값이 쌓였다. 전수 감사 결과:
--
--   'SITE000001'         33건  — sy_code 6 / sy_path 22 / sy_prop 4 / syh_access_log 1
--   '260406000000000001' 62건  — mb_member 20 / pd_prod 30 / od_order 10 / 로그 2
--
-- 둘 다 sy_site 에 없는 site_id 다. 사이트 격리가 걸린 화면에서 이 행들은
-- 조회되지 않아 "데이터가 반쯤 사라진" 것처럼 보인다(주문 43건 중 10건 등).
--
-- 원인: 'SITE000001' 이 존재하지 않는데 기본 사이트로 23곳에 하드코딩돼 있었다.
--       → SecurityUtil.DEFAULT_SITE_ID 로 일원화하고 리터럴을 제거했다(같은 커밋).
--       '260406000000000001' 은 구 채번 규칙(18자) 잔재로 보인다 — 현 규칙은 16자.
--
-- 조치: 둘 다 대표 사이트로 흡수한다. 사전 점검에서 유니크 충돌 0건을 확인했다
--       (mb_member.login_id / pd_prod.prod_code / sy_code(code_grp,code_value) / sy_prop.prop_key).
--
-- 제외: syh_access_error_log.site_id IS NULL 452건 — 이 컬럼은 nullable 이고
--       미인증 요청 에러도 기록해야 하므로 NULL 이 정상이다. 건드리지 않는다.
-- ============================================================================

DO $$
DECLARE
    r        RECORD;
    v_main   CONSTANT TEXT := '2604010000000001';
    v_moved  BIGINT;
    v_total  BIGINT := 0;
BEGIN
    /* site_id 컬럼을 가진 모든 테이블을 돈다 — 특정 테이블만 고치면 다음에 또 샌다.
       sy_site 자체는 제외(사이트 마스터의 PK 를 옮기면 안 된다). */
    FOR r IN
        SELECT c.table_name
          FROM information_schema.columns c
          JOIN information_schema.tables t
            ON t.table_schema = c.table_schema AND t.table_name = c.table_name
         WHERE c.table_schema = 'shopjoy_2604'
           AND c.column_name  = 'site_id'
           AND t.table_type   = 'BASE TABLE'
           AND c.table_name  <> 'sy_site'
         ORDER BY c.table_name
    LOOP
        EXECUTE format(
            'UPDATE shopjoy_2604.%I SET site_id = %L '
            'WHERE site_id IS NOT NULL '
            '  AND site_id NOT IN (SELECT s.site_id FROM shopjoy_2604.sy_site s)',
            r.table_name, v_main);
        GET DIAGNOSTICS v_moved = ROW_COUNT;
        IF v_moved > 0 THEN
            v_total := v_total + v_moved;
            RAISE NOTICE '  % : % 건 → %', r.table_name, v_moved, v_main;
        END IF;
    END LOOP;
    RAISE NOTICE 'site_id 통일 완료 — 총 % 건', v_total;
END $$;
