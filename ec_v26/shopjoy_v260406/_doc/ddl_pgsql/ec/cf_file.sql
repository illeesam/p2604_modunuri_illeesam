-- cf_file — EcCdnApi 가 관리하는 파일 메타데이터. EcAdminApi 의 sy_attach 와는 완전히 독립된
-- 별도 도메인이다(2026-09-06 결정: EcCdnApi 전용 DB 테이블). file_path/thumbnail_path/frame_path
-- 는 전부 EcCdnApi 의 storage-root(app.cf.storage-root) 기준 상대경로.
CREATE TABLE IF NOT EXISTS cf_file (
    file_id             VARCHAR(20)   NOT NULL,
    orig_file_nm        VARCHAR(300)  NOT NULL,
    file_path           VARCHAR(300)  NOT NULL,   -- 원본 저장 상대경로
    thumbnail_path       VARCHAR(300),             -- 썸네일 상대경로(없으면 NULL — 이미지는 요청 시만, 동영상은 항상 시도)
    frame_path          VARCHAR(300),             -- 동영상 첫 프레임(미리보기) 상대경로(동영상 아니면 NULL)
    file_size           BIGINT        NOT NULL,
    content_type        VARCHAR(100),
    media_type_cd       VARCHAR(10)   NOT NULL,   -- IMAGE / VIDEO / FILE
    uploader_client_id  VARCHAR(40)   NOT NULL,
    use_yn              VARCHAR(1)    NOT NULL DEFAULT 'Y',
    reg_by              VARCHAR(40),   -- 등록자(보통 uploader_client_id 와 동일값 — 업로드 요청자)
    reg_date            TIMESTAMP     NOT NULL DEFAULT now(),
    upd_by              VARCHAR(40),   -- 수정자
    upd_date            TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_cf_file PRIMARY KEY (file_id),
    CONSTRAINT fk_cf_file_uploader FOREIGN KEY (uploader_client_id) REFERENCES cf_client (client_id)
);

CREATE INDEX IF NOT EXISTS ix_cf_file_uploader ON cf_file (uploader_client_id);
CREATE INDEX IF NOT EXISTS ix_cf_file_media_type ON cf_file (media_type_cd);

COMMENT ON TABLE  cf_file                      IS 'EcCdnApi 파일 메타데이터';
COMMENT ON COLUMN cf_file.file_id              IS '파일 ID (CF+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cf_file.orig_file_nm         IS '업로드 당시 원본 파일명';
COMMENT ON COLUMN cf_file.file_path            IS '원본 저장 상대경로(storage-root 기준)';
COMMENT ON COLUMN cf_file.thumbnail_path       IS '썸네일 상대경로(없으면 NULL)';
COMMENT ON COLUMN cf_file.frame_path           IS '동영상 첫 프레임 이미지 상대경로(동영상 아니면 NULL)';
COMMENT ON COLUMN cf_file.file_size            IS '파일 크기(byte)';
COMMENT ON COLUMN cf_file.content_type         IS 'MIME 타입';
COMMENT ON COLUMN cf_file.media_type_cd        IS '미디어 유형 IMAGE/VIDEO/FILE';
COMMENT ON COLUMN cf_file.uploader_client_id   IS '업로드 요청한 내부 클라이언트(cf_client.client_id)';
COMMENT ON COLUMN cf_file.use_yn               IS '사용여부 Y/N(논리 삭제용 — 실제 삭제는 물리삭제가 기본)';
COMMENT ON COLUMN cf_file.reg_by               IS '등록자';
COMMENT ON COLUMN cf_file.reg_date             IS '등록일시';
COMMENT ON COLUMN cf_file.upd_by               IS '수정자';
COMMENT ON COLUMN cf_file.upd_date             IS '수정일시';
