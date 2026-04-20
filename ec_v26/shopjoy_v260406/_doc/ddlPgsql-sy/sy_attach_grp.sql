-- ============================================================
-- sy_attach_grp : 첨부파일 그룹 / sy_attach : 첨부파일
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================

CREATE TABLE sy_attach_grp (
    attach_grp_id   VARCHAR(21)     NOT NULL,
    attach_grp_code VARCHAR(50)     NOT NULL,              -- 고유 코드 (PROD_IMG, MEMBER_DOC, INQUIRY_FILE 등)
    attach_grp_nm   VARCHAR(100)    NOT NULL,              -- 그룹명
    file_ext_allow  VARCHAR(200),                           -- 허용 확장자 (쉼표 구분: jpg,png,gif,pdf)
    max_file_size   BIGINT          DEFAULT 5242880,        -- 최대 파일 크기 (기본 5MB)
    max_file_count  INTEGER         DEFAULT 10,             -- 최대 파일 수
    storage_path    VARCHAR(300),                           -- 저장 경로 (예: /products/images, /members/documents)
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    attach_grp_remark VARCHAR(500),                            -- 비고/설명
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (attach_grp_id),
    UNIQUE (attach_grp_code)
);

COMMENT ON TABLE  sy_attach_grp              IS '첨부파일 그룹 (용도별 분류)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_id IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_attach_grp.attach_grp_code IS '그룹 고유 코드 (sy_attach의 외래키)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_nm  IS '그룹명 (예: 상품 이미지, 회원 증명서)';
COMMENT ON COLUMN sy_attach_grp.file_ext_allow IS '허용 파일 확장자 (쉼표 구분, NULL=모든 확장자 허용)';
COMMENT ON COLUMN sy_attach_grp.max_file_size  IS '최대 파일 크기 (바이트, 기본 5MB=5242880)';
COMMENT ON COLUMN sy_attach_grp.max_file_count IS '최대 파일 개수 (기본 10개)';
COMMENT ON COLUMN sy_attach_grp.storage_path   IS '저장 경로 (예: /ec/products/images, /sy/members/docs)';
COMMENT ON COLUMN sy_attach_grp.use_yn         IS '사용여부 Y/N';
COMMENT ON COLUMN sy_attach_grp.sort_ord       IS '정렬순서';
COMMENT ON COLUMN sy_attach_grp.attach_grp_remark IS '비고 (용도 설명, 주의사항 등)';
COMMENT ON COLUMN sy_attach_grp.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach_grp.reg_date       IS '등록일';
COMMENT ON COLUMN sy_attach_grp.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach_grp.upd_date       IS '수정일';

-- 그룹 예시:
-- attach_grp_code='PROD_IMG', attach_grp_nm='상품 이미지', file_ext_allow='jpg,jpeg,png,gif', max_file_size=10485760 (10MB)
-- attach_grp_code='MEMBER_ID', attach_grp_nm='회원 신분증', file_ext_allow='jpg,png,pdf', max_file_size=5242880 (5MB)
-- attach_grp_code='INQUIRY_FILE', attach_grp_nm='고객문의 첨부', file_ext_allow='jpg,png,pdf,doc,docx,xls,xlsx', max_file_size=52428800 (50MB)
-- attach_grp_code='CLAIM_EVIDENCE', attach_grp_nm='클레임 증거', file_ext_allow='jpg,png,pdf,mp4,mov', max_file_size=104857600 (100MB)
-- attach_grp_code='DLIV_PROOF', attach_grp_nm='배송 증명', file_ext_allow='jpg,png,pdf', max_file_size=5242880 (5MB)
