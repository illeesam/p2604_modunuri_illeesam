-- zd_meta_snapshot 테이블 DDL
-- DB메타 — 스키마 스냅샷 (운영지원 > DB메타관리 > 스키마변경이력)
-- 저장 시점의 테이블·컬럼 정의 전체를 JSON 으로 남겨 두고, 다른 시점(또는 현재 DB)과 비교해
-- 추가·삭제·타입변경·이름변경(추정)을 찾아낸다. 컬럼명을 바꿨는데 쿼리에 반영 안 된 경우를 잡는 용도.

CREATE TABLE shopjoy_2604.zd_meta_snapshot (
    snapshot_id    VARCHAR(21)  NOT NULL CONSTRAINT zd_meta_snapshot_pk_snapshot_id PRIMARY KEY,
    reg_site_id    VARCHAR(21)  NOT NULL,
    snapshot_nm    VARCHAR(200) NOT NULL,
    schema_nm      VARCHAR(50)  NOT NULL DEFAULT 'shopjoy_2604'::character varying,
    table_cnt      INTEGER     ,
    column_cnt     INTEGER     ,
    snapshot_json  TEXT         NOT NULL,
    snapshot_desc  VARCHAR(500),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.zd_meta_snapshot IS 'DB메타 스키마 스냅샷';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.snapshot_id IS '스냅샷ID (MES+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.reg_site_id IS '등록 사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.snapshot_nm IS '스냅샷명 예: 2026-10-03 배포 전';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.schema_nm IS '대상 스키마명';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.table_cnt IS '테이블 수(뷰 포함)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.column_cnt IS '컬럼 수';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.snapshot_json IS '테이블·컬럼 정의 JSON — [{t:테이블명, k:유형, c:코멘트, cols:[{n:컬럼명, ty:타입, nn:NOT NULL, df:기본값, c:코멘트, pk:PK}]}]';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.snapshot_desc IS '메모';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.zd_meta_snapshot.upd_date IS '수정일시';

CREATE INDEX zd_meta_snapshot_ix01_reg_date ON shopjoy_2604.zd_meta_snapshot USING btree (reg_date DESC);
