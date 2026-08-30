/*
 * Migration: BBS_POST_STATUS code_value 한글 → 영문 변환
 * 작성일: 2026-05-25
 * 영향: sy_code (CD000710~CD000713), cm_bbs.bbs_status_cd 컬럼 데이터
 *
 * 변경 이유:
 *   DB의 cm_bbs.bbs_status_cd 컬럼은 영문(PUBLISH/DRAFT/PRIVATE/DELETED)으로 저장되어 있으나
 *   공통코드 sy_code의 BBS_POST_STATUS code_value 는 한글(게시/임시/비공개/삭제)로 정의되어
 *   화면에서 select 옵션 매칭 실패. 표준에 맞춰 code_value 는 영문으로, code_label 은 한글로 통일.
 *
 * 실행 순서:
 *   1) sy_code 의 code_value UPDATE (한글 → 영문)
 *   2) (cm_bbs 데이터는 이미 영문으로 저장되어 있어 변환 불필요)
 *
 * 롤백:
 *   UPDATE shopjoy_2604.sy_code SET code_value = '게시'   WHERE code_id = 'CD000710';
 *   UPDATE shopjoy_2604.sy_code SET code_value = '임시'   WHERE code_id = 'CD000711';
 *   UPDATE shopjoy_2604.sy_code SET code_value = '비공개' WHERE code_id = 'CD000712';
 *   UPDATE shopjoy_2604.sy_code SET code_value = '삭제'   WHERE code_id = 'CD000713';
 */

-- ===== sy_code: BBS_POST_STATUS code_value 한글 → 영문 =====
UPDATE shopjoy_2604.sy_code SET code_value = 'PUBLISH' WHERE code_id = 'CD000710' AND code_grp = 'BBS_POST_STATUS';
UPDATE shopjoy_2604.sy_code SET code_value = 'DRAFT'   WHERE code_id = 'CD000711' AND code_grp = 'BBS_POST_STATUS';
UPDATE shopjoy_2604.sy_code SET code_value = 'PRIVATE' WHERE code_id = 'CD000712' AND code_grp = 'BBS_POST_STATUS';
UPDATE shopjoy_2604.sy_code SET code_value = 'DELETED' WHERE code_id = 'CD000713' AND code_grp = 'BBS_POST_STATUS';

-- ===== 확인 쿼리 =====
-- SELECT code_id, code_value, code_label, code_remark FROM shopjoy_2604.sy_code WHERE code_grp = 'BBS_POST_STATUS' ORDER BY sort_ord;
