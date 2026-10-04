# -*- coding: utf-8 -*-
r"""
datafix_20261005_promo_disp_site.py — 프로모션(pm_*)·전시(dp_*) 사이트 정비 점검과 보정 (2026-10-05, 정책 sy.57 §3·§12)

  기준 (정책 sy.57)
    · 사이트 관계는 site_id 로만 본다(reg_site_id 는 감사 필드 — 조건에 쓰지 않는다)
    · 루트(A): pm_coupon·pm_discnt·pm_event·pm_plan·pm_gift·pm_voucher·pm_save_policy·dp_ui·dp_widget_lib — 자기 site_id
    · 자식(B): 항목·대상·혜택·발급·사용·패널 등 — site_id = 부모 행의 site_id
    · 회원을 따르는 것: pm_cache·pm_save·pm_save_issue·pm_save_usage — site_id = 회원(mb_member)의 site_id
    · 대상(target_id)·상품·회원은 같은 사이트의 것이어야 하고, 없는 대상을 가리키면 안 된다

  점검 (dry·status — 읽기 전용)
    T1 테이블별: site_id 컬럼 유무, 행 수, site_id NULL·빈 값·sy_site 에 없는 값, 사이트별 분포
    T2 참조: 부모·상품·회원·주문이 없는 행 수, 부모/대상과 site_id 가 다른 행 수
    T3 대상(target_type_cd/target_id): 없는 카테고리·상품을 가리키는 행, 다른 사이트 것을 가리키는 행

  고치는 것 (run — 한 트랜잭션, 하나라도 어긋나면 전체 롤백)
    X1 다른 사이트 쿠폰을 받은 발급 행 : pm_coupon_issue 의 회원 사이트 ≠ 쿠폰 사이트 → 발급 행 삭제 + pm_coupon.issue_cnt 1 감소
                                        (FO 오프라인 쿠폰 등록이 사이트를 확인하지 않아 생긴 것. 이미 쓴 발급(use_yn='Y'·주문 연결)은 건드리지 않고 알림)
    X2 자식 site_id ≠ 부모 site_id     : 자식 site_id 를 부모(회원을 따르는 테이블은 회원)의 site_id 로
    D1 없는 대상을 가리키는 대상 행     : pm_coupon_item·pm_discnt_item·pm_event_item·pm_gift_cond·pm_save_item 의
                                        target_type_cd = CATEGORY|PRODUCT 인데 그 카테고리·상품이 없는 행 삭제
                                        (2026-05 시드가 만든 CT… 카테고리 ID — pd_category 에 한 번도 없던 값)
    N1 site_id 가 비었거나(NULL·'') sy_site 에 없는 값 : 부모(회원)의 site_id 로. 부모로 정할 수 없는 루트 행은 고치지 않고 알림

  고치지 않고 알리기만 하는 것(판단이 필요한 것)
    · 없는 주문을 가리키는 발급·사용 이력(order_id·order_item_id — 시드 이력 ORD0000…): 이력(C)이라 지우면 잔액·사용 내역이 바뀐다
    · 대상 행을 지우면 대상이 하나도 남지 않는 부모(쿠폰·할인·이벤트·사은품) 수 — 적용 범위는 BO 에서 다시 정해야 한다
    · 다른 사이트의 상품·카테고리·회원을 가리키는 행(삭제할지 옮길지 판단 필요)
    · ec2 등 다른 사이트의 전시·프로모션 데이터가 0건인 것(복사 여부는 별도 결정)

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_promofix_20261005
     _del(지운 행: tbl, pk, fix, row jsonb, run_no) · _chg(바꾼 값: tbl, pk, col, old_val, new_val, fix, run_no) · _run(실행 이력)
     revert = _del 의 행을 그대로 다시 넣고(같은 PK 가 이미 있으면 건너뛰고 알림), _chg 의 값을 이전 값으로(그 뒤 또 바뀐 칸은 건드리지 않고 알림), 백업 스키마 삭제
  다시 실행해도 안전: 계획은 매번 지금 상태에서 다시 만든다 — 이미 고친 것은 계획에 나오지 않는다.

  적용 여부(status — 종료코드 0 = 고칠 것 없음, 3 = 고칠 것 남음)

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python datafix_20261005_promo_disp_site.py dry      # 읽기 전용 세션, SELECT 만 — 점검 표·보정 계획·표본
     python datafix_20261005_promo_disp_site.py status
     python datafix_20261005_promo_disp_site.py run
     python datafix_20261005_promo_disp_site.py revert
     공통 선택: --skip X1,D1,…  (그 보정은 계획에서 뺀다)
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
BAK = "shopjoy_2604_bak_promofix_20261005"
USAGE = "사용법: python datafix_20261005_promo_disp_site.py dry|status|run|revert [--skip X1,X2,D1,N1]"

ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
SKIP = set()
try:
    i = 1
    while i < len(ARGS):
        if ARGS[i] == "--skip": SKIP = {x.strip().upper() for x in ARGS[i + 1].split(",") if x.strip()}; i += 1
        else: raise ValueError(ARGS[i])
        i += 1
except (ValueError, IndexError):
    sys.exit(USAGE)
if MODE not in ("dry", "status", "run", "revert") or SKIP - {"X1", "X2", "D1", "N1"}:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="datafix_20261005_promo_disp_site")
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


COLS = collections.defaultdict(list)       # 테이블 -> [컬럼]
for t, c in q("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=%s ORDER BY table_name, ordinal_position", (S,)):
    COLS[t].append(c)
BASE = {r[0] for r in q("SELECT table_name FROM information_schema.tables WHERE table_schema=%s AND table_type='BASE TABLE'", (S,))}
TABLES = sorted(t for t in BASE if t.startswith(("pm_", "pmh_", "dp_", "dph_")))
PK = {}                                     # 테이블 -> PK 컬럼(단일 PK 만)
for t, c, n in q("""SELECT c.relname, a.attname, i.indnatts FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace
                      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey) WHERE i.indisprimary AND n.nspname = %s""", (S,)):
    if n == 1: PK[t] = c
bak_exists = has_table(BAK, "_run")

# ══════════════════════════════ revert ═══════════════════════════════════════
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"백업 {BAK}._run 이 없습니다 — run 을 한 적이 없습니다.")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        back, dup = collections.Counter(), collections.Counter()
        for tbl, pk in q(f"SELECT tbl, pk FROM {BAK}._del ORDER BY seq"):
            cur.execute(f'''INSERT INTO {S}."{tbl}" SELECT (jsonb_populate_record(NULL::{S}."{tbl}", d.row)).* FROM {BAK}._del d
                             WHERE d.tbl = %s AND d.pk = %s AND NOT EXISTS (SELECT 1 FROM {S}."{tbl}" x WHERE x."{PK[tbl]}" = d.pk)''', (tbl, pk))
            (back if cur.rowcount else dup)[tbl] += 1
        for k, n in back.items(): print(f"   {k}: 지웠던 {n:,}행 다시 넣음")
        for k, n in dup.items(): print(f"   (알림) {k}: {n:,}행은 같은 PK 가 이미 있어 건너뜀")
        done, skipped = collections.Counter(), collections.Counter()
        for tbl, pk, col, old, new in q(f"SELECT tbl, pk, col, old_val, new_val FROM {BAK}._chg ORDER BY run_no DESC, seq DESC"):   # 나중 것부터 거꾸로
            cur.execute(f'''UPDATE {S}."{tbl}" SET "{col}" = (SELECT (jsonb_populate_record(NULL::{S}."{tbl}", jsonb_build_object(%s, %s::text))).\"{col}\")
                             WHERE "{PK[tbl]}" = %s AND "{col}"::text IS NOT DISTINCT FROM %s''', (col, old, pk, new))
            (done if cur.rowcount else skipped)[f"{tbl}.{col}"] += 1
        for k, n in done.items(): print(f"   {k}: {n:,}칸 이전 값으로")
        for k, n in skipped.items(): print(f"   (알림) {k}: {n:,}칸은 그 뒤 값이 또 바뀌어(또는 행이 없어) 건드리지 않음")
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert — 커밋했습니다. 백업 스키마 {BAK} 삭제")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ══════════════════════════ 점검 + 계획 (dry / status / run 공통) ══════════════
VERBOSE = MODE == "dry"
sites = [r[0] for r in q(f"SELECT site_id FROM {S}.sy_site ORDER BY 1")]


def short(s): return s[-2:] if s and s.startswith("SI26") else str(s)


# ── T1 테이블별 site_id ──
no_site_col = [t for t in TABLES if "site_id" not in COLS[t]]
t1 = {}
for t in TABLES:
    if t in no_site_col:
        t1[t] = (q1(f'SELECT count(*) FROM {S}."{t}"'), None, None, None, {}); continue
    n, nul, blank, unk = q(f"""SELECT count(*), count(*) FILTER (WHERE site_id IS NULL), count(*) FILTER (WHERE site_id = ''),
                                      count(*) FILTER (WHERE site_id <> '' AND site_id NOT IN (SELECT site_id FROM {S}.sy_site)) FROM {S}."{t}" """)[0]
    t1[t] = (n, nul, blank, unk, dict(q(f"""SELECT coalesce(site_id, '(NULL)'), count(*) FROM {S}."{t}" GROUP BY 1 ORDER BY 1""")))

# ── 부모(자식 site_id 의 기준) : 자식 테이블 -> (부모 테이블, 자식 FK 컬럼, 부모 키 컬럼) ──
PARENT = {
    "pm_coupon_item": ("pm_coupon", "coupon_id", "coupon_id"), "pm_coupon_issue": ("pm_coupon", "coupon_id", "coupon_id"),
    "pm_coupon_usage": ("pm_coupon", "coupon_id", "coupon_id"), "pm_coupon_prod": ("pm_coupon", "coupon_id", "coupon_id"),
    "pm_discnt_item": ("pm_discnt", "discnt_id", "discnt_id"), "pm_discnt_usage": ("pm_discnt", "discnt_id", "discnt_id"),
    "pm_discnt_prod": ("pm_discnt", "discnt_id", "discnt_id"),
    "pm_event_item": ("pm_event", "event_id", "event_id"), "pm_event_benefit": ("pm_event", "event_id", "event_id"),
    "pm_event_prod": ("pm_event", "event_id", "event_id"), "pm_event_item_rs": ("pm_event_item", "event_item_id", "event_item_id"),
    "pm_gift_cond": ("pm_gift", "gift_id", "gift_id"), "pm_gift_issue": ("pm_gift", "gift_id", "gift_id"),
    "pm_plan_item": ("pm_plan", "plan_id", "plan_id"), "pm_plan_item_rs": ("pm_plan_item", "plan_item_id", "plan_item_id"),
    "pm_voucher_issue": ("pm_voucher", "voucher_id", "voucher_id"),
    "pm_save_item": ("pm_save_policy", "save_id", "save_policy_id"), "pm_save_prod": ("pm_save_policy", "save_id", "save_policy_id"),
    "pm_cache": ("mb_member", "member_id", "member_id"), "pm_save": ("mb_member", "member_id", "member_id"),
    "pm_save_issue": ("mb_member", "member_id", "member_id"), "pm_save_usage": ("mb_member", "member_id", "member_id"),
    "dp_area": ("dp_ui", "ui_id", "ui_id"), "dp_panel": ("dp_area", "area_id", "area_id"), "dp_panel_item": ("dp_panel", "panel_id", "panel_id"),
}
PARENT = {c: v for c, v in PARENT.items() if c in BASE and v[0] in BASE and v[1] in COLS[c] and v[2] in COLS[v[0]] and "site_id" in COLS[c] and c in PK}
# ── 그 밖의 참조(점검만) : 컬럼명 -> (대상 테이블, 키) ──
REF = {"coupon_id": ("pm_coupon", "coupon_id"), "discnt_id": ("pm_discnt", "discnt_id"), "event_id": ("pm_event", "event_id"), "gift_id": ("pm_gift", "gift_id"),
       "plan_id": ("pm_plan", "plan_id"), "voucher_id": ("pm_voucher", "voucher_id"), "member_id": ("mb_member", "member_id"),
       "owner_member_id": ("mb_member", "member_id"), "sender_member_id": ("mb_member", "member_id"), "prod_id": ("pd_prod", "prod_id"),
       "prod_sku_id": ("pd_prod_sku", "prod_sku_id"), "order_id": ("od_order", "order_id"), "src_order_id": ("od_order", "order_id"),
       "use_order_id": ("od_order", "order_id"), "order_item_id": ("od_order_item", "order_item_id"), "event_item_id": ("pm_event_item", "event_item_id"),
       "plan_item_id": ("pm_plan_item", "plan_item_id"), "ui_id": ("dp_ui", "ui_id"), "area_id": ("dp_area", "area_id"), "panel_id": ("dp_panel", "panel_id"),
       "widget_lib_id": ("dp_widget_lib", "widget_lib_id"), "seller_id": ("sl_seller", "seller_id")}
MULTI_SITE = {"sl_seller"}     # 여러 사이트에 매핑되는 대상 — site_id 비교를 하지 않는다

t2 = []      # (자식.컬럼, 대상, 값 있는 행, 없는 대상, 다른 사이트)
for t in TABLES:
    for c in COLS[t]:
        if c not in REF or REF[c][0] == t or REF[c][0] not in BASE: continue
        pt, pc = REF[c]
        tot = q1(f'''SELECT count(*) FROM {S}."{t}" WHERE coalesce("{c}", '') <> '' ''')
        if not tot: continue
        dang = q1(f'''SELECT count(*) FROM {S}."{t}" x WHERE coalesce(x."{c}", '') <> '' AND NOT EXISTS (SELECT 1 FROM {S}."{pt}" p WHERE p."{pc}" = x."{c}")''')
        cross = None
        if "site_id" in COLS[t] and "site_id" in COLS[pt] and pt not in MULTI_SITE:
            cross = q1(f'''SELECT count(*) FROM {S}."{t}" x JOIN {S}."{pt}" p ON p."{pc}" = x."{c}"
                            WHERE coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM x.site_id''')
        t2.append((f"{t}.{c}", pt, tot, dang, cross))

# ── T3 대상(target_type_cd / target_id) ──
TARGET = {"CATEGORY": ("pd_category", "category_id"), "PRODUCT": ("pd_prod", "prod_id")}
TGT_TABLES = [t for t in TABLES if "target_type_cd" in COLS[t] and "target_id" in COLS[t] and t in PK]
t3 = []      # (테이블, 유형, 행, 없는 대상, 다른 사이트)
for t in TGT_TABLES:
    for typ, n in q(f'''SELECT target_type_cd, count(*) FROM {S}."{t}" GROUP BY 1 ORDER BY 1'''):
        if typ not in TARGET: t3.append((t, typ, n, None, None)); continue
        pt, pc = TARGET[typ]
        dang = q1(f'''SELECT count(*) FROM {S}."{t}" x WHERE target_type_cd = %s AND NOT EXISTS (SELECT 1 FROM {S}."{pt}" p WHERE p."{pc}" = x.target_id)''', (typ,))
        cross = q1(f'''SELECT count(*) FROM {S}."{t}" x JOIN {S}."{pt}" p ON p."{pc}" = x.target_id
                        WHERE x.target_type_cd = %s AND coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM x.site_id''', (typ,))
        t3.append((t, typ, n, dang, cross))

# ══════════════════════════════ 보정 계획 ═════════════════════════════════════
deletes = []     # (fix, tbl, pk)
changes = []     # (fix, tbl, pk, col, old, new)
manual = []      # 사람이 봐야 하는 것

# X1 — 회원 사이트 ≠ 쿠폰 사이트인 발급 행
x1_ids = set()
if "X1" not in SKIP and {"pm_coupon_issue", "pm_coupon", "mb_member"} <= BASE:
    cnt_down = collections.Counter()
    for iid, cid, mid, csite, msite, use, oid, icnt in q(f"""
            SELECT i.coupon_issue_id, i.coupon_id, i.member_id, c.site_id, m.site_id, i.use_yn, i.order_id, c.issue_cnt
              FROM {S}.pm_coupon_issue i JOIN {S}.pm_coupon c ON c.coupon_id = i.coupon_id JOIN {S}.mb_member m ON m.member_id = i.member_id
             WHERE c.site_id IS DISTINCT FROM m.site_id ORDER BY i.coupon_issue_id"""):
        if use == "Y" or (oid or "") != "":
            manual.append(f"pm_coupon_issue {iid}: 회원({mid}, {msite})이 다른 사이트 쿠폰({cid}, {csite})을 이미 사용 — 지우지 않음"); continue
        deletes.append(("X1", "pm_coupon_issue", iid)); x1_ids.add(iid); cnt_down[(cid, icnt)] += 1
    for (cid, icnt), n in cnt_down.items():
        if icnt is not None: changes.append(("X1", "pm_coupon", cid, "issue_cnt", icnt, max(0, icnt - n)))

# X2 — 자식 site_id ≠ 부모 site_id  /  N1 — site_id 가 비었거나 없는 사이트
for t, (pt, fk, pk) in sorted(PARENT.items()):
    for cid, old, new in q(f'''SELECT x."{PK[t]}", x.site_id, p.site_id FROM {S}."{t}" x JOIN {S}."{pt}" p ON p."{pk}" = x."{fk}"
                                WHERE coalesce(p.site_id, '') <> '' AND p.site_id IS DISTINCT FROM x.site_id ORDER BY 1'''):
        if t == "pm_coupon_issue" and cid in x1_ids: continue
        bad_old = old is None or old == "" or old not in sites
        fix = "N1" if bad_old else "X2"
        if fix in SKIP: continue
        if new not in sites: manual.append(f"{t} {cid}: 부모({pt})의 site_id {new} 가 sy_site 에 없음"); continue
        changes.append((fix, t, cid, "site_id", old, new))
for t in TABLES:      # 부모로 정할 수 없는 빈 값·없는 사이트(루트 등)는 알림만
    n = t1[t]
    if n[1] is None or not (n[1] or n[2] or n[3]): continue
    planned = sum(1 for c in changes if c[0] == "N1" and c[1] == t)
    left = n[1] + n[2] + n[3] - planned
    if left > 0: manual.append(f"{t}: site_id 가 비었거나 없는 사이트인 {left:,}행은 부모로 정할 수 없음 — 직접 확인 필요")

# D1 — 없는 카테고리·상품을 가리키는 대상 행
PARENT_OF_TGT = {t: PARENT[t] for t in TGT_TABLES if t in PARENT}
orphan_parents = {}     # 테이블 -> 대상 행이 하나도 남지 않게 되는 부모 수
if "D1" not in SKIP:
    for t in TGT_TABLES:
        ids = []
        for typ, (pt, pc) in TARGET.items():
            if pt not in BASE: continue
            ids += [r[0] for r in q(f'''SELECT x."{PK[t]}" FROM {S}."{t}" x WHERE x.target_type_cd = %s
                                         AND NOT EXISTS (SELECT 1 FROM {S}."{pt}" p WHERE p."{pc}" = x.target_id) ORDER BY 1''', (typ,))]
        deletes += [("D1", t, i) for i in ids]
        if ids and t in PARENT_OF_TGT:
            fk = PARENT_OF_TGT[t][1]
            orphan_parents[t] = q1(f'''SELECT count(*) FROM (SELECT "{fk}" FROM {S}."{t}" GROUP BY 1 HAVING count(*) = count(*) FILTER (WHERE "{PK[t]}" = ANY(%s))) z''', (ids,))

by_fix = collections.Counter()
for f, t, _ in deletes: by_fix[(f, t, "삭제")] += 1
for f, t, _, c, _, _ in changes: by_fix[(f, t, c)] += 1
todo = len(deletes) + len(changes)

# ══════════════════════════════ 출력 ═════════════════════════════════════════
FIX_NM = {"X1": "다른 사이트 쿠폰 발급 행", "X2": "자식 site_id ≠ 부모", "D1": "없는 대상을 가리키는 대상 행", "N1": "site_id 빈 값·없는 사이트"}
if VERBOSE:
    print(f"■ T1 테이블별 site_id (사이트 {len(sites)}개: {', '.join(sites[:6])}{' …' if len(sites) > 6 else ''})")
    print(f"   {'테이블':<20}{'site_id':>8}{'행 수':>8}{'NULL':>6}{'빈값':>6}{'없는사이트':>8}   사이트별(끝 2자리)")
    for t in TABLES:
        n, nul, blank, unk, dist = t1[t]
        if nul is None: print(f"   {t:<20}{'없음':>8}{n:>8,}"); continue
        print(f"   {t:<20}{'있음':>8}{n:>8,}{nul:>6}{blank:>6}{unk:>8}   " + " ".join(f"{short(k)}:{v:,}" for k, v in dist.items()))
    if no_site_col: print("   ※ site_id 컬럼이 없는 테이블: " + ", ".join(no_site_col))
    print("\n■ T2 참조 — 없는 대상·다른 사이트 (값이 있는 행만, 문제 있는 것만)")
    bad2 = [r for r in t2 if r[3] or r[4]]
    for name, pt, tot, dang, cross in bad2:
        print(f"   {name:<34} → {pt:<16} 값 {tot:>6,}  없는 대상 {dang:>6,}  다른 사이트 {('-' if cross is None else format(cross, ',')):>5}")
    print(f"   (점검한 참조 {len(t2)}개 중 문제 {len(bad2)}개)")
    print("\n■ T3 대상(target_type_cd / target_id)")
    for t, typ, n, dang, cross in t3:
        print(f"   {t:<18} {str(typ):<10} {n:>6,}행" + ("" if dang is None else f"  없는 대상 {dang:>5,}  다른 사이트 {cross:>4,}"))
    print("\n■ 보정 계획")
    if not todo: print("   고칠 것이 없습니다.")
    for (f, t, c), n in sorted(by_fix.items()):
        print(f"   {f} {FIX_NM[f]:<22} {t:<18} {c:<10} {n:>6,}")
    for t, n in orphan_parents.items():
        if n: print(f"   (알림) {t}: 대상 행을 지우면 대상이 하나도 남지 않는 부모 {n:,}건 — 적용 범위를 BO 에서 다시 정해야 합니다")
    for f in ("X1", "X2", "N1", "D1"):
        ex = [d for d in deletes if d[0] == f][:3] + [c for c in changes if c[0] == f][:3]
        for e in ex: print(f"      예) {f} " + " / ".join(str(x) for x in e[1:]))
    if manual:
        print("\n■ 사람이 봐야 하는 것")
        for m in manual[:30]: print("   · " + m)
        if len(manual) > 30: print(f"   … 외 {len(manual) - 30:,}건")
    print("\n■ 알림만(고치지 않음): 없는 주문을 가리키는 이력")
    for name, pt, tot, dang, cross in t2:
        if pt in ("od_order", "od_order_item") and dang: print(f"   {name:<34} {dang:>6,}행")

if MODE == "status":
    print(f"백업 스키마 {BAK}: {'있음(run 한 적 있음)' if bak_exists else '없음'}")
    for (f, t, c), n in sorted(by_fix.items()): print(f"   남은 것 {f} {t} {c}: {n:,}")
    for m in manual[:10]: print("   (확인 필요) " + m)
    print("고칠 것 없음" if not todo else f"고칠 것 {todo:,}건 남음")
    sys.exit(0 if not todo else 3)

if MODE == "dry":
    print(f"\n[dry] 삭제 {len(deletes):,}행 · 값 변경 {len(changes):,}칸 — 아무것도 바꾸지 않았습니다. 적용: python datafix_20261005_promo_disp_site.py run")
    sys.exit(0)

# ══════════════════════════════ run ══════════════════════════════════════════
if not todo:
    print("고칠 것이 없습니다 — 아무것도 바꾸지 않았습니다."); sys.exit(0)
try:
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_no serial PRIMARY KEY, run_at timestamp DEFAULT now(), deleted int, changed int, note text)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._del (seq bigserial PRIMARY KEY, run_no int, fix text, tbl text, pk text, row jsonb)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._chg (seq bigserial PRIMARY KEY, run_no int, fix text, tbl text, pk text, col text, old_val text, new_val text)")
    cur.execute(f"INSERT INTO {BAK}._run (deleted, changed, note) VALUES (%s, %s, %s) RETURNING run_no", (len(deletes), len(changes), "skip=" + ",".join(sorted(SKIP))))
    run_no = cur.fetchone()[0]
    grp = collections.defaultdict(list)
    for f, t, pk in deletes: grp[(f, t)].append(pk)
    for (f, t), ids in sorted(grp.items()):
        cur.execute(f'''INSERT INTO {BAK}._del (run_no, fix, tbl, pk, row) SELECT %s, %s, %s, x."{PK[t]}", to_jsonb(x) FROM {S}."{t}" x WHERE x."{PK[t]}" = ANY(%s)''', (run_no, f, t, ids))
        saved = cur.rowcount
        cur.execute(f'''DELETE FROM {S}."{t}" WHERE "{PK[t]}" = ANY(%s)''', (ids,))
        if saved != len(ids) or cur.rowcount != len(ids):
            raise RuntimeError(f"{t}: 계획 {len(ids)}행인데 백업 {saved}행·삭제 {cur.rowcount}행 — 그 사이 데이터가 바뀌었습니다")
        print(f"   {f} {t}: {len(ids):,}행 삭제(백업함)")
    done = collections.Counter()
    for f, t, pk, col, old, new in changes:
        cur.execute(f'''UPDATE {S}."{t}" SET "{col}" = %s WHERE "{PK[t]}" = %s AND "{col}" IS NOT DISTINCT FROM %s''', (new, pk, old))
        if cur.rowcount != 1: raise RuntimeError(f"{t} {pk}.{col}: 값이 계획을 만든 뒤 바뀌었습니다")
        cur.execute(f"INSERT INTO {BAK}._chg (run_no, fix, tbl, pk, col, old_val, new_val) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (run_no, f, t, pk, col, None if old is None else str(old), None if new is None else str(new)))
        done[(f, t, col)] += 1
    for (f, t, col), n in sorted(done.items()): print(f"   {f} {t}.{col}: {n:,}칸 변경")
    conn.commit()
    print(f"[완료] run #{run_no} — 커밋했습니다. 되돌리기: python datafix_20261005_promo_disp_site.py revert  (백업 {BAK})")
except Exception as e:
    conn.rollback(); print(f"[실패] 롤백했습니다 — 아무것도 바뀌지 않았습니다: {e}"); sys.exit(1)
