-- ============================================================================
-- 상태코드 표준화 (2026-07-31)
--   sy_code 표준 코드그룹에 없는 값들이 각 테이블에 섞여 있었다.
--   증상: 주문 칸반에서 상태가 어느 컬럼에도 매칭되지 않아 카드가 통째로 안 보임
--         (od_order_item.ORDER_COMPLETE 16건), 목록에 라벨 대신 코드가 그대로 노출
--         (클레임 "취소 · REQUEST").
--
--   여기서는 "표준에 있는 값의 동의어/오타" 만 데이터를 고친다.
--   실제로 코드그룹에 빠져 있던 값(EVENT INACTIVE, GIFT SHIPPED/RECEIVED,
--   ERP MATCHED, SETTLE CONFIRMED/PAID)은 데이터를 왜곡하지 않도록
--   sy_code 에 코드를 추가하는 쪽으로 별도 처리한다.
-- ============================================================================
DO $$
DECLARE
  n int;
  total int := 0;
  -- table, column, from, to
  m text[][] := ARRAY[
    -- 주문항목: ORDER_ITEM_STATUS = ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED
    ['od_order_item','order_item_status_cd','ORDER_COMPLETE','ORDERED'],
    ['od_order_item','order_item_status_cd_before','ORDER_COMPLETE','ORDERED'],
    -- 클레임: CLAIM_STATUS = REQUESTED/ACCEPTED/APPROVED/REJECTED/IN_PICKUP/COMPLT/PROCESSING/REFUND_WAIT/CANCELLED
    ['od_claim','claim_status_cd','REQUEST','REQUESTED'],
    ['od_claim','claim_status_cd','COMPLETE','COMPLT'],
    ['od_claim','claim_status_cd','WAIT_REFUND','REFUND_WAIT'],
    ['od_claim','claim_status_cd','COLLECTING','IN_PICKUP'],
    ['od_claim','claim_status_cd_before','REQUEST','REQUESTED'],
    ['od_claim','claim_status_cd_before','COMPLETE','COMPLT'],
    ['od_claim','claim_status_cd_before','WAIT_REFUND','REFUND_WAIT'],
    ['od_claim','claim_status_cd_before','COLLECTING','IN_PICKUP'],
    ['od_claim_item','claim_item_status_cd','REQUEST','REQUESTED'],
    ['od_claim_item','claim_item_status_cd','COMPLETE','COMPLT'],
    ['od_claim_item','claim_item_status_cd_before','REQUEST','REQUESTED'],
    ['od_claim_item','claim_item_status_cd_before','COMPLETE','COMPLT'],
    -- 주문: ORDER_STATUS = PENDING/PAID/PREPARING/SHIPPED/DELIVERED/COMPLT/CANCELLED/AUTO_CANCELLED
    ['od_order','order_status_cd','COMPLETE','COMPLT'],
    ['od_order','order_status_cd','CANCEL','CANCELLED'],
    ['od_order','order_status_cd','WAIT_PAY','PENDING'],
    ['od_order','order_status_cd','SHIPPING','SHIPPED'],
    ['od_order','order_status_cd_before','COMPLETE','COMPLT'],
    ['od_order','order_status_cd_before','CANCEL','CANCELLED'],
    ['od_order','order_status_cd_before','WAIT_PAY','PENDING'],
    ['od_order','order_status_cd_before','SHIPPING','SHIPPED'],
    -- 배송: DLIV_STATUS = READY/SHIPPED/IN_TRANSIT/DELIVERED/FAILED
    ['od_dliv','dliv_status_cd','PREPARING','READY'],
    ['od_dliv','dliv_status_cd','SHIPPING','IN_TRANSIT'],
    ['od_dliv','dliv_status_cd_before','PREPARING','READY'],
    ['od_dliv','dliv_status_cd_before','SHIPPING','IN_TRANSIT'],
    -- 상품: PROD_STATUS = ACTIVE/INACTIVE/SOLDOUT/DRAFT
    ['pd_prod','prod_status_cd','SELLING','ACTIVE'],
    ['pd_prod','prod_status_cd_before','SELLING','ACTIVE'],
    -- 채팅: CHATT_STATUS = WAITING/ACTIVE/DONE
    ['cm_chatt','chatt_status_cd','PENDING','WAITING'],
    -- 정산대사: RECON_STATUS = MATCHED/DIFF/MANUAL
    ['st_recon','recon_status_cd','MISMATCH','DIFF'],
    -- 문의: CONTACT_STATUS = RECEIVED/IN_PROGRESS/DONE/ON_HOLD
    ['sy_contact','contact_status_cd','요청','RECEIVED'],
    ['sy_contact','contact_status_cd','REQUEST','RECEIVED'],
    ['sy_contact','contact_status_cd','PROCESSING','IN_PROGRESS'],
    ['sy_contact','contact_status_cd','ANSWERED','DONE'],
    -- 공지: NOTICE_STATUS = ACTIVE/PUBLISHED/INACTIVE/RESERVED/ENDED/DRAFT
    ['sy_notice','notice_status_cd','PUBLISH','PUBLISHED'],
    ['sy_notice','notice_status_cd','END','ENDED'],
    ['sy_notice','notice_status_cd','','DRAFT'],
    -- 게시판: 컬럼 코멘트가 (ACTIVE/DELETED/HIDDEN) → BBS_STATUS 기준
    ['sy_bbs','bbs_status_cd','PUBLISH','ACTIVE'],
    ['sy_bbs','bbs_status_cd','게시','ACTIVE'],
    ['sy_bbs','bbs_status_cd','임시','HIDDEN']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(m, 1) LOOP
    -- 대상 컬럼이 없는 테이블은 건너뛴다(*_before 미보유 테이블 대응)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='shopjoy_2604' AND table_name=m[i][1] AND column_name=m[i][2]) THEN
      EXECUTE format('UPDATE shopjoy_2604.%I SET %I = %L WHERE %I = %L', m[i][1], m[i][2], m[i][4], m[i][2], m[i][3]);
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN
        total := total + n;
        RAISE NOTICE '% . % : % -> %  (%건)', m[i][1], m[i][2], m[i][3], m[i][4], n;
      END IF;
    END IF;
  END LOOP;
  RAISE NOTICE '총 % 건 표준화', total;
END $$;
-- cm_chatt 상태 표준화 — CHATT_STATUS = WAITING(대기)/ACTIVE(진행중)/DONE(완료)
--   OPEN(진행중), CLOSED(종료) 는 표준에 없는 값이라 라벨이 안 붙고 필터도 어긋난다.
DO $$
DECLARE n int; t int := 0;
BEGIN
  UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd='ACTIVE' WHERE chatt_status_cd='OPEN';
  GET DIAGNOSTICS n = ROW_COUNT; t := t + n; RAISE NOTICE 'OPEN -> ACTIVE (%건)', n;
  UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd='DONE' WHERE chatt_status_cd='CLOSED';
  GET DIAGNOSTICS n = ROW_COUNT; t := t + n; RAISE NOTICE 'CLOSED -> DONE (%건)', n;
  RAISE NOTICE '총 %건', t;
END $$;
-- 결재 코드그룹명 정정 (2026-07-31)
--   컬럼 코멘트가 APPROVAL_STATUS / APPROVAL_TARGET 로 적혀 있었으나
--   sy_code 에 등록된 실제 그룹은 APPR_STATUS / APPR_TARGET 이다.
--   백엔드 조인도 APPROVAL_* 을 쓰고 있어 결재상태·결재대상 라벨이 항상 null 이었다(코드 수정 완료).
DO $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT co.table_name, co.column_name, pgd.description
      FROM information_schema.columns co
      JOIN pg_class pc ON pc.relname = co.table_name
      JOIN pg_description pgd ON pgd.objoid = pc.oid AND pgd.objsubid = co.ordinal_position
     WHERE co.table_schema = 'shopjoy_2604'
       AND (pgd.description LIKE '%APPROVAL_STATUS%' OR pgd.description LIKE '%APPROVAL_TARGET%')
  LOOP
    EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.%I IS %L',
                   r.table_name, r.column_name,
                   replace(replace(r.description,'APPROVAL_STATUS','APPR_STATUS'),'APPROVAL_TARGET','APPR_TARGET'));
    n := n + 1;
    RAISE NOTICE '%.% 코멘트 정정', r.table_name, r.column_name;
  END LOOP;
  RAISE NOTICE '총 %건', n;
END $$;
-- 컬럼 코멘트의 코드그룹명 정정 (2026-07-31)
--   sy_code 에 같은 개념의 그룹이 둘씩 있고(낡은 시드 + 실제 사용본),
--   컬럼 코멘트가 '낡은 쪽'을 가리키고 있었다. 실제 데이터를 100% 담고 있는 정본으로 바꾼다.
--   · WIDGET_TYPE(20, 낡음)      → DISP_WIDGET_TYPE(27, 지침서 명시·데이터 100% 등록)
--   · PRODUCT_STATUS(ON_SALE 등) → PROD_STATUS(ACTIVE/INACTIVE/SOLDOUT/DRAFT)
--   · PRODUCT_TYPE(없음)         → PROD_TYPE(SINGLE/OPTION/GROUP/SET/GIFT)
--   · CLAIM_FAULT(없음)          → FAULT_TYPE(CUST/VENDOR/PLATFORM)
DO $$
DECLARE r record; n int := 0;
  m text[][] := ARRAY[
    ['WIDGET_TYPE','DISP_WIDGET_TYPE'],
    ['PRODUCT_STATUS','PROD_STATUS'],
    ['PRODUCT_TYPE','PROD_TYPE'],
    ['CLAIM_FAULT','FAULT_TYPE']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(m,1) LOOP
    FOR r IN
      SELECT co.table_name, co.column_name, pgd.description
        FROM information_schema.columns co
        JOIN pg_class pc ON pc.relname = co.table_name
        JOIN pg_description pgd ON pgd.objoid = pc.oid AND pgd.objsubid = co.ordinal_position
       WHERE co.table_schema='shopjoy_2604'
         AND pgd.description LIKE '%코드: ' || m[i][1] || '%'
    LOOP
      EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.%I IS %L',
                     r.table_name, r.column_name,
                     replace(r.description, '코드: ' || m[i][1], '코드: ' || m[i][2]));
      n := n + 1;
      RAISE NOTICE '%.% : % -> %', r.table_name, r.column_name, m[i][1], m[i][2];
    END LOOP;
  END LOOP;
  RAISE NOTICE '총 %건', n;
END $$;
-- od_order.pay_method_cd: TRANSFER → BANK_TRANSFER (PAY_METHOD 표준 동의어)
--   PAY_METHOD 에 이미 BANK_TRANSFER 가 있는데 데이터가 TRANSFER 로 들어가 라벨이 안 붙었다.
--   코드에 'TRANSFER' 하드코딩 없음(grep 확인) → 데이터 정규화가 안전.
DO $$
DECLARE n int;
BEGIN
  UPDATE shopjoy_2604.od_order SET pay_method_cd='BANK_TRANSFER' WHERE pay_method_cd='TRANSFER';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'od_order TRANSFER -> BANK_TRANSFER (%건)', n;
  UPDATE shopjoy_2604.od_pay SET pay_method_cd='BANK_TRANSFER' WHERE pay_method_cd='TRANSFER';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'od_pay TRANSFER -> BANK_TRANSFER (%건)', n;
END $$;
-- 컬럼 코멘트의 코드그룹 정정 2차 (2026-07-31) — 개념이 다른 그룹을 가리키던 건
--   그대로 두고 값을 추가하면 엉뚱한 그룹이 오염된다(예: USE_YN 에 ACTIVE).
--   실제 값을 담고 있는 정본 그룹으로 교체한다.
DO $$
DECLARE n int := 0;
  m text[][] := ARRAY[
    -- 표(테이블, 컬럼, 기존그룹, 정본그룹)
    ['pd_category','category_status_cd','USE_YN','CATEGORY_STATUS'],
    ['mbh_member_token_log','token_type_cd','TOKEN_TYPE','APP_TYPE'],
    ['syh_user_token_log','token_type_cd','TOKEN_TYPE','APP_TYPE'],
    ['st_settle_pay','pay_method_cd','PAY_METHOD_CD','PAY_METHOD'],
    ['st_settle_raw','pay_method_cd','PAY_METHOD_CD','PAY_METHOD'],
    ['pm_coupon','target_type_cd','COUPON_TARGET','PROMO_TARGET_TYPE'],
    ['pm_coupon_item','target_type_cd','COUPON_ITEM_TARGET','PROMO_TARGET_TYPE'],
    ['pm_discnt_item','target_type_cd','DISCNT_ITEM_TARGET','PROMO_TARGET_TYPE'],
    ['pm_event_item','target_type_cd','EVENT_ITEM_TARGET','PROMO_TARGET_TYPE'],
    ['sy_vendor_user','vendor_user_status_cd','VENDOR_MEMBER_STATUS','VENDOR_USER_STATUS']
  ];
  i int; cur text;
BEGIN
  FOR i IN 1 .. array_length(m,1) LOOP
    SELECT pgd.description INTO cur
      FROM information_schema.columns co
      JOIN pg_class pc ON pc.relname = co.table_name
      JOIN pg_description pgd ON pgd.objoid = pc.oid AND pgd.objsubid = co.ordinal_position
     WHERE co.table_schema='shopjoy_2604' AND co.table_name=m[i][1] AND co.column_name=m[i][2];
    IF cur IS NULL THEN CONTINUE; END IF;
    EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.%I IS %L', m[i][1], m[i][2],
                   replace(cur, '코드: ' || m[i][3], '코드: ' || m[i][4]));
    n := n + 1;
    RAISE NOTICE '%.% : % -> %', m[i][1], m[i][2], m[i][3], m[i][4];
  END LOOP;
  RAISE NOTICE '총 %건', n;
END $$;
-- sy_bbm.content_type_cd: htmleditor → HTMLEDITOR (표기 드리프트, 코드는 이미 존재)
DO $$
DECLARE n int;
BEGIN
  UPDATE shopjoy_2604.sy_bbm SET content_type_cd='HTMLEDITOR' WHERE content_type_cd='htmleditor';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'htmleditor -> HTMLEDITOR (%건)', n;
  UPDATE shopjoy_2604.sy_bbm SET content_type_cd='TEXTAREA' WHERE content_type_cd='textarea';
  GET DIAGNOSTICS n = ROW_COUNT; RAISE NOTICE 'textarea -> TEXTAREA (%건)', n;
END $$;
-- 미사용 공통코드 삭제 (2026-07-31)
--   조건: ① 어떤 테이블 데이터에도 값이 없고
--         ② 프론트·백엔드 소스(js/java/xml/yml/html)와 정책서(md) 어디에도 문자열로 등장하지 않음
--   낡은 시드 어휘의 잔재다. 되살릴 때를 대비해 삭제 대상을 NOTICE 로 남긴다.
DO $$
DECLARE r record; n int := 0; k int;
  t text[][] := ARRAY[
    ['APP_TYPE','ANON'],
    ['BBM_SCOPE_TYPE','COMPANY'],
    ['CACHE_TYPE','EARN_BUY'],
    ['CONTACT_STATUS','ON_HOLD'],
    ['EVENT_TYPE','CURATED'],
    ['MEMBER_STATUS','BLOCKED'],
    ['USER_STATUS','LOCKED'],
    ['VENDOR_STATUS','BLOCKED'],
    ['VENDOR_STATUS','REVIEWING']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(t,1) LOOP
    FOR r IN SELECT code_id, code_grp, code_value, code_label
               FROM shopjoy_2604.sy_code
              WHERE code_grp = t[i][1] AND code_value = t[i][2]
    LOOP
      RAISE NOTICE '삭제: % | % | % | %', r.code_id, r.code_grp, r.code_value, r.code_label;
    END LOOP;
    DELETE FROM shopjoy_2604.sy_code WHERE code_grp = t[i][1] AND code_value = t[i][2];
    GET DIAGNOSTICS k = ROW_COUNT; n := n + k;
  END LOOP;
  RAISE NOTICE '총 %건 삭제', n;
END $$;
