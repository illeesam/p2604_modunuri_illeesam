-- ═══════════════════════════════════════════════════════════
--  채팅 — 회원끼리(구매자↔판매자) 실시간 거래 채팅 + 상태 코드 통일 + 안 읽음/미리보기
--  작성일: 2026-10-04
--
--  배경 (사용자 요청 "실시간 채팅관련해서 기능 추가해주면 좋겠어"):
--   지금 채팅(cm_chatt)은 고객↔운영자 상담(CS) 전용이라 방 종류·상대방 개념이 없다.
--   danmoo1(개인간 거래) 상품 상세의 "채팅하기"가 판매자가 아니라 운영자 상담방을 열고 있었다.
--
--   ① cm_chatt.chatt_type_cd  — 방 종류 {CS:고객 상담(운영자), TRADE:회원 간 거래}. 기존 방은 모두 CS.
--   ② cm_chatt.ref_type_cd / ref_id — 거래 대상 (TRADE 방: PRODUCT + pd_prod.prod_id).
--        같은 상품 + 같은 구매자면 같은 방을 다시 쓴다(조회: chatt_type_cd + ref_type_cd + ref_id + 구매자 참여자).
--   ③ cm_chatt.last_msg_text  — 목록 미리보기 캐시(마지막 메시지 앞부분, 사진은 "사진"). 기존 방은 마지막 메시지로 채운다.
--   ④ cm_chatt_member.member_role_cd — 방 안 역할 {CUSTOMER:고객, AGENT:상담원, BUYER:구매자, SELLER:판매자}.
--        기존 행: MEMBER → CUSTOMER, ADMIN → AGENT.
--   ⑤ cm_chatt_member.last_read_msg_id — 이 참여자가 마지막으로 읽은 메시지ID (unread_cnt 는 메시지 올 때 +1, 읽으면 0).
--   ⑥ 상태 코드 통일: 서비스는 PENDING/ACTIVE/CLOSED 를 저장하는데 공통코드(CHATT_STATUS)는 WAITING/ACTIVE/DONE 이라
--        BO 배지·필터가 맞지 않았다 → 공통코드를 PENDING(대기)/ACTIVE(진행중)/CLOSED(종료)로 바꾸고, 혹시 남은 옛 값 데이터도 고친다.
--   ⑦ 공통코드 새 그룹: CHATT_TYPE(방 종류), CHATT_MEMBER_ROLE(참여자 역할).
--   ⑧ 정리: 예전 코드가 참여자명·발신자명에 회원ID 를 넣던 것(ref_nm = ref_id, sender_nm = sender_id)을 회원 이름으로 바꾼다.
--
--  적용 순서: 이 스크립트 → ecBeBo 배포(feature/chat-trade-20261004 병합) → FO·BO 배포.
--   ※ 백엔드를 먼저 배포하면 cm_chatt 조회가 새 컬럼이 없어 실패한다(채팅 전체 오류). 반드시 DB 먼저.
--   ※ 이 스크립트만 먼저 적용해도 지금 운영 중인 백엔드·화면은 그대로 동작한다(컬럼 추가·기본값만).
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 전체 실행 (재실행해도 안전 — IF NOT EXISTS / NOT EXISTS / 조건부 UPDATE)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) cm_chatt — 방 종류·거래 대상·미리보기
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_chatt ADD COLUMN IF NOT EXISTS chatt_type_cd VARCHAR(20) NOT NULL DEFAULT 'CS';
ALTER TABLE shopjoy_2604.cm_chatt ADD COLUMN IF NOT EXISTS ref_type_cd   VARCHAR(20);
ALTER TABLE shopjoy_2604.cm_chatt ADD COLUMN IF NOT EXISTS ref_id        VARCHAR(21);
ALTER TABLE shopjoy_2604.cm_chatt ADD COLUMN IF NOT EXISTS last_msg_text VARCHAR(200);

COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_type_cd IS '채팅방 종류 (코드: CHATT_TYPE — CS:고객 상담 / TRADE:회원 간 거래)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.ref_type_cd   IS '거래 대상 유형 (TRADE 방: PRODUCT)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.ref_id        IS '거래 대상 ID (PRODUCT → pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.last_msg_text IS '마지막 메시지 미리보기 (목록용 캐시, 사진=사진)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd IS '상태 (코드: CHATT_STATUS — PENDING:대기 / ACTIVE:진행중 / CLOSED:종료)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt.chatt_status_cd_before IS '변경 전 상태 (코드: CHATT_STATUS)';

-- 같은 상품·같은 구매자 거래방 재사용 조회용 (chatt_type_cd = 'TRADE' AND ref_type_cd = 'PRODUCT' AND ref_id = :prodId)
CREATE INDEX IF NOT EXISTS cm_chatt_ix03_type_ref ON shopjoy_2604.cm_chatt USING btree (chatt_type_cd, ref_type_cd, ref_id);

-- 혹시 남은 옛 상태 값 정리 (WAITING/OPEN → PENDING, DONE → CLOSED)
UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd = 'PENDING' WHERE chatt_status_cd IN ('WAITING', 'OPEN');
UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd = 'CLOSED'  WHERE chatt_status_cd = 'DONE';
UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd_before = 'PENDING' WHERE chatt_status_cd_before IN ('WAITING', 'OPEN');
UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd_before = 'CLOSED'  WHERE chatt_status_cd_before = 'DONE';

-- 미리보기: 방마다 마지막 메시지로 채운다 (비어 있는 방만)
UPDATE shopjoy_2604.cm_chatt c
   SET last_msg_text = sub.preview
  FROM (
        SELECT DISTINCT ON (m.chatt_id)
               m.chatt_id,
               CASE m.msg_type_cd
                    WHEN 'IMAGE' THEN '사진'
                    WHEN 'FILE'  THEN '파일'
                    ELSE left(btrim(regexp_replace(coalesce(m.msg_text, ''), '\s+', ' ', 'g')), 200)
               END AS preview
          FROM shopjoy_2604.cm_chatt_msg m
         ORDER BY m.chatt_id, m.send_date DESC NULLS LAST, m.chatt_msg_id DESC
       ) sub
 WHERE sub.chatt_id = c.chatt_id
   AND c.last_msg_text IS NULL;

-- ───────────────────────────────────────────────────────────
-- 2) cm_chatt_member — 역할·마지막으로 읽은 메시지
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_chatt_member ADD COLUMN IF NOT EXISTS member_role_cd   VARCHAR(20);
ALTER TABLE shopjoy_2604.cm_chatt_member ADD COLUMN IF NOT EXISTS last_read_msg_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.member_role_cd   IS '방 안 역할 (코드: CHATT_MEMBER_ROLE — CUSTOMER:고객 / AGENT:상담원 / BUYER:구매자 / SELLER:판매자)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.last_read_msg_id IS '마지막으로 읽은 메시지ID (cm_chatt_msg.chatt_msg_id)';
COMMENT ON COLUMN shopjoy_2604.cm_chatt_member.unread_cnt       IS '미읽음 메시지 수 (다른 참여자가 보내면 +1, 읽음 처리하면 0)';

UPDATE shopjoy_2604.cm_chatt_member SET member_role_cd = 'CUSTOMER' WHERE member_role_cd IS NULL AND member_type_cd = 'MEMBER';
UPDATE shopjoy_2604.cm_chatt_member SET member_role_cd = 'AGENT'    WHERE member_role_cd IS NULL AND member_type_cd = 'ADMIN';

-- 구매자로 참여한 방 찾기용 (ref_id = :memberId AND member_role_cd = 'BUYER')
CREATE INDEX IF NOT EXISTS cm_chatt_member_ix04_ref_role ON shopjoy_2604.cm_chatt_member USING btree (ref_id, member_role_cd);

-- 참여자명·발신자명이 회원ID 로 들어간 옛 행을 회원 이름으로
UPDATE shopjoy_2604.cm_chatt_member cm
   SET ref_nm = mb.member_nm
  FROM shopjoy_2604.mb_member mb
 WHERE cm.member_type_cd = 'MEMBER'
   AND cm.ref_id = mb.member_id
   AND (cm.ref_nm IS NULL OR cm.ref_nm = cm.ref_id)
   AND coalesce(mb.member_nm, '') <> '';

UPDATE shopjoy_2604.cm_chatt_msg cmsg
   SET sender_nm = mb.member_nm
  FROM shopjoy_2604.mb_member mb
 WHERE cmsg.sender_type_cd = 'MEMBER'
   AND cmsg.sender_id = mb.member_id
   AND (cmsg.sender_nm IS NULL OR cmsg.sender_nm = cmsg.sender_id)
   AND coalesce(mb.member_nm, '') <> '';

-- ───────────────────────────────────────────────────────────
-- 3) 공통코드 — CHATT_STATUS 값 통일 (WAITING → PENDING, DONE → CLOSED)
--    reg_site_id 는 기존 CHATT_STATUS 그룹 행의 값을 그대로 쓴다(없으면 대표 사이트 SI260001).
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261004000010', 'CHATT_STATUS', '채팅상태', 'cs.chatt', '채팅 상태', 'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CHATT_STATUS');

UPDATE shopjoy_2604.sy_code c
   SET code_value = 'PENDING', code_label = '대기', code_remark = '상담사 응답 대기 (상담 방만)', upd_by = 'MIGRATION_20261004', upd_date = NOW()
  FROM shopjoy_2604.sy_code_grp g
 WHERE g.code_grp_id = c.code_grp_id AND g.code_grp = 'CHATT_STATUS' AND c.code_value = 'WAITING'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = 'PENDING');

UPDATE shopjoy_2604.sy_code c
   SET code_value = 'CLOSED', code_label = '종료', code_remark = '대화 종료', upd_by = 'MIGRATION_20261004', upd_date = NOW()
  FROM shopjoy_2604.sy_code_grp g
 WHERE g.code_grp_id = c.code_grp_id AND g.code_grp = 'CHATT_STATUS' AND c.code_value = 'DONE'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = 'CLOSED');

-- 위에서 바뀌지 않은(값이 아예 없던) 경우를 위해 세 값이 모두 있게 채운다
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, v.code_opt1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004000010', 'PENDING', '대기',   1, '상담사 응답 대기 (상담 방만)', 'badge-orange'),
        ('CD261004000011', 'ACTIVE',  '진행중', 2, '대화 진행 중',                 'badge-green'),
        ('CD261004000012', 'CLOSED',  '종료',   3, '대화 종료',                    'badge-gray')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark, code_opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'CHATT_STATUS'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- ───────────────────────────────────────────────────────────
-- 4) 공통코드 새 그룹 — CHATT_TYPE(방 종류), CHATT_MEMBER_ROLE(참여자 역할)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261004000011', 'CHATT_TYPE', '채팅방종류', 'cs.chatt.type', '채팅방 종류 (CS:고객 상담 / TRADE:회원 간 거래)', 'Y', 'MIGRATION_20261004', NOW(),
       coalesce((SELECT reg_site_id FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CHATT_STATUS' LIMIT 1), 'SI260001')
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CHATT_TYPE');

INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261004000012', 'CHATT_MEMBER_ROLE', '채팅참여자역할', 'cs.chatt.member_role', '채팅방 안 참여자 역할 (CUSTOMER/AGENT/BUYER/SELLER)', 'Y', 'MIGRATION_20261004', NOW(),
       coalesce((SELECT reg_site_id FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CHATT_STATUS' LIMIT 1), 'SI260001')
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CHATT_MEMBER_ROLE');

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, v.code_opt1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004000013', 'CS',    '상담', 1, '고객 ↔ 운영자 상담', 'badge-blue'),
        ('CD261004000014', 'TRADE', '거래', 2, '회원 간 거래 (구매자 ↔ 판매자)', 'badge-orange')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark, code_opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'CHATT_TYPE'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, NULL, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004000015', 'CUSTOMER', '고객',   1, '상담 방의 고객 회원'),
        ('CD261004000016', 'AGENT',    '상담원', 2, '상담 방의 운영자(sy_user)'),
        ('CD261004000017', 'BUYER',    '구매자', 3, '거래 방에서 문의한 회원'),
        ('CD261004000018', 'SELLER',   '판매자', 4, '거래 방의 상품 판매자 회원 (sl_seller_member)')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'CHATT_MEMBER_ROLE'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name, data_type, character_maximum_length, column_default FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name IN ('cm_chatt', 'cm_chatt_member')
--    AND column_name IN ('chatt_type_cd', 'ref_type_cd', 'ref_id', 'last_msg_text', 'member_role_cd', 'last_read_msg_id');   → 6행
-- SELECT chatt_type_cd, chatt_status_cd, count(*) FROM shopjoy_2604.cm_chatt GROUP BY 1, 2 ORDER BY 1, 2;               → CS 만, 상태는 PENDING/ACTIVE/CLOSED 만
-- SELECT member_type_cd, member_role_cd, count(*) FROM shopjoy_2604.cm_chatt_member GROUP BY 1, 2;                         → MEMBER/CUSTOMER, ADMIN/AGENT
-- SELECT g.code_grp, c.code_value, c.code_label FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id
--  WHERE g.code_grp IN ('CHATT_STATUS', 'CHATT_TYPE', 'CHATT_MEMBER_ROLE') ORDER BY 1, c.sort_ord;                         → PENDING/ACTIVE/CLOSED, CS/TRADE, CUSTOMER/AGENT/BUYER/SELLER
--   ※ BO 화면 코드가 예전 값(WAITING/DONE)으로 보이면 BO 의 공통코드 캐시를 새로고침(로그아웃/재로그인 또는 코드관리 화면 저장)한다.
--
-- ═══════════════════════════════════════════════════════════
--  되돌리기 (필요할 때만 — 백엔드를 이전 버전으로 먼저 되돌린 뒤 실행. 거래 방(TRADE)·역할 데이터는 사라진다)
-- ═══════════════════════════════════════════════════════════
-- -- 이전 백엔드는 방 종류를 모르므로, 거래 방이 상담 방으로 재사용되지 않게 먼저 종료해 둔다
-- UPDATE shopjoy_2604.cm_chatt SET chatt_status_cd_before = chatt_status_cd, chatt_status_cd = 'CLOSED', close_date = NOW(), close_reason = '거래 채팅 기능 되돌림'
--  WHERE chatt_type_cd = 'TRADE' AND chatt_status_cd <> 'CLOSED';
-- DELETE FROM shopjoy_2604.sy_code WHERE code_id IN ('CD261004000013','CD261004000014','CD261004000015','CD261004000016','CD261004000017','CD261004000018');
-- DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id IN ('CG261004000011','CG261004000012');
--   (CHATT_STATUS 값 PENDING/CLOSED 는 이전 백엔드도 그 값을 저장하므로 그대로 둔다)
-- DROP INDEX IF EXISTS shopjoy_2604.cm_chatt_member_ix04_ref_role;
-- DROP INDEX IF EXISTS shopjoy_2604.cm_chatt_ix03_type_ref;
-- ALTER TABLE shopjoy_2604.cm_chatt_member DROP COLUMN IF EXISTS last_read_msg_id;
-- ALTER TABLE shopjoy_2604.cm_chatt_member DROP COLUMN IF EXISTS member_role_cd;
-- ALTER TABLE shopjoy_2604.cm_chatt DROP COLUMN IF EXISTS last_msg_text;
-- ALTER TABLE shopjoy_2604.cm_chatt DROP COLUMN IF EXISTS ref_id;
-- ALTER TABLE shopjoy_2604.cm_chatt DROP COLUMN IF EXISTS ref_type_cd;
-- ALTER TABLE shopjoy_2604.cm_chatt DROP COLUMN IF EXISTS chatt_type_cd;
