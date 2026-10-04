-- cm_bbs_attach 테이블 DDL
-- 게시글 첨부 (통합게시판 글 첨부 전용, 2026-10-05 신설 — migration_20261005_cm_bbs_attach.sql)

CREATE TABLE shopjoy_2604.cm_bbs_attach (
    bbs_attach_id   VARCHAR(21)  NOT NULL CONSTRAINT cm_bbs_attach_pk_bbs_attach_id PRIMARY KEY,
    site_id         VARCHAR(21)  NOT NULL,
    bbm_id          VARCHAR(21)  NOT NULL,
    bbs_id          VARCHAR(21) ,
    attach_type_cd  VARCHAR(20)  NOT NULL DEFAULT 'FILE',
    file_nm         VARCHAR(300) NOT NULL,
    file_ext        VARCHAR(20) ,
    file_size       BIGINT      ,
    mime_type       VARCHAR(100),
    cdn_url         VARCHAR(500),
    thumb_url       VARCHAR(500),
    file_path       VARCHAR(500),
    sort_ord        INTEGER      DEFAULT 0,
    down_cnt        INTEGER      DEFAULT 0,
    use_yn          VARCHAR(1)   DEFAULT 'Y',
    member_id       VARCHAR(21) ,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   ,
    reg_site_id     VARCHAR(21)
);

COMMENT ON TABLE  shopjoy_2604.cm_bbs_attach IS '게시글 첨부 (통합게시판 글 첨부 전용 — 첨부 파일·그림·본문 그림)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.bbs_attach_id IS '게시글첨부ID (BBA+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트 (게시판의 사이트)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.bbm_id IS '게시판ID (cm_bbm.bbm_id) — 업로드할 때 정해진다(게시판 설정으로 방식·개수·용량·확장자 검증)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.bbs_id IS '게시물ID (cm_bbs.bbs_id) — NULL 이면 임시 업로드(글 저장 전). 글을 저장할 때 연결한다';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.attach_type_cd IS '첨부 구분 (코드: BBS_ATTACH_TYPE_CD — FILE 파일 / IMAGE 그림 / EDITOR_IMG 본문 그림)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.file_nm IS '원래 파일명 (올린 사람의 파일 이름)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.file_ext IS '확장자 (소문자, 점 없음)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.file_size IS '파일 크기 (byte)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.mime_type IS 'MIME 유형 (예: image/png)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.cdn_url IS 'CDN 전체 주소 (https://…/api/cdn/SI26/<사이트ID>_<모듈>/attach/board/yyyy/MM/dd/…)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.thumb_url IS '썸네일 전체 주소 (그림일 때)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.file_path IS 'CDN 상대경로 (SI26/<사이트ID>_<모듈>/attach/board/yyyy/MM/dd/<저장 파일명>)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.sort_ord IS '정렬순서 (글 안에서 보이는 순서)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.down_cnt IS '내려받은 횟수';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.use_yn IS '사용여부 Y/N (N = 지운 첨부)';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.member_id IS '올린 회원ID (mb_member.member_id) — 관리자(BO)가 올린 것은 NULL, reg_by 에 사용자ID';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_attach.reg_site_id IS '등록 사이트ID (감사 필드 — 사이트 관계는 site_id)';

CREATE INDEX cm_bbs_attach_ix01_bbs_id_sort_ord ON shopjoy_2604.cm_bbs_attach USING btree (bbs_id, sort_ord);
CREATE INDEX cm_bbs_attach_ix02_site_id_bbm_id  ON shopjoy_2604.cm_bbs_attach USING btree (site_id, bbm_id);
-- 임시 업로드(글에 안 붙은 것) 정리 배치용
CREATE INDEX cm_bbs_attach_ix03_temp_reg_date   ON shopjoy_2604.cm_bbs_attach USING btree (reg_date) WHERE bbs_id IS NULL;
