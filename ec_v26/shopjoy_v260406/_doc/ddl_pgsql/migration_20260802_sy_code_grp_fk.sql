-- migration_20260802_sy_code_grp_fk.sql
-- B안: sy_code.code_grp(text 중복) → code_grp_id(FK → sy_code_grp.code_grp_id) 정규화
-- 실행순서: Step1(누락 grp 삽입) → Step2(컬럼 추가) → Step3(데이터 채우기) → Step4(NOT NULL) → Step5(구 컬럼 삭제) → Step6(FK) → Step7(인덱스)

-- ============================================================
-- Step 1. sy_code_grp 누락 27개 삽입
-- ============================================================
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, site_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date) VALUES
  ('CG000222', '2604010000000001', 'ALLOW_YN',                '허용여부',           NULL, 'Y=허용 / N=불가 구분', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000223', '2604010000000001', 'BLOG_TYPE',               '블로그유형',         NULL, '블로그 콘텐츠 유형 (NEWS/BLOG)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000224', '2604010000000001', 'BOOL_YN',                 'Y/N여부',            NULL, '예(Y)/아니오(N) 일반 구분', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000225', '2604010000000001', 'CHATT_MEMBER_TYPE',       '채팅회원유형',       NULL, '채팅 참여 회원 유형 (MEMBER/ADMIN)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000226', '2604010000000001', 'CHATT_MSG_TYPE',          '채팅메시지유형',     NULL, '채팅 메시지 유형 (TEXT/IMAGE/FILE/REF/SYSTEM)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000227', '2604010000000001', 'COUPON_APPLY',            '쿠폰적용대상',       NULL, '쿠폰 적용 상품 범위 (all/category/product/exclude)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000228', '2604010000000001', 'COUPON_DISC_TYPE',        '쿠폰할인유형',       NULL, '쿠폰 할인 계산 방식 (amount=정액 / percent=정률)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000229', '2604010000000001', 'COUPON_ISSUE_DISP',       '쿠폰발급방식',       NULL, '쿠폰 발급 방식 (auto=자동 / manual=수동 / event=이벤트)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000230', '2604010000000001', 'COUPON_TARGET',           '쿠폰발급대상',       NULL, '쿠폰 발급 대상 회원 (all/newMember/subscribe/purchase)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000231', '2604010000000001', 'COUPON_USE_LIMIT',        '쿠폰사용횟수',       NULL, '쿠폰 사용 횟수 제한 (unlimited/once/month)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000232', '2604010000000001', 'DELIVERY_STATUS',         '배송상태',           NULL, '배송 진행 상태 (PREPARING/SHIPPED/ARRIVED/RETURNED)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000233', '2604010000000001', 'DISCNT_VAL_TYPE',         '할인값유형',         NULL, '할인 값 계산 유형 (RATE=정률 / AMOUNT=정액)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000234', '2604010000000001', 'DISCOUNT_TYPE',           '할인유형',           NULL, '할인 유형 (percent/fixed/buyX_getY)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000235', '2604010000000001', 'DISP_UI_TYPE',            '전시UI유형',         NULL, '전시 UI 페이지 유형 (landing/brand/category/promotion)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000236', '2604010000000001', 'DISP_WIDGET_TYPE',        '전시위젯유형',       NULL, '전시 위젯 유형 27종 (image_banner/product_slider/...)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000237', '2604010000000001', 'EVENT_TARGET',            '이벤트대상',         NULL, '이벤트 참여 대상 회원 (ALL/NEW_MEMBER/VIP)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000238', '2604010000000001', 'LAYOUT_TYPE',             '레이아웃유형',       NULL, '패널 레이아웃 유형 (grid/flex)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000239', '2604010000000001', 'NOTICE_YN',               '공지여부',           NULL, '공지(Y)/일반(N) 구분', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000240', '2604010000000001', 'OPEN_YN',                 '공개여부',           NULL, '공개(Y)/비공개(N) 구분', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000241', '2604010000000001', 'ORDER_ITEM_DISCNT_TYPE',  '주문상품할인유형',   NULL, '주문 상품 할인 유형 (ITEM_COUPON/ITEM_DISCNT)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000242', '2604010000000001', 'PLAN_CATEGORY',           '기획전카테고리',     NULL, '기획전 분류 카테고리 (FASHION/SPORTS/STYLING/STAFF/LUXURY)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000243', '2604010000000001', 'PLAN_DISP_STATUS',        '기획전전시상태',     NULL, '기획전 전시 상태 (ACTIVE/SCHEDULED/INACTIVE/ENDED)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000244', '2604010000000001', 'PROD_QNA_TYPE',           '상품문의유형',       NULL, '상품 Q&A 문의 유형 (PROD)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000245', '2604010000000001', 'REVIEW_RATING',           '리뷰평점',           NULL, '리뷰 별점 평점 (1~5)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000246', '2604010000000001', 'REVIEW_WRITER_TYPE',      '리뷰작성자유형',     NULL, '리뷰 작성자 유형 (ADMIN)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000247', '2604010000000001', 'STOCK_FILTER',            '재고필터',           NULL, '재고 유무 필터 (in=재고있음 / out=품절)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP),
  ('CG000248', '2604010000000001', 'VENDOR_BRAND_CONTRACT',   '업체브랜드계약유형', NULL, '업체-브랜드 계약 유형 (CONSIGN=위탁)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP);

-- ============================================================
-- Step 2. sy_code에 code_grp_id 컬럼 추가 (nullable로 시작)
-- ============================================================
ALTER TABLE shopjoy_2604.sy_code ADD COLUMN code_grp_id VARCHAR(50);

-- ============================================================
-- Step 3. 기존 code_grp 값 → code_grp_id 채우기 (sy_code_grp 조인)
-- ============================================================
UPDATE shopjoy_2604.sy_code sc
SET code_grp_id = scg.code_grp_id
FROM shopjoy_2604.sy_code_grp scg
WHERE scg.code_grp = sc.code_grp;

-- 혹시 매핑 안 된 행이 있으면 확인
-- SELECT code_id, code_grp FROM shopjoy_2604.sy_code WHERE code_grp_id IS NULL;

-- ============================================================
-- Step 4. NOT NULL 적용
-- ============================================================
ALTER TABLE shopjoy_2604.sy_code ALTER COLUMN code_grp_id SET NOT NULL;

-- ============================================================
-- Step 5. 구 code_grp 컬럼 삭제
-- ============================================================
ALTER TABLE shopjoy_2604.sy_code DROP COLUMN code_grp;

-- ============================================================
-- Step 6. FK 제약 추가
-- ============================================================
ALTER TABLE shopjoy_2604.sy_code
  ADD CONSTRAINT fk_sy_code_code_grp_id
  FOREIGN KEY (code_grp_id) REFERENCES shopjoy_2604.sy_code_grp(code_grp_id);

-- ============================================================
-- Step 7. 인덱스 추가 (코드그룹별 조회 성능)
-- ============================================================
CREATE INDEX idx_sy_code_code_grp_id ON shopjoy_2604.sy_code(code_grp_id);

-- ============================================================
-- 검증 쿼리
-- ============================================================
-- SELECT COUNT(*) FROM shopjoy_2604.sy_code;           -- 전체 행 수 확인
-- SELECT sc.code_grp_id, scg.code_grp, sc.code_value, sc.code_label
--   FROM shopjoy_2604.sy_code sc JOIN shopjoy_2604.sy_code_grp scg ON sc.code_grp_id = scg.code_grp_id
--   LIMIT 10;
