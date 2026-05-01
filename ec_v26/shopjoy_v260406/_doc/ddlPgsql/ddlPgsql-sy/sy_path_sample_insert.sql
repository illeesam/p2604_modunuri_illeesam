-- ============================================================
-- sy_path 샘플 데이터 (재설계)
-- biz_cd 기준: 각 업무에서 path-pick-modal에 넘기는 값과 1:1 매핑
--
-- biz_cd 목록 (실제 사용 파일 기준):
--   ec_disp_ui        DpDispUiDtl.js
--   ec_disp_area      DpDispAreaDtl.js
--   ec_disp_panel     DpDispPanelDtl.js
--   ec_disp_widget    DpDispWidgetDtl.js
--   ec_disp_widget_lib DpDispWidgetLibDtl.js
--   sy_brand          SyBrandMng.js
--   sy_code_grp       SyCodeMng.js
--   sy_vendor         SyVendorMng.js
--   sy_template       SyTemplateMng.js
--   sy_alarm          SyAlarmMng.js
--   sy_batch          SyBatchMng.js
--   sy_role           SyRoleMng.js
--   sy_site           SySiteMng.js
--   sy_biz            SyBizMng.js
--   sy_bbm            SyBbmMng.js / SyBbmDtl.js
--
-- 1레벨 = 각 업무에서 실제로 쓰는 최상위 분류
-- ============================================================
-- ※ 실행: SET search_path TO shopjoy_2604;
-- ============================================================

SET search_path TO shopjoy_2604;

TRUNCATE TABLE sy_path RESTART IDENTITY CASCADE;

-- ============================================================
-- [1] ec_disp_ui — 전시UI
--     사용처: 전시UI가 어느 채널(FO/BO)에 속하는지
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('ec_disp_ui', NULL, 'FO',     1, 'Y', 'admin', NOW()),  -- 1
  ('ec_disp_ui', NULL, 'BO',     2, 'Y', 'admin', NOW()),  -- 2
  ('ec_disp_ui', NULL, 'MOBILE', 3, 'Y', 'admin', NOW()),  -- 3
  ('ec_disp_ui',    1, '메인',   1, 'Y', 'admin', NOW()),  -- 4
  ('ec_disp_ui',    1, '상품',   2, 'Y', 'admin', NOW()),  -- 5
  ('ec_disp_ui',    1, '이벤트', 3, 'Y', 'admin', NOW()),  -- 6
  ('ec_disp_ui',    2, '대시보드',1, 'Y', 'admin', NOW()), -- 7
  ('ec_disp_ui',    3, 'M메인',  1, 'Y', 'admin', NOW());  -- 8

-- ============================================================
-- [2] ec_disp_area — 전시영역
--     사용처: 영역이 어느 화면/위치에 배치되는지
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('ec_disp_area', NULL, 'FO',     1, 'Y', 'admin', NOW()),  -- 9
  ('ec_disp_area', NULL, 'BO',     2, 'Y', 'admin', NOW()),  -- 10
  ('ec_disp_area', NULL, 'MOBILE', 3, 'Y', 'admin', NOW()),  -- 11
  ('ec_disp_area',    9, '메인',   1, 'Y', 'admin', NOW()),  -- 12
  ('ec_disp_area',    9, '상품',   2, 'Y', 'admin', NOW()),  -- 13
  ('ec_disp_area',    9, '배너',   3, 'Y', 'admin', NOW()),  -- 14
  ('ec_disp_area',   10, '대시보드',1,'Y', 'admin', NOW()),  -- 15
  ('ec_disp_area',   11, 'M메인',  1, 'Y', 'admin', NOW()); -- 16

-- ============================================================
-- [3] ec_disp_panel — 전시패널
--     사용처: 패널이 어느 채널/위치에 속하는지
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('ec_disp_panel', NULL, 'FO',     1, 'Y', 'admin', NOW()),  -- 17
  ('ec_disp_panel', NULL, 'BO',     2, 'Y', 'admin', NOW()),  -- 18
  ('ec_disp_panel', NULL, 'MOBILE', 3, 'Y', 'admin', NOW()),  -- 19
  ('ec_disp_panel',   17, '메인',   1, 'Y', 'admin', NOW()),  -- 20
  ('ec_disp_panel',   17, '상품',   2, 'Y', 'admin', NOW()),  -- 21
  ('ec_disp_panel',   17, '배너',   3, 'Y', 'admin', NOW()),  -- 22
  ('ec_disp_panel',   18, '대시보드',1,'Y', 'admin', NOW()),  -- 23
  ('ec_disp_panel',   19, 'M메인',  1, 'Y', 'admin', NOW()),  -- 24
  ('ec_disp_panel',   19, 'M배너',  2, 'Y', 'admin', NOW()); -- 25

-- ============================================================
-- [4] ec_disp_widget — 전시위젯
--     사용처: 위젯이 어느 채널/디바이스에 속하는지
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('ec_disp_widget', NULL, 'FO',     1, 'Y', 'admin', NOW()),  -- 26
  ('ec_disp_widget', NULL, 'BO',     2, 'Y', 'admin', NOW()),  -- 27
  ('ec_disp_widget', NULL, 'MOBILE', 3, 'Y', 'admin', NOW()),  -- 28
  ('ec_disp_widget',   26, 'PC',     1, 'Y', 'admin', NOW()),  -- 29
  ('ec_disp_widget',   26, '모바일', 2, 'Y', 'admin', NOW()),  -- 30
  ('ec_disp_widget',   26, '배너',   3, 'Y', 'admin', NOW()),  -- 31
  ('ec_disp_widget',   26, '상품',   4, 'Y', 'admin', NOW()),  -- 32
  ('ec_disp_widget',   27, '관리자전용',1,'Y','admin', NOW()), -- 33
  ('ec_disp_widget',   28, 'MPC',    1, 'Y', 'admin', NOW()),  -- 34
  ('ec_disp_widget',   28, 'M모바일',2, 'Y', 'admin', NOW()); -- 35

-- ============================================================
-- [5] ec_disp_widget_lib — 위젯라이브러리
--     사용처: 라이브러리 유형별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('ec_disp_widget_lib', NULL, '공통',    1, 'Y', 'admin', NOW()),  -- 36
  ('ec_disp_widget_lib', NULL, '상품',    2, 'Y', 'admin', NOW()),  -- 37
  ('ec_disp_widget_lib', NULL, '프로모션',3, 'Y', 'admin', NOW()),  -- 38
  ('ec_disp_widget_lib', NULL, '레이아웃',4, 'Y', 'admin', NOW()),  -- 39
  ('ec_disp_widget_lib',   36, '배너류',  1, 'Y', 'admin', NOW()),  -- 40
  ('ec_disp_widget_lib',   36, '텍스트류',2, 'Y', 'admin', NOW()),  -- 41
  ('ec_disp_widget_lib',   37, '슬라이더',1, 'Y', 'admin', NOW()),  -- 42
  ('ec_disp_widget_lib',   37, '그리드',  2, 'Y', 'admin', NOW()),  -- 43
  ('ec_disp_widget_lib',   38, '쿠폰',    1, 'Y', 'admin', NOW()),  -- 44
  ('ec_disp_widget_lib',   38, '이벤트',  2, 'Y', 'admin', NOW()); -- 45

-- ============================================================
-- [6] sy_brand — 브랜드
--     사용처: 브랜드 업종/카테고리 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_brand', NULL, '패션',    1, 'Y', 'admin', NOW()),  -- 46
  ('sy_brand', NULL, '라이프',  2, 'Y', 'admin', NOW()),  -- 47
  ('sy_brand', NULL, '식품',    3, 'Y', 'admin', NOW()),  -- 48
  ('sy_brand', NULL, '뷰티',    4, 'Y', 'admin', NOW()),  -- 49
  ('sy_brand', NULL, '스포츠',  5, 'Y', 'admin', NOW()),  -- 50
  ('sy_brand',   46, '의류',    1, 'Y', 'admin', NOW()),  -- 51
  ('sy_brand',   46, '잡화',    2, 'Y', 'admin', NOW()),  -- 52
  ('sy_brand',   47, '인테리어',1, 'Y', 'admin', NOW()),  -- 53
  ('sy_brand',   47, '주방',    2, 'Y', 'admin', NOW()),  -- 54
  ('sy_brand',   48, '건강식품',1, 'Y', 'admin', NOW()),  -- 55
  ('sy_brand',   48, '신선식품',2, 'Y', 'admin', NOW()); -- 56

-- ============================================================
-- [7] sy_code_grp — 공통코드그룹
--     사용처: 코드 그룹의 도메인 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_code_grp', NULL, '시스템',  1, 'Y', 'admin', NOW()),  -- 57
  ('sy_code_grp', NULL, '상거래',  2, 'Y', 'admin', NOW()),  -- 58
  ('sy_code_grp', NULL, '전시',    3, 'Y', 'admin', NOW()),  -- 59
  ('sy_code_grp', NULL, '정산',    4, 'Y', 'admin', NOW()),  -- 60
  ('sy_code_grp',   57, '사용자',  1, 'Y', 'admin', NOW()),  -- 61
  ('sy_code_grp',   57, '권한',    2, 'Y', 'admin', NOW()),  -- 62
  ('sy_code_grp',   58, '주문',    1, 'Y', 'admin', NOW()),  -- 63
  ('sy_code_grp',   58, '상품',    2, 'Y', 'admin', NOW()),  -- 64
  ('sy_code_grp',   58, '배송',    3, 'Y', 'admin', NOW()),  -- 65
  ('sy_code_grp',   58, '쿠폰캐쉬',4, 'Y', 'admin', NOW()),  -- 66
  ('sy_code_grp',   59, 'UI영역',  1, 'Y', 'admin', NOW()),  -- 67
  ('sy_code_grp',   60, '정산처리',1, 'Y', 'admin', NOW()); -- 68

-- ============================================================
-- [8] sy_vendor — 업체(벤더)
--     사용처: 업체 업종 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_vendor', NULL, '패션',    1, 'Y', 'admin', NOW()),  -- 69
  ('sy_vendor', NULL, '라이프',  2, 'Y', 'admin', NOW()),  -- 70
  ('sy_vendor', NULL, '식품',    3, 'Y', 'admin', NOW()),  -- 71
  ('sy_vendor', NULL, '뷰티',    4, 'Y', 'admin', NOW()),  -- 72
  ('sy_vendor', NULL, '스포츠',  5, 'Y', 'admin', NOW()),  -- 73
  ('sy_vendor',   69, '의류',    1, 'Y', 'admin', NOW()),  -- 74
  ('sy_vendor',   69, '잡화',    2, 'Y', 'admin', NOW()),  -- 75
  ('sy_vendor',   70, '인테리어',1, 'Y', 'admin', NOW()),  -- 76
  ('sy_vendor',   70, '주방',    2, 'Y', 'admin', NOW()),  -- 77
  ('sy_vendor',   71, '건강식품',1, 'Y', 'admin', NOW()),  -- 78
  ('sy_vendor',   71, '신선식품',2, 'Y', 'admin', NOW()); -- 79

-- ============================================================
-- [9] sy_template — 발송 템플릿
--     사용처: 템플릿 채널/용도별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_template', NULL, '이메일',  1, 'Y', 'admin', NOW()),  -- 80
  ('sy_template', NULL, 'SMS',     2, 'Y', 'admin', NOW()),  -- 81
  ('sy_template', NULL, '카카오',  3, 'Y', 'admin', NOW()),  -- 82
  ('sy_template', NULL, '푸시',    4, 'Y', 'admin', NOW()),  -- 83
  ('sy_template',   80, '회원가입',1, 'Y', 'admin', NOW()),  -- 84
  ('sy_template',   80, '주문',    2, 'Y', 'admin', NOW()),  -- 85
  ('sy_template',   80, '배송',    3, 'Y', 'admin', NOW()),  -- 86
  ('sy_template',   80, '클레임',  4, 'Y', 'admin', NOW()),  -- 87
  ('sy_template',   81, '인증',    1, 'Y', 'admin', NOW()),  -- 88
  ('sy_template',   81, '주문',    2, 'Y', 'admin', NOW()),  -- 89
  ('sy_template',   82, '알림톡',  1, 'Y', 'admin', NOW()),  -- 90
  ('sy_template',   82, '친구톡',  2, 'Y', 'admin', NOW()); -- 91

-- ============================================================
-- [10] sy_alarm — 알림
--      사용처: 알림 수신 대상/유형별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_alarm', NULL, '회원',    1, 'Y', 'admin', NOW()),  -- 92
  ('sy_alarm', NULL, '관리자',  2, 'Y', 'admin', NOW()),  -- 93
  ('sy_alarm', NULL, '업체',    3, 'Y', 'admin', NOW()),  -- 94
  ('sy_alarm',   92, '주문',    1, 'Y', 'admin', NOW()),  -- 95
  ('sy_alarm',   92, '쿠폰',    2, 'Y', 'admin', NOW()),  -- 96
  ('sy_alarm',   93, '주문접수',1, 'Y', 'admin', NOW()),  -- 97
  ('sy_alarm',   93, '클레임',  2, 'Y', 'admin', NOW()),  -- 98
  ('sy_alarm',   94, '정산',    1, 'Y', 'admin', NOW()),  -- 99
  ('sy_alarm',   94, '상품',    2, 'Y', 'admin', NOW()); -- 100

-- ============================================================
-- [11] sy_batch — 배치
--      사용처: 배치 주기/업무별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_batch', NULL, '일간',   1, 'Y', 'admin', NOW()),  -- 101
  ('sy_batch', NULL, '주간',   2, 'Y', 'admin', NOW()),  -- 102
  ('sy_batch', NULL, '월간',   3, 'Y', 'admin', NOW()),  -- 103
  ('sy_batch', NULL, '실시간', 4, 'Y', 'admin', NOW()),  -- 104
  ('sy_batch',  101, '정산',   1, 'Y', 'admin', NOW()),  -- 105
  ('sy_batch',  101, '주문',   2, 'Y', 'admin', NOW()),  -- 106
  ('sy_batch',  101, '배송',   3, 'Y', 'admin', NOW()),  -- 107
  ('sy_batch',  102, '통계',   1, 'Y', 'admin', NOW()),  -- 108
  ('sy_batch',  103, '정산마감',1,'Y', 'admin', NOW()),  -- 109
  ('sy_batch',  103, '회원등급',2,'Y', 'admin', NOW()),  -- 110
  ('sy_batch',  104, '알림',   1, 'Y', 'admin', NOW()); -- 111

-- ============================================================
-- [12] sy_role — 역할
--      사용처: 역할 성격별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_role', NULL, '관리자',    1, 'Y', 'admin', NOW()),  -- 112
  ('sy_role', NULL, '업체',      2, 'Y', 'admin', NOW()),  -- 113
  ('sy_role', NULL, '시스템',    3, 'Y', 'admin', NOW()),  -- 114
  ('sy_role',  112, '전체관리',  1, 'Y', 'admin', NOW()),  -- 115
  ('sy_role',  112, '상품담당',  2, 'Y', 'admin', NOW()),  -- 116
  ('sy_role',  112, 'CS담당',    3, 'Y', 'admin', NOW()),  -- 117
  ('sy_role',  113, '업체관리자',1, 'Y', 'admin', NOW()),  -- 118
  ('sy_role',  113, '업체직원',  2, 'Y', 'admin', NOW()),  -- 119
  ('sy_role',  114, '슈퍼관리자',1, 'Y', 'admin', NOW()); -- 120

-- ============================================================
-- [13] sy_site — 사이트
--      사용처: 사이트 채널/환경별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_site', NULL, '국내몰',  1, 'Y', 'admin', NOW()),  -- 121
  ('sy_site', NULL, '해외몰',  2, 'Y', 'admin', NOW()),  -- 122
  ('sy_site', NULL, '모바일',  3, 'Y', 'admin', NOW()),  -- 123
  ('sy_site',  121, 'PC',     1, 'Y', 'admin', NOW()),  -- 124
  ('sy_site',  121, '앱',     2, 'Y', 'admin', NOW()),  -- 125
  ('sy_site',  122, '영문',   1, 'Y', 'admin', NOW()),  -- 126
  ('sy_site',  123, 'iOS',    1, 'Y', 'admin', NOW()),  -- 127
  ('sy_site',  123, 'Android',2, 'Y', 'admin', NOW()); -- 128

-- ============================================================
-- [14] sy_biz — 업무(SyBizMng)
--      사용처: 업무 도메인 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_biz', NULL, '상거래',  1, 'Y', 'admin', NOW()),  -- 129
  ('sy_biz', NULL, '전시',    2, 'Y', 'admin', NOW()),  -- 130
  ('sy_biz', NULL, '정산',    3, 'Y', 'admin', NOW()),  -- 131
  ('sy_biz', NULL, '시스템',  4, 'Y', 'admin', NOW()),  -- 132
  ('sy_biz',  129, '주문',    1, 'Y', 'admin', NOW()),  -- 133
  ('sy_biz',  129, '상품',    2, 'Y', 'admin', NOW()),  -- 134
  ('sy_biz',  129, '회원',    3, 'Y', 'admin', NOW()),  -- 135
  ('sy_biz',  130, 'UI관리',  1, 'Y', 'admin', NOW()),  -- 136
  ('sy_biz',  131, '정산처리',1, 'Y', 'admin', NOW()),  -- 137
  ('sy_biz',  132, '공통코드',1, 'Y', 'admin', NOW()); -- 138

-- ============================================================
-- [15] sy_bbm — BBM/메모
--      사용처: 메모 성격/업무별 분류
-- ============================================================
INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES
  ('sy_bbm', NULL, '공지',    1, 'Y', 'admin', NOW()),  -- 139
  ('sy_bbm', NULL, '업무메모',2, 'Y', 'admin', NOW()),  -- 140
  ('sy_bbm', NULL, '이슈',    3, 'Y', 'admin', NOW()),  -- 141
  ('sy_bbm',  139, '전체공지',1, 'Y', 'admin', NOW()),  -- 142
  ('sy_bbm',  139, '업체공지',2, 'Y', 'admin', NOW()),  -- 143
  ('sy_bbm',  140, '개발',    1, 'Y', 'admin', NOW()),  -- 144
  ('sy_bbm',  140, '운영',    2, 'Y', 'admin', NOW()),  -- 145
  ('sy_bbm',  141, '긴급',    1, 'Y', 'admin', NOW()),  -- 146
  ('sy_bbm',  141, '일반',    2, 'Y', 'admin', NOW()); -- 147

-- ============================================================
-- 결과 확인
-- ============================================================
SELECT biz_cd, COUNT(*) AS cnt
FROM sy_path
GROUP BY biz_cd
ORDER BY biz_cd;
