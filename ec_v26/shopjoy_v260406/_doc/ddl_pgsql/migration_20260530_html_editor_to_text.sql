-- ════════════════════════════════════════════════════════════════════════════
-- HTML 에디터 바인딩 컬럼 VARCHAR → TEXT 마이그레이션
-- 작성일: 2026-05-30
-- 사유: 프론트 BaseHtmlEditor (Toast UI) 출력 HTML 이 짧은 VARCHAR 범위를 쉽게 초과
--      이미지 base64 임베드 / 풍부한 마크업 입력 시 "value too long for type
--      character varying(N)" 에러 발생.
-- ════════════════════════════════════════════════════════════════════════════

-- sy_vendor.vendor_remark  VARCHAR(500) → TEXT
ALTER TABLE shopjoy_2604.sy_vendor
    ALTER COLUMN vendor_remark TYPE TEXT;
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_remark IS '비고 (HTML 에디터)';

-- od_dliv.dliv_memo        VARCHAR(300) → TEXT
ALTER TABLE shopjoy_2604.od_dliv
    ALTER COLUMN dliv_memo TYPE TEXT;
COMMENT ON COLUMN shopjoy_2604.od_dliv.dliv_memo IS '메모 (HTML 에디터)';

-- 검증
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'shopjoy_2604'
  AND ((table_name='sy_vendor' AND column_name='vendor_remark')
    OR (table_name='od_dliv'   AND column_name='dliv_memo'))
ORDER BY table_name, column_name;
