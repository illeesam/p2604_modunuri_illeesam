-- zz_sample1 샘플 INSERT 데이터
-- cdGrp S01_MEMBER : 회원 샘플 50건
-- cdGrp S02_PRODUCT: 상품 샘플 50건
--
-- 컬럼 매핑
--   S01_MEMBER : cd_nm=회원명, col01=이메일, col02=전화번호, col03=등급(일반/우수/VIP), use_yn=Y/N
--   S02_PRODUCT: cd_nm=상품명, col01=카테고리, col02=가격, col03=재고, use_yn=Y/N

-- ================================================
-- S01_MEMBER 회원 샘플 50건
-- ================================================

INSERT INTO shopjoy_2604.zz_sample1
    (sample1_id, cd_grp, cd_nm, col01, col02, col03, srtord_vl, use_yn, rgtr, reg_dt)
VALUES
('ZS1260424000101', 'S01_MEMBER', '김민준', 'minjun.kim@example.com',    '010-1234-5678', '일반', 1,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000102', 'S01_MEMBER', '이서연', 'seoyeon.lee@example.com',   '010-2345-6789', '우수', 2,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000103', 'S01_MEMBER', '박지훈', 'jihoon.park@example.com',   '010-3456-7890', 'VIP',  3,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000104', 'S01_MEMBER', '최수아', 'sua.choi@example.com',      '010-4567-8901', '일반', 4,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000105', 'S01_MEMBER', '정예준', 'yejun.jung@example.com',    '010-5678-9012', '우수', 5,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000106', 'S01_MEMBER', '강다은', 'daeun.kang@example.com',    '010-6789-0123', '일반', 6,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000107', 'S01_MEMBER', '조현우', 'hyunwoo.cho@example.com',   '010-7890-1234', 'VIP',  7,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000108', 'S01_MEMBER', '윤소희', 'sohee.yoon@example.com',    '010-8901-2345', '일반', 8,  'N', 'admin', CURRENT_DATE),
('ZS1260424000109', 'S01_MEMBER', '임도윤', 'doyoon.lim@example.com',    '010-9012-3456', '우수', 9,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000110', 'S01_MEMBER', '한지아', 'jia.han@example.com',       '010-0123-4567', 'VIP',  10, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000111', 'S01_MEMBER', '오승현', 'seunghyun.oh@example.com',  '010-1111-2222', '일반', 11, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000112', 'S01_MEMBER', '신유나', 'yuna.shin@example.com',     '010-2222-3333', '우수', 12, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000113', 'S01_MEMBER', '배준혁', 'junhyeok.bae@example.com',  '010-3333-4444', '일반', 13, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000114', 'S01_MEMBER', '홍가은', 'gaeun.hong@example.com',    '010-4444-5555', 'VIP',  14, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000115', 'S01_MEMBER', '문재원', 'jaewon.moon@example.com',   '010-5555-6666', '일반', 15, 'N', 'admin', CURRENT_DATE),
('ZS1260424000116', 'S01_MEMBER', '서민서', 'minseo.seo@example.com',    '010-6666-7777', '우수', 16, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000117', 'S01_MEMBER', '류태양', 'taeyang.ryu@example.com',   '010-7777-8888', '일반', 17, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000118', 'S01_MEMBER', '권하은', 'haeun.kwon@example.com',    '010-8888-9999', 'VIP',  18, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000119', 'S01_MEMBER', '전이준', 'ijun.jeon@example.com',     '010-9999-0000', '우수', 19, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000120', 'S01_MEMBER', '양채원', 'chaewon.yang@example.com',  '010-1010-2020', '일반', 20, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000121', 'S01_MEMBER', '노시우', 'siwoo.noh@example.com',     '010-2020-3030', '일반', 21, 'N', 'admin', CURRENT_DATE),
('ZS1260424000122', 'S01_MEMBER', '허지유', 'jiyu.heo@example.com',      '010-3030-4040', '우수', 22, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000123', 'S01_MEMBER', '남도현', 'dohyun.nam@example.com',    '010-4040-5050', 'VIP',  23, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000124', 'S01_MEMBER', '심나연', 'nayeon.shim@example.com',   '010-5050-6060', '일반', 24, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000125', 'S01_MEMBER', '구성민', 'sungmin.koo@example.com',   '010-6060-7070', '우수', 25, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000126', 'S01_MEMBER', '마지후', 'jihu.ma@example.com',       '010-7070-8080', '일반', 26, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000127', 'S01_MEMBER', '우아린', 'arin.woo@example.com',      '010-8080-9090', 'VIP',  27, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000128', 'S01_MEMBER', '안세진', 'sejin.ahn@example.com',     '010-9090-0101', '일반', 28, 'N', 'admin', CURRENT_DATE),
('ZS1260424000129', 'S01_MEMBER', '손하율', 'hayul.son@example.com',     '010-0101-1212', '우수', 29, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000130', 'S01_MEMBER', '천수진', 'sujin.cheon@example.com',   '010-1212-2323', 'VIP',  30, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000131', 'S01_MEMBER', '석민채', 'minchae.seok@example.com',  '010-2323-3434', '일반', 31, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000132', 'S01_MEMBER', '편준서', 'junseo.pyeon@example.com',  '010-3434-4545', '우수', 32, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000133', 'S01_MEMBER', '탁하린', 'harin.tak@example.com',     '010-4545-5656', '일반', 33, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000134', 'S01_MEMBER', '감소율', 'soyul.gam@example.com',     '010-5656-6767', 'VIP',  34, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000135', 'S01_MEMBER', '봉지안', 'jian.bong@example.com',     '010-6767-7878', '일반', 35, 'N', 'admin', CURRENT_DATE),
('ZS1260424000136', 'S01_MEMBER', '변태오', 'taeo.byeon@example.com',    '010-7878-8989', '우수', 36, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000137', 'S01_MEMBER', '곽나율', 'nayul.gwak@example.com',    '010-8989-9090', '일반', 37, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000138', 'S01_MEMBER', '표서진', 'seojin.pyo@example.com',    '010-9090-1111', 'VIP',  38, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000139', 'S01_MEMBER', '라주원', 'juwon.ra@example.com',      '010-1111-3333', '우수', 39, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000140', 'S01_MEMBER', '마지수', 'jisu.ma@example.com',       '010-2222-4444', '일반', 40, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000141', 'S01_MEMBER', '길민아', 'mina.gil@example.com',      '010-3333-5555', '일반', 41, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000142', 'S01_MEMBER', '지수현', 'suhyun.ji@example.com',     '010-4444-6666', '우수', 42, 'N', 'admin', CURRENT_DATE),
('ZS1260424000143', 'S01_MEMBER', '방도은', 'doeun.bang@example.com',    '010-5555-7777', 'VIP',  43, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000144', 'S01_MEMBER', '복재현', 'jaehyun.bok@example.com',   '010-6666-8888', '일반', 44, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000145', 'S01_MEMBER', '사이연', 'iyeon.sa@example.com',      '010-7777-9999', '우수', 45, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000146', 'S01_MEMBER', '요지원', 'jiwon.yo@example.com',      '010-8888-0000', '일반', 46, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000147', 'S01_MEMBER', '적하준', 'hajun.jeok@example.com',    '010-9999-1111', 'VIP',  47, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000148', 'S01_MEMBER', '차민규', 'mingyu.cha@example.com',    '010-1234-9876', '일반', 48, 'N', 'admin', CURRENT_DATE),
('ZS1260424000149', 'S01_MEMBER', '추가온', 'gaon.choo@example.com',     '010-2345-8765', '우수', 49, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000150', 'S01_MEMBER', '탄서아', 'seoa.tan@example.com',      '010-3456-7654', 'VIP',  50, 'Y', 'admin', CURRENT_DATE);


-- ================================================
-- S02_PRODUCT 상품 샘플 50건
-- ================================================

INSERT INTO shopjoy_2604.zz_sample1
    (sample1_id, cd_grp, cd_nm, col01, col02, col03, srtord_vl, use_yn, rgtr, reg_dt)
VALUES
('ZS1260424000201', 'S02_PRODUCT', '린넨 크롭 자켓',         '아우터', '89000',  '45',  1,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000202', 'S02_PRODUCT', '와이드 데님 팬츠',        '하의',   '65000',  '120', 2,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000203', 'S02_PRODUCT', '플로럴 미디 원피스',       '원피스', '75000',  '80',  3,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000204', 'S02_PRODUCT', '오버핏 스트라이프 셔츠',   '상의',   '45000',  '200', 4,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000205', 'S02_PRODUCT', '청키 스니커즈',            '신발',   '98000',  '60',  5,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000206', 'S02_PRODUCT', '미니 크로스백',            '가방',   '55000',  '90',  6,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000207', 'S02_PRODUCT', '슬림핏 면 티셔츠',         '상의',   '25000',  '350', 7,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000208', 'S02_PRODUCT', '트렌치 코트',              '아우터', '159000', '30',  8,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000209', 'S02_PRODUCT', '플리츠 스커트',            '하의',   '52000',  '140', 9,  'Y', 'admin', CURRENT_DATE),
('ZS1260424000210', 'S02_PRODUCT', '스퀘어 토 힐',             '신발',   '79000',  '55',  10, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000211', 'S02_PRODUCT', '캔버스 토트백',            '가방',   '42000',  '110', 11, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000212', 'S02_PRODUCT', '리브드 크롭 니트',         '상의',   '48000',  '160', 12, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000213', 'S02_PRODUCT', '스트레이트 슬랙스',        '하의',   '68000',  '95',  13, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000214', 'S02_PRODUCT', '레이어드 홀터 원피스',     '원피스', '82000',  '70',  14, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000215', 'S02_PRODUCT', '레더 바이커 자켓',         '아우터', '210000', '20',  15, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000216', 'S02_PRODUCT', '메쉬 발레리나 플랫',       '신발',   '58000',  '75',  16, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000217', 'S02_PRODUCT', '버킷백 미디엄',            '가방',   '88000',  '40',  17, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000218', 'S02_PRODUCT', '컷아웃 슬리브 블라우스',   '상의',   '39000',  '180', 18, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000219', 'S02_PRODUCT', '카고 와이드 팬츠',         '하의',   '72000',  '100', 19, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000220', 'S02_PRODUCT', '맥시 플레어 스커트',       '하의',   '61000',  '85',  20, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000221', 'S02_PRODUCT', '수플레 머플러',            '아우터', '32000',  '220', 21, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000222', 'S02_PRODUCT', '첼시 부츠',                '신발',   '125000', '35',  22, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000223', 'S02_PRODUCT', '퀼티드 미니 백',           '가방',   '118000', '25',  23, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000224', 'S02_PRODUCT', '폴로넥 스웨터',            '상의',   '58000',  '130', 24, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000225', 'S02_PRODUCT', '스모크 밴딩 원피스',       '원피스', '67000',  '90',  25, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000226', 'S02_PRODUCT', '더블 브레스트 블레이저',   '아우터', '138000', '28',  26, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000227', 'S02_PRODUCT', '사이드슬릿 팬츠',          '하의',   '55000',  '115', 27, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000228', 'S02_PRODUCT', '앵클 스트랩 샌들',         '신발',   '68000',  '65',  28, 'N', 'admin', CURRENT_DATE),
('ZS1260424000229', 'S02_PRODUCT', '래플 숄더백',              '가방',   '75000',  '50',  29, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000230', 'S02_PRODUCT', '오프숄더 탑',              '상의',   '36000',  '190', 30, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000231', 'S02_PRODUCT', '코듀로이 미니 스커트',     '하의',   '48000',  '105', 31, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000232', 'S02_PRODUCT', '뷔스티에 원피스',          '원피스', '92000',  '55',  32, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000233', 'S02_PRODUCT', '양털 숏 자켓',             '아우터', '118000', '38',  33, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000234', 'S02_PRODUCT', '로우 플랫폼 슈즈',         '신발',   '72000',  '70',  34, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000235', 'S02_PRODUCT', '집업 클러치백',            '가방',   '48000',  '80',  35, 'N', 'admin', CURRENT_DATE),
('ZS1260424000236', 'S02_PRODUCT', '프릴 넥 블라우스',         '상의',   '43000',  '155', 36, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000237', 'S02_PRODUCT', '슬릿 하이웨이스트 팬츠',   '하의',   '63000',  '98',  37, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000238', 'S02_PRODUCT', '플리츠 점프수트',          '원피스', '88000',  '45',  38, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000239', 'S02_PRODUCT', '울 블렌드 코트',           '아우터', '225000', '18',  39, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000240', 'S02_PRODUCT', '펌프스 힐',                '신발',   '85000',  '60',  40, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000241', 'S02_PRODUCT', '스터드 숄더백',            '가방',   '95000',  '35',  41, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000242', 'S02_PRODUCT', '터틀넥 슬림 티',           '상의',   '35000',  '210', 42, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000243', 'S02_PRODUCT', '에이라인 트위드 스커트',   '하의',   '78000',  '72',  43, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000244', 'S02_PRODUCT', '써커 오프숄더 원피스',     '원피스', '69000',  '88',  44, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000245', 'S02_PRODUCT', '패딩 숏 베스트',           '아우터', '76000',  '60',  45, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000246', 'S02_PRODUCT', '슬링백 뮬',                '신발',   '65000',  '82',  46, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000247', 'S02_PRODUCT', '체인 미니 숄더백',         '가방',   '108000', '30',  47, 'N', 'admin', CURRENT_DATE),
('ZS1260424000248', 'S02_PRODUCT', '배색 스트라이프 니트',     '상의',   '52000',  '145', 48, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000249', 'S02_PRODUCT', '루즈핏 린넨 팬츠',         '하의',   '57000',  '110', 49, 'Y', 'admin', CURRENT_DATE),
('ZS1260424000250', 'S02_PRODUCT', '홀터넥 점프수트',          '원피스', '95000',  '42',  50, 'Y', 'admin', CURRENT_DATE);
