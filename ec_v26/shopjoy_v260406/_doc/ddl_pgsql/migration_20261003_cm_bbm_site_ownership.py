# -*- coding: utf-8 -*-
r"""
migration_20261003_cm_bbm_site_ownership.py — 게시판 cm_ 이동 + 사이트 소속(site_id) 정비 + 판매자↔사이트 매핑 (2026-10-03, 초안)

  사용자: "sy_bbm / sy_bbs 테이블명 바뀌지 않았네"
  → 코드(ecBeBo·ecFeBo 브랜치 feature/site-ownership-20261003)는 이미 cm_bbm·cm_bbs·site_id 기준인데 DB(shopjoy_2604)는 그대로다.
    이 도구가 DB 를 그 브랜치 엔티티(@Table/@Column/@Comment)에 맞춘다.
    근거: 정책서 sy/sy.57.사이트테넌시정책.md §5.1(판매자↔사이트)·§12(reg_site_id 는 감사 필드), sy.57 점검-2026-10-03, ec/cm/cm.03.게시판.md,
          ecBeBo common/site/SiteParentFiller.java(부모 관계)·SiteSaveRule.java·base/common/entity/EntitySaveListener.java·SlSellerSiteService.java

  ■ run1 — 브랜치 배포 "전", 한 트랜잭션 (중간에 하나라도 실패하면 전체 롤백)
     1) sy_bbm → cm_bbm, sy_bbs → cm_bbs. PK·인덱스 이름도 cm_ 로(제약명 = 인덱스명 규칙). 테이블·컬럼 주석은 그대로 따라간다.
        호환 뷰 sy_bbm·sy_bbs (select * from cm_…) — 지금 배포된 main 백엔드(SyBbm/SyBbs 엔티티)가 배포 전까지 그대로 읽고 쓴다.
        단일 테이블 select * 뷰라 PostgreSQL 자동 갱신 가능 뷰다 — 검증 단계에서 뷰로 실제 INSERT/UPDATE/DELETE 해 보고 SAVEPOINT 로 되돌린다.
        (뷰는 컬럼을 다 더한 뒤 10단계에서 만든다 — select * 의 컬럼 목록은 만들 때 고정되기 때문)
     2) 새 테이블 4개: cm_bbs_reply(댓글), cm_bbm_menu(사이트별 3레벨 메뉴), cm_bbm_member(보안 게시판 접근 회원·등급), sl_seller_site(판매자↔사이트 N:M)
     3) 새 컬럼: cm_bbm.secure_yn(기본 'N'), site_id varchar(21) — 브랜치 엔티티에 siteId 가 생겼는데 DB 에 없는 테이블 22개 + 인덱스
        sl_seller 에는 site_id 를 만들지 않는다(판매자↔사이트는 sl_seller_site — sy.57 §5.1).
     4) site_id 채우기: 부모 행의 site_id(SiteParentFiller 와 같은 관계) → 유효한 reg_site_id(sy_site 에 있는 값, sy.57 §12.4 1회성 근거) → SI260001
     5) sl_seller_site 채우기(매핑이 하나도 없는 판매자만): { 소속 회원(sl_seller_member→mb_member)의 사이트 ∪ 상품(pd_prod)의 사이트 ∪ 유효한 reg_site_id },
        하나도 없으면 SI260001. 상태 ACTIVE
     6) 유니크: mb_member(site_id, login_id) — 전체 login_id 유니크는 삭제(브랜치 FoAuthService·SocialAuthService 가 findBySiteIdAndLoginId 로 사이트 안에서만 찾는다),
        sy_brand(site_id, brand_code), cm_bbm(site_id, bbm_code), sy_exceldown_uk02_running(site_id, RUNNING 만 — SyExceldownService 주석의 이름).
        사전 점검에서 중복이 있으면 run1 을 시작하지 않는다.
     7) 옛 이름 참조값: sy_menu·sy_path·cm_popup·sy_i18n·sy_exceldown 등 설정 테이블 (dry 에 옛값→새값 표). 로그·이력·스냅샷은 그대로 둔다.
     8) 코드값: cm_bbm.allow_comment 'COMMENT' → 'Y' (브랜치 화면은 ALLOW_YN Y/N), cm_popup_item('bbm' 팝업 유형) 코드그룹 BBM_TYPE → BBM_TYPE_CD
     9) BO 메뉴 '게시판 메뉴관리'(#page=cmBbmMenuMng) — 게시판관리와 같은 상위 메뉴, 역할 권한(sy_role_menu)은 게시판관리 행을 그대로 복사
    10) 호환 뷰 → 11) 검증(실패하면 롤백): 옛 이름 없음·뷰 갱신 가능·행 수 그대로·빈 site_id 0·채우기 결과 = dry 시뮬레이션·모든 판매자 매핑 있음 …
     ※ run1 직후 ~ 배포 전: main 백엔드는 호환 뷰로 게시판을 그대로 쓰지만, '게시판 선택' 팝업(cm_popup entity_nm=CmBbm)과
       게시판 표시경로 트리(sy_path biz_cd=cm_bbm)는 새 이름이라 배포 전 옛 화면에서는 비어 보인다(배포하면 정상).

  ■ run2 — ecBeBo·ecFeBo 브랜치 "배포 후"
       그 사이 들어온 빈 site_id 다시 채우기(같은 규칙) · 매핑 없는 판매자 매핑 · site_id NOT NULL · 호환 뷰 삭제 ·
       옛 동시실행 게이트 sy_exceldown_uk01_running(reg_site_id — 감사 필드는 업무 키 금지 §12.2) 삭제 · cm_bbm.allow_comment varchar(300) → varchar(1)
       ※ pm_cache 는 NOT NULL 에서 뺀다 — ecBeBo FoMyExtraController.charge()/freeCharge() 의 네이티브 INSERT 가 site_id 를 넣지 않는다.
         코드를 고친 뒤 `run2 --with-pm-cache` 로 다시 실행하면 그때 건다.

  ■ revert — 백업 스키마 기록(_ddl·_changes·_inserted)을 거꾸로 적용해 run1(·run2) 이전으로 되돌린다(한 트랜잭션).
       새 테이블 행·새 컬럼 값은 지우기 전에 백업 스키마(rv{N}_…)에 복사해 둔다.
       ⚠ 되돌린 DB 는 main 코드 기준이다 — 브랜치를 배포했다면 먼저 main 으로 다시 배포할 것.

  백업 스키마 shopjoy_2604_bak_cmbbm_20261003
     _run(실행 이력) · _ddl(구조 변경 — revert 가 거꾸로 실행) · _changes(바뀐 값: 테이블·PK·컬럼·이전값·새값) · _inserted(추가한 행) ·
     _site_fill(site_id 를 어떤 규칙으로 채웠나) · r{N}_{테이블}(run N 이 고치기 직전의 행 스냅샷) · rv{N}_…(revert 직전 새 테이블·새 컬럼 값)

  알림 테이블 이름 변경(migration_20261004_noti_rename.sql, sy_alarm → ap_fcm_noti_send 등)과 순서 무관 (2026-10-04):
     그 스크립트가 먼저 돌았으면 sy_alarm 은 호환 뷰이고 실제 테이블은 ap_fcm_noti_send 다 — tgt() 가 실제 테이블을 골라
     site_id 추가·채우기·NOT NULL·검증·되돌리기를 그쪽에 한다(_site_fill 등 기록의 table_name 은 옛 이름 그대로).
  session_replication_role=replica 는 쓰지 않는다 — shopjoy_2604 에 사용자 트리거가 없고(2026-10-03 조회 0건),
     FK 트리거는 FK 컬럼이 바뀔 때만 검사하는데 이 작업은 기존 FK 컬럼을 바꾸지 않는다(새 sl_seller_site FK 는 만들 때 바로 검사된다).
  잠금: run1·run2·revert 는 처음에 대상 테이블을 잠근다(lock_timeout 10초 — 못 잡으면 바로 실패·롤백, 다시 실행하면 된다).
     몇 초 걸리고 그동안 앱의 해당 테이블 접근(회원 로그인 포함)이 기다린다 → 한가한 시간에 실행.

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261003_cm_bbm_site_ownership.py dry      # 읽기 전용 세션: 상태·사전점검·채우기 시뮬레이션·run1/run2/revert SQL 전체 출력
                                                                #   사전점검이 run1 을 실패시킬 상황이면 종료코드 1
     python … run1        # 배포 전
     python … run2        # 배포 후  [--with-pm-cache]
     python … revert
   PowerShell: $env:DB_PASSWORD='…'; python C:\…\migration_20261003_cm_bbm_site_ownership.py dry
   bash      : DB_PASSWORD='…' python …/migration_20261003_cm_bbm_site_ownership.py dry
"""
import os, re, sys, collections, datetime
import psycopg2

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_cmbbm_20261003"
DEFAULT_SITE = "SI260001"
MIG = "MIGRATION_20261003"
SITE_CMT = "사이트ID (sy_site.site_id) - 업무 소속 사이트"     # 브랜치 엔티티 22개 공통 @Comment
USAGE = "사용법: python migration_20261003_cm_bbm_site_ownership.py dry|run1|run2|revert [--with-pm-cache]"

ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
FLAGS = set(ARGS[1:])
if MODE not in ("dry", "run1", "run2", "revert") or FLAGS - {"--with-pm-cache"}:
    sys.exit(USAGE)
WITH_PM_CACHE = "--with-pm-cache" in FLAGS

# ═══════════════════════════════ 정적 정의 (브랜치 코드 기준) ═══════════════════════════════

BOARD = [("sy_bbm", "cm_bbm"), ("sy_bbs", "cm_bbs")]

# BaseEntity 감사 컬럼 (컬럼, 타입, 기본값, @Comment)
AUDIT = [("reg_by", "varchar(30)", None, "등록자"),
         ("reg_date", "timestamp", "CURRENT_TIMESTAMP", "등록일"),
         ("reg_site_id", "varchar(21)", None, "등록 사이트ID (reg_by와 동일 시점에 SecurityUtil에서 자동 주입)"),
         ("upd_by", "varchar(30)", None, "수정자"),
         ("upd_date", "timestamp", None, "수정일")]

# 새 테이블 — 엔티티 CmBbsReply / CmBbmMenu / CmBbmMember / SlSellerSite 그대로. cols: (컬럼, 타입, NOT NULL, 기본값, 주석)
#   기본값·CHECK·유니크·인덱스는 엔티티에 없지만 같은 스키마의 형제 테이블 관례와 서비스 규칙(cm.03, BoCm*Service)에 맞춘 것
NEW_TABLES = [
    dict(name="cm_bbs_reply", comment="게시물 댓글", pk="bbs_reply_id",
         cols=[("bbs_reply_id", "varchar(21)", True, None, "댓글ID"),
               ("bbs_id", "varchar(21)", True, None, "게시물ID (cm_bbs.bbs_id)"),
               ("parent_bbs_reply_id", "varchar(21)", False, None, "상위 댓글ID (대댓글이면 부모 댓글)"),
               ("member_id", "varchar(21)", False, None, "작성 회원ID (mb_member.member_id, 관리자 작성이면 NULL)"),
               ("author_nm", "varchar(50)", False, None, "작성자명"),
               ("bbs_reply_content", "text", False, None, "댓글 내용"),
               ("reply_status_cd", "varchar(20)", False, "'ACTIVE'", "상태 (코드: COMMENT_STATUS_CD)")],
         extra=[("index", "cm_bbs_reply_ix01_bbs_id", "(bbs_id)"),
                ("index", "cm_bbs_reply_ix02_parent_bbs_reply_id", "(parent_bbs_reply_id)"),
                ("index", "cm_bbs_reply_ix03_member_id", "(member_id)")]),
    dict(name="cm_bbm_menu", comment="게시판 메뉴", pk="bbm_menu_id",
         cols=[("bbm_menu_id", "varchar(21)", True, None, "게시판 메뉴ID"),
               ("site_id", "varchar(21)", True, None, SITE_CMT),
               ("parent_bbm_menu_id", "varchar(21)", False, None, "상위 메뉴ID (NULL 이면 1레벨 — 상단 메뉴)"),
               ("bbm_menu_nm", "varchar(100)", True, None, "메뉴명"),
               ("bbm_menu_level", "integer", True, None, "메뉴 레벨 (1: 상단 메뉴, 2·3: 좌측 메뉴)"),
               ("bbm_id", "varchar(21)", False, None, "연결 게시판ID (cm_bbm.bbm_id) — NULL 이면 하위 메뉴 묶음"),
               ("link_url", "varchar(500)", False, None, "링크 URL (게시판 대신 이동할 주소)"),
               ("sort_ord", "integer", False, "0", "정렬순서"),
               ("use_yn", "varchar(1)", False, "'Y'", "사용여부 Y/N")],
         extra=[("check", "cm_bbm_menu_ck_bbm_menu_level", "CHECK (bbm_menu_level BETWEEN 1 AND 3)"),   # cm.03 "4레벨 금지"
                ("index", "cm_bbm_menu_ix01_site_id", "(site_id)"),
                ("index", "cm_bbm_menu_ix02_parent_bbm_menu_id", "(parent_bbm_menu_id)"),
                ("index", "cm_bbm_menu_ix03_bbm_id", "(bbm_id)")]),
    dict(name="cm_bbm_member", comment="게시판 접근 회원·등급", pk="bbm_member_id",
         cols=[("bbm_member_id", "varchar(21)", True, None, "게시판 접근 회원·등급ID"),
               ("bbm_id", "varchar(21)", True, None, "게시판ID (cm_bbm.bbm_id)"),
               ("member_id", "varchar(21)", False, None, "접근 허용 회원ID (mb_member.member_id) — 회원등급으로 허용하면 NULL"),
               ("grade_cd", "varchar(20)", False, None, "접근 허용 회원등급 (mb_member_grade.grade_cd) — 회원으로 허용하면 NULL"),
               ("write_yn", "varchar(1)", False, "'Y'", "글쓰기 허용 Y/N (N 이면 읽기만)")],
         extra=[  # 한 행 = 회원 또는 회원등급 중 하나만 (BoCmBbmMemberService.create 와 같은 규칙, 빈 문자열은 없는 것으로)
                ("check", "cm_bbm_member_ck_member_id_grade_cd_x2",
                 "CHECK ((coalesce(member_id, '') <> '') <> (coalesce(grade_cd, '') <> ''))"),
                ("uindex", "cm_bbm_member_uk_bbm_id_member_id_x2", "(bbm_id, member_id) WHERE member_id <> ''"),
                ("uindex", "cm_bbm_member_uk2_bbm_id_grade_cd_x2", "(bbm_id, grade_cd) WHERE grade_cd <> ''"),
                ("index", "cm_bbm_member_ix01_bbm_id", "(bbm_id)"),
                ("index", "cm_bbm_member_ix02_member_id", "(member_id)")]),
    dict(name="sl_seller_site", comment="판매자 사이트 매핑", pk="seller_site_id",
         cols=[("seller_site_id", "varchar(21)", True, None, "판매자 사이트 매핑ID"),
               ("seller_id", "varchar(21)", True, None, "판매자ID (sl_seller.seller_id)"),
               ("site_id", "varchar(21)", True, None, "사이트ID (sy_site.site_id) - 이 판매자가 판매자로 활동하는 사이트"),
               ("seller_site_status_cd", "varchar(20)", False, "'ACTIVE'", "사이트별 판매 상태 (코드: SELLER_STATUS_CD) — ACTIVE:활동, SUSPENDED:정지")],
         extra=[("unique", "sl_seller_site_uk_seller_id_site_id_x2", "UNIQUE (seller_id, site_id)"),   # SlSellerSiteRepository.findBySellerIdAndSiteId
                ("fk", "sl_seller_site_fk_seller_id", f"FOREIGN KEY (seller_id) REFERENCES {S}.sl_seller (seller_id)"),  # 형제 sl_seller_member/warehouse 와 같게
                ("index", "sl_seller_site_ix01_site_id", "(site_id)")]),
]
NEW_TABLE_NAMES = [d["name"] for d in NEW_TABLES]

# site_id 를 더하고 채울 테이블 — 채우는 순서(부모 먼저). 규칙은 위에서부터 차례로, 다 안 되면 유효한 reg_site_id → SI260001
#   ("parent", 부모테이블, 자식컬럼, 부모컬럼)  — SiteParentFiller 와 같은 관계
#   ("evidence", 근거테이블, 근거의 이 테이블 키, 근거의 원본 키, 원본테이블, 원본 PK) — 근거 행들이 가리키는 원본의 사이트가 "하나"일 때만
SITE_TABLES = [
    ("cm_bbm", []),
    ("cm_bbs", [("parent", "cm_bbm", "bbm_id", "bbm_id")]),
    ("cm_blog", []),
    ("cm_blog_cate", []),
    ("cm_chatt", []),
    ("cm_faq", []),
    ("pm_cache", [("parent", "mb_member", "member_id", "member_id")]),
    ("st_settle_raw", [("parent", "od_order", "order_id", "order_id")]),
    # st_settle 은 SiteParentFiller 대상이 아니다(정산은 만든 쪽이 정한 사이트) — 기존 행은 정산 항목·원천이 가리키는 주문의 사이트가 하나면 그 값
    ("st_settle", [("evidence", "st_settle_item", "settle_id", "order_id", "od_order", "order_id"),
                   ("evidence", "st_settle_raw", "settle_id", "order_id", "od_order", "order_id")]),
    ("st_settle_adj", [("parent", "st_settle", "settle_id", "settle_id")]),
    ("st_settle_close", [("parent", "st_settle", "settle_id", "settle_id")]),
    ("st_settle_etc_adj", [("parent", "st_settle", "settle_id", "settle_id")]),
    ("st_settle_pay", [("parent", "st_settle", "settle_id", "settle_id")]),
    ("st_erp_voucher", [("parent", "st_settle", "settle_id", "settle_id")]),
    ("st_recon", [("parent", "st_settle", "settle_id", "settle_id"),
                  ("parent", "st_settle_raw", "settle_raw_id", "settle_raw_id")]),
    ("st_settle_config", [("parent", "pd_category", "category_id", "category_id")]),
    ("sy_alarm", []),
    ("sy_brand", []),
    ("sy_contact", []),
    ("sy_exceldown", []),
    ("sy_notice", []),
    ("sy_user", []),
]
SITE_NAMES = [t for t, _ in SITE_TABLES]
RULES = dict(SITE_TABLES)
# site_id 단독 인덱스를 따로 만들지 않는 테이블 — site_id 가 선두인 유니크가 생긴다(인덱스 정책 STEP 5: 접두중복 금지)
SITE_IDX_SKIP = {"cm_bbm": "cm_bbm_uk_site_id_bbm_code_x2", "sy_brand": "sy_brand_uk_site_id_brand_code_x2"}
# run2 NOT NULL 에서 빼는 테이블 (코드가 site_id 없이 INSERT 하는 곳)
NOT_NULL_SKIP = {} if WITH_PM_CACHE else {
    "pm_cache": "ecBeBo fo/ec/controller/FoMyExtraController.java charge()/freeCharge() 네이티브 INSERT 에 site_id 가 없다 — 고친 뒤 run2 --with-pm-cache"}

# 사이트 범위 유니크: (테이블, 없앨 전역 유니크 정의, 새 제약명, 컬럼)
UNIQUES = [("cm_bbm", "UNIQUE (bbm_code)", "cm_bbm_uk_site_id_bbm_code_x2", ("site_id", "bbm_code")),
           ("sy_brand", "UNIQUE (brand_code)", "sy_brand_uk_site_id_brand_code_x2", ("site_id", "brand_code")),
           ("mb_member", "UNIQUE (login_id)", "mb_member_uk_site_id_login_id_x2", ("site_id", "login_id"))]
EXCEL_GATE_NEW, EXCEL_GATE_OLD = "sy_exceldown_uk02_running", "sy_exceldown_uk01_running"

# 옛 이름 참조값을 바꿀 설정 테이블(텍스트 컬럼 전부, PK 제외). 그 밖의 테이블에서 찾은 것은 dry 에 "그대로 둠"으로만 보여 준다
REF_TABLES = ["sy_menu", "sy_path", "cm_path", "cm_popup", "cm_popup_item", "sy_i18n", "sy_code", "sy_code_grp", "sy_prop",
              "sy_template", "sy_batch", "sy_exceldown", "cm_dashboard", "cm_dashboard_item", "cm_dashboard_menu"]
TOKENS = [("sy_bbm", "cm_bbm"), ("sy_bbs", "cm_bbs"), ("SyBbm", "CmBbm"), ("SyBbs", "CmBbs"), ("syBbm", "cmBbm"), ("syBbs", "cmBbs"),
          ("SY_BBM", "CM_BBM"), ("SY_BBS", "CM_BBS"), ("sy-bbm", "cm-bbm"), ("sy-bbs", "cm-bbs"),
          ("/sy/bbm", "/ec/cm/bbm"), ("/sy/bbs", "/ec/cm/bbs")]
TOKEN_RE = "(" + "|".join(a for a, _ in TOKENS) + ")"          # 토큰은 영숫자·_·-·/ 뿐이라 PostgreSQL 정규식 그대로
LEAVE_REASON = [(re.compile(r"^syh_|^mbh_|^odh_|^pdh_|^cmh_"), "로그·이력(그 시점 기록)"),
                (re.compile(r"^md_sg_sourcegen"), "소스생성기 입력·이력(개발 도구 — DDL 원문 포함, 필요하면 새 DDL 로 다시 등록)"),
                (re.compile(r"^zd_meta_snapshot$"), "스키마 스냅샷(이력)"),
                (re.compile(r"^(sy_bbm|sy_bbs|cm_bbm|cm_bbs)$"), "게시판·게시물 내용")]

# 8) 코드값 — 옛 BBM_COMMENT_TYPE/BBM_ATTACH_TYPE 값 → 브랜치 화면 CmBbmDtl(ALLOW_YN Y/N) · FoCmBbsService("Y" 면 댓글 허용)
ALLOW_COMMENT_MAP = {"COMMENT": "Y", "REPLY": "Y", "NONE": "N"}
ALLOW_ATTACH_MAP = {"NONE": "N", "ONE": "Y", "TWO": "Y", "THREE": "Y", "LIST": "Y"}
CODE_CHECKS = [("cm_bbm", "bbm_type_cd", "BBM_TYPE_CD"), ("cm_bbm", "content_type_cd", "BBM_CONTENT_TYPE"),
               ("cm_bbm", "scope_type_cd", "SCOPE_TYPE_CD"), ("cm_bbm", "allow_like", "ALLOW_YN"),
               ("cm_bbm", "use_yn", "USE_YN"), ("cm_bbs", "bbs_status_cd", "BBS_STATUS")]

# 9) 새 BO 메뉴 — ecFeBo lib/app/boAppMenuData.js: cmBbmMng(게시판관리) 다음, cmBbsMng(게시글관리) 앞
MENU_NEW = dict(code="CM_BBM_MENU", nm="게시판 메뉴관리", url="#page=cmBbmMenuMng",
                remark="게시판 메뉴(cm_bbm_menu) 사이트별 3레벨 관리 — 2026-10-03")
MENU_SIBLING_URLS = ("#page=syBbmMng", "#page=cmBbmMng")

BAK_TABLES = {
    "_run": "run_no integer PRIMARY KEY, mode text NOT NULL, note text, started timestamp DEFAULT now()",
    "_ddl": "run_no integer NOT NULL, ord integer NOT NULL, step text, action text NOT NULL, tbl text, obj text, "
            "old_name text, new_name text, detail text, logged timestamp DEFAULT now(), PRIMARY KEY (run_no, ord)",
    "_changes": "run_no integer NOT NULL, ord integer NOT NULL, step text, table_name text NOT NULL, pk_col text NOT NULL, "
                "pk_val text NOT NULL, column_name text NOT NULL, old_val text, new_val text, logged timestamp DEFAULT now(), PRIMARY KEY (run_no, ord)",
    "_inserted": "run_no integer NOT NULL, ord integer NOT NULL, step text, table_name text NOT NULL, pk_col text NOT NULL, "
                 "pk_val text NOT NULL, logged timestamp DEFAULT now(), PRIMARY KEY (run_no, ord)",
    "_site_fill": "run_no integer NOT NULL, table_name text NOT NULL, pk_val text NOT NULL, site_id text, rule text, logged timestamp DEFAULT now()",
}

# ═══════════════════════════════ 접속·조회 도우미 ═══════════════════════════════

conn = cur = None


def connect():
    global conn, cur
    if not os.environ.get("DB_PASSWORD"):
        sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요 (예: $env:DB_PASSWORD='…'; python … dry)")
    conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                            dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                            password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="mig_20261003_cm_bbm")
    conn.set_session(readonly=(MODE == "dry"), autocommit=False)   # dry 는 읽기 전용 트랜잭션 — 쓰기를 시도하면 DB 가 거절한다
    cur = conn.cursor()


def q(sql):
    cur.execute(sql)
    return cur.fetchall() if cur.description else []


def q1(sql):
    r = q(sql)
    return r[0][0] if r else None


def lit(v):
    """SQL 리터럴 — 모든 문장을 값이 박힌 완성형으로 만들어 dry 출력 = 실제 실행문이 되게 한다 (standard_conforming_strings=on 전제)"""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def apply_tokens(s):
    for a, b in TOKENS:
        s = s.replace(a, b)
    return s


def short(v, n=70):
    s = "NULL" if v is None else str(v)
    return s if len(s) <= n else s[:n - 1] + "…"


def snip(old, new, n=60, w=18):
    """긴 값은 바뀐 부분 앞뒤만 — (옛, 새)"""
    if old is None or new is None or (len(old) <= n and len(new) <= n):
        return short(old, n), short(new, n)
    i = 0
    while i < min(len(old), len(new)) and old[i] == new[i]:
        i += 1
    j = 0
    while j < min(len(old), len(new)) - i and old[-1 - j] == new[-1 - j]:
        j += 1
    a = max(0, i - w)

    def cut(s):
        b = min(len(s), len(s) - j + w)
        return ("…" if a > 0 else "") + s[a:b] + ("…" if b < len(s) else "")
    return cut(old), cut(new)


class Cat:
    """shopjoy_2604 카탈로그 스냅샷"""

    def __init__(self):
        self.kind = dict(q(f"SELECT relname, relkind::text FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace"))
        self.cols = collections.defaultdict(dict)
        for t, c, dt, ln, nul, dflt in q(f"""SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default
                                               FROM information_schema.columns WHERE table_schema = {lit(S)} ORDER BY table_name, ordinal_position"""):
            self.cols[t][c] = dict(type=dt, len=ln, null=(nul == "YES"), default=dflt)
        self.pk = dict(q(f"""SELECT cl.relname, a.attname FROM pg_constraint co JOIN pg_class cl ON cl.oid = co.conrelid
                               JOIN pg_attribute a ON a.attrelid = co.conrelid AND a.attnum = co.conkey[1]
                              WHERE co.connamespace = {lit(S)}::regnamespace AND co.contype = 'p'"""))
        self.cons = collections.defaultdict(list)          # 테이블 → [(제약명, 종류, 정의)]
        self.conname = set()
        for t, n, ty, d in q(f"""SELECT cl.relname, co.conname, co.contype::text, pg_get_constraintdef(co.oid) FROM pg_constraint co
                                   JOIN pg_class cl ON cl.oid = co.conrelid WHERE co.connamespace = {lit(S)}::regnamespace"""):
            self.cons[t].append((n, ty, d))
            self.conname.add(n)
        self.idx = collections.defaultdict(list)           # 테이블 → [(인덱스명, 정의)]
        for t, n, d in q(f"SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = {lit(S)}"):
            self.idx[t].append((n, d))
        self.lead = collections.defaultdict(set)           # 테이블 → 부분 인덱스가 아닌 인덱스의 선두 컬럼
        for t, a in q(f"""SELECT t.relname, a.attname FROM pg_index x JOIN pg_class t ON t.oid = x.indrelid
                           JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.indkey[0]
                          WHERE t.relnamespace = {lit(S)}::regnamespace AND x.indpred IS NULL"""):
            self.lead[t].add(a)
        self.sites = {r[0] for r in q(f"SELECT site_id FROM {S}.sy_site")}
        self.bak = bool(q1(f"SELECT count(*) FROM pg_namespace WHERE nspname = {lit(BAK)}"))
        self.bak_kind = dict(q(f"SELECT relname, relkind::text FROM pg_class WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = {lit(BAK)})")) if self.bak else {}

    def is_table(self, t):
        return self.kind.get(t) == "r"

    def is_view(self, t):
        return self.kind.get(t) == "v"

    def has_col(self, t, c):
        return c in self.cols.get(t, {})


def board_state(cat):
    st = {}
    for old, new in BOARD:
        ko, kn = cat.kind.get(old), cat.kind.get(new)
        if ko == "r" and kn is None:
            st[old] = "rename"          # 아직 안 바꿈
        elif ko == "v" and kn == "r":
            st[old] = "view"            # run1 적용 — 호환 뷰 있음
        elif ko is None and kn == "r":
            st[old] = "done"            # run2 까지 적용 — 뷰 삭제됨
        else:
            st[old] = f"충돌({old}={ko}, {new}={kn})"
    return st


# 2026-10-04 알림 용어 보정(migration_20261004_noti_rename.sql)이 먼저 돌았으면 실제 테이블은 새 이름(옛 이름은 호환 뷰)
NOTI_RENAMED = {"sy_alarm": "ap_fcm_noti_send", "syh_alarm_send_hist": "aph_fcm_noti_send_hist", "sy_noti": "ap_fcm_noti"}


def tgt(cat, t):
    """site_id 를 더하고 채울 실제 테이블 — 알림 테이블은 이름 변경이 먼저 됐으면 새 이름 (게시판은 그대로 t)"""
    n = NOTI_RENAMED.get(t)
    return n if n and cat.is_table(n) else t


def phys(cat, t):
    """지금 DB 에 있는 이름 — 아직 rename 전이면 옛 이름"""
    for old, new in BOARD:
        if t == new and not cat.is_table(new) and cat.is_table(old):
            return old
    return tgt(cat, t)


def next_run_no(cat):
    if cat.bak_kind.get("_run") == "r":
        return int(q1(f"SELECT coalesce(max(run_no), 0) + 1 FROM {BAK}._run"))
    return 1


class Plan:
    def __init__(self, mode, run_no):
        self.mode, self.run_no = mode, run_no
        self.stmts = []                    # (step, title, sql, expect_rowcount)
        self.fatal, self.warn, self.info = [], [], []
        self.ord = 0
        self._ddl = []
        self.expect = {}                   # 검증용 기대값
        self.ddl_log, self.change_log, self.insert_log = [], [], []   # 기록 사본(점검·테스트용)

    def add(self, step, title, sql, expect=None):
        self.stmts.append((step, title, sql, expect))

    def next_ord(self):
        self.ord += 1
        return self.ord

    def log_ddl(self, step, action, tbl=None, obj=None, old=None, new=None, detail=None):
        self._ddl.append((self.next_ord(), step, action, tbl, obj, old, new, detail))
        self.ddl_log.append((self.run_no, self.ord, action, tbl, obj, old, new, detail))

    def flush_ddl(self, step):
        if not self._ddl:
            return
        rows = ",\n  ".join(f"({self.run_no}, {o}, {lit(s)}, {lit(a)}, {lit(t)}, {lit(ob)}, {lit(ol)}, {lit(nw)}, {lit(d)})"
                            for o, s, a, t, ob, ol, nw, d in self._ddl)
        self.add(step, "백업 기록: 구조 변경(_ddl)",
                 f"INSERT INTO {BAK}._ddl (run_no, ord, step, action, tbl, obj, old_name, new_name, detail) VALUES\n  {rows}")
        self._ddl = []


def change_stmt(p, step, t, pk, pv, col, old, new):
    """값 하나 바꾸기 + _changes 기록을 한 문장으로 (지금 값이 old 일 때만 — 아니면 0행 → 실패로 처리)"""
    o = p.next_ord()
    p.change_log.append((p.run_no, o, t, pk, pv, col, old, new))
    return (f"WITH u AS (UPDATE {S}.{t} SET {col} = {lit(new)} WHERE {pk} = {lit(pv)} AND {col}::text IS NOT DISTINCT FROM {lit(old)} RETURNING {pk})\n"
            f"INSERT INTO {BAK}._changes (run_no, ord, step, table_name, pk_col, pk_val, column_name, old_val, new_val)\n"
            f"SELECT {p.run_no}, {o}, {lit(step)}, {lit(t)}, {lit(pk)}, {lit(pv)}, {lit(col)}, {lit(old)}, {lit(new)} FROM u")


# ═══════════════════════════════ 시뮬레이션 (dry 표시 + run 검증 기준) ═══════════════════════════════

def simulate_sites(cat):
    """22개 테이블 site_id 채우기를 SQL 과 같은 우선순위로 파이썬에서 계산한다 — dry 출력과 run1 검증(_site_fill 집계 비교)의 기준"""
    final, sim = {}, {}
    sites = cat.sites
    for t, rules in SITE_TABLES:
        pt = phys(cat, t)
        pk = cat.pk.get(pt)
        has_site = cat.has_col(pt, "site_id")
        keycols = []
        for r in rules:
            if r[0] == "parent" and r[2] not in keycols:
                keycols.append(r[2])
        sel = [pk, "reg_site_id", "site_id" if has_site else "NULL::text"] + keycols
        rows = q(f"SELECT {', '.join(sel)} FROM {S}.{pt}")
        # 규칙별 후보값
        cand = []
        orphan = []
        for r in rules:
            if r[0] == "parent":
                _, par, ccol, pcol = r
                if par in final:                                   # 부모도 이번에 채우는 테이블 — 시뮬레이션 결과
                    pmap = final[par]
                else:
                    pmap = dict(q(f"SELECT {pcol}, site_id FROM {S}.{phys(cat, par)}"))
                ki = sel.index(ccol)
                cand.append((f"parent:{par}", lambda row, pmap=pmap, ki=ki: pmap.get(row[ki])))
                nkey = sum(1 for row in rows if not row[ki])
                miss = sum(1 for row in rows if row[ki] and row[ki] not in pmap)
                bad = sum(1 for row in rows if row[ki] and row[ki] in pmap and pmap[row[ki]] not in sites)
                orphan.append((par, ccol, nkey, miss, bad))
            else:
                _, ev, ekey, eref, ref, rkey = r
                ev_sites = collections.defaultdict(set)
                for k, s in q(f"SELECT c.{ekey}, r.site_id FROM {S}.{ev} c JOIN {S}.{ref} r ON r.{rkey} = c.{eref}"):
                    if s in sites:
                        ev_sites[k].add(s)
                emap = {k: next(iter(v)) for k, v in ev_sites.items() if len(v) == 1}
                multi = sum(1 for v in ev_sites.values() if len(v) > 1)
                cand.append((f"evidence:{ev}", lambda row, emap=emap: emap.get(row[0])))
                orphan.append((f"{ev}→{ref}", ekey, None, None, multi))
        fmap, fill = {}, {}
        for row in rows:
            pv, reg, cur_site = row[0], row[1], row[2]
            if cur_site is not None:                               # 이미 값이 있으면 그대로 (SQL 의 site_id IS NULL 과 같은 기준)
                fmap[pv] = cur_site
                continue
            chosen = None
            for rule, fn in cand:
                v = fn(row)
                if v in sites:
                    chosen = (v, rule)
                    break
            if not chosen:
                chosen = (reg, "reg_site_id") if reg in sites else (DEFAULT_SITE, "default")
            fmap[pv] = chosen[0]
            fill[pv] = chosen
        final[t] = fmap
        sim[t] = dict(pk=pk, phys=pt, total=len(rows), has_site=has_site, fill=fill, orphan=orphan,
                      reg_null=sum(1 for row in rows if not row[1]),
                      reg_bad=sum(1 for row in rows if row[1] and row[1] not in sites))
    return final, sim


def seller_site_sql():
    """sl_seller_site 채우기 — 매핑이 하나도 없는 판매자만 (run1·run2 같은 문장)"""
    return f"""WITH src AS (
    SELECT sm.seller_id, m.site_id FROM {S}.sl_seller_member sm JOIN {S}.mb_member m ON m.member_id = sm.member_id
     WHERE coalesce(sm.status_cd, 'ACTIVE') <> 'REMOVED'                         -- 소속 회원의 사이트
    UNION SELECT p.seller_id, p.site_id FROM {S}.pd_prod p WHERE p.seller_id IS NOT NULL      -- 상품의 사이트
    UNION SELECT s.seller_id, s.reg_site_id FROM {S}.sl_seller s                              -- 등록 사이트(1회성 근거, sy.57 §12.4)
), valid AS (
    SELECT DISTINCT src.seller_id, src.site_id FROM src
     WHERE src.site_id IN (SELECT site_id FROM {S}.sy_site) AND src.seller_id IN (SELECT seller_id FROM {S}.sl_seller)
), todo AS (
    SELECT s.seller_id FROM {S}.sl_seller s WHERE NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site e WHERE e.seller_id = s.seller_id)
), pairs AS (
    SELECT v.seller_id, v.site_id FROM valid v JOIN todo t ON t.seller_id = v.seller_id
    UNION
    SELECT t.seller_id, {lit(DEFAULT_SITE)} FROM todo t WHERE NOT EXISTS (SELECT 1 FROM valid v WHERE v.seller_id = t.seller_id)
)
INSERT INTO {S}.sl_seller_site (seller_site_id, seller_id, site_id, seller_site_status_cd, reg_by, reg_date, reg_site_id, upd_by, upd_date)
SELECT 'SES' || to_char(now(), 'YYMMDDHH24MISS') || lpad((row_number() OVER (ORDER BY seller_id, site_id))::text, 4, '0'),
       seller_id, site_id, 'ACTIVE', {lit(MIG)}, now(), site_id, {lit(MIG)}, now()
  FROM pairs"""


def simulate_seller_sites(cat, final):
    sites = cat.sites
    sellers = dict(q(f"SELECT seller_id, reg_site_id FROM {S}.sl_seller"))
    existing = set(q(f"SELECT seller_id, site_id FROM {S}.sl_seller_site")) if cat.is_table("sl_seller_site") else set()
    mapped = {s for s, _ in existing}
    src = collections.defaultdict(lambda: collections.defaultdict(list))
    for sid, site in q(f"""SELECT sm.seller_id, m.site_id FROM {S}.sl_seller_member sm JOIN {S}.mb_member m ON m.member_id = sm.member_id
                           WHERE coalesce(sm.status_cd, 'ACTIVE') <> 'REMOVED'"""):
        if site in sites:
            src[sid][site].append("회원")
    for sid, site, n in q(f"SELECT seller_id, site_id, count(*) FROM {S}.pd_prod WHERE seller_id IS NOT NULL GROUP BY 1, 2"):
        if site in sites:
            src[sid][site].append(f"상품{n}")
    plan = {}
    for sid, reg in sorted(sellers.items()):
        if sid in mapped:
            continue
        m = {k: list(v) for k, v in src.get(sid, {}).items()}
        if reg in sites:
            m.setdefault(reg, []).append("등록사이트")
        if not m:
            m[DEFAULT_SITE] = ["대표사이트(근거 없음)"]
        plan[sid] = m
    # 참고(계획에 없음): 소속 관리자 계정(sy_user)의 사이트를 더하면 늘어날 매핑
    extra = []
    umap = final.get("sy_user", {})
    for sid, uid in q(f"SELECT seller_id, user_id FROM {S}.sl_seller_member WHERE user_id IS NOT NULL AND coalesce(status_cd, 'ACTIVE') <> 'REMOVED'"):
        us = umap.get(uid)
        if sid in plan and us and us not in plan[sid]:
            extra.append((sid, uid, us))
    return plan, existing, extra


# ═══════════════════════════════ run1 계획 ═══════════════════════════════

def build_run1(cat, run_no, now):
    p = Plan("run1", run_no)
    bstate = board_state(cat)
    p.expect["bstate"] = bstate
    sites = cat.sites

    # ── 사전 점검 ─────────────────────────────────────────
    if q1("SHOW standard_conforming_strings") != "on":
        p.fatal.append("standard_conforming_strings 가 off — 이 도구의 문자열 리터럴 전제가 깨집니다")
    if DEFAULT_SITE not in sites:
        p.fatal.append(f"대표 사이트 {DEFAULT_SITE} 가 sy_site 에 없습니다")
    for old, s in bstate.items():
        if s.startswith("충돌"):
            p.fatal.append(f"게시판 테이블 상태가 이상합니다 — {s} (sy_*=테이블·cm_*=없음 이거나 sy_*=뷰·cm_*=테이블 이어야 함)")
    for t, rules in SITE_TABLES:
        pt = phys(cat, t)
        if not cat.is_table(pt):
            p.fatal.append(f"테이블 {pt} 가 없습니다")
            continue
        need = {"reg_site_id"} | {r[2] for r in rules if r[0] == "parent"}
        if not cat.pk.get(pt):
            p.fatal.append(f"{pt} 에 PK 가 없습니다")
        miss = sorted(c for c in need if not cat.has_col(pt, c))
        if miss:
            p.fatal.append(f"{pt} 에 필요한 컬럼이 없습니다: {miss}")
        if cat.has_col(pt, "site_id"):
            c = cat.cols[pt]["site_id"]
            if c["type"] != "character varying" or c["len"] != 21:
                p.warn.append(f"{pt}.site_id 가 이미 있는데 형식이 varchar(21) 이 아닙니다: {c['type']}({c['len']})")
            else:
                p.info.append(f"{pt}.site_id 는 이미 있음 — 컬럼 추가는 건너뛰고 빈 값만 채움")
    for par in ("mb_member", "od_order", "pd_category", "pd_prod"):
        if not cat.has_col(par, "site_id"):
            p.fatal.append(f"부모/근거 테이블 {par}.site_id 가 없습니다")
    for t, c in (("sl_seller_member", "member_id"), ("sl_seller_member", "status_cd"), ("pd_prod", "seller_id"),
                 ("st_settle_item", "order_id"), ("st_settle_raw", "settle_id")):
        if not cat.has_col(t, c):
            p.fatal.append(f"{t}.{c} 가 없습니다")
    if cat.has_col("sl_seller", "site_id"):
        p.warn.append("sl_seller.site_id 가 있습니다(옛 대기 DDL?) — 브랜치 엔티티에는 없음(판매자↔사이트는 sl_seller_site). 이 도구는 건드리지 않음")
    for nt in NEW_TABLES:
        k = cat.kind.get(nt["name"])
        if k and k != "r":
            p.fatal.append(f"{nt['name']} 이름의 다른 객체(relkind={k})가 있습니다")
        elif k == "r":
            have = list(cat.cols[nt["name"]].keys())
            want = [c[0] for c in nt["cols"]] + [a[0] for a in AUDIT]
            if sorted(have) != sorted(want):
                p.warn.append(f"{nt['name']} 가 이미 있는데 컬럼이 엔티티와 다릅니다: 있음 {have} / 엔티티 {want}")
            else:
                p.info.append(f"{nt['name']} 는 이미 있음 — 건너뜀")

    final, sim = simulate_sites(cat)
    p.expect["sim"] = sim
    p.expect["final"] = final
    sp, existing, extra = simulate_seller_sites(cat, final)
    p.expect["seller_plan"] = sp
    p.expect["seller_existing"] = existing
    p.expect["seller_extra"] = extra

    # 유니크 중복 점검 (채운 뒤 값 기준)
    dups = {}
    bbm_final = final["cm_bbm"]
    rows = q(f"SELECT bbm_id, bbm_code FROM {S}.{phys(cat, 'cm_bbm')}")
    dups["cm_bbm (site_id, bbm_code)"] = [k for k, n in collections.Counter((bbm_final[i], c) for i, c in rows).items() if n > 1]
    brand_final = final["sy_brand"]
    rows = q(f"SELECT brand_id, brand_code FROM {S}.sy_brand")
    dups["sy_brand (site_id, brand_code)"] = [k for k, n in collections.Counter((brand_final[i], c) for i, c in rows).items() if n > 1]
    dups["mb_member (site_id, login_id)"] = [tuple(r[:2]) for r in q(f"SELECT site_id, login_id, count(*) FROM {S}.mb_member GROUP BY 1, 2 HAVING count(*) > 1")]
    ex_final = final["sy_exceldown"]
    rows = q(f"SELECT exceldown_id FROM {S}.sy_exceldown WHERE exceldown_status_cd = 'RUNNING'")
    dups["sy_exceldown RUNNING (site_id)"] = [k for k, n in collections.Counter(ex_final[i] for (i,) in rows).items() if n > 1]
    p.expect["dups"] = dups
    for k, v in dups.items():
        if v:
            p.fatal.append(f"유니크 {k} 중복 {len(v)}건: {v[:10]}")
    nulls = q1(f"SELECT count(*) FROM {S}.mb_member WHERE site_id IS NULL") if cat.has_col("mb_member", "site_id") else 0
    if nulls:
        p.warn.append(f"mb_member.site_id 가 빈 회원 {nulls}명 — (site_id, login_id) 유니크는 NULL 끼리는 막지 못함")

    # 참조값·코드값·메뉴 계획
    refs = plan_refs(cat)
    p.expect["refs"] = refs
    fixes, code_report = plan_code_fixes(cat)
    p.expect["fixes"] = fixes
    p.expect["code_report"] = code_report
    menu = plan_menu(cat, now)
    p.expect["menu"] = menu
    for t, pk, pv, col, old, new in refs + fixes:
        pt = phys(cat, t)
        ln = cat.cols.get(pt, {}).get(col, {}).get("len")
        if ln and new is not None and len(new) > ln:
            p.fatal.append(f"{t}.{col} 새 값이 컬럼 길이 {ln} 를 넘습니다: {new}")
        if any(ty == "u" and d == f"UNIQUE ({col})" for _, ty, d in cat.cons[pt]):     # 단일 컬럼 유니크(예: sy_menu.menu_code)에 새 값이 이미 있나
            if q1(f"SELECT count(*) FROM {S}.{pt} WHERE {col} = {lit(new)} AND {pk} <> {lit(pv)}"):
                p.fatal.append(f"{t}.{col} 새 값 {new} 이(가) 다른 행에 이미 있습니다(유니크 위반)")

    # ── 문장 만들기 ─────────────────────────────────────
    lock_ae = sorted({phys(cat, t) for t in SITE_NAMES} | {"mb_member"})
    lock_sre = sorted({"sy_menu", "sy_role_menu", "sy_path", "cm_popup", "cm_popup_item", "sy_i18n", "sl_seller"} - set(lock_ae))
    p.expect["locked"] = lock_ae
    p.add("0", "잠금 대기 상한", "SET LOCAL lock_timeout = '10s'")
    p.add("0", "문장 실행 상한", "SET LOCAL statement_timeout = '10min'")
    p.add("0", "구조를 바꿀 테이블 잠금", f"LOCK TABLE {', '.join(S + '.' + t for t in lock_ae)} IN ACCESS EXCLUSIVE MODE")
    p.add("0", "값만 바꿀 테이블 잠금(읽기 허용)", f"LOCK TABLE {', '.join(S + '.' + t for t in lock_sre)} IN SHARE ROW EXCLUSIVE MODE")
    p.add("0", "백업 스키마", f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    for bt, ddl in BAK_TABLES.items():
        p.add("0", f"백업 기록 테이블 {bt}", f"CREATE TABLE IF NOT EXISTS {BAK}.{bt} ({ddl})")
    p.add("0", "실행 이력", f"INSERT INTO {BAK}._run (run_no, mode, note) VALUES ({run_no}, 'run1', {lit('게시판 cm_ 이동·site_id 정비·sl_seller_site — 배포 전')})")
    # 스냅샷: 이름을 바꿀 게시판 테이블 전체 + 값을 바꿀 행
    for old, new in BOARD:
        if bstate[old] == "rename":
            p.add("0", f"스냅샷 {old} 전체", f"CREATE TABLE {BAK}.r{run_no}_{old} AS SELECT * FROM {S}.{old}")
    touched = collections.defaultdict(set)
    for t, pk, pv, col, old, new in refs + fixes + menu.get("bumps", []):
        touched[(t, pk)].add(pv)
    for (t, pk), pvs in sorted(touched.items()):
        if t in ("cm_bbm", "cm_bbs") and bstate[{"cm_bbm": "sy_bbm", "cm_bbs": "sy_bbs"}[t]] == "rename":
            continue                                                  # 위 전체 스냅샷에 있음
        p.add("0", f"스냅샷 {t} 바꿀 행 {len(pvs)}", f"CREATE TABLE {BAK}.r{run_no}_{t} AS SELECT * FROM {S}.{phys(cat, t)} WHERE {pk} IN ({', '.join(lit(v) for v in sorted(pvs))})")

    # 1) 게시판 rename
    for old, new in BOARD:
        if bstate[old] != "rename":
            p.info.append(f"{old} → {new} 이름 변경은 이미 됨({bstate[old]})")
            continue
        p.add("1", f"테이블 이름 {old} → {new}", f"ALTER TABLE {S}.{old} RENAME TO {new}")
        p.log_ddl("1", "rename_table", new, new, old, new)
        con_names = set()
        for cn, ty, d in sorted(cat.cons[old]):
            con_names.add(cn)
            if cn.startswith(old + "_"):
                nn = new + cn[len(old):]
                if nn in cat.conname or cat.kind.get(nn):
                    p.fatal.append(f"제약 이름 {nn} 이 이미 있습니다")
                p.add("1", f"제약 이름 {cn} → {nn}", f"ALTER TABLE {S}.{new} RENAME CONSTRAINT {cn} TO {nn}")
                p.log_ddl("1", "rename_constraint", new, nn, cn, nn)
        for ix, d in sorted(cat.idx[old]):
            if ix in con_names or not ix.startswith(old + "_"):
                continue                                              # 제약이 가진 인덱스는 제약과 함께 바뀐다
            nn = new + ix[len(old):]
            if cat.kind.get(nn):
                p.fatal.append(f"인덱스 이름 {nn} 이 이미 있습니다")
            p.add("1", f"인덱스 이름 {ix} → {nn}", f"ALTER INDEX {S}.{ix} RENAME TO {nn}")
            p.log_ddl("1", "rename_index", new, nn, ix, nn)
    p.flush_ddl("1")

    # 2) 새 테이블
    for nt in NEW_TABLES:
        name = nt["name"]
        if cat.kind.get(name):
            continue
        cols = [f"    {c:<22} {ty}{' NOT NULL' if nn else ''}{(' DEFAULT ' + df) if df else ''}" for c, ty, nn, df, _ in nt["cols"]]
        cols += [f"    {c:<22} {ty}{(' DEFAULT ' + df) if df else ''}" for c, ty, df, _ in AUDIT]
        cons = [f"    CONSTRAINT {name}_pk_{nt['pk']} PRIMARY KEY ({nt['pk']})"]
        for kind, cn, body in nt["extra"]:
            if kind in ("check", "unique", "fk"):
                cons.append(f"    CONSTRAINT {cn} {body}")
        p.add("2", f"새 테이블 {name}", f"CREATE TABLE {S}.{name} (\n" + ",\n".join(cols + cons) + "\n)")
        p.log_ddl("2", "create_table", name, name)
        p.add("2", f"주석 {name}", f"COMMENT ON TABLE {S}.{name} IS {lit(nt['comment'])}")
        for c, _, _, _, cm in nt["cols"]:
            p.add("2", f"주석 {name}.{c}", f"COMMENT ON COLUMN {S}.{name}.{c} IS {lit(cm)}")
        for c, _, _, cm in AUDIT:
            p.add("2", f"주석 {name}.{c}", f"COMMENT ON COLUMN {S}.{name}.{c} IS {lit(cm)}")
        for kind, cn, body in nt["extra"]:
            if kind in ("index", "uindex"):
                p.add("2", f"인덱스 {cn}", f"CREATE {'UNIQUE ' if kind == 'uindex' else ''}INDEX {cn} ON {S}.{name} {body}")
    p.flush_ddl("2")

    # 3) 새 컬럼 — cm_bbm.secure_yn + site_id 22개
    bbm_p = phys(cat, "cm_bbm")
    if not cat.has_col(bbm_p, "secure_yn"):
        p.add("3", "컬럼 cm_bbm.secure_yn (기존 행은 'N')", f"ALTER TABLE {S}.cm_bbm ADD COLUMN secure_yn varchar(1) DEFAULT 'N'")
        p.add("3", "주석 cm_bbm.secure_yn", f"COMMENT ON COLUMN {S}.cm_bbm.secure_yn IS {lit('보안 게시판 Y/N — Y 면 지정 회원·회원등급(cm_bbm_member)만 읽고 쓴다')}")
        p.log_ddl("3", "add_column", "cm_bbm", "secure_yn")
    for t in SITE_NAMES:
        pt = phys(cat, t)
        tt = tgt(cat, t)                                              # 1단계 rename 뒤의 실제 테이블 (알림 테이블만 다를 수 있음)
        if not cat.has_col(pt, "site_id"):
            p.add("3", f"컬럼 {tt}.site_id", f"ALTER TABLE {S}.{tt} ADD COLUMN site_id varchar(21)")
            p.add("3", f"주석 {tt}.site_id", f"COMMENT ON COLUMN {S}.{tt}.site_id IS {lit(SITE_CMT)}")
            p.log_ddl("3", "add_column", tt, "site_id")
        if t in SITE_IDX_SKIP:
            p.info.append(f"{t}.site_id 단독 인덱스는 만들지 않음 — {SITE_IDX_SKIP[t]}(site_id 선두 유니크)가 대신함")
            continue
        if "site_id" in cat.lead.get(pt, set()):
            continue                                                  # site_id 가 선두인 인덱스가 이미 있음
        nums = [int(m.group(1)) for n, _ in cat.idx[pt] for m in [re.match(rf"^(?:{t}|{pt})_ix(\d+)_", n)] if m]
        ix = f"{tt}_ix{(max(nums) + 1) if nums else 1:02d}_site_id"
        p.add("3", f"인덱스 {ix}", f"CREATE INDEX {ix} ON {S}.{tt} (site_id)")
        p.log_ddl("3", "create_index", tt, ix)
    p.flush_ddl("3")

    # 4) site_id 채우기
    for t, rules in SITE_TABLES:
        for st_ in fill_stmts(cat, t, rules, run_no):
            p.add("4", st_[0], st_[1])

    # 5) sl_seller_site
    p.add("5", "sl_seller_site 채우기 (매핑 없는 판매자만: 회원 ∪ 상품 ∪ 등록사이트, 없으면 대표사이트)", seller_site_sql())

    # 6) 유니크
    for t, old_def, new_name, cols in UNIQUES:
        pt = phys(cat, t)
        if new_name in cat.conname:
            p.info.append(f"유니크 {new_name} 는 이미 있음")
            continue
        for cn, ty, d in cat.cons[pt]:
            if ty == "u" and d == old_def:
                cn_now = (t + cn[len(pt):]) if (pt != t and cn.startswith(pt + "_")) else cn   # rename 뒤 이름
                p.add("6", f"전역 유니크 삭제 {t}.{cn_now} {old_def}", f"ALTER TABLE {S}.{t} DROP CONSTRAINT {cn_now}")
                p.log_ddl("6", "drop_constraint", t, cn_now, detail=old_def)
        p.add("6", f"사이트 범위 유니크 {new_name}", f"ALTER TABLE {S}.{t} ADD CONSTRAINT {new_name} UNIQUE ({', '.join(cols)})")
        p.log_ddl("6", "add_constraint", t, new_name)
    if not any(n == EXCEL_GATE_NEW for n, _ in cat.idx["sy_exceldown"]):
        p.add("6", f"엑셀 동시 1건 게이트 {EXCEL_GATE_NEW} (site_id — 옛 {EXCEL_GATE_OLD}(reg_site_id) 는 run2 에서 삭제)",
              f"CREATE UNIQUE INDEX {EXCEL_GATE_NEW} ON {S}.sy_exceldown (site_id) WHERE exceldown_status_cd = 'RUNNING'")
        p.log_ddl("6", "create_index", "sy_exceldown", EXCEL_GATE_NEW)
    p.flush_ddl("6")

    # 7) 참조값  8) 코드값
    for t, pk, pv, col, old, new in refs:
        so, sn = snip(old, new, 40)
        p.add("7", f"참조값 {t}.{col} [{pv}] {so} → {sn}", change_stmt(p, "7", t, pk, pv, col, old, new), expect=1)
    for t, pk, pv, col, old, new in fixes:
        p.add("8", f"코드값 {t}.{col} [{pv}] {old} → {new}", change_stmt(p, "8", t, pk, pv, col, old, new), expect=1)

    # 9) 메뉴
    if menu.get("skip"):
        p.info.append(menu["skip"])
    elif menu.get("error"):
        p.warn.append(menu["error"])
    else:
        for t, pk, pv, col, old, new in menu["bumps"]:
            p.add("9", f"메뉴 순서 밀기 {pv} sort_ord {old} → {new}", change_stmt(p, "9", t, pk, pv, col, old, new), expect=1)
        m = menu
        p.add("9", f"새 메뉴 {m['menu_id']} {MENU_NEW['nm']} ({MENU_NEW['url']})",
              f"INSERT INTO {S}.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, "
              f"menu_remark, reg_by, reg_date, upd_by, upd_date, reg_site_id)\nVALUES ({lit(m['menu_id'])}, {lit(MENU_NEW['code'])}, {lit(MENU_NEW['nm'])}, "
              f"{lit(m['parent'])}, {lit(MENU_NEW['url'])}, {lit(m['type'])}, {lit(m['icon'])}, {m['sort']}, 'Y', {lit(MENU_NEW['remark'])}, "
              f"{lit(MIG)}, now(), {lit(MIG)}, now(), {lit(m['reg_site'])})", expect=1)
        ins = [("sy_menu", "menu_id", m["menu_id"])]
        if m["roles"]:
            vals = ",\n  ".join(f"({lit(rid)}, {lit(role)}, {lit(m['menu_id'])}, {lit(perm)}, {lit(MIG)}, now(), {lit(MIG)}, now(), {lit(m['reg_site'])})"
                                for rid, role, perm in m["roles"])
            p.add("9", f"역할 권한 {len(m['roles'])}건 (게시판관리 {m['sib_id']} 와 같게)",
                  f"INSERT INTO {S}.sy_role_menu (role_menu_id, role_id, menu_id, perm_level, reg_by, reg_date, upd_by, upd_date, reg_site_id) VALUES\n  {vals}",
                  expect=len(m["roles"]))
            ins += [("sy_role_menu", "role_menu_id", rid) for rid, _, _ in m["roles"]]
        ins_rows = [(run_no, p.next_ord(), t, pk, pv) for t, pk, pv in ins]
        p.insert_log.extend(ins_rows)
        vals = ",\n  ".join(f"({r}, {o}, '9', {lit(t)}, {lit(pk)}, {lit(pv)})" for r, o, t, pk, pv in ins_rows)
        p.add("9", "백업 기록: 추가한 행(_inserted)", f"INSERT INTO {BAK}._inserted (run_no, ord, step, table_name, pk_col, pk_val) VALUES\n  {vals}")

    # 10) 호환 뷰 — 컬럼을 다 더한 뒤(select * 는 만들 때 컬럼 목록이 고정)
    for old, new in BOARD:
        if bstate[old] != "rename":
            continue
        p.add("10", f"호환 뷰 {old} → {new}", f"CREATE VIEW {S}.{old} AS SELECT * FROM {S}.{new}")
        p.add("10", f"주석 뷰 {old}", f"COMMENT ON VIEW {S}.{old} IS {lit(f'호환용 임시 뷰 → {new} (2026-10-03 run1, 배포 전 main 백엔드용 — 브랜치 배포 후 run2 에서 삭제)')}")
        p.log_ddl("10", "create_view", old, old)
        for grantee, priv in q(f"""SELECT grantee, string_agg(privilege_type, ', ') FROM information_schema.role_table_grants
                                    WHERE table_schema = {lit(S)} AND table_name = {lit(old)}
                                      AND grantee <> (SELECT tableowner FROM pg_tables WHERE schemaname = {lit(S)} AND tablename = {lit(old)})
                                    GROUP BY grantee"""):
            p.add("10", f"뷰 권한 {grantee}", f"GRANT {priv} ON {S}.{old} TO {grantee}")
    p.flush_ddl("10")
    return p


def fill_stmts(cat, t, rules, run_no):
    """site_id 채우기 문장 — 규칙마다 UPDATE … RETURNING 을 _site_fill 기록과 한 문장으로"""
    pk = cat.pk.get(phys(cat, t))
    tt = tgt(cat, t)                                                  # UPDATE 할 실제 테이블 (기록 table_name 은 t 그대로)
    out = []

    def wrap(upd, rule):
        return (f"WITH u AS (\n  {upd}\n  RETURNING x.{pk} AS pk_val, x.site_id)\n"
                f"INSERT INTO {BAK}._site_fill (run_no, table_name, pk_val, site_id, rule) SELECT {run_no}, {lit(t)}, u.pk_val, u.site_id, {lit(rule)} FROM u")
    for r in rules:
        if r[0] == "parent":
            _, par, ccol, pcol = r
            out.append((f"site_id 채우기 {t} ← 부모 {par}.{pcol}",
                        wrap(f"UPDATE {S}.{tt} x SET site_id = p.site_id FROM {S}.{par} p\n   WHERE x.site_id IS NULL AND p.{pcol} = x.{ccol} "
                             f"AND p.site_id IN (SELECT site_id FROM {S}.sy_site)", f"parent:{par}")))
        else:
            _, ev, ekey, eref, ref, rkey = r
            out.append((f"site_id 채우기 {t} ← {ev} 가 가리키는 {ref} 의 사이트(하나일 때)",
                        wrap(f"UPDATE {S}.{tt} x SET site_id = d.site_id\n    FROM (SELECT c.{ekey} AS k, min(r.site_id) AS site_id FROM {S}.{ev} c "
                             f"JOIN {S}.{ref} r ON r.{rkey} = c.{eref}\n           WHERE r.site_id IN (SELECT site_id FROM {S}.sy_site) "
                             f"GROUP BY c.{ekey} HAVING count(DISTINCT r.site_id) = 1) d\n   WHERE x.site_id IS NULL AND d.k = x.{pk}", f"evidence:{ev}")))
    out.append((f"site_id 채우기 {t} ← 유효한 reg_site_id",
                wrap(f"UPDATE {S}.{tt} x SET site_id = x.reg_site_id\n   WHERE x.site_id IS NULL AND x.reg_site_id IN (SELECT site_id FROM {S}.sy_site)", "reg_site_id")))
    out.append((f"site_id 채우기 {t} ← 대표 사이트 {DEFAULT_SITE}",
                wrap(f"UPDATE {S}.{tt} x SET site_id = {lit(DEFAULT_SITE)}\n   WHERE x.site_id IS NULL", "default")))
    return out


def plan_refs(cat):
    """설정 테이블의 옛 이름 참조값 → 새 이름 (행 단위)"""
    out = []
    for t in REF_TABLES:
        if not cat.is_table(t):
            continue
        pk = cat.pk.get(t)
        for c, m in cat.cols[t].items():
            if c == pk or m["type"] not in ("character varying", "text", "character"):
                continue
            for pv, old in q(f"SELECT {pk}, {c} FROM {S}.{t} WHERE {c} ~ {lit(TOKEN_RE)} ORDER BY 1"):
                new = apply_tokens(old)
                if new != old:
                    out.append((t, pk, pv, c, old, new))
    return out


def scan_all_refs(cat):
    """dry 참고: DB 전체 텍스트 컬럼에서 옛 이름 찾기 (REF_TABLES 밖은 바꾸지 않음)"""
    hits = []
    for t, cols in sorted(cat.cols.items()):
        if not cat.is_table(t) or t in REF_TABLES:
            continue
        for c, m in cols.items():
            if m["type"] in ("character varying", "text", "character", "json", "jsonb"):
                n = q1(f"SELECT count(*) FROM {S}.{t} WHERE {c}::text ~ {lit(TOKEN_RE)}")
                if n:
                    reason = next((r for rx, r in LEAVE_REASON if rx.search(t)), "확인 필요")
                    hits.append((t, c, n, reason))
    return hits


def plan_code_fixes(cat):
    out, report = [], []
    bt = phys(cat, "cm_bbm")
    for col, mp in (("allow_comment", ALLOW_COMMENT_MAP), ("allow_attach", ALLOW_ATTACH_MAP)):
        for pv, v in q(f"SELECT bbm_id, {col} FROM {S}.{bt} WHERE {col} IS NOT NULL ORDER BY 1"):
            if v in mp:
                out.append(("cm_bbm", "bbm_id", pv, col, v, mp[v]))
            elif v not in ("Y", "N"):
                report.append(f"cm_bbm.{col} [{pv}] = {v!r} — Y/N 아님, 매핑 규칙 없음(그대로 둠)")
    grps = {r[0] for r in q(f"SELECT code_grp FROM {S}.sy_code_grp")}
    for pid, fld, cg in q(f"""SELECT i.popup_item_id, i.field_nm, i.code_grp FROM {S}.cm_popup_item i JOIN {S}.cm_popup p ON p.popup_id = i.popup_id
                              WHERE p.popup_code = 'bbm' AND i.code_grp IS NOT NULL ORDER BY 1"""):
        if cg not in grps and (cg + "_CD") in grps:
            out.append(("cm_popup_item", "popup_item_id", pid, "code_grp", cg, cg + "_CD"))
    for t, col, grp in CODE_CHECKS:
        pt = phys(cat, t)
        vals = {r[0] for r in q(f"""SELECT c.code_value FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                    WHERE g.code_grp = {lit(grp)}""")}
        dist = q(f"SELECT {col}, count(*) FROM {S}.{pt} GROUP BY 1 ORDER BY 2 DESC")
        bad = [(v, n) for v, n in dist if v is not None and v not in vals]
        report.append(f"{t}.{col} (코드그룹 {grp}{'' if vals else ' — 없음!'}): " + ", ".join(f"{v}:{n}" for v, n in dist)
                      + (f"  ← 코드에 없는 값 {bad}" if bad else "  (모두 코드에 있음)"))
    others = q(f"""SELECT p.popup_code, i.field_nm, i.code_grp FROM {S}.cm_popup_item i JOIN {S}.cm_popup p ON p.popup_id = i.popup_id
                   WHERE i.code_grp IS NOT NULL AND p.popup_code <> 'bbm' AND i.code_grp NOT IN (SELECT code_grp FROM {S}.sy_code_grp) ORDER BY 1""")
    if others:
        report.append("참고(이번 범위 밖): 없는 코드그룹을 쓰는 다른 팝업 항목 " + ", ".join(f"{a}.{b}={c}" for a, b, c in others))
    return out, report


def plan_menu(cat, now):
    if q1(f"SELECT count(*) FROM {S}.sy_menu WHERE menu_code = {lit(MENU_NEW['code'])} OR menu_url = {lit(MENU_NEW['url'])}"):
        return {"skip": f"메뉴 {MENU_NEW['url']} 는 이미 있음 — 건너뜀"}
    sib = q(f"""SELECT menu_id, parent_menu_id, sort_ord, menu_type_cd, icon_class, reg_site_id FROM {S}.sy_menu
                WHERE menu_url IN ({', '.join(lit(u) for u in MENU_SIBLING_URLS)}) ORDER BY menu_id""")
    if len(sib) != 1:
        return {"error": f"게시판관리 메뉴(menu_url {MENU_SIBLING_URLS})를 하나로 찾지 못함({len(sib)}건) — 메뉴 추가 건너뜀"}
    sib_id, parent, sort, mtype, icon, reg_site = sib[0]
    new_sort = (sort or 0) + 1
    bumps = [("sy_menu", "menu_id", mid, "sort_ord", str(so), str(so + 1))
             for mid, so in q(f"""SELECT menu_id, sort_ord FROM {S}.sy_menu WHERE parent_menu_id IS NOT DISTINCT FROM {lit(parent)}
                                  AND sort_ord >= {new_sort} AND menu_id <> {lit(sib_id)} ORDER BY sort_ord DESC, menu_id""")]
    ids = {r[0] for r in q(f"SELECT menu_id FROM {S}.sy_menu")}
    nums = [int(i[2:]) for i in ids if re.match(r"^MN\d{6}$", i)]
    menu_id = f"MN{(max(nums) + 1) if nums else 1:06d}"           # 형제 메뉴들과 같은 MN+6자리
    ts = now.strftime("%y%m%d%H%M%S")
    rm_ids = {r[0] for r in q(f"SELECT role_menu_id FROM {S}.sy_role_menu")}
    roles = []
    for i, (role, perm) in enumerate(q(f"SELECT role_id, perm_level FROM {S}.sy_role_menu WHERE menu_id = {lit(sib_id)} ORDER BY role_id"), 1):
        rid = f"ROM{ts}{i:04d}"                                     # CmUtil.generateId("sy_role_menu") 형식
        while rid in rm_ids:
            i += 100
            rid = f"ROM{ts}{i:04d}"
        roles.append((rid, role, perm))
    return dict(menu_id=menu_id, parent=parent, sort=new_sort, type=mtype, icon=icon, reg_site=reg_site or DEFAULT_SITE,
                sib_id=sib_id, bumps=bumps, roles=roles)


# ═══════════════════════════════ run2 계획 ═══════════════════════════════

def build_run2(cat, run_no, assume_run1=False):
    p = Plan("run2", run_no)
    bstate = board_state(cat) if not assume_run1 else {o: "view" for o, _ in BOARD}
    if not assume_run1:
        for old, s in bstate.items():
            if s == "rename":
                p.fatal.append(f"{old} 가 아직 테이블입니다 — run1 을 먼저 실행하세요")
            elif s.startswith("충돌"):
                p.fatal.append(f"게시판 테이블 상태가 이상합니다 — {s}")
        for t in SITE_NAMES:
            if not cat.has_col(tgt(cat, t), "site_id"):
                p.fatal.append(f"{t}.site_id 가 없습니다 — run1 을 먼저 실행하세요")
        if not cat.is_table("sl_seller_site"):
            p.fatal.append("sl_seller_site 가 없습니다 — run1 을 먼저 실행하세요")
        if p.fatal:
            return p
        final, sim = simulate_sites(cat)
        p.expect["sim"] = sim
        # 다시 채운 뒤 유니크 충돌
        for t, _, new_name, cols in UNIQUES:
            if new_name not in cat.conname:
                p.warn.append(f"유니크 {new_name} 가 없습니다(run1 에서 건너뛰었나?)")
        for t, key in (("cm_bbm", "bbm_code"), ("sy_brand", "brand_code")):
            pkc = cat.pk[t]
            cnt = collections.Counter((final[t][i], c) for i, c in q(f"SELECT {pkc}, {key} FROM {S}.{t}"))
            d = [k for k, n in cnt.items() if n > 1]
            if d:
                p.fatal.append(f"{t} (site_id, {key}) 중복 {d[:10]} — 빈 site_id 를 채우면 유니크 위반")
        mx = q1(f"SELECT coalesce(max(length(allow_comment)), 0) FROM {S}.cm_bbm")
        p.expect["allow_comment_fits"] = (mx or 0) <= 1
        sp, _, _ = simulate_seller_sites(cat, final)
        p.expect["seller_plan"] = sp
    else:
        p.expect["allow_comment_fits"] = True
    # 호환 뷰도 처음에 잠근다 — 뒤에서 DROP VIEW 할 때 뷰를 읽던 세션과 교착되지 않게(뷰를 잠그면 원본 테이블도 같이 잠긴다)
    views = [o for o, _ in BOARD if assume_run1 or cat.is_view(o)]
    lock = views + sorted({tgt(cat, t) for t in SITE_NAMES} | {"sl_seller_site"})
    p.add("0", "잠금 대기 상한", "SET LOCAL lock_timeout = '10s'")
    p.add("0", "문장 실행 상한", "SET LOCAL statement_timeout = '10min'")
    p.add("0", "대상 테이블(·호환 뷰) 잠금", f"LOCK TABLE {', '.join(S + '.' + t for t in lock)} IN ACCESS EXCLUSIVE MODE")
    p.add("0", "실행 이력", f"INSERT INTO {BAK}._run (run_no, mode, note) VALUES ({run_no}, 'run2', {lit('배포 후 — NOT NULL·호환 뷰 삭제' + (' (+pm_cache)' if WITH_PM_CACHE else ''))})")
    # 1) 그 사이 생긴 빈 site_id 다시 채우기 (run1 과 같은 문장)
    for t, rules in SITE_TABLES:
        for title, sql in fill_stmts(cat, t, rules, run_no):
            p.add("1", title.replace("채우기", "다시 채우기"), sql)
    # 2) 매핑 없는 판매자
    p.add("2", "sl_seller_site — 매핑이 하나도 없는 판매자(배포 전 main 이 만든 판매자 등)", seller_site_sql())
    # 3) 호환 뷰 삭제
    for old, new in BOARD:
        if assume_run1 or cat.is_view(old):
            vdef = f"(예상) SELECT * FROM {S}.{new}" if assume_run1 else q1(f"SELECT pg_get_viewdef({lit(S + '.' + old)}::regclass)")
            p.add("3", f"호환 뷰 삭제 {old}", f"DROP VIEW {S}.{old}")
            p.log_ddl("3", "drop_view", old, old, detail=vdef)
    p.flush_ddl("3")
    # 4) NOT NULL
    for t in SITE_NAMES:
        if t in NOT_NULL_SKIP:
            p.warn.append(f"{t}.site_id NOT NULL 건너뜀 — {NOT_NULL_SKIP[t]}")
            continue
        tt = tgt(cat, t)
        if not assume_run1 and not cat.cols[tt]["site_id"]["null"]:
            continue
        p.add("4", f"NOT NULL {tt}.site_id", f"ALTER TABLE {S}.{tt} ALTER COLUMN site_id SET NOT NULL")
        p.log_ddl("4", "set_not_null", tt, "site_id")
    p.flush_ddl("4")
    # 5) 옛 게이트(reg_site_id) 삭제
    if assume_run1 or any(n == EXCEL_GATE_OLD for n, _ in cat.idx["sy_exceldown"]):
        idef = next((d for n, d in cat.idx["sy_exceldown"] if n == EXCEL_GATE_OLD), "")   # revert 가 이 정의로 되살린다
        p.add("5", f"옛 엑셀 게이트 삭제 {EXCEL_GATE_OLD} (reg_site_id — 감사 필드는 업무 키 금지 §12.2)", f"DROP INDEX {S}.{EXCEL_GATE_OLD}")
        p.log_ddl("5", "drop_index", "sy_exceldown", EXCEL_GATE_OLD, detail=idef)
    # 6) allow_comment 길이를 엔티티(length=1)에 맞춤 — 뷰가 없어야 타입을 바꿀 수 있다
    cur_len = None if assume_run1 else cat.cols["cm_bbm"]["allow_comment"]["len"]
    if assume_run1 or (cur_len and cur_len > 1):
        if p.expect.get("allow_comment_fits"):
            p.add("6", "cm_bbm.allow_comment varchar(300) → varchar(1) (엔티티 length=1)", f"ALTER TABLE {S}.cm_bbm ALTER COLUMN allow_comment TYPE varchar(1)")
            p.log_ddl("6", "alter_type", "cm_bbm", "allow_comment", f"varchar({cur_len or 300})", "varchar(1)")
        else:
            p.warn.append("cm_bbm.allow_comment 에 1자를 넘는 값이 있어 varchar(1) 로 줄이지 않음")
    p.flush_ddl("6")
    return p


# ═══════════════════════════════ revert 계획 ═══════════════════════════════

def build_revert(cat, run_no):
    p = Plan("revert", run_no)
    if not cat.bak or cat.bak_kind.get("_ddl") != "r":
        p.fatal.append(f"백업 스키마 {BAK} (._ddl) 가 없습니다 — run1 을 한 적이 없거나 백업이 지워졌습니다")
        return p
    runs = q(f"SELECT run_no, mode FROM {BAK}._run ORDER BY run_no")
    done = {r for r, m in runs if m == "revert"}
    last_revert = max(done) if done else 0
    active = [r for r, m in runs if m in ("run1", "run2") and r > last_revert]
    if not active:
        p.fatal.append(f"되돌릴 run 이 없습니다 (이력: {runs})")
        return p
    inlist = ", ".join(str(r) for r in active)
    ddl = q(f"SELECT run_no, ord, action, tbl, obj, old_name, new_name, detail FROM {BAK}._ddl WHERE run_no IN ({inlist}) ORDER BY run_no DESC, ord DESC")
    ddl = [(r, o, a, tgt(cat, t) if t else t, ob, ol, nw, d) for r, o, a, t, ob, ol, nw, d in ddl]   # 알림 테이블 rename 뒤면 새 이름으로
    changes = q(f"SELECT run_no, ord, table_name, pk_col, pk_val, column_name, old_val, new_val FROM {BAK}._changes WHERE run_no IN ({inlist}) ORDER BY run_no DESC, ord DESC")
    inserted = q(f"SELECT run_no, ord, table_name, pk_col, pk_val FROM {BAK}._inserted WHERE run_no IN ({inlist}) ORDER BY run_no DESC, ord DESC")
    p.info.append(f"되돌릴 run: {active} — 구조 {len(ddl)}건, 값 {len(changes)}건, 추가 행 {len(inserted)}건")
    added_cols = {(t, o) for _, _, a, t, o, _, _, _ in ddl if a == "add_column"}

    # 사전 점검: 되살릴 전역 유니크가 지금 데이터로 가능한가
    for _, _, a, t, o, _, _, d in ddl:
        if a == "drop_constraint" and d and d.startswith("UNIQUE ("):
            col = d[len("UNIQUE ("):-1]
            if cat.is_table(t) and cat.has_col(t, col):
                dup = q(f"SELECT {col}, count(*) FROM {S}.{t} GROUP BY 1 HAVING count(*) > 1 LIMIT 20")
                if dup:
                    p.fatal.append(f"{t}.{col} 전역 유니크를 되살릴 수 없음 — 사이트끼리 같은 값 {len(dup)}건+: {dup[:10]} (먼저 정리 필요)")
    lock = sorted({t for _, _, a, t, _, _, _, _ in ddl if t and cat.is_table(t)} | {t for _, _, t, _, _, _, _, _ in changes if cat.is_table(t)}
                  | {t for _, _, t, _, _ in inserted if cat.is_table(t)})
    views = [o for o, _ in BOARD if cat.is_view(o)]          # 뷰도 먼저 잠근다(DROP VIEW 교착 방지)
    p.add("0", "잠금 대기 상한", "SET LOCAL lock_timeout = '10s'")
    p.add("0", "문장 실행 상한", "SET LOCAL statement_timeout = '10min'")
    if lock or views:
        p.add("0", "대상 테이블(·호환 뷰) 잠금", f"LOCK TABLE {', '.join(S + '.' + t for t in views + lock)} IN ACCESS EXCLUSIVE MODE")
    p.add("0", "실행 이력", f"INSERT INTO {BAK}._run (run_no, mode, note) VALUES ({run_no}, 'revert', {lit('되돌림: run ' + inlist)})")

    # A) 호환 뷰 삭제 · B) 타입 되돌리기 · C) 지운 인덱스 되살리기  (값을 되돌리기 전에)
    for r, o, a, t, ob, old, new, d in ddl:
        if a == "create_view" and cat.is_view(ob):
            p.add("A", f"호환 뷰 삭제 {ob}", f"DROP VIEW {S}.{ob}")
        elif a == "alter_type" and cat.has_col(t, ob):
            p.add("B", f"타입 되돌리기 {t}.{ob} → {old}", f"ALTER TABLE {S}.{t} ALTER COLUMN {ob} TYPE {old}")
        elif a == "drop_index" and d and not cat.kind.get(ob):
            p.add("C", f"지운 인덱스 되살리기 {ob}", d)
        elif a == "set_not_null" and (t, ob) not in added_cols and cat.has_col(t, ob):
            p.add("C", f"NOT NULL 풀기 {t}.{ob}", f"ALTER TABLE {S}.{t} ALTER COLUMN {ob} DROP NOT NULL")
    # D) 값 되돌리기 (지금 값이 run 이 넣은 값일 때만 — 그 뒤 사람이 고친 값은 건드리지 않고 알린다)
    for r, o, t, pk, pv, col, old, new in changes:
        p.add("D", f"값 되돌리기 {t}.{col} [{pv}] {short(new, 30)} → {short(old, 30)}",
              f"UPDATE {S}.{t} SET {col} = {lit(old)} WHERE {pk} = {lit(pv)} AND {col}::text IS NOT DISTINCT FROM {lit(new)}", expect="soft1")
    for r, o, t, pk, pv in inserted:
        p.add("D", f"추가한 행 지우기 {t} [{pv}]", f"DELETE FROM {S}.{t} WHERE {pk} = {lit(pv)}", expect="soft1")
    # E) 지울 새 테이블·새 컬럼 값을 백업 스키마에 복사
    col_bak = f"{BAK}.rv{run_no}__col_values"
    if any(a == "add_column" and cat.has_col(t, ob) for _, _, a, t, ob, _, _, _ in ddl):
        p.add("E", "새 컬럼 값 보관 테이블", f"CREATE TABLE {col_bak} (table_name text, column_name text, pk_val text, val text)")
    for r, o, a, t, ob, old, new, d in ddl:
        if a == "create_table" and cat.is_table(ob):
            p.add("E", f"새 테이블 {ob} 행 보관", f"CREATE TABLE {BAK}.rv{run_no}_{ob} AS SELECT * FROM {S}.{ob}")
        elif a == "add_column" and cat.has_col(t, ob):
            pkc = cat.pk.get(t)
            p.add("E", f"새 컬럼 {t}.{ob} 값 보관",
                  f"INSERT INTO {col_bak} (table_name, column_name, pk_val, val) SELECT {lit(t)}, {lit(ob)}, {pkc}::text, {ob}::text FROM {S}.{t}")
    # F) 나머지 구조를 거꾸로
    for r, o, a, t, ob, old, new, d in ddl:
        if a == "add_constraint":
            p.add("F", f"제약 삭제 {t}.{ob}", f"ALTER TABLE {S}.{t} DROP CONSTRAINT IF EXISTS {ob}")
        elif a == "create_index":
            p.add("F", f"인덱스 삭제 {ob}", f"DROP INDEX IF EXISTS {S}.{ob}")
        elif a == "drop_constraint":
            p.add("F", f"전역 유니크 되살리기 {t}.{ob} {d}", f"ALTER TABLE {S}.{t} ADD CONSTRAINT {ob} {d}")
        elif a == "add_column":
            p.add("F", f"컬럼 삭제 {t}.{ob}", f"ALTER TABLE {S}.{t} DROP COLUMN IF EXISTS {ob}")
        elif a == "create_table":
            p.add("F", f"새 테이블 삭제 {ob}", f"DROP TABLE IF EXISTS {S}.{ob}")
        elif a == "rename_index":
            p.add("F", f"인덱스 이름 {new} → {old}", f"ALTER INDEX {S}.{new} RENAME TO {old}")
        elif a == "rename_constraint":
            p.add("F", f"제약 이름 {t}.{new} → {old}", f"ALTER TABLE {S}.{t} RENAME CONSTRAINT {new} TO {old}")
        elif a == "rename_table":
            p.add("F", f"테이블 이름 {new} → {old}", f"ALTER TABLE {S}.{new} RENAME TO {old}")
    p.expect["active"] = active
    p.expect["ddl"] = ddl
    return p


# ═══════════════════════════════ 출력·실행·검증 ═══════════════════════════════

def print_stmts(p, header):
    print(f"\n{'=' * 100}\n{header} — 문장 {len(p.stmts)}개 (이 순서 그대로 한 트랜잭션)\n{'=' * 100}")
    for i, (step, title, sql, _) in enumerate(p.stmts, 1):
        print(f"-- [{i}] ({step}) {title}\n{sql};")


def execute(p, skip=0):
    """계획 순서대로 실행 (번호는 dry 출력과 같게, 앞 skip 개는 이미 실행함)"""
    for i, (step, title, sql, expect) in enumerate(p.stmts, 1):
        if i <= skip:
            continue
        cur.execute(sql)
        n = cur.rowcount
        if expect == "soft1":
            if n != 1:
                p.warn.append(f"[{i}] {title} — {n}행 (그 뒤 값이 바뀌었거나 이미 없음 — 건너뜀)")
        elif expect is not None and n != expect:
            raise RuntimeError(f"[{i}] {title} — 기대 {expect}행인데 {n}행 (계획 이후 값이 바뀜)")
        print(f"  [{i}] ({step}) {title}" + (f" … {n}행" if n is not None and n >= 0 and not sql.lstrip().upper().startswith(("ALTER", "CREATE", "COMMENT", "LOCK", "SET", "DROP", "GRANT")) else ""))


def check(results, ok, msg):
    results.append((ok, msg))
    print(f"  [{'통과' if ok else '실패'}] {msg}")


def verify_run1(p, before_counts):
    print("\n[검증] run1")
    res = []
    kinds = dict(q(f"SELECT relname, relkind::text FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace AND relname IN ('sy_bbm','sy_bbs','cm_bbm','cm_bbs')"))
    check(res, kinds.get("cm_bbm") == "r" and kinds.get("cm_bbs") == "r", f"cm_bbm·cm_bbs 는 테이블: {kinds}")
    if all(s == "done" for s in p.expect["bstate"].values()):
        print("  [정보] run2 뒤 다시 실행 — 호환 뷰는 이미 지웠으므로 뷰 점검 건너뜀")
    else:
        check(res, kinds.get("sy_bbm") == "v" and kinds.get("sy_bbs") == "v", "sy_bbm·sy_bbs 는 호환 뷰")
        upd = q(f"SELECT pg_relation_is_updatable('{S}.sy_bbm'::regclass, false), pg_relation_is_updatable('{S}.sy_bbs'::regclass, false)")[0]
        check(res, all((u & 28) == 28 for u in upd), f"호환 뷰 자동 갱신 가능(INSERT·UPDATE·DELETE 비트 28): {upd}")
        # 실제로 뷰로 써 보고 SAVEPOINT 로 되돌린다 — main 백엔드(Hibernate)가 하는 INSERT/UPDATE/DELETE 와 같은 경로
        cur.execute("SAVEPOINT view_test")
        try:
            tid = "ZZVIEWTEST0000001"
            cur.execute(f"INSERT INTO {S}.sy_bbm (bbm_id, bbm_code, bbm_nm) VALUES ({lit(tid)}, 'ZZ_VIEW_TEST_20261003', '호환 뷰 점검')")
            r1 = q(f"SELECT secure_yn, use_yn, sort_ord FROM {S}.cm_bbm WHERE bbm_id = {lit(tid)}")
            cur.execute(f"UPDATE {S}.sy_bbm SET bbm_nm = '호환 뷰 점검2' WHERE bbm_id = {lit(tid)}")
            u1 = cur.rowcount
            cur.execute(f"INSERT INTO {S}.sy_bbs (bbs_id, bbm_id, bbs_title) VALUES ({lit(tid)}, {lit(tid)}, '호환 뷰 점검')")
            r2 = q(f"SELECT bbs_status_cd, view_count FROM {S}.cm_bbs WHERE bbs_id = {lit(tid)}")
            cur.execute(f"DELETE FROM {S}.sy_bbs WHERE bbs_id = {lit(tid)}")
            d2 = cur.rowcount
            cur.execute(f"DELETE FROM {S}.sy_bbm WHERE bbm_id = {lit(tid)}")
            d1 = cur.rowcount
            check(res, len(r1) == 1 and u1 == 1 and len(r2) == 1 and d1 == 1 and d2 == 1,
                  "뷰로 INSERT/UPDATE/DELETE → 원본 테이블에 반영 (SAVEPOINT 로 되돌림)")
            print(f"  [정보] 뷰로 넣은 행의 원본 기본값: cm_bbm(secure_yn, use_yn, sort_ord)={r1}, cm_bbs(bbs_status_cd, view_count)={r2} — 기대 ('N','Y',0)·('ACTIVE',0)")
        finally:
            cur.execute("ROLLBACK TO SAVEPOINT view_test")
            cur.execute("RELEASE SAVEPOINT view_test")
    left = q(f"""SELECT relname, relkind::text FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace
                 AND (relname LIKE 'sy\\_bbm%' OR relname LIKE 'sy\\_bbs%') AND relkind <> 'v'""")
    left += q(f"SELECT conname, 'constraint' FROM pg_constraint WHERE connamespace = {lit(S)}::regnamespace AND (conname LIKE 'sy\\_bbm%' OR conname LIKE 'sy\\_bbs%')")
    check(res, not left, f"옛 이름(sy_bbm*/sy_bbs*) 테이블·인덱스·제약 없음 {left if left else ''}")
    for nt in NEW_TABLES:
        cols = [r[0] for r in q(f"SELECT column_name FROM information_schema.columns WHERE table_schema = {lit(S)} AND table_name = {lit(nt['name'])} ORDER BY ordinal_position")]
        want = [c[0] for c in nt["cols"]] + [a[0] for a in AUDIT]
        check(res, cols == want, f"새 테이블 {nt['name']} 컬럼 = 엔티티 ({len(cols)}개)")
    check(res, q1(f"SELECT count(*) FROM information_schema.columns WHERE table_schema = {lit(S)} AND table_name = 'cm_bbm' AND column_name = 'secure_yn'") == 1, "cm_bbm.secure_yn 있음")
    # 행 수 그대로
    for t, n0 in before_counts.items():
        n1 = q1(f"SELECT count(*) FROM {S}.{t}")
        check(res, n1 == n0, f"행 수 {t}: {n0} → {n1}")
    # site_id
    sim = p.expect["sim"]
    actual = collections.Counter()
    for t, rule, site, n in q(f"SELECT table_name, rule, site_id, count(*) FROM {BAK}._site_fill WHERE run_no = {p.run_no} GROUP BY 1, 2, 3"):
        actual[(t, rule, site)] = n
    expected = collections.Counter()
    for t, info in sim.items():
        for pv, (site, rule) in info["fill"].items():
            expected[(t, rule, site)] += 1
    check(res, actual == expected, f"site_id 채우기 결과 = dry 시뮬레이션 (규칙·사이트별 {sum(expected.values())}행)"
          + ("" if actual == expected else f" 차이: 기대-실제 {dict(expected - actual)} / 실제-기대 {dict(actual - expected)}"))
    vc = Cat()
    for t in SITE_NAMES:
        nn, bad = q(f"SELECT count(*) FILTER (WHERE site_id IS NULL), count(*) FILTER (WHERE site_id IS NOT NULL AND site_id NOT IN (SELECT site_id FROM {S}.sy_site)) FROM {S}.{tgt(vc, t)}")[0]
        check(res, nn == 0 and bad == 0, f"{t}.site_id 빈 값 {nn} · sy_site 에 없는 값 {bad}")
    # 판매자 매핑
    miss = q1(f"SELECT count(*) FROM {S}.sl_seller s WHERE NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site e WHERE e.seller_id = s.seller_id)")
    check(res, miss == 0, f"모든 판매자에 sl_seller_site 매핑 있음 (없는 판매자 {miss})")
    want_pairs = {(s, site) for s, m in p.expect["seller_plan"].items() for site in m} | set(p.expect["seller_existing"])
    got_pairs = set(q(f"SELECT seller_id, site_id FROM {S}.sl_seller_site"))
    check(res, got_pairs == want_pairs, f"sl_seller_site 매핑 = dry 계획 ({len(got_pairs)}건)"
          + ("" if got_pairs == want_pairs else f" 차이: {sorted(want_pairs ^ got_pairs)[:10]}"))
    # 유니크
    have = {r[0] for r in q(f"SELECT conname FROM pg_constraint WHERE connamespace = {lit(S)}::regnamespace")}
    for t, old_def, new_name, cols in UNIQUES:
        check(res, new_name in have, f"유니크 {new_name}")
        olds = q1(f"""SELECT count(*) FROM pg_constraint co JOIN pg_class c ON c.oid = co.conrelid
                      WHERE co.connamespace = {lit(S)}::regnamespace AND c.relname = {lit(t)} AND pg_get_constraintdef(co.oid) = {lit(old_def)}""")
        check(res, olds == 0, f"전역 유니크 {t} {old_def} 없음")
    check(res, q1(f"SELECT count(*) FROM pg_indexes WHERE schemaname = {lit(S)} AND indexname = {lit(EXCEL_GATE_NEW)}") == 1, f"인덱스 {EXCEL_GATE_NEW}")
    # 참조값·코드값
    left_refs = plan_refs(Cat())
    check(res, not left_refs, f"설정 테이블에 옛 이름 참조 없음 {[(a, d, c) for a, b, c, d, e, f in left_refs][:5] if left_refs else ''}")
    badc = q(f"SELECT bbm_id, allow_comment FROM {S}.cm_bbm WHERE allow_comment NOT IN ('Y', 'N')")
    check(res, not badc, f"cm_bbm.allow_comment 는 Y/N 만 {badc if badc else ''}")
    m = p.expect["menu"]
    if m.get("menu_id"):
        n_role = q1(f"SELECT count(*) FROM {S}.sy_role_menu WHERE menu_id = {lit(m['menu_id'])}")
        check(res, q1(f"SELECT count(*) FROM {S}.sy_menu WHERE menu_id = {lit(m['menu_id'])} AND menu_url = {lit(MENU_NEW['url'])}") == 1
              and n_role == len(m["roles"]), f"메뉴 {m['menu_id']} + 역할 권한 {n_role}건")
    return res


def verify_run2(p):
    print("\n[검증] run2")
    res = []
    vc = Cat()
    for t in SITE_NAMES:
        nn = q1(f"SELECT count(*) FROM {S}.{tgt(vc, t)} WHERE site_id IS NULL")
        nullable = q1(f"SELECT is_nullable FROM information_schema.columns WHERE table_schema = {lit(S)} AND table_name = {lit(tgt(vc, t))} AND column_name = 'site_id'")
        want_nn = t not in NOT_NULL_SKIP
        check(res, nn == 0 and (nullable == "NO") == want_nn, f"{t}.site_id 빈 값 {nn}, NULL 허용={nullable}" + ("" if want_nn else " (NOT NULL 건너뜀)"))
    kinds = dict(q(f"SELECT relname, relkind::text FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace AND relname IN ('sy_bbm','sy_bbs')"))
    check(res, not kinds, f"호환 뷰 없음 {kinds if kinds else ''}")
    check(res, q1(f"SELECT count(*) FROM pg_indexes WHERE schemaname = {lit(S)} AND indexname = {lit(EXCEL_GATE_OLD)}") == 0, f"옛 게이트 {EXCEL_GATE_OLD} 없음")
    miss = q1(f"SELECT count(*) FROM {S}.sl_seller s WHERE NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site e WHERE e.seller_id = s.seller_id)")
    check(res, miss == 0, f"모든 판매자 매핑 (없는 판매자 {miss})")
    return res


def verify_revert(p, before):
    print("\n[검증] revert")
    res = []
    kinds = dict(q(f"SELECT relname, relkind::text FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace AND relname IN ('sy_bbm','sy_bbs','cm_bbm','cm_bbs')"))
    created_tables = {ob for _, _, a, _, ob, _, _, _ in p.expect["ddl"] if a == "create_table"}
    renamed = {old for _, _, a, _, _, old, _, _ in p.expect["ddl"] if a == "rename_table"}
    for old, new in BOARD:
        if old in renamed:
            check(res, kinds.get(old) == "r", f"{old} 는 다시 테이블")
            check(res, new not in kinds, f"{new} 없음")
    for t in created_tables:
        check(res, not q1(f"SELECT count(*) FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace AND relname = {lit(t)}"), f"새 테이블 {t} 없음")
    for _, _, a, t, ob, _, _, _ in p.expect["ddl"]:
        if a == "add_column":
            tt = {"cm_bbm": "sy_bbm", "cm_bbs": "sy_bbs"}.get(t, t) if any(o in renamed for o in ("sy_bbm", "sy_bbs")) else t
            check(res, not q1(f"SELECT count(*) FROM information_schema.columns WHERE table_schema = {lit(S)} AND table_name = {lit(tt)} AND column_name = {lit(ob)}"),
                  f"컬럼 {tt}.{ob} 없음")
    for t, n0 in before.items():
        tt = {"cm_bbm": "sy_bbm", "cm_bbs": "sy_bbs"}.get(t, t)
        if q1(f"SELECT count(*) FROM pg_class WHERE relnamespace = {lit(S)}::regnamespace AND relname = {lit(tt)} AND relkind = 'r'"):
            n1 = q1(f"SELECT count(*) FROM {S}.{tt}")
            check(res, n1 == n0, f"행 수 {tt}: {n0} → {n1}")
    return res


def counts(tables):
    return {t: q1(f"SELECT count(*) FROM {S}.{t}") for t in tables}


def print_summary(p1):
    """run1 이 바꾸는 것 — 단계별 요약 (문장 제목에서 모은다)"""
    print("\n[run1 요약] 단계별로 바꾸는 것")
    names = {"0": "준비(잠금·백업)", "1": "게시판 이름 변경", "2": "새 테이블", "3": "새 컬럼·인덱스", "4": "site_id 채우기",
             "5": "sl_seller_site 채우기", "6": "유니크·게이트", "7": "옛 이름 참조값", "8": "코드값", "9": "BO 메뉴", "10": "호환 뷰"}
    by = collections.OrderedDict()
    for step, title, sql, _ in p1.stmts:
        if title.startswith(("주석", "백업 기록", "잠금", "문장 실행", "실행 이력", "백업 스키마", "백업 기록 테이블")):
            continue
        by.setdefault(step, []).append(title)
    for step, titles in by.items():
        if step in ("4",):
            print(f"  {step}) {names[step]}: UPDATE {len(titles)}문 (테이블 {len(SITE_NAMES)}개 × 규칙)")
        elif step in ("7",):
            print(f"  {step}) {names[step]}: {len(titles)}건 (아래 표)")
        else:
            print(f"  {step}) {names.get(step, step)}: " + " / ".join(titles))


def print_dry_report(cat, p1, now):
    sim = p1.expect["sim"]
    print_summary(p1)
    print(f"\n[상태] 게시판 테이블: " + ", ".join(f"{o}→{n}: {p1.expect['bstate'][o]}" for o, n in BOARD))
    print("       새 테이블: " + ", ".join(f"{t}={'있음' if cat.is_table(t) else '없음'}" for t in NEW_TABLE_NAMES))
    print("       site_id 없는 대상 테이블: " + str(sum(1 for t in SITE_NAMES if not cat.has_col(phys(cat, t), 'site_id'))) + f"/{len(SITE_NAMES)}")
    print(f"       백업 스키마 {BAK}: {'있음 ' + str(sorted(cat.bak_kind)) if cat.bak else '없음'} → 이번 run 번호 {p1.run_no}")

    print("\n[4) site_id 채우기 시뮬레이션] (부모 → 근거 → 유효한 reg_site_id → SI260001)")
    print(f"  {'테이블':<18}{'행':>6}{'채움':>6}  규칙별(행)  →  사이트별(행)")
    tot = 0
    for t in SITE_NAMES:
        info = sim[t]
        byrule = collections.Counter(r for _, r in info["fill"].values())
        bysite = collections.Counter(s for s, _ in info["fill"].values())
        tot += len(info["fill"])
        print(f"  {t:<18}{info['total']:>6}{len(info['fill']):>6}  {dict(byrule)}  →  {dict(bysite)}"
              + (f"   [reg_site_id 빈 값 {info['reg_null']}, sy_site 에 없는 값 {info['reg_bad']}]" if info['reg_null'] or info['reg_bad'] else ""))
        for par, ccol, nkey, miss, bad in info["orphan"]:
            if nkey is None:
                if bad:
                    print(f"      · 근거 {par}: 주문 사이트가 여럿이라 못 정한 정산 {bad}건 → 다음 규칙으로")
            elif nkey or miss or bad:
                print(f"      · 부모 {par}.{ccol}: 키 없음 {nkey} · 부모 없음(고아) {miss} · 부모 사이트 무효 {bad} → 다음 규칙으로")
    print(f"  합계 채울 행 {tot}")

    # 참고: 다른 근거와 reg_site_id 가 다른 행 (결과는 바꾸지 않음)
    print("\n[참고] 루트 테이블을 다른 근거로 봤을 때와 다른 행 (결과에는 반영하지 않음 — 정책 sy.57 §12.4 대로 reg_site_id 를 1회성 근거로 씀)")
    ch = q(f"""SELECT count(*) FROM {S}.cm_chatt c WHERE EXISTS (SELECT 1 FROM {S}.cm_chatt_member cm JOIN {S}.mb_member m ON m.member_id = cm.ref_id
               WHERE cm.chatt_id = c.chatt_id AND cm.member_type_cd = 'MEMBER' AND m.site_id IS DISTINCT FROM c.reg_site_id)""")[0][0]
    ct = q1(f"SELECT count(*) FROM {S}.sy_contact c JOIN {S}.mb_member m ON m.member_id = c.member_id WHERE m.site_id IS DISTINCT FROM c.reg_site_id")
    print(f"  cm_chatt: 참여 회원의 사이트 ≠ reg_site_id {ch}건 · sy_contact: 문의 회원의 사이트 ≠ reg_site_id {ct}건")
    bfin = p1.expect["final"]["sy_brand"]
    cross = q(f"SELECT brand_id, site_id, count(*) FROM {S}.pd_prod WHERE brand_id IS NOT NULL GROUP BY 1, 2 ORDER BY 1")
    xs = [(b, s, n) for b, s, n in cross if b in bfin and bfin[b] != s]
    print(f"  sy_brand: 브랜드 사이트와 다른 사이트 상품이 쓰는 경우 {len(xs)}건 {xs[:10] if xs else ''} (FO 브랜드 목록이 사이트로 걸러짐)")

    sp = p1.expect["seller_plan"]
    print(f"\n[5) sl_seller_site 계획] 매핑 없는 판매자 {len(sp)}명 → 매핑 {sum(len(v) for v in sp.values())}건 (이미 있는 매핑 {len(p1.expect['seller_existing'])}건)")
    names = dict(q(f"SELECT seller_id, seller_nm FROM {S}.sl_seller"))
    for sid, m in sp.items():
        print(f"  {sid:<22}{short(names.get(sid), 16):<18}" + " · ".join(f"{site}({'+'.join(src)})" for site, src in sorted(m.items())))
    multi = [s for s, m in sp.items() if len(m) > 1]
    dflt = [s for s, m in sp.items() if DEFAULT_SITE in m and m[DEFAULT_SITE] == ["대표사이트(근거 없음)"]]
    print(f"  여러 사이트 판매자 {len(multi)}명 {multi} · 근거 없어 대표사이트 {len(dflt)}명 {dflt}")
    ex = p1.expect["seller_extra"]
    print(f"  참고(계획에 없음): 소속 관리자 계정(sl_seller_member.user_id→sy_user)의 사이트까지 넣으면 늘어날 매핑 {len(ex)}건 {ex[:10] if ex else ''}")

    print("\n[6) 유니크 중복 점검] (채운 뒤 값 기준)")
    for k, v in p1.expect["dups"].items():
        print(f"  {k}: 중복 {len(v)}건 {v[:10] if v else ''}")

    print("\n[7) 옛 이름 참조값 → 새 이름] (브랜치 코드에서 확인한 이름)")
    for t, pk, pv, col, old, new in p1.expect["refs"]:
        so, sn = snip(old, new)
        print(f"  {t}.{col} [{pk}={pv}]  {so}  →  {sn}")
    print("  근거: ecFeBo boAppLazyClasses/boAppBase(cmBbmMng·cmBbmDtl·cmBbsMng·cmBbsDtl·cmBbmMenuMng), CmBbmMng biz-cd=\"cm_bbm\"·QCmBbmRepositoryImpl bizCd \"cm_bbm\",")
    print("        CmPopupPickService FO_ALLOWED_ENTITIES 'CmBbm', SyMgmtExcelDomainConfig 도메인 키 cmBbm/cmBbs (/api/bo/excel/{domain}/excel), CmBbsDtl·Sample04 가 'bbm' 팝업 사용")
    hits = scan_all_refs(cat)
    print("  [그대로 두는 곳] 설정 테이블 밖에서 찾은 옛 이름:")
    for t, c, n, why in hits:
        print(f"    {t}.{c}: {n}행 — {why}")

    print("\n[8) 코드값]")
    for t, pk, pv, col, old, new in p1.expect["fixes"]:
        print(f"  {t}.{col} [{pv}] {old} → {new}")
    for line in p1.expect["code_report"]:
        print(f"  · {line}")

    m = p1.expect["menu"]
    print("\n[9) BO 메뉴]")
    if m.get("menu_id"):
        print(f"  새 메뉴 {m['menu_id']} {MENU_NEW['code']} '{MENU_NEW['nm']}' {MENU_NEW['url']} 상위 {m['parent']} 순서 {m['sort']} (게시판관리 {m['sib_id']} 다음)")
        print(f"  순서 밀기: {[(b[2], b[4] + '→' + b[5]) for b in m['bumps']]}")
        print(f"  역할 권한 {len(m['roles'])}건 (게시판관리와 같은 role_id·perm_level): {[(r[1], r[2]) for r in m['roles']]}")
    else:
        print(f"  {m.get('skip') or m.get('error')}")


def main():
    connect()
    now = datetime.datetime.now()
    print(f"[{MODE}] {now:%Y-%m-%d %H:%M:%S}  DB {os.environ.get('DB_HOST', 'illeesam.synology.me')}:{os.environ.get('DB_PORT', '17632')} 스키마 {S}"
          + ("  (읽기 전용 세션)" if MODE == "dry" else ""))
    cat = Cat()
    run_no = next_run_no(cat)

    if MODE == "dry":
        p1 = build_run1(cat, run_no, now)
        print_dry_report(cat, p1, now)
        print("\n[사전점검]")
        for m in p1.fatal:
            print(f"  [실패] {m}")
        for m in p1.warn:
            print(f"  [주의] {m}")
        for m in p1.info:
            print(f"  [정보] {m}")
        if not p1.fatal:
            print("  [통과] run1 을 막는 문제 없음")
        print_stmts(p1, "run1 SQL (배포 전)")
        print("-- 이어서 검증(실패하면 전체 롤백): 게시판 relkind, pg_relation_is_updatable, SAVEPOINT 안에서 뷰 INSERT/UPDATE/DELETE 후 ROLLBACK TO SAVEPOINT,")
        print("--   옛 이름 relation/constraint 0, 새 테이블 컬럼 = 엔티티, 행 수 그대로, _site_fill 집계 = 시뮬레이션, site_id 빈 값/무효 0,")
        print("--   판매자 전원 매핑·매핑 = 계획, 유니크·게이트 존재, 설정 테이블 옛 이름 0, allow_comment Y/N, 새 메뉴 + 권한 → COMMIT")
        bs = board_state(cat)
        if all(s == "rename" for s in bs.values()):
            p2 = build_run2(cat, run_no + 1, assume_run1=True)
            print_stmts(p2, "run2 SQL (배포 후 — run1 적용 상태를 가정한 예상, 실제는 실행 시점 상태로 다시 만든다)")
        else:
            p2 = build_run2(cat, run_no)
            print_stmts(p2, "run2 SQL (지금 상태 기준)")
        print("-- 이어서 검증: site_id 빈 값 0·NOT NULL, 호환 뷰 없음, 옛 게이트 없음, 판매자 전원 매핑 → COMMIT")
        for m in p2.fatal + p2.warn:
            print(f"  [run2 주의] {m}")
        if cat.bak and cat.bak_kind.get("_ddl") == "r":
            pr = build_revert(cat, run_no)
            for m in pr.fatal + pr.warn + pr.info:
                print(f"  [revert] {m}")
            print_stmts(pr, "revert SQL (지금 백업 기록 기준)")
        else:
            print(f"\n[revert] 백업 스키마 {BAK} 기록이 없어 되돌릴 것 없음 (run1 전). run1 뒤에는 _ddl·_changes·_inserted 를 거꾸로 실행한다.")
        conn.rollback()
        print(f"\n(dry) 아무것도 바꾸지 않았습니다. 사전점검 {'실패 ' + str(len(p1.fatal)) + '건 — 종료코드 1' if p1.fatal else '통과 — run1 실행 가능'}")
        sys.exit(1 if p1.fatal else 0)

    try:
        if MODE == "run1":
            # 잠금 → 잠근 상태에서 다시 계획 → 실행 → 검증
            pre = build_run1(cat, run_no, now)
            if pre.fatal:
                for m in pre.fatal:
                    print(f"  [실패] {m}")
                raise SystemExit(1)
            for step, title, sql, _ in pre.stmts[:4]:
                cur.execute(sql)
            cat = Cat()
            p = build_run1(cat, run_no, now)
            if p.fatal:
                for m in p.fatal:
                    print(f"  [실패] {m}")
                raise RuntimeError("잠근 뒤 사전점검 실패")
            before = counts([phys(cat, t) for t in SITE_NAMES])
            before = {({"sy_bbm": "cm_bbm", "sy_bbs": "cm_bbs"}.get(t, t)): n for t, n in before.items()}
            if [s[2] for s in p.stmts[:4]] != [s[2] for s in pre.stmts[:4]]:
                raise RuntimeError("잠근 뒤 다시 만든 계획의 잠금 대상이 달라졌습니다 — 다시 실행하세요")
            print(f"[run1] 문장 {len(p.stmts)}개 실행 (run {run_no}) — [1]~[4] 잠금은 실행함")
            execute(p, skip=4)
            res = verify_run1(p, before)
        elif MODE == "run2":
            p = build_run2(cat, run_no)
            if p.fatal:
                for m in p.fatal:
                    print(f"  [실패] {m}")
                raise SystemExit(1)
            for m in p.warn:
                print(f"  [주의] {m}")
            print(f"[run2] 문장 {len(p.stmts)}개 실행 (run {run_no})")
            execute(p)
            res = verify_run2(p)
        else:
            p = build_revert(cat, run_no)
            if p.fatal:
                for m in p.fatal:
                    print(f"  [실패] {m}")
                raise SystemExit(1)
            print("⚠ 되돌린 DB 는 main 코드 기준 — 브랜치를 배포했다면 먼저 main 으로 다시 배포할 것")
            before = counts([t for t in ("cm_bbm", "cm_bbs") if cat.is_table(t)])
            print(f"[revert] 문장 {len(p.stmts)}개 실행 (run {run_no}, 되돌릴 run {p.expect['active']})")
            execute(p)
            res = verify_revert(p, before)
        for m in p.warn:
            print(f"  [주의] {m}")
        bad = [m for ok, m in res if not ok]
        if bad:
            raise RuntimeError(f"검증 실패 {len(bad)}건: {bad}")
        conn.commit()
        print(f"\n[완료] {MODE} 커밋했습니다 (run {run_no}). 백업: {BAK}")
        if MODE == "run1":
            print("  다음: ecBeBo·ecFeBo 브랜치 병합·배포(ecBeBo 재기동) → BO/FO 확인 → run2")
        elif MODE == "run2":
            print("  다음: pm_cache 는 FoMyExtraController 수정 뒤 run2 --with-pm-cache" if NOT_NULL_SKIP else "")
    except SystemExit as e:
        conn.rollback()
        print("\n[중단] 사전점검 실패 — 아무것도 바꾸지 않았습니다.")
        sys.exit(e.code if isinstance(e.code, int) else 1)
    except Exception as e:
        conn.rollback()
        print(f"\n[실패] 롤백했습니다: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
