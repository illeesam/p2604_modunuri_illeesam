-- ============================================================================
-- cm_popup — 페이징 사용 여부 컬럼 추가 (2026-07-26)
--
-- 배경: 지금까지는 모든 선택 팝업이 무조건 페이징이었다. 하지만 코드값·사이트처럼
--       건수가 적은 팝업은 페이저 없이 한 화면에 다 보여주는 편이 고르기 쉽다.
--       page_size 만 있고 "페이징을 쓸지" 자체를 정할 수 없어 이 컬럼을 둔다.
--
-- paging_yn = 'N' 이면 팝업이 페이저를 감추고 목록을 한 번에 조회한다
--             (백엔드는 no_paging_max 상한까지만 내려 과다 조회를 막는다)
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS paging_yn VARCHAR(1) DEFAULT 'Y';

UPDATE shopjoy_2604.cm_popup SET paging_yn = 'Y' WHERE paging_yn IS NULL;

COMMENT ON COLUMN shopjoy_2604.cm_popup.paging_yn IS '페이징 사용 여부 Y/N. N 이면 페이저 없이 전체 표시';
COMMENT ON COLUMN shopjoy_2604.cm_popup.page_size IS '페이지 크기(paging_yn=Y). N 이면 최대 표시 건수로 쓰임';

-- 기본은 전 팝업 페이징 사용.
-- (한때 site/brand/bbm/codeGrp 을 '전체 표시'로 뒀으나, 목록이 길어져 스크롤이 생기고
--  다중선택 시 어디까지 봤는지 가늠이 안 돼 되돌렸다. 필요하면 화면에서 개별 해제한다.)
UPDATE shopjoy_2604.cm_popup
   SET paging_yn = 'Y',
       page_size = CASE WHEN page_size IS NULL OR page_size > 100 THEN 10 ELSE page_size END
 WHERE paging_yn IS DISTINCT FROM 'Y';
