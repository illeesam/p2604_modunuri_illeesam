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
