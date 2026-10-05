# -*- coding: utf-8 -*-
r"""
migration_20261005_org_seller.py — 조직·판매자 구조 통일 (2026-10-05, 정책 z0docs 정책서/sy/sy.59.조직·판매자구조정책.md)

  목표(사용자 원칙 "ER 관계가 복잡하면 안 된다"): 조직은 판매자(sl_seller) 하나. 새 테이블·연결 테이블을 만들지 않는다.
    · 판매자 유형 seller_type_cd = OPERATOR(사이트 운영사) / COMPANY(입점 사업자) / INDIVIDUAL(개인)
    · 사이트의 운영사 = sy_site.operator_seller_id 컬럼 하나(사이트당 하나가 구조로 보장). sl_seller_site 는 입점 판매자 매핑으로만
    · 소속 역할 = sl_seller_member.role_cd 하나(MANAGER/OPR/MD/CS) + owner_yn. is_main 폐기. 역할 → 권한은 백엔드 코드 상수(매핑 테이블 없음)
    · 업체(sy_vendor·sy_vendor_user·sy_vendor_user_role·sy_vendor_brand·sy_vendor_content)를 판매자로 합친다 → 테이블 5개가 빠진다
    · 주문 판매자 단위(od_order_item.seller_id·od_dliv.seller_id)는 여기서 다루지 않는다 — 다른 작업(migration_20261005_seller_scope.sql)과 D8 구현

  단계(--step)
    1 비파괴 구조 추가 — 언제 실행해도 지금 코드가 그대로 돈다
        DDL : sy_site.operator_seller_id(+FK·인덱스) / sl_seller 사업자 칸 9개(seller_business_no·seller_ceo_nm·seller_email·seller_phone·
              seller_zip_code·seller_addr·seller_addr_detail·contract_date·seller_intro) / sl_seller_member.owner_yn(NOT NULL DEFAULT 'N') /
              sy_brand.seller_id·pd_dliv_tmplt.seller_id(+FK·인덱스) / cm_dashboard.share_seller_ids / 코드 컬럼 주석 갱신
        코드: SELLER_TYPE_CD + OPERATOR, SELLER_STATUS_CD + CLOSED, 새 그룹 SELLER_MEMBER_ROLE_CD(MANAGER/OPR/MD/CS — 전체 공통),
              SITE_TYPE_CD + MARKET/SINGLE/C2C, 대상 유형 4그룹(PROMO_TARGET_TYPE·DISCNT_PROD_TARGET·PM_PROD_TARGET·NOTI_TARGET_TYPE) + SELLER
    2 값 이전 — 지금 코드로도 오류 없이 돈다. 단 업체 직원 40명이 소속을 얻어 범위가 좁아진다(배포된 판매자 범위 08671e4 는 운영사를 몰라
      운영사 소속 22명이 ShopJoy 운영팀 상품·프로모션만 봄) → 코드 A 배포 바로 앞에 이어서 실행. 다시 실행하면 그 사이 생긴 옛 값(OWNER/STAFF·판매자 없는 상품)만 다시 옮긴다.
      다른 작업의 migration_20261005_seller_scope.sql(od_order_item.seller_id)은 이 단계 뒤에 실행(또는 다시 실행)하면 판매자 없던 상품의 주문상품도 운영사로 채워진다.
        ① 사이트별 운영사 판매자 지정·생성(아래 상수), sy_site 운영 주체 칸 → 운영사 판매자, 운영사의 sl_seller_site 호환 행(3단계에서 지움)
        ② 업체 → 판매자 합치기(이미 vendor_id 로 연결된 판매자에 사업자·계약·주소·소개를 채움, 판매자가 아닌 업체(택배·CS·전산 외주)의 판매자 행은 CLOSED)
        ③ 업체 직원(sy_vendor_user) → 판매자 소속(sl_seller_member.user_id)  ④ 소속 역할 이전(OWNER → MANAGER+owner_yn=Y, STAFF → OPR/MD)
        ⑤ 판매자 없는 상품 채우기(D10)  ⑥ 브랜드·배송템플릿·대시보드 공유의 업체 → 판매자  ⑦ 사이트 유형 3종  ⑧ 정산·프로모션 seller_id 빈 칸
    3 나중 정리 — 새 코드 배포 뒤에만(--confirm-deployed). 지운 값은 백업에 남기고 revert 로 되살린다
        운영사의 sl_seller_site 행 삭제, sy_site.operator_seller_id NOT NULL, 컬럼 삭제(sl_seller_member.is_main, vendor_id 16개 테이블,
        cm_dashboard.share_vendor_ids, sy_site.site_ceo·site_business_no·site_zip_code·site_address), sy_vendor 계열 5개 읽기 전용(트리거),
        옛 코드값·업체 코드그룹·업체형 역할 사용 안 함(use_yn='N'), 소속 사용자의 업체형 sy_user_role 행 삭제

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_orgseller_20261005
     _run(실행 이력) · _ddl(실행한 DDL 과 되돌릴 DDL) · _chg(바꾼 값) · _ins(추가한 행) · _del(지운 행, json) · _coldef/_colval(삭제한 컬럼 정의·값)
     revert --step N = 그 단계만 거꾸로(3 → 2 → 1 순서로만). 그 뒤 값이 또 바뀐 칸은 건드리지 않고 알린다. 모든 단계를 되돌리면 백업 스키마 삭제.

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261005_org_seller.py dry    [--step 1|2|3]   # 읽기 전용 세션 — 단계별 계획·건수·표본
     python migration_20261005_org_seller.py status                  # 종료코드 0 = 1·2단계 적용됨, 3 = 남은 것 있음
     python migration_20261005_org_seller.py run    --step 1
     python migration_20261005_org_seller.py run    --step 2
     python migration_20261005_org_seller.py run    --step 3 --confirm-deployed
     python migration_20261005_org_seller.py revert --step 3|2|1 [--force]
  run 뒤: BO 공통코드 캐시(Redis sy:code:*)를 비우거나 BO 공통코드관리 [캐시 새로고침]. 백엔드 재기동은 필요 없다(3단계는 새 코드 배포 뒤).
"""
import os, sys, re, json, datetime, collections
import psycopg2, psycopg2.extras

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_orgseller_20261005"
MIG = "MIGRATION_20261005_ORG"
USAGE = ("사용법: python migration_20261005_org_seller.py dry|status|run|revert [--step 1|2|3] [--confirm-deployed] [--force]\n"
         "  run·revert 는 --step 이 필요합니다.")

# ══════════════════ 판단이 갈리는 데이터 — 기본값(바꿀 수 있음, 근거는 정책서 sy.59 부록 B) ══════════════════
# 사이트 유형 3종: MARKET(오픈마켓형: 운영사 + 입점 COMPANY/INDIVIDUAL) · SINGLE(단독몰형: 운영사만) · C2C(개인 간 거래형: 운영사 + INDIVIDUAL)
SITE_TYPE = {"SI260001": "MARKET", "SI260002": "MARKET", "SI260003": "C2C",
             "SI260004": "SINGLE", "SI260005": "SINGLE", "SI260006": "SINGLE"}
SITE_TYPE_DEFAULT = "SINGLE"          # 모듈 없는 데모 사이트(SI260007~) — 상품·판매자 0건
# 운영사: ec1·ec2·당무마켓1 은 sy_site 에 대표자·사업자번호가 비어 있고(플랫폼 본사 직영), 업체 "ShopJoy 운영팀"(VN000010, 업체유형 SITE)이
#         이미 판매자 SEL2609292349050011 로 연결돼 있다 → 이 판매자를 세 사이트의 운영사로.
PLATFORM_OPERATOR = "SEL2609292349050011"
OPERATOR_FIXED = {"SI260001": PLATFORM_OPERATOR, "SI260002": PLATFORM_OPERATOR, "SI260003": PLATFORM_OPERATOR}
# 그 밖의 사이트: sy_site 대표자·사업자번호가 있으면 그 사업자로 운영사 판매자를 새로 만든다(같은 사업자번호 = 한 판매자). 없으면 PLATFORM_OPERATOR.
OPERATOR_NEW_FROM_SITE = True
# 판매자가 아닌 업체 유형(sy_vendor.vendor_type_cd) → 그 업체 직원을 "업체 등록 사이트의 운영사" 소속으로 옮길 때의 역할(None = 옮기지 않음).
# 택배사는 공통코드 COURIER 로만 남고(조직 아님), CS 대행·전산 외주 직원은 운영사의 CS·OPR 직원이 된다.
NON_SELLER_VENDOR = {"DELIVERY": "CS", "CS": "CS", "PROG": "OPR"}
NON_SELLER_STATUS = "CLOSED"          # 위 업체와 연결돼 있던 판매자 행의 상태(상품·주문 0건)
# 업체 직원 역할(sy_role.role_code) → 소속 역할. 목록에 없으면 VENDOR_ROLE_DEFAULT. 업체 대표 담당자(is_main=Y)이고 결과가 MANAGER 면 owner_yn=Y.
VENDOR_ROLE = {"REP": "MANAGER", "MGT": "MANAGER", "SITE_ADMIN": "MD", "SITE_OPER": "MD", "STAFF": "CS", "SALES_CALL": "CS", "SALES_BLOCKED": "CS",
               "SITE_OP_ADMIN": "MANAGER", "SITE_OP_OPER": "OPR", "SITE_OP_CONTENT": "MD", "SITE_OP_READ": "CS"}
VENDOR_ROLE_DEFAULT = "MD"
REMOVED_VENDOR_USER_STATUS = {"SUSPENDED", "LEFT"}   # 이 상태의 업체 직원 → 소속 status_cd = REMOVED
# 기존 소속 STAFF: BO 사용자의 역할(sy_user.role_id)이 이 role_code 이고 운영사 소속이면 OPR, 그 밖의 STAFF 는 MD
STAFF_OPR_ROLE_CODES = {"SITE_OPER"}
# 당무마켓(C2C)에서 등록자(reg_by)가 그 사이트 회원이 아닌 상품(SEED 등) → 운영사
C2C_FALLBACK = "OPERATOR"
# 단독몰(SINGLE)에 이미 매핑된 입점 판매자(테스트 판매자 6개) — True = 그대로 두고 알리기만, False = 매핑을 SUSPENDED 로
KEEP_SINGLE_MALL_VENDORS = True

ROLE_RANK = {"MANAGER": 4, "OPR": 3, "MD": 2, "CS": 1}
NEW_ROLES = ("MANAGER", "OPR", "MD", "CS")

# ── 인자 ──
ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
STEP, CONFIRM, FORCE = None, False, False
try:
    i = 1
    while i < len(ARGS):
        if ARGS[i] == "--step": STEP = int(ARGS[i + 1]); i += 1
        elif ARGS[i] == "--confirm-deployed": CONFIRM = True
        elif ARGS[i] == "--force": FORCE = True
        else: raise ValueError(ARGS[i])
        i += 1
except (ValueError, IndexError):
    sys.exit(USAGE)
if MODE not in ("dry", "status", "run", "revert") or (STEP is not None and STEP not in (1, 2, 3)):
    sys.exit(USAGE)
if MODE in ("run", "revert") and STEP is None:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261005_org_seller")
conn.set_client_encoding("UTF8")
if MODE in ("dry", "status"):
    conn.set_session(readonly=True, autocommit=True)    # 읽기 전용 — 쓰기를 시도하면 DB 가 거절한다
else:
    conn.autocommit = False
cur = conn.cursor()


def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall() if cur.description else None


def q1(sql, args=None):
    r = q(sql, args)
    return r[0][0] if r else None


def has_table(schema, name):
    return bool(q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (schema, name)))


def load_meta():
    global coltype, colfull
    coltype, colfull = {}, {}
    for t, c, dt, ml, np_, ns, nl, dflt in q("""SELECT table_name, column_name, data_type, character_maximum_length, numeric_precision, numeric_scale,
                                                     is_nullable, column_default FROM information_schema.columns WHERE table_schema=%s""", (S,)):
        coltype[(t, c)] = dt
        if dt == "character varying": full = f"varchar({ml})" if ml else "varchar"
        elif dt == "character": full = f"char({ml or 1})"
        elif dt == "numeric": full = f"numeric({np_},{ns})" if np_ else "numeric"
        elif dt == "timestamp without time zone": full = "timestamp"
        else: full = dt
        colfull[(t, c)] = (full, nl == "YES", dflt)


load_meta()
PKS = {t: c for t, c in q("""SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
                               JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
                              WHERE tc.table_schema=%s AND tc.constraint_type='PRIMARY KEY'""", (S,))}
has_col = lambda t, c: (t, c) in coltype
bak_exists = has_table(BAK, "_run")
NOW = datetime.datetime.now().replace(microsecond=0)
TS = NOW.strftime("%y%m%d%H%M%S")


def comment_of(t, c):
    return q1("""SELECT pgd.description FROM pg_catalog.pg_statio_all_tables st
                   JOIN information_schema.columns ic ON ic.table_schema = st.schemaname AND ic.table_name = st.relname
                   LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = ic.ordinal_position
                  WHERE st.schemaname=%s AND st.relname=%s AND ic.column_name=%s""", (S, t, c))


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


# ═══════════════════════════════ 1단계 계획 ═══════════════════════════════
NEW_COLS = [  # (테이블, 컬럼, 타입, 주석)
    ("sy_site", "operator_seller_id", "varchar(21)", "운영사 판매자ID (sl_seller.seller_id, 판매자유형 OPERATOR) — 사이트당 하나, 운영사는 여러 사이트 가능 (정책 sy.59)"),
    ("sl_seller", "seller_business_no", "varchar(20)", "사업자등록번호 (업체 sy_vendor·사이트 sy_site 에서 옮김)"),
    ("sl_seller", "seller_ceo_nm", "varchar(50)", "대표자명"),
    ("sl_seller", "seller_email", "varchar(100)", "판매자 대표 이메일"),
    ("sl_seller", "seller_phone", "varchar(20)", "판매자 대표 전화"),
    ("sl_seller", "seller_zip_code", "varchar(10)", "사업장 우편번호"),
    ("sl_seller", "seller_addr", "varchar(300)", "사업장 주소"),
    ("sl_seller", "seller_addr_detail", "varchar(200)", "사업장 상세주소"),
    ("sl_seller", "contract_date", "date", "계약일 (입점·운영 계약)"),
    ("sl_seller", "seller_intro", "text", "판매자 소개(HTML) — 업체 콘텐츠 sy_vendor_content(INTRO)에서 옮김"),
    ("sl_seller_member", "owner_yn", "char(1) NOT NULL DEFAULT 'N'", "소유자 여부 Y/N — 판매자의 주인(개인 판매자는 그 회원, 회사는 대표). 역할(role_cd)과 별개"),
    ("sy_brand", "seller_id", "varchar(21)", "브랜드를 가진 판매자 (sl_seller.seller_id) — 업체 브랜드 sy_vendor_brand 에서 옮김"),
    ("pd_dliv_tmplt", "seller_id", "varchar(21)", "배송템플릿 소유 판매자 (sl_seller.seller_id)"),
    ("cm_dashboard", "share_seller_ids", "varchar(1000)", "공유대상 판매자ID 멀티값 (^S1^S2^). 부서·사용자와 OR 로 판정"),
]
NEW_FKS = [  # (테이블, 컬럼, 제약명, 인덱스명)
    ("sy_site", "operator_seller_id", "sy_site_fk_operator_seller_id", "sy_site_ix01_operator_seller_id"),
    ("sy_brand", "seller_id", "sy_brand_fk_seller_id", "sy_brand_ix02_seller_id"),
    ("pd_dliv_tmplt", "seller_id", "pd_dliv_tmplt_fk_seller_id", "pd_dliv_tmplt_ix_seller_id"),
]
NEW_COMMENTS = {
    ("sl_seller", "seller_type_cd"): "판매자 유형 (코드: SELLER_TYPE_CD — OPERATOR/COMPANY/INDIVIDUAL)",
    ("sl_seller", "seller_status_cd"): "판매자 상태 (코드: SELLER_STATUS_CD — PENDING/ACTIVE/SUSPENDED/CLOSED)",
    ("sl_seller_member", "role_cd"): "소속 역할 (코드: SELLER_MEMBER_ROLE_CD — MANAGER/OPR/MD/CS). OPR 은 운영사 소속만",
    ("sy_site", "site_type_cd"): "사이트유형 (코드: SITE_TYPE_CD — MARKET/SINGLE/C2C)",
}
NEW_CODES = {  # 그룹 → [(값, 라벨, 정렬, 비고)]   그룹이 없으면 만든다(전체 공통 — sy_code_grp_site 매핑 없음)
    "SELLER_TYPE_CD": [("OPERATOR", "운영사", 0, "사이트 운영사 — sy_site.operator_seller_id 가 가리킨다")],
    "SELLER_STATUS_CD": [("CLOSED", "종료", 4, "판매자 아님·거래 종료(업체 합치기 때 택배·CS·전산 외주 업체)")],
    "SELLER_MEMBER_ROLE_CD": [("MANAGER", "관리자", 1, "모든 업무"), ("OPR", "사이트 운영", 2, "모든 업무 — 운영사 소속만(전산팀·외주)"),
                              ("MD", "MD", 3, "시스템 중요업무 외 모든 업무"), ("CS", "고객센터", 4, "고객 관리·응대·지급, 주문·클레임 조회")],
    "SITE_TYPE_CD": [("MARKET", "오픈마켓형", 11, "운영사 + 입점 판매자(사업자·개인)"), ("SINGLE", "단독몰형", 12, "운영사만"),
                     ("C2C", "개인 간 거래형", 13, "운영사 + 개인 판매자")],
    "PROMO_TARGET_TYPE": [("SELLER", "판매자", 7, "target_id = sl_seller.seller_id")],
    "DISCNT_PROD_TARGET": [("SELLER", "판매자", 6, "target_id = sl_seller.seller_id")],
    "PM_PROD_TARGET": [("SELLER", "판매자", 5, "target_id = sl_seller.seller_id")],
    "NOTI_TARGET_TYPE": [("SELLER", "판매자", 5, "판매자 소속 사용자")],
}
NEW_GRP = {"SELLER_MEMBER_ROLE_CD": ("판매자소속역할", "seller.member.role", "판매자 소속 역할 — 권한은 (판매자 유형 × 역할) 백엔드 상수로 계산 (정책 sy.59)")}

code_grps = {g: (gid, pth) for gid, g, pth in q(f"SELECT code_grp_id, code_grp, path_id FROM {S}.sy_code_grp")}
code_vals = collections.defaultdict(set)
for g, v in q(f"SELECT g.code_grp, c.code_value FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id"):
    code_vals[g].add(v)

s1_ddl, s1_codes = [], []     # s1_ddl: (설명, [do sql], [undo sql]) / s1_codes: (grp, value, label, sort, remark)
for t, c, typ, cm in NEW_COLS:
    if not has_col(t, c):
        s1_ddl.append((f"컬럼 {t}.{c} {typ}", [f"ALTER TABLE {S}.{t} ADD COLUMN {c} {typ}", f"COMMENT ON COLUMN {S}.{t}.{c} IS {lit(cm)}"],
                       [f"ALTER TABLE {S}.{t} DROP COLUMN IF EXISTS {c} CASCADE"]))
for t, c, fk, ix in NEW_FKS:
    if not q1("SELECT 1 FROM information_schema.table_constraints WHERE table_schema=%s AND constraint_name=%s", (S, fk)):
        s1_ddl.append((f"FK {fk}", [f"ALTER TABLE {S}.{t} ADD CONSTRAINT {fk} FOREIGN KEY ({c}) REFERENCES {S}.sl_seller(seller_id) ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID",
                                    f"ALTER TABLE {S}.{t} VALIDATE CONSTRAINT {fk}"],
                       [f"ALTER TABLE {S}.{t} DROP CONSTRAINT IF EXISTS {fk}"]))
    if not q1("SELECT 1 FROM pg_indexes WHERE schemaname=%s AND indexname=%s", (S, ix)):
        s1_ddl.append((f"인덱스 {ix}", [f"CREATE INDEX IF NOT EXISTS {ix} ON {S}.{t} ({c})"], [f"DROP INDEX IF EXISTS {S}.{ix}"]))
for (t, c), cm in NEW_COMMENTS.items():
    old = comment_of(t, c) if has_col(t, c) else None
    if has_col(t, c) and old != cm:
        s1_ddl.append((f"주석 {t}.{c}", [f"COMMENT ON COLUMN {S}.{t}.{c} IS {lit(cm)}"], [f"COMMENT ON COLUMN {S}.{t}.{c} IS {lit(old)}"]))
for g, vals in NEW_CODES.items():
    if g not in code_grps and g not in NEW_GRP:
        continue   # 그 그룹이 없는 DB(값을 붙일 데가 없음) — 알리기만
    for v, lb, so, rm in vals:
        if v not in code_vals[g]:
            s1_codes.append((g, v, lb, so, rm))
s1_missing_grp = [g for g in NEW_CODES if g not in code_grps and g not in NEW_GRP]
step1_todo = len(s1_ddl) + len(s1_codes)
step1_done = all(has_col(t, c) for t, c, _, _ in NEW_COLS) and not s1_codes

# ═══════════════════════════════ 2단계 계획 ═══════════════════════════════
def col_or_null(t, c, alias=""):
    return f"{alias}{c}" if has_col(t, c) else "NULL"


sites = {r[0]: dict(nm=r[1], module=r[2], type=r[3], ceo=r[4], bno=r[5], email=r[6], phone=r[7], zip=r[8], addr=r[9], op=r[10], status=r[11])
         for r in q(f"""SELECT site_id, site_nm, module_cd, site_type_cd, {col_or_null('sy_site', 'site_ceo')}, {col_or_null('sy_site', 'site_business_no')},
                               site_email, site_phone, {col_or_null('sy_site', 'site_zip_code')}, {col_or_null('sy_site', 'site_address')},
                               {col_or_null('sy_site', 'operator_seller_id')}, site_status_cd FROM {S}.sy_site ORDER BY site_id""")}
SELLER_INFO = ["seller_business_no", "seller_ceo_nm", "seller_email", "seller_phone", "seller_zip_code", "seller_addr", "seller_addr_detail",
               "contract_date", "seller_intro", "settle_bank_nm", "settle_bank_account", "settle_bank_holder"]
sellers = {}
for r in q(f"""SELECT seller_id, seller_nm, seller_type_cd, seller_status_cd, {col_or_null('sl_seller', 'vendor_id')}, reg_site_id,
                      {', '.join(col_or_null('sl_seller', c) for c in SELLER_INFO)} FROM {S}.sl_seller ORDER BY seller_id"""):
    sellers[r[0]] = dict(nm=r[1], type=r[2], status=r[3], vendor=r[4], reg_site=r[5], info=dict(zip(SELLER_INFO, r[6:])))
seller_sites = collections.defaultdict(dict)       # seller -> site -> (seller_site_id, status)
for ssid, sid, site, st in q(f"SELECT seller_site_id, seller_id, site_id, seller_site_status_cd FROM {S}.sl_seller_site"):
    seller_sites[sid][site] = (ssid, st)
vendors = {}
if has_table(S, "sy_vendor"):
    for r in q(f"""SELECT vendor_id, vendor_nm, vendor_type_cd, vendor_no, corp_no, ceo_nm, vendor_email, vendor_phone, vendor_zip_code, vendor_addr,
                          vendor_addr_detail, contract_date, vendor_bank_nm, vendor_bank_account, vendor_bank_holder, reg_site_id, vendor_status_cd
                     FROM {S}.sy_vendor ORDER BY vendor_id"""):
        vendors[r[0]] = dict(nm=r[1], type=r[2], no=r[3], corp=r[4], ceo=r[5], email=r[6], phone=r[7], zip=r[8], addr=r[9], addr2=r[10],
                             cdate=r[11], bank=r[12], acct=r[13], holder=r[14], reg_site=r[15], status=r[16])
vintro = {}
if has_table(S, "sy_vendor_content"):
    for vid, html in q(f"""SELECT DISTINCT ON (vendor_id) vendor_id, content_html FROM {S}.sy_vendor_content
                            WHERE content_type_cd = 'INTRO' AND coalesce(use_yn, 'Y') = 'Y' AND coalesce(content_html, '') <> ''
                            ORDER BY vendor_id, sort_ord NULLS LAST, reg_date DESC"""):
        vintro[vid] = html
members = {}   # seller_member_id -> dict
for r in q(f"""SELECT m.seller_member_id, m.seller_id, m.member_id, m.user_id, m.role_cd, {col_or_null('sl_seller_member', 'is_main', 'm.')},
                      m.status_cd, {col_or_null('sl_seller_member', 'owner_yn', 'm.')}, r.role_code
                 FROM {S}.sl_seller_member m LEFT JOIN {S}.sy_user u ON u.user_id = m.user_id LEFT JOIN {S}.sy_role r ON r.role_id = u.role_id"""):
    members[r[0]] = dict(seller=r[1], member=r[2], user=r[3], role=r[4], main=r[5], status=r[6], owner=r[7], user_role=r[8])
role_code_of = {rid: rc for rid, rc in q(f"SELECT role_id, role_code FROM {S}.sy_role")}
bizno = re.compile(r"^\d{3}-\d{2}-\d{5}$")
id_used = collections.defaultdict(set)
id_seq = collections.Counter()


def new_id(prefix, tbl):
    if not id_used[prefix]:
        id_used[prefix] = {r[0] for r in q(f"SELECT {PKS[tbl]} FROM {S}.{tbl} WHERE {PKS[tbl]} LIKE %s", (prefix + TS + "%",))} | {"__init__"}
    while True:
        nid = f"{prefix}{TS}{id_seq[prefix]:04d}"; id_seq[prefix] += 1
        if nid not in id_used[prefix]:
            id_used[prefix].add(nid); return nid


chg = []     # (항목, tbl, pk, col, old, new)
ins = []     # (항목, tbl, row dict)
notes = []   # 알림(바꾸지 않음)
s2_table = []  # 사이트별 운영사 표


def set_val(fix, tbl, pk, col, old, new):
    if new is None or (old is not None and str(old) == str(new)):
        return
    chg.append((fix, tbl, pk, col, old, new))


def fill_info(fix, sid, vals):
    """판매자 정보 칸은 비어 있을 때만 채운다(이미 입력된 값을 덮지 않는다)."""
    inf = sellers[sid]["info"]
    for c, v in vals.items():
        if v in (None, "") or inf.get(c) not in (None, ""):
            continue
        inf[c] = v
        set_val(fix, "sl_seller", sid, c, None, v)


def biz_of(*vals):
    for v in vals:
        if v and bizno.match(v.strip()): return v.strip()
    return None


def new_seller(fix, nm, typ, site, info):
    sid = new_id("SE", "sl_seller")
    sellers[sid] = dict(nm=nm, type=typ, status="ACTIVE", vendor=None, reg_site=site, info={c: None for c in SELLER_INFO}, new=True)
    ins.append((fix, "sl_seller", dict(seller_id=sid, seller_nm=nm, seller_type_cd=typ, seller_status_cd="ACTIVE", reg_site_id=site)))
    fill_info(fix, sid, info)
    return sid


def link_site(fix, sid, site):
    if site in seller_sites[sid]:
        return
    ssid = new_id("SES", "sl_seller_site")
    seller_sites[sid][site] = (ssid, "ACTIVE")
    ins.append((fix, "sl_seller_site", dict(seller_site_id=ssid, seller_id=sid, site_id=site, seller_site_status_cd="ACTIVE", reg_site_id=site)))


# ① 운영사
operator_of = {}
by_bno = {}
for s in sellers:
    b = sellers[s]["info"].get("seller_business_no")
    if b and sellers[s]["type"] == "OPERATOR": by_bno[b] = s
for site, si in sites.items():
    if si["op"] and si["op"] in sellers:
        operator_of[site] = si["op"]; how = "이미 지정됨"
    elif site in OPERATOR_FIXED and OPERATOR_FIXED[site] in sellers:
        operator_of[site] = OPERATOR_FIXED[site]; how = "기존 판매자 지정(상수 OPERATOR_FIXED)"
    elif OPERATOR_NEW_FROM_SITE and (si["bno"] or si["ceo"]):
        if si["bno"] and si["bno"] in by_bno:
            operator_of[site] = by_bno[si["bno"]]; how = "같은 사업자번호의 운영사"
        else:
            operator_of[site] = new_seller("①운영사", f"{si['nm']} 운영사", "OPERATOR", site, {})
            if si["bno"]: by_bno[si["bno"]] = operator_of[site]
            how = "새 운영사 판매자(sy_site 운영 주체 칸)"
    else:
        if PLATFORM_OPERATOR not in sellers:
            notes.append(f"!! {site}: 운영사를 정할 수 없음(PLATFORM_OPERATOR {PLATFORM_OPERATOR} 없음)"); continue
        operator_of[site] = PLATFORM_OPERATOR; how = "플랫폼 운영사(대표자·사업자번호 없음)"
    op = operator_of[site]
    if sellers[op]["type"] != "OPERATOR":
        set_val("①운영사", "sl_seller", op, "seller_type_cd", sellers[op]["type"], "OPERATOR"); sellers[op]["type"] = "OPERATOR"
    if sellers[op]["status"] != "ACTIVE" and not sellers[op].get("new"):
        notes.append(f"{site}: 운영사 {op} 상태가 {sellers[op]['status']} — 확인 필요")
    fill_info("①운영사", op, dict(seller_business_no=si["bno"], seller_ceo_nm=si["ceo"], seller_email=si["email"], seller_phone=si["phone"],
                                 seller_zip_code=si["zip"], seller_addr=si["addr"]))
    set_val("①운영사", "sy_site", site, "operator_seller_id", si["op"], op)
    link_site("①운영사(호환 행)", op, site)          # 지금 코드의 "판매자가 그 사이트에 연결" 확인용 — 3단계에서 지운다
    s2_table.append((site, si["nm"], si["module"] or "-", SITE_TYPE.get(site, SITE_TYPE_DEFAULT), op, sellers[op]["nm"], how))

# ② 업체 → 판매자
vendor_seller = {}
for s, sv in sellers.items():
    if sv["vendor"] and sv["vendor"] in vendors: vendor_seller.setdefault(sv["vendor"], s)
for vid, v in vendors.items():
    sid = vendor_seller.get(vid)
    if not sid:
        if v["type"] in NON_SELLER_VENDOR:
            continue   # 판매자 아닌 업체 + 연결 판매자 없음 → 판매자를 만들지 않는다
        # 연결 없는 업체 → 새 COMPANY 판매자 + 사이트(그 업체 상품의 사이트 ∪ 정산 사이트, 없으면 업체 등록 사이트)
        vs = {r[0] for r in q(f"SELECT DISTINCT site_id FROM {S}.pd_prod WHERE vendor_id = %s AND site_id IS NOT NULL", (vid,))} if has_col("pd_prod", "vendor_id") else set()
        if has_col("st_settle", "vendor_id"):
            vs |= {r[0] for r in q(f"SELECT DISTINCT site_id FROM {S}.st_settle WHERE vendor_id = %s AND site_id IS NOT NULL", (vid,))}
        vs = vs or {v["reg_site"] or "SI260001"}
        sid = new_seller("②업체합치기", v["nm"], "COMPANY", sorted(vs)[0], {})
        vendor_seller[vid] = sid
        for st in sorted(vs): link_site("②업체합치기", sid, st)
        notes.append(f"연결 판매자 없는 업체 {vid}({v['nm']}) → 새 판매자 {sid}, 사이트 {sorted(vs)}")
    fill_info("②업체합치기", sid, dict(seller_business_no=biz_of(v["no"], v["corp"]), seller_ceo_nm=v["ceo"], seller_email=v["email"],
                                   seller_phone=v["phone"], seller_zip_code=v["zip"], seller_addr=v["addr"], seller_addr_detail=v["addr2"],
                                   contract_date=v["cdate"], seller_intro=vintro.get(vid), settle_bank_nm=v["bank"],
                                   settle_bank_account=v["acct"], settle_bank_holder=v["holder"]))
    if v["type"] in NON_SELLER_VENDOR and sid not in operator_of.values() and sellers[sid]["status"] != NON_SELLER_STATUS:
        set_val("②업체합치기", "sl_seller", sid, "seller_status_cd", sellers[sid]["status"], NON_SELLER_STATUS); sellers[sid]["status"] = NON_SELLER_STATUS

# ③ 업체 직원 → 판매자 소속 (sy_vendor_user.user_id)
mem_by_user_seller = {(m["user"], m["seller"]): mid for mid, m in members.items() if m["user"]}
new_mem = {}    # (user, seller) -> row
if has_table(S, "sy_vendor_user"):
    for vuid, vid, uid, rid, main, st in q(f"""SELECT vu.vendor_user_id, vu.vendor_id, vu.user_id, vu.role_id, vu.is_main, vu.vendor_user_status_cd
                                                FROM {S}.sy_vendor_user vu JOIN {S}.sy_user u ON u.user_id = vu.user_id ORDER BY vu.vendor_user_id"""):
        v = vendors.get(vid)
        if not v: continue
        if v["type"] in NON_SELLER_VENDOR:
            role = NON_SELLER_VENDOR[v["type"]]
            if role is None: continue
            target = operator_of.get(v["reg_site"] or "SI260001")
        else:
            role = VENDOR_ROLE.get(role_code_of.get(rid), VENDOR_ROLE_DEFAULT)
            target = vendor_seller.get(vid)
        if not target: continue
        if role == "OPR" and target not in operator_of.values(): role = "MD"     # OPR 은 운영사 소속만
        removed = (st in REMOVED_VENDOR_USER_STATUS) or (role_code_of.get(rid) or "").endswith("BLOCKED")
        owner = "Y" if (main == "Y" and role == "MANAGER" and not removed) else "N"
        key = (uid, target)
        if key in mem_by_user_seller:
            continue   # 이미 소속 있음 — ④ 가 역할을 정리한다
        cur_row = new_mem.get(key)
        row = dict(seller_member_id=None, seller_id=target, user_id=uid, role_cd=role, status_cd="REMOVED" if removed else "ACTIVE",
                   owner_yn=owner, _src=vuid)
        if cur_row is None:
            new_mem[key] = row
        else:   # 같은 사용자·같은 판매자(여러 업체 → 한 운영사) → 사용 중 우선, 같으면 높은 역할
            better = ((row["status_cd"] == "ACTIVE" and cur_row["status_cd"] == "REMOVED") or
                      (row["status_cd"] == cur_row["status_cd"] and ROLE_RANK[row["role_cd"]] > ROLE_RANK[cur_row["role_cd"]]))
            if better: cur_row.update(role_cd=row["role_cd"], status_cd=row["status_cd"])
            if row["owner_yn"] == "Y": cur_row["owner_yn"] = "Y"
    for key, row in new_mem.items():
        row["seller_member_id"] = new_id("SEM", "sl_seller_member")
        ins.append(("③업체직원→소속", "sl_seller_member", {k: v for k, v in row.items() if not k.startswith("_")} | dict(reg_site_id=sellers[row["seller_id"]]["reg_site"])))

# ④ 기존 소속 역할 이전
op_sellers = set(operator_of.values())
for mid, m in members.items():
    r = m["role"]
    if r in NEW_ROLES:
        if r == "OPR" and m["seller"] not in op_sellers:
            set_val("④역할", "sl_seller_member", mid, "role_cd", r, "MD"); notes.append(f"OPR 이 입점 판매자 소속 {mid} → MD")
        continue
    if r == "OWNER":
        set_val("④역할", "sl_seller_member", mid, "role_cd", r, "MANAGER")
        if m["owner"] != "Y": set_val("④역할", "sl_seller_member", mid, "owner_yn", m["owner"] or "N", "Y")
    else:   # STAFF 및 알 수 없는 값
        new = "OPR" if (m["seller"] in op_sellers and m["user_role"] in STAFF_OPR_ROLE_CODES) else "MD"
        set_val("④역할", "sl_seller_member", mid, "role_cd", r, new)
        if r not in ("STAFF",): notes.append(f"알 수 없는 소속 역할 {r!r} ({mid}) → {new}")

# ⑤ 판매자 없는 상품 (D10)
member_site = {mid: (site, nm, login) for mid, site, nm, login in q(f"SELECT member_id, site_id, member_nm, login_id FROM {S}.mb_member WHERE site_id IN (SELECT site_id FROM {S}.sy_site WHERE coalesce(site_type_cd,'') = 'C2C' OR site_id = ANY(%s))",
                                                                       ([s for s, t in SITE_TYPE.items() if t == "C2C"],))}
active_mem_of_member = collections.defaultdict(list)
for mid, m in members.items():
    if m["member"] and (m["status"] in (None, "ACTIVE")): active_mem_of_member[m["member"]].append(m["seller"])
c2c_new_seller = {}
prod_fill = collections.Counter()
prods = q(f"""SELECT prod_id, site_id, {col_or_null('pd_prod', 'vendor_id')}, reg_by FROM {S}.pd_prod WHERE seller_id IS NULL ORDER BY site_id, prod_id""")
for pid, site, vid, regby in prods:
    st = SITE_TYPE.get(site, SITE_TYPE_DEFAULT)
    op = operator_of.get(site)
    target, why = None, None
    vs = vendor_seller.get(vid) if vid else None
    if vs and vendors.get(vid, {}).get("type") not in NON_SELLER_VENDOR:
        on = seller_sites[vs].get(site, (None, None))[1] == "ACTIVE"
        if not on and st == "MARKET":
            link_site("⑤상품판매자", vs, site); on = True
        if on: target, why = vs, "업체를 합친 판매자"
    if not target and st == "C2C" and regby in member_site and member_site[regby][0] == site:
        mine = [s for s in active_mem_of_member[regby] if seller_sites[s].get(site, (None, None))[1] == "ACTIVE"]
        if mine:
            target, why = mine[0], "등록 회원의 판매자"
        elif not active_mem_of_member[regby]:
            if regby not in c2c_new_seller:
                _, nm, login = member_site[regby]
                sid = new_seller("⑤상품판매자", nm or login, "INDIVIDUAL", site, {})
                link_site("⑤상품판매자", sid, site)
                mrow = dict(seller_member_id=new_id("SEM", "sl_seller_member"), seller_id=sid, member_id=regby, role_cd="MANAGER", status_cd="ACTIVE",
                            owner_yn="Y", reg_site_id=site)
                ins.append(("⑤상품판매자", "sl_seller_member", mrow))
                c2c_new_seller[regby] = sid; active_mem_of_member[regby].append(sid)
            target, why = c2c_new_seller[regby], "등록 회원의 새 개인 판매자"
        else:
            notes.append(f"상품 {pid}: 등록 회원 {regby} 가 다른 사이트 판매자 소속 — 운영사로")
    if not target:
        if not op:
            notes.append(f"!! 상품 {pid}({site}): 운영사가 없어 채우지 못함"); continue
        target, why = op, ("운영사(단독몰)" if st == "SINGLE" else "운영사(등록자 회원 아님)" if st == "C2C" else "운영사(업체 없음·없는 업체ID)")
    set_val("⑤상품판매자", "pd_prod", pid, "seller_id", None, target)
    prod_fill[(site, why, target)] += 1

# ⑥ 브랜드·배송템플릿·대시보드 공유
if has_table(S, "sy_vendor_brand"):
    cur_brand = {b: s for b, s in q(f"SELECT brand_id, {col_or_null('sy_brand', 'seller_id')} FROM {S}.sy_brand")}
    seen = set()
    for vid, bid, main in q(f"SELECT vendor_id, brand_id, is_main FROM {S}.sy_vendor_brand WHERE coalesce(use_yn,'Y')='Y' ORDER BY brand_id, (is_main = 'Y') DESC, vendor_id"):
        if bid in seen: continue
        seen.add(bid)
        if bid not in cur_brand:
            notes.append(f"업체 브랜드 {vid}→{bid}: sy_brand 에 없는 브랜드 — 옮기지 않음(백업 sy_vendor_brand 에만)"); continue
        if vendor_seller.get(vid) and not cur_brand[bid]:
            set_val("⑥브랜드", "sy_brand", bid, "seller_id", None, vendor_seller[vid])
if has_col("pd_dliv_tmplt", "vendor_id"):
    for tid, vid, sid in q(f"SELECT dliv_tmplt_id, vendor_id, {col_or_null('pd_dliv_tmplt', 'seller_id')} FROM {S}.pd_dliv_tmplt WHERE vendor_id IS NOT NULL"):
        if vendor_seller.get(vid) and not sid: set_val("⑥배송템플릿", "pd_dliv_tmplt", tid, "seller_id", None, vendor_seller[vid])
if has_col("cm_dashboard", "share_vendor_ids"):
    for did, vids, sids in q(f"SELECT dashboard_id, share_vendor_ids, {col_or_null('cm_dashboard', 'share_seller_ids')} FROM {S}.cm_dashboard WHERE coalesce(share_vendor_ids,'') <> ''"):
        mapped = [vendor_seller.get(x) for x in vids.split("^") if x]
        if not sids and any(mapped):
            set_val("⑥대시보드공유", "cm_dashboard", did, "share_seller_ids", None, "^" + "^".join(m for m in mapped if m) + "^")

# ⑦ 사이트 유형
for site, si in sites.items():
    want = SITE_TYPE.get(site, SITE_TYPE_DEFAULT)
    if si["type"] != want: set_val("⑦사이트유형", "sy_site", site, "site_type_cd", si["type"], want)
single_vendors = [(site, s) for s, ss in seller_sites.items() for site, (_, st) in ss.items()
                  if st == "ACTIVE" and SITE_TYPE.get(site, SITE_TYPE_DEFAULT) == "SINGLE" and s != operator_of.get(site) and sellers[s]["type"] != "OPERATOR"]
for site, s in single_vendors:
    if KEEP_SINGLE_MALL_VENDORS:
        notes.append(f"단독몰 {site} 에 입점 판매자 {s}({sellers[s]['nm']}) — 그대로 둠(상수 KEEP_SINGLE_MALL_VENDORS)")
    else:
        set_val("⑦사이트유형", "sl_seller_site", seller_sites[s][site][0], "seller_site_status_cd", "ACTIVE", "SUSPENDED")
# ⑧ 정산·프로모션 seller_id 빈 칸 (업체만 있는 행)
for t in ("st_settle", "st_settle_item", "st_settle_pay", "st_settle_raw", "st_settle_config", "st_recon", "st_erp_voucher",
          "pm_coupon", "pm_discnt", "pm_gift", "pm_save_policy"):
    if has_col(t, "vendor_id") and has_col(t, "seller_id"):
        for pk, vid in q(f"SELECT {PKS[t]}, vendor_id FROM {S}.{t} WHERE vendor_id IS NOT NULL AND seller_id IS NULL"):
            if vendor_seller.get(vid): set_val("⑧정산·프로모션", t, pk, "seller_id", None, vendor_seller[vid])
            else: notes.append(f"{t} {pk}: 업체 {vid} 의 판매자 없음 — 채우지 못함")

# 사전 점검(2단계)
problems2 = []
if not step1_done and MODE == "run" and STEP == 2:
    problems2.append("1단계가 적용되지 않았습니다 — 먼저 run --step 1")
for site in sites:
    if site not in operator_of: problems2.append(f"{site}: 운영사 없음")
dup_owner = q(f"""SELECT member_id, count(*) FROM {S}.sl_seller_member WHERE member_id IS NOT NULL AND (status_cd IS NULL OR status_cd = 'ACTIVE')
                   GROUP BY 1 HAVING count(*) > 1""")
if dup_owner: notes.append(f"회원 한 명이 사용 중 소속 2개 이상: {len(dup_owner)}명 (규칙 sl.01 위반, 이 스크립트는 고치지 않음)")
step2_todo = len(chg) + len(ins)

# ═══════════════════════════════ 3단계 계획 ═══════════════════════════════
DROP_COLS = [("sl_seller_member", "is_main")] + \
            [(t, "vendor_id") for t in ("pd_prod", "sl_seller", "sy_brand", "pd_dliv_tmplt", "pm_coupon", "pm_discnt", "pm_gift", "pm_save_policy",
                                        "st_settle", "st_settle_item", "st_settle_pay", "st_settle_raw", "st_settle_config", "st_recon",
                                        "st_erp_voucher", "cm_dashboard_data")] + \
            [("st_settle_raw", "vendor_type_cd"), ("cm_dashboard", "share_vendor_ids"),
             ("sy_site", "site_ceo"), ("sy_site", "site_business_no"), ("sy_site", "site_zip_code"), ("sy_site", "site_address")]
# 남기는 것: od_dliv.vendor_id(주문 판매자 단위 D8 작업에서 seller_id 로), syh_access_log·syh_access_error_log.vendor_id(이력 — 원본 보존), zz_* 백업 테이블
VENDOR_TABLES = ["sy_vendor", "sy_vendor_user", "sy_vendor_user_role", "sy_vendor_brand", "sy_vendor_content"]
OLD_CODE_VALUES = {"SITE_TYPE_CD": ["EC", "ADMIN", "API"], "PROMO_TARGET_TYPE": ["VENDOR"], "DISCNT_PROD_TARGET": ["VENDOR"],
                   "PM_PROD_TARGET": ["VENDOR"], "NOTI_TARGET_TYPE": ["VENDOR"]}
OLD_CODE_GRPS = ["VENDOR_STATUS_CD", "VENDOR_TYPE_CD", "VENDOR_TYPE_KR", "VENDOR_CLASS_CD", "VENDOR_USER_STATUS_CD", "VENDOR_CONTENT_TYPE",
                 "VENDOR_CONTENT_STATUS_CD"]
OLD_ROLE_ROOTS = ["SITE_MGR_ROOT", "SITE_OP_ROOT", "DLIV_ROOT", "CS_ROOT", "PROG_ROOT"]     # 판매업체·사이트운영업체·배송·콜센터·유지보수업체 역할 트리
s3 = dict(drop=[(t, c) for t, c in DROP_COLS if has_col(t, c)])
s3["opsite"] = q(f"""SELECT ss.seller_site_id, ss.seller_id, ss.site_id FROM {S}.sl_seller_site ss JOIN {S}.sl_seller s ON s.seller_id = ss.seller_id
                     WHERE s.seller_type_cd = 'OPERATOR'""")
s3_nullable = has_col("sy_site", "operator_seller_id") and colfull[("sy_site", "operator_seller_id")][1]     # True = 아직 NULL 허용(NOT NULL 할 일 남음)
s3["ro"] = [t for t in VENDOR_TABLES if has_table(S, t) and not q1("SELECT 1 FROM pg_trigger WHERE tgname = %s", (f"trg_{t}_readonly",))]
s3["codes"] = q(f"""SELECT c.code_id, g.code_grp, c.code_value FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                    WHERE coalesce(c.use_yn,'Y') = 'Y' AND (g.code_grp, c.code_value) IN ({", ".join(f"('{g}','{v}')" for g, vs in OLD_CODE_VALUES.items() for v in vs)})""")
s3["grps"] = q(f"SELECT code_grp_id, code_grp FROM {S}.sy_code_grp WHERE coalesce(use_yn,'Y') = 'Y' AND code_grp = ANY(%s)", (OLD_CODE_GRPS,))
old_role_ids = [r[0] for r in q(f"""WITH RECURSIVE t AS (SELECT role_id FROM {S}.sy_role WHERE role_code = ANY(%s)
                                    UNION SELECT r.role_id FROM {S}.sy_role r JOIN t ON r.parent_role_id = t.role_id) SELECT role_id FROM t""", (OLD_ROLE_ROOTS,))]
s3["roles"] = q(f"SELECT role_id, role_code FROM {S}.sy_role WHERE coalesce(use_yn,'Y') = 'Y' AND role_id = ANY(%s)", (old_role_ids,))
s3["userroles"] = q(f"""SELECT ur.user_role_id, ur.user_id, ur.role_id FROM {S}.sy_user_role ur
                        WHERE ur.role_id = ANY(%s) AND EXISTS (SELECT 1 FROM {S}.sl_seller_member m WHERE m.user_id = ur.user_id
                                                                AND (m.status_cd IS NULL OR m.status_cd = 'ACTIVE'))""", (old_role_ids,))
step3_todo = sum(len(v) for v in s3.values()) + (1 if s3_nullable or not has_col("sy_site", "operator_seller_id") else 0)

# ══════════════════════════════ 출력 도우미 ══════════════════════════════
def print_step1():
    print(f"\n━━ 1단계 비파괴 구조 추가 — DDL {len(s1_ddl)}건, 코드값 {len(s1_codes)}건" + (" (이미 적용됨)" if not step1_todo else ""))
    for d, _, _ in s1_ddl: print(f"   DDL  {d}")
    for g, v, lb, so, rm in s1_codes: print(f"   코드 {g} + {v}={lb}" + ("  (새 그룹)" if g not in code_grps else ""))
    for g in s1_missing_grp: print(f"   (알림) 코드그룹 {g} 가 없어 값을 붙이지 않음")


def print_step2():
    print(f"\n━━ 2단계 값 이전 — 값 {len(chg):,}칸 + 추가 {len(ins):,}행" + (" (옮길 것 없음)" if not step2_todo else ""))
    print("   [사이트별 운영사·유형]")
    for site, nm, mod, typ, op, opnm, how in s2_table:
        print(f"      {site} {nm} ({mod}) 유형 {typ} → 운영사 {op} {opnm} — {how}")
    by = collections.Counter((c[0], c[1], c[3]) for c in chg)
    for (fix, t, col), n in sorted(by.items()): print(f"   {fix} {t}.{col}: {n:,}칸")
    byi = collections.Counter((x[0], x[1]) for x in ins)
    for (fix, t), n in sorted(byi.items()): print(f"   {fix} {t}: +{n:,}행")
    if prod_fill:
        print("   [⑤ 판매자 없는 상품 채우기] 사이트 — 기준 — 판매자: 건수")
        for (site, why, tgt), n in sorted(prod_fill.items()): print(f"      {site} — {why} — {tgt} {sellers[tgt]['nm']}: {n}")
    rc = collections.Counter((x[2]["role_cd"], x[2]["status_cd"], x[2]["owner_yn"], sellers[x[2]["seller_id"]]["type"]) for x in ins if x[0] == "③업체직원→소속")
    if rc:
        print("   [③ 업체 직원 → 소속] 역할/상태/owner/판매자유형: " + ", ".join(f"{k[0]}/{k[1]}/{k[2]}/{k[3]} {n}" for k, n in sorted(rc.items())))
    r4 = collections.Counter(f"{c[4]}→{c[5]}" for c in chg if c[0] == "④역할" and c[3] == "role_cd")
    if r4: print("   [④ 소속 역할 이전] " + ", ".join(f"{k} {n}" for k, n in sorted(r4.items())))
    print("   표본:")
    seen = collections.Counter()
    for c in chg:
        if seen[(c[0], c[3])] < 2:
            seen[(c[0], c[3])] += 1
            nv = c[5] if len(str(c[5])) < 60 else str(c[5])[:57] + "…"
            print(f"      {c[0]} {c[1]}.{c[3]} [{c[2]}] {c[4]!r} → {nv!r}")
    seen = collections.Counter()
    for fix, t, row in ins:
        if seen[(fix, t)] < 2:
            seen[(fix, t)] += 1; print(f"      {fix} +{t} {json.dumps(row, ensure_ascii=False, default=str)}")
    if notes:
        print("   [알림 — 바꾸지 않음·판단 필요]")
        for n in notes[:40]: print("      · " + n)
    for p in problems2: print("   !! " + p)


def print_step3():
    print(f"\n━━ 3단계 나중 정리(새 코드 배포 뒤, --confirm-deployed) — 남은 일 {step3_todo:,}건")
    print(f"   운영사의 sl_seller_site 행 삭제: {len(s3['opsite'])}행" + (" (지금은 2단계 전이라 운영사 유형 판매자가 적다 — 2단계 뒤 다시 보세요)" if not step1_done or step2_todo else ""))
    print(f"   sy_site.operator_seller_id NOT NULL: {'할 일' if s3_nullable or not has_col('sy_site', 'operator_seller_id') else '이미 적용됨'}")
    for t, c in s3["drop"]:
        n = q1(f"SELECT count(*) FROM {S}.{t} WHERE {c} IS NOT NULL")
        print(f"   컬럼 삭제 {t}.{c} (값 있는 행 {n:,} → 백업)")
    print(f"   읽기 전용 트리거: {', '.join(s3['ro']) or '없음'}")
    print(f"   코드값 사용 안 함: {', '.join(f'{g}.{v}' for _, g, v in s3['codes']) or '없음'}")
    print(f"   코드그룹 사용 안 함: {', '.join(g for _, g in s3['grps']) or '없음'}")
    print(f"   역할 사용 안 함(업체형 역할 트리 {', '.join(OLD_ROLE_ROOTS)}): {len(s3['roles'])}개")
    print(f"   소속 사용자의 업체형 sy_user_role 삭제: {len(s3['userroles'])}행")


# ══════════════════════════════ status / dry ══════════════════════════════
if MODE == "status":
    runs = q(f"SELECT step, count(*) FROM {BAK}._run GROUP BY 1 ORDER BY 1") if bak_exists else []
    print(f"[상태] 백업 스키마 {BAK}: {'있음 — 실행 ' + ', '.join(f'{s}단계 {n}회' for s, n in runs) if bak_exists else '없음'}")
    print(f"[상태] 1단계: {'적용됨' if step1_done else f'미적용 — DDL {len(s1_ddl)}·코드 {len(s1_codes)} 남음'}")
    print(f"[상태] 2단계: {'적용됨' if step1_done and not step2_todo else f'남은 것 값 {len(chg):,}칸·추가 {len(ins):,}행'}")
    print(f"[상태] 3단계: {'적용됨' if not step3_todo else f'남은 것 {step3_todo:,}건(새 코드 배포 뒤 실행)'}")
    sys.exit(0 if step1_done and not step2_todo else 3)

if MODE == "dry":
    cnt = dict(q(f"SELECT 'sl_seller', count(*) FROM {S}.sl_seller UNION ALL SELECT 'sl_seller_member', count(*) FROM {S}.sl_seller_member "
                 f"UNION ALL SELECT 'sl_seller_site', count(*) FROM {S}.sl_seller_site UNION ALL SELECT 'pd_prod(판매자 없음)', count(*) FROM {S}.pd_prod WHERE seller_id IS NULL"))
    print(f"[대상] dry — 스키마 {S}, 백업 스키마 {BAK} ({'있음' if bak_exists else '없음'}), 실행 시각 기준 ID {TS}")
    print("[지금] " + ", ".join(f"{k} {v:,}" for k, v in cnt.items()) + f", 업체 {len(vendors)}")
    if STEP in (None, 1): print_step1()
    if STEP in (None, 2): print_step2()
    if STEP in (None, 3): print_step3()
    print("\n(dry) 읽기 전용 세션 — 아무것도 바꾸지 않았습니다.")
    sys.exit(1 if problems2 and STEP == 2 else 0)

# ══════════════════════════════ 실행 공통 ══════════════════════════════
def ensure_bak():
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_no integer PRIMARY KEY, step integer NOT NULL, run_at timestamp DEFAULT now(), note text)")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._ddl (seq bigserial PRIMARY KEY, run_no integer, step integer, obj text, do_sql text, undo_sql text)""")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._chg (seq bigserial PRIMARY KEY, run_no integer, step integer, fix text, tbl varchar(40), pk varchar(60),
                    col varchar(60), old_val text, new_val text)""")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._ins (seq bigserial PRIMARY KEY, run_no integer, step integer, fix text, tbl varchar(40), pk varchar(60))""")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._del (seq bigserial PRIMARY KEY, run_no integer, step integer, tbl varchar(40), pk varchar(60), row_json jsonb)""")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._coldef (seq bigserial PRIMARY KEY, run_no integer, step integer, tbl varchar(40), col varchar(60),
                    col_type text, nullable boolean, col_default text, col_comment text, extra_sql text)""")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._colval (tbl varchar(40), col varchar(60), pk varchar(60), val text, PRIMARY KEY (tbl, col, pk))""")
    return q1(f"SELECT coalesce(max(run_no), 0) + 1 FROM {BAK}._run")


def ddl(run_no, step, obj, do_list, undo_list):
    for s_ in do_list: cur.execute(s_)
    cur.execute(f"INSERT INTO {BAK}._ddl (run_no, step, obj, do_sql, undo_sql) VALUES (%s,%s,%s,%s,%s)",
                (run_no, step, obj, ";\n".join(do_list), ";\n".join(undo_list)))


def apply_chg(run_no, step, items):
    for fix, t, pk, col, old, new in items:
        typ = colfull[(t, col)][0]
        cur.execute(f'UPDATE {S}."{t}" SET "{col}" = CAST(%s AS {typ}) WHERE "{PKS[t]}" = %s AND "{col}"::text IS NOT DISTINCT FROM CAST(%s AS {typ})::text',
                    (None if new is None else str(new), pk, None if old is None else str(old)))
        if cur.rowcount != 1:
            raise RuntimeError(f"{t}.{col} [{pk}] 가 계획을 세운 뒤 바뀌었습니다(영향 {cur.rowcount}행)")
    psycopg2.extras.execute_values(cur, f"INSERT INTO {BAK}._chg (run_no, step, fix, tbl, pk, col, old_val, new_val) VALUES %s",
                                   [(run_no, step, f, t, pk, c, None if o is None else str(o), None if n is None else str(n)) for f, t, pk, c, o, n in items],
                                   page_size=2000) if items else None


def insert_rows(run_no, step, items):
    for fix, t, row in items:
        base = dict(reg_by=MIG, reg_date=NOW, upd_by=MIG, upd_date=NOW)
        full = {k: v for k, v in (base | row).items() if has_col(t, k)}
        if t == "sl_seller_member" and has_col(t, "is_main"): full.setdefault("is_main", row.get("owner_yn", "N"))   # 3단계 전 옛 코드의 '대표' 선택 호환
        cols = list(full)
        cur.execute(f"INSERT INTO {S}.{t} ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))})", [full[c] for c in cols])
        cur.execute(f"INSERT INTO {BAK}._ins (run_no, step, fix, tbl, pk) VALUES (%s,%s,%s,%s,%s)", (run_no, step, fix, t, row[PKS[t]]))


def finish(run_no, step, note):
    cur.execute(f"INSERT INTO {BAK}._run (run_no, step, note) VALUES (%s,%s,%s)", (run_no, step, note))
    conn.commit()


# ══════════════════════════════ revert ══════════════════════════════
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"백업 {BAK} 가 없습니다 — run 을 한 적이 없습니다.")
    later = q1(f"SELECT count(*) FROM {BAK}._run WHERE step > %s", (STEP,))
    if later:
        sys.exit(f"[중단] {STEP}단계보다 뒤 단계 실행 기록이 남아 있습니다 — 뒤 단계부터 revert 하세요(3 → 2 → 1).")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        # 1) 지운 컬럼 되살리기(3단계) — 정의 → 값 → 인덱스·FK
        for tbl, col, typ, nullable, dflt, cmt, extra in q(f"SELECT tbl, col, col_type, nullable, col_default, col_comment, extra_sql FROM {BAK}._coldef WHERE step=%s ORDER BY seq DESC", (STEP,)):
            cur.execute(f"ALTER TABLE {S}.{tbl} ADD COLUMN IF NOT EXISTS {col} {typ}" + (f" DEFAULT {dflt}" if dflt else ""))
            load_meta()
            cur.execute(f'UPDATE {S}."{tbl}" t SET "{col}" = CAST(v.val AS {typ}) FROM {BAK}._colval v WHERE v.tbl=%s AND v.col=%s AND t."{PKS[tbl]}" = v.pk', (tbl, col))
            if not nullable: cur.execute(f"ALTER TABLE {S}.{tbl} ALTER COLUMN {col} SET NOT NULL")
            if cmt: cur.execute(f"COMMENT ON COLUMN {S}.{tbl}.{col} IS {lit(cmt)}")
            for s_ in [x for x in (extra or "").split(";\n") if x.strip()]: cur.execute(s_)
            cur.execute(f"DELETE FROM {BAK}._colval WHERE tbl=%s AND col=%s", (tbl, col))
            print(f"   컬럼 되살림 {tbl}.{col}")
        # 2) 지운 행 되살리기
        for tbl, pk, rj in q(f"SELECT tbl, pk, row_json FROM {BAK}._del WHERE step=%s ORDER BY seq DESC", (STEP,)):
            cur.execute(f"INSERT INTO {S}.{tbl} SELECT * FROM jsonb_populate_record(NULL::{S}.{tbl}, %s::jsonb) ON CONFLICT DO NOTHING", (json.dumps(rj),))
        n_del = q1(f"SELECT count(*) FROM {BAK}._del WHERE step=%s", (STEP,))
        if n_del: print(f"   지운 행 {n_del}행 되살림")
        # 3) 바꾼 값 되돌리기(나중 것부터)
        load_meta()
        done, skipped = collections.Counter(), collections.Counter()
        for tbl, pk, col, old, new in q(f"SELECT tbl, pk, col, old_val, new_val FROM {BAK}._chg WHERE step=%s ORDER BY run_no DESC, seq DESC", (STEP,)):
            if not has_col(tbl, col): skipped[f"{tbl}.{col}(컬럼 없음)"] += 1; continue
            typ = colfull[(tbl, col)][0]
            cur.execute(f'UPDATE {S}."{tbl}" SET "{col}" = CAST(%s AS {typ}) WHERE "{PKS[tbl]}" = %s AND "{col}"::text IS NOT DISTINCT FROM CAST(%s AS {typ})::text',
                        (old, pk, new))
            (done if cur.rowcount else skipped)[f"{tbl}.{col}"] += 1
        for k, n in done.items(): print(f"   {k}: {n:,}칸 이전 값으로")
        for k, n in skipped.items(): print(f"   (알림) {k}: {n:,}칸은 그 뒤 값이 또 바뀌어 건드리지 않음")
        # 4) 추가한 행 지우기(나중 것부터 — 소속 → 매핑 → 판매자 → 코드)
        refs = []
        for tbl, pk in q(f"SELECT tbl, pk FROM {BAK}._ins WHERE step=%s ORDER BY seq DESC", (STEP,)):
            if tbl == "sl_seller":
                used = [(t, c) for (t, c) in coltype if c in ("seller_id", "operator_seller_id") and t not in ("sl_seller", "sl_seller_site", "sl_seller_member")
                        and not t.startswith(("zz", "v_")) and q1(f'SELECT 1 FROM {S}."{t}" WHERE "{c}" = %s LIMIT 1', (pk,))]
                if used:
                    refs.append(f"{pk}: {used}")
                    if not FORCE: continue
                    for t, c in used: cur.execute(f'UPDATE {S}."{t}" SET "{c}" = NULL WHERE "{c}" = %s', (pk,))
            cur.execute(f'DELETE FROM {S}."{tbl}" WHERE "{PKS[tbl]}" = %s', (pk,))
        if refs and not FORCE:
            conn.rollback(); sys.exit("[중단] 이 스크립트가 만든 판매자를 그 뒤 데이터가 쓰고 있습니다 — 그래도 지우려면 --force(그 칸은 NULL): " + "; ".join(refs[:10]))
        n_ins = q1(f"SELECT count(*) FROM {BAK}._ins WHERE step=%s", (STEP,))
        if n_ins: print(f"   추가했던 행 {n_ins:,}행 삭제")
        # 5) DDL 되돌리기(나중 것부터)
        for obj, undo in q(f"SELECT obj, undo_sql FROM {BAK}._ddl WHERE step=%s ORDER BY seq DESC", (STEP,)):
            if STEP == 1 and obj.startswith("컬럼 "):
                t, c = obj.split()[1].split(".")
                if has_col(t, c):
                    nn = q1(f"SELECT count(*) FROM {S}.{t} WHERE {c} IS NOT NULL" + (" AND {c} <> 'N'".format(c=c) if c == "owner_yn" else ""))
                    if nn and not FORCE:
                        conn.rollback(); sys.exit(f"[중단] {t}.{c} 에 값이 {nn}행 있습니다(새 코드가 썼을 수 있음) — 지우려면 --force")
            for s_ in [x for x in undo.split(";\n") if x.strip()]: cur.execute(s_)
            print(f"   DDL 되돌림: {obj}")
        for t in ("_chg", "_ins", "_del", "_ddl", "_coldef", "_run"):
            cur.execute(f"DELETE FROM {BAK}.{t} WHERE step=%s", (STEP,))
        left = q1(f"SELECT count(*) FROM {BAK}._run")
        if not left:
            cur.execute(f"DROP SCHEMA {BAK} CASCADE"); print(f"   백업 스키마 {BAK} 삭제(모든 단계 되돌림)")
        conn.commit()
        print(f"[완료] revert --step {STEP} — 커밋했습니다. 공통코드 캐시를 비우세요.")
    except SystemExit:
        raise
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ══════════════════════════════ run ══════════════════════════════
try:
    t0 = datetime.datetime.now()
    cur.execute("SET LOCAL lock_timeout = '10s'")
    if STEP == 1:
        if not step1_todo:
            conn.rollback(); print("[완료] 1단계 — 할 일이 없습니다(이미 적용됨)."); sys.exit(0)
        print_step1()
        run_no = ensure_bak()
        for d, do, undo in s1_ddl: ddl(run_no, 1, d, do, undo)
        load_meta()
        dstamp = NOW.strftime("%y%m%d")
        for g, (lb, pth, desc) in NEW_GRP.items():
            if g not in code_grps:
                n = q1(f"SELECT coalesce(max(substr(code_grp_id, 9)::int), 0) FROM {S}.sy_code_grp WHERE code_grp_id ~ %s", (f"^CG{dstamp}[0-9]{{6}}$",))
                gid = f"CG{dstamp}{max(n + 1, 900001):06d}"
                row = {k: v for k, v in dict(code_grp_id=gid, code_grp=g, grp_nm=lb, path_id=pth,
                                             code_grp_desc=desc, use_yn="Y", reg_by=MIG, reg_date=NOW, upd_by=MIG, upd_date=NOW, reg_site_id="SI260001").items()
                       if has_col("sy_code_grp", k)}
                cur.execute(f"INSERT INTO {S}.sy_code_grp ({', '.join(row)}) VALUES ({', '.join(['%s'] * len(row))})", list(row.values()))
                cur.execute(f"INSERT INTO {BAK}._ins (run_no, step, fix, tbl, pk) VALUES (%s,1,'코드그룹','sy_code_grp',%s)", (run_no, gid))
                code_grps[g] = (gid, pth)
        nseq = q1(f"SELECT coalesce(max(substr(code_id, 9)::int), 0) FROM {S}.sy_code WHERE code_id ~ %s", (f"^CD{dstamp}[0-9]{{6}}$",))
        nseq = max(nseq + 1, 900001)
        for g, v, lb, so, rm in s1_codes:
            cid = f"CD{dstamp}{nseq:06d}"; nseq += 1
            row = {k: x for k, x in dict(code_id=cid, code_grp_id=code_grps[g][0], code_value=v, code_label=lb, sort_ord=so, use_yn="Y", code_level=1,
                                         code_remark=rm, reg_by=MIG, reg_date=NOW, upd_by=MIG, upd_date=NOW, reg_site_id="SI260001").items() if has_col("sy_code", k)}
            cur.execute(f"INSERT INTO {S}.sy_code ({', '.join(row)}) VALUES ({', '.join(['%s'] * len(row))})", list(row.values()))
            cur.execute(f"INSERT INTO {BAK}._ins (run_no, step, fix, tbl, pk) VALUES (%s,1,'코드값','sy_code',%s)", (run_no, cid))
        bad = [f"{t}.{c}" for t, c, _, _ in NEW_COLS if not has_col(t, c)]
        if bad: raise RuntimeError("사후 검증 실패 — 컬럼 없음: " + ", ".join(bad))
        finish(run_no, 1, f"DDL {len(s1_ddl)}, 코드 {len(s1_codes)}")
        print(f"\n[완료] 1단계 run #{run_no} — 커밋했습니다({(datetime.datetime.now() - t0).seconds}초). 공통코드 캐시를 비우세요. 다음: run --step 2")

    elif STEP == 2:
        if problems2:
            conn.rollback(); print_step2(); print("\n[중단] 아무것도 바꾸지 않았습니다."); sys.exit(1)
        if not step2_todo:
            conn.rollback(); print("[완료] 2단계 — 옮길 것이 없습니다."); sys.exit(0)
        print_step2()
        run_no = ensure_bak()
        before = dict(prod=q1(f"SELECT count(*) FROM {S}.pd_prod"), seller=q1(f"SELECT count(*) FROM {S}.sl_seller"))
        # 판매자 행을 먼저(다른 행이 참조), 그다음 매핑·소속, 마지막에 값 변경(새 판매자 정보 칸 채우기 포함)
        order = {"sl_seller": 0, "sl_seller_site": 1, "sl_seller_member": 2}
        insert_rows(run_no, 2, sorted(ins, key=lambda x: order.get(x[1], 9)))
        apply_chg(run_no, 2, chg)     # 새 판매자의 정보 칸도 방금 INSERT 한 행(이전 값 NULL)에 같은 방식으로 채우고 기록
        # ── 사후 검증 ──
        bad = []
        checks = [
            ("운영사 없는 사이트", f"SELECT count(*) FROM {S}.sy_site WHERE operator_seller_id IS NULL"),
            ("운영사가 OPERATOR 가 아님", f"SELECT count(*) FROM {S}.sy_site x JOIN {S}.sl_seller s ON s.seller_id = x.operator_seller_id WHERE s.seller_type_cd <> 'OPERATOR'"),
            ("옛 소속 역할 남음", f"SELECT count(*) FROM {S}.sl_seller_member WHERE role_cd IS NULL OR role_cd NOT IN ('MANAGER','OPR','MD','CS')"),
            ("OPR 이 운영사 아닌 판매자 소속", f"""SELECT count(*) FROM {S}.sl_seller_member m JOIN {S}.sl_seller s ON s.seller_id = m.seller_id
                                                 WHERE m.role_cd = 'OPR' AND s.seller_type_cd <> 'OPERATOR'"""),
            ("판매자 없는 상품", f"SELECT count(*) FROM {S}.pd_prod WHERE seller_id IS NULL"),
            ("상품 판매자가 그 사이트 운영사도 입점 판매자도 아님", f"""SELECT count(*) FROM {S}.pd_prod p WHERE p.seller_id IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM {S}.sy_site x WHERE x.site_id = p.site_id AND x.operator_seller_id = p.seller_id)
                 AND NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site ss WHERE ss.seller_id = p.seller_id AND ss.site_id = p.site_id AND ss.seller_site_status_cd = 'ACTIVE')"""),
        ]
        for name, sql in checks:
            n = q1(sql)
            if n: bad.append(f"{name} {n}건")
        if q1(f"SELECT count(*) FROM {S}.pd_prod") != before["prod"]: bad.append("상품 수가 바뀜")
        if q1(f"SELECT count(*) FROM {S}.sl_seller") != before["seller"] + len([x for x in ins if x[1] == "sl_seller"]): bad.append("판매자 수가 (이전 + 추가)와 다름")
        if bad: raise RuntimeError("사후 검증 실패 — " + " / ".join(bad))
        finish(run_no, 2, f"값 {len(chg)}칸, 추가 {len(ins)}행")
        print(f"\n[검증] {len(checks)}개 점검 통과 · 상품 수 그대로")
        print(f"[완료] 2단계 run #{run_no} — 커밋했습니다({(datetime.datetime.now() - t0).seconds}초). 공통코드 캐시를 비우세요.")
        print("   다음: 새 코드(ecBeBo·ecFeBo·ecFeFoNuxt4) 배포 → 검증 → run --step 3 --confirm-deployed")

    elif STEP == 3:
        if not CONFIRM:
            conn.rollback(); sys.exit("[중단] 3단계는 새 코드 배포 뒤에만 — 배포·검증을 마쳤으면 --confirm-deployed 를 붙이세요.")
        if not step1_done or step2_todo:
            conn.rollback(); sys.exit(f"[중단] 1·2단계가 끝나지 않았습니다(2단계 남은 것 {step2_todo}) — 먼저 run --step 2")
        if not step3_todo:
            conn.rollback(); print("[완료] 3단계 — 할 일이 없습니다."); sys.exit(0)
        print_step3()
        run_no = ensure_bak()

        def del_rows(tbl, pks):
            for pk in pks:
                rj = q1(f'SELECT to_jsonb(t) FROM {S}."{tbl}" t WHERE "{PKS[tbl]}" = %s', (pk,))
                if rj is None: continue
                cur.execute(f"INSERT INTO {BAK}._del (run_no, step, tbl, pk, row_json) VALUES (%s,3,%s,%s,%s::jsonb)", (run_no, tbl, pk, json.dumps(rj)))
                cur.execute(f'DELETE FROM {S}."{tbl}" WHERE "{PKS[tbl]}" = %s', (pk,))

        del_rows("sl_seller_site", [r[0] for r in s3["opsite"]])
        del_rows("sy_user_role", [r[0] for r in s3["userroles"]])
        if s3_nullable:
            ddl(run_no, 3, "NOT NULL sy_site.operator_seller_id", [f"ALTER TABLE {S}.sy_site ALTER COLUMN operator_seller_id SET NOT NULL"],
                [f"ALTER TABLE {S}.sy_site ALTER COLUMN operator_seller_id DROP NOT NULL"])
        for t, c in s3["drop"]:
            typ, nullable, dflt = colfull[(t, c)]
            # 이 컬럼을 쓰는 인덱스·FK 정의(되살릴 때 다시 만든다)
            extra = [f"CREATE INDEX IF NOT EXISTS {ix} ON {S}.{t} USING " + idef.split(" USING ", 1)[1]
                     for ix, idef in q("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname=%s AND tablename=%s", (S, t))
                     if re.search(rf"[(,]\s*{c}\s*[,)]", idef) and " UNIQUE " not in idef]
            extra += [f"ALTER TABLE {S}.{t} ADD CONSTRAINT {cn} {cdef}" for cn, cdef in q(
                """SELECT con.conname, pg_get_constraintdef(con.oid) FROM pg_constraint con JOIN pg_class cl ON cl.oid = con.conrelid
                   JOIN pg_namespace ns ON ns.oid = cl.relnamespace WHERE ns.nspname=%s AND cl.relname=%s AND con.contype IN ('f','u')""", (S, t))
                if re.search(rf"[(,]\s*{c}\s*[,)]", cdef)]
            extra += [idef.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ") for ix, idef in q(
                "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname=%s AND tablename=%s", (S, t)) if re.search(rf"[(,]\s*{c}\s*[,)]", idef) and " UNIQUE " in idef
                and not q1("SELECT 1 FROM pg_constraint WHERE conname=%s", (ix,))]
            cur.execute(f"""INSERT INTO {BAK}._coldef (run_no, step, tbl, col, col_type, nullable, col_default, col_comment, extra_sql)
                            VALUES (%s,3,%s,%s,%s,%s,%s,%s,%s)""", (run_no, t, c, typ, nullable, dflt, comment_of(t, c), ";\n".join(extra)))
            cur.execute(f'INSERT INTO {BAK}._colval (tbl, col, pk, val) SELECT %s, %s, "{PKS[t]}"::text, "{c}"::text FROM {S}."{t}" WHERE "{c}" IS NOT NULL', (t, c))
            cur.execute(f"ALTER TABLE {S}.{t} DROP COLUMN {c} CASCADE")
        if s3["ro"]:
            ddl(run_no, 3, "읽기 전용 함수", [f"""CREATE OR REPLACE FUNCTION {S}.fn_org_seller_readonly() RETURNS trigger LANGUAGE plpgsql AS $f$
                BEGIN RAISE EXCEPTION '% 는 읽기 전용입니다 — 업체는 판매자(sl_seller)로 합쳐졌습니다 (정책 sy.59)', TG_TABLE_NAME; END $f$"""],
                [f"DROP FUNCTION IF EXISTS {S}.fn_org_seller_readonly() CASCADE"])
            for t in s3["ro"]:
                ddl(run_no, 3, f"읽기 전용 {t}", [f"CREATE TRIGGER trg_{t}_readonly BEFORE INSERT OR UPDATE OR DELETE ON {S}.{t} FOR EACH STATEMENT EXECUTE FUNCTION {S}.fn_org_seller_readonly()"],
                    [f"DROP TRIGGER IF EXISTS trg_{t}_readonly ON {S}.{t}"])
        load_meta()
        apply_chg(run_no, 3, [("옛코드값", "sy_code", cid, "use_yn", "Y", "N") for cid, _, _ in s3["codes"]] +
                  [("업체코드그룹", "sy_code_grp", gid, "use_yn", "Y", "N") for gid, _ in s3["grps"]] +
                  [("업체형역할", "sy_role", rid, "use_yn", "Y", "N") for rid, _ in s3["roles"]])
        # ── 사후 검증 ──
        bad = []
        if q1(f"SELECT count(*) FROM {S}.sl_seller_site ss JOIN {S}.sl_seller s ON s.seller_id = ss.seller_id WHERE s.seller_type_cd = 'OPERATOR'"): bad.append("운영사 매핑 남음")
        load_meta()
        left = [f"{t}.{c}" for t, c in s3["drop"] if has_col(t, c)]
        if left: bad.append("삭제 안 된 컬럼 " + ", ".join(left))
        if bad: raise RuntimeError("사후 검증 실패 — " + " / ".join(bad))
        finish(run_no, 3, f"매핑 {len(s3['opsite'])}행 삭제, 컬럼 {len(s3['drop'])}개 삭제, 읽기 전용 {len(s3['ro'])}")
        print(f"\n[완료] 3단계 run #{run_no} — 커밋했습니다({(datetime.datetime.now() - t0).seconds}초). 백업: {BAK}")
except SystemExit:
    raise
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다(백업 스키마 포함): {e}")
    sys.exit(1)
