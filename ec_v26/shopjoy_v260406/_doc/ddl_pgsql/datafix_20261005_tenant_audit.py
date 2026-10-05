# -*- coding: utf-8 -*-
r"""
datafix_20261005_tenant_audit.py — 멀티테넌트 전수 점검(사이트 없는 행·부모와 다른 사이트·사이트별 유일 키·NOT NULL·컬럼 기본값) 과 보정 (2026-10-05, 정책 sy.57)

  기준 (정책 sy.57 — 점검 문서 sy.57.사이트테넌시정책.멀티테넌트점검-2026-10-05.md)
    · 사이트 관계는 site_id 로만 본다(reg_site_id 는 감사 필드).
    · 루트(A) 테이블의 site_id 는 NOT NULL. 자식(B)의 site_id = 부모 행의 site_id. 회원 소유 행 = 회원의 site_id.
    · 사이트 안에서만 쓰는 업무 키는 (site_id, 키) 유일 — 다른 사이트가 같은 코드를 쓸 수 있어야 한다.
      (예: ec2 상품을 ec1 에서 복사할 때 prod_code 가 전역 유일이라 '-E2' 를 붙여야 했다)
    · 전역으로 유일해야 하는 키(로그인 없이 코드만으로 찾는 상품권·상품쿠폰 번호, 기기 토큰, 사이트 코드)는 그대로 둔다.
    · 프로모션(pm_*)·전시(dp_*)의 부모 불일치·다른 사이트 쿠폰 발급은 datafix_20261005_promo_disp_site.py 가 맡는다(여기서는 점검만).

  점검 (dry·status — 읽기 전용)
    T1 site_id 있는 테이블: NULL·빈 값·sy_site 에 없는 값·모듈 없는 사이트 값 / NOT NULL 여부 / 컬럼 기본값('SI260001')
    T2 부모(또는 회원)와 site_id 가 다른 자식 행 (od·pd·mb·cm·st·sy — pm·dp 는 표시만)
    T3 site_id 없는 테이블 분류(부모로 정해짐 / 공통 / 이력·로그) — 분류에 없는 새 테이블은 "분류 필요"로 알림
    T4 유일 인덱스: 사이트별이어야 하는데 전역인 것, 사이트별 키 중복(바꾸기 전 확인), reg_site_id 를 쓰는 유일 인덱스
    T5 사이트 마스터: ACTIVE 인데 모듈(module_cd)·루트 카테고리가 없는 사이트, ACTIVE 사이트끼리 같은 도메인

  고치는 것 (run — 한 트랜잭션, 하나라도 어긋나면 전체 롤백. 같은 PK·같은 상태면 건너뛴다 = 다시 실행해도 안전)
    X2 자식·회원 소유 행 site_id ≠ 부모(회원) site_id → 부모 값으로 (pm·dp 제외)
    N1 루트(A) site_id NOT NULL — NULL·빈 값이 0건인 테이블만 (있으면 고치지 않고 알림)
    U1 pd_prod.prod_code           전역 유일 → (site_id, prod_code)
    U2 pd_prod_sku.sku_code        전역 유일 → (site_id, sku_code)
    U3 pm_coupon.coupon_cd         전역 유일 → (site_id, coupon_cd)   (FO 쿠폰 코드 등록은 이미 이 사이트 쿠폰만 찾는다)
    U4 dp_widget_lib.widget_code   전역 유일 → (site_id, widget_code)
    U5 dp_ui.ui_cd · dp_area.area_cd  유일 없음 → (site_id, ui_cd) · (site_id, area_cd)   (FO 는 영역코드로 이 사이트 영역을 찾는다)
    U6 sy_exceldown_uk01_running (reg_site_id 기준 동시 1건 게이트) 삭제 — site_id 기준 uk02_running 이 이미 있다(정책 §12)
    (선택) D1 site_id 컬럼 기본값 'SI260001' 제거 — 저장 코드가 site_id 를 빠뜨리면 조용히 대표 사이트로 들어가는 대신 오류가 나게.
       배치·네이티브 INSERT 점검 뒤에만: --with-d1 를 줄 때만 계획에 넣는다.

  고치지 않고 알리기만 하는 것(판단이 필요한 것)
    · ACTIVE 인데 모듈 없는 사이트(SI260008~ 등) — FO 요청은 백엔드가 막는다(SiteResolveFilter, 2026-10-05). INACTIVE 로 둘지 결정
    · sy_site.site_business_no 전역 유일 — 운영사 한 곳이 여러 사이트를 운영하면 같은 사업자번호를 쓸 수 없다(운영사 = sy_site.operator_seller_id 설계와 함께 결정)
    · ACTIVE 사이트끼리 같은 도메인 — 도메인으로 링크를 만들기 시작하면 유일해야 한다
    · 부모가 없는 고아 행(시드) — 사이트 문제가 아니라 별도 정리(BO 점검 2026-10-04 §6.2)

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_tenantfix_20261005
     _chg(바꾼 값: tbl, pk, col, old_val, new_val, fix, run_no) · _ddl(실행한 DDL 과 되돌릴 DDL: fix, sql_do, sql_undo, run_no) · _run(실행 이력)
     revert = _ddl 을 나중 것부터 sql_undo 로, _chg 의 값을 이전 값으로(그 뒤 또 바뀐 칸은 건드리지 않고 알림), 백업 스키마 삭제

  적용 여부(status — 종료코드 0 = 고칠 것 없음, 3 = 고칠 것 남음)

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python datafix_20261005_tenant_audit.py dry      # 읽기 전용 세션, SELECT 만 — 점검 표·보정 계획·표본
     python datafix_20261005_tenant_audit.py status
     python datafix_20261005_tenant_audit.py run      [--skip U1,N1,…] [--with-d1]
     python datafix_20261005_tenant_audit.py revert
"""
import os, sys, collections
import psycopg2

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_tenantfix_20261005"
FIXES = ["X2", "N1", "U1", "U2", "U3", "U4", "U5", "U6", "D1"]
USAGE = "사용법: python datafix_20261005_tenant_audit.py dry|status|run|revert [--skip X2,N1,U1,…] [--with-d1]"

ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
SKIP, WITH_D1 = set(), False
try:
    i = 1
    while i < len(ARGS):
        if ARGS[i] == "--skip": SKIP = {x.strip().upper() for x in ARGS[i + 1].split(",") if x.strip()}; i += 1
        elif ARGS[i] == "--with-d1": WITH_D1 = True
        else: raise ValueError(ARGS[i])
        i += 1
except (ValueError, IndexError):
    sys.exit(USAGE)
if MODE not in ("dry", "status", "run", "revert") or SKIP - set(FIXES):
    sys.exit(USAGE)
if not WITH_D1: SKIP.add("D1")
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="datafix_20261005_tenant_audit")
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
    return q(sql, args)[0][0]


def has_table(schema, name):
    return bool(q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (schema, name)))


COLS = collections.defaultdict(dict)       # 테이블 -> {컬럼: (nullable, default)}
for t, c, nul, dflt in q("""SELECT table_name, column_name, is_nullable, column_default FROM information_schema.columns
                             WHERE table_schema=%s ORDER BY table_name, ordinal_position""", (S,)):
    COLS[t][c] = (nul == "YES", dflt)
BASE = {r[0] for r in q("SELECT table_name FROM information_schema.tables WHERE table_schema=%s AND table_type='BASE TABLE'", (S,))}
BASE = {t for t in BASE if not t.startswith("zz")}
PK = {}
for t, c, n in q("""SELECT c.relname, a.attname, i.indnatts FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace
                      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey) WHERE i.indisprimary AND n.nspname = %s""", (S,)):
    if n == 1: PK[t] = c
IDX = {r[0]: (r[1], r[2]) for r in q("SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname=%s", (S,))}
CONS = {r[0]: r[1] for r in q("""SELECT con.conname, c.relname FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
                                  JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = %s AND con.contype = 'u'""", (S,))}
bak_exists = has_table(BAK, "_run")


def undo_all():
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        for fix, sql_undo in q(f"SELECT fix, sql_undo FROM {BAK}._ddl ORDER BY run_no DESC, seq DESC"):
            cur.execute(sql_undo); print(f"   {fix}: {sql_undo.strip().splitlines()[0][:110]}")
        done, skipped = collections.Counter(), collections.Counter()
        for tbl, pk, col, old, new in q(f"SELECT tbl, pk, col, old_val, new_val FROM {BAK}._chg ORDER BY run_no DESC, seq DESC"):
            cur.execute(f'''UPDATE {S}."{tbl}" SET "{col}" = %s WHERE "{PK[tbl]}" = %s AND "{col}"::text IS NOT DISTINCT FROM %s''', (old, pk, new))
            (done if cur.rowcount else skipped)[f"{tbl}.{col}"] += 1
        for k, n in done.items(): print(f"   {k}: {n:,}칸 이전 값으로")
        for k, n in skipped.items(): print(f"   (알림) {k}: {n:,}칸은 그 뒤 값이 또 바뀌어(또는 행이 없어) 건드리지 않음")
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert — 커밋했습니다. 백업 스키마 {BAK} 삭제")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)


if MODE == "revert":
    if not bak_exists: sys.exit(f"백업 {BAK}._run 이 없습니다 — run 을 한 적이 없습니다.")
    undo_all(); sys.exit(0)

VERBOSE = MODE == "dry"
SITES = {r[0]: (r[1], r[2], r[3], r[4]) for r in q(f"SELECT site_id, site_status_cd, module_cd, root_category_id, site_domain FROM {S}.sy_site ORDER BY 1")}
NO_MODULE = sorted(s for s, v in SITES.items() if not (v[1] or "").strip())


def short(s): return s[-2:] if s and s.startswith("SI26") else str(s)


# ══════════════════════ T1 site_id 있는 테이블 ══════════════════════════════
SITE_TABLES = sorted(t for t in BASE if "site_id" in COLS[t] and t != "sy_site")
t1 = {}
for t in SITE_TABLES:
    n, nul, blank, unk, nomod = q(f"""SELECT count(*), count(*) FILTER (WHERE site_id IS NULL), count(*) FILTER (WHERE site_id = ''),
                                             count(*) FILTER (WHERE site_id <> '' AND site_id NOT IN (SELECT site_id FROM {S}.sy_site)),
                                             count(*) FILTER (WHERE site_id = ANY(%s)) FROM {S}."{t}" """, (NO_MODULE,))[0]
    nullable, dflt = COLS[t]["site_id"]
    t1[t] = (n, nul, blank, unk, nomod, nullable, dflt)

# 루트(A) — site_id NOT NULL 이어야 하는 테이블. 사이트와 무관하게 비울 수 있는 것은 빼 둔다:
#   ap_fcm_noti(관리자 알림 USER 는 사이트 없음 — 2026-08 엑셀 완료 알림 20건) · cm_dashboard_data(정의 미리보기)
#   md_*·zd_* 는 모듈 도구·개발 지원 데이터
ROOT_NOT_NULL = ["cm_bbm", "cm_bbs", "cm_blog", "cm_blog_cate", "cm_chatt", "cm_faq", "pm_cache", "st_erp_voucher", "st_recon",
                 "st_settle", "st_settle_adj", "st_settle_close", "st_settle_config", "st_settle_etc_adj", "st_settle_pay", "st_settle_raw",
                 "sy_brand", "sy_contact", "sy_exceldown", "sy_notice", "sy_user"]
ROOT_NOT_NULL = [t for t in ROOT_NOT_NULL if t in t1]

# ══════════════════════ T2 부모(회원)와 다른 site_id ═══════════════════════════
PARENT = [   # (자식, 자식 FK, 부모, 부모 키) — 자식에 site_id 가 있고 부모로 사이트가 정해지는 것
    ("od_order_item", "order_id", "od_order", "order_id"), ("od_claim", "order_id", "od_order", "order_id"),
    ("od_claim_item", "claim_id", "od_claim", "claim_id"), ("od_dliv", "order_id", "od_order", "order_id"),
    ("od_dliv_item", "dliv_id", "od_dliv", "dliv_id"), ("od_pay", "order_id", "od_order", "order_id"),
    ("od_refund", "claim_id", "od_claim", "claim_id"), ("od_order", "member_id", "mb_member", "member_id"),
    ("od_cart", "member_id", "mb_member", "member_id"),
    ("pd_prod_sku", "prod_id", "pd_prod", "prod_id"), ("pd_prod_img", "prod_id", "pd_prod", "prod_id"), ("pd_prod_opt", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_content", "prod_id", "pd_prod", "prod_id"), ("pd_prod_tag", "prod_id", "pd_prod", "prod_id"), ("pd_prod_rel", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_bundle_item", "bundle_prod_id", "pd_prod", "prod_id"), ("pd_prod_set_item", "set_prod_id", "pd_prod", "prod_id"),
    ("pd_review", "prod_id", "pd_prod", "prod_id"), ("pd_prod_qna", "prod_id", "pd_prod", "prod_id"), ("pd_review_comment", "review_id", "pd_review", "review_id"),
    ("pd_review_attach", "review_id", "pd_review", "review_id"), ("pd_restock_noti", "prod_id", "pd_prod", "prod_id"),
    ("pd_category_prod", "category_id", "pd_category", "category_id"),
    ("mb_member_addr", "member_id", "mb_member", "member_id"), ("mb_member_sns", "member_id", "mb_member", "member_id"),
    ("mb_member_card", "member_id", "mb_member", "member_id"), ("mb_like", "member_id", "mb_member", "member_id"),
    ("mb_device_token", "member_id", "mb_member", "member_id"), ("mb_member_role", "member_id", "mb_member", "member_id"),
    ("cm_bbs", "bbm_id", "cm_bbm", "bbm_id"), ("cm_bbm_menu", "bbm_id", "cm_bbm", "bbm_id"), ("cm_bbs_attach", "bbs_id", "cm_bbs", "bbs_id"),
    ("cm_blog", "blog_cate_id", "cm_blog_cate", "blog_cate_id"),
    ("cm_local_attach", "local_post_id", "cm_local_post", "local_post_id"), ("cm_quote_bid", "quote_req_id", "cm_quote_req", "quote_req_id"),
    ("st_settle_raw", "order_id", "od_order", "order_id"), ("st_settle_adj", "settle_id", "st_settle", "settle_id"),
    ("st_settle_pay", "settle_id", "st_settle", "settle_id"), ("st_settle_etc_adj", "settle_id", "st_settle", "settle_id"),
    ("sy_contact", "member_id", "mb_member", "member_id"),
]
PARENT = [p for p in PARENT if p[0] in BASE and p[2] in BASE and p[1] in COLS[p[0]] and p[3] in COLS[p[2]]
          and "site_id" in COLS[p[0]] and "site_id" in COLS[p[2]] and p[0] in PK]
t2 = []
for ch, fk, pa, pk in PARENT:
    tot, mis, orphan = q(f'''SELECT count(*), count(*) FILTER (WHERE p."{pk}" IS NOT NULL AND coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM c.site_id),
                                    count(*) FILTER (WHERE coalesce(c."{fk}", '') <> '' AND p."{pk}" IS NULL)
                               FROM {S}."{ch}" c LEFT JOIN {S}."{pa}" p ON p."{pk}" = c."{fk}"''')[0]
    t2.append((ch, fk, pa, tot, mis, orphan))
# pm·dp 는 datafix_20261005_promo_disp_site.py 가 고친다 — 여기서는 건수만
PM_DP = [("pm_coupon_issue", "coupon_id", "pm_coupon", "coupon_id"), ("pm_coupon_issue", "member_id", "mb_member", "member_id"),
         ("pm_coupon_item", "coupon_id", "pm_coupon", "coupon_id"), ("pm_event_item", "event_id", "pm_event", "event_id"),
         ("pm_plan_item", "plan_id", "pm_plan", "plan_id"), ("pm_voucher_issue", "voucher_id", "pm_voucher", "voucher_id"),
         ("pm_cache", "member_id", "mb_member", "member_id"), ("dp_panel_item", "panel_id", "dp_panel", "panel_id"), ("dp_area", "ui_id", "dp_ui", "ui_id")]
t2pm = []
for ch, fk, pa, pk in PM_DP:
    if not (ch in BASE and pa in BASE and fk in COLS[ch] and pk in COLS[pa] and "site_id" in COLS[ch] and "site_id" in COLS[pa]): continue
    t2pm.append((ch, fk, pa, q1(f'''SELECT count(*) FROM {S}."{ch}" c JOIN {S}."{pa}" p ON p."{pk}" = c."{fk}"
                                    WHERE coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM c.site_id''')))

# ══════════════════════ T3 site_id 없는 테이블 분류 ══════════════════════════
CHILD_OF = {   # 부모로 사이트가 정해짐 — 조회는 부모 조건(부모를 먼저 사이트로 확인)으로
    "cm_bbm_member": "cm_bbm", "cm_bbs_reply": "cm_bbs", "cm_blog_file": "cm_blog", "cm_blog_good": "cm_blog", "cm_blog_reply": "cm_blog",
    "cm_blog_tag": "cm_blog", "cm_chatt_member": "cm_chatt", "cm_chatt_msg": "cm_chatt", "cm_meet_log": "cm_meet", "cm_meet_member": "cm_meet",
    "cm_meet_note": "cm_meet", "mb_member_email_verify": "mb_member", "mb_member_group_map": "mb_member_group", "mb_member_pw_reset": "mb_member",
    "od_order_discnt": "od_order", "od_order_item_discnt": "od_order_item", "od_pay_method": "mb_member", "od_refund_method": "od_refund",
    "pd_prod_plan": "pd_prod", "sl_seller_member": "sl_seller(→sl_seller_site)", "sl_seller_warehouse": "sl_seller(→sl_seller_site)",
    "sl_seller": "sl_seller_site(여러 사이트 매핑)", "st_erp_voucher_line": "st_erp_voucher", "st_settle_item": "st_settle",
    "sy_user_bookmark": "sy_user", "sy_user_pref": "sy_user", "sy_user_role": "sy_user", "sy_attach": "참조 대상(ref_id)",
}
COMMON = {"cf_client", "cf_file", "cf_token", "cf_token_hist", "flyway_schema_history", "cm_dashboard", "cm_dashboard_item", "cm_dashboard_menu",
          "cm_path", "sy_path", "cm_popup", "cm_popup_item", "sy_code", "sy_code_grp", "sy_i18n", "sy_menu", "sy_role", "sy_role_menu", "sy_dept",
          "sy_batch", "sy_prop", "sy_template", "sy_voc", "sy_vendor", "sy_vendor_brand", "sy_vendor_content", "sy_vendor_user", "sy_vendor_user_role",
          "zd_meta_domain", "zd_meta_snapshot", "zd_meta_term", "zd_meta_word"}
LOG_PREFIX = ("aph_", "cmh_", "mbh_", "odh_", "pdh_", "rsh_", "syh_")
no_site = sorted(t for t in BASE if "site_id" not in COLS[t])
t3_unknown = [t for t in no_site if t not in CHILD_OF and t not in COMMON and not t.startswith(LOG_PREFIX)]

# ══════════════════════ T4 유일 인덱스 ══════════════════════════════════════
# (fix, 테이블, 옛 유일 인덱스/제약 이름(없으면 None), 새 유일 인덱스 이름, 새 키 컬럼)
UNIQ = [
    ("U1", "pd_prod", "pd_prod_uk_prod_code", "pd_prod_uk_site_id_prod_code_x2", ["site_id", "prod_code"]),
    ("U2", "pd_prod_sku", "pd_prod_sku_uk_sku_code", "pd_prod_sku_uk_site_id_sku_code_x2", ["site_id", "sku_code"]),
    ("U3", "pm_coupon", "pm_coupon_uk_coupon_cd", "pm_coupon_uk_site_id_coupon_cd_x2", ["site_id", "coupon_cd"]),
    ("U4", "dp_widget_lib", "dp_widget_lib_uk_widget_code", "dp_widget_lib_uk_site_id_widget_code_x2", ["site_id", "widget_code"]),
    ("U5", "dp_ui", None, "dp_ui_uk_site_id_ui_cd_x2", ["site_id", "ui_cd"]),
    ("U5", "dp_area", None, "dp_area_uk_site_id_area_cd_x2", ["site_id", "area_cd"]),
]
t4 = []    # (fix, tbl, old, new, cols, 상태, 사이트 안 중복 수)
for fix, t, old, new, cols in UNIQ:
    if t not in BASE or any(c not in COLS[t] for c in cols):
        t4.append((fix, t, old, new, cols, "테이블·컬럼 없음", 0)); continue
    dup = q1(f'''SELECT count(*) FROM (SELECT {", ".join(f'"{c}"' for c in cols)} FROM {S}."{t}" WHERE "{cols[-1]}" IS NOT NULL AND "{cols[-1]}" <> ''
                                         GROUP BY {", ".join(f'"{c}"' for c in cols)} HAVING count(*) > 1) z''')
    state = "적용됨" if new in IDX and (old is None or old not in IDX) else "할 것"
    t4.append((fix, t, old, new, cols, state, dup))
u6_state = "할 것" if "sy_exceldown_uk01_running" in IDX else "적용됨"
reg_site_uniq = [(n, v[0], v[1]) for n, v in IDX.items() if "UNIQUE" in v[1] and "reg_site_id" in v[1]]

# ══════════════════════ T5 사이트 마스터 ════════════════════════════════════
active = {s: v for s, v in SITES.items() if v[0] == "ACTIVE"}
ghost = sorted(s for s, v in active.items() if not (v[1] or "").strip())
no_root = sorted(s for s, v in active.items() if (v[1] or "").strip() and not v[2])
dom = collections.defaultdict(list)
for s, v in active.items():
    d = (v[3] or "").strip().lower()
    if d: dom[d].append(s)
dup_domain = {d: ss for d, ss in dom.items() if len(ss) > 1}
biz_uniq = "sy_site_uk_site_business_no" in IDX

# ══════════════════════ 보정 계획 ══════════════════════════════════════════
changes = []     # (fix, tbl, pk, col, old, new)
ddls = []        # (fix, sql_do, sql_undo, 설명)
manual = []

if "X2" not in SKIP:
    for ch, fk, pa, pk in PARENT:
        for cid, old, new in q(f'''SELECT c."{PK[ch]}", c.site_id, p.site_id FROM {S}."{ch}" c JOIN {S}."{pa}" p ON p."{pk}" = c."{fk}"
                                    WHERE coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM c.site_id ORDER BY 1'''):
            if new not in SITES: manual.append(f"{ch} {cid}: 부모({pa})의 site_id {new} 가 sy_site 에 없음"); continue
            changes.append(("X2", ch, cid, "site_id", old, new))

if "N1" not in SKIP:
    for t in ROOT_NOT_NULL:
        n, nul, blank, unk, nomod, nullable, dflt = t1[t]
        if not nullable: continue
        if nul or blank:
            manual.append(f"{t}: site_id 가 비어 있는 {nul + blank:,}행 — 채운 뒤 NOT NULL (N1 건너뜀)"); continue
        ddls.append(("N1", f'ALTER TABLE {S}."{t}" ALTER COLUMN site_id SET NOT NULL', f'ALTER TABLE {S}."{t}" ALTER COLUMN site_id DROP NOT NULL',
                     f"{t}.site_id NOT NULL"))

for fix, t, old, new, cols, state, dup in t4:
    if fix in SKIP or state != "할 것": continue
    if dup:
        manual.append(f"{fix} {t}: ({', '.join(cols)}) 중복 {dup:,}건 — 정리한 뒤 다시 실행 (건너뜀)"); continue
    collist = ", ".join(cols)
    if new not in IDX:
        ddls.append((fix, f'CREATE UNIQUE INDEX {new} ON {S}."{t}" ({collist})', f'DROP INDEX IF EXISTS {S}.{new}', f"{t} ({collist}) 유일 인덱스 만들기"))
    if old and old in IDX:
        olddef = IDX[old][1]
        if old in CONS:   # 제약으로 만든 유일
            ddls.append((fix, f'ALTER TABLE {S}."{t}" DROP CONSTRAINT {old}',
                         f'ALTER TABLE {S}."{t}" ADD CONSTRAINT {old} UNIQUE ({olddef.split("(", 1)[1].rsplit(")", 1)[0]})', f"{t} 옛 전역 유일 {old} 삭제"))
        else:
            ddls.append((fix, f"DROP INDEX {S}.{old}", olddef, f"{t} 옛 전역 유일 {old} 삭제"))

if "U6" not in SKIP and u6_state == "할 것":
    ddls.append(("U6", f"DROP INDEX {S}.sy_exceldown_uk01_running", IDX["sy_exceldown_uk01_running"][1], "sy_exceldown reg_site_id 동시 1건 게이트 삭제"))

dflt_cols = sorted(t for t in SITE_TABLES if (t1[t][6] or "").find("SI260001") >= 0)
if "D1" not in SKIP:
    for t in dflt_cols:
        ddls.append(("D1", f'ALTER TABLE {S}."{t}" ALTER COLUMN site_id DROP DEFAULT', f'ALTER TABLE {S}."{t}" ALTER COLUMN site_id SET DEFAULT {t1[t][6]}',
                     f"{t}.site_id 기본값 제거"))

for s in ghost: manual.append(f"sy_site {s}: ACTIVE 인데 모듈 없음 — FO 요청은 백엔드가 거절. INACTIVE 로 둘지 결정")
for s in no_root: manual.append(f"sy_site {s}: 모듈은 있는데 루트 카테고리 없음 — BO 사이트관리에서 저장하면 서버가 만든다(ensureRoot)")
for d, ss in dup_domain.items(): manual.append(f"sy_site 도메인 '{d}' 를 ACTIVE 사이트 {', '.join(ss)} 가 같이 씀")
if biz_uniq: manual.append("sy_site.site_business_no 전역 유일 — 한 운영사가 여러 사이트를 운영하면 막힌다(운영사 설계와 함께 결정)")
for t in t3_unknown: manual.append(f"{t}: site_id 없는 새 테이블 — 부모로 정해짐/공통/이력 중 분류 필요")

todo = len(changes) + len(ddls)

# ══════════════════════ 출력 ═══════════════════════════════════════════════
FIX_NM = {"X2": "자식 site_id ≠ 부모", "N1": "루트 site_id NOT NULL", "U1": "상품코드 사이트별 유일", "U2": "SKU 코드 사이트별 유일",
          "U3": "쿠폰코드 사이트별 유일", "U4": "위젯코드 사이트별 유일", "U5": "전시 UI·영역 코드 사이트별 유일",
          "U6": "reg_site_id 게이트 삭제", "D1": "site_id 기본값 제거"}
if VERBOSE:
    print(f"■ T1 site_id 있는 테이블 {len(SITE_TABLES)}개 (사이트 {len(SITES)}개, 모듈 없는 사이트 {len(NO_MODULE)}개) — 문제 있는 것만")
    print(f"   {'테이블':<24}{'행 수':>9}{'NULL':>6}{'빈값':>6}{'없는사이트':>8}{'모듈없는':>8}  NOT NULL  기본값")
    shown = 0
    for t in SITE_TABLES:
        n, nul, blank, unk, nomod, nullable, dflt = t1[t]
        if nul or blank or unk or nomod or (t in ROOT_NOT_NULL and nullable):
            print(f"   {t:<24}{n:>9,}{nul:>6}{blank:>6}{unk:>8}{nomod:>8}  {'아니오' if nullable else '예':<8}  {(dflt or '-')[:24]}"); shown += 1
    if not shown: print("   (없음)")
    print(f"   site_id 기본값 'SI260001' 인 컬럼: {len(dflt_cols)}개 — D1(선택)")
    print("\n■ T2 부모(회원)와 site_id 가 다른 자식 행")
    for ch, fk, pa, tot, mis, orphan in t2:
        if mis or orphan: print(f"   {ch + '.' + fk:<36} → {pa:<14} 행 {tot:>7,}  다른 사이트 {mis:>5,}  부모 없음(고아) {orphan:>6,}")
    print(f"   (점검 {len(t2)}쌍 — 다른 사이트 합계 {sum(r[4] for r in t2):,})")
    for ch, fk, pa, mis in t2pm:
        if mis: print(f"   [pm·dp — promo 스크립트 몫] {ch}.{fk} → {pa}: 다른 사이트 {mis:,}")
    print(f"\n■ T3 site_id 없는 테이블 {len(no_site)}개 — 부모로 정해짐 {sum(1 for t in no_site if t in CHILD_OF)} · 공통 {sum(1 for t in no_site if t in COMMON)} · "
          f"이력·로그 {sum(1 for t in no_site if t.startswith(LOG_PREFIX))} · 분류 필요 {len(t3_unknown)}")
    for t in t3_unknown: print(f"   분류 필요: {t}")
    print("\n■ T4 유일 인덱스")
    for fix, t, old, new, cols, state, dup in t4:
        print(f"   {fix} {t:<14} ({', '.join(cols)})  지금 {old if old and old in IDX else '없음':<32} → {state}  사이트 안 중복 {dup:,}")
    print(f"   U6 sy_exceldown_uk01_running(reg_site_id) → {u6_state}")
    for n, t, d in reg_site_uniq: print(f"   reg_site_id 유일 인덱스: {n} ({t})")
    print("\n■ T5 사이트 마스터")
    print(f"   ACTIVE {len(active)}개 중 모듈 없음 {len(ghost)}개: {', '.join(ghost) or '-'}")
    print(f"   모듈 있고 루트 카테고리 없음: {', '.join(no_root) or '-'}  /  같은 도메인: {dup_domain or '-'}")
    print("\n■ 보정 계획")
    if not todo: print("   고칠 것이 없습니다.")
    cnt = collections.Counter((c[0], c[1]) for c in changes)
    for (f, t), n in sorted(cnt.items()): print(f"   {f} {FIX_NM[f]:<22} {t:<20} {n:>6,}칸")
    for f, sql_do, sql_undo, desc in ddls: print(f"   {f} {FIX_NM[f]:<22} {desc}")
    if "D1" in SKIP and not WITH_D1: print("   (D1 기본값 제거는 --with-d1 를 줄 때만)")
    if manual:
        print("\n■ 사람이 봐야 하는 것")
        for m in manual[:40]: print("   · " + m)
        if len(manual) > 40: print(f"   … 외 {len(manual) - 40:,}건")

if MODE == "status":
    print(f"백업 스키마 {BAK}: {'있음(run 한 적 있음)' if bak_exists else '없음'}")
    for c in changes[:10]: print(f"   남은 것 {c[0]} {c[1]} {c[2]} site_id {c[4]} → {c[5]}")
    for d in ddls: print(f"   남은 것 {d[0]} {d[3]}")
    for m in manual[:10]: print("   (확인 필요) " + m)
    print("고칠 것 없음" if not todo else f"고칠 것 {todo:,}건 남음")
    sys.exit(0 if not todo else 3)

if MODE == "dry":
    print(f"\n[dry] 값 변경 {len(changes):,}칸 · DDL {len(ddls):,}건 — 아무것도 바꾸지 않았습니다. 적용: python datafix_20261005_tenant_audit.py run")
    sys.exit(0)

# ══════════════════════ run ════════════════════════════════════════════════
if not todo:
    print("고칠 것이 없습니다 — 아무것도 바꾸지 않았습니다."); sys.exit(0)
try:
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_no serial PRIMARY KEY, run_at timestamp DEFAULT now(), changed int, ddl int, note text)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._chg (seq bigserial PRIMARY KEY, run_no int, fix text, tbl text, pk text, col text, old_val text, new_val text)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._ddl (seq bigserial PRIMARY KEY, run_no int, fix text, sql_do text, sql_undo text)")
    cur.execute(f"INSERT INTO {BAK}._run (changed, ddl, note) VALUES (%s, %s, %s) RETURNING run_no",
                (len(changes), len(ddls), "skip=" + ",".join(sorted(SKIP))))
    run_no = cur.fetchone()[0]
    done = collections.Counter()
    for f, t, pk, col, old, new in changes:
        cur.execute(f'''UPDATE {S}."{t}" SET "{col}" = %s WHERE "{PK[t]}" = %s AND "{col}" IS NOT DISTINCT FROM %s''', (new, pk, old))
        if cur.rowcount != 1: raise RuntimeError(f"{t} {pk}.{col}: 값이 계획을 만든 뒤 바뀌었습니다")
        cur.execute(f"INSERT INTO {BAK}._chg (run_no, fix, tbl, pk, col, old_val, new_val) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (run_no, f, t, pk, col, old, new))
        done[(f, t)] += 1
    for (f, t), n in sorted(done.items()): print(f"   {f} {t}.site_id: {n:,}칸 변경")
    for f, sql_do, sql_undo, desc in ddls:
        cur.execute(sql_do)
        cur.execute(f"INSERT INTO {BAK}._ddl (run_no, fix, sql_do, sql_undo) VALUES (%s, %s, %s, %s)", (run_no, f, sql_do, sql_undo))
        print(f"   {f} {desc}")
    conn.commit()
    print(f"[완료] run #{run_no} — 커밋했습니다. 되돌리기: python datafix_20261005_tenant_audit.py revert  (백업 {BAK})")
except Exception as e:
    conn.rollback(); print(f"[실패] 롤백했습니다 — 아무것도 바뀌지 않았습니다: {e}"); sys.exit(1)
