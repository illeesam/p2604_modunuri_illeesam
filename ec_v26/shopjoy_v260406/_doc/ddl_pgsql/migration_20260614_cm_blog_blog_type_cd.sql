-- ============================================================================
-- 마이그레이션: cm_blog.blog_type_cd 컬럼 추가
--
-- 목적: BO 뉴스&블로그 관리 — 게시글을 뉴스(NEWS) / 블로그(BLOG) 로 구분
-- 대상: shopjoy_2604.cm_blog
-- 일자: 2026-06-14
--
-- 변경:
--   - 컬럼 추가: blog_type_cd VARCHAR(20) DEFAULT 'BLOG' (게시글 구분 코드)
--   - 기존 행은 전부 'BLOG' 로 백필
-- ============================================================================

BEGIN;

-- 1) 신규 컬럼 추가 (기본값 BLOG)
ALTER TABLE shopjoy_2604.cm_blog ADD COLUMN IF NOT EXISTS blog_type_cd VARCHAR(20) DEFAULT 'BLOG';

-- 2) 기존 행 백필 (NULL → BLOG)
UPDATE shopjoy_2604.cm_blog SET blog_type_cd = 'BLOG' WHERE blog_type_cd IS NULL;

-- 3) 컬럼 코멘트
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_type_cd IS '게시글 구분 코드 (NEWS=뉴스 / BLOG=블로그)';

COMMIT;

-- 검증 쿼리
-- SELECT column_name, data_type, character_maximum_length, column_default FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name = 'cm_blog'
--    AND column_name = 'blog_type_cd';
-- SELECT blog_type_cd, COUNT(*) FROM shopjoy_2604.cm_blog GROUP BY blog_type_cd;
