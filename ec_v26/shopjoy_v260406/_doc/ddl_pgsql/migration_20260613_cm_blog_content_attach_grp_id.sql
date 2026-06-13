-- ============================================================================
-- 마이그레이션: cm_blog.content_attach_grp_id 컬럼 추가
--
-- 목적: FO 고객센터 문의(blog_cate_id=CONTACT) 접수 시 첨부파일 그룹 연결 저장
--       sy_contact.content_attach_grp_id 와 동일 패턴 (grp_code=CONTACT_CONTENT_ATTACH)
-- 대상: shopjoy_2604.cm_blog
-- 일자: 2026-06-13
--
-- 변경:
--   - 컬럼 추가: content_attach_grp_id VARCHAR(21) (내용 첨부파일 그룹 ID)
-- ============================================================================

BEGIN;

-- 1) 신규 컬럼 추가
ALTER TABLE shopjoy_2604.cm_blog ADD COLUMN IF NOT EXISTS content_attach_grp_id VARCHAR(21);

-- 2) 컬럼 코멘트
COMMENT ON COLUMN shopjoy_2604.cm_blog.content_attach_grp_id IS '내용 첨부파일그룹ID (sy_attach_grp.attach_grp_id, 문의글 첨부 grp_code=CONTACT_CONTENT_ATTACH)';

COMMIT;

-- 검증 쿼리
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name = 'cm_blog'
--    AND column_name = 'content_attach_grp_id';
