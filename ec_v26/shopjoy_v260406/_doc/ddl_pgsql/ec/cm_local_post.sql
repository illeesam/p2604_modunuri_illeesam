-- cm_local_post 테이블 DDL
-- 동네 글 (알바/과외/레슨 JOB · 부동산 REALTY · 중고차 CAR · 스토리 STORY) — 2026-10-04 신규 (migration_20261004_dm_local.sql)
-- 상태: ACTIVE ↔ RESERVED ↔ CLOSED, HIDDEN(관리자 숨김). 종류별 나머지 값은 attr_json. 사진은 cm_local_attach(ref_type_cd=LOCAL_POST)

CREATE TABLE shopjoy_2604.cm_local_post (
    local_post_id          VARCHAR(21)   NOT NULL CONSTRAINT cm_local_post_pk_local_post_id PRIMARY KEY,
    site_id                VARCHAR(21)   NOT NULL,
    post_kind_cd           VARCHAR(20)   NOT NULL,
    post_status_cd         VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    post_status_cd_before  VARCHAR(20),
    member_id              VARCHAR(21)   NOT NULL,
    member_nm              VARCHAR(100),
    title                  VARCHAR(200)  NOT NULL,
    content                TEXT,
    town                   VARCHAR(50),
    addr                   VARCHAR(200),
    price_amt              BIGINT,
    price_nego_yn          VARCHAR(1)    DEFAULT 'N',
    job_kind_cd            VARCHAR(20),
    pay_type_cd            VARCHAR(20),
    pay_amt                BIGINT,
    realty_kind_cd         VARCHAR(20),
    deal_type_cd           VARCHAR(20),
    deposit_amt            BIGINT,
    monthly_rent_amt       BIGINT,
    sale_amt               BIGINT,
    area_m2                NUMERIC(10,2),
    maker_cd               VARCHAR(20),
    model_nm               VARCHAR(100),
    model_year             INTEGER,
    mileage_km             INTEGER,
    attr_json              TEXT,
    thumb_url              TEXT,
    view_cnt               INTEGER       DEFAULT 0,
    hidden_reason          VARCHAR(200),
    close_date             TIMESTAMP,
    reg_by                 VARCHAR(30),
    reg_date               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30),
    upd_date               TIMESTAMP,
    reg_site_id            VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_local_post IS '동네 글 (알바·부동산·중고차·스토리)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.local_post_id IS '동네글ID (LOP+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.post_kind_cd IS '글 종류 (코드: DM_POST_KIND — JOB 알바·과외·레슨/REALTY 부동산/CAR 중고차/STORY 스토리)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.post_status_cd IS '상태 (코드: DM_POST_STATUS — ACTIVE 모집중·판매중/RESERVED 예약중/CLOSED 마감·거래완료/HIDDEN 숨김)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.post_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.member_id IS '작성 회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.member_nm IS '작성 회원명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.title IS '제목';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.content IS '내용';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.town IS '동네';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.addr IS '상세 주소';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.price_amt IS '대표 금액 (정렬·가격 조건용 — JOB 급여 / REALTY 매매가·보증금·월세 / CAR 가격)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.price_nego_yn IS '금액 협의 가능 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.job_kind_cd IS '알바 종류 (코드: DM_JOB_KIND — ALBA/TUTOR/LESSON)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.pay_type_cd IS '급여 종류 (코드: DM_PAY_TYPE — HOURLY/DAILY/MONTHLY/PER_JOB)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.pay_amt IS '급여 금액';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.realty_kind_cd IS '매물 종류 (코드: DM_REALTY_KIND)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.deal_type_cd IS '거래 종류 (코드: DM_REALTY_DEAL — MONTHLY 월세/JEONSE 전세/SALE 매매)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.deposit_amt IS '보증금';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.monthly_rent_amt IS '월세';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.sale_amt IS '매매가';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.area_m2 IS '전용 면적(m2)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.maker_cd IS '제조사 (코드: DM_CAR_MAKER)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.model_nm IS '모델명';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.model_year IS '연식';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.mileage_km IS '주행거리(km)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.attr_json IS '종류별 나머지 속성 (JSON 객체)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.thumb_url IS '대표 썸네일 URL (첫 사진, 목록용 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.view_cnt IS '조회수';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.hidden_reason IS '숨김 사유 (관리자)';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.close_date IS '마감·거래완료 일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_post.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX cm_local_post_ix01_site_kind_status ON shopjoy_2604.cm_local_post USING btree (site_id, post_kind_cd, post_status_cd, reg_date DESC);
CREATE INDEX cm_local_post_ix02_member ON shopjoy_2604.cm_local_post USING btree (member_id, reg_date DESC);
CREATE INDEX cm_local_post_ix03_site_town ON shopjoy_2604.cm_local_post USING btree (site_id, town);
