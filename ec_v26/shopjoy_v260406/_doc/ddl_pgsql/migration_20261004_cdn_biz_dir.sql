-- ═══════════════════════════════════════════════════════════════════════════
--  CDN 첨부 업무 폴더 목록 = 공통코드 CDN_BIZ_CD  (2026-10-04, run_all_20261004.py 16단계 · 배포 "전")
--
--  새 CDN 폴더 구조(사용자 승인)
--     cdn/_common/design/…                                모든 사이트 공용
--     cdn/_common/attach/etc/yyyy/mm/dd/                  사이트를 알 수 없는 첨부
--     cdn/SI26/<사이트ID>_<모듈>/design/{logo,banner,slider,icon,…}/   디자인 파일(뜻 있는 이름, 덮어쓰기 가능)
--     cdn/SI26/<사이트ID>_<모듈>/attach/<업무>/yyyy/mm/dd/             첨부(시스템 ID 파일명, 덮어쓰지 않음)
--     cdn/SI26/<사이트ID>_<모듈>/private/ · temp/                      비공개 첨부 · 저장 전 임시(규칙만)
--
--  <업무> 자리에 올 수 있는 값이 이 코드 그룹이다(정해진 목록만). 코드값 = 폴더 이름(소문자).
--  실제 폴더 이름을 정하는 것은 서버 상수다 — ecBeBo CdnBizDir(enum) · ecBeCdn CfStorageService.BIZ_DIRS.
--  이 코드는 화면 표시·문서용이며, 업무를 늘릴 때는 서버 상수와 이 코드를 같이 고친다.
--  code_opt1 = 그 업무 폴더로 가는 옛 업무 구분 값(화면이 보내는 businessCode) 예시 — 서버가 낱말로 대응한다.
--
--  이름: 기존 규칙(코드그룹 = 대문자_CD — MODULE_CD · TRADE_METHOD_CD · MEET_TYPE_CD)에 맞춰 CDN_BIZ_CD.
--        (…_DIR_CD 는 이미 "방향" 뜻으로 쓰인다 — PAY_DIR_CD · ETC_ADJ_DIR_CD — 그래서 DIR 을 넣지 않았다)
--  ID  : 그룹 CG261004400001, 코드 CD261004400001~09 (2026-10-04 마이그레이션의 400 번대 — 100 MODULE_CD, 200 모듈 전용, 300 당무마켓)
--
--  재실행 안전(NOT EXISTS). 컬럼·테이블 변경 없음 — 옛 백엔드에 영향 없다. 되돌리기: 맨 아래 주석.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) 코드 그룹
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261004400001', 'CDN_BIZ_CD', 'CDN업무폴더', 'sy.attach.cdn_biz',
       'CDN 첨부 업무 폴더 — cdn/SI26/<사이트ID>_<모듈>/attach/<업무>/yyyy/mm/dd 의 <업무>. 정해진 목록만 쓴다(서버 상수 ecBeBo CdnBizDir · ecBeCdn BIZ_DIRS 와 같아야 한다)',
       'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'CDN_BIZ_CD')
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261004400001');

-- 2) 코드 9개
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_opt1, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, v.code_opt1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004400001', 'prod',    '상품',        1, '상품 이미지·상품 설명 (pd_prod_img, pd_prod_content). 샘플 상품 이미지는 attach/prod/_sample', 'PROD_IMG,PROD_CONTENT'),
        ('CD261004400002', 'review',  '상품평',      2, '상품평 사진·동영상 (pd_review)',                         'REVIEW'),
        ('CD261004400003', 'qna',     '상품문의',    3, '상품 문의 첨부 (pd_prod_qna)',                           'PROD_QNA'),
        ('CD261004400004', 'board',   '게시판',      4, '게시판·공지·FAQ·블로그 (cm_bbs, sy_notice, cm_faq, cm_blog)', 'BBS_ATTACH,NOTICE_ATTACH,FAQ_ANSWER_ATTACH'),
        ('CD261004400005', 'chat',    '채팅',        5, '채팅 사진·파일 (cm_chatt_msg)',                          'chat'),
        ('CD261004400006', 'member',  '회원프로필',  6, '회원·사용자 프로필 사진 (mb_member, sy_user)',           'USER_PROFILE,MEMBER_PROFILE_IMG'),
        ('CD261004400007', 'contact', '문의접수',    7, '문의·접수 첨부 (sy_contact)',                            'CONTACT_CONTENT_ATTACH,CONTACT_ANSWER_ATTACH'),
        ('CD261004400008', 'seller',  '판매자',      8, '판매자 서류 (sl_seller, sy_vendor)',                     'SELLER_DOC'),
        ('CD261004400009', 'etc',     '기타',        9, '업무를 알 수 없는 첨부. 사이트를 모르는 업로드는 _common/attach/etc', 'common')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark, code_opt1)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'CDN_BIZ_CD'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- 확인
-- SELECT c.code_value, c.code_label, c.code_opt1 FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id
--  WHERE g.code_grp = 'CDN_BIZ_CD' ORDER BY c.sort_ord;

-- ═══════════════════════════════════════════════════════════════════════════
--  되돌리기
--     DELETE FROM shopjoy_2604.sy_code WHERE code_id BETWEEN 'CD261004400001' AND 'CD261004400009';
--     DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261004400001';
-- ═══════════════════════════════════════════════════════════════════════════
