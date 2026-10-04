-- ═══════════════════════════════════════════════════════════
--  당무마켓(danmoo1) 글쓰기 2차 — 동네 글·전문가 견적요청 테이블 6개 + 공통코드(DM_*) + BO 메뉴
--  작성일: 2026-10-04
--
--  배경:
--   사용자 요청 "글쓰기 메뉴(알바/과외/레슨, 부동산, 중고차, 동네생활, 스토리, 여러 물건 팔기, 내 물건 팔기, 전문가 견적요청) …
--   모든 데이터는 BO DB 데이터로 등록되어야 해". 1차(화면만)에 이어 실제 저장.
--    - cm_local_post   : 동네 글. 종류 JOB/REALTY/CAR/STORY, 상태 ACTIVE ↔ RESERVED ↔ CLOSED, HIDDEN(관리자 숨김).
--                        검색에 쓰는 값은 컬럼, 나머지 종류별 값은 attr_json.
--    - cm_local_attach : 사진·동영상(순서 sort_ord). 동네 글(LOCAL_POST)·견적요청(QUOTE_REQ)·전문가 분류 신청 증빙(EXPERT_CATE) 공용.
--    - cm_expert       : 전문가(사이트당 회원 1행). PENDING → APPROVED/REJECTED, APPROVED ↔ SUSPENDED.
--    - cm_expert_cate  : 전문가 서비스 분류 신청·심사. PENDING → APPROVED/REJECTED.
--    - cm_quote_req    : 견적요청. OPEN → CLOSED/CANCELED. 등록하면 그 분류가 승인된 전문가에게 알림(ap_fcm_noti QUOTE_REQ).
--    - cm_quote_bid    : 전문가 견적(요청당 전문가 1건). SENT → ACCEPTED(채팅방 연결)/DECLINED.
--   상품 사진 여러 장은 기존 pd_prod_img(sort_ord, is_thumb)를 그대로 쓴다 — 테이블 변경 없음.
--   PK 는 CmUtil.generateId 규칙(접두어 + yyMMddHHmmss + 4자리): LOP / LOA / EX / EXC / QUR / QUB.
--   reg_site_id 는 감사 필드(EntitySaveListener 가 채움), 사이트 관계는 각 테이블의 site_id 로만.
--   API 계약: ecBeBo _doc/32_동네글_전문가견적_API계약.md
--
--  전제(먼저 적용돼 있어야 하는 것 — run_all_20261004.py pre 의 앞 단계):
--    migration_20261004_chatt_trade.sql (cm_chatt.ref_type_cd·ref_id — 글·견적 채팅방, 동네 글 목록의 채팅 수),
--    migration_20261004_noti_rename.sql (ap_fcm_noti — 견적 알림). 이 파일 자체는 그 테이블들을 건드리지 않는다.
--    sy_code_grp.module_cd(migration_20261004_module_codes.sql)가 있으면 DM_* 그룹에 danmoo1 을 표시하고, 없으면 건너뛴다.
--
--  ID 대역: 코드그룹 CG261004300001~300022, 코드 CD261004300001~300148
--           (2026-10-04 조회: DB 에 CG261004%·CD261004% 없음. 같은 날 대기 중인 chatt_trade …0000xx, cm_meet …07xxxx,
--            module_cd …10xxxx, module_codes …20xxxx 대역과 겹치지 않는다)
--           BO 메뉴 MN000097~MN000100 (조회: 가장 큰 menu_id = MN000096)
-- ═══════════════════════════════════════════════════════════
--  사용법: 아래 스크립트 전체 실행 (재실행해도 안전 — IF NOT EXISTS / NOT EXISTS)
--  롤백: 맨 아래 "롤백" 블록 (주석 해제 후 실행)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) cm_local_post — 동네 글 (알바·부동산·중고차·스토리)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_local_post (
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

CREATE INDEX IF NOT EXISTS cm_local_post_ix01_site_kind_status ON shopjoy_2604.cm_local_post USING btree (site_id, post_kind_cd, post_status_cd, reg_date DESC);
CREATE INDEX IF NOT EXISTS cm_local_post_ix02_member ON shopjoy_2604.cm_local_post USING btree (member_id, reg_date DESC);
CREATE INDEX IF NOT EXISTS cm_local_post_ix03_site_town ON shopjoy_2604.cm_local_post USING btree (site_id, town);

-- ───────────────────────────────────────────────────────────
-- 2) cm_local_attach — 동네 글·견적요청·전문가 분류 신청의 사진/동영상
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_local_attach (
    local_attach_id  VARCHAR(21)   NOT NULL CONSTRAINT cm_local_attach_pk_local_attach_id PRIMARY KEY,
    site_id          VARCHAR(21)   NOT NULL,
    ref_type_cd      VARCHAR(20)   NOT NULL,
    ref_id           VARCHAR(21)   NOT NULL,
    attach_id        VARCHAR(21)   NOT NULL,
    media_type_cd    VARCHAR(20)   DEFAULT 'IMAGE',
    cdn_url          TEXT,
    cdn_thumb_url    TEXT,
    sort_ord         INTEGER,
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    reg_site_id      VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_local_attach IS '동네 글·견적요청·전문가 분류 신청의 사진/동영상';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.local_attach_id IS '동네첨부ID (LOA+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.ref_type_cd IS '연결 대상 유형 (LOCAL_POST 동네 글/QUOTE_REQ 견적요청/EXPERT_CATE 전문가 분류 신청)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.ref_id IS '연결 대상ID';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.attach_id IS '첨부파일ID (sy_attach.attach_id)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.media_type_cd IS '매체 종류 (IMAGE/VIDEO)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.cdn_url IS '원본 URL';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.cdn_thumb_url IS '썸네일 URL';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.sort_ord IS '정렬순서 (1부터)';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_local_attach.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX IF NOT EXISTS cm_local_attach_ix01_ref ON shopjoy_2604.cm_local_attach USING btree (ref_type_cd, ref_id, sort_ord);
CREATE INDEX IF NOT EXISTS cm_local_attach_ix02_attach ON shopjoy_2604.cm_local_attach USING btree (attach_id);

-- ───────────────────────────────────────────────────────────
-- 3) cm_expert — 전문가 (견적요청 대상 사업자)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_expert (
    expert_id                VARCHAR(21)   NOT NULL CONSTRAINT cm_expert_pk_expert_id PRIMARY KEY,
    site_id                  VARCHAR(21)   NOT NULL,
    member_id                VARCHAR(21)   NOT NULL,
    member_nm                VARCHAR(100),
    expert_nm                VARCHAR(100)  NOT NULL,
    biz_no                   VARCHAR(20),
    intro                    TEXT,
    area_towns               VARCHAR(500),
    contact_phone            VARCHAR(20),
    expert_status_cd         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    expert_status_cd_before  VARCHAR(20),
    review_by                VARCHAR(30),
    review_date              TIMESTAMP,
    review_reason            VARCHAR(300),
    reg_by                   VARCHAR(30),
    reg_date                 TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                   VARCHAR(30),
    upd_date                 TIMESTAMP,
    reg_site_id              VARCHAR(21)   NOT NULL,
    CONSTRAINT cm_expert_uk01_site_member UNIQUE (site_id, member_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_expert IS '전문가 (견적요청 대상 사업자)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_id IS '전문가ID (EX+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.member_nm IS '회원명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_nm IS '상호·활동명';
COMMENT ON COLUMN shopjoy_2604.cm_expert.biz_no IS '사업자등록번호';
COMMENT ON COLUMN shopjoy_2604.cm_expert.intro IS '소개';
COMMENT ON COLUMN shopjoy_2604.cm_expert.area_towns IS '활동 지역 (동네, 콤마 구분)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.contact_phone IS '연락처';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_status_cd IS '상태 (코드: DM_EXPERT_STATUS — PENDING 승인 대기/APPROVED 승인/REJECTED 반려/SUSPENDED 정지)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.expert_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_by IS '심사자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_date IS '심사 일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.review_reason IS '반려·정지 사유';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_expert.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX IF NOT EXISTS cm_expert_ix01_site_status ON shopjoy_2604.cm_expert USING btree (site_id, expert_status_cd);

-- ───────────────────────────────────────────────────────────
-- 4) cm_expert_cate — 전문가 서비스 분류 신청
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_expert_cate (
    expert_cate_id   VARCHAR(21)   NOT NULL CONSTRAINT cm_expert_cate_pk_expert_cate_id PRIMARY KEY,
    site_id          VARCHAR(21)   NOT NULL,
    expert_id        VARCHAR(21)   NOT NULL,
    category_cd      VARCHAR(30)   NOT NULL,
    sub_category_cd  VARCHAR(30),
    proof_memo       TEXT,
    cate_status_cd   VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    review_by        VARCHAR(30),
    review_date      TIMESTAMP,
    review_reason    VARCHAR(300),
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    reg_site_id      VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_expert_cate IS '전문가 서비스 분류 신청';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.expert_cate_id IS '전문가분류ID (EXC+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.expert_id IS '전문가ID (cm_expert.expert_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.category_cd IS '서비스 대분류 (코드: DM_QUOTE_CATE 1단계)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.sub_category_cd IS '서비스 세부 분류 (코드: DM_QUOTE_CATE 2단계, NULL=대분류 전체)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.proof_memo IS '증빙 메모 (경력·자격 등)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.cate_status_cd IS '심사 상태 (코드: DM_EXPERT_CATE_STATUS — PENDING 심사중/APPROVED 승인/REJECTED 반려)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_by IS '심사자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_date IS '심사 일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.review_reason IS '반려 사유';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_expert_cate.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX IF NOT EXISTS cm_expert_cate_ix01_expert ON shopjoy_2604.cm_expert_cate USING btree (expert_id);
CREATE INDEX IF NOT EXISTS cm_expert_cate_ix02_match ON shopjoy_2604.cm_expert_cate USING btree (site_id, category_cd, cate_status_cd);

-- ───────────────────────────────────────────────────────────
-- 5) cm_quote_req — 전문가 견적요청
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_quote_req (
    quote_req_id            VARCHAR(21)   NOT NULL CONSTRAINT cm_quote_req_pk_quote_req_id PRIMARY KEY,
    site_id                 VARCHAR(21)   NOT NULL,
    member_id               VARCHAR(21)   NOT NULL,
    member_nm               VARCHAR(100),
    category_cd             VARCHAR(30)   NOT NULL,
    sub_category_cd         VARCHAR(30),
    when_cd                 VARCHAR(20),
    want_date               DATE,
    town                    VARCHAR(50),
    addr                    VARCHAR(200),
    content                 TEXT,
    budget_amt              BIGINT,
    contact_cds             VARCHAR(50),
    quote_status_cd         VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    quote_status_cd_before  VARCHAR(20),
    noti_expert_cnt         INTEGER       DEFAULT 0,
    close_date              TIMESTAMP,
    close_reason            VARCHAR(200),
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,
    reg_site_id             VARCHAR(21)   NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.cm_quote_req IS '전문가 견적요청';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_req_id IS '견적요청ID (QUR+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.member_id IS '요청 회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.member_nm IS '요청 회원명 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.category_cd IS '서비스 대분류 (코드: DM_QUOTE_CATE 1단계)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.sub_category_cd IS '서비스 세부 분류 (코드: DM_QUOTE_CATE 2단계)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.when_cd IS '희망 시기 (코드: DM_QUOTE_WHEN — ASAP/WEEK/MONTH/DATE/DISCUSS)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.want_date IS '희망 날짜 (when_cd=DATE)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.town IS '동네';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.addr IS '상세 주소 (요청자·수락된 전문가·관리자만 본다)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.content IS '요청 내용';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.budget_amt IS '예산';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.contact_cds IS '연락 방법 (코드: DM_CONTACT_METHOD, 콤마 구분)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_status_cd IS '상태 (코드: DM_QUOTE_STATUS — OPEN 견적 받는 중/CLOSED 마감/CANCELED 취소)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.quote_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.noti_expert_cnt IS '알림을 보낸 전문가 수';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.close_date IS '마감·취소 일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.close_reason IS '마감·취소 사유';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_req.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX IF NOT EXISTS cm_quote_req_ix01_site_cate_status ON shopjoy_2604.cm_quote_req USING btree (site_id, category_cd, quote_status_cd, reg_date DESC);
CREATE INDEX IF NOT EXISTS cm_quote_req_ix02_member ON shopjoy_2604.cm_quote_req USING btree (member_id, reg_date DESC);

-- ───────────────────────────────────────────────────────────
-- 6) cm_quote_bid — 전문가 견적 (견적요청에 대한 응답)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_quote_bid (
    quote_bid_id      VARCHAR(21)   NOT NULL CONSTRAINT cm_quote_bid_pk_quote_bid_id PRIMARY KEY,
    site_id           VARCHAR(21)   NOT NULL,
    quote_req_id      VARCHAR(21)   NOT NULL,
    expert_id         VARCHAR(21)   NOT NULL,
    expert_member_id  VARCHAR(21)   NOT NULL,
    expert_nm         VARCHAR(100),
    bid_amt           BIGINT,
    bid_msg           TEXT,
    bid_status_cd     VARCHAR(20)   NOT NULL DEFAULT 'SENT',
    chatt_id          VARCHAR(21),
    reply_date        TIMESTAMP,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    reg_site_id       VARCHAR(21)   NOT NULL,
    CONSTRAINT cm_quote_bid_uk01_req_expert UNIQUE (quote_req_id, expert_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_quote_bid IS '전문가 견적 (견적요청에 대한 응답)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.quote_bid_id IS '견적ID (QUB+YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.quote_req_id IS '견적요청ID (cm_quote_req.quote_req_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_id IS '전문가ID (cm_expert.expert_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_member_id IS '전문가 회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.expert_nm IS '전문가 상호 (비정규화 캐시)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_amt IS '견적 금액';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_msg IS '견적 메시지';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.bid_status_cd IS '상태 (코드: DM_QUOTE_BID_STATUS — SENT 보냄/ACCEPTED 수락/DECLINED 거절)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.chatt_id IS '수락 뒤 만든 채팅방ID (cm_chatt.chatt_id)';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reply_date IS '수락·거절 일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.cm_quote_bid.reg_site_id IS '등록 사이트ID (감사 필드)';

CREATE INDEX IF NOT EXISTS cm_quote_bid_ix01_expert ON shopjoy_2604.cm_quote_bid USING btree (expert_id, reg_date DESC);

-- ───────────────────────────────────────────────────────────
-- 7) 공통코드 그룹 22개 (같은 code_grp 가 이미 있으면 건너뜀 — 그 그룹을 재사용)
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, code_grp, grp_nm, path_id, code_grp_desc, use_yn, reg_by, reg_date, reg_site_id)
SELECT v.code_grp_id, v.code_grp, v.grp_nm, v.path_id, v.code_grp_desc, 'Y', 'MIGRATION_20261004', NOW(), 'SI260001'
  FROM (VALUES
        ('CG261004300001', 'DM_POST_KIND'          , '동네글종류', 'danmoo1.post', '동네 글 종류 — cm_local_post.post_kind_cd'),
        ('CG261004300002', 'DM_POST_STATUS'        , '동네글상태', 'danmoo1.post', '동네 글 상태 — cm_local_post.post_status_cd (HIDDEN 은 관리자만)'),
        ('CG261004300003', 'DM_JOB_KIND'           , '알바종류', 'danmoo1.job', '알바/과외/레슨 종류 — cm_local_post.job_kind_cd'),
        ('CG261004300004', 'DM_JOB_TASK'           , '알바하는일', 'danmoo1.job', '하는 일 — cm_local_post.attr_json taskCds'),
        ('CG261004300005', 'DM_PAY_TYPE'           , '급여종류', 'danmoo1.job', '급여 종류 — cm_local_post.pay_type_cd'),
        ('CG261004300006', 'DM_WEEKDAY'            , '요일', 'danmoo1.job', '근무 요일 — cm_local_post.attr_json workDayCds'),
        ('CG261004300007', 'DM_JOB_PERIOD'         , '근무기간', 'danmoo1.job', '근무 기간 — cm_local_post.attr_json periodCd'),
        ('CG261004300008', 'DM_CONTACT_METHOD'     , '연락방법', 'danmoo1.post', '연락 방법 — 알바 attr_json contactCds, cm_quote_req.contact_cds'),
        ('CG261004300009', 'DM_REALTY_KIND'        , '매물종류', 'danmoo1.realty', '매물 종류 — cm_local_post.realty_kind_cd'),
        ('CG261004300010', 'DM_REALTY_DEAL'        , '부동산거래종류', 'danmoo1.realty', '거래 종류 — cm_local_post.deal_type_cd'),
        ('CG261004300011', 'DM_REALTY_OPTION'      , '매물옵션', 'danmoo1.realty', '매물 옵션 — cm_local_post.attr_json optionCds'),
        ('CG261004300012', 'DM_CAR_MAKER'          , '자동차제조사', 'danmoo1.car', '제조사 — cm_local_post.maker_cd'),
        ('CG261004300013', 'DM_CAR_FUEL'           , '자동차연료', 'danmoo1.car', '연료 — cm_local_post.attr_json fuelCd'),
        ('CG261004300014', 'DM_CAR_GEAR'           , '자동차변속기', 'danmoo1.car', '변속기 — cm_local_post.attr_json gearCd'),
        ('CG261004300015', 'DM_CAR_COLOR'          , '자동차색상', 'danmoo1.car', '색상 — cm_local_post.attr_json colorCd'),
        ('CG261004300016', 'DM_CAR_ACCIDENT'       , '자동차사고이력', 'danmoo1.car', '사고 이력 — cm_local_post.attr_json accidentCd'),
        ('CG261004300017', 'DM_QUOTE_WHEN'         , '견적희망시기', 'danmoo1.quote', '희망 시기 — cm_quote_req.when_cd'),
        ('CG261004300018', 'DM_EXPERT_STATUS'      , '전문가상태', 'danmoo1.quote', '전문가 상태 — cm_expert.expert_status_cd'),
        ('CG261004300019', 'DM_EXPERT_CATE_STATUS' , '전문가분류심사상태', 'danmoo1.quote', '분류 신청 심사 상태 — cm_expert_cate.cate_status_cd'),
        ('CG261004300020', 'DM_QUOTE_STATUS'       , '견적요청상태', 'danmoo1.quote', '견적요청 상태 — cm_quote_req.quote_status_cd'),
        ('CG261004300021', 'DM_QUOTE_BID_STATUS'   , '견적상태', 'danmoo1.quote', '견적 상태 — cm_quote_bid.bid_status_cd'),
        ('CG261004300022', 'DM_QUOTE_CATE'         , '견적서비스분류', 'danmoo1.quote', '전문가 견적 서비스 분류(2단계) — cm_quote_req.category_cd/sub_category_cd, cm_expert_cate. 세부는 parent_code_value = 대분류')
       ) AS v(code_grp_id, code_grp, grp_nm, path_id, code_grp_desc)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp x WHERE x.code_grp = v.code_grp)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp y WHERE y.code_grp_id = v.code_grp_id);

-- 모듈 표시(danmoo1) — sy_code_grp.module_cd 컬럼이 있을 때만, 이미 값이 있으면 건드리지 않는다
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_code_grp' AND column_name = 'module_cd') THEN
        EXECUTE $q$UPDATE shopjoy_2604.sy_code_grp SET module_cd = 'danmoo1', upd_by = 'MIGRATION_20261004', upd_date = NOW()
                    WHERE module_cd IS NULL AND reg_by = 'MIGRATION_20261004' AND code_grp_id LIKE 'CG2610043%'$q$;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 8) 코드 148개 (그 그룹에 같은 code_value 가 있거나 code_id 가 이미 쓰였으면 건너뜀)
--    값은 FO 상수(ecFeFoNuxt4 app/conts/tenant/danmoo1.ts)·서버 CmLocalConst 와 같다.
--    DM_QUOTE_CATE 는 2단계: 대분류 code_level 1, 세부 분류 code_level 2 + parent_code_value = 대분류 코드값
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, parent_code_value, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT v.code_id, v.code_value, v.code_label, v.sort_ord, 'Y', v.code_remark, v.code_level, v.parent_code_value, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM (VALUES
        ('CD261004300001', 'DM_POST_KIND'          , 'JOB'             , '알바/과외/레슨',  1, NULL, 1, NULL),
        ('CD261004300002', 'DM_POST_KIND'          , 'REALTY'          , '부동산',  2, NULL, 1, NULL),
        ('CD261004300003', 'DM_POST_KIND'          , 'CAR'             , '중고차',  3, NULL, 1, NULL),
        ('CD261004300004', 'DM_POST_KIND'          , 'STORY'           , '스토리',  4, NULL, 1, NULL),
        ('CD261004300005', 'DM_POST_STATUS'        , 'ACTIVE'          , '모집중·판매중',  1, NULL, 1, NULL),
        ('CD261004300006', 'DM_POST_STATUS'        , 'RESERVED'        , '예약중',  2, NULL, 1, NULL),
        ('CD261004300007', 'DM_POST_STATUS'        , 'CLOSED'          , '마감·거래완료',  3, NULL, 1, NULL),
        ('CD261004300008', 'DM_POST_STATUS'        , 'HIDDEN'          , '숨김',  4, '관리자가 숨긴 글', 1, NULL),
        ('CD261004300009', 'DM_JOB_KIND'           , 'ALBA'            , '알바',  1, NULL, 1, NULL),
        ('CD261004300010', 'DM_JOB_KIND'           , 'TUTOR'           , '과외',  2, NULL, 1, NULL),
        ('CD261004300011', 'DM_JOB_KIND'           , 'LESSON'          , '레슨',  3, NULL, 1, NULL),
        ('CD261004300012', 'DM_JOB_TASK'           , 'SERVING'         , '서빙',  1, NULL, 1, NULL),
        ('CD261004300013', 'DM_JOB_TASK'           , 'KITCHEN'         , '주방보조/설거지',  2, NULL, 1, NULL),
        ('CD261004300014', 'DM_JOB_TASK'           , 'CAFE'            , '카페/바리스타',  3, NULL, 1, NULL),
        ('CD261004300015', 'DM_JOB_TASK'           , 'STORE'           , '매장관리/판매',  4, NULL, 1, NULL),
        ('CD261004300016', 'DM_JOB_TASK'           , 'DELIVERY'        , '배달/운전',  5, NULL, 1, NULL),
        ('CD261004300017', 'DM_JOB_TASK'           , 'LOGISTICS'       , '물류/상하차',  6, NULL, 1, NULL),
        ('CD261004300018', 'DM_JOB_TASK'           , 'CLEANING'        , '청소/미화',  7, NULL, 1, NULL),
        ('CD261004300019', 'DM_JOB_TASK'           , 'OFFICE'          , '사무보조',  8, NULL, 1, NULL),
        ('CD261004300020', 'DM_JOB_TASK'           , 'CARE'            , '돌봄/등하원',  9, NULL, 1, NULL),
        ('CD261004300021', 'DM_JOB_TASK'           , 'TEACHING'        , '학습지도', 10, NULL, 1, NULL),
        ('CD261004300022', 'DM_JOB_TASK'           , 'MUSIC_ART'       , '음악/미술', 11, NULL, 1, NULL),
        ('CD261004300023', 'DM_JOB_TASK'           , 'SPORTS'          , '운동/스포츠', 12, NULL, 1, NULL),
        ('CD261004300024', 'DM_JOB_TASK'           , 'ETC'             , '기타', 13, NULL, 1, NULL),
        ('CD261004300025', 'DM_PAY_TYPE'           , 'HOURLY'          , '시급',  1, NULL, 1, NULL),
        ('CD261004300026', 'DM_PAY_TYPE'           , 'DAILY'           , '일급',  2, NULL, 1, NULL),
        ('CD261004300027', 'DM_PAY_TYPE'           , 'MONTHLY'         , '월급',  3, NULL, 1, NULL),
        ('CD261004300028', 'DM_PAY_TYPE'           , 'PER_JOB'         , '건당',  4, NULL, 1, NULL),
        ('CD261004300029', 'DM_WEEKDAY'            , 'MON'             , '월',  1, NULL, 1, NULL),
        ('CD261004300030', 'DM_WEEKDAY'            , 'TUE'             , '화',  2, NULL, 1, NULL),
        ('CD261004300031', 'DM_WEEKDAY'            , 'WED'             , '수',  3, NULL, 1, NULL),
        ('CD261004300032', 'DM_WEEKDAY'            , 'THU'             , '목',  4, NULL, 1, NULL),
        ('CD261004300033', 'DM_WEEKDAY'            , 'FRI'             , '금',  5, NULL, 1, NULL),
        ('CD261004300034', 'DM_WEEKDAY'            , 'SAT'             , '토',  6, NULL, 1, NULL),
        ('CD261004300035', 'DM_WEEKDAY'            , 'SUN'             , '일',  7, NULL, 1, NULL),
        ('CD261004300036', 'DM_JOB_PERIOD'         , 'SHORT'           , '단기',  1, NULL, 1, NULL),
        ('CD261004300037', 'DM_JOB_PERIOD'         , 'LONG'            , '1개월 이상',  2, NULL, 1, NULL),
        ('CD261004300038', 'DM_CONTACT_METHOD'     , 'CHAT'            , '채팅',  1, NULL, 1, NULL),
        ('CD261004300039', 'DM_CONTACT_METHOD'     , 'PHONE'           , '전화',  2, NULL, 1, NULL),
        ('CD261004300040', 'DM_REALTY_KIND'        , 'ONEROOM'         , '원룸',  1, NULL, 1, NULL),
        ('CD261004300041', 'DM_REALTY_KIND'        , 'TWOROOM'         , '투룸+',  2, NULL, 1, NULL),
        ('CD261004300042', 'DM_REALTY_KIND'        , 'OFFICETEL'       , '오피스텔',  3, NULL, 1, NULL),
        ('CD261004300043', 'DM_REALTY_KIND'        , 'APT'             , '아파트',  4, NULL, 1, NULL),
        ('CD261004300044', 'DM_REALTY_KIND'        , 'VILLA'           , '빌라/주택',  5, NULL, 1, NULL),
        ('CD261004300045', 'DM_REALTY_KIND'        , 'STORE'           , '상가',  6, NULL, 1, NULL),
        ('CD261004300046', 'DM_REALTY_KIND'        , 'OFFICE'          , '사무실',  7, NULL, 1, NULL),
        ('CD261004300047', 'DM_REALTY_KIND'        , 'ETC'             , '기타',  8, NULL, 1, NULL),
        ('CD261004300048', 'DM_REALTY_DEAL'        , 'MONTHLY'         , '월세',  1, NULL, 1, NULL),
        ('CD261004300049', 'DM_REALTY_DEAL'        , 'JEONSE'          , '전세',  2, NULL, 1, NULL),
        ('CD261004300050', 'DM_REALTY_DEAL'        , 'SALE'            , '매매',  3, NULL, 1, NULL),
        ('CD261004300051', 'DM_REALTY_OPTION'      , 'AIRCON'          , '에어컨',  1, NULL, 1, NULL),
        ('CD261004300052', 'DM_REALTY_OPTION'      , 'WASHER'          , '세탁기',  2, NULL, 1, NULL),
        ('CD261004300053', 'DM_REALTY_OPTION'      , 'FRIDGE'          , '냉장고',  3, NULL, 1, NULL),
        ('CD261004300054', 'DM_REALTY_OPTION'      , 'BED'             , '침대',  4, NULL, 1, NULL),
        ('CD261004300055', 'DM_REALTY_OPTION'      , 'DESK'            , '책상',  5, NULL, 1, NULL),
        ('CD261004300056', 'DM_REALTY_OPTION'      , 'CLOSET'          , '옷장',  6, NULL, 1, NULL),
        ('CD261004300057', 'DM_REALTY_OPTION'      , 'INDUCTION'       , '인덕션',  7, NULL, 1, NULL),
        ('CD261004300058', 'DM_REALTY_OPTION'      , 'MICROWAVE'       , '전자레인지',  8, NULL, 1, NULL),
        ('CD261004300059', 'DM_REALTY_OPTION'      , 'ELEVATOR'        , '엘리베이터',  9, NULL, 1, NULL),
        ('CD261004300060', 'DM_REALTY_OPTION'      , 'PARKING'         , '주차', 10, NULL, 1, NULL),
        ('CD261004300061', 'DM_REALTY_OPTION'      , 'PET'             , '반려동물', 11, NULL, 1, NULL),
        ('CD261004300062', 'DM_REALTY_OPTION'      , 'BALCONY'         , '베란다', 12, NULL, 1, NULL),
        ('CD261004300063', 'DM_REALTY_OPTION'      , 'SECURITY'        , '보안/CCTV', 13, NULL, 1, NULL),
        ('CD261004300064', 'DM_CAR_MAKER'          , 'HYUNDAI'         , '현대',  1, NULL, 1, NULL),
        ('CD261004300065', 'DM_CAR_MAKER'          , 'KIA'             , '기아',  2, NULL, 1, NULL),
        ('CD261004300066', 'DM_CAR_MAKER'          , 'GENESIS'         , '제네시스',  3, NULL, 1, NULL),
        ('CD261004300067', 'DM_CAR_MAKER'          , 'CHEVROLET'       , '쉐보레',  4, NULL, 1, NULL),
        ('CD261004300068', 'DM_CAR_MAKER'          , 'RENAULT'         , '르노',  5, NULL, 1, NULL),
        ('CD261004300069', 'DM_CAR_MAKER'          , 'KGM'             , 'KG모빌리티',  6, NULL, 1, NULL),
        ('CD261004300070', 'DM_CAR_MAKER'          , 'BMW'             , 'BMW',  7, NULL, 1, NULL),
        ('CD261004300071', 'DM_CAR_MAKER'          , 'BENZ'            , '벤츠',  8, NULL, 1, NULL),
        ('CD261004300072', 'DM_CAR_MAKER'          , 'AUDI'            , '아우디',  9, NULL, 1, NULL),
        ('CD261004300073', 'DM_CAR_MAKER'          , 'TESLA'           , '테슬라', 10, NULL, 1, NULL),
        ('CD261004300074', 'DM_CAR_MAKER'          , 'ETC'             , '기타', 11, NULL, 1, NULL),
        ('CD261004300075', 'DM_CAR_FUEL'           , 'GASOLINE'        , '가솔린',  1, NULL, 1, NULL),
        ('CD261004300076', 'DM_CAR_FUEL'           , 'DIESEL'          , '디젤',  2, NULL, 1, NULL),
        ('CD261004300077', 'DM_CAR_FUEL'           , 'LPG'             , 'LPG',  3, NULL, 1, NULL),
        ('CD261004300078', 'DM_CAR_FUEL'           , 'HYBRID'          , '하이브리드',  4, NULL, 1, NULL),
        ('CD261004300079', 'DM_CAR_FUEL'           , 'EV'              , '전기',  5, NULL, 1, NULL),
        ('CD261004300080', 'DM_CAR_GEAR'           , 'AUTO'            , '자동',  1, NULL, 1, NULL),
        ('CD261004300081', 'DM_CAR_GEAR'           , 'MANUAL'          , '수동',  2, NULL, 1, NULL),
        ('CD261004300082', 'DM_CAR_COLOR'          , 'WHITE'           , '흰색',  1, NULL, 1, NULL),
        ('CD261004300083', 'DM_CAR_COLOR'          , 'BLACK'           , '검정',  2, NULL, 1, NULL),
        ('CD261004300084', 'DM_CAR_COLOR'          , 'SILVER'          , '은색',  3, NULL, 1, NULL),
        ('CD261004300085', 'DM_CAR_COLOR'          , 'GRAY'            , '쥐색',  4, NULL, 1, NULL),
        ('CD261004300086', 'DM_CAR_COLOR'          , 'BLUE'            , '파랑',  5, NULL, 1, NULL),
        ('CD261004300087', 'DM_CAR_COLOR'          , 'RED'             , '빨강',  6, NULL, 1, NULL),
        ('CD261004300088', 'DM_CAR_COLOR'          , 'ETC'             , '기타',  7, NULL, 1, NULL),
        ('CD261004300089', 'DM_CAR_ACCIDENT'       , 'NONE'            , '무사고',  1, NULL, 1, NULL),
        ('CD261004300090', 'DM_CAR_ACCIDENT'       , 'MINOR'           , '단순 교환',  2, NULL, 1, NULL),
        ('CD261004300091', 'DM_CAR_ACCIDENT'       , 'MAJOR'           , '사고 이력 있음',  3, NULL, 1, NULL),
        ('CD261004300092', 'DM_QUOTE_WHEN'         , 'ASAP'            , '가능한 빨리',  1, NULL, 1, NULL),
        ('CD261004300093', 'DM_QUOTE_WHEN'         , 'WEEK'            , '일주일 이내',  2, NULL, 1, NULL),
        ('CD261004300094', 'DM_QUOTE_WHEN'         , 'MONTH'           , '한 달 이내',  3, NULL, 1, NULL),
        ('CD261004300095', 'DM_QUOTE_WHEN'         , 'DATE'            , '날짜 지정',  4, NULL, 1, NULL),
        ('CD261004300096', 'DM_QUOTE_WHEN'         , 'DISCUSS'         , '협의 가능',  5, NULL, 1, NULL),
        ('CD261004300097', 'DM_EXPERT_STATUS'      , 'PENDING'         , '승인 대기',  1, NULL, 1, NULL),
        ('CD261004300098', 'DM_EXPERT_STATUS'      , 'APPROVED'        , '승인',  2, NULL, 1, NULL),
        ('CD261004300099', 'DM_EXPERT_STATUS'      , 'REJECTED'        , '반려',  3, NULL, 1, NULL),
        ('CD261004300100', 'DM_EXPERT_STATUS'      , 'SUSPENDED'       , '정지',  4, NULL, 1, NULL),
        ('CD261004300101', 'DM_EXPERT_CATE_STATUS' , 'PENDING'         , '심사중',  1, NULL, 1, NULL),
        ('CD261004300102', 'DM_EXPERT_CATE_STATUS' , 'APPROVED'        , '승인',  2, NULL, 1, NULL),
        ('CD261004300103', 'DM_EXPERT_CATE_STATUS' , 'REJECTED'        , '반려',  3, NULL, 1, NULL),
        ('CD261004300104', 'DM_QUOTE_STATUS'       , 'OPEN'            , '견적 받는 중',  1, NULL, 1, NULL),
        ('CD261004300105', 'DM_QUOTE_STATUS'       , 'CLOSED'          , '마감',  2, NULL, 1, NULL),
        ('CD261004300106', 'DM_QUOTE_STATUS'       , 'CANCELED'        , '취소',  3, NULL, 1, NULL),
        ('CD261004300107', 'DM_QUOTE_BID_STATUS'   , 'SENT'            , '보냄',  1, NULL, 1, NULL),
        ('CD261004300108', 'DM_QUOTE_BID_STATUS'   , 'ACCEPTED'        , '수락',  2, NULL, 1, NULL),
        ('CD261004300109', 'DM_QUOTE_BID_STATUS'   , 'DECLINED'        , '거절',  3, NULL, 1, NULL),
        ('CD261004300110', 'DM_QUOTE_CATE'         , 'MOVE'            , '이사',  1, NULL, 1, NULL),
        ('CD261004300111', 'DM_QUOTE_CATE'         , 'MOVE_HOME'       , '가정이사', 11, NULL, 2, 'MOVE'),
        ('CD261004300112', 'DM_QUOTE_CATE'         , 'MOVE_SMALL'      , '원룸/소형이사', 12, NULL, 2, 'MOVE'),
        ('CD261004300113', 'DM_QUOTE_CATE'         , 'MOVE_OFFICE'     , '사무실이사', 13, NULL, 2, 'MOVE'),
        ('CD261004300114', 'DM_QUOTE_CATE'         , 'MOVE_CARGO'      , '용달/화물', 14, NULL, 2, 'MOVE'),
        ('CD261004300115', 'DM_QUOTE_CATE'         , 'CLEAN'           , '청소',  2, NULL, 1, NULL),
        ('CD261004300116', 'DM_QUOTE_CATE'         , 'CLEAN_MOVEIN'    , '입주/이사청소', 21, NULL, 2, 'CLEAN'),
        ('CD261004300117', 'DM_QUOTE_CATE'         , 'CLEAN_HOME'      , '가정집 청소', 22, NULL, 2, 'CLEAN'),
        ('CD261004300118', 'DM_QUOTE_CATE'         , 'CLEAN_AIRCON'    , '에어컨 청소', 23, NULL, 2, 'CLEAN'),
        ('CD261004300119', 'DM_QUOTE_CATE'         , 'CLEAN_APPLIANCE' , '가전/매트리스 청소', 24, NULL, 2, 'CLEAN'),
        ('CD261004300120', 'DM_QUOTE_CATE'         , 'INTERIOR'        , '인테리어',  3, NULL, 1, NULL),
        ('CD261004300121', 'DM_QUOTE_CATE'         , 'INT_WALLPAPER'   , '도배/장판', 31, NULL, 2, 'INTERIOR'),
        ('CD261004300122', 'DM_QUOTE_CATE'         , 'INT_BATH'        , '욕실/주방 시공', 32, NULL, 2, 'INTERIOR'),
        ('CD261004300123', 'DM_QUOTE_CATE'         , 'INT_LIGHT'       , '조명/전기', 33, NULL, 2, 'INTERIOR'),
        ('CD261004300124', 'DM_QUOTE_CATE'         , 'INT_FULL'        , '전체 리모델링', 34, NULL, 2, 'INTERIOR'),
        ('CD261004300125', 'DM_QUOTE_CATE'         , 'LESSON'          , '과외/레슨',  4, NULL, 1, NULL),
        ('CD261004300126', 'DM_QUOTE_CATE'         , 'LES_STUDY'       , '학습 과외', 41, NULL, 2, 'LESSON'),
        ('CD261004300127', 'DM_QUOTE_CATE'         , 'LES_LANG'        , '외국어', 42, NULL, 2, 'LESSON'),
        ('CD261004300128', 'DM_QUOTE_CATE'         , 'LES_MUSIC'       , '악기/보컬', 43, NULL, 2, 'LESSON'),
        ('CD261004300129', 'DM_QUOTE_CATE'         , 'LES_SPORTS'      , '운동/PT', 44, NULL, 2, 'LESSON'),
        ('CD261004300130', 'DM_QUOTE_CATE'         , 'REPAIR'          , '수리/설치',  5, NULL, 1, NULL),
        ('CD261004300131', 'DM_QUOTE_CATE'         , 'REP_APPLIANCE'   , '가전 수리', 51, NULL, 2, 'REPAIR'),
        ('CD261004300132', 'DM_QUOTE_CATE'         , 'REP_PLUMB'       , '수도/배관', 52, NULL, 2, 'REPAIR'),
        ('CD261004300133', 'DM_QUOTE_CATE'         , 'REP_DOOR'        , '문/창문/방충망', 53, NULL, 2, 'REPAIR'),
        ('CD261004300134', 'DM_QUOTE_CATE'         , 'REP_INSTALL'     , '가구 조립/설치', 54, NULL, 2, 'REPAIR'),
        ('CD261004300135', 'DM_QUOTE_CATE'         , 'DESIGN'          , '디자인/개발',  6, NULL, 1, NULL),
        ('CD261004300136', 'DM_QUOTE_CATE'         , 'DES_LOGO'        , '로고/디자인', 61, NULL, 2, 'DESIGN'),
        ('CD261004300137', 'DM_QUOTE_CATE'         , 'DES_WEB'         , '웹 개발', 62, NULL, 2, 'DESIGN'),
        ('CD261004300138', 'DM_QUOTE_CATE'         , 'DES_APP'         , '앱 개발', 63, NULL, 2, 'DESIGN'),
        ('CD261004300139', 'DM_QUOTE_CATE'         , 'DES_VIDEO'       , '영상 편집', 64, NULL, 2, 'DESIGN'),
        ('CD261004300140', 'DM_QUOTE_CATE'         , 'EVENT'           , '행사',  7, NULL, 1, NULL),
        ('CD261004300141', 'DM_QUOTE_CATE'         , 'EVT_MC'          , '사회/진행', 71, NULL, 2, 'EVENT'),
        ('CD261004300142', 'DM_QUOTE_CATE'         , 'EVT_PHOTO'       , '촬영', 72, NULL, 2, 'EVENT'),
        ('CD261004300143', 'DM_QUOTE_CATE'         , 'EVT_CATERING'    , '출장 뷔페', 73, NULL, 2, 'EVENT'),
        ('CD261004300144', 'DM_QUOTE_CATE'         , 'EVT_PLAN'        , '행사 기획', 74, NULL, 2, 'EVENT'),
        ('CD261004300145', 'DM_QUOTE_CATE'         , 'ETC'             , '기타',  8, NULL, 1, NULL),
        ('CD261004300146', 'DM_QUOTE_CATE'         , 'ETC_PET'         , '반려동물 돌봄', 81, NULL, 2, 'ETC'),
        ('CD261004300147', 'DM_QUOTE_CATE'         , 'ETC_ERRAND'      , '심부름/대행', 82, NULL, 2, 'ETC'),
        ('CD261004300148', 'DM_QUOTE_CATE'         , 'ETC_OTHER'       , '그 밖의 요청', 83, NULL, 2, 'ETC')
       ) AS v(code_id, code_grp, code_value, code_label, sort_ord, code_remark, code_level, parent_code_value)
  JOIN shopjoy_2604.sy_code_grp g ON g.code_grp = v.code_grp
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = v.code_value)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = v.code_id);

-- 찜 대상 종류에 동네 글 추가 (기존 그룹 LIKE_TARGET_TYPE — mb_like.target_type_cd = LOCAL_POST)
INSERT INTO shopjoy_2604.sy_code (code_id, code_value, code_label, sort_ord, use_yn, code_remark, code_level, code_grp_id, reg_by, reg_date, reg_site_id)
SELECT 'CD261004300999', 'LOCAL_POST', '동네 글', 9, 'Y', '당무마켓 동네 글(cm_local_post) 관심', 1, g.code_grp_id, 'MIGRATION_20261004', NOW(), g.reg_site_id
  FROM shopjoy_2604.sy_code_grp g
 WHERE g.code_grp = 'LIKE_TARGET_TYPE'
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code x WHERE x.code_grp_id = g.code_grp_id AND x.code_value = 'LOCAL_POST')
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code y WHERE y.code_id = 'CD261004300999');

-- ───────────────────────────────────────────────────────────
-- 9) BO 메뉴(sy_menu) + 역할별 메뉴(sy_role_menu) — 고객센터 > 동네생활 > 동네 글 관리 · 전문가 관리 · 견적요청 관리
--    형식은 기존 행과 같다(menu_type_cd FOLDER, menu_url #page=<화면ID>). 역할 권한은 채팅관리(MN000063)를 가진 역할에 같은 perm_level 로 복사.
--    ※ BO 의 실제 좌측 메뉴는 ecFeBo lib/app/boAppMenuData.js 에서 나온다 — sy_menu 는 메뉴관리·역할관리 화면의 기준 데이터.
-- ───────────────────────────────────────────────────────────
-- 1) 메뉴 ---------------------------------------------------------------------
INSERT INTO shopjoy_2604.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, menu_remark, reg_by, reg_date, reg_site_id)
SELECT v.menu_id, v.menu_code, v.menu_nm, v.parent_menu_id, v.menu_url, 'FOLDER', NULL, v.sort_ord, 'Y', v.menu_remark, 'MIGRATION_20261004', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES
         ('MN000097', 'CUST_GRP_LOCAL', '동네생활',      'MN000060', NULL,                   4, '그룹'),
         ('MN000098', 'CM_LOCAL_POST',  '동네 글 관리',  'MN000097', '#page=cmLocalPostMng', 1, NULL),
         ('MN000099', 'CM_EXPERT',      '전문가 관리',   'MN000097', '#page=cmExpertMng',    2, NULL),
         ('MN000100', 'CM_QUOTE_REQ',   '견적요청 관리', 'MN000097', '#page=cmQuoteReqMng',  3, NULL)
       ) AS v(menu_id, menu_code, menu_nm, parent_menu_id, menu_url, sort_ord, menu_remark)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu m WHERE m.menu_id = v.menu_id OR m.menu_code = v.menu_code);

-- 2) 역할별 메뉴 권한 — 채팅관리(MN000063)를 가진 역할에 같은 perm_level 로 ------------
INSERT INTO shopjoy_2604.sy_role_menu (role_menu_id, role_id, menu_id, perm_level, reg_by, reg_date, reg_site_id)
SELECT 'ROM261004' || lpad(((('x' || substr(md5(src.role_id || ':' || n.menu_id), 1, 8))::bit(32)::bigint) % 10000000000)::text, 10, '0'),
       src.role_id, n.menu_id, src.perm_level, 'MIGRATION_20261004', CURRENT_TIMESTAMP, 'SI260001'
  FROM shopjoy_2604.sy_role_menu src
 CROSS JOIN (VALUES ('MN000097'), ('MN000098'), ('MN000099'), ('MN000100')) AS n(menu_id)
 WHERE src.menu_id = 'MN000063'
   AND EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu m WHERE m.menu_id = n.menu_id AND m.reg_by = 'MIGRATION_20261004')
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_id = src.role_id AND x.menu_id = n.menu_id);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'shopjoy_2604'
--    AND table_name IN ('cm_local_post','cm_local_attach','cm_expert','cm_expert_cate','cm_quote_req','cm_quote_bid') ORDER BY 1;   → 6행
-- SELECT g.code_grp, count(c.code_id) FROM shopjoy_2604.sy_code_grp g LEFT JOIN shopjoy_2604.sy_code c ON c.code_grp_id = g.code_grp_id
--  WHERE g.code_grp_id LIKE 'CG2610043%' GROUP BY 1 ORDER BY 1;                                                                  → 22개 그룹, 코드 합계 148
-- SELECT menu_id, menu_nm, parent_menu_id, menu_url FROM shopjoy_2604.sy_menu WHERE menu_id IN ('MN000097','MN000098','MN000099','MN000100') ORDER BY 1;  → 4행
--
--  백엔드 코드 캐시: 코드는 Redis(sy:code:*)에 최대 1시간 남는다 — 바로 보이게 하려면 BO 캐시 새로고침(또는 재기동).

-- ═══════════════════════════════════════════════════════════
--  롤백 (주석 해제 후 실행) — 테이블에 쌓인 글·요청·견적도 함께 지워진다. 첨부 파일(sy_attach·CDN)은 남는다.
-- ═══════════════════════════════════════════════════════════
-- DELETE FROM shopjoy_2604.sy_role_menu WHERE menu_id IN ('MN000097','MN000098','MN000099','MN000100') AND reg_by = 'MIGRATION_20261004';
-- DELETE FROM shopjoy_2604.sy_menu      WHERE menu_id IN ('MN000098','MN000099','MN000100','MN000097') AND reg_by = 'MIGRATION_20261004';
-- DELETE FROM shopjoy_2604.sy_code      WHERE code_id LIKE 'CD2610043%' AND reg_by = 'MIGRATION_20261004';
-- DELETE FROM shopjoy_2604.sy_code_grp  WHERE code_grp_id LIKE 'CG2610043%' AND reg_by = 'MIGRATION_20261004';
-- DELETE FROM shopjoy_2604.mb_like      WHERE target_type_cd = 'LOCAL_POST';
-- DROP TABLE IF EXISTS shopjoy_2604.cm_quote_bid;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_quote_req;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_expert_cate;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_expert;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_local_attach;
-- DROP TABLE IF EXISTS shopjoy_2604.cm_local_post;
