-- ============================================================
-- cm_bltn → cm_blog 테이블명 변경 마이그레이션
-- 생성일: 2026-04-21
-- Schema: shopjoy_2604
-- ============================================================
-- 실행 전 확인:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'shopjoy_2604' AND table_name LIKE 'cm_bltn%';
-- ============================================================

SET search_path TO shopjoy_2604;

-- 의존성 순서: 참조 테이블(tag/file/good/reply) 먼저, 마스터(cate/bltn) 나중에
ALTER TABLE IF EXISTS cm_bltn_tag    RENAME TO cm_blog_tag;
ALTER TABLE IF EXISTS cm_bltn_file   RENAME TO cm_blog_file;
ALTER TABLE IF EXISTS cm_bltn_good   RENAME TO cm_blog_good;
ALTER TABLE IF EXISTS cm_bltn_reply  RENAME TO cm_blog_reply;
ALTER TABLE IF EXISTS cm_bltn_cate   RENAME TO cm_blog_cate;
ALTER TABLE IF EXISTS cm_bltn        RENAME TO cm_blog;

-- 인덱스명 변경 (선택사항 — 기능에 영향 없음)
ALTER INDEX IF EXISTS idx_cm_bltn_cate    RENAME TO idx_cm_blog_cate;
ALTER INDEX IF EXISTS idx_cm_bltn_prod    RENAME TO idx_cm_blog_prod;
ALTER INDEX IF EXISTS idx_cm_bltn_date    RENAME TO idx_cm_blog_date;
ALTER INDEX IF EXISTS idx_cm_bltn_file_bltn RENAME TO idx_cm_blog_file_blog;
ALTER INDEX IF EXISTS idx_cm_bltn_good_bltn RENAME TO idx_cm_blog_good_blog;
ALTER INDEX IF EXISTS idx_cm_bltn_good_member RENAME TO idx_cm_blog_good_user;
ALTER INDEX IF EXISTS idx_cm_bltn_reply_bltn RENAME TO idx_cm_blog_reply_blog;
ALTER INDEX IF EXISTS idx_cm_bltn_reply_parent RENAME TO idx_cm_blog_reply_parent;
ALTER INDEX IF EXISTS idx_cm_bltn_tag_bltn RENAME TO idx_cm_blog_tag_blog;

-- 결과 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'shopjoy_2604'
  AND table_name LIKE 'cm_blog%'
ORDER BY table_name;
