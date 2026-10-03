# -*- coding: utf-8 -*-
"""사이트 값 정비 (2026-10-03, 사용자 요청: "전체적으로 옛날 siteId 나 잘못된 siteId 있으면 정비해줘").
   sitefix_20261003_site_id_short.py(사이트 ID 단축) 뒤에 실행한다.

   하는 일
     ① sy_site 에 없는 사이트 값(고아) → 새 형식으로 바꿔 sy_site 에 있으면 교체
        (2026-10-03 조회: md_sg_stack.site_id/reg_site_id = 'SITE000001' 22행 — ecFeBo 푸터가 'SITE'+6자리로 잘못 만들던 값)
     ② 비어 있는 reg_site_id(등록 사이트) 채우기 — 부모 데이터에서 찾고, 못 찾으면 대표 사이트(SI260001)
        (2026-10-03 조회: 22개 테이블 약 1,600행. 재고 이력은 엔티티에 컬럼이 없어 계속 NULL 로 쌓이던 것 — 코드도 함께 수정)
     ③ 옛 당근마켓 사이트(SI260007 — danmoo1 을 SI260003 으로 옮기고 남은 빈 사이트) → INACTIVE (데이터가 0건일 때만)
   백업: 스키마 shopjoy_2604_bak_sitefix2_20261003 (_changes: 바뀐 행의 테이블·컬럼·PK·이전값, sy_site 스냅샷)

   실행 (DB_PASSWORD 는 일회성 환경변수로만)
     python sitefix2_20261003_site_cleanup.py dry | run | revert
"""
import os, re, sys
import psycopg2

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "run", "revert"):
    sys.exit("사용법: python sitefix2_20261003_site_cleanup.py dry|run|revert")
S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_sitefix2_20261003"
DEFAULT_SITE = "SI260001"
OLD_SITE7 = "SI260007"

conn = psycopg2.connect(host="illeesam.synology.me", port=17632, dbname="postgres", user="postgres",
                        password=os.environ["DB_PASSWORD"], connect_timeout=10)
conn.autocommit = False
cur = conn.cursor()
def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall() if cur.description else None

def normalize(v):
    """예전 형식 → 새 형식 (백엔드 SiteIdUtil 과 같은 규칙)"""
    m = re.match(r"^(\d{2})0401\d{6}(\d{4})$", v or "")
    if m: return "SI" + m.group(1) + m.group(2)
    m = re.match(r"^SITE\d{2}(\d{4})$", v or "")
    if m: return "SI26" + m.group(1)
    return v

# ── 되돌리기 ──────────────────────────────────────────────────────────────
if MODE == "revert":
    if not q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name='_changes'", (BAK,)):
        sys.exit(f"백업 {BAK}._changes 가 없습니다 — run 을 한 적이 없습니다.")
    rows = q(f"SELECT table_name, column_name, pk_col, pk_val, old_val FROM {BAK}._changes")
    try:
        q("SET LOCAL session_replication_role = replica")
        for t, c, pk, pv, old in rows:
            q(f'UPDATE {S}."{t}" SET "{c}" = %s WHERE "{pk}" = %s', (old, pv))
        q(f"UPDATE {S}.sy_site s SET site_status_cd = b.site_status_cd FROM {BAK}.sy_site b WHERE s.site_id = b.site_id")
        conn.commit()
        print(f"[되돌리기] {len(rows)}건 복원, sy_site 상태 복원 — 커밋했습니다.")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백: {e}"); sys.exit(1)
    sys.exit(0)

sites = {r[0] for r in q(f"SELECT site_id FROM {S}.sy_site")}
pk_of = dict(q("""SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema
                   WHERE tc.table_schema=%s AND tc.constraint_type='PRIMARY KEY' AND kcu.ordinal_position=1""", (S,)))
cols_of = {}
for t, c in q("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=%s", (S,)):
    cols_of.setdefault(t, set()).add(c)
site_cols = [(t, c) for t, c in q("""SELECT c.table_name, c.column_name FROM information_schema.columns c
                    JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                   WHERE c.table_schema=%s AND c.column_name IN ('site_id','reg_site_id') AND c.table_name NOT LIKE 'zz%%' ORDER BY 1, 2""", (S,))]

# ① 고아
orphans = []   # (t, c, old, new, n)
for t, c in site_cols:
    for v, n in q(f'SELECT "{c}", count(*) FROM {S}."{t}" WHERE "{c}" IS NOT NULL AND "{c}" <> \'\' AND NOT ("{c}" = ANY(%s)) GROUP BY 1', (list(sites),)):
        nv = normalize(v)
        orphans.append((t, c, v, nv if nv in sites else None, n))
print("[① 고아 사이트 값]", orphans if orphans else "없음")

# ② reg_site_id 채우기 규칙: (테이블, [(부모테이블, 자식컬럼, 부모컬럼, 부모의 사이트컬럼), ...]) — 위에서부터 차례로 시도
RULES = [
    ("pdh_prod_sku_stock_hist", [("pd_prod_sku", "prod_sku_id", "prod_sku_id", "site_id"), ("pd_prod", "prod_id", "prod_id", "site_id")]),
    ("odh_claim_status_hist",   [("od_claim", "claim_id", "claim_id", "site_id"), ("od_order", "order_id", "order_id", "site_id")]),
    ("mbh_member_login_log",    [("mb_member", "member_id", "member_id", "site_id")]),
    ("mbh_member_token_log",    [("mb_member", "member_id", "member_id", "site_id")]),
    ("pm_cache",                [("mb_member", "member_id", "member_id", "site_id")]),
    ("syh_send_email_log",      [("mb_member", "member_id", "member_id", "site_id"), ("sy_user", "user_id", "user_id", "reg_site_id")]),
    ("syh_send_msg_log",        [("mb_member", "member_id", "member_id", "site_id"), ("sy_user", "user_id", "user_id", "reg_site_id")]),
    ("syh_user_login_log",      [("sy_user", "user_id", "user_id", "reg_site_id")]),
    ("cm_dashboard_item",       [("cm_dashboard", "dashboard_id", "dashboard_id", "reg_site_id")]),
    ("cm_dashboard_menu",       [("cm_dashboard", "dashboard_id", "dashboard_id", "reg_site_id")]),
    ("cm_popup_item",           [("cm_popup", "popup_id", "popup_id", "reg_site_id")]),
    ("sl_seller_member",        [("mb_member", "member_id", "member_id", "site_id"), ("sy_user", "user_id", "user_id", "reg_site_id")]),
    ("sl_seller",               [("sl_seller_member", "seller_id", "seller_id", "reg_site_id")]),
    ("sl_seller_warehouse",     [("sl_seller", "seller_id", "seller_id", "reg_site_id")]),
    ("st_settle",               [("sl_seller", "seller_id", "seller_id", "reg_site_id")]),
    ("st_settle_config",        [("sl_seller", "seller_id", "seller_id", "reg_site_id")]),
    ("st_settle_pay",           [("sl_seller", "seller_id", "seller_id", "reg_site_id")]),
]
null_tables = []
for t, c in site_cols:
    if c != "reg_site_id": continue
    n = q(f'SELECT count(*) FROM {S}."{t}" WHERE reg_site_id IS NULL OR reg_site_id = \'\'')[0][0]
    if n: null_tables.append((t, n))
print("[② 비어 있는 reg_site_id]", null_tables if null_tables else "없음")

# ③ 옛 당근마켓 사이트
s7 = q(f"SELECT site_status_cd, tenant_module, site_nm FROM {S}.sy_site WHERE site_id=%s", (OLD_SITE7,))
s7_data = 0
for t, c in site_cols:
    if t == "sy_site": continue
    s7_data += q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = %s', (OLD_SITE7,))[0][0]
deactivate7 = bool(s7) and s7[0][0] == "ACTIVE" and not s7[0][1] and s7_data == 0
print(f"[③ {OLD_SITE7}] {s7} 데이터 {s7_data}건 → {'INACTIVE 로 변경' if deactivate7 else '변경 안 함'}")

if MODE == "dry":
    print("\n(dry) 변경하지 않았습니다. 적용하려면 run")
    conn.rollback(); sys.exit(0)

try:
    q(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    q(f"DROP TABLE IF EXISTS {BAK}.sy_site"); q(f"CREATE TABLE {BAK}.sy_site AS SELECT * FROM {S}.sy_site")
    q(f"DROP TABLE IF EXISTS {BAK}._changes"); q(f"CREATE TABLE {BAK}._changes (table_name text, column_name text, pk_col text, pk_val text, old_val text, new_val text, step text)")
    q("SET LOCAL session_replication_role = replica")
    def record(t, c, where_sql, params, step):
        pk = pk_of[t]
        q(f'INSERT INTO {BAK}._changes(table_name, column_name, pk_col, pk_val, old_val, step) '
          f'SELECT %s, %s, %s, x."{pk}"::text, x."{c}", %s FROM {S}."{t}" x WHERE {where_sql}', (t, c, pk, step, *params))
    # ①
    for t, c, old, new, n in orphans:
        if not new: continue
        record(t, c, f'x."{c}" = %s', (old,), "①고아")
        q(f'UPDATE {S}."{t}" SET "{c}" = %s WHERE "{c}" = %s', (new, old))
        print(f"   ① {t}.{c}: {old} → {new} ({n}행)")
    # ②
    rules = dict(RULES)
    for t, n in null_tables:
        nullcond = "(x.reg_site_id IS NULL OR x.reg_site_id = '')"
        record(t, "reg_site_id", nullcond, (), "②등록사이트")
        filled = 0
        if "site_id" in cols_of.get(t, set()):   # 같은 행의 site_id
            cur.execute(f'UPDATE {S}."{t}" x SET reg_site_id = x.site_id WHERE {nullcond} AND x.site_id IS NOT NULL AND x.site_id <> \'\''); filled += cur.rowcount
        for pt, ccol, pcol, psite in rules.get(t, []):
            if ccol not in cols_of.get(t, set()) or pcol not in cols_of.get(pt, set()): continue
            cur.execute(f'UPDATE {S}."{t}" x SET reg_site_id = p."{psite}" FROM {S}."{pt}" p '
                        f'WHERE {nullcond} AND p."{pcol}" = x."{ccol}" AND p."{psite}" IS NOT NULL AND p."{psite}" <> \'\''); filled += cur.rowcount
        cur.execute(f'UPDATE {S}."{t}" x SET reg_site_id = %s WHERE {nullcond}', (DEFAULT_SITE,)); dflt = cur.rowcount
        print(f"   ② {t}: {n}행 → 부모에서 {filled}, 대표 사이트 {dflt}")
    q(f"UPDATE {BAK}._changes ch SET new_val = 'filled' WHERE new_val IS NULL")
    # ③
    if deactivate7:
        q(f"UPDATE {S}.sy_site SET site_status_cd='INACTIVE', upd_by='MIGRATION', upd_date=now() WHERE site_id=%s", (OLD_SITE7,))
        print(f"   ③ {OLD_SITE7} → INACTIVE")
    # 검증
    left = 0
    for t, n in null_tables:
        left += q(f'SELECT count(*) FROM {S}."{t}" WHERE reg_site_id IS NULL OR reg_site_id = \'\'')[0][0]
    if left:
        raise RuntimeError(f"비어 있는 reg_site_id 가 {left}건 남았습니다")
    conn.commit()
    print(f"\n[완료] 커밋했습니다. 백업: {BAK}._changes / {BAK}.sy_site — 되돌리기는 revert")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
