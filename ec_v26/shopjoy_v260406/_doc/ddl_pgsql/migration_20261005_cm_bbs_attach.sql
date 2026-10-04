-- ═══════════════════════════════════════════════════════════════════════════
--  통합게시판 — 글 첨부 전용 테이블(cm_bbs_attach) + 게시판 첨부 방식 설정 + 비회원 글쓰기(글 비밀번호)
--  작성일: 2026-10-05
--
--  배경(사용자 요청):
--   · "cm_bbs_attach 테이블 추가하여 파일추가 있는 곳은 적용해줘 / 파일 Controller 전용으로 만들어주고 화면 컴포넌트도 전용으로"
--   · "통합게시판에 대체로 첨부란 넣어줘 / 목록 또는 단건 이런식으로"
--   · "비로그인사용자도 등록할수 있는 자유게시판 넣어줘 / 로그인 안했으면 글비밀번호 입력을 받게하고 수정이나 삭제할때 입력하게"
--
--  지금까지: 게시글 첨부는 공통 첨부(sy_attach, ref_table_nm = 'cm_bbs', ref_id = bbs_id)에 붙는 구조였지만 FO 글쓰기에 첨부 칸이 없어
--            실제 데이터는 0건(2026-10-05 조회). cm_bbm 에는 첨부 허용 Y/N(allow_attach)만 있고 방식·개수·용량·확장자는 없다.
--            공통코드 BBM_ATTACH_TYPE(NONE 불가 / ONE 1개 / TWO 2개 / THREE 3개 / LIST 목록)는 이미 있으나 쓰는 컬럼이 없었다.
--
--  이 파일이 하는 일 (전부 다시 실행해도 안전 — IF NOT EXISTS / NOT EXISTS / 값이 비어 있을 때만 채움):
--   1) cm_bbs_attach 신설 — 글 첨부 전용. 임시 업로드(bbs_id NULL) → 글 저장 때 글에 연결. 본문 그림(EDITOR_IMG)도 여기에 남긴다.
--   2) 공통코드 BBS_ATTACH_TYPE_CD (FILE 파일 / IMAGE 그림 / EDITOR_IMG 본문 그림)
--   3) cm_bbm 컬럼 추가 — attach_type_cd(기존 코드 BBM_ATTACH_TYPE: NONE/ONE/LIST 를 쓴다. ONE = 단건형, LIST = 목록형),
--      attach_max_cnt(최대 개수), attach_max_mb(파일당 MB), attach_ext(허용 확장자, 쉼표), guest_write_yn(비회원 글쓰기 허용)
--   4) cm_bbs·cm_bbs_reply 컬럼 추가 — writer_pwd_hash(비회원 글 비밀번호 BCrypt 해시. 상품평 pd_review.writer_pwd_hash 와 같은 이름·방식)
--      비회원 작성자 이름은 기존 author_nm 에 넣는다(member_id 가 NULL 이면 비회원 글).
--   5) 기존 게시판(SI260006 통합게시판1 · SI260004 홈페이지1) 첨부 방식 기본값 + allow_attach 맞춤
--   6) 기존 게시글 첨부(sy_attach, ref_table_nm = 'cm_bbs') → cm_bbs_attach 복사 (지금은 0건. sy_attach 행은 지우지 않는다)
--
--  규칙:
--   · PK 는 CmUtil.generateId 규칙(접두어 + yyMMddHHmmss + 4자리): cm_bbs_attach = BBA…
--   · reg_site_id 는 감사 필드(EntitySaveListener 가 채움) — 사이트 관계·조건은 site_id 로만(정책 sy.57 §12)
--   · 비회원 게시판(새 게시판 FREE_GUEST "누구나 게시판")과 메뉴는 DDL 이 아니라 시드(ecFeFoNuxt4 scripts/seed/bbm-seed.mjs → BO API)로 넣는다.
--
--  실행 순서: 이 파일 실행 → ecBeBo(엔티티 CmBbsAttach·CmBbm/CmBbs 새 컬럼) 배포 → FO 배포 → 시드.
--   ※ 컬럼 추가뿐이라 지금 배포된 백엔드는 그대로 동작한다(먼저 실행해도 안전).
--  롤백: 맨 아래 "되돌리기" 블록(주석 해제 후 실행)
-- ═══════════════════════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) cm_bbs_attach — 게시글 첨부
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_bbs_attach (
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

CREATE INDEX IF NOT EXISTS cm_bbs_attach_ix01_bbs_id_sort_ord ON shopjoy_2604.cm_bbs_attach USING btree (bbs_id, sort_ord);
CREATE INDEX IF NOT EXISTS cm_bbs_attach_ix02_site_id_bbm_id  ON shopjoy_2604.cm_bbs_attach USING btree (site_id, bbm_id);
-- 임시 업로드(글에 안 붙은 것) 정리 배치용
CREATE INDEX IF NOT EXISTS cm_bbs_attach_ix03_temp_reg_date   ON shopjoy_2604.cm_bbs_attach USING btree (reg_date) WHERE bbs_id IS NULL;

-- ───────────────────────────────────────────────────────────
-- 2) 공통코드 BBS_ATTACH_TYPE_CD
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT 'CG261005100001', 'BBS_ATTACH_TYPE_CD', '게시글첨부구분', 'system.bbm.bbs_attach',
       '게시글 첨부 구분 (cm_bbs_attach.attach_type_cd) — FILE 파일 / IMAGE 그림 / EDITOR_IMG 본문 그림',
       'Y', 'MIGRATION_20261005', NOW(), 'SI260001'
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp = 'BBS_ATTACH_TYPE_CD')
  AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261005100001');

INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, 1, g.code_grp_id, 'MIGRATION_20261005', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261005100001', 'FILE',       '파일',      1, '내려받는 첨부 파일'),
        ('CD261005100002', 'IMAGE',      '그림',      2, '첨부 그림 — 글 아래에 그림으로 보이고 사진첩 대표 그림으로 쓴다'),
        ('CD261005100003', 'EDITOR_IMG', '본문 그림', 3, 'HTML 에디터로 본문에 넣은 그림 (첨부 목록에는 보이지 않는다)')
       ) AS v(code_id, code_value, code_label, sort_ord, code_remark)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = 'BBS_ATTACH_TYPE_CD'
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- ───────────────────────────────────────────────────────────
-- 3) cm_bbm — 첨부 방식 설정 + 비회원 글쓰기 허용
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_bbm ADD COLUMN IF NOT EXISTS attach_type_cd VARCHAR(20);
ALTER TABLE shopjoy_2604.cm_bbm ADD COLUMN IF NOT EXISTS attach_max_cnt INTEGER;
ALTER TABLE shopjoy_2604.cm_bbm ADD COLUMN IF NOT EXISTS attach_max_mb  INTEGER;
ALTER TABLE shopjoy_2604.cm_bbm ADD COLUMN IF NOT EXISTS attach_ext     VARCHAR(200);
ALTER TABLE shopjoy_2604.cm_bbm ADD COLUMN IF NOT EXISTS guest_write_yn VARCHAR(1) DEFAULT 'N';

COMMENT ON COLUMN shopjoy_2604.cm_bbm.attach_type_cd IS '첨부 방식 (코드: BBM_ATTACH_TYPE — NONE 불가 / ONE 단건(파일 하나) / LIST 목록(여러 파일). TWO·THREE 는 목록형 2·3개)';
COMMENT ON COLUMN shopjoy_2604.cm_bbm.attach_max_cnt IS '첨부 최대 개수 (목록형. NULL = 기본 5, 단건형은 1)';
COMMENT ON COLUMN shopjoy_2604.cm_bbm.attach_max_mb IS '첨부 파일당 최대 크기 MB (NULL = 기본 20)';
COMMENT ON COLUMN shopjoy_2604.cm_bbm.attach_ext IS '허용 확장자 (쉼표 구분 소문자, 예: jpg,png,pdf. NULL = 서버 기본 목록)';
COMMENT ON COLUMN shopjoy_2604.cm_bbm.guest_write_yn IS '비회원 글쓰기 허용 Y/N — Y 면 로그인하지 않아도 이름 + 글 비밀번호로 글을 쓴다';

-- 3-1) 기존 게시판 기본값 (attach_type_cd 가 비어 있는 행만 — 다시 실행해도 BO 에서 바꾼 값은 건드리지 않는다)
--      게시판 성격별: 사진첩 = 목록(그림만, 10개) · 영상 = 단건(영상) · 블로그(홈페이지1) = 단건(대표 그림)
--                     페이지 게시판(PAGE_*)·FAQ = 없음(본문 그림은 에디터로) · 자료실 = 목록 5개(50MB) · 그 밖의 글 게시판 = 목록 5개(20MB)
UPDATE shopjoy_2604.cm_bbm b
   SET attach_type_cd = v.attach_type_cd,
       attach_max_cnt = v.attach_max_cnt,
       attach_max_mb  = v.attach_max_mb,
       attach_ext     = v.attach_ext,
       upd_by = 'MIGRATION_20261005', upd_date = NOW()
  FROM (
        SELECT x.bbm_id,
               CASE WHEN x.bbm_code LIKE 'PAGE\_%' OR x.bbm_type_cd = 'FAQ'        THEN 'NONE'
                    WHEN x.bbm_code = 'GALLERY_VIDEO'                              THEN 'ONE'
                    WHEN x.bbm_code = 'GALLERY_BLOG'                               THEN 'ONE'
                    ELSE 'LIST' END                                                AS attach_type_cd,
               CASE WHEN x.bbm_code LIKE 'PAGE\_%' OR x.bbm_type_cd = 'FAQ'        THEN NULL
                    WHEN x.bbm_code IN ('GALLERY_VIDEO', 'GALLERY_BLOG')           THEN 1
                    WHEN x.bbm_code LIKE 'GALLERY\_%'                              THEN 10
                    ELSE 5 END                                                     AS attach_max_cnt,
               CASE WHEN x.bbm_code LIKE 'PAGE\_%' OR x.bbm_type_cd = 'FAQ'        THEN NULL
                    WHEN x.bbm_code = 'GALLERY_VIDEO'                              THEN 100
                    WHEN x.bbm_code LIKE 'DATA%'                                   THEN 50
                    ELSE 20 END                                                    AS attach_max_mb,
               CASE WHEN x.bbm_code = 'GALLERY_VIDEO'                              THEN 'mp4,webm,mov'
                    WHEN x.bbm_code LIKE 'GALLERY\_%'                              THEN 'jpg,jpeg,png,gif,webp'
                    ELSE NULL END                                                  AS attach_ext
          FROM shopjoy_2604.cm_bbm x
         WHERE x.site_id IN ('SI260006', 'SI260004')
           AND x.attach_type_cd IS NULL
       ) v
 WHERE b.bbm_id = v.bbm_id;

-- 그 밖의 사이트 게시판: 지금 첨부 허용 값 그대로(Y = 목록 5개, 그 외 = 없음)
UPDATE shopjoy_2604.cm_bbm
   SET attach_type_cd = CASE WHEN allow_attach = 'Y' THEN 'LIST' ELSE 'NONE' END,
       attach_max_cnt = CASE WHEN allow_attach = 'Y' THEN 5 ELSE NULL END,
       attach_max_mb  = CASE WHEN allow_attach = 'Y' THEN 20 ELSE NULL END
 WHERE attach_type_cd IS NULL;

ALTER TABLE shopjoy_2604.cm_bbm ALTER COLUMN attach_type_cd SET DEFAULT 'NONE';
UPDATE shopjoy_2604.cm_bbm SET guest_write_yn = 'N' WHERE guest_write_yn IS NULL;

-- 3-2) 첨부 허용 Y/N(allow_attach)은 첨부 방식에 맞춘다 (옛 화면·API 가 보는 값)
UPDATE shopjoy_2604.cm_bbm
   SET allow_attach = CASE WHEN attach_type_cd = 'NONE' THEN 'N' ELSE 'Y' END
 WHERE COALESCE(allow_attach, '') <> CASE WHEN attach_type_cd = 'NONE' THEN 'N' ELSE 'Y' END;

-- ───────────────────────────────────────────────────────────
-- 4) cm_bbs · cm_bbs_reply — 비회원 글 비밀번호
-- ───────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_bbs       ADD COLUMN IF NOT EXISTS writer_pwd_hash VARCHAR(100);
ALTER TABLE shopjoy_2604.cm_bbs_reply ADD COLUMN IF NOT EXISTS writer_pwd_hash VARCHAR(100);

COMMENT ON COLUMN shopjoy_2604.cm_bbs.writer_pwd_hash IS '글 비밀번호 해시 (BCrypt, 비회원 글의 수정·삭제 확인용 — 평문 저장 금지. 회원 글은 NULL). 비회원 이름은 author_nm';
COMMENT ON COLUMN shopjoy_2604.cm_bbs_reply.writer_pwd_hash IS '댓글 비밀번호 해시 (BCrypt, 비회원 댓글의 삭제 확인용 — 평문 저장 금지. 회원 댓글은 NULL). 비회원 이름은 author_nm';

-- ───────────────────────────────────────────────────────────
-- 5) 기존 게시글 첨부(sy_attach) → cm_bbs_attach 복사 (2026-10-05 기준 0건 — 있으면 옮긴다. sy_attach 행은 그대로 둔다)
--    ID: 'BBA' + sy_attach.attach_id 의 접두어(AT) 뒤 16자리 → 같은 첨부를 다시 복사하지 않는다
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.cm_bbs_attach
       (bbs_attach_id, site_id, bbm_id, bbs_id, attach_type_cd, file_nm, file_ext, file_size, mime_type, cdn_url, thumb_url, file_path,
        sort_ord, down_cnt, use_yn, member_id, reg_by, reg_date, upd_by, upd_date, reg_site_id)
SELECT 'BBA' || substring(a.attach_id FROM 3),
       COALESCE(s.site_id, m.site_id), s.bbm_id, s.bbs_id,   -- 글에 사이트가 비어 있으면 게시판의 사이트
       CASE WHEN lower(COALESCE(a.file_ext, '')) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg') THEN 'IMAGE' ELSE 'FILE' END,
       a.file_nm, lower(a.file_ext), a.file_size, a.mime_type_cd,
       COALESCE(a.cdn_img_url, a.attach_url), COALESCE(a.thumb_cdn_url, a.cdn_thumb_url, a.thumb_url), a.storage_path,
       COALESCE(a.sort_ord, 0), 0, 'Y', s.member_id, a.reg_by, a.reg_date, 'MIGRATION_20261005', NOW(), a.reg_site_id
  FROM shopjoy_2604.sy_attach a
  JOIN shopjoy_2604.cm_bbs s ON s.bbs_id = a.ref_id
  JOIN shopjoy_2604.cm_bbm m ON m.bbm_id = s.bbm_id
 WHERE a.ref_table_nm = 'cm_bbs'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_bbs_attach t WHERE t.bbs_attach_id = 'BBA' || substring(a.attach_id FROM 3));

-- ───────────────────────────────────────────────────────────
-- 확인
-- ───────────────────────────────────────────────────────────
-- SELECT site_id, bbm_code, bbm_nm, allow_attach, attach_type_cd, attach_max_cnt, attach_max_mb, attach_ext, guest_write_yn
--   FROM shopjoy_2604.cm_bbm WHERE site_id IN ('SI260006', 'SI260004') ORDER BY site_id, sort_ord;
-- SELECT count(*) FROM shopjoy_2604.cm_bbs_attach;
-- SELECT c.code_value, c.code_label FROM shopjoy_2604.sy_code c JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id WHERE g.code_grp = 'BBS_ATTACH_TYPE_CD' ORDER BY c.sort_ord;

-- ═══════════════════════════════════════════════════════════════════════════
--  되돌리기 (새 백엔드를 배포했다면 먼저 이전 버전으로 다시 배포한 뒤)
--     DROP TABLE IF EXISTS shopjoy_2604.cm_bbs_attach;
--     DELETE FROM shopjoy_2604.sy_code WHERE code_id BETWEEN 'CD261005100001' AND 'CD261005100003';
--     DELETE FROM shopjoy_2604.sy_code_grp WHERE code_grp_id = 'CG261005100001';
--     ALTER TABLE shopjoy_2604.cm_bbm DROP COLUMN IF EXISTS attach_type_cd, DROP COLUMN IF EXISTS attach_max_cnt, DROP COLUMN IF EXISTS attach_max_mb,
--                                     DROP COLUMN IF EXISTS attach_ext, DROP COLUMN IF EXISTS guest_write_yn;
--     ALTER TABLE shopjoy_2604.cm_bbs DROP COLUMN IF EXISTS writer_pwd_hash;
--     ALTER TABLE shopjoy_2604.cm_bbs_reply DROP COLUMN IF EXISTS writer_pwd_hash;
--     (allow_attach 는 3-2 에서 바뀐 행이 있으면 BO 게시판관리에서 되돌린다)
-- ═══════════════════════════════════════════════════════════════════════════
