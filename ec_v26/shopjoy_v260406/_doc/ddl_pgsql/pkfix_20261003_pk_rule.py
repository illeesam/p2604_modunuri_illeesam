# -*- coding: utf-8 -*-
"""업무·거래 테이블 PK 를 CmUtil.generateId 규칙(접두어 + yyMMddHHmmss + 4자리)으로 정비한다 (2026-10-03).
   - 대상(그룹1): 회원/상품/주문/프로모션/블로그/채팅/판매자/정산/문의·공지·게시글/이력·로그. 기준정보(사이트·코드·메뉴·역할·사용자·카테고리·전시·대시보드·팝업·브랜드·업체·배송템플릿·등급·그룹·모듈·cf_*)는 제외.
   - 접두어: 테이블명에서 extractPrefix 규칙(1번 세그먼트 2자 + 이후 세그먼트 1자씩, 최대 5자). 예외: mb_member → MB(앱 코드 규칙).
   - 타임스탬프: reg_date(없으면 테이블의 첫 *_date 컬럼, 그것도 없으면 now()). 같은 초 안에서 순번 0000~9999, 넘치면 다음 초로.
   - 참조 갱신: ① 같은 이름의 컬럼(해당 테이블의 PK 가 아닌 것) ② 다형 참조(ref_id/target_id/parent_comment_id/rel_prod_id 등) 전역 매핑 ③ 본문(text/json) 안의 ID 문자열 치환
   - 실행: DB_PASSWORD=... python pkfix.py dry   (계획만)  /  python pkfix.py run  (백업 스키마 생성 후 실제 적용)
"""
import os, re, sys, datetime, collections
import psycopg2, psycopg2.extras
MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_pk_20261003"
RULE = r'^[A-Z]{2,5}[0-9]{16}$'
# 대상 테이블: 접두어가 테이블명 규칙과 다른 것은 override
TARGETS = [
  # mb
  "mb_member","mb_member_addr","mb_member_card","mb_member_email_verify","mb_member_group_map","mb_member_pw_reset","mb_member_role","mb_member_sns","mb_device_token","mb_like",
  "mbh_member_login_log","mbh_member_token_log","mbh_member_sns",
  # pd
  "pd_prod","pd_prod_content","pd_prod_img","pd_prod_opt","pd_prod_sku","pd_prod_tag","pd_prod_rel","pd_prod_qna","pd_prod_bundle_item","pd_prod_set_item","pd_prod_plan","pd_review","pd_review_comment","pd_review_attach","pd_restock_noti","pd_tag","pd_category_prod",
  "pdh_prod_chg_hist","pdh_prod_content_chg_hist","pdh_prod_sku_chg_hist","pdh_prod_sku_price_hist","pdh_prod_sku_stock_hist","pdh_prod_status_hist","pdh_prod_view_log",
  # od
  "od_cart","od_order","od_order_item","od_order_discnt","od_order_item_discnt","od_pay","od_pay_method","od_refund","od_refund_method","od_claim","od_claim_item","od_dliv","od_dliv_item",
  "odh_claim_chg_hist","odh_claim_item_chg_hist","odh_claim_item_status_hist","odh_claim_status_hist","odh_dliv_chg_hist","odh_dliv_item_chg_hist","odh_dliv_status_hist","odh_order_chg_hist","odh_order_item_chg_hist","odh_order_item_status_hist","odh_order_status_hist","odh_pay_chg_hist","odh_pay_status_hist",
  # pm
  "pm_cache","pm_coupon","pm_coupon_issue","pm_coupon_item","pm_coupon_prod","pm_coupon_usage","pm_discnt","pm_discnt_item","pm_discnt_prod","pm_discnt_usage","pm_event","pm_event_benefit","pm_event_item","pm_event_item_rs","pm_event_prod","pm_gift","pm_gift_cond","pm_gift_issue","pm_plan","pm_plan_item","pm_plan_item_rs","pm_prod_coupon","pm_save","pm_save_issue","pm_save_item","pm_save_policy","pm_save_prod","pm_save_usage","pm_voucher","pm_voucher_issue",
  # cm / sy 콘텐츠
  "cm_blog","cm_blog_file","cm_blog_good","cm_blog_reply","cm_blog_tag","cm_chatt","cm_chatt_member","cm_chatt_msg","cmh_push_log",
  "sy_contact","sy_notice","sy_bbs","sy_voc",
  # sl / st
  "sl_seller","sl_seller_member","sl_seller_warehouse",
  "st_settle_config","st_settle_raw","st_settle","st_settle_item","st_settle_adj","st_settle_etc_adj","st_settle_close","st_settle_pay","st_recon","st_erp_voucher","st_erp_voucher_line",
  # 로그
  "syh_alarm_send_hist","syh_api_log","syh_batch_hist","syh_batch_log","syh_send_email_log","syh_send_msg_log",
]
PREFIX_OVERRIDE = {"mb_member": "MB"}  # FoAuthService 등 앱 코드가 MB 로 생성
POLY_COLS = {"ref_id", "target_id", "parent_comment_id", "rel_prod_id", "orig_order_id", "src_order_id", "src_claim_id"}
TEXT_SKIP_TABLES = {"flyway_schema_history", "cf_token", "cf_token_hist", "sy_prop", "sy_site", "sy_i18n", "md_sg_sourcegen", "md_sg_sourcegen_hist"}

def extract_prefix(tbl):
    parts = tbl.upper().split("_"); sb = ""
    for i in range(1, len(parts)):
        if not parts[i] or len(sb) >= 5: continue
        sb += parts[i][:2] if i == 1 else parts[i][:1]
    return sb[:5] or "XX"

conn = psycopg2.connect(host="illeesam.synology.me", port=17632, dbname="postgres", user="postgres", password=os.environ["DB_PASSWORD"], connect_timeout=10)
conn.autocommit = False
cur = conn.cursor()
def q(sql, args=None): cur.execute(sql, args); return cur.fetchall()

# 스키마 메타
pk_of = dict(q("""SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
 JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema
 WHERE tc.table_schema=%s AND tc.constraint_type='PRIMARY KEY' AND kcu.ordinal_position=1""", (S,)))
cols = q("SELECT table_name, column_name, data_type, COALESCE(character_maximum_length,0) FROM information_schema.columns WHERE table_schema=%s", (S,))
tables_all = {t for t, c, d, l in cols if not t.startswith("zz") and not t.startswith("vw_")}
colset = collections.defaultdict(dict)
for t, c, d, l in cols: colset[t][c] = (d, l)
missing = [t for t in TARGETS if t not in tables_all]
if missing: print("!! 없는 테이블:", missing)
targets = [t for t in TARGETS if t in tables_all and t in pk_of]

# 1) 매핑 생성 (Python 에서 유일성 보장)
mapping = {}   # tbl -> {old: new}
global_map = {}
stats = []
for t in targets:
    pk = pk_of[t]
    prefix = PREFIX_OVERRIDE.get(t) or extract_prefix(t)
    ts_col = "reg_date" if "reg_date" in colset[t] else next((c for c in colset[t] if c.endswith("_date") and colset[t][c][0].startswith("timestamp")), None)
    rows = q(f'SELECT "{pk}", {("\"" + ts_col + "\"") if ts_col else "NULL"} FROM {S}."{t}" ORDER BY 2 NULLS LAST, 1')
    existing = {r[0] for r in rows}
    used = {r[0] for r in rows if re.match(RULE, r[0] or "")}
    bad = [r for r in rows if not re.match(RULE, r[0] or "")]
    per_sec = collections.Counter(); m = {}
    for old, ts in bad:
        base = ts if isinstance(ts, datetime.datetime) else datetime.datetime.now()
        while True:
            key = base.strftime("%y%m%d%H%M%S")
            n = per_sec[key]
            if n < 10000:
                new = f"{prefix}{key}{n:04d}"; per_sec[key] += 1
                if new not in used: break
            else:
                base = base + datetime.timedelta(seconds=1)
        used.add(new); m[old] = new; global_map[old] = new
    mapping[t] = m
    stats.append((t, pk, prefix, ts_col or "now()", len(rows), len(bad)))

print(f"{'table':28} {'pk':22} {'prefix':6} {'ts':14} {'rows':>7} {'rewrite':>7}")
for s in stats: print(f"{s[0]:28} {s[1]:22} {s[2]:6} {s[3]:14} {s[4]:7} {s[5]:7}")
print("총 재부여:", sum(s[5] for s in stats), "/ 전역 매핑 키 중복 여부:", len(global_map) == sum(len(m) for m in mapping.values()))

# 2) 참조 컬럼 계획
ref_plan = []  # (table, column, source_table)
for t in targets:
    pk = pk_of[t]
    for t2 in sorted(tables_all):
        if pk in colset[t2] and not (t2 == t) and pk_of.get(t2) != pk:
            ref_plan.append((t2, pk, t))
poly_plan = [(t2, c) for t2 in sorted(tables_all) for c in colset[t2] if c in POLY_COLS and colset[t2][c][0] in ("character varying","text")]
text_plan = [(t2, c) for t2 in sorted(tables_all) for c, (d, l) in colset[t2].items()
             if t2 not in TEXT_SKIP_TABLES and (d in ("text","json","jsonb") or (d == "character varying" and l >= 1000)) and c != pk_of.get(t2)]
print(f"\n참조 컬럼(동명) {len(ref_plan)}개 / 다형 참조 {len(poly_plan)}개 / 본문 텍스트 {len(text_plan)}개")
if MODE == "dry":
    for r in ref_plan: print("  REF ", r)
    for r in poly_plan: print("  POLY", r)
    sys.exit(0)

# 3) 실제 적용
print("\n== 백업 스키마 생성:", BAK)
cur.execute(f'CREATE SCHEMA IF NOT EXISTS {BAK}')
bak_tables = sorted(set([t for t in targets] + [r[0] for r in ref_plan] + [r[0] for r in poly_plan] + [r[0] for r in text_plan]))
for t in bak_tables:
    cur.execute(f'DROP TABLE IF EXISTS {BAK}."{t}"'); cur.execute(f'CREATE TABLE {BAK}."{t}" AS SELECT * FROM {S}."{t}"')
conn.commit(); print("백업 테이블", len(bak_tables), "개")

cur.execute(f'DROP TABLE IF EXISTS {S}._pkmap'); cur.execute(f'CREATE TABLE {S}._pkmap (tbl varchar(60), old_id varchar(100), new_id varchar(30), PRIMARY KEY (tbl, old_id))')
cur.execute(f'CREATE INDEX ON {S}._pkmap (old_id)')
psycopg2.extras.execute_values(cur, f'INSERT INTO {S}._pkmap VALUES %s', [(t, o, n) for t, m in mapping.items() for o, n in m.items()], page_size=5000)
conn.commit(); print("_pkmap 적재", sum(len(m) for m in mapping.values()))

cur.execute("SET session_replication_role = replica")  # FK 트리거 비활성(수퍼유저)
done = 0
for t in targets:
    pk = pk_of[t]; m = mapping[t]
    if not m: continue
    cur.execute(f'UPDATE {S}."{t}" x SET "{pk}" = p.new_id FROM {S}._pkmap p WHERE p.tbl=%s AND p.old_id = x."{pk}"', (t,)); done += cur.rowcount
print("PK 갱신", done)
for t2, c, src in ref_plan:
    cur.execute(f'UPDATE {S}."{t2}" x SET "{c}" = p.new_id FROM {S}._pkmap p WHERE p.tbl=%s AND p.old_id = x."{c}"', (src,))
    if cur.rowcount: print(f"  REF {t2}.{c} <- {src}: {cur.rowcount}")
for t2, c in poly_plan:
    cur.execute(f'UPDATE {S}."{t2}" x SET "{c}" = p.new_id FROM {S}._pkmap p WHERE p.old_id = x."{c}"')
    if cur.rowcount: print(f"  POLY {t2}.{c}: {cur.rowcount}")
# 본문 치환: 옛 ID 는 전부 영숫자/하이픈이라 단어 경계로 안전하게 치환
pat_old = re.compile(r'(?<![A-Za-z0-9_])(' + '|'.join(sorted((re.escape(k) for k in global_map), key=len, reverse=True)) + r')(?![A-Za-z0-9_])')
sql_filter = "(" + "|".join(sorted({re.escape(k[:6]) for k in global_map})) + ")"
for t2, c in text_plan:
    pk2 = pk_of.get(t2)
    if not pk2: continue
    try:
        rows = q(f'SELECT "{pk2}", "{c}" FROM {S}."{t2}" WHERE "{c}" ~ %s', (sql_filter,))
    except Exception as e:
        conn.rollback(); print("  TEXT skip", t2, c, str(e).splitlines()[0][:60]); cur.execute("SET session_replication_role = replica"); continue
    n = 0
    for pid, val in rows:
        new = pat_old.sub(lambda mm: global_map[mm.group(1)], val)
        if new != val:
            cur.execute(f'UPDATE {S}."{t2}" SET "{c}" = %s WHERE "{pk2}" = %s', (new, pid)); n += 1
    if n: print(f"  TEXT {t2}.{c}: {n}")
cur.execute("SET session_replication_role = DEFAULT")
conn.commit()
print("\n== 검증")
bad_total = 0
for t in targets:
    pk = pk_of[t]
    cur.execute(f'SELECT count(*) FILTER (WHERE "{pk}" !~ %s), count(*) FROM {S}."{t}"', (RULE,)); b, n = cur.fetchone(); bad_total += b
    if b: print(f"  !! {t}: 아직 위반 {b}/{n}")
print("규칙 위반 잔여:", bad_total)
orph = 0
for t2, c, src in ref_plan:
    cur.execute(f'SELECT count(*) FROM {S}."{t2}" x WHERE x."{c}" IS NOT NULL AND x."{c}" <> \'\' AND NOT EXISTS (SELECT 1 FROM {S}."{src}" p WHERE p."{pk_of[src]}" = x."{c}")')
    o = cur.fetchone()[0]
    if o: print(f"  고아 참조 {t2}.{c} -> {src}: {o}"); orph += o
print("고아 참조 합계(원래부터 있던 고아 포함):", orph)
