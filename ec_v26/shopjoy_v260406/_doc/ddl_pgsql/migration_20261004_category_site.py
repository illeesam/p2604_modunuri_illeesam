# -*- coding: utf-8 -*-
r"""
migration_20261004_category_site.py — 사이트별 카테고리 정비 (2026-10-04, 멀티테넌트 데이터 정비 C)

  하는 일 (run — 한 트랜잭션, 하나라도 실패하면 전체 롤백)
    1) SI260001(ec1) 카테고리 구조 점검: 깊이·부모 관계·고아·정렬·같은 부모 아래 이름 중복 → 출력
       (부모가 없는 고아/순환이 있으면 복사를 시작하지 않는다)
    2) SI260002(ec2): ec1 과 같은 구조로 복사 — 새 ID(CmUtil.generateId 규칙: CA + yyMMddHHmmss + 4자리), 부모는 매핑으로 바꿔 연결.
       원본 추적: 매핑 스키마 shopjoy_2604_map_category_20261004._map (src_site_id, old_category_id, dst_site_id, new_category_id)
       이미 매핑된 원본은 건너뛴다(멱등 — ec1 에 새 카테고리가 생겼으면 그것만 더 복사).
    3) SI260003(당무마켓): 당근형 분류 보강 — 이름이 같은 것(1레벨)은 그대로 두고 없는 것만 추가.
       기존 행은 건드리지 않는다(상품의 category_id 연결 유지). '가공식품' 은 기존 '식품' 이 있으면 같은 것으로 보고 건너뜀.
       '의류' 아래에는 2레벨 '여성의류'·'남성의류' 를 더한다(danmoo1 화면은 1레벨만 보여 주므로 화면 변화 없음 — 세분류 준비용).
    4) SI260004~SI260006: 상품이 없으므로 카테고리 불필요 — 건수만 확인해 출력.
    5) 검증: ec2 건수 = ec1 건수, 부모·깊이·이름·정렬이 원본과 같음, 사이트 밖 부모 없음, SI260003 기존 행·상품 연결 그대로.

  컬럼은 실행 시점에 information_schema 로 읽어 있는 것만 복사한다(대기 마이그레이션으로 컬럼이 늘어도 그대로 동작).
  정책: reg_site_id 는 감사 필드(등록 사이트) — 사이트 조건은 site_id 로만 본다.

  적용 여부 판별(실행기 check 용)
    적용됨 = 매핑 테이블 존재  AND  SI260001 카테고리 중 매핑 안 된 것 0건  AND  SI260003 보강 대상 0건
      SELECT to_regclass('shopjoy_2604_map_category_20261004._map') IS NOT NULL;
      SELECT count(*) FROM shopjoy_2604.pd_category WHERE site_id = 'SI260002';          -- > 0
    `status` 모드가 같은 기준으로 '적용됨/미적용/일부만' 을 한 줄로 출력한다(종료코드 0=적용됨, 3=미적용·일부).

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261004_category_site.py dry      # 읽기 전용 세션, SELECT 만 — 계획 출력
     python migration_20261004_category_site.py status   # 읽기 전용 — 적용 여부 한 줄
     python migration_20261004_category_site.py run      # 적용(이미 적용이면 건너뜀)
     python migration_20261004_category_site.py revert   # 매핑·추가 기록 기준으로 삭제(상품이 물고 있으면 중단 — ec2 상품 복사를 먼저 revert)
   PowerShell: $env:DB_PASSWORD='…'; python C:\…\migration_20261004_category_site.py dry
  실행 순서: run_all pre(사이트 정비·site_id 추가) → 이 스크립트 run → migration_20261004_ec2_prod_copy.py run
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
MAP = "shopjoy_2604_map_category_20261004"
MIG = "MIGRATION_20261004"
SRC, DST, DM = "SI260001", "SI260002", "SI260003"
NO_CATEGORY_SITES = ["SI260004", "SI260005", "SI260006"]
USAGE = "사용법: python migration_20261004_category_site.py dry|status|run|revert"

# 당근형 분류(1레벨). (이름, 같은 것으로 보는 기존 이름들)
DM_WANT = [("디지털기기", []), ("생활가전", []), ("가구/인테리어", []), ("생활/주방", []), ("유아동", []),
           ("의류", []), ("가방/잡화", []), ("신발", []), ("뷰티/미용", []), ("스포츠/레저", []),
           ("취미/게임/음반", []), ("도서", []), ("티켓/교환권", []), ("가공식품", ["식품"]),
           ("반려동물용품", []), ("식물", []), ("기타", [])]
DM_LAST = "기타"                       # 항상 맨 뒤(정렬 99)
DM_CHILDREN = {"의류": ["여성의류", "남성의류"]}   # 2레벨 세분류

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "status", "run", "revert") or len(sys.argv) > 2:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261004_category_site")
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


def gen_ids(prefix, n, used, base):
    """CmUtil.generateId 형식: 접두어 + yyMMddHHmmss + 4자리. 같은 초 안에서 0000~9999 순번, 넘치면 다음 초."""
    out, seq, t = [], 0, base
    while len(out) < n:
        if seq >= 10000:
            t, seq = t + datetime.timedelta(seconds=1), 0
        cid = f"{prefix}{t.strftime('%y%m%d%H%M%S')}{seq:04d}"
        seq += 1
        if cid not in used:
            used.add(cid); out.append(cid)
    return out


# ── 현재 상태 읽기 ───────────────────────────────────────────────────────────
COLS = [r[0] for r in q("SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name='pd_category' ORDER BY ordinal_position", (S,))]
if "site_id" not in COLS:
    sys.exit("pd_category.site_id 컬럼이 없습니다 — 사이트 분리 마이그레이션을 먼저 적용하세요.")
sites = {r[0] for r in q(f"SELECT site_id FROM {S}.sy_site")}
for need in (SRC, DST, DM):
    if need not in sites:
        sys.exit(f"sy_site 에 {need} 가 없습니다 — 사이트 ID 정비(sitefix)를 먼저 실행하세요.")


def load(site):
    cur.execute(f'SELECT {", ".join(chr(34) + c + chr(34) for c in COLS)} FROM {S}.pd_category WHERE site_id=%s ORDER BY category_depth NULLS FIRST, sort_ord, category_id', (site,))
    return [dict(zip(COLS, r)) for r in cur.fetchall()]


src_rows, dst_rows, dm_rows = load(SRC), load(DST), load(DM)
all_ids = {r[0] for r in q(f"SELECT category_id FROM {S}.pd_category")}
map_exists = has_table(MAP, "_map")
mapped = dict(q(f"SELECT old_category_id, new_category_id FROM {MAP}._map WHERE src_site_id=%s AND dst_site_id=%s", (SRC, DST))) if map_exists else {}
inserted = q(f"SELECT category_id, site_id, kind FROM {MAP}._inserted") if map_exists and has_table(MAP, "_inserted") else []


def structure_report(rows, site):
    """구조 점검 — (문제 목록, 치명 문제 목록)"""
    by_id = {r["category_id"]: r for r in rows}
    warn, fatal = [], []
    depth_cnt = collections.Counter(r["category_depth"] for r in rows)
    print(f"[{site} 구조] 전체 {len(rows)}건 — 깊이별 " + ", ".join(f"{d}레벨 {n}건" for d, n in sorted(depth_cnt.items(), key=lambda x: (x[0] is None, x[0]))))
    kids = collections.defaultdict(list)
    for r in rows:
        p = r["parent_category_id"]
        if p in (None, ""):
            if r["category_depth"] != 1:
                warn.append(f"부모가 없는데 깊이가 1이 아님: {r['category_id']} {r['category_nm']} (깊이 {r['category_depth']})")
            kids[None].append(r)
        elif p not in by_id:
            where = "다른 사이트" if p in all_ids else "없는 ID"
            fatal.append(f"고아(부모가 {where}): {r['category_id']} {r['category_nm']} → 부모 {p}")
        else:
            if r["category_depth"] != (by_id[p]["category_depth"] or 0) + 1:
                warn.append(f"깊이 불일치: {r['category_id']} {r['category_nm']} 깊이 {r['category_depth']} / 부모 {p} 깊이 {by_id[p]['category_depth']}")
            kids[p].append(r)
    for r in rows:  # 순환
        seen, p = {r["category_id"]}, r["parent_category_id"]
        while p not in (None, "") and p in by_id:
            if p in seen:
                fatal.append(f"부모 관계 순환: {r['category_id']}"); break
            seen.add(p); p = by_id[p]["parent_category_id"]
    for p, lst in kids.items():
        names = collections.Counter(x["category_nm"] for x in lst)
        for nm, n in names.items():
            if n > 1:
                warn.append(f"같은 부모({p or '최상위'}) 아래 이름 중복: {nm} {n}건")
        sorts = collections.Counter(x["sort_ord"] for x in lst)
        dup = sorted(str(s) for s, n in sorts.items() if n > 1)
        if dup:
            warn.append(f"같은 부모({p or '최상위'}) 아래 정렬순서 중복: {', '.join(dup)}")
    inactive = [r for r in rows if (r.get("category_status_cd") or "ACTIVE") != "ACTIVE"]
    leaf = sum(1 for r in rows if r["category_id"] not in kids)
    print(f"   최상위 {len(kids[None])}건 · 말단 {leaf}건 · 사용 안 함 {len(inactive)}건 · 고아/순환 {len(fatal)}건 · 주의 {len(warn)}건")
    for m in fatal: print("   !! " + m)
    for m in warn: print("   ·  " + m)
    return warn, fatal


def plan_dm():
    """SI260003 보강 계획 — [(이름, 부모이름 or None, 깊이, 정렬)]"""
    lvl1 = {r["category_nm"]: r for r in dm_rows if r["category_depth"] == 1}
    plan, skipped = [], []
    next_sort = max([r["sort_ord"] or 0 for r in dm_rows if r["category_depth"] == 1 and r["category_nm"] != DM_LAST] + [0]) + 1
    for nm, alias in DM_WANT:
        hit = next((a for a in [nm] + alias if a in lvl1), None)
        if hit:
            if hit != nm: skipped.append(f"{nm}(기존 '{hit}' 로 대신함)")
            continue
        if nm == DM_LAST:
            plan.append((nm, None, 1, 99))
        else:
            plan.append((nm, None, 1, next_sort)); next_sort += 1
    for parent, children in DM_CHILDREN.items():
        have = {r["category_nm"] for r in dm_rows if r["category_depth"] == 2 and lvl1.get(parent) and r["parent_category_id"] == lvl1[parent]["category_id"]}
        for i, ch in enumerate(children, 1):
            if ch not in have and (parent in lvl1 or any(p[0] == parent for p in plan)):
                plan.append((ch, parent, 2, i))
    return plan, skipped


def dm_prod_links():
    return q(f"""SELECT count(*), count(*) FILTER (WHERE p.category_id IS NOT NULL AND p.category_id <> '' AND c.category_id IS NULL),
                        count(*) FILTER (WHERE c.site_id IS NOT NULL AND c.site_id <> p.site_id)
                   FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id WHERE p.site_id=%s""", (DM,))[0]


todo_src = [r for r in src_rows if r["category_id"] not in mapped]
dm_plan, dm_skipped = plan_dm()
dst_unknown = [r for r in dst_rows if r["category_id"] not in set(mapped.values())]
applied = map_exists and not todo_src and not dm_plan and len(dst_rows) > 0

# ── status ───────────────────────────────────────────────────────────────────
if MODE == "status":
    if applied:
        print(f"[상태] 적용됨 — {DST} 카테고리 {len(dst_rows)}건(매핑 {len(mapped)}건), {DM} {len(dm_rows)}건"); sys.exit(0)
    part = map_exists or dst_rows
    print(f"[상태] {'일부만 적용' if part else '미적용'} — 매핑 테이블 {'있음' if map_exists else '없음'}, {DST} {len(dst_rows)}건, "
          f"복사 남은 것 {len(todo_src)}건, {DM} 보강 남은 것 {len(dm_plan)}건")
    sys.exit(3)

# ── revert ───────────────────────────────────────────────────────────────────
if MODE == "revert":
    if not map_exists:
        sys.exit(f"매핑 {MAP}._map 이 없습니다 — run 을 한 적이 없습니다.")
    ids = [r[0] for r in inserted]
    print(f"[되돌리기] 이 스크립트가 넣은 카테고리 {len(ids)}건 삭제 예정 ({', '.join(f'{k} {n}건' for k, n in collections.Counter(r[2] for r in inserted).items())})")
    used = []
    for t, c in q("""SELECT c.table_name, c.column_name FROM information_schema.columns c
                       JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                      WHERE c.table_schema=%s AND c.column_name ~ '^category_id' AND c.table_name NOT LIKE 'zz%%' AND c.table_name <> 'pd_category'""", (S,)):
        n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (ids,))
        if n: used.append(f"{t}.{c} {n}행")
    if used:
        conn.rollback()
        sys.exit("[중단] 넣은 카테고리를 쓰는 데이터가 있습니다 — 먼저 그쪽을 되돌리세요(ec2 상품 복사 revert 등): " + ", ".join(used))
    try:
        cur.execute(f"DELETE FROM {S}.pd_category WHERE category_id = ANY(%s)", (ids,))
        deleted = cur.rowcount
        if deleted != len(ids):
            print(f"   (참고) 기록 {len(ids)}건 중 실제 삭제 {deleted}건 — 나머지는 이미 없던 행")
        cur.execute(f"DROP SCHEMA {MAP} CASCADE")
        conn.commit()
        print(f"[완료] revert: 카테고리 {deleted}건 삭제, 매핑 스키마 {MAP} 삭제 — 커밋했습니다.")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ── dry / run 공통: 점검·계획 출력 ───────────────────────────────────────────
print(f"[대상] {MODE} — 스키마 {S}, 매핑 스키마 {MAP} ({'있음' if map_exists else '없음'})")
print(f"[pd_category 컬럼] {len(COLS)}개 (실행 시점 기준으로 있는 컬럼만 복사): {', '.join(COLS)}")
warn, fatal = structure_report(src_rows, SRC)
print(f"[{DST}] 현재 {len(dst_rows)}건 · 매핑 {len(mapped)}건 → 복사할 것 {len(todo_src)}건")
if dst_unknown:
    print(f"   !! 매핑에 없는 기존 카테고리 {len(dst_unknown)}건: " + ", ".join(f"{r['category_id']} {r['category_nm']}" for r in dst_unknown[:10]))
print(f"[{DM}] 현재 {len(dm_rows)}건 (1레벨: {', '.join(r['category_nm'] for r in dm_rows if r['category_depth'] == 1)})")
if dm_skipped:
    print("   건너뜀: " + ", ".join(dm_skipped))
print(f"   추가할 것 {len(dm_plan)}건: " + (", ".join(f"{nm}({str(d)}레벨{'·' + p if p else ''}, 정렬 {s})" for nm, p, d, s in dm_plan) or "없음"))
dm_links_before = dm_prod_links()
print(f"   상품 {dm_links_before[0]}건 · 카테고리 연결이 깨진 상품 {dm_links_before[1]}건 · 다른 사이트 카테고리를 가리키는 상품 {dm_links_before[2]}건 (기존 행은 건드리지 않음)")
for site in NO_CATEGORY_SITES:
    np_ = q1(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id=%s", (site,)); nc = q1(f"SELECT count(*) FROM {S}.pd_category WHERE site_id=%s", (site,))
    print(f"[{site}] 상품 {np_}건 · 카테고리 {nc}건 → " + ("카테고리 불필요(확인만)" if np_ == 0 and nc == 0 else "확인 필요 — 이 스크립트는 건드리지 않음"))
# 참고: 카테고리를 가리키는 상품의 연결 상태(ec1) — 복사 대상은 아니지만 ec2 상품 복사(D)에 영향
ec1_links = q(f"""SELECT count(*), count(*) FILTER (WHERE coalesce(p.category_id,'') = ''), count(*) FILTER (WHERE coalesce(p.category_id,'') <> '' AND c.category_id IS NULL)
                    FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id WHERE p.site_id=%s""", (SRC,))[0]
print(f"[참고 {SRC} 상품] {ec1_links[0]}건 중 카테고리 없음 {ec1_links[1]}건 · 없는 카테고리 ID 를 가리킴 {ec1_links[2]}건")

problems = list(fatal)
if dst_unknown and not map_exists:
    problems.append(f"{DST} 에 출처를 모르는 카테고리가 {len(dst_unknown)}건 있습니다(매핑 없음)")

# 새 ID 계획
base = datetime.datetime.now().replace(microsecond=0)
used_ids = set(all_ids)
new_copy = gen_ids("CA", len(todo_src), used_ids, base)
new_dm = gen_ids("CA", len(dm_plan), used_ids, base)
id_map = dict(mapped); id_map.update({r["category_id"]: n for r, n in zip(todo_src, new_copy)})
if todo_src:
    print(f"[새 ID] {DST} 복사: {new_copy[0]} ~ {new_copy[-1]}" + (f" / {DM} 추가: {new_dm[0]} ~ {new_dm[-1]}" if new_dm else ""))
print(f"[적용 여부] {'적용됨 — run 은 건너뜀' if applied else '미적용(또는 일부) — run 대상'}")

if MODE == "dry":
    if problems:
        print("\n[사전점검 실패 — run 은 시작하지 않습니다]"); [print("   !! " + p) for p in problems]
        sys.exit(1)
    print("\n(dry) 읽기 전용 세션 — 아무것도 바꾸지 않았습니다. 적용하려면 run")
    sys.exit(0)

# ── run ──────────────────────────────────────────────────────────────────────
if applied:
    print("\n[건너뜀] 이미 적용돼 있습니다."); conn.rollback(); sys.exit(0)
if problems:
    conn.rollback(); print("\n[중단] 사전점검 실패:"); [print("   !! " + p) for p in problems]; sys.exit(1)


def build(row, **over):
    r = dict(row); r.update(over)
    for c, v in (("reg_by", MIG), ("upd_by", MIG)):
        if c in COLS: r[c] = v
    now = datetime.datetime.now()
    for c in ("reg_date", "upd_date"):
        if c in COLS: r[c] = now
    return [r.get(c) for c in COLS]


try:
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {MAP}")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {MAP}._map (src_site_id varchar(21) NOT NULL, old_category_id varchar(21) NOT NULL,
                    dst_site_id varchar(21) NOT NULL, new_category_id varchar(21) NOT NULL PRIMARY KEY, reg_date timestamp DEFAULT now(),
                    UNIQUE (dst_site_id, old_category_id))""")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {MAP}._inserted (category_id varchar(21) PRIMARY KEY, site_id varchar(21), kind varchar(10), note varchar(200), reg_date timestamp DEFAULT now())")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {MAP}._run (run_at timestamp DEFAULT now(), mode varchar(10), note text)")
    ins_sql = f'INSERT INTO {S}.pd_category ({", ".join(chr(34) + c + chr(34) for c in COLS)}) VALUES %s'
    # 2) ec2 복사
    rows = []
    for r, new_id in zip(todo_src, new_copy):
        p = r["parent_category_id"]
        over = dict(category_id=new_id, parent_category_id=(id_map[p] if p not in (None, "") else p), site_id=DST)
        if "reg_site_id" in COLS: over["reg_site_id"] = DST     # 감사 필드 — 이 행을 등록한 사이트
        rows.append(build(r, **over))
    if rows:
        psycopg2.extras.execute_values(cur, ins_sql, rows, page_size=500)
        psycopg2.extras.execute_values(cur, f"INSERT INTO {MAP}._map (src_site_id, old_category_id, dst_site_id, new_category_id) VALUES %s",
                                       [(SRC, r["category_id"], DST, n) for r, n in zip(todo_src, new_copy)])
        psycopg2.extras.execute_values(cur, f"INSERT INTO {MAP}._inserted (category_id, site_id, kind, note) VALUES %s",
                                       [(n, DST, "copy", f"{SRC} {r['category_id']} 복사") for r, n in zip(todo_src, new_copy)])
    print(f"[{DST}] 카테고리 {len(rows)}건 복사")
    # 3) 당무마켓 보강
    tmpl = dm_rows[0] if dm_rows else src_rows[0]
    name_to_id = {r["category_nm"]: r["category_id"] for r in dm_rows if r["category_depth"] == 1}
    rows = []
    for (nm, parent, depth, sort), new_id in zip(dm_plan, new_dm):
        if depth == 1: name_to_id[nm] = new_id
        blank = {c: None for c in COLS}
        over = dict(blank, category_id=new_id, parent_category_id=(name_to_id[parent] if parent else None), category_nm=nm,
                    category_depth=depth, sort_ord=sort, site_id=DM)
        if "category_status_cd" in COLS: over["category_status_cd"] = "ACTIVE"
        if "category_desc" in COLS: over["category_desc"] = f"{nm} 중고거래" if depth == 1 else f"{parent} > {nm}"
        if "reg_site_id" in COLS: over["reg_site_id"] = DM
        rows.append(build(tmpl, **over))
    if rows:
        psycopg2.extras.execute_values(cur, ins_sql, rows, page_size=500)
        psycopg2.extras.execute_values(cur, f"INSERT INTO {MAP}._inserted (category_id, site_id, kind, note) VALUES %s",
                                       [(n, DM, "add", f"당근형 분류 보강: {nm}") for (nm, *_), n in zip(dm_plan, new_dm)])
    print(f"[{DM}] 카테고리 {len(rows)}건 추가")
    cur.execute(f"INSERT INTO {MAP}._run (mode, note) VALUES ('run', %s)", (f"{DST} 복사 {len(todo_src)}건, {DM} 추가 {len(dm_plan)}건",))

    # 5) 검증
    bad = []
    n_src = q1(f"SELECT count(*) FROM {S}.pd_category WHERE site_id=%s", (SRC,)); n_dst = q1(f"SELECT count(*) FROM {S}.pd_category WHERE site_id=%s", (DST,))
    if n_src != n_dst or n_src != len(src_rows): bad.append(f"건수 불일치: {SRC} {n_src} / {DST} {n_dst}")
    diff = q1(f"""SELECT count(*) FROM {MAP}._map m JOIN {S}.pd_category o ON o.category_id = m.old_category_id
                    LEFT JOIN {S}.pd_category n ON n.category_id = m.new_category_id
                    LEFT JOIN {MAP}._map pm ON pm.old_category_id = o.parent_category_id AND pm.dst_site_id = m.dst_site_id
                   WHERE m.dst_site_id = %s AND (n.category_id IS NULL OR n.site_id <> %s OR n.category_nm <> o.category_nm
                         OR n.category_depth IS DISTINCT FROM o.category_depth OR n.sort_ord IS DISTINCT FROM o.sort_ord
                         OR coalesce(n.parent_category_id, '') <> coalesce(pm.new_category_id, ''))""", (DST, DST))
    if diff: bad.append(f"원본과 구조가 다른 복사본 {diff}건")
    cross = q1(f"""SELECT count(*) FROM {S}.pd_category c LEFT JOIN {S}.pd_category p ON p.category_id = c.parent_category_id
                    WHERE c.site_id IN (%s, %s) AND coalesce(c.parent_category_id, '') <> '' AND (p.category_id IS NULL OR p.site_id <> c.site_id)""", (DST, DM))
    if cross: bad.append(f"부모가 없거나 다른 사이트인 카테고리 {cross}건")
    kept = q1(f"SELECT count(*) FROM {S}.pd_category WHERE category_id = ANY(%s)", ([r["category_id"] for r in dm_rows],))
    if kept != len(dm_rows): bad.append(f"{DM} 기존 카테고리 {len(dm_rows)}건 중 {kept}건만 남음")
    if dm_prod_links() != dm_links_before: bad.append(f"{DM} 상품의 카테고리 연결 상태가 바뀜: {dm_links_before} → {dm_prod_links()}")
    dm_names = {r[0] for r in q(f"SELECT category_nm FROM {S}.pd_category WHERE site_id=%s AND category_depth=1", (DM,))}
    miss = [nm for nm, alias in DM_WANT if not ({nm, *alias} & dm_names)]
    if miss: bad.append(f"{DM} 에 아직 없는 분류: {miss}")
    if bad:
        raise RuntimeError("검증 실패 — " + " / ".join(bad))
    conn.commit()
    print(f"[검증] {SRC} {n_src}건 = {DST} {n_dst}건 · 구조 같음 · 사이트 밖 부모 0 · {DM} 기존 {kept}건 유지·상품 연결 그대로")
    print(f"\n[완료] run — 커밋했습니다. 매핑: {MAP}._map / 넣은 행: {MAP}._inserted")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
