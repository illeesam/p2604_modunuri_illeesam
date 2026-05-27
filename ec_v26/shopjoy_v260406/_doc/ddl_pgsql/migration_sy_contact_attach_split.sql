-- ============================================================================
-- 마이그레이션: sy_contact.attach_grp_id (단일) → content_attach_grp_id + answer_attach_grp_id (분리)
--
-- 목적: 문의 내용 첨부와 답변 첨부를 별도 첨부그룹으로 분리하여 각각 관리
-- 대상: shopjoy_2604.sy_contact
-- 일자: 2026-05-28
--
-- 변경:
--   - 컬럼 추가: content_attach_grp_id VARCHAR(21) (문의 내용 첨부 그룹 ID)
--   - 컬럼 추가: answer_attach_grp_id  VARCHAR(21) (답변 첨부 그룹 ID)
--   - 데이터 이관: 기존 attach_grp_id → content_attach_grp_id (문의 내용 첨부로 간주)
--   - 컬럼 삭제: attach_grp_id
--
-- 적용 순서:
--   1) 추가
--   2) 데이터 이관
--   3) 삭제
--   4) 코멘트 갱신
-- ============================================================================

BEGIN;

-- 1) 신규 컬럼 추가
ALTER TABLE shopjoy_2604.sy_contact ADD COLUMN IF NOT EXISTS content_attach_grp_id VARCHAR(21);
ALTER TABLE shopjoy_2604.sy_contact ADD COLUMN IF NOT EXISTS answer_attach_grp_id  VARCHAR(21);

-- 2) 데이터 이관 — 기존 attach_grp_id 가 있으면 문의 내용 첨부로 간주
UPDATE shopjoy_2604.sy_contact
   SET content_attach_grp_id = attach_grp_id
 WHERE attach_grp_id IS NOT NULL
   AND content_attach_grp_id IS NULL;

-- 3) 기존 컬럼 삭제
ALTER TABLE shopjoy_2604.sy_contact DROP COLUMN IF EXISTS attach_grp_id;

-- 4) 컬럼 코멘트 갱신
COMMENT ON COLUMN shopjoy_2604.sy_contact.content_attach_grp_id IS '문의 내용 첨부파일그룹ID (sy_attach_grp.attach_grp_id, grp_code=CONTACT_CONTENT_ATTACH)';
COMMENT ON COLUMN shopjoy_2604.sy_contact.answer_attach_grp_id  IS '답변 첨부파일그룹ID (sy_attach_grp.attach_grp_id, grp_code=CONTACT_ANSWER_ATTACH)';

COMMIT;

-- 검증 쿼리
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_contact'
--    AND column_name IN ('content_attach_grp_id', 'answer_attach_grp_id', 'attach_grp_id');
