# -*- coding: utf-8 -*-
r"""
migration_20261004_ec2_prod_copy.py — ec2(SI260002) 상품 = ec1(SI260001) 상품 복사 (2026-10-04, 멀티테넌트 데이터 정비 D)

  먼저 끝나 있어야 하는 것
    ① run_all pre (sy_brand.site_id · sl_seller_site 가 생김)   ② migration_20261004_category_site.py run (카테고리 매핑)
    run 은 둘 중 하나라도 안 돼 있으면 시작하지 않는다. dry 는 지금 상태 그대로 계획을 보여 주고, pre 뒤에 달라질 부분을 표시한다.

  복사 범위 (기본 = 대표 160건, `--all` 이면 SI260001 전부, `--limit N` 으로 건수 조정)
    2026-10-04 조회: SI260001 632건 중 595건이 "옵션 상품 1벌(옵션 25·SKU 144·이미지 19)"을 찍어낸 시뮬레이션 데이터이고 이미지 파일도 34종뿐이다.
    전부 복사하면 SKU 85,680행(84MB)이 그대로 한 벌 더 생기는데 화면에서 달라지는 것은 없다 → 기본은 대표 건만.
      · 꼭 넣는 상품: 옵션 상품이 아닌 것(단품·묶음), 카테고리가 실제로 연결된 것, 카테고리 전시(pd_category_prod)·상세 내용(pd_prod_content)·
        연관·묶음·세트가 딸린 것, 그리고 묶음·세트의 구성 상품
      · 나머지는 지금 FO 에 보이는 상품(ACTIVE + 전시기간 안)에서 (판매자, 브랜드) 조합을 돌아가며 상품ID 순으로 채운다 → 판매자·브랜드가 고루 들어간다

  복사하는 테이블 (컬럼은 실행 시점에 information_schema 로 읽어 "있는 컬럼만" 복사, site_id/reg_site_id 가 있으면 SI260002)
    pd_prod · pd_prod_opt · pd_prod_sku(재고 stock_qty 포함) · pd_prod_img · pd_prod_content · pd_prod_tag · pd_prod_plan ·
    pd_category_prod · pd_prod_rel · pd_prod_bundle_item · pd_prod_set_item
    + sy_brand(site_id 컬럼이 있을 때 — SI260001 브랜드 전부를 같은 brand_code 로 SI260002 에) + sl_seller_site(복사 상품 판매자 ↔ SI260002, ACTIVE)
  복사하지 않는 것(활동·이력·프로모션): pd_review* · pd_prod_qna · pd_restock_noti · pdh_* · od_* · mb_like · cm_blog · pm_* · st_* · cm_dashboard_data
  값 규칙
    · 새 ID = CmUtil.generateId 형식(접두어 + yyMMddHHmmss + 4자리) — 접두어는 extractPrefix 규칙(pd_prod→PR, pd_prod_sku→PRS …)
    · prod_code(전체 유니크) → 원본 + '-E2' (빈 값은 NULL), sku_code(전체 유니크) → 앞의 원본 상품ID 를 새 상품ID 로 바꿈(그 형식이 아니면 + '-E2')
    · category_id → 카테고리 매핑(shopjoy_2604_map_category_20261004._map)의 SI260002 카테고리, 매핑이 없으면(원본이 없는 카테고리를 가리킴) NULL
    · brand_id → 복사한 SI260002 브랜드, 옵션·SKU 참조 → 복사본 ID(원본에서 이미 끊긴 참조는 NULL), 조회수·판매수 → 0
    · 이미지 URL(cdn_img_url·cdn_thumb_url·thumbnail_url·본문 HTML)은 원본 그대로 — 파일은 공유. 사이트별 폴더로 옮기는 것은 다음 단계(E)가
      pd_prod_img.prod_id → pd_prod.site_id (또는 pd_prod_img.site_id) 기준으로 처리한다.
    · reg_date 는 원본 그대로(신상품순 정렬 유지), reg_by/upd_by = MIGRATION_20261004, reg_site_id = SI260002(감사 필드 — 사이트 조건에는 쓰지 않는다)

  추적·되돌리기: 매핑 스키마 shopjoy_2604_map_ec2copy_20261004
     _map(tbl, old_id, new_id, created) · _inserted(tbl, id — 복사가 아닌 추가 행: sl_seller_site) · _run(실행 이력)
     revert = 매핑 기준 삭제(복사본에 주문·장바구니·리뷰 등이 붙었으면 중단, `--force` 로 무시) 후 매핑 스키마 삭제

  적용 여부 판별(실행기 check 용)
     SELECT to_regclass('shopjoy_2604_map_ec2copy_20261004._map') IS NOT NULL;                 -- 참이면 적용됨
     SELECT count(*) FROM shopjoy_2604.pd_prod WHERE site_id = 'SI260002';                      -- > 0
     `status` 모드: 종료코드 0 = 적용됨, 3 = 미적용

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261004_ec2_prod_copy.py dry    [--all | --limit N]   # 읽기 전용 세션, SELECT 만
     python migration_20261004_ec2_prod_copy.py status
     python migration_20261004_ec2_prod_copy.py run    [--all | --limit N]   # 한 트랜잭션: 사전점검 → 복사 → 사후검증 → 커밋
     python migration_20261004_ec2_prod_copy.py revert [--force]
"""
import os, sys, datetime, collections
import psycopg2, psycopg2.extras

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
MAP = "shopjoy_2604_map_ec2copy_20261004"
CMAP = "shopjoy_2604_map_category_20261004"       # migration_20261004_category_site.py 가 만든 카테고리 매핑
MIG = "MIGRATION_20261004"
SRC, DST = "SI260001", "SI260002"
CODE_SUFFIX = "-E2"
DEFAULT_LIMIT = 160
USAGE = "사용법: python migration_20261004_ec2_prod_copy.py dry|status|run|revert [--all | --limit N] [--force]"

ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
rest = ARGS[1:]
ALL, FORCE, LIMIT = False, False, DEFAULT_LIMIT
try:
    i = 0
    while i < len(rest):
        if rest[i] == "--all": ALL = True
        elif rest[i] == "--force": FORCE = True
        elif rest[i] == "--limit": LIMIT = int(rest[i + 1]); i += 1
        else: raise ValueError(rest[i])
        i += 1
except (ValueError, IndexError):
    sys.exit(USAGE)
if MODE not in ("dry", "status", "run", "revert"):
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

# 복사 테이블 — 순서대로. scope = 상품을 가리키는 컬럼(이 값이 복사 대상 상품인 행만), fks = (컬럼, 참조 테이블, 'req'|'null')
#   'req'  : 참조가 복사 대상 안에 없으면 그 행은 복사하지 않는다(NOT NULL 컬럼)
#   'null' : 참조가 복사 대상 안에 없으면 NULL 로 넣는다(원본에서 이미 끊긴 참조 등)
#   '@category' = 카테고리 매핑(CMAP), keep = 그대로 두는 참조(공유)
TABLES = [
    dict(table="pd_prod", pk="prod_id", scope=None, fks=[("category_id", "@category", "null"), ("brand_id", "sy_brand", "null")],
         note="상품 본체"),
    dict(table="pd_prod_opt", pk="prod_opt_id", scope="prod_id", fks=[("parent_prod_opt_id", "pd_prod_opt", "null")], note="옵션값(색상·사이즈 칩)"),
    dict(table="pd_prod_sku", pk="prod_sku_id", scope="prod_id", fks=[("prod_opt1_id", "pd_prod_opt", "null"), ("prod_opt2_id", "pd_prod_opt", "null")],
         note="SKU·재고(stock_qty)"),
    dict(table="pd_prod_img", pk="prod_img_id", scope="prod_id", fks=[("prod_opt1_id", "pd_prod_opt", "null"), ("prod_opt2_id", "pd_prod_opt", "null")],
         note="이미지(URL 원본 그대로)"),
    dict(table="pd_prod_content", pk="prod_content_id", scope="prod_id", fks=[], note="상세 설명"),
    dict(table="pd_prod_tag", pk="prod_tag_id", scope="prod_id", fks=[], note="태그 연결(tag_id 는 공유)"),
    dict(table="pd_prod_plan", pk="prod_plan_id", scope="prod_id", fks=[], note="가격 예약"),
    dict(table="pd_category_prod", pk="category_prod_id", scope="prod_id", fks=[("category_id", "@category", "req")], note="카테고리 전시 연결"),
    dict(table="pd_prod_rel", pk="prod_rel_id", scope="prod_id", fks=[("rel_prod_id", "pd_prod", "req")], note="연관 상품"),
    dict(table="pd_prod_bundle_item", pk="prod_bundle_item_id", scope="bundle_prod_id",
         fks=[("item_prod_id", "pd_prod", "req"), ("item_sku_id", "pd_prod_sku", "null")], note="묶음 구성"),
    dict(table="pd_prod_set_item", pk="prod_set_item_id", scope="set_prod_id",
         fks=[("item_prod_id", "pd_prod", "null"), ("item_sku_id", "pd_prod_sku", "null")], note="세트 구성"),
]
# 복사하지 않는 테이블 (테이블, 상품 컬럼, 이유) — dry 에 딸린 행 수를 보여 준다
NOT_COPIED = [
    ("pd_review", "prod_id", "리뷰 — 활동 데이터"), ("pd_prod_qna", "prod_id", "상품 문의 — 활동 데이터"),
    ("pd_restock_noti", "prod_id", "재입고 알림 신청 — 활동 데이터"),
    ("pdh_prod_chg_hist", "prod_id", "변경 이력"), ("pdh_prod_content_chg_hist", "prod_id", "변경 이력"), ("pdh_prod_sku_chg_hist", "prod_id", "변경 이력"),
    ("pdh_prod_sku_price_hist", "prod_id", "가격 이력"), ("pdh_prod_sku_stock_hist", "prod_id", "재고 이력(현재 재고는 pd_prod_sku.stock_qty 로 복사됨)"),
    ("pdh_prod_status_hist", "prod_id", "상태 이력"), ("pdh_prod_view_log", "prod_id", "조회 로그"),
    ("od_cart", "prod_id", "장바구니 — 활동 데이터"), ("od_order_item", "prod_id", "주문 — 활동 데이터"),
    ("od_claim_item", "prod_id", "클레임 — 활동 데이터"), ("od_dliv_item", "prod_id", "배송 — 활동 데이터"),
    ("mb_like", "target_id", "찜 — 활동 데이터"), ("cm_blog", "prod_id", "블로그 글 — 사이트 콘텐츠"),
    ("pm_coupon_prod", "prod_id", "쿠폰 대상 전개 — 프로모션은 사이트별로 따로 등록"), ("pm_discnt_prod", "prod_id", "할인 대상 전개 — 프로모션"),
    ("pm_event_prod", "prod_id", "이벤트 대상 전개 — 프로모션"), ("pm_save_prod", "prod_id", "적립 대상 전개 — 프로모션"),
    ("pm_prod_coupon", "prod_id", "상품 쿠폰 — 프로모션"), ("pm_gift", "prod_id", "사은품 — 프로모션"), ("pm_plan_item", "prod_id", "기획전 상품 — 프로모션"),
    ("pm_coupon_usage", "prod_id", "쿠폰 사용 — 활동 데이터"), ("pm_discnt_usage", "prod_id", "할인 사용 — 활동 데이터"),
    ("pm_save_issue", "prod_id", "적립 — 활동 데이터"), ("pm_save_usage", "prod_id", "적립 사용 — 활동 데이터"),
    ("st_settle_item", "prod_id", "정산"), ("st_settle_raw", "prod_id", "정산 원천"), ("cm_dashboard_data", "prod_id", "대시보드 집계"),
]
COPY_NAMES = {d["table"] for d in TABLES} | {"sy_brand", "sl_seller_site"}

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261004_ec2_prod_copy")
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


def extract_prefix(tbl):
    """CmUtil.extractPrefix — 도메인(0번) 제외, 1번 세그먼트 2자 + 이후 1자씩, 최대 5자"""
    parts, sb = tbl.upper().split("_"), ""
    for i in range(1, len(parts)):
        if not parts[i] or len(sb) >= 5: continue
        sb += parts[i][:2] if i == 1 else parts[i][:1]
    return sb[:5] or "XX"


BASE_TS = datetime.datetime.now().replace(microsecond=0)


def gen_ids(tbl, pk, n):
    """새 ID n개 — 접두어 + yyMMddHHmmss + 4자리. 같은 날짜로 시작하는 기존 ID 와 겹치지 않게."""
    if n == 0: return []
    prefix = extract_prefix(tbl)
    used = {r[0] for r in q(f'SELECT "{pk}" FROM {S}."{tbl}" WHERE "{pk}" LIKE %s', (prefix + BASE_TS.strftime("%y%m%d") + "%",))}
    out, seq, t = [], 0, BASE_TS
    while len(out) < n:
        if seq >= 10000:
            t, seq = t + datetime.timedelta(seconds=1), 0
        nid = f"{prefix}{t.strftime('%y%m%d%H%M%S')}{seq:04d}"
        seq += 1
        if nid not in used:
            out.append(nid)
    return out


# ── 스키마 메타 ──────────────────────────────────────────────────────────────
colinfo = collections.defaultdict(dict)   # table -> {column: 최대 길이}
for t, c, ln in q("""SELECT c.table_name, c.column_name, c.character_maximum_length FROM information_schema.columns c
                       JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                      WHERE c.table_schema=%s ORDER BY c.table_name, c.ordinal_position""", (S,)):
    colinfo[t][c] = ln


def has_col(t, c): return c in colinfo.get(t, {})


def has_table(schema, name):
    return bool(q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (schema, name)))


map_exists = has_table(MAP, "_map")
cmap_exists = has_table(CMAP, "_map")
brand_site = has_col("sy_brand", "site_id")
seller_site = "sl_seller_site" in colinfo
pre_ok = brand_site and seller_site
dst_prod_cnt = q1(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id=%s", (DST,))
VISIBLE = "(p.prod_status_cd = 'ACTIVE' AND p.disp_start_date <= now() AND (p.disp_end_date IS NULL OR p.disp_end_date >= now()))"   # FoPdProdService: currentYn='Y' + siteId

# ── status ───────────────────────────────────────────────────────────────────
if MODE == "status":
    if map_exists:
        n = q1(f"SELECT count(*) FROM {MAP}._map WHERE tbl='pd_prod'")
        vis = q1(f"SELECT count(*) FROM {S}.pd_prod p WHERE p.site_id=%s AND {VISIBLE}", (DST,))
        print(f"[상태] 적용됨 — 매핑 {MAP}._map 상품 {n}건, {DST} 상품 {dst_prod_cnt}건(FO 목록 조건 통과 {vis}건)"); sys.exit(0)
    print(f"[상태] 미적용 — 매핑 스키마 없음, {DST} 상품 {dst_prod_cnt}건"); sys.exit(3)

# ── revert ───────────────────────────────────────────────────────────────────
if MODE == "revert":
    if not map_exists:
        sys.exit(f"매핑 {MAP}._map 이 없습니다 — run 을 한 적이 없습니다.")
    cnt = dict(q(f"SELECT tbl, count(*) FROM {MAP}._map WHERE created GROUP BY 1"))
    print("[되돌리기] 매핑 기준 삭제 예정: " + ", ".join(f"{t} {n}" for t, n in cnt.items()))
    new_prod = f"(SELECT new_id FROM {MAP}._map WHERE tbl='pd_prod')"
    new_sku = f"(SELECT new_id FROM {MAP}._map WHERE tbl='pd_prod_sku')"
    used = []
    for t in sorted(colinfo):
        if t in COPY_NAMES or t.startswith("zz"): continue
        for c in colinfo[t]:
            sub = new_prod if ("prod_id" in c and c not in ("category_prod_id", "coupon_prod_id", "discnt_prod_id", "event_prod_id", "save_prod_id")) \
                else new_sku if "sku_id" in c else None
            if sub:
                n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" IN {sub}')
                if n: used.append(f"{t}.{c} {n}행")
    if has_col("mb_like", "target_id"):
        n = q1(f"SELECT count(*) FROM {S}.mb_like WHERE target_id IN {new_prod}")
        if n: used.append(f"mb_like.target_id {n}행")
    if used:
        print("   복사본에 붙은 활동 데이터: " + ", ".join(used))
        if not FORCE:
            conn.rollback(); sys.exit("[중단] 복사한 상품에 활동 데이터가 있습니다 — 그래도 지우려면 revert --force (활동 데이터는 남고 상품만 사라집니다)")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        total = 0
        for d in reversed(TABLES):
            t, pk, sc = d["table"], d["pk"], d["scope"]
            if t not in colinfo: continue
            cond = f'"{pk}" IN (SELECT new_id FROM {MAP}._map WHERE tbl=\'{t}\' AND created)'
            if sc: cond += f' OR "{sc}" IN {new_prod}'       # 복사 뒤 그 상품에 더해진 딸린 행도 함께
            cur.execute(f'DELETE FROM {S}."{t}" WHERE {cond}'); total += cur.rowcount
            print(f"   {t}: {cur.rowcount:,}행 삭제")
        if "sl_seller_site" in colinfo:
            cur.execute(f"""DELETE FROM {S}.sl_seller_site e WHERE e.seller_site_id IN (SELECT id FROM {MAP}._inserted WHERE tbl='sl_seller_site')
                               AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod p WHERE p.seller_id = e.seller_id AND p.site_id = e.site_id)""")
            print(f"   sl_seller_site: {cur.rowcount:,}행 삭제 (그 사이트에 상품이 남은 판매자의 매핑은 남김)"); total += cur.rowcount
        cur.execute(f"""DELETE FROM {S}.sy_brand b WHERE b.brand_id IN (SELECT new_id FROM {MAP}._map WHERE tbl='sy_brand' AND created)
                           AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod p WHERE p.brand_id = b.brand_id)""")
        print(f"   sy_brand: {cur.rowcount:,}행 삭제 (상품이 쓰고 있는 브랜드는 남김)"); total += cur.rowcount
        cur.execute(f"DROP SCHEMA {MAP} CASCADE")
        conn.commit()
        print(f"[완료] revert: {total:,}행 삭제, 매핑 스키마 {MAP} 삭제 — 커밋했습니다.")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ══════════════════════════ dry / run 공통: 계획 ══════════════════════════════
print(f"[대상] {MODE} — {SRC} → {DST}, 스키마 {S}, 매핑 스키마 {MAP} ({'있음' if map_exists else '없음'})")
print(f"[선행 단계] run_all pre: {'적용됨' if pre_ok else '미적용'} (sy_brand.site_id {'있음' if brand_site else '없음'}, sl_seller_site {'있음' if seller_site else '없음'})"
      f" / 카테고리 매핑(C): {'있음' if cmap_exists else '없음'}")
if map_exists:
    n = q1(f"SELECT count(*) FROM {MAP}._map WHERE tbl='pd_prod'")
    print(f"[적용 여부] 적용됨 — 매핑에 상품 {n}건, {DST} 상품 {dst_prod_cnt}건. run 은 건너뜁니다.")
    if MODE == "run": conn.rollback()
    sys.exit(0)

problems, waits = [], []      # problems = run 을 막는 데이터 문제, waits = 선행 단계 대기
if not pre_ok: waits.append("run_all pre(4-1 게시판·site_id·판매자↔사이트)가 아직 — sy_brand.site_id / sl_seller_site 가 생긴 뒤에 run")
if not cmap_exists: waits.append("카테고리 스크립트(migration_20261004_category_site.py run)가 아직 — 먼저 실행")
sites = {r[0] for r in q(f"SELECT site_id FROM {S}.sy_site")}
if SRC not in sites or DST not in sites: problems.append(f"sy_site 에 {SRC}/{DST} 가 없습니다")
if dst_prod_cnt: problems.append(f"{DST} 에 이미 상품이 {dst_prod_cnt}건 있습니다(매핑 스키마 없음 — 출처를 알 수 없음)")

# 1) 원본 상품과 범위 선택
prods = q(f"""SELECT p.prod_id, p.prod_type_cd, p.prod_status_cd, p.seller_id, p.brand_id, p.category_id, p.prod_code, {VISIBLE} AS visible,
                     (c.category_id IS NOT NULL AND c.site_id = p.site_id) AS cat_ok
                FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id
               WHERE p.site_id = %s ORDER BY p.prod_id""", (SRC,))
P = {r[0]: dict(type=r[1], status=r[2], seller=r[3], brand=r[4], cat=r[5], code=r[6], visible=r[7], cat_ok=r[8]) for r in prods}
src_ids = list(P)
print(f"\n[원본 {SRC}] 상품 {len(P)}건 — 상태 " + ", ".join(f"{k} {v}" for k, v in collections.Counter(p['status'] for p in P.values()).items())
      + " / 유형 " + ", ".join(f"{k} {v}" for k, v in collections.Counter(p['type'] for p in P.values()).items())
      + f" / FO 목록 조건 통과 {sum(1 for p in P.values() if p['visible'])}건")


def child_rows(d, ids):
    """딸린 테이블에서 scope 가 ids 인 행: [(pk, scope, fk값들…)]"""
    t = d["table"]
    if t not in colinfo: return []
    cols = [d["pk"], d["scope"]] + [c for c, _, _ in d["fks"]]
    return q(f'SELECT {", ".join(chr(34) + c + chr(34) for c in cols)} FROM {S}."{t}" WHERE "{d["scope"]}" = ANY(%s) ORDER BY 1', (ids,))


if ALL:
    selected = list(src_ids); core = set(selected)
    reason = f"--all: {SRC} 전부"
else:
    core = {pid for pid, p in P.items() if p["type"] != "OPTION" or p["cat_ok"]}
    for t, c in [("pd_category_prod", "prod_id"), ("pd_prod_content", "prod_id"), ("pd_prod_rel", "prod_id"),
                 ("pd_prod_bundle_item", "bundle_prod_id"), ("pd_prod_set_item", "set_prod_id")]:
        if t in colinfo:
            core |= {r[0] for r in q(f'SELECT DISTINCT "{c}" FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (src_ids,))}
    while True:   # 묶음·세트 구성 상품까지
        add = set()
        for t, c, ic in [("pd_prod_bundle_item", "bundle_prod_id", "item_prod_id"), ("pd_prod_set_item", "set_prod_id", "item_prod_id")]:
            if t in colinfo:
                add |= {r[0] for r in q(f'SELECT DISTINCT "{ic}" FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (list(core),)) if r[0] in P}
        if add <= core: break
        core |= add
    groups = collections.defaultdict(list)
    for pid in src_ids:
        if pid not in core and P[pid]["visible"]:
            groups[(P[pid]["seller"] or "", P[pid]["brand"] or "")].append(pid)
    fill, depth = [], 0
    need = max(0, LIMIT - len(core))
    while len(fill) < need and any(len(v) > depth for v in groups.values()):
        for k in sorted(groups):
            if len(groups[k]) > depth and len(fill) < need:
                fill.append(groups[k][depth])
        depth += 1
    selected = sorted(core | set(fill))
    reason = f"대표 {LIMIT}건 기준: 꼭 넣는 상품 {len(core)}건 + (판매자·브랜드) 고루 채움 {len(fill)}건"
sel = set(selected)
print(f"[복사 범위] {len(selected)}건 — {reason}")
print("   유형 " + ", ".join(f"{k} {v}" for k, v in collections.Counter(P[i]['type'] for i in selected).items())
      + f" · 판매자 {len({P[i]['seller'] for i in selected if P[i]['seller']})}곳(원본 {len({p['seller'] for p in P.values() if p['seller']})}곳)"
      + f" · 브랜드 {len({P[i]['brand'] for i in selected if P[i]['brand']})}개(원본 {len({p['brand'] for p in P.values() if p['brand']})}개)"
      + f" · FO 목록 조건 통과 {sum(1 for i in selected if P[i]['visible'])}건")
if not selected: problems.append("복사할 상품이 없습니다")

# 2) 카테고리·브랜드·판매자
cat_map = dict(q(f"SELECT old_category_id, new_category_id FROM {CMAP}._map WHERE dst_site_id=%s", (DST,))) if cmap_exists else {}
src_cat_ids = {r[0] for r in q(f"SELECT category_id FROM {S}.pd_category WHERE site_id=%s", (SRC,))}
cat_valid = [i for i in selected if P[i]["cat_ok"]]
cat_none = [i for i in selected if not (P[i]["cat"] or "")]
cat_orphan = [i for i in selected if (P[i]["cat"] or "") and not P[i]["cat_ok"]]
print(f"\n[카테고리] 연결된 상품 {len(cat_valid)}건 → 매핑으로 {DST} 카테고리 연결" + ("" if cmap_exists else " (C 실행 뒤)")
      + f" · 카테고리 없음 {len(cat_none)}건 · 없는 카테고리 ID 를 가리킴 {len(cat_orphan)}건 → NULL 로 복사")
if cmap_exists:
    lost = [i for i in cat_valid if P[i]["cat"] not in cat_map]
    if lost: problems.append(f"카테고리 매핑에 없는 원본 카테고리를 쓰는 상품 {len(lost)}건 — 카테고리 스크립트를 다시 run 하세요")

brand_where = "site_id = %s" if brand_site else "TRUE OR %s IS NULL"
src_brands = q(f"SELECT brand_id, brand_code FROM {S}.sy_brand WHERE {brand_where} ORDER BY brand_id", (SRC,))
dst_brand_by_code = dict(q(f"SELECT brand_code, brand_id FROM {S}.sy_brand WHERE site_id = %s", (DST,))) if brand_site else {}
brand_reuse = {b: dst_brand_by_code[c] for b, c in src_brands if c in dst_brand_by_code}
brand_new = [b for b, c in src_brands if c not in dst_brand_by_code]
src_brand_ids = {b for b, _ in src_brands}
brand_orphan = [i for i in selected if (P[i]["brand"] or "") and P[i]["brand"] not in src_brand_ids]
uk_code_only = q("""SELECT indexname FROM pg_indexes WHERE schemaname=%s AND tablename='sy_brand' AND indexdef ~ 'UNIQUE' AND indexdef ~ '\\(brand_code\\)'""", (S,))
if brand_site:
    print(f"[브랜드] {SRC} 브랜드 {len(src_brands)}건 → {DST} 에 새로 {len(brand_new)}건(같은 brand_code), 이미 있어 그대로 쓰는 것 {len(brand_reuse)}건")
    if uk_code_only and brand_new:
        problems.append(f"sy_brand 에 brand_code 전체 유니크({uk_code_only[0][0]})가 남아 있어 같은 코드로 복사할 수 없습니다 — pre(사이트별 유니크 전환)를 확인하세요")
else:
    print(f"[브랜드] (pre 미적용 — sy_brand.site_id 없음) pre 뒤에는 {SRC} 브랜드 약 {len(src_brands)}건을 {DST} 로 복사하고 상품 brand_id 를 복사본으로 바꿉니다. "
          f"지금 상태로는 브랜드를 복사할 수 없어 run 하지 않습니다.")
if brand_orphan:
    print(f"   없는/다른 사이트 브랜드를 가리키는 상품 {len(brand_orphan)}건 → brand_id NULL 로 복사")

sellers = sorted({P[i]["seller"] for i in selected if P[i]["seller"]})
no_seller = sum(1 for i in selected if not P[i]["seller"])
seller_stat = dict(q(f"SELECT seller_id, seller_status_cd FROM {S}.sl_seller WHERE seller_id = ANY(%s)", (sellers,)))
if seller_site:
    have = dict(q(f"SELECT seller_id, seller_site_status_cd FROM {S}.sl_seller_site WHERE site_id=%s AND seller_id = ANY(%s)", (DST, sellers)))
    seller_add = [s for s in sellers if s not in have]
    inactive = [s for s, st in have.items() if (st or "ACTIVE") != "ACTIVE"]
    print(f"[판매자] 복사 상품의 판매자 {len(sellers)}곳(판매자 없는 상품 {no_seller}건) → sl_seller_site({DST}, ACTIVE) 추가 {len(seller_add)}건, 이미 있음 {len(have)}건")
    if inactive: print(f"   (주의) {DST} 매핑이 ACTIVE 가 아닌 판매자 {len(inactive)}곳 — 그대로 둡니다: {inactive}")
else:
    seller_add = list(sellers)
    print(f"[판매자] (pre 미적용 — sl_seller_site 없음) 복사 상품의 판매자 {len(sellers)}곳(판매자 없는 상품 {no_seller}건) → pre 뒤 {DST} ACTIVE 매핑 {len(sellers)}건 추가 예정")
bad_seller = [s for s in sellers if (seller_stat.get(s) or "ACTIVE") != "ACTIVE"]
if bad_seller: print(f"   (주의) 판매자 상태가 ACTIVE 가 아닌 곳 {len(bad_seller)}: {bad_seller}")
print("   참고: FO 상품 목록·상세 쿼리(QPdProdRepositoryImpl)는 판매자·브랜드·카테고리를 LEFT JOIN 만 하므로 노출 조건은 site_id + ACTIVE + 전시기간뿐입니다.")

# 3) 테이블별 복사 계획 + 새 ID
plan = collections.OrderedDict()     # table -> [old_pk]
idmap = {}                           # table -> {old: new}
info = {}                            # table -> 설명(건너뛴 행·NULL 로 바뀌는 참조)
plan["sy_brand"] = brand_new if brand_site else []
idmap["sy_brand"] = dict(zip(plan["sy_brand"], gen_ids("sy_brand", "brand_id", len(plan["sy_brand"]))))
plan["pd_prod"] = selected
idmap["pd_prod"] = dict(zip(selected, gen_ids("pd_prod", "prod_id", len(selected))))
raw = {}
for d in TABLES[1:]:
    t = d["table"]
    if t not in colinfo:
        plan[t], idmap[t], info[t] = [], {}, "테이블 없음"; continue
    rows = child_rows(d, selected); raw[t] = rows
    keep, skipped = [], 0
    for r in rows:
        ok = True
        for k, (col, ref, mode) in enumerate(d["fks"]):
            v = r[2 + k]
            if mode == "req":
                inside = (v in cat_map or (not cmap_exists and v in src_cat_ids)) if ref == "@category" else (v in sel if ref == "pd_prod" else v in idmap.get(ref, {}))
                if not inside: ok = False
        if ok: keep.append(r[0])
        else: skipped += 1
    plan[t] = keep
    idmap[t] = dict(zip(keep, gen_ids(t, d["pk"], len(keep))))
    notes = []
    if skipped: notes.append(f"필수 참조가 범위 밖이라 뺀 행 {skipped}")
    for k, (col, ref, mode) in enumerate(d["fks"]):
        if mode == "null" and ref != "@category":
            nulls = sum(1 for r in rows if r[0] in idmap[t] and (r[2 + k] or "") and r[2 + k] not in (idmap[t] if ref == t else idmap.get(ref, {})))
            if nulls: notes.append(f"{col} 끊긴 참조 {nulls}건 → NULL")
    info[t] = " · ".join(notes)

print(f"\n[복사 계획] {'테이블':<22}{'원본 행':>9}{'복사':>9}  새 ID 범위 / 비고")
tot = 0
for t in plan:
    n = len(plan[t]); tot += n
    src_n = len(src_brands) if t == "sy_brand" else len(P) if t == "pd_prod" else (q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{next(d["scope"] for d in TABLES if d["table"] == t)}" = ANY(%s)', (src_ids,)) if t in colinfo else 0)
    ids = list(idmap[t].values())
    rng = f"{ids[0]} ~ {ids[-1]}" if ids else "-"
    note = next((d["note"] for d in TABLES if d["table"] == t), "브랜드(사이트별 유니크 site_id+brand_code)")
    print(f"   {t:<22}{src_n:>9,}{n:>9,}  {rng}  {note}" + (f" — {info[t]}" if info.get(t) else ""))
print(f"   {'sl_seller_site(추가)':<22}{'':>9}{len(seller_add):>9,}  판매자 ↔ {DST} ACTIVE 매핑")
print(f"   합계 {tot + len(seller_add):,}행 추가")

# 4) 코드 유니크 충돌 점검 (prod_code·sku_code 는 전체 유니크)
new_codes = {i: (P[i]["code"] + CODE_SUFFIX) for i in selected if (P[i]["code"] or "") != ""}
mx = colinfo["pd_prod"].get("prod_code") or 50
too_long = [c for c in new_codes.values() if len(c) > mx]
hit = q(f"SELECT prod_code FROM {S}.pd_prod WHERE prod_code = ANY(%s)", (list(new_codes.values()),))
blank = sum(1 for i in selected if (P[i]["code"] or "") == "")
print(f"\n[코드] prod_code: '{CODE_SUFFIX}' 붙여 {len(new_codes)}건(빈 값 {blank}건은 NULL) — 기존과 충돌 {len(hit)}건, 길이 초과 {len(too_long)}건")
if hit: problems.append(f"prod_code 충돌 {len(hit)}건: {[h[0] for h in hit[:5]]}")
if too_long: problems.append(f"prod_code 길이 초과 {len(too_long)}건")
sku_rows = q(f"SELECT prod_sku_id, prod_id, sku_code FROM {S}.pd_prod_sku WHERE prod_id = ANY(%s)", (selected,))
new_sku_codes, odd = [], 0
for sid, pid, code in sku_rows:
    if code is None: continue
    if code.startswith(pid): new_sku_codes.append(idmap["pd_prod"][pid] + code[len(pid):])
    else: new_sku_codes.append(code + CODE_SUFFIX); odd += 1
dup_in = len(new_sku_codes) - len(set(new_sku_codes))
sku_hit = 0
for k in range(0, len(new_sku_codes), 5000):
    sku_hit += q1(f"SELECT count(*) FROM {S}.pd_prod_sku WHERE sku_code = ANY(%s)", (new_sku_codes[k:k + 5000],))
mx = colinfo["pd_prod_sku"].get("sku_code") or 50
sku_long = sum(1 for c in new_sku_codes if len(c) > mx)
print(f"       sku_code: 원본 상품ID 접두어를 새 상품ID 로 {len(new_sku_codes) - odd:,}건, 그 형식이 아니라 '{CODE_SUFFIX}' 붙임 {odd}건 — 기존과 충돌 {sku_hit}건, 서로 중복 {dup_in}건, 길이 초과 {sku_long}건")
if sku_hit or dup_in or sku_long: problems.append(f"sku_code 충돌 {sku_hit} / 중복 {dup_in} / 길이 초과 {sku_long}")
# 새 ID 충돌(전체 테이블 기준 최종 확인)
for d in [dict(table="sy_brand", pk="brand_id")] + TABLES:
    t = d["table"]; ids = list(idmap.get(t, {}).values())
    for k in range(0, len(ids), 5000):
        n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{d["pk"]}" = ANY(%s)', (ids[k:k + 5000],))
        if n: problems.append(f"{t} 새 ID 가 기존과 {n}건 겹침")
print(f"[새 ID] 기존 ID 와 충돌 {'있음' if any('새 ID' in p for p in problems) else '없음'} (형식: 접두어 + {BASE_TS.strftime('%y%m%d%H%M%S')} + 4자리, 1만 건마다 다음 초)")

# 5) 이미지 URL 종류 (복사는 원본 그대로 — 다음 단계 E 가 사이트 폴더로 옮김)
if "pd_prod_img" in colinfo:
    kinds = q(f"""SELECT CASE WHEN cdn_img_url LIKE 'data:%%' THEN 'data:image(base64)' WHEN cdn_img_url LIKE '%%picsum%%' THEN 'picsum'
                              WHEN coalesce(cdn_img_url, '') = '' THEN '빈 값' ELSE 'CDN 파일' END, count(*), count(DISTINCT cdn_img_url)
                    FROM {S}.pd_prod_img WHERE prod_id = ANY(%s) GROUP BY 1 ORDER BY 2 DESC""", (selected,))
    print("[이미지] URL 원본 그대로 복사 — " + ", ".join(f"{k} {n:,}행(서로 다른 URL {u})" for k, n, u in kinds))
html = q(f"""SELECT count(*) FILTER (WHERE content_html LIKE '%%data:image%%'), count(*) FILTER (WHERE content_html LIKE '%%/api/cdn/%%') FROM {S}.pd_prod WHERE prod_id = ANY(%s)""", (selected,))[0]
chtml = q(f"""SELECT count(*) FILTER (WHERE content_html LIKE '%%data:image%%'), count(*) FILTER (WHERE content_html LIKE '%%/api/cdn/%%') FROM {S}.pd_prod_content WHERE prod_id = ANY(%s)""", (selected,))[0] if "pd_prod_content" in colinfo else (0, 0)
print(f"         본문 HTML 안 이미지: pd_prod.content_html data:image {html[0]}건·CDN 주소 {html[1]}건 / pd_prod_content data:image {chtml[0]}건·CDN 주소 {chtml[1]}건 (그대로 복사)")

# 6) 복사하지 않는 테이블
print("\n[복사하지 않는 테이블] (복사 대상 상품에 딸린 행 수)")
line = []
for t, c, why in NOT_COPIED:
    if not has_col(t, c): continue
    n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (selected,))
    line.append(f"{t} {n:,} — {why}")
for l in line: print("   " + l)
expected_visible = sum(1 for i in selected if P[i]["visible"])
print(f"\n[예상 결과] {DST} 상품 {len(selected)}건, FO 목록 조건(site_id + ACTIVE + 전시기간) 통과 {expected_visible}건")
print(f"[적용 여부] 미적용 — 판별: to_regclass('{MAP}._map') IS NOT NULL")

if problems:
    print("\n[사전점검 실패 — run 은 시작하지 않습니다]"); [print("   !! " + p) for p in problems]
if waits:
    print("\n[선행 단계 대기 — 지금은 run 할 수 없습니다]"); [print("   ·  " + w) for w in waits]
if MODE == "dry":
    print("\n(dry) 읽기 전용 세션 — 아무것도 바꾸지 않았습니다.")
    sys.exit(1 if problems else 0)

# ══════════════════════════════ run ══════════════════════════════════════════
if problems or waits:
    conn.rollback(); print("\n[중단] 아무것도 바꾸지 않았습니다."); sys.exit(1)

L = lambda v: "'" + v.replace("'", "''") + "'"
COMMON = {"site_id": L(DST), "reg_site_id": L(DST), "reg_by": L(MIG), "upd_by": L(MIG), "upd_date": "now()"}
OVERRIDE = {
    "pd_prod": {"prod_code": f"CASE WHEN coalesce(x.prod_code, '') = '' THEN NULL ELSE x.prod_code || {L(CODE_SUFFIX)} END", "view_count": "0"},
    "pd_prod_sku": {"sku_code": f"""CASE WHEN x.sku_code IS NULL THEN NULL
                                         WHEN left(x.sku_code, length(x.prod_id)) = x.prod_id THEN f_prod_id.new_id || substr(x.sku_code, length(x.prod_id) + 1)
                                         ELSE x.sku_code || {L(CODE_SUFFIX)} END""", "sale_count": "0"},
}


def copy_sql(t, pk, scope, fks):
    cols = list(colinfo[t])
    joins = [f"JOIN {MAP}._map m ON m.tbl = {L(t)} AND m.old_id = x.\"{pk}\""]
    expr = dict((c, v) for c, v in COMMON.items() if c in cols)
    expr[pk] = "m.new_id"
    refs = ([(scope, "pd_prod", "req")] if scope else []) + list(fks)
    for col, ref, mode in refs:
        if col not in cols: continue
        a = f"f_{col}"
        if ref == "@category":
            joins.append(f"LEFT JOIN {CMAP}._map {a} ON {a}.old_category_id = x.\"{col}\" AND {a}.dst_site_id = {L(DST)}"); nv = f"{a}.new_category_id"
        else:
            joins.append(f"LEFT JOIN {MAP}._map {a} ON {a}.tbl = {L(ref)} AND {a}.old_id = x.\"{col}\""); nv = f"{a}.new_id"
        expr[col] = f"CASE WHEN coalesce(x.\"{col}\", '') = '' THEN x.\"{col}\" ELSE {nv} END"     # 빈 값은 그대로, 나머지는 복사본 ID(없으면 NULL)
    expr.update({c: v for c, v in OVERRIDE.get(t, {}).items() if c in cols})
    sel_list = ", ".join(expr.get(c, f'x."{c}"') for c in cols)
    return f'INSERT INTO {S}."{t}" ({", ".join(chr(34) + c + chr(34) for c in cols)})\nSELECT {sel_list}\n  FROM {S}."{t}" x\n  ' + "\n  ".join(joins)


try:
    t0 = datetime.datetime.now()
    cur.execute("SET LOCAL lock_timeout = '10s'")
    before = {t: q1(f'SELECT count(*) FROM {S}."{t}"') for t in plan if t in colinfo}
    cur.execute(f"CREATE SCHEMA {MAP}")
    cur.execute(f"""CREATE TABLE {MAP}._map (tbl varchar(40) NOT NULL, old_id varchar(100) NOT NULL, new_id varchar(30) NOT NULL,
                    created boolean NOT NULL DEFAULT true, PRIMARY KEY (tbl, old_id))""")
    cur.execute(f"CREATE UNIQUE INDEX _map_uk_new ON {MAP}._map (tbl, new_id)")
    cur.execute(f"CREATE TABLE {MAP}._inserted (tbl varchar(40) NOT NULL, id varchar(30) NOT NULL, note varchar(200), PRIMARY KEY (tbl, id))")
    cur.execute(f"CREATE TABLE {MAP}._run (run_at timestamp DEFAULT now(), mode varchar(10), note text)")
    rows = [(t, o, n, True) for t, m in idmap.items() for o, n in m.items()] + [("sy_brand", o, n, False) for o, n in brand_reuse.items()]
    psycopg2.extras.execute_values(cur, f"INSERT INTO {MAP}._map (tbl, old_id, new_id, created) VALUES %s", rows, page_size=5000)
    cur.execute(f"ANALYZE {MAP}._map")
    print(f"\n[매핑] {MAP}._map {len(rows):,}행")

    # 브랜드 (같은 brand_code 로 SI260002 에)
    done = {}
    cur.execute(copy_sql("sy_brand", "brand_id", None, []) + " AND m.created"); done["sy_brand"] = cur.rowcount
    for d in TABLES:
        t = d["table"]
        if t not in colinfo: continue
        cur.execute(copy_sql(t, d["pk"], d["scope"], d["fks"])); done[t] = cur.rowcount
    for t, n in done.items():
        print(f"   {t:<22}{n:>9,}행 복사")
    # 판매자 ↔ 사이트
    ss_ids = gen_ids("sl_seller_site", "seller_site_id", len(seller_add))
    ss_cols = [c for c in ("seller_site_id", "seller_id", "site_id", "seller_site_status_cd", "reg_by", "reg_date", "reg_site_id", "upd_by", "upd_date") if has_col("sl_seller_site", c)]
    now = datetime.datetime.now()
    for sid, new_id in zip(seller_add, ss_ids):
        v = dict(seller_site_id=new_id, seller_id=sid, site_id=DST, seller_site_status_cd="ACTIVE", reg_by=MIG, reg_date=now, reg_site_id=DST, upd_by=MIG, upd_date=now)
        cur.execute(f"INSERT INTO {S}.sl_seller_site ({', '.join(ss_cols)}) VALUES ({', '.join(['%s'] * len(ss_cols))})", [v[c] for c in ss_cols])
        cur.execute(f"INSERT INTO {MAP}._inserted (tbl, id, note) VALUES ('sl_seller_site', %s, %s)", (new_id, f"판매자 {sid} ↔ {DST}"))
    print(f"   {'sl_seller_site':<22}{len(seller_add):>9,}행 추가")

    # ── 사후 검증 (하나라도 어긋나면 전체 롤백) ──
    bad = []
    for t in plan:
        if t in colinfo and done.get(t, 0) != len(plan[t]): bad.append(f"{t} 복사 {done.get(t, 0)} ≠ 계획 {len(plan[t])}")
        if t in colinfo and q1(f'SELECT count(*) FROM {S}."{t}"') != before[t] + len(plan[t]): bad.append(f"{t} 전체 행 수가 (이전 + 복사) 와 다름")
    if q1(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id=%s", (SRC,)) != len(P): bad.append(f"{SRC} 상품 수가 바뀜")
    if q1(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id=%s", (DST,)) != len(selected): bad.append(f"{DST} 상품 수 ≠ {len(selected)}")
    checks = []
    for d in TABLES[1:]:
        t, sc = d["table"], d["scope"]
        if t not in colinfo: continue
        mine = f"x.\"{d['pk']}\" IN (SELECT new_id FROM {MAP}._map WHERE tbl = {L(t)})"
        checks.append((f"{t}.{sc} → {DST} 상품",
                       f'SELECT count(*) FROM {S}."{t}" x LEFT JOIN {S}.pd_prod p ON p.prod_id = x."{sc}" WHERE {mine} AND (p.prod_id IS NULL OR p.site_id <> {L(DST)})'))
        if has_col(t, "site_id"):
            checks.append((f"{t}.site_id = {DST}", f'SELECT count(*) FROM {S}."{t}" x WHERE {mine} AND x.site_id IS DISTINCT FROM {L(DST)}'))
        for col, ref, mode in d["fks"]:
            if ref == "pd_prod_opt":
                checks.append((f"{t}.{col} → 같은 상품의 옵션",
                               f'SELECT count(*) FROM {S}."{t}" x LEFT JOIN {S}.pd_prod_opt o ON o.prod_opt_id = x."{col}" WHERE {mine} AND coalesce(x."{col}", \'\') <> \'\' AND (o.prod_opt_id IS NULL OR o.site_id <> {L(DST)}'
                               + (f' OR o.prod_id <> x."{sc}"' if t != "pd_prod_opt" else "") + ")"))
            elif ref in ("pd_prod", "pd_prod_sku"):
                rp = "prod_id" if ref == "pd_prod" else "prod_sku_id"
                checks.append((f"{t}.{col} → {DST} {ref}",
                               f'SELECT count(*) FROM {S}."{t}" x LEFT JOIN {S}."{ref}" r ON r."{rp}" = x."{col}" WHERE {mine} AND coalesce(x."{col}", \'\') <> \'\' AND (r."{rp}" IS NULL OR r.site_id <> {L(DST)})'))
            elif ref == "@category":
                checks.append((f"{t}.{col} → {DST} 카테고리",
                               f'SELECT count(*) FROM {S}."{t}" x LEFT JOIN {S}.pd_category c ON c.category_id = x."{col}" WHERE {mine} AND (c.category_id IS NULL OR c.site_id <> {L(DST)})'))
    checks += [
        (f"pd_prod.category_id → {DST} 카테고리", f"SELECT count(*) FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id WHERE p.site_id = {L(DST)} AND coalesce(p.category_id, '') <> '' AND (c.category_id IS NULL OR c.site_id <> {L(DST)})"),
        (f"pd_prod.brand_id → {DST} 브랜드", f"SELECT count(*) FROM {S}.pd_prod p LEFT JOIN {S}.sy_brand b ON b.brand_id = p.brand_id WHERE p.site_id = {L(DST)} AND coalesce(p.brand_id, '') <> '' AND (b.brand_id IS NULL OR b.site_id <> {L(DST)})"),
        (f"pd_prod.seller_id → sl_seller_site({DST}) 매핑", f"SELECT count(*) FROM {S}.pd_prod p WHERE p.site_id = {L(DST)} AND p.seller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site e WHERE e.seller_id = p.seller_id AND e.site_id = p.site_id)"),
        ("복사본이 원본 ID 를 가리키지 않음(옵션)", f"SELECT count(*) FROM {S}.pd_prod_sku x WHERE x.site_id = {L(DST)} AND (x.prod_opt1_id IN (SELECT old_id FROM {MAP}._map WHERE tbl='pd_prod_opt') OR x.prod_opt2_id IN (SELECT old_id FROM {MAP}._map WHERE tbl='pd_prod_opt'))"),
    ]
    for name, sql in checks:
        n = q1(sql)
        if n: bad.append(f"{name}: 고아 {n}건")
    cat_linked = q1(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id=%s AND coalesce(category_id, '') <> ''", (DST,))
    if cat_linked != len(cat_valid): bad.append(f"카테고리 연결 상품 {cat_linked} ≠ 계획 {len(cat_valid)}")
    vis = q1(f"SELECT count(*) FROM {S}.pd_prod p WHERE p.site_id=%s AND {VISIBLE}", (DST,))
    if vis != expected_visible: bad.append(f"FO 목록 조건 통과 {vis} ≠ 예상 {expected_visible}")
    if bad:
        raise RuntimeError("사후 검증 실패 — " + " / ".join(bad))
    cur.execute(f"INSERT INTO {MAP}._run (mode, note) VALUES ('run', %s)",
                (f"범위 {'전체' if ALL else LIMIT}: 상품 {len(selected)}건, " + ", ".join(f"{t} {n}" for t, n in done.items()) + f", sl_seller_site {len(seller_add)}",))
    conn.commit()
    print(f"[검증] 행 수 일치 · 참조 고아 0 ({len(checks)}개 점검) · 카테고리 연결 {cat_linked}건 · {DST} FO 목록 조건 통과 {vis}건")
    print(f"\n[완료] run — 커밋했습니다 ({(datetime.datetime.now() - t0).seconds}초). 매핑: {MAP}._map")
    print("   다음: E 단계(CDN 폴더 — pd_prod_img.site_id / pd_prod.site_id 기준). ecBeBo 재기동은 필요 없습니다(캐시 대상 아님 — 상품 목록 캐시를 쓰면 만료를 기다리거나 비우세요).")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다(매핑 스키마 포함): {e}")
    sys.exit(1)
