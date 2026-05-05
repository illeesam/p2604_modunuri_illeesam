-- 상품 옵션 코드 샘플 INSERT
-- 생성일: 2026-05-05
-- ────────────────────────────────────────────────────────────
-- 구조: 하나의 코드그룹 PROD_OPT_CATEGORY 안에서 3단 트리
--   1레벨 (code_level=1, parent_code_value=NULL)  : 옵션 카테고리 select
--   2레벨 (code_level=2, parent=1레벨 code_value)  : 1단/2단 유형 select
--   3레벨 (code_level=3, parent=2레벨 code_value)  : 공통코드ID 드롭다운
--
-- DDL 기준:
--   sy_code_grp : code_grp_id, site_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, upd_by, upd_date
--   sy_code     : code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date
--                 (code_level int4 추가됨)
-- ────────────────────────────────────────────────────────────
-- sy_code_grp :   1건
-- sy_code     : 126건  (CD000900~CD001028 범위 — 일부 ID 누락 포함, 실제 INSERT 라인 수 126)
--   1레벨 (카테고리)  :   9건
--   2레벨 (유형)      :  18건
--   3레벨 (값 프리셋) :  99건

-- ════════════════════════════════════════════════════════════
-- 사전 보정 — sy_code.code_level 컬럼 추가 (없을 때만)
--   ⚠ BEGIN 이전 / 별도 트랜잭션에서 먼저 커밋해야 함.
--      같은 트랜잭션 안에서 ALTER 후 INSERT 시,
--      일부 클라이언트(DBeaver/DataGrip)는 statement parse 시점에
--      컬럼 미존재로 42703을 던질 수 있음.
--   기존 DB에 컬럼이 누락된 경우를 대비. DDL(_doc/ddl_pgsql/sy/sy_code.sql)도 함께 갱신됨.
-- ════════════════════════════════════════════════════════════
ALTER TABLE shopjoy_2604.sy_code
  ADD COLUMN IF NOT EXISTS code_level INTEGER DEFAULT 1;
COMMENT ON COLUMN shopjoy_2604.sy_code.code_level IS '코드 트리 레벨 (1=루트, 2=중간, 3=리프 등). parent_code_value와 함께 다단 트리 구성';

BEGIN;

-- ════════════════════════════════════════════════════════════
-- sy_code_grp (1개)
-- ════════════════════════════════════════════════════════════

INSERT INTO shopjoy_2604.sy_code_grp
  (code_grp_id, site_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, upd_by, upd_date)
VALUES
  ('CG000203', 'SITE000001', 'PROD_OPT_CATEGORY', '상품옵션카테고리', NULL,
   '상품 옵션 카테고리 3단 트리 (1레벨=카테고리, 2레벨=유형, 3레벨=값프리셋)',
   'Y', 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- ════════════════════════════════════════════════════════════
-- 1레벨 — 옵션 카테고리 (9개)   code_level=1, parent_code_value=NULL
-- ════════════════════════════════════════════════════════════

-- code_label 형식: "이름 (자식1-자식2-...)" — 자식(level=2) 라벨을 sort_ord 순으로 조합
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000900', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_CLOTHING',  '의류 (색상-사이즈-소재)',   1, 'Y', NULL, NULL, '상의/하의 공통',    1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000901', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_OUTER',     '아우터 (색상-사이즈)',      2, 'Y', NULL, NULL, '자켓/코트',         1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000902', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_PANTS',     '바지 (색상-허리사이즈)',    3, 'Y', NULL, NULL, '청바지/슬랙스',     1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000903', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_SHOES',     '신발 (신발사이즈-색상)',    4, 'Y', NULL, NULL, NULL,               1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000904', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_BAG',       '가방 (색상-소재)',          5, 'Y', NULL, NULL, NULL,               1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000905', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_COSMETIC',  '화장품 (색상/쉐이드-용량)', 6, 'Y', NULL, NULL, '립/파운데이션 등',  1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000906', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_PERFUME',   '향수 (향-용량)',            7, 'Y', NULL, NULL, '디퓨저/캔들 포함',  1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000907', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_FOOD',      '식품/음료 (맛-용량)',       8, 'Y', NULL, NULL, NULL,               1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000908', 'SITE000001', 'PROD_OPT_CATEGORY', 'CAT_CUSTOM',    '기타/커스텀 (직접입력)',    9, 'Y', NULL, NULL, '직접입력 전용',     1, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- ════════════════════════════════════════════════════════════
-- 2레벨 — 옵션 유형 (15개)   code_level=2, parent=1레벨 code_value
-- ════════════════════════════════════════════════════════════

-- CAT_CLOTHING 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000910', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_COLOR',       '색상',       1, 'Y', 'CAT_CLOTHING', NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000911', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_SIZE',        '사이즈',     2, 'Y', 'CAT_CLOTHING', NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000912', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_MATERIAL',    '소재',       3, 'Y', 'CAT_CLOTHING', NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_OUTER 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000913', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_OUTER_COLOR', '색상',       1, 'Y', 'CAT_OUTER',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000914', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_OUTER_SIZE',  '사이즈',     2, 'Y', 'CAT_OUTER',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_PANTS 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000915', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_PANTS_COLOR', '색상',       1, 'Y', 'CAT_PANTS',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000916', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_WAIST',       '허리사이즈', 2, 'Y', 'CAT_PANTS',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_SHOES 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000917', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_SHOE_SIZE',   '신발사이즈', 1, 'Y', 'CAT_SHOES',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000918', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_SHOE_COLOR',  '색상',       2, 'Y', 'CAT_SHOES',    NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_BAG 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000919', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_BAG_COLOR',     '색상', 1, 'Y', 'CAT_BAG',      NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000920', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_BAG_MATERIAL',  '소재', 2, 'Y', 'CAT_BAG',      NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_COSMETIC 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000921', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_SHADE',        '색상/쉐이드',1,'Y', 'CAT_COSMETIC', NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000922', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_VOLUME',       '용량',       2,'Y', 'CAT_COSMETIC', NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_PERFUME 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000923', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_SCENT',        '향',         1,'Y', 'CAT_PERFUME',  NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000924', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_PERF_VOLUME',  '용량',       2,'Y', 'CAT_PERFUME',  NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_FOOD 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000925', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_FLAVOR',       '맛',         1,'Y', 'CAT_FOOD',     NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000926', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_FOOD_VOLUME',  '용량',       2,'Y', 'CAT_FOOD',     NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
-- CAT_CUSTOM 하위
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000927', 'SITE000001', 'PROD_OPT_CATEGORY', 'TYPE_CUSTOM_TEXT',  '직접입력',   1,'Y', 'CAT_CUSTOM',   NULL, NULL, 2, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- ════════════════════════════════════════════════════════════
-- 3레벨 — 값 프리셋 (72개)   code_level=3, parent=2레벨 code_value
-- ════════════════════════════════════════════════════════════

-- TYPE_COLOR 하위 (16개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000930', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_BLACK',    '블랙',     1,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000931', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_WHITE',    '화이트',   2,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000932', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_IVORY',    '아이보리', 3,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000933', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_GRAY',     '그레이',   4,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000934', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_CHARCOAL', '차콜',     5,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000935', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_NAVY',     '네이비',   6,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000936', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_BLUE',     '블루',     7,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000937', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_KHAKI',    '카키',     8,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000938', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_BEIGE',    '베이지',   9,  'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000939', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_BROWN',    '브라운',   10, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000940', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_RED',      '레드',     11, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000941', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_BURGUNDY', '버건디',   12, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000942', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_PINK',     '핑크',     13, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000943', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_PURPLE',   '퍼플',     14, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000944', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_MUSTARD',  '머스타드', 15, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000945', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_COLOR_ORANGE',   '오렌지',   16, 'Y', 'TYPE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_SIZE 하위 의류 사이즈 (9개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000946', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_XS',   'XS',   1, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000947', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_S',    'S',    2, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000948', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_M',    'M',    3, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000949', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_L',    'L',    4, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000950', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_XL',   'XL',   5, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000951', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_2XL',  '2XL',  6, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000952', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_3XL',  '3XL',  7, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000953', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_4XL',  '4XL',  8, 'Y', 'TYPE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000954', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SIZE_FREE', 'FREE', 9, 'Y', 'TYPE_SIZE', NULL, '프리사이즈', 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_MATERIAL 하위 소재 (8개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000955', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_COTTON',    '면',         1, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000956', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_LINEN',     '린넨',       2, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000957', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_WOOL',      '울',         3, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000958', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_CASHMERE',  '캐시미어',   4, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000959', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_SILK',      '실크',       5, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000960', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_DENIM',     '데님',       6, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000961', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_POLYESTER', '폴리에스터', 7, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000962', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_MAT_FLEECE',    '플리스',     8, 'Y', 'TYPE_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_OUTER_COLOR 하위 (5개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000963', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OCOL_BLACK', '블랙',   1, 'Y', 'TYPE_OUTER_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000964', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OCOL_GRAY',  '그레이', 2, 'Y', 'TYPE_OUTER_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000965', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OCOL_NAVY',  '네이비', 3, 'Y', 'TYPE_OUTER_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000966', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OCOL_CAMEL', '카멜',   4, 'Y', 'TYPE_OUTER_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000967', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OCOL_BEIGE', '베이지', 5, 'Y', 'TYPE_OUTER_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_OUTER_SIZE 하위 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000968', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OSIZ_S',  'S',  1, 'Y', 'TYPE_OUTER_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000969', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OSIZ_M',  'M',  2, 'Y', 'TYPE_OUTER_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000970', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OSIZ_L',  'L',  3, 'Y', 'TYPE_OUTER_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000971', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_OSIZ_XL', 'XL', 4, 'Y', 'TYPE_OUTER_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_PANTS_COLOR 하위 (5개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000972', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PCOL_BLACK', '블랙',   1, 'Y', 'TYPE_PANTS_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000973', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PCOL_NAVY',  '네이비', 2, 'Y', 'TYPE_PANTS_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000974', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PCOL_INDIGO','인디고', 3, 'Y', 'TYPE_PANTS_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000975', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PCOL_GRAY',  '그레이', 4, 'Y', 'TYPE_PANTS_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000976', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PCOL_BEIGE', '베이지', 5, 'Y', 'TYPE_PANTS_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_WAIST 하위 허리사이즈 (6개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000977', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_26', '26인치', 1, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000978', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_28', '28인치', 2, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000979', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_30', '30인치', 3, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000980', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_32', '32인치', 4, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000981', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_34', '34인치', 5, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000982', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_WAIST_36', '36인치', 6, 'Y', 'TYPE_WAIST', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_SHOE_SIZE 하위 신발 사이즈 (6개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000983', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_220', '220mm', 1, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000984', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_230', '230mm', 2, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000985', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_240', '240mm', 3, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000986', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_250', '250mm', 4, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000987', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_260', '260mm', 5, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000988', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHOE_270', '270mm', 6, 'Y', 'TYPE_SHOE_SIZE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_SHOE_COLOR 하위 (3개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000989', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCOL_BLACK', '블랙',   1, 'Y', 'TYPE_SHOE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000990', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCOL_WHITE', '화이트', 2, 'Y', 'TYPE_SHOE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000991', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCOL_BROWN', '브라운', 3, 'Y', 'TYPE_SHOE_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_BAG_COLOR 하위 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000992', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BCOL_BLACK', '블랙',   1, 'Y', 'TYPE_BAG_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000993', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BCOL_BROWN', '브라운', 2, 'Y', 'TYPE_BAG_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000994', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BCOL_BEIGE', '베이지', 3, 'Y', 'TYPE_BAG_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000995', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BCOL_NAVY',  '네이비', 4, 'Y', 'TYPE_BAG_COLOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_BAG_MATERIAL 하위 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000996', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BMAT_LEATHER',  '가죽',     1, 'Y', 'TYPE_BAG_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000997', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BMAT_CANVAS',   '캔버스',   2, 'Y', 'TYPE_BAG_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000998', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BMAT_NYLON',    '나일론',   3, 'Y', 'TYPE_BAG_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD000999', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_BMAT_VLEATHER', '비건레더', 4, 'Y', 'TYPE_BAG_MATERIAL', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_SHADE 하위 화장품 쉐이드 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001000', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHADE_01', '#01 로즈누드',  1, 'Y', 'TYPE_SHADE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001001', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHADE_02', '#02 코랄핑크',  2, 'Y', 'TYPE_SHADE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001002', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHADE_03', '#03 레드',      3, 'Y', 'TYPE_SHADE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001003', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SHADE_04', '#04 버건디',    4, 'Y', 'TYPE_SHADE', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_VOLUME 하위 화장품 용량 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001004', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_VOL_15ML',  '15ml',  1, 'Y', 'TYPE_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001005', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_VOL_30ML',  '30ml',  2, 'Y', 'TYPE_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001006', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_VOL_50ML',  '50ml',  3, 'Y', 'TYPE_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001007', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_VOL_100ML', '100ml', 4, 'Y', 'TYPE_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_SCENT 하위 향수 향 (6개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001008', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_ROSE',    '로즈',     1, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001009', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_JASMINE', '자스민',   2, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001010', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_VANILLA', '바닐라',   3, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001011', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_CITRUS',  '시트러스', 4, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001012', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_WOODY',   '우디',     5, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001013', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_SCENT_MUSK',    '머스크',   6, 'Y', 'TYPE_SCENT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_PERF_VOLUME 하위 향수 용량 (3개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001014', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PVOL_30ML',  '30ml',  1, 'Y', 'TYPE_PERF_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001015', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PVOL_50ML',  '50ml',  2, 'Y', 'TYPE_PERF_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001016', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_PVOL_100ML', '100ml', 3, 'Y', 'TYPE_PERF_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_FLAVOR 하위 맛 (5개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001017', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FLAV_ORIGINAL',   '오리지널', 1, 'Y', 'TYPE_FLAVOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001018', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FLAV_STRAWBERRY', '딸기',     2, 'Y', 'TYPE_FLAVOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001019', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FLAV_CHOCOLATE',  '초콜릿',   3, 'Y', 'TYPE_FLAVOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001020', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FLAV_MATCHA',     '말차',     4, 'Y', 'TYPE_FLAVOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001021', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FLAV_MANGO',      '망고',     5, 'Y', 'TYPE_FLAVOR', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_FOOD_VOLUME 하위 식품/음료 용량 (3개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001022', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FVOL_200ML',  '200ml', 1, 'Y', 'TYPE_FOOD_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001023', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FVOL_500ML',  '500ml', 2, 'Y', 'TYPE_FOOD_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001024', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_FVOL_1000ML', '1L',    3, 'Y', 'TYPE_FOOD_VOLUME', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

-- TYPE_CUSTOM_TEXT 하위 커스텀 (4개)
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001025', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_CUSTOM_NAME',   '이름 각인',       1, 'Y', 'TYPE_CUSTOM_TEXT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001026', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_CUSTOM_MSG',    '메시지 입력',     2, 'Y', 'TYPE_CUSTOM_TEXT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001027', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_CUSTOM_DATE',   '날짜 각인',       3, 'Y', 'TYPE_CUSTOM_TEXT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);
INSERT INTO shopjoy_2604.sy_code (code_id, site_id, code_grp, code_value, code_label, sort_ord, use_yn, parent_code_value, child_code_values, code_remark, code_level, reg_by, reg_date, upd_by, upd_date)
VALUES ('CD001028', 'SITE000001', 'PROD_OPT_CATEGORY', 'VAL_CUSTOM_LENGTH', '길이 입력 (cm)', 4, 'Y', 'TYPE_CUSTOM_TEXT', NULL, NULL, 3, 'SYSTEM', '2026-05-05 00:00:00', NULL, NULL);

COMMIT;

-- ════════════════════════════════════════════════════════════
-- 트리 구조 요약
-- ════════════════════════════════════════════════════════════
-- code_grp: PROD_OPT_CATEGORY (단일 코드그룹)  sy_code_grp 1건
--
-- lv1 (code_level=1)    lv2 (code_level=2)      lv3 (code_level=3)     건수
-- CAT_CLOTHING        → TYPE_COLOR            → VAL_COLOR_*           16건
--                     → TYPE_SIZE             → VAL_SIZE_*             9건
--                     → TYPE_MATERIAL         → VAL_MAT_*              8건
-- CAT_OUTER           → TYPE_OUTER_COLOR      → VAL_OCOL_*             5건
--                     → TYPE_OUTER_SIZE       → VAL_OSIZ_*             4건
-- CAT_PANTS           → TYPE_PANTS_COLOR      → VAL_PCOL_*             5건
--                     → TYPE_WAIST            → VAL_WAIST_*            6건
-- CAT_SHOES           → TYPE_SHOE_SIZE        → VAL_SHOE_*             6건
--                     → TYPE_SHOE_COLOR       → VAL_SCOL_*             3건
-- CAT_BAG             → TYPE_BAG_COLOR        → VAL_BCOL_*             4건
--                     → TYPE_BAG_MATERIAL     → VAL_BMAT_*             4건
-- CAT_COSMETIC        → TYPE_SHADE            → VAL_SHADE_*            4건
--                     → TYPE_VOLUME           → VAL_VOL_*              4건
-- CAT_PERFUME         → TYPE_SCENT            → VAL_SCENT_*            6건
--                     → TYPE_PERF_VOLUME      → VAL_PVOL_*             3건
-- CAT_FOOD            → TYPE_FLAVOR           → VAL_FLAV_*             5건
--                     → TYPE_FOOD_VOLUME      → VAL_FVOL_*             3건
-- CAT_CUSTOM          → TYPE_CUSTOM_TEXT      → VAL_CUSTOM_*           4건
--
-- 총계: sy_code_grp 1건 / sy_code 96건 (CD000900~CD001028)
--   1레벨  9건 / 2레벨 17건 / 3레벨 70건
-- ════════════════════════════════════════════════════════════
