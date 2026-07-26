-- ============================================================================
-- cm_popup_item — 세션 자동값 / 필수 조회조건 (2026-07-26)
--
-- 배경: 직전에 넣은 cm_popup.owner_field 는 "소유자=로그인 사용자" 하나만 표현했다.
--       조건을 항목(cm_popup_item) 단위로 올리면 세션에서 꺼낼 수 있는 값 전부로 확장되고
--       (memberId / userId / vendorId / deptId / siteId …), 조건이 여러 개여도
--       항목 행을 여러 개 두면 되므로 콤마 파싱 같은 게 필요 없다.
--
-- session_cond_field : 비어 있으면 평범한 검색항목. 값이 있으면 그 값을 로그인 정보(AuthPrincipal)
--                 의 속성명으로 보고 서버가 조건을 강제한다.
--                   AND e.{field_nm} = <세션의 {session_cond_field}>
--                 ★ 클라이언트가 같은 이름으로 파라미터를 보내도 무시된다(덮어쓰기 불가).
--                 ★ authId 는 허용하지 않는다 — BO=관리자ID / FO=회원ID 로 값이 갈려
--                   같은 팝업을 양쪽에서 쓰면 조용히 다른 대상을 필터한다.
--                   userId / memberId 로 명시하게 해서 저장 시점에 실수를 막는다.
--
-- required_yn   : 'Y' 면 값이 없으면 조회를 거절한다.
--                 session_cond_field 가 있으면 반드시 'Y' (미로그인 시 조건이 조용히 빠지면
--                 전체 데이터가 노출되므로). 서비스에서도 강제한다.
--
-- 팝업코드 규칙: my{신원}{대상}  — my=세션한정 / 신원=Member·User·Vendor·Dept / 대상=Order…
--                예) myMemberOrder (내 주문) · myVendorOrder (내 업체 주문)
--                그래서 직전에 만든 myOrder → myMemberOrder 로 rename 한다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup_item ADD COLUMN IF NOT EXISTS session_cond_field VARCHAR(30);
ALTER TABLE shopjoy_2604.cm_popup_item ADD COLUMN IF NOT EXISTS required_yn   CHAR(1) DEFAULT 'N';

UPDATE shopjoy_2604.cm_popup_item SET required_yn = 'N' WHERE required_yn IS NULL;

COMMENT ON COLUMN shopjoy_2604.cm_popup_item.session_cond_field IS
  '로그인 정보에서 자동 주입할 속성명 (memberId/userId/vendorId/deptId/siteId/roleId/memberGrade). 비우면 일반 검색항목. 클라이언트 덮어쓰기 불가';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.required_yn IS
  '필수 조회조건 여부 (Y/N). 값 없으면 조회 거절. session_cond_field 지정 시 반드시 Y';

-- ── myOrder → myMemberOrder rename + 소유자 조건을 항목으로 이전 ─────────────
UPDATE shopjoy_2604.cm_popup
   SET popup_code = 'myMemberOrder',
       remark     = '로그인 회원 본인 주문만 (memberId 세션 자동). FO 문의하기의 주문번호 선택에 사용'
 WHERE popup_code = 'myOrder';

INSERT INTO shopjoy_2604.cm_popup_item
  (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, tree_label_yn, link_yn,
   session_cond_field, required_yn, sort_ord, use_yn, remark,
   reg_by, reg_date, upd_by, upd_date)
SELECT 'POI2607260000000105', '2604010000000001', 'PO2607260000000101',
       'memberId', '회원', 'TEXT',
       'N', 'EQ', 'N', 'N', 'N',
       'memberId', 'Y', 1, 'Y', '세션 자동 — 로그인 회원 본인으로 고정',
       'SYSTEM', now(), 'SYSTEM', now()
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = 'POI2607260000000105');

-- ── cm_popup.owner_field 폐기 (기능이 항목으로 이전됨) ──────────────────────
ALTER TABLE shopjoy_2604.cm_popup DROP COLUMN IF EXISTS owner_field;
