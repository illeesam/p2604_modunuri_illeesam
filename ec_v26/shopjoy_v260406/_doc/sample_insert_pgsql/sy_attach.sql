-- ============================================================================
-- sy_attach: 첨부파일 정보 샘플 데이터
-- ============================================================================

-- ============================================================================
-- 리뷰 사진 그룹 1 (ATG202604211430450001) - 사진 3개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421143045010101', '01', 'ATG202604211430450001', '리뷰사진1.jpg', 2097152, 'jpg', 'image/jpeg',
    '20260421_143045_01_1234.jpg', 'LOCAL', '/cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '리뷰사진1 (thumbnail)', '20260421_143045_01_1234_thumb.jpg',
    '/cdn/review/2026/202604/20260421/20260421_143045_01_1234_thumb.jpg', NULL, 'Y',
    1, '상품 리뷰 첫번째 사진', 'member001', CURRENT_TIMESTAMP, 'member001', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421143045010102', '01', 'ATG202604211430450001', '리뷰사진2.jpg', 2359296, 'jpg', 'image/jpeg',
    '20260421_143045_02_5678.jpg', 'LOCAL', '/cdn/review/2026/202604/20260421/20260421_143045_02_5678.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '리뷰사진2 (thumbnail)', '20260421_143045_02_5678_thumb.jpg',
    '/cdn/review/2026/202604/20260421/20260421_143045_02_5678_thumb.jpg', NULL, 'Y',
    2, '상품 리뷰 두번째 사진', 'member001', CURRENT_TIMESTAMP, 'member001', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421143045010103', '01', 'ATG202604211430450001', '리뷰사진3.png', 3145728, 'png', 'image/png',
    '20260421_143045_03_9012.png', 'LOCAL', '/cdn/review/2026/202604/20260421/20260421_143045_03_9012.png',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '리뷰사진3 (thumbnail)', '20260421_143045_03_9012_thumb.jpg',
    '/cdn/review/2026/202604/20260421/20260421_143045_03_9012_thumb.jpg', NULL, 'Y',
    3, '상품 리뷰 세번째 사진 (PNG)', 'member001', CURRENT_TIMESTAMP, 'member001', CURRENT_TIMESTAMP
);

-- ============================================================================
-- 리뷰 동영상 그룹 (ATG202604211435000001) - 동영상 1개 + 썸네일
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421143500010101', '01', 'ATG202604211435000001', '상품리뷰영상.mp4', 52428800, 'mp4', 'video/mp4',
    '20260421_143500_01_3456.mp4', 'LOCAL', '/cdn/review/2026/202604/20260421/20260421_143500_01_3456.mp4',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품리뷰영상 (thumbnail)', '20260421_143500_01_3456_thumb.jpg',
    '/cdn/review/2026/202604/20260421/20260421_143500_01_3456_thumb.jpg', NULL, 'Y',
    1, '상품 리뷰 동영상 (자동 변환됨)', 'member001', CURRENT_TIMESTAMP, 'member001', CURRENT_TIMESTAMP
);

-- ============================================================================
-- 상품 이미지 그룹 1 (ATG202604210900000001) - 상품 상세 이미지 5개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421090000010101', '01', 'ATG202604210900000001', '상품메인이미지.jpg', 3145728, 'jpg', 'image/jpeg',
    '20260421_090000_01_0001.jpg', 'LOCAL', '/cdn/product/2026/202604/20260421/20260421_090000_01_0001.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품메인이미지 (thumbnail)', '20260421_090000_01_0001_thumb.jpg',
    '/cdn/product/2026/202604/20260421/20260421_090000_01_0001_thumb.jpg', NULL, 'Y',
    1, '상품 메인 이미지', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421090000010102', '01', 'ATG202604210900000001', '상품상세1.jpg', 2621440, 'jpg', 'image/jpeg',
    '20260421_090000_02_0002.jpg', 'LOCAL', '/cdn/product/2026/202604/20260421/20260421_090000_02_0002.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품상세1 (thumbnail)', '20260421_090000_02_0002_thumb.jpg',
    '/cdn/product/2026/202604/20260421/20260421_090000_02_0002_thumb.jpg', NULL, 'Y',
    2, '상품 상세 이미지 1', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421090000010103', '01', 'ATG202604210900000001', '상품상세2.jpg', 2883584, 'jpg', 'image/jpeg',
    '20260421_090000_03_0003.jpg', 'LOCAL', '/cdn/product/2026/202604/20260421/20260421_090000_03_0003.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품상세2 (thumbnail)', '20260421_090000_03_0003_thumb.jpg',
    '/cdn/product/2026/202604/20260421/20260421_090000_03_0003_thumb.jpg', NULL, 'Y',
    3, '상품 상세 이미지 2', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421090000010104', '01', 'ATG202604210900000001', '상품상세3.jpg', 2752512, 'jpg', 'image/jpeg',
    '20260421_090000_04_0004.jpg', 'LOCAL', '/cdn/product/2026/202604/20260421/20260421_090000_04_0004.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품상세3 (thumbnail)', '20260421_090000_04_0004_thumb.jpg',
    '/cdn/product/2026/202604/20260421/20260421_090000_04_0004_thumb.jpg', NULL, 'Y',
    4, '상품 상세 이미지 3', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421090000010105', '01', 'ATG202604210900000001', '상품상세4.jpg', 3010560, 'jpg', 'image/jpeg',
    '20260421_090000_05_0005.jpg', 'LOCAL', '/cdn/product/2026/202604/20260421/20260421_090000_05_0005.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '상품상세4 (thumbnail)', '20260421_090000_05_0005_thumb.jpg',
    '/cdn/product/2026/202604/20260421/20260421_090000_05_0005_thumb.jpg', NULL, 'Y',
    5, '상품 상세 이미지 4', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

-- ============================================================================
-- Q&A 문서 그룹 (ATG202604212000000001) - 문서 2개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421200000010101', '01', 'ATG202604212000000001', '사양서.pdf', 1048576, 'pdf', 'application/pdf',
    '20260421_200000_01_7890.pdf', 'LOCAL', '/cdn/qna/2026/202604/20260421/20260421_200000_01_7890.pdf',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    NULL, NULL, NULL, NULL, 'N',
    1, 'Q&A 첨부 사양서 PDF', 'member002', CURRENT_TIMESTAMP, 'member002', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421200000010102', '01', 'ATG202604212000000001', '설명서.docx', 524288, 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '20260421_200000_02_1234.docx', 'LOCAL', '/cdn/qna/2026/202604/20260421/20260421_200000_02_1234.docx',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    NULL, NULL, NULL, NULL, 'N',
    2, 'Q&A 첨부 설명서 DOCX', 'member002', CURRENT_TIMESTAMP, 'member002', CURRENT_TIMESTAMP
);

-- ============================================================================
-- 공지사항 이미지 그룹 (ATG202604210800000001) - 이미지 2개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421080000010101', '01', 'ATG202604210800000001', '공지배너1.jpg', 4194304, 'jpg', 'image/jpeg',
    '20260421_080000_01_5555.jpg', 'LOCAL', '/cdn/notice/2026/202604/20260421/20260421_080000_01_5555.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '공지배너1 (thumbnail)', '20260421_080000_01_5555_thumb.jpg',
    '/cdn/notice/2026/202604/20260421/20260421_080000_01_5555_thumb.jpg', NULL, 'Y',
    1, '공지사항 배너 이미지 1', 'admin03', CURRENT_TIMESTAMP, 'admin03', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421080000010102', '01', 'ATG202604210800000001', '공지배너2.jpg', 3932160, 'jpg', 'image/jpeg',
    '20260421_080000_02_6666.jpg', 'LOCAL', '/cdn/notice/2026/202604/20260421/20260421_080000_02_6666.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '공지배너2 (thumbnail)', '20260421_080000_02_6666_thumb.jpg',
    '/cdn/notice/2026/202604/20260421/20260421_080000_02_6666_thumb.jpg', NULL, 'Y',
    2, '공지사항 배너 이미지 2', 'admin03', CURRENT_TIMESTAMP, 'admin03', CURRENT_TIMESTAMP
);

-- ============================================================================
-- 사용자 프로필 이미지 그룹 (ATG202604211500000001) - 아바타 1개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421150000010101', '01', 'ATG202604211500000001', '프로필사진.jpg', 262144, 'jpg', 'image/jpeg',
    '20260421_150000_01_7777.jpg', 'LOCAL', '/cdn/profile/2026/202604/20260421/20260421_150000_01_7777.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '프로필사진 (thumbnail)', '20260421_150000_01_7777_thumb.jpg',
    '/cdn/profile/2026/202604/20260421/20260421_150000_01_7777_thumb.jpg', NULL, 'Y',
    1, '사용자 프로필 아바타', 'member003', CURRENT_TIMESTAMP, 'member003', CURRENT_TIMESTAMP
);

-- ============================================================================
-- 이벤트 이미지 그룹 (ATG202604210700000001) - 이미지 3개
-- ============================================================================
INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421070000010101', '01', 'ATG202604210700000001', '이벤트배너.jpg', 3670016, 'jpg', 'image/jpeg',
    '20260421_070000_01_2222.jpg', 'LOCAL', '/cdn/event/2026/202604/20260421/20260421_070000_01_2222.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '이벤트배너 (thumbnail)', '20260421_070000_01_2222_thumb.jpg',
    '/cdn/event/2026/202604/20260421/20260421_070000_01_2222_thumb.jpg', NULL, 'Y',
    1, '이벤트 배너 이미지', 'admin01', CURRENT_TIMESTAMP, 'admin01', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421070000010102', '01', 'ATG202604210700000001', '이벤트썸네일1.jpg', 2097152, 'jpg', 'image/jpeg',
    '20260421_070000_02_3333.jpg', 'LOCAL', '/cdn/event/2026/202604/20260421/20260421_070000_02_3333.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '이벤트썸네일1 (thumbnail)', '20260421_070000_02_3333_thumb.jpg',
    '/cdn/event/2026/202604/20260421/20260421_070000_02_3333_thumb.jpg', NULL, 'Y',
    2, '이벤트 썸네일 이미지 1', 'admin01', CURRENT_TIMESTAMP, 'admin01', CURRENT_TIMESTAMP
);

INSERT INTO sy_attach (
    attach_id, site_id, attach_grp_id, file_nm, file_size, file_ext, mime_type_cd,
    stored_nm, storage_type, storage_path, attach_url, cdn_host, cdn_img_url, cdn_thumb_url,
    thumb_file_nm, thumb_stored_nm, thumb_url, thumb_cdn_url, thumb_generated_yn,
    sort_ord, attach_memo, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATT20260421070000010103', '01', 'ATG202604210700000001', '이벤트썸네일2.jpg', 2359296, 'jpg', 'image/jpeg',
    '20260421_070000_03_4444.jpg', 'LOCAL', '/cdn/event/2026/202604/20260421/20260421_070000_03_4444.jpg',
    NULL, 'https://cdn.shopjoy.com', NULL, NULL,
    '이벤트썸네일2 (thumbnail)', '20260421_070000_03_4444_thumb.jpg',
    '/cdn/event/2026/202604/20260421/20260421_070000_03_4444_thumb.jpg', NULL, 'Y',
    3, '이벤트 썸네일 이미지 2', 'admin01', CURRENT_TIMESTAMP, 'admin01', CURRENT_TIMESTAMP
);
