-- ═══════════════════════════════════════════════════════════
--  멀티테넌트 — danmoo1 모듈(당근 스타일 중고거래) 시드 데이터: 사이트 2604010000000007(당근마켓, ST0007)
--  작성일: 2026-10-02
--
--  이 사이트에는 데이터가 전혀 없어(상품/카테고리/회원 0건) FO 모듈 danmoo1 을 띄워도 빈 화면만 보인다.
--  ShopJoy 메인몰(site1) 상품 36건을 복제해 당근식 카테고리로 매핑하고, 테스트 회원 5명·동네생활 글 4건을 넣는다.
--   · 재실행 안전: 모든 INSERT 는 이미 있으면 건너뛴다(IF NOT EXISTS / ON CONFLICT DO NOTHING)
--   · 복제 상품 ID 'PDDM…', 이미지 'PIDM…', SKU 'SKDM…', 회원 'MEDM…', 글 'BLDM…' — 앞 4글자로 구분되어 통째로 지울 수 있다
--   · 가격은 원본이 NULL/0 인 상품이 많아(시뮬레이션 상품) 5천~40만원 사이 값을 정해 넣는다(표시용)
--   · 사진은 원본 상품의 CDN 이미지 주소를 그대로 쓴다(sy_attach 는 공유하지 않으므로 attach_id 는 NULL)
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- 0) 사이트 ↔ 모듈
UPDATE shopjoy_2604.sy_site SET tenant_module = 'danmoo1' WHERE site_id = '2604010000000007' AND tenant_module IS NULL;

-- 1) 당근식 카테고리 (depth 1)
INSERT INTO shopjoy_2604.pd_category (category_id, parent_category_id, category_nm, category_depth, sort_ord, category_status_cd, category_desc, reg_by, reg_date, site_id, reg_site_id)
SELECT v.id, NULL, v.nm, 1, v.ord, 'ACTIVE', v.nm || ' 중고거래', 'SEED', now(), '2604010000000007', '2604010000000007'
FROM (VALUES
  ('CAT0700001','디지털기기',1), ('CAT0700002','생활가전',2), ('CAT0700003','가구/인테리어',3), ('CAT0700004','생활/주방',4),
  ('CAT0700005','유아동',5), ('CAT0700006','의류',6), ('CAT0700007','가방/잡화',7), ('CAT0700008','신발',8),
  ('CAT0700009','뷰티/미용',9), ('CAT0700010','스포츠/레저',10), ('CAT0700011','취미/게임/음반',11), ('CAT0700012','식품',12)
) AS v(id, nm, ord)
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.pd_category c WHERE c.category_id = v.id);

-- 2) 상품 36건 복제 — site1 ACTIVE 상품 중 최근 등록순. 원본 최상위 카테고리(의류/가방/신발/액세서리)를 당근 카테고리로 매핑
WITH RECURSIVE root AS (
  SELECT category_id, category_id AS root_id FROM shopjoy_2604.pd_category WHERE parent_category_id IS NULL AND site_id = '2604010000000001'
  UNION ALL
  SELECT c.category_id, r.root_id FROM shopjoy_2604.pd_category c JOIN root r ON c.parent_category_id = r.category_id
),
src AS (
  SELECT p.*, row_number() OVER (ORDER BY p.reg_date DESC, p.prod_id) AS rn,
         (SELECT root_id FROM root WHERE root.category_id = p.category_id LIMIT 1) AS root_cat
  FROM shopjoy_2604.pd_prod p
  WHERE p.site_id = '2604010000000001' AND p.prod_status_cd = 'ACTIVE'
    AND EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod_img i WHERE i.prod_id = p.prod_id)
  ORDER BY p.reg_date DESC, p.prod_id
  LIMIT 36
)
INSERT INTO shopjoy_2604.pd_prod (prod_id, category_id, brand_id, vendor_id, md_user_id, prod_nm, prod_type_cd, prod_code,
  std_price, sale_price, prod_status_cd, thumbnail_url, content_html, is_new, is_best, view_count,
  sale_start_date, sale_end_date, min_buy_qty, adlt_yn, same_day_dliv_yn, sold_out_yn, coupon_use_yn, save_use_yn, discnt_use_yn,
  reg_by, reg_date, upd_by, upd_date, simul_yn, reg_site_id, site_id, sale_discnt_rate, sale_discnt_amt, disp_start_date, disp_end_date, curr_cd)
SELECT 'PDDM' || lpad(s.rn::text, 10, '0'),
       CASE s.root_cat WHEN 'CAT0100001' THEN 'CAT0700006' WHEN 'CAT0100041' THEN 'CAT0700007' WHEN 'CAT0100051' THEN 'CAT0700008'
                       WHEN 'CAT0100061' THEN 'CAT0700009' ELSE 'CAT0700004' END,
       s.brand_id, s.vendor_id, s.md_user_id,
       regexp_replace(regexp_replace(s.prod_nm, '^simul', ''), '\s*_\d{6}_\d{4}$', ''),
       'SINGLE', 'DM-' || lpad(s.rn::text, 4, '0'),
       (5 + (s.rn * 37) % 76) * 5000, (5 + (s.rn * 37) % 76) * 5000, 'ACTIVE',
       (SELECT coalesce(i.cdn_thumb_url, i.cdn_img_url) FROM shopjoy_2604.pd_prod_img i WHERE i.prod_id = s.prod_id ORDER BY (i.is_thumb = 'Y') DESC, i.sort_ord LIMIT 1),
       '<p>' || regexp_replace(regexp_replace(s.prod_nm, '^simul', ''), '\s*_\d{6}_\d{4}$', '') || ' 팝니다. 사용감 적고 상태 좋아요. 직거래 환영합니다.</p>',
       'N', 'N', (s.rn * 13) % 90,
       now() - (s.rn * 97 || ' minutes')::interval, NULL, 1, 'N', 'N', 'N', 'Y', 'Y', 'Y',
       'SEED', now() - (s.rn * 97 || ' minutes')::interval, 'SEED', now() - (s.rn * 97 || ' minutes')::interval, 'Y', '2604010000000007', '2604010000000007', 0, 0,
       now() - (s.rn * 97 || ' minutes')::interval, NULL, 'KRW'
FROM src s
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod x WHERE x.prod_id = 'PDDM' || lpad(s.rn::text, 10, '0'));

-- 3) 이미지 — 복제 상품마다 원본 이미지 최대 4장(대표 먼저). 옵션 연결은 끊고(opt NULL), 첨부(attach_id)는 공유하지 않는다
INSERT INTO shopjoy_2604.pd_prod_img (prod_img_id, prod_id, cdn_host, cdn_img_url, cdn_thumb_url, img_alt_text, sort_ord, is_thumb, reg_by, reg_date, reg_site_id, site_id)
SELECT 'PIDM' || lpad(row_number() OVER (ORDER BY d.prod_id, ord.rn)::text, 10, '0'), d.prod_id, ord.cdn_host, ord.cdn_img_url, ord.cdn_thumb_url, d.prod_nm, ord.rn,
       CASE WHEN ord.rn = 1 THEN 'Y' ELSE 'N' END, 'SEED', now(), '2604010000000007', '2604010000000007'
FROM shopjoy_2604.pd_prod d
JOIN LATERAL (
  SELECT i.cdn_host, i.cdn_img_url, i.cdn_thumb_url, row_number() OVER (ORDER BY (i.is_thumb = 'Y') DESC, i.sort_ord) AS rn
  FROM shopjoy_2604.pd_prod_img i
  WHERE i.prod_id = (SELECT p.prod_id FROM shopjoy_2604.pd_prod p WHERE p.site_id = '2604010000000001' AND p.prod_code IS DISTINCT FROM d.prod_code
                     AND regexp_replace(regexp_replace(p.prod_nm, '^simul', ''), '\s*_\d{6}_\d{4}$', '') = d.prod_nm
                     AND EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod_img ii WHERE ii.prod_id = p.prod_id) ORDER BY p.reg_date DESC LIMIT 1)
  LIMIT 4
) ord ON TRUE
WHERE d.site_id = '2604010000000007' AND d.prod_id LIKE 'PDDM%'
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod_img x WHERE x.prod_id = d.prod_id);

-- 4) SKU — 단품 1개(재고 1 = 중고 1점)
INSERT INTO shopjoy_2604.pd_prod_sku (prod_sku_id, prod_id, sku_code, add_price, use_yn, reg_by, reg_date, reg_site_id, site_id, stock_qty, sale_count)
SELECT 'SKDM' || substr(d.prod_id, 5), d.prod_id, d.prod_id || '-001', 0, 'Y', 'SEED', now(), '2604010000000007', '2604010000000007', 1, 0
FROM shopjoy_2604.pd_prod d
WHERE d.site_id = '2604010000000007' AND d.prod_id LIKE 'PDDM%'
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.pd_prod_sku x WHERE x.prod_id = d.prod_id);

-- 5) 테스트 회원 5명 — 비밀번호는 기존 시뮬레이션 회원(sim_09960, 1111)과 같은 해시
INSERT INTO shopjoy_2604.mb_member (member_id, site_id, login_id, login_pwd_hash, member_nm, member_email, member_phone, grade_cd, member_status_cd, join_date, simul_yn, member_memo,
  recv_phone_yn, recv_kakao_yn, recv_sms_yn, recv_email_yn, recv_ad_yn, recv_mkt_event_yn, recv_mkt_plan_yn, pass_verified_yn, email_verified_yn, reg_by, reg_date, upd_by, upd_date, reg_site_id)
SELECT 'MEDM' || lpad(v.n::text, 10, '0'), '2604010000000007', v.login_id, (SELECT login_pwd_hash FROM shopjoy_2604.mb_member WHERE login_id = 'sim_09960'),
       v.nm, v.login_id, '0103805020' || v.n, 'BASIC', 'ACTIVE', now() - (v.n * 11 || ' days')::interval, 'Y', 'danmoo1 테스트 회원(시드)',
       'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'Y', 'SEED', now(), 'SEED', now(), '2604010000000007'
FROM (VALUES (1, 'dm_user1@danmoo.com', '여수동주민'), (2, 'dm_user2@danmoo.com', '까치링'), (3, 'dm_user3@danmoo.com', '하늘사랑'),
             (4, 'dm_user4@danmoo.com', '은우다'), (5, 'dm_user5@danmoo.com', '스페이스')) AS v(n, login_id, nm)
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_member m WHERE m.login_id = v.login_id);

-- 6) 커뮤니티(동네생활) 카테고리 + 글 4건 — cm_blog 는 사이트 컬럼이 없어 모든 사이트가 공유한다
INSERT INTO shopjoy_2604.cm_blog_cate (blog_cate_id, blog_cate_nm, sort_ord, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'BC000000000000020', '동네생활', 20, 'Y', 'SEED', now(), '2604010000000007'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_blog_cate WHERE blog_cate_id = 'BC000000000000020');

INSERT INTO shopjoy_2604.cm_blog (blog_id, blog_cate_id, blog_title, blog_summary, blog_content, blog_author, view_count, use_yn, is_notice, reg_by, reg_date, blog_type_cd, reg_site_id)
SELECT 'BLDM' || lpad(v.n::text, 10, '0'), 'BC000000000000020', v.title, v.summary, '<p>' || v.summary || '</p>', v.author, v.views, 'Y', 'N', 'SEED', now() - (v.n * 7 || ' hours')::interval, 'BLOG', '2604010000000007'
FROM (VALUES
  (1, '여수동 근처 괜찮은 세차장 아시는 분?', '이사 온 지 얼마 안 돼서 동네를 잘 몰라요. 손세차 가능한 곳 추천 부탁드립니다.', '여수동주민', 128),
  (2, '매출은 고마운데… 이 손님 이제 그만 오셨으면 좋겠습니다ㅠ', '작은 음식점 운영하고 있습니다. 일주일에 두세 번씩 오시는데 매번 반찬 리필만 다섯 번 넘게…', '자영업자', 946),
  (3, '시체는 거짓말을 하지 않는다', '물총새공원 벤치에서 읽은 책. 죽음 앞에서 나의 삶을 돌아보게 되네요.', '까치링', 10),
  (4, '이번 주말 동네 벼룩시장 같이 가실 분', '토요일 오전 10시 수정구청 앞. 안 쓰는 물건 가져와서 나눔해요.', '하늘사랑', 57)
) AS v(n, title, summary, author, views)
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_blog b WHERE b.blog_id = 'BLDM' || lpad(v.n::text, 10, '0'));

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT count(*) FROM shopjoy_2604.pd_prod WHERE site_id='2604010000000007';        -- 36
-- SELECT count(*) FROM shopjoy_2604.pd_prod_img WHERE site_id='2604010000000007';    -- 36~144
-- SELECT count(*) FROM shopjoy_2604.mb_member WHERE site_id='2604010000000007';      -- 5
-- SELECT tenant_module FROM shopjoy_2604.sy_site WHERE site_id='2604010000000007';   -- danmoo1
