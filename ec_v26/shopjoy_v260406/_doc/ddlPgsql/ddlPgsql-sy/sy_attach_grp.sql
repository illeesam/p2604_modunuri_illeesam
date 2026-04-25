-- ============================================================================
-- sy_attach_grp: 첨부파일 그룹
-- ============================================================================
-- 용도: 여러 첨부파일을 그룹으로 관리 (예: 리뷰에 여러 사진/동영상 첨부)
-- 관련: sy_attach (그룹의 파일들), ec_review, ec_qna 등 도메인 테이블
-- ============================================================================

CREATE TABLE sy_attach_grp (
    -- 기본 키
    attach_grp_id VARCHAR(21) PRIMARY KEY NOT NULL,                -- 파일 그룹 ID (ATG + timestamp + random)

    -- 그룹 정보
    attach_grp_code VARCHAR(50) NOT NULL,                          -- 그룹 코드 (businessCode + "_" + timestamp)
    attach_grp_nm VARCHAR(100) NOT NULL,                           -- 그룹 이름 (예: "review 파일 그룹", "product 파일 그룹")

    -- 정책 설정
    file_ext_allow VARCHAR(200),                                   -- 허용 확장자 (쉼표 구분, 예: jpg,jpeg,png,mp4)
    max_file_size BIGINT,                                          -- 최대 파일 크기 (바이트)
    max_file_count INTEGER,                                        -- 최대 파일 개수

    -- 저장소 정보
    storage_path VARCHAR(300),                                     -- 그룹 저장소 기본 경로 (선택사항)

    -- 상태 관리
    use_yn VARCHAR(1) DEFAULT 'Y',                                 -- 사용 여부 (Y/N)
    sort_ord INTEGER DEFAULT 0,                                    -- 정렬 순서

    -- 비고
    attach_grp_remark VARCHAR(500),                                -- 비고

    -- 감사 추적
    reg_by VARCHAR(30),                                            -- 등록자 ID
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                  -- 등록일
    upd_by VARCHAR(30),                                            -- 수정자 ID
    upd_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP                   -- 수정일
);

-- 인덱스
CREATE INDEX idx_sy_attach_grp_code ON sy_attach_grp(attach_grp_code);
CREATE INDEX idx_sy_attach_grp_use_yn ON sy_attach_grp(use_yn);
CREATE INDEX idx_sy_attach_grp_reg_date ON sy_attach_grp(reg_date);

-- 코멘트
COMMENT ON TABLE sy_attach_grp IS '첨부파일 그룹 - 여러 파일을 한 번에 관리하기 위한 그룹 단위';
COMMENT ON COLUMN sy_attach_grp.attach_grp_id IS '파일 그룹 ID (ATG + timestamp + random)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_code IS '그룹 코드 (businessCode + "_" + timestamp)';
COMMENT ON COLUMN sy_attach_grp.attach_grp_nm IS '그룹 이름 (사용자에게 표시되는 이름)';
COMMENT ON COLUMN sy_attach_grp.file_ext_allow IS '허용 확장자 목록';
COMMENT ON COLUMN sy_attach_grp.max_file_size IS '그룹 내 단일 파일 최대 크기';
COMMENT ON COLUMN sy_attach_grp.max_file_count IS '그룹 내 최대 파일 개수';
COMMENT ON COLUMN sy_attach_grp.use_yn IS '사용 여부 (Y/N)';
