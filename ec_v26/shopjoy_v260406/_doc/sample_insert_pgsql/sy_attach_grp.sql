-- ============================================================================
-- sy_attach_grp: 첨부파일 그룹 샘플 데이터
-- ============================================================================

-- 리뷰 사진 그룹 1 (사진 3개)
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604211430450001', 'review_202604211430450001', '리뷰 사진 그룹 1',
    'jpg,jpeg,png,gif,webp', 5242880, 10, '/cdn/review/2026/202604/20260421/',
    'Y', 1, '상품 리뷰 사진 3개', 'admin01', CURRENT_TIMESTAMP, 'admin01', CURRENT_TIMESTAMP
);

-- 리뷰 동영상 그룹 (동영상 1개 + 썸네일)
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604211435000001', 'review_202604211435000001', '리뷰 동영상 그룹',
    'mp4,avi,mov,mkv,webm', 104857600, 3, '/cdn/review/2026/202604/20260421/',
    'Y', 2, '상품 리뷰 동영상 1개', 'member001', CURRENT_TIMESTAMP, 'member001', CURRENT_TIMESTAMP
);

-- 상품 이미지 그룹 1 (상품 상세 이미지)
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604210900000001', 'product_202604210900000001', '상품 이미지 그룹 1',
    'jpg,jpeg,png,gif,webp', 10485760, 20, '/cdn/product/2026/202604/20260421/',
    'Y', 3, '상품 상세 이미지 5개', 'admin02', CURRENT_TIMESTAMP, 'admin02', CURRENT_TIMESTAMP
);

-- Q&A 문서 그룹
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604212000000001', 'qna_202604212000000001', 'Q&A 문서 그룹',
    'pdf,doc,docx,xls,xlsx,ppt,pptx,txt', 20971520, 5, '/cdn/qna/2026/202604/20260421/',
    'Y', 4, '고객 문의 관련 문서', 'member002', CURRENT_TIMESTAMP, 'member002', CURRENT_TIMESTAMP
);

-- 공지사항 이미지 그룹
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604210800000001', 'notice_202604210800000001', '공지사항 이미지 그룹',
    'jpg,jpeg,png,gif,webp', 10485760, 10, '/cdn/notice/2026/202604/20260421/',
    'Y', 5, '공지사항 배너 이미지 2개', 'admin03', CURRENT_TIMESTAMP, 'admin03', CURRENT_TIMESTAMP
);

-- 사용자 프로필 이미지 그룹
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604211500000001', 'profile_202604211500000001', '프로필 이미지 그룹',
    'jpg,jpeg,png,gif,webp', 5242880, 1, '/cdn/profile/2026/202604/20260421/',
    'Y', 6, '사용자 프로필 아바타', 'member003', CURRENT_TIMESTAMP, 'member003', CURRENT_TIMESTAMP
);

-- 이벤트 이미지 그룹
INSERT INTO sy_attach_grp (
    attach_grp_id, attach_grp_code, attach_grp_nm, file_ext_allow,
    max_file_size, max_file_count, storage_path, use_yn, sort_ord,
    attach_grp_remark, reg_by, reg_date, upd_by, upd_date
) VALUES (
    'ATG202604210700000001', 'event_202604210700000001', '이벤트 이미지 그룹',
    'jpg,jpeg,png,gif,webp', 10485760, 10, '/cdn/event/2026/202604/20260421/',
    'Y', 7, '이벤트 배너/썸네일 이미지 3개', 'admin01', CURRENT_TIMESTAMP, 'admin01', CURRENT_TIMESTAMP
);
