-- ============================================================
-- migration: 2026-05-05  Entity ↔ DB 길이/타입 정렬
--
-- 사유: validate 프로파일 전수 검사 결과 미스매치 49건 정리.
--       - ID 컬럼 (Entity 20→21): 코드 측에서 length 변경 (DB 변경 없음)
--       - 외부 시스템 ID / 감사 컬럼: DB를 Entity 길이에 맞춰 ALTER
--       - zz_sample0: 샘플 테이블이므로 Entity 기준으로 ALTER
-- ============================================================

-- ── 외부 시스템 ID / 로그인 ID — DB 21 → Entity 길이 ─────────────
ALTER TABLE shopjoy_2604.mb_member_sns         ALTER COLUMN sns_user_id    TYPE VARCHAR(200);
ALTER TABLE shopjoy_2604.mbh_member_login_log  ALTER COLUMN login_id       TYPE VARCHAR(100);
ALTER TABLE shopjoy_2604.syh_user_login_log    ALTER COLUMN login_id       TYPE VARCHAR(100);
ALTER TABLE shopjoy_2604.sy_user               ALTER COLUMN login_id       TYPE VARCHAR(50);

-- ── PG 결제/환불 ID — DB 21 → Entity 100 ────────────────────────
ALTER TABLE shopjoy_2604.od_pay                ALTER COLUMN pg_transaction_id TYPE VARCHAR(100);
ALTER TABLE shopjoy_2604.od_refund_method      ALTER COLUMN pg_refund_id      TYPE VARCHAR(100);
ALTER TABLE shopjoy_2604.odh_pay_chg_hist      ALTER COLUMN refund_pg_tid     TYPE VARCHAR(100);

-- ── 옵션 코드 ID — DB 21 → Entity 50 ─────────────────────────────
ALTER TABLE shopjoy_2604.pd_prod_opt_item      ALTER COLUMN opt_val_code_id TYPE VARCHAR(50);

-- ── 번들 그룹 ID — DB 21 → Entity 36 (UUID 호환) ─────────────────
ALTER TABLE shopjoy_2604.od_order_item         ALTER COLUMN bundle_group_id TYPE VARCHAR(36);

-- ── 담당자 컬럼 — DB 16 → Entity 20 ──────────────────────────────
ALTER TABLE shopjoy_2604.pdh_prod_sku_chg_hist    ALTER COLUMN chg_by      TYPE VARCHAR(20);
ALTER TABLE shopjoy_2604.pdh_prod_sku_price_hist  ALTER COLUMN chg_by      TYPE VARCHAR(20);
ALTER TABLE shopjoy_2604.pdh_prod_sku_stock_hist  ALTER COLUMN chg_by      TYPE VARCHAR(20);
ALTER TABLE shopjoy_2604.st_recon                 ALTER COLUMN resolved_by TYPE VARCHAR(20);
ALTER TABLE shopjoy_2604.st_settle_close          ALTER COLUMN close_by    TYPE VARCHAR(20);
ALTER TABLE shopjoy_2604.st_settle_pay            ALTER COLUMN pay_by      TYPE VARCHAR(20);

-- ── zz_sample0 — Entity 기준 정렬 (샘플) ─────────────────────────
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN sample0_id   TYPE VARCHAR(21);
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN sample_value TYPE VARCHAR(100);
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN reg_by       TYPE VARCHAR(30);
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN upd_by       TYPE VARCHAR(30);

-- zz_sample0.sample_desc: TEXT → VARCHAR (Entity가 String + length 미지정 = varchar(255))
-- 길이 제한이 부담스러우면 Entity 측에 columnDefinition="TEXT" 를 추가하는 것이 더 안전하지만,
-- 현재 Entity 기준대로라면 VARCHAR(500) 정도 여유로 설정.
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN sample_desc TYPE VARCHAR(500);

-- zz_sample0.use_yn: CHAR(1)/character → VARCHAR(1)
ALTER TABLE shopjoy_2604.zz_sample0  ALTER COLUMN use_yn TYPE VARCHAR(1);
