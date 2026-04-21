-- ============================================================================
-- sy_attach: 첨부파일 정보
-- ============================================================================
-- 용도: 모든 도메인에서 업로드된 파일 정보를 중앙에서 관리
-- 관련: sy_attach_grp (그룹 관리), 각 도메인의 외래키
-- ============================================================================

CREATE TABLE sy_attach (
    -- 기본 키 및 참조
    attach_id VARCHAR(21) PRIMARY KEY NOT NULL,                    -- 첨부파일 ID (YYMMDDhhmmss+random(4)+seq)
    site_id VARCHAR(21),                                           -- 사이트 ID (멀티사이트)
    attach_grp_id VARCHAR(21) NOT NULL,                            -- 파일 그룹 ID (sy_attach_grp.attach_grp_id)

    -- 파일 정보 - 원본
    file_nm VARCHAR(300) NOT NULL,                                 -- 원본 파일명 (예: review_video.mp4)
    file_size BIGINT,                                              -- 파일 크기 (바이트)
    file_ext VARCHAR(20),                                          -- 파일 확장자 (예: mp4, jpg, pdf)
    mime_type_cd VARCHAR(100),                                     -- MIME 타입 (예: video/mp4, image/jpeg)

    -- 저장 정보 - 서버 저장본
    stored_nm VARCHAR(300),                                        -- 저장된 파일명 (예: 20260421_143045_01_1234.mp4)
    storage_type VARCHAR(50),                                      -- 스토리지 타입 (LOCAL, AWS_S3, NCP_OBS)
    storage_path VARCHAR(500),                                     -- 저장 경로 (/cdn/review/2026/202604/20260421/...)

    -- CDN 정보 (클라우드 스토리지 사용 시)
    attach_url VARCHAR(500),                                       -- 첨부파일 전체 URL (CDN)
    cdn_host VARCHAR(100),                                         -- CDN 호스트 (https://cdn.shopjoy.com)
    cdn_img_url VARCHAR(500),                                      -- CDN 이미지 URL (이미지 최적화)

    -- 썸네일 정보 (이미지/동영상)
    thumb_file_nm VARCHAR(300),                                    -- 썸네일 원본 파일명
    thumb_stored_nm VARCHAR(300),                                  -- 썸네일 저장 파일명 (예: 20260421_143045_01_1234_thumb.jpg)
    thumb_url VARCHAR(500),                                        -- 썸네일 로컬 경로 (static/cdn/...)
    thumb_cdn_url VARCHAR(500),                                    -- 썸네일 CDN URL
    thumb_generated_yn VARCHAR(1) DEFAULT 'N',                     -- 썸네일 생성 여부 (Y/N, 동영상은 필수 Y)

    -- 메타 정보
    sort_ord INTEGER DEFAULT 0,                                    -- 정렬 순서
    attach_memo VARCHAR(300),                                      -- 비고

    -- 감사 추적
    reg_by VARCHAR(30),                                            -- 등록자 ID
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                  -- 등록일
    upd_by VARCHAR(30),                                            -- 수정자 ID
    upd_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP                   -- 수정일
);

-- 인덱스
CREATE INDEX idx_sy_attach_grp_id ON sy_attach(attach_grp_id);
CREATE INDEX idx_sy_attach_site_id ON sy_attach(site_id);
CREATE INDEX idx_sy_attach_file_ext ON sy_attach(file_ext);
CREATE INDEX idx_sy_attach_storage_type ON sy_attach(storage_type);
CREATE INDEX idx_sy_attach_reg_date ON sy_attach(reg_date);

-- 코멘트
COMMENT ON TABLE sy_attach IS '첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리';
COMMENT ON COLUMN sy_attach.attach_id IS '첨부파일 ID (YYMMDDhhmmss+random(4)+seq)';
COMMENT ON COLUMN sy_attach.attach_grp_id IS '파일 그룹 ID (sy_attach_grp과 연계)';
COMMENT ON COLUMN sy_attach.file_nm IS '원본 파일명';
COMMENT ON COLUMN sy_attach.stored_nm IS '저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)';
COMMENT ON COLUMN sy_attach.storage_type IS '스토리지 타입 (LOCAL/AWS_S3/NCP_OBS)';
COMMENT ON COLUMN sy_attach.storage_path IS '파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})';
COMMENT ON COLUMN sy_attach.thumb_generated_yn IS '썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택)';
