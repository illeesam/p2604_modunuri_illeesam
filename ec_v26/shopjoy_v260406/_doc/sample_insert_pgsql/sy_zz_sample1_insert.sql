-- zz_sample1 샘플 INSERT 데이터

INSERT INTO shopjoy_2604.zz_sample1 (sample1_id, category, title, content, status, view_count, reg_by, reg_date)
VALUES
('ZS1260421120000001', 'CATEGORY_A', '공지 제목 1', '공지 내용 1번 입니다.', 'PUBLISHED', 125, 'admin', CURRENT_TIMESTAMP),
('ZS1260421120000002', 'CATEGORY_A', '공지 제목 2', '공지 내용 2번 입니다.', 'PUBLISHED', 89, 'admin', CURRENT_TIMESTAMP),
('ZS1260421120000003', 'CATEGORY_B', '뉴스 제목 1', '뉴스 내용 1번 입니다.', 'PUBLISHED', 203, 'admin', CURRENT_TIMESTAMP),
('ZS1260421120000004', 'CATEGORY_B', '뉴스 제목 2', '뉴스 내용 2번 입니다.', 'DRAFT', 0, 'admin', CURRENT_TIMESTAMP),
('ZS1260421120000005', 'CATEGORY_C', '이벤트 제목 1', '이벤트 내용 1번 입니다.', 'PUBLISHED', 456, 'admin', CURRENT_TIMESTAMP);
