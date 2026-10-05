-- sy_site 테이블 DDL
-- 사이트

CREATE TABLE shopjoy_2604.sy_site (
    site_id          VARCHAR(21)  NOT NULL CONSTRAINT sy_site_pk_site_id PRIMARY KEY,
    site_code        VARCHAR(50)  NOT NULL,
    module_cd        VARCHAR(20) ,   -- FO 모듈 (코드: MODULE_CD — ec1, ec2 …) — 2026-10-04 tenant_module → module_cd (migration_20261004_module_cd.sql)
    root_category_id VARCHAR(21) ,   -- 카테고리 트리 루트 (pd_category.category_id) — 모듈 루트, 2026-10-04 (migration_20261004_category_module_root.py)
    site_type_cd     VARCHAR(20) ,
    site_nm          VARCHAR(100) NOT NULL,
    site_domain      VARCHAR(200),
    logo_url         VARCHAR(500),
    favicon_url      VARCHAR(500),
    site_desc        TEXT        ,
    site_email       VARCHAR(100),
    site_phone       VARCHAR(20) ,
    site_zip_code    VARCHAR(10) ,
    site_address     VARCHAR(300),
    site_business_no VARCHAR(20) ,
    site_ceo         VARCHAR(50) ,
    site_status_cd   VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    config_json      TEXT        ,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    path_id          VARCHAR(21) ,
    -- 접속 주소 12칸: 환경(local/dev/prod) × http·https(브라우저)·aos·ios(앱이 여는 화면) — 2026-10-05 (migration_20261005_sy_site_urls.sql)
    url_local_http   VARCHAR(500),
    url_local_https  VARCHAR(500),
    url_local_aos    VARCHAR(500),
    url_local_ios    VARCHAR(500),
    url_dev_http     VARCHAR(500),
    url_dev_https    VARCHAR(500),
    url_dev_aos      VARCHAR(500),
    url_dev_ios      VARCHAR(500),
    url_prod_http    VARCHAR(500),
    url_prod_https   VARCHAR(500),
    url_prod_aos     VARCHAR(500),
    url_prod_ios     VARCHAR(500),
    -- 모듈 소스 경로·앱 파일 경로 — 2026-10-06 (migration_20261006_sy_site_module_path_app_files.sql)
    module_path        VARCHAR(200),
    aos_dev_file_path  VARCHAR(500),
    aos_prod_file_path VARCHAR(500),
    ios_dev_file_path  VARCHAR(500),
    ios_prod_file_path VARCHAR(500),
    service_stage_cd   VARCHAR(20),
    service_sort_ord   INTEGER
,
    CONSTRAINT sy_site_uk_site_code UNIQUE (site_code),
    CONSTRAINT sy_site_uk_site_business_no UNIQUE (site_business_no)
);

COMMENT ON TABLE  shopjoy_2604.sy_site IS '사이트';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_id IS '사이트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_code IS '사이트코드';
COMMENT ON COLUMN shopjoy_2604.sy_site.module_cd IS 'FO 모듈 (코드: MODULE_CD — ec1/ec2/danmoo1/homepg1/datavisual1/bbm1). FO 사이트 파일 tenant/SI26/<사이트ID>-<모듈>.jsonc 의 모듈과 같아야 한다. NULL=미지정';
COMMENT ON COLUMN shopjoy_2604.sy_site.root_category_id IS '카테고리 트리 루트 (pd_category.category_id) — 이 사이트의 모듈 루트 카테고리, NULL=루트 없음(모듈 미지정)';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_type_cd IS '사이트유형 (코드: SITE_TYPE — EC/ADMIN/API)';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_nm IS '사이트명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_domain IS '도메인';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_http  IS '접속주소 내PC http (브라우저, 예 http://localhost:3100) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_https IS '접속주소 내PC https (브라우저) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_aos   IS '접속주소 내PC 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.local, 폰은 adb reverse) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_ios   IS '접속주소 내PC 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.local) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_http    IS '접속주소 개발(NAS) http (브라우저, 예 http://illeesam.synology.me:22003) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_https   IS '접속주소 개발(NAS) https (브라우저, DSM 역방향 프록시 <포트>.illeesam.synology.me) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_aos     IS '접속주소 개발 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.dev) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_ios     IS '접속주소 개발 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.dev) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_http   IS '접속주소 운영 http (브라우저, Netlify 는 https 로 넘김) — NULL=운영 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_https  IS '접속주소 운영 https (브라우저, 예 https://danmoo1--shopjoy-ecfefonuxt4.netlify.app) — NULL=운영 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_aos    IS '접속주소 운영 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.prod, https 만) — NULL=운영 앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_ios    IS '접속주소 운영 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.prod, https 만) — NULL=운영 앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.module_path        IS '모듈 소스 경로 (예 ecFeFoNuxt4/app/pages/datavisual1, ecFeBoNuxt4/app/pages/bom1) — 포털 카드 표시, NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.aos_dev_file_path  IS '안드로이드 개발 앱 파일 경로 (URL 또는 CDN 상대 경로) — 있으면 포털에서 다운로드, NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.aos_prod_file_path IS '안드로이드 운영 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.ios_dev_file_path  IS '아이폰 개발 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.ios_prod_file_path IS '아이폰 운영 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.service_stage_cd   IS '서비스 분류 (코드: SERVICE_STAGE_CD — COMPANY/PREP/WORK/SERVICE/END/ADMIN) — 종합서비스관리 포털 칸반 칸, NULL=기본 분류';
COMMENT ON COLUMN shopjoy_2604.sy_site.service_sort_ord   IS '서비스 정렬순서 — 같은 분류 안의 칸반 순서(작을수록 위), NULL=이름순 뒤';
COMMENT ON COLUMN shopjoy_2604.sy_site.logo_url IS '로고URL';
COMMENT ON COLUMN shopjoy_2604.sy_site.favicon_url IS '파비콘URL';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_desc IS '사이트설명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_email IS '대표이메일';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_phone IS '대표전화';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_zip_code IS '우편번호';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_address IS '주소';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_business_no IS '사업자번호';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_ceo IS '대표자명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_status_cd IS '상태 (코드: SITE_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_site.config_json IS '확장설정 (JSON)';
COMMENT ON COLUMN shopjoy_2604.sy_site.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_site.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_site.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_site.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_site.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';
