-- ============================================================
-- 사용자 대시보드 공유설정 단순화 (2026-07-26 #2)
--  변경: 공유범위 4단(ALL/DEPT/USER/ME) → 공개여부 2단(PUBLIC/PRIVATE) + 공유대상(부서·사용자 다중)
--    - 소유자는 항상 접근 (ME 옵션 제거 — PRIVATE + 대상 0건 = 나만 보기)
--    - share_dept_id 를 ^구분 다중값으로 확장 (VARCHAR 21 → 2000)
--  레거시 데이터 변환:
--    ME   → PRIVATE (대상 없음 = 나만)
--    ALL  → PUBLIC
--    DEPT → PRIVATE + share_dept_id 를 ^구분 형식으로 감쌈
--    USER → PRIVATE (share_user_ids 는 이미 ^구분)
-- ============================================================

ALTER TABLE shopjoy_2604.cm_dashboard ALTER COLUMN share_dept_id TYPE VARCHAR(2000);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_scope_cd IS '공개여부 — PUBLIC:전체공개 / PRIVATE:비공개(소유자+공유대상) (NULL=PRIVATE)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_dept_id  IS '공유 부서ID 목록 (^구분 예: ^DEPT001^DEPT002^)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_user_ids IS '공유 사용자ID 목록 (^구분 예: ^US001^US002^)';

UPDATE shopjoy_2604.cm_dashboard
   SET share_dept_id = '^' || share_dept_id || '^'
 WHERE share_dept_id IS NOT NULL AND share_dept_id <> '' AND share_dept_id NOT LIKE '^%';

UPDATE shopjoy_2604.cm_dashboard SET share_scope_cd = 'PUBLIC'  WHERE share_scope_cd = 'ALL';
UPDATE shopjoy_2604.cm_dashboard SET share_scope_cd = 'PRIVATE' WHERE share_scope_cd IN ('ME','DEPT','USER');
UPDATE shopjoy_2604.cm_dashboard SET share_scope_cd = 'PRIVATE' WHERE owner_user_id IS NOT NULL AND share_scope_cd IS NULL;
