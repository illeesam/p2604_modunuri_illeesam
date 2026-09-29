-- mb_seller_member 테이블 DDL
-- 판매자 소속 계정 (mb_member/sy_user 어느 쪽이든 연결되는 통합 브릿지, N:M)

CREATE TABLE shopjoy_2604.mb_seller_member (
    seller_member_id VARCHAR(21) NOT NULL CONSTRAINT mb_seller_member_pk_seller_member_id PRIMARY KEY,
    seller_id        VARCHAR(21) NOT NULL,
    member_id        VARCHAR(21) ,
    user_id          VARCHAR(21) ,
    role_cd          VARCHAR(20) ,
    is_main          CHAR(1)     ,
    is_default       CHAR(1)     ,
    status_cd        VARCHAR(20) ,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT now(),
    reg_site_id      VARCHAR(21) ,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    CONSTRAINT mb_seller_member_fk_seller_id FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id),
    CONSTRAINT mb_seller_member_fk2_member_id FOREIGN KEY (member_id) REFERENCES shopjoy_2604.mb_member (member_id),
    CONSTRAINT mb_seller_member_fk3_user_id FOREIGN KEY (user_id) REFERENCES shopjoy_2604.sy_user (user_id),
    CONSTRAINT chk_mb_seller_member_actor CHECK ((member_id IS NOT NULL) <> (user_id IS NOT NULL)),
    CONSTRAINT uq_mb_seller_member_member UNIQUE (member_id, seller_id),
    CONSTRAINT uq_mb_seller_member_user UNIQUE (user_id, seller_id)
);

COMMENT ON TABLE  shopjoy_2604.mb_seller_member IS '판매자 소속 계정 (mb_member/sy_user 어느 쪽이든 연결되는 통합 브릿지)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.seller_member_id IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.seller_id IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.member_id IS 'FO 회원ID (mb_member.member_id) — user_id와 정확히 하나만 채움';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.user_id IS 'BO 직원ID (sy_user.user_id) — member_id와 정확히 하나만 채움';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.role_cd IS '역할 (OWNER=대표 / STAFF=실무자)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.is_main IS '그 셀러의 대표 담당자 여부 Y/N (셀러당 1명 권장)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.is_default IS '로그인 계정 기준 기본(활성) 셀러 여부 Y/N (계정당 1개만 Y)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_member.status_cd IS '연결 상태 (ACTIVE/REMOVED)';

CREATE INDEX mb_seller_member_ix01_seller_id ON shopjoy_2604.mb_seller_member USING btree (seller_id);
CREATE INDEX mb_seller_member_ix02_member_id ON shopjoy_2604.mb_seller_member USING btree (member_id);
CREATE INDEX mb_seller_member_ix03_user_id ON shopjoy_2604.mb_seller_member USING btree (user_id);
CREATE UNIQUE INDEX mb_seller_member_ux01_default_member ON shopjoy_2604.mb_seller_member (member_id) WHERE is_default = 'Y' AND member_id IS NOT NULL;
CREATE UNIQUE INDEX mb_seller_member_ux02_default_user ON shopjoy_2604.mb_seller_member (user_id) WHERE is_default = 'Y' AND user_id IS NOT NULL;
