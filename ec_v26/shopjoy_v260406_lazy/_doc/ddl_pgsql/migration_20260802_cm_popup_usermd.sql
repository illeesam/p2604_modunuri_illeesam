-- migration_20260802_normalization_fixes.sql
-- 정규화 감사 후 발견된 데이터 불일치 수정 (2026-08-02)
-- ============================================================

-- ① st_settle_adj.aprv_status_cd 한국어 값 → 영문 표준화
--    '대기' → 'WAITING' (5건)
UPDATE shopjoy_2604.st_settle_adj SET aprv_status_cd = 'WAITING' WHERE aprv_status_cd = '대기';

-- ② sy_notice.notice_type_cd 빈 문자열 → NULL 정규화
UPDATE shopjoy_2604.sy_notice SET notice_type_cd = NULL WHERE notice_type_cd = '';

-- ③ APRV_STATUS 코드그룹 신설 (결재처리상태 — st_settle_adj.aprv_status_cd)
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, site_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date)
VALUES ('CG000249', '2604010000000001', 'APRV_STATUS', '결재처리상태', NULL, '결재 처리 상태 (WAITING/APPROVED/REJECTED)', 'Y', 'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (code_grp_id) DO NOTHING;

INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_grp_id, code_value, code_label, sort_ord, use_yn, code_opt1, reg_by, reg_date, upd_by, upd_date) VALUES
  ('2608021105098943', '2604010000000001', 'APRV_STATUS', 'CG000249', 'WAITING',  '대기', 1, 'Y', '#FFA500', 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP),
  ('2608021105105073', '2604010000000001', 'APRV_STATUS', 'CG000249', 'APPROVED', '승인', 2, 'Y', '#28a745', 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP),
  ('2608021105119693', '2604010000000001', 'APRV_STATUS', 'CG000249', 'REJECTED', '반려', 3, 'Y', '#dc3545', 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (code_id) DO NOTHING;

-- ④ sy_code.code_grp → code_grp_id 자동 동기화 트리거
--    (migration_20260802_sy_code_grp_fk.sql 의 B안 이후 적용)
CREATE OR REPLACE FUNCTION shopjoy_2604.fn_sy_code_sync_grp_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code_grp IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.code_grp IS DISTINCT FROM NEW.code_grp) THEN
    SELECT code_grp_id INTO NEW.code_grp_id
    FROM shopjoy_2604.sy_code_grp
    WHERE code_grp = NEW.code_grp
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sy_code_sync_grp_id ON shopjoy_2604.sy_code;
CREATE TRIGGER trg_sy_code_sync_grp_id
BEFORE INSERT OR UPDATE OF code_grp ON shopjoy_2604.sy_code
FOR EACH ROW EXECUTE FUNCTION shopjoy_2604.fn_sy_code_sync_grp_id();

-- ⑤ cm_popup: userMd (담당MD 선택 팝업 — PdProdMng / PmXxxMng 검색조건)
INSERT INTO shopjoy_2604.cm_popup
 (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm, id_field, nm_field,
  parent_field, site_field, order_by, base_where, multi_yn, page_size, modal_width, use_yn, sort_ord, reg_by, reg_date)
VALUES
 ('POP0000000000000020','2604010000000001','userMd','담당MD 선택',1,'SyUser','userId','userNm',
  NULL,NULL,'e.userNm ASC','e.useYn = ''Y''','N',10,'900px','Y',200,'SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_id) DO NOTHING;

INSERT INTO shopjoy_2604.cm_popup_item
 (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
  search_yn, search_type_cd, list_yn, tree_label_yn, col_width, col_align, link_yn, sort_ord, use_yn, reg_by, reg_date)
VALUES
 ('PPI000000000000191','2604010000000001','POP0000000000000020','userNm','이름','TEXT','Y','LIKE','Y','N',NULL,NULL,'Y',10,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000192','2604010000000001','POP0000000000000020','loginId','로그인ID','TEXT','Y','LIKE','Y','N','140px',NULL,'N',20,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000193','2604010000000001','POP0000000000000020','deptNm','부서','TEXT','N','LIKE','Y','N','120px',NULL,'N',30,'Y','SYSTEM',CURRENT_TIMESTAMP),
 ('PPI000000000000194','2604010000000001','POP0000000000000020','userStatusCd','상태','CODE','N','EQ','Y','N','80px','center','N',40,'Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (popup_item_id) DO NOTHING;
