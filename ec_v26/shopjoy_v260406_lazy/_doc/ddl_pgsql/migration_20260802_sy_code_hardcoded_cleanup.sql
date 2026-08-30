-- migration_20260802_sy_code_hardcoded_cleanup.sql
-- 하드코딩 배열 제거 — sy_code 신규 그룹 등록 (2026-08-02)
-- 대상: PdDlivTmpltMng(COURIER+2), PdProdDtl, PdRestockNotiMng, PdReviewMng,
--       PmCouponDtl, PmPlanDtl, CmBlogMng, SyBbmDtl, SyVendorUserMng, SyDeptMng

-- COURIER 추가 (EPOST/KGB)
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000093','2604010000000001','COURIER','EPOST','우편택배',60,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000094','2604010000000001','COURIER','KGB','KGB택배',70,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- STOCK_FILTER
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000095','2604010000000001','STOCK_FILTER','in','재고있음',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000096','2604010000000001','STOCK_FILTER','out','품절(0)',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- REVIEW_RATING
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000097','2604010000000001','REVIEW_RATING','5','5점',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000098','2604010000000001','REVIEW_RATING','4','4점대',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000099','2604010000000001','REVIEW_RATING','3','3점대',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000100','2604010000000001','REVIEW_RATING','2','2점대',40,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000101','2604010000000001','REVIEW_RATING','1','1점대',50,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- COUPON_USE_LIMIT
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000102','2604010000000001','COUPON_USE_LIMIT','unlimited','무제한',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000103','2604010000000001','COUPON_USE_LIMIT','once','1회만',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000104','2604010000000001','COUPON_USE_LIMIT','month','월 1회',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- COUPON_ISSUE_DISP
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000105','2604010000000001','COUPON_ISSUE_DISP','auto','자동 발급',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000106','2604010000000001','COUPON_ISSUE_DISP','manual','수동 발급',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000107','2604010000000001','COUPON_ISSUE_DISP','event','이벤트 발급',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- COUPON_TARGET
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000108','2604010000000001','COUPON_TARGET','all','전체 회원',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000109','2604010000000001','COUPON_TARGET','newMember','신규 회원',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000110','2604010000000001','COUPON_TARGET','subscribe','구독자',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000111','2604010000000001','COUPON_TARGET','purchase','구매 고객',40,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- COUPON_APPLY
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000112','2604010000000001','COUPON_APPLY','all','모든 상품',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000113','2604010000000001','COUPON_APPLY','category','카테고리 제한',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000114','2604010000000001','COUPON_APPLY','product','특정 상품만',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000115','2604010000000001','COUPON_APPLY','exclude','제외 상품',40,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- COUPON_DISC_TYPE
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000116','2604010000000001','COUPON_DISC_TYPE','amount','정액',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000117','2604010000000001','COUPON_DISC_TYPE','percent','정률',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- PLAN_CATEGORY
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000118','2604010000000001','PLAN_CATEGORY','FASHION','패션',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000119','2604010000000001','PLAN_CATEGORY','SPORTS','스포츠',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000120','2604010000000001','PLAN_CATEGORY','STYLING','스타일링',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000121','2604010000000001','PLAN_CATEGORY','STAFF','직원전용',40,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000122','2604010000000001','PLAN_CATEGORY','LUXURY','명품',50,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- PLAN_DISP_STATUS
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000123','2604010000000001','PLAN_DISP_STATUS','ACTIVE','활성',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000124','2604010000000001','PLAN_DISP_STATUS','SCHEDULED','예정',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000125','2604010000000001','PLAN_DISP_STATUS','INACTIVE','비활성',30,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000126','2604010000000001','PLAN_DISP_STATUS','ENDED','종료',40,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- BLOG_TYPE
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000127','2604010000000001','BLOG_TYPE','NEWS','뉴스',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000128','2604010000000001','BLOG_TYPE','BLOG','블로그',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- OPEN_YN
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000129','2604010000000001','OPEN_YN','Y','공개',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000130','2604010000000001','OPEN_YN','N','비공개',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- NOTICE_YN
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000131','2604010000000001','NOTICE_YN','Y','공지',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000132','2604010000000001','NOTICE_YN','N','일반',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- ALLOW_YN
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000133','2604010000000001','ALLOW_YN','Y','허용',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000134','2604010000000001','ALLOW_YN','N','불가',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
-- BOOL_YN
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000135','2604010000000001','BOOL_YN','Y','예',10,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
INSERT INTO shopjoy_2604.sy_code (code_id,site_id,code_grp,code_value,code_label,sort_ord,use_yn,code_level,reg_by,reg_date) VALUES ('SC00000000000136','2604010000000001','BOOL_YN','N','아니오',20,'Y',1,'SYSTEM',CURRENT_TIMESTAMP);
