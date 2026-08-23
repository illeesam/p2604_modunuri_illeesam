-- md_cb_pattern 테이블 DDL
-- 코바늘 도안 마스터

CREATE TABLE shopjoy_2604.md_cb_pattern (
    pattern_id        VARCHAR(21)  NOT NULL CONSTRAINT md_cb_pattern_pk_pattern_id PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    reg_site_id       VARCHAR(21)  NOT NULL,
    member_id         VARCHAR(21),
    pattern_nm        VARCHAR(200) NOT NULL,
    pattern_desc      VARCHAR(500),
    row_count         INTEGER      DEFAULT 0,
    max_stitch_count  INTEGER      DEFAULT 0,
    desc_text         TEXT,
    thumbnail_url     VARCHAR(500),
    pattern_status_cd VARCHAR(20)  DEFAULT 'DRAFT',
    use_yn            VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.md_cb_pattern IS '코바늘 도안 마스터';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.pattern_id IS '도안ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.member_id IS '작성 회원ID (mb_member.member_id, NULL=관리자 작성)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.pattern_nm IS '도안명';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.pattern_desc IS '도안 설명';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.row_count IS '총 단수 (격자 세로 길이)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.max_stitch_count IS '최대 코수 (격자 가로 길이)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.desc_text IS '격자로부터 생성된 한글 도안 설명 (자동생성 결과 캐시, 저장 시 갱신)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.thumbnail_url IS '썸네일 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.pattern_status_cd IS '상태 — CB_PATTERN_STATUS_CD {DRAFT:작성중, PUBLISHED:공개, PRIVATE:비공개}';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.use_yn IS '사용여부 Y/N (삭제 대체 플래그)';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.md_cb_pattern.upd_date IS '수정일';

CREATE INDEX md_cb_pattern_ix01_member_id ON shopjoy_2604.md_cb_pattern USING btree (member_id);
CREATE INDEX md_cb_pattern_ix02_pattern_status_cd ON shopjoy_2604.md_cb_pattern USING btree (pattern_status_cd);
