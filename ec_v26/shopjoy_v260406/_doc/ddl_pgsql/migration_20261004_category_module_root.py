# -*- coding: utf-8 -*-
r"""
migration_20261004_category_module_root.py — 카테고리 트리의 최상위(루트) = 모듈 (2026-10-04, 멀티테넌트 데이터 정비 C-2 / 실행기 10-2 단계)

  규칙: 사이트마다 카테고리 트리의 루트는 그 사이트의 모듈 이름 노드 1개(ec1 / ec2 / danmoo1 / homepg1 / datavisual1 / bbm1).
        기존 1단계 카테고리는 루트의 자식으로 내려가고(깊이 +1), 갈 곳 없는 상품은 루트에 연결한다(루트 = "미분류·모듈 전체").
        어느 카테고리가 루트인지는 **sy_site.root_category_id** 가 가리킨다(카테고리 쪽 표식으로 추측하지 않는다).

  하는 일 (run — 한 트랜잭션, 하나라도 실패하면 전체 롤백)
    1) sy_site.root_category_id varchar(21) NULL 컬럼 추가(없을 때만) + 주석
    2) 모듈이 지정된 사이트마다 루트 카테고리 1개: 이름 = 모듈 코드, 부모 없음, 깊이 1, 정렬 0, ACTIVE,
       ID = CmUtil.generateId 규칙(CA + yyMMddHHmmss + 4자리). 이미 있으면(root_category_id 가 가리키거나, 부모 없는 카테고리 이름 = 모듈) 그대로 쓴다.
       상품이 없는 사이트(homepg1·datavisual1·bbm1)도 루트만 만든다. sy_site.root_category_id 를 채운다.
    3) 그 사이트의 부모 없는 다른 카테고리 → 부모 = 루트, 사이트 전체 깊이 = 부모 깊이 + 1 로 다시 계산(전부 한 단계씩 내려감).
       pd_category 에는 경로 컬럼이 없다(부모·깊이·정렬뿐) — 실행 시점에 컬럼을 읽어 확인한다.
    4) 갈 곳 없는 상품(category_id 가 비었거나, 없는 카테고리·다른 사이트 카테고리를 가리킴):
       · 상품명 꼬리표 "[분류]" 가 그 사이트의 기존 카테고리에 확실히 맞으면 그 카테고리로 자동 배정
           규칙 A: 꼬리표(동의어 포함) = 카테고리명이 딱 1개 → 그 카테고리
           규칙 B: 같은 이름의 카테고리가 여러 곳(여성/남성 등) → 그 카테고리들의 공통 상위 분류(없으면 루트)
           규칙 C: 소속이 분명한 꼬리표(로퍼·샌들 → 신발, 캐리어 → 가방, 벨트 → 액세서리 …) → 그 대분류
       · 나머지는 루트에 연결. 상품명 뒷부분은 쓰지 않는다(시뮬레이션 데이터라 "[구두] 플랫폼 스니커즈 1524" 처럼 꼬리표와 무관하게 섞여 있음).
       pd_category_prod 에 없는 카테고리를 가리키는 행이 있으면 같이 루트로 옮긴다(유니크 충돌이면 그대로 두고 알림).
    5) 10단계 카테고리 매핑(shopjoy_2604_map_category_20261004._map)에 SI260001 루트 → SI260002 루트 를 추가
       → 11단계(ec2 상품 복사)가 루트에 달린 상품을 SI260002 루트로 연결한다.
    6) 검증: 사이트당 부모 없는 카테고리 = 루트 1개 = sy_site.root_category_id, 깊이 = 부모 + 1, 사이트 밖·없는 부모 0,
       모듈 사이트 상품 중 갈 곳 없는 것 0, 카테고리 수 = 이전 + 새 루트 수.

  순서: 10단계(migration_20261004_category_site.py run) 뒤, 11단계(migration_20261004_ec2_prod_copy.py run) 앞.
        새 백엔드(SySite.rootCategoryId)는 이 컬럼이 있어야 뜨므로 반드시 배포 "전"(pre)에 실행한다.
        10단계가 아직이면 run 은 시작하지 않는다(SI260002 복사본·SI260003 보강분이 생긴 뒤에 내려야 하므로). dry 는 지금 상태 기준 숫자를 보여 준다.

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_catroot_20261004
     _root(만든/쓴 루트) · _cat(바꾼 카테고리의 이전 부모·깊이) · _prod(옮긴 상품의 이전 category_id·규칙) · _catprod · _site(이전 root_category_id) · _mapadd · _run
     revert = 상품 → 이전 값, 카테고리 부모·깊이 → 이전 값, 매핑 행 삭제, root_category_id 비움, 이 스크립트가 만든 루트 삭제, 백업 스키마 삭제.
              (그 뒤에 값이 또 바뀐 행은 건드리지 않는다. 루트를 쓰는 데이터가 남아 있으면 중단 — ec2 상품 복사를 먼저 revert.)
              컬럼 sy_site.root_category_id 는 남겨 둔다(새 백엔드가 읽는다).
  다시 실행해도 안전: 이미 된 것은 건너뛰고 남은 것만 한다(새 사이트에 모듈을 지정한 뒤 다시 run 하면 그 사이트만 처리).

  적용 여부(status — 종료코드 0=적용됨, 3=미적용·일부)
     적용됨 = 컬럼 있음 AND 모듈 사이트마다 root_category_id 가 그 사이트의 유일한 부모 없는 카테고리 AND 갈 곳 없는 상품 0 AND (10단계 매핑이 있으면) 루트 매핑 있음

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261004_category_module_root.py dry      # 읽기 전용 세션, SELECT 만 — 계획·건수 표·표본 20건
     python migration_20261004_category_module_root.py status
     python migration_20261004_category_module_root.py run
     python migration_20261004_category_module_root.py revert
"""
import os, sys, re, datetime, collections
import psycopg2, psycopg2.extras

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_catroot_20261004"
CMAP = "shopjoy_2604_map_category_20261004"     # 10단계(migration_20261004_category_site.py)가 만든 카테고리 매핑
MIG = "MIGRATION_20261004"
SRC, DST = "SI260001", "SI260002"
ROOT_DESC = "모듈 루트 — 이 사이트 카테고리 트리의 최상위(미분류·모듈 전체). 이름 변경·삭제·이동 불가"
USAGE = "사용법: python migration_20261004_category_module_root.py dry|status|run|revert"

# ── 상품명 꼬리표 → 카테고리 (키워드 사전) ────────────────────────────────────
# 동의어: 꼬리표 → 카테고리명 (규칙 A/B 에 쓴다). 사전에 없는 꼬리표는 꼬리표 그대로 카테고리명과 비교한다.
TAG_SYNONYM = {"스니커즈": "운동화", "러닝화": "운동화", "서류가방": "비즈니스백", "수트셋업": "정장세트", "정장": "정장세트",
               "롱원피스": "원피스", "미니원피스": "원피스", "회중시계": "시계", "카디건": "가디건", "재킷": "자켓",
               "후드티": "후드", "스웨터": "니트", "치마": "스커트", "데님": "청바지", "하이힐": "힐", "볼캡": "캡"}
# 소속이 분명한 꼬리표 → 대분류 이름 (규칙 C). 그 이름의 카테고리가 사이트에 딱 1개일 때만 쓴다.
TAG_FAMILY = {"신발": ["로퍼", "샌들", "장화", "슬리퍼"],
              "가방": ["클러치", "보스턴백", "캐리어", "더플백", "에코백"],
              "액세서리": ["벨트", "넥타이", "스카프", "장갑", "양말", "선글라스"],
              "의류": ["조끼", "베스트", "폴로", "비치웨어"]}
FAMILY_OF = {t: fam for fam, tags in TAG_FAMILY.items() for t in tags}
TAG_RE = re.compile(r"^\s*\[([^\]]+)\]")

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "status", "run", "revert") or len(sys.argv) > 2:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261004_category_module_root")
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


def cols_of(table):
    return [r[0] for r in q("SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name=%s ORDER BY ordinal_position", (S, table))]


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
CAT_COLS = cols_of("pd_category")
SITE_COLS = cols_of("sy_site")
PROD_COLS = cols_of("pd_prod")
if "site_id" not in CAT_COLS:
    sys.exit("pd_category.site_id 컬럼이 없습니다 — 사이트 분리 마이그레이션을 먼저 적용하세요.")
PATH_COLS = [c for c in CAT_COLS if "path" in c or c in ("category_level", "level", "full_nm", "category_full_nm")]
if PATH_COLS:
    sys.exit(f"pd_category 에 경로·레벨 컬럼이 생겼습니다({', '.join(PATH_COLS)}) — 이 스크립트는 부모·깊이만 다룹니다. 스크립트를 보강한 뒤 실행하세요.")
has_root_col = "root_category_id" in SITE_COLS
mod_expr = ("coalesce(nullif(btrim(module_cd), ''), nullif(btrim(tenant_module), ''))" if "module_cd" in SITE_COLS and "tenant_module" in SITE_COLS
            else "nullif(btrim(module_cd), '')" if "module_cd" in SITE_COLS else "nullif(btrim(tenant_module), '')")
SITES = q(f"SELECT site_id, site_nm, {mod_expr}, {'root_category_id' if has_root_col else 'NULL'} FROM {S}.sy_site WHERE {mod_expr} IS NOT NULL ORDER BY site_id")
if not SITES:
    sys.exit("모듈이 지정된 사이트가 없습니다 — sy_site 의 모듈(module_cd / tenant_module)을 먼저 확인하세요.")
site_ids = [r[0] for r in SITES]

cats = {}       # category_id → dict
for cid, site, parent, nm, depth, sort in q(f"SELECT category_id, site_id, parent_category_id, category_nm, category_depth, sort_ord FROM {S}.pd_category"):
    cats[cid] = dict(id=cid, site=site, parent=parent or None, nm=nm, depth=depth, sort=sort)
all_ids = set(cats)
bak_exists = has_table(BAK, "_root")
cmap_exists = has_table(CMAP, "_map")
cmap_rows = q(f"SELECT src_site_id, old_category_id, dst_site_id, new_category_id FROM {CMAP}._map") if cmap_exists else []
step10_ok = cmap_exists and any(c["site"] == DST for c in cats.values())


def plan_site(site, module, root_now):
    """한 사이트 계획 — dict(root, new, reparent[], depth{}, fatal[])"""
    mine = [c for c in cats.values() if c["site"] == site]
    by_id = {c["id"]: c for c in mine}
    fatal = []
    root = None
    if root_now and root_now in by_id and by_id[root_now]["parent"] is None:
        root = root_now
    elif root_now:
        fatal.append(f"sy_site.root_category_id = {root_now} 가 이 사이트의 부모 없는 카테고리가 아닙니다")
    if root is None:
        named = [c["id"] for c in mine if c["parent"] is None and c["nm"] == module]
        if len(named) > 1:
            fatal.append(f"부모 없는 카테고리 중 이름이 모듈({module})인 것이 {len(named)}개 — 하나만 남기세요")
        elif named:
            root = named[0]
    for c in mine:
        if c["parent"] and c["parent"] not in by_id:
            fatal.append(f"고아 카테고리(부모가 {'다른 사이트' if c['parent'] in all_ids else '없는 ID'}): {c['id']} {c['nm']} → {c['parent']}")
    reparent = sorted(c["id"] for c in mine if c["parent"] is None and c["id"] != root)
    return dict(site=site, module=module, root=root, new=root is None, reparent=reparent, by_id=by_id, fatal=fatal, total=len(mine))


def depth_changes(p, root_id):
    """루트 아래로 내린 뒤의 깊이(부모 + 1) — {category_id: 새 깊이} 중 지금과 다른 것만"""
    parent = {cid: (root_id if cid in p["reparent"] else c["parent"]) for cid, c in p["by_id"].items()}
    out = {}
    for cid, c in p["by_id"].items():
        d, cur_id, seen = 1, cid, set()
        while parent.get(cur_id) and cur_id not in seen:
            seen.add(cur_id); cur_id = parent[cur_id]; d += 1
        if cid != root_id and c["depth"] != d:
            out[cid] = d
    if root_id in p["by_id"] and p["by_id"][root_id]["depth"] != 1:
        out[root_id] = 1
    return out


def stray_products(site):
    """갈 곳 없는 상품 — [(prod_id, prod_nm, category_id, 사유)]"""
    return q(f"""SELECT p.prod_id, p.prod_nm, p.category_id,
                        CASE WHEN coalesce(p.category_id, '') = '' THEN '비어 있음' WHEN c.category_id IS NULL THEN '없는 카테고리' ELSE '다른 사이트 카테고리' END
                   FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id
                  WHERE p.site_id = %s AND (coalesce(p.category_id, '') = '' OR c.category_id IS NULL OR c.site_id <> p.site_id)
                  ORDER BY p.prod_id""", (site,))


def assign(p, root_id, prod_nm):
    """상품명 꼬리표로 카테고리 고르기 — (category_id, 규칙). 확실하지 않으면 (루트, '루트')"""
    m = TAG_RE.match(prod_nm or "")
    if not m:
        return root_id, "루트(꼬리표 없음)"
    tag = m.group(1).strip()
    by_name = collections.defaultdict(list)
    for c in p["by_id"].values():
        if c["id"] != root_id:
            by_name[c["nm"]].append(c["id"])
    name = TAG_SYNONYM.get(tag, tag)
    hits = by_name.get(name, [])
    if len(hits) == 1:
        return hits[0], "A 이름 일치" if name == tag else "A 동의어 일치"
    if len(hits) > 1:      # 공통 상위 분류
        def chain(cid):
            out = []
            while cid and cid in p["by_id"] and cid != root_id:
                out.append(cid); cid = p["by_id"][cid]["parent"]
            return out[::-1]
        chains = [chain(h)[:-1] for h in hits]
        common = None
        for lvl in zip(*chains):
            if len(set(lvl)) == 1: common = lvl[0]
            else: break
        if common:
            return common, "B 공통 상위"
        return root_id, "루트(같은 이름이 여러 대분류에)"
    fam = FAMILY_OF.get(tag)
    if fam and len(by_name.get(fam, [])) == 1:
        return by_name[fam][0], "C 소속 대분류"
    return root_id, "루트(맞는 분류 없음)"


plans = [plan_site(site, module, root_now) for site, _nm, module, root_now in SITES]
strays = {p["site"]: stray_products(p["site"]) for p in plans}
catprod_stray = q(f"""SELECT cp.category_prod_id, cp.site_id, cp.category_id, cp.prod_id, cp.category_prod_type_cd
                        FROM {S}.pd_category_prod cp LEFT JOIN {S}.pd_category c ON c.category_id = cp.category_id
                       WHERE c.category_id IS NULL AND cp.site_id = ANY(%s)""", (site_ids,)) if has_table(S, "pd_category_prod") else []
root_of = {p["site"]: p["root"] for p in plans}
map_missing = bool(cmap_exists and not any(r[0] == SRC and r[2] == DST and r[1] == root_of.get(SRC) and r[3] == root_of.get(DST) for r in cmap_rows)) \
    if SRC in root_of and DST in root_of else False
todo_cnt = sum((1 if p["new"] else 0) + len(p["reparent"]) + len(depth_changes(p, p["root"] or "__new__")) + len(strays[p["site"]]) for p in plans)
site_unset = [p["site"] for p, s in zip(plans, SITES) if not p["new"] and s[3] != p["root"]]
applied = has_root_col and todo_cnt == 0 and not site_unset and not catprod_stray and not (cmap_exists and map_missing)

# ── status ───────────────────────────────────────────────────────────────────
if MODE == "status":
    if applied:
        print(f"[상태] 적용됨 — 모듈 사이트 {len(plans)}곳 모두 루트 있음(sy_site.root_category_id), 갈 곳 없는 상품 0건"); sys.exit(0)
    done_roots = sum(1 for p in plans if not p["new"])
    print(f"[상태] {'일부만 적용' if (has_root_col or done_roots or bak_exists) else '미적용'} — sy_site.root_category_id 컬럼 {'있음' if has_root_col else '없음'}, "
          f"루트 {done_roots}/{len(plans)}곳, 내릴 카테고리 {sum(len(p['reparent']) for p in plans)}건, 갈 곳 없는 상품 {sum(len(v) for v in strays.values())}건")
    sys.exit(3)

# ── revert ───────────────────────────────────────────────────────────────────
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"백업 {BAK} 이 없습니다 — run 을 한 적이 없습니다.")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        cur.execute(f"""UPDATE {S}.pd_prod p SET category_id = b.category_id_before, upd_by = b.upd_by, upd_date = b.upd_date
                          FROM {BAK}._prod b WHERE b.prod_id = p.prod_id AND p.category_id IS NOT DISTINCT FROM b.category_id_after""")
        n_prod = cur.rowcount
        n_prod_all = q1(f"SELECT count(*) FROM {BAK}._prod")
        cur.execute(f"""UPDATE {S}.pd_category_prod cp SET category_id = b.category_id_before
                          FROM {BAK}._catprod b WHERE b.category_prod_id = cp.category_prod_id AND cp.category_id = b.category_id_after""")
        n_cp = cur.rowcount
        cur.execute(f"""UPDATE {S}.pd_category c SET parent_category_id = b.parent_category_id, category_depth = b.category_depth, upd_by = b.upd_by, upd_date = b.upd_date
                          FROM {BAK}._cat b WHERE b.category_id = c.category_id""")
        n_cat = cur.rowcount
        if has_table(CMAP, "_map"):
            cur.execute(f"DELETE FROM {CMAP}._map m USING {BAK}._mapadd a WHERE a.new_category_id = m.new_category_id")
        cur.execute(f"UPDATE {S}.sy_site s SET root_category_id = b.root_before FROM {BAK}._site b WHERE b.site_id = s.site_id")
        made = [r[0] for r in q(f"SELECT category_id FROM {BAK}._root WHERE created")]
        used = []
        n = q1(f"SELECT count(*) FROM {S}.pd_category WHERE parent_category_id = ANY(%s)", (made,))
        if n: used.append(f"pd_category.parent_category_id {n}행")
        for t, c in q("""SELECT c.table_name, c.column_name FROM information_schema.columns c
                           JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                          WHERE c.table_schema=%s AND c.column_name ~ '^category_id' AND c.table_name NOT LIKE 'zz%%' AND c.table_name <> 'pd_category'""", (S,)):
            n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (made,))
            if n: used.append(f"{t}.{c} {n}행")
        if used:
            conn.rollback()
            sys.exit("[중단] 루트 카테고리를 쓰는 데이터가 남아 있습니다 — 먼저 그쪽을 되돌리세요(ec2 상품 복사 revert, 그 뒤 새로 붙인 상품·하위 카테고리): "
                     + ", ".join(used) + " — 아무것도 바꾸지 않았습니다.")
        cur.execute(f"DELETE FROM {S}.pd_category WHERE category_id = ANY(%s)", (made,))
        n_root = cur.rowcount
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert: 상품 {n_prod}건(기록 {n_prod_all}건 중 — 나머지는 그 뒤 값이 바뀌어 그대로 둠)·카테고리 전시 {n_cp}건 되돌림, "
              f"카테고리 부모·깊이 {n_cat}건 되돌림, 루트 {n_root}건 삭제, sy_site.root_category_id 이전 값으로, 백업 스키마 {BAK} 삭제 — 커밋했습니다.")
        print("   컬럼 sy_site.root_category_id 는 남겨 두었습니다(새 백엔드가 읽습니다).")
    except SystemExit:
        raise
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ── dry / run 공통: 계획 출력 ────────────────────────────────────────────────
print(f"[대상] {MODE} — 스키마 {S}, 백업 스키마 {BAK} ({'있음' if bak_exists else '없음'}), 10단계 카테고리 매핑 {'있음' if cmap_exists else '없음'}")
print(f"[컬럼] sy_site.root_category_id {'있음' if has_root_col else '없음 → 추가'} · pd_category 경로 컬럼 없음(부모·깊이만 바꿈)")
if not step10_ok:
    print(f"[주의] 10단계(migration_20261004_category_site.py run)가 아직입니다 — 아래 숫자는 지금 DB 기준입니다.")
    print(f"       10단계 뒤에는 {DST} 가 {SRC} 와 같은 수(최상위·전체)로, SI260003 은 보강분만큼 늘어납니다. run 은 10단계 뒤에만 시작합니다.")

base = datetime.datetime.now().replace(microsecond=0)
used_ids = set(all_ids)
new_root_ids = gen_ids("CA", sum(1 for p in plans if p["new"]), used_ids, base)
it = iter(new_root_ids)
problems = []
moves = {}      # site → [(prod_id, prod_nm, before, after, 규칙, 사유)]
print(f"\n[사이트별 계획] {'사이트':<10}{'모듈':<13}{'루트':<26}{'카테고리':>6}{'루트 아래로':>8}{'깊이 변경':>7}{'상품 재연결':>8}{' (분류 배정 / 루트)':<18}")
for p in plans:
    if p["new"]:
        p["root"] = next(it); root_txt = f"새로 {p['root']}"
    else:
        root_txt = f"있음 {p['root']}"
    p["depth"] = depth_changes(p, p["root"])
    mv = []
    for prod_id, prod_nm, before, why in strays[p["site"]]:
        after, rule = assign(p, p["root"], prod_nm)
        mv.append((prod_id, prod_nm, before, after, rule, why))
    moves[p["site"]] = mv
    to_cat = sum(1 for m in mv if m[3] != p["root"])
    print(f"   {p['site']:<10}{p['module']:<13}{root_txt:<26}{p['total']:>8}{len(p['reparent']):>10}{len(p['depth']):>10}{len(mv):>10}   ({to_cat} / {len(mv) - to_cat})")
    problems += [f"{p['site']}: {m}" for m in p["fatal"]]
tot_mv = sum(len(v) for v in moves.values())
print(f"   합계: 새 루트 {len(new_root_ids)}개 · 루트 아래로 내릴 카테고리 {sum(len(p['reparent']) for p in plans)}건 · 깊이 변경 {sum(len(p['depth']) for p in plans)}건 · 상품 재연결 {tot_mv}건")

for p in plans:
    mv = moves[p["site"]]
    if not mv: continue
    why = collections.Counter(m[5] for m in mv)
    rule = collections.Counter(m[4] for m in mv)
    print(f"\n[{p['site']} 상품 재연결 {len(mv)}건] 사유: " + ", ".join(f"{k} {v}건" for k, v in why.items()))
    print("   규칙별: " + ", ".join(f"{k} {v}건" for k, v in sorted(rule.items())))
    tags = collections.Counter((TAG_RE.match(m[1] or "").group(1) if TAG_RE.match(m[1] or "") else "(없음)") for m in mv)
    shapes = collections.Counter(re.sub(r"\d+", "#", m[1] or "") for m in mv)
    tagged = sum(v for k, v in tags.items() if k != "(없음)")
    print(f"   상품명 형태: 꼬리표 '[분류] 이름 번호' 꼴 {tagged}건(꼬리표 {len(tags)}종) — 번호만 다른 같은 틀 {len(shapes)}종으로 찍어낸 시뮬레이션 데이터."
          " 이름 뒷부분은 꼬리표와 무관하게 섞여 있어 쓰지 않고 꼬리표만 봅니다.")
    per_cat = collections.Counter(m[3] for m in mv if m[3] != p["root"])

    def path(cid):
        out = []
        while cid and cid in p["by_id"] and cid != p["root"]:
            out.append(p["by_id"][cid]["nm"]); cid = p["by_id"][cid]["parent"]
        return " > ".join(out[::-1])
    print(f"   카테고리별 배정 {sum(per_cat.values())}건 ({len(per_cat)}개 분류):")
    for cid, n in sorted(per_cat.items(), key=lambda x: (-x[1], path(x[0]))):
        print(f"      {n:>4}건  {path(cid)}  ({cid})")
    print(f"   루트({p['module']})로 {len(mv) - sum(per_cat.values())}건 — 꼬리표: "
          + ", ".join(f"{k} {v}" for k, v in collections.Counter((TAG_RE.match(m[1] or "").group(1) if TAG_RE.match(m[1] or "") else "(없음)")
                                                               for m in mv if m[3] == p["root"]).most_common()))
    print("   표본 20건(고르게):")
    step = max(1, len(mv) // 20)
    for m in mv[::step][:20]:
        print(f"      {m[0]:<20} {(m[1] or '')[:34]:<36} {m[2] or '(없음)':<19} → {path(m[3]) or p['module'] + '(루트)'}  [{m[4]}]")

if catprod_stray:
    print(f"\n[pd_category_prod] 없는 카테고리를 가리키는 행 {len(catprod_stray)}건 → 그 사이트 루트로(같은 상품·유형이 이미 루트에 있으면 그대로 두고 알림)")
else:
    print("\n[pd_category_prod] 없는 카테고리를 가리키는 행 0건 — 바꿀 것 없음")
# 참고: 카테고리를 대상으로 하는 다른 데이터
refs = []
for t, tc, ic in [("pm_coupon_item", "target_type_cd", "target_id"), ("pm_discnt_item", "target_type_cd", "target_id"),
                  ("pm_event_item", "target_type_cd", "target_id"), ("pm_save_item", "target_type_cd", "target_id")]:
    if has_table(S, t):
        n, bad = q(f"""SELECT count(*), count(*) FILTER (WHERE c.category_id IS NULL) FROM {S}."{t}" x LEFT JOIN {S}.pd_category c ON c.category_id = x."{ic}"
                        WHERE x."{tc}" = 'CATEGORY'""")[0]
        refs.append(f"{t} {n}행(끊긴 것 {bad})")
if has_table(S, "st_settle_config"):
    refs.append(f"st_settle_config.category_id {q1(f'SELECT count(category_id) FROM {S}.st_settle_config')}행")
print("[참고] 카테고리를 대상으로 하는 다른 데이터(이 스크립트는 바꾸지 않음 — ID 가 그대로라 영향 없음): " + ", ".join(refs))
print(f"[10단계 매핑] {SRC} 루트 → {DST} 루트: " + ("추가 예정" if (cmap_exists and map_missing) else "이미 있음" if cmap_exists else "매핑 스키마 없음(10단계 뒤 추가)"))
print(f"[적용 여부] {'적용됨 — run 은 건너뜀' if applied else '미적용(또는 일부) — run 대상'}")

if MODE == "dry":
    if problems:
        print("\n[사전점검 실패 — run 은 시작하지 않습니다]"); [print("   !! " + m) for m in problems]
        sys.exit(1)
    print("\n(dry) 읽기 전용 세션 — 아무것도 바꾸지 않았습니다. 적용하려면 run")
    sys.exit(0)

# ── run ──────────────────────────────────────────────────────────────────────
if applied:
    print("\n[건너뜀] 이미 적용돼 있습니다."); conn.rollback(); sys.exit(0)
if not step10_ok:
    problems.append("10단계(migration_20261004_category_site.py run)가 아직입니다 — 먼저 실행하세요")
if problems:
    conn.rollback(); print("\n[중단] 사전점검 실패:"); [print("   !! " + m) for m in problems]; sys.exit(1)

try:
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cat_cnt_before = q1(f"SELECT count(*) FROM {S}.pd_category")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._root (site_id varchar(21) PRIMARY KEY, category_id varchar(21) NOT NULL, module_cd varchar(20), created boolean NOT NULL, reg_date timestamp DEFAULT now())")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._cat (category_id varchar(21) PRIMARY KEY, site_id varchar(21), parent_category_id varchar(21), category_depth integer, upd_by varchar(30), upd_date timestamp)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._prod (prod_id varchar(21) PRIMARY KEY, site_id varchar(21), category_id_before varchar(21), category_id_after varchar(21), rule varchar(60), upd_by varchar(30), upd_date timestamp)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._catprod (category_prod_id varchar(21) PRIMARY KEY, category_id_before varchar(21), category_id_after varchar(21))")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._site (site_id varchar(21) PRIMARY KEY, root_before varchar(21))")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._mapadd (new_category_id varchar(21) PRIMARY KEY)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_at timestamp DEFAULT now(), mode varchar(10), note text)")

    # 1) 컬럼
    cur.execute(f"ALTER TABLE {S}.sy_site ADD COLUMN IF NOT EXISTS root_category_id varchar(21)")
    cur.execute(f"COMMENT ON COLUMN {S}.sy_site.root_category_id IS '카테고리 트리 루트 (pd_category.category_id) — 이 사이트의 모듈 루트 카테고리, NULL=루트 없음(모듈 미지정)'")
    now = datetime.datetime.now()
    for p, (site, _nm, module, root_now) in zip(plans, SITES):
        root = p["root"]
        # 2) 루트
        if p["new"]:
            row = {c: None for c in CAT_COLS}
            row.update(category_id=root, parent_category_id=None, category_nm=module, category_depth=1, sort_ord=0, site_id=site)
            for c, v in (("category_status_cd", "ACTIVE"), ("category_desc", ROOT_DESC), ("reg_by", MIG), ("upd_by", MIG), ("reg_date", now), ("upd_date", now), ("reg_site_id", site)):
                if c in CAT_COLS: row[c] = v
            cur.execute(f'INSERT INTO {S}.pd_category ({", ".join(chr(34) + c + chr(34) for c in CAT_COLS)}) VALUES ({", ".join(["%s"] * len(CAT_COLS))})', [row[c] for c in CAT_COLS])
        cur.execute(f"INSERT INTO {BAK}._root (site_id, category_id, module_cd, created) VALUES (%s, %s, %s, %s) ON CONFLICT (site_id) DO NOTHING", (site, root, module, p["new"]))
        cur.execute(f"INSERT INTO {BAK}._site (site_id, root_before) VALUES (%s, %s) ON CONFLICT (site_id) DO NOTHING", (site, root_now))
        cur.execute(f"UPDATE {S}.sy_site SET root_category_id = %s WHERE site_id = %s AND root_category_id IS DISTINCT FROM %s", (root, site, root))
        # 3) 부모·깊이
        touch = sorted(set(p["reparent"]) | set(p["depth"]))
        if touch:
            cur.execute(f"""INSERT INTO {BAK}._cat (category_id, site_id, parent_category_id, category_depth, upd_by, upd_date)
                            SELECT category_id, site_id, parent_category_id, category_depth, upd_by, upd_date FROM {S}.pd_category WHERE category_id = ANY(%s)
                            ON CONFLICT (category_id) DO NOTHING""", (touch,))
        if p["reparent"]:
            cur.execute(f"UPDATE {S}.pd_category SET parent_category_id = %s, upd_by = %s, upd_date = %s WHERE category_id = ANY(%s)", (root, MIG, now, p["reparent"]))
        if p["depth"]:
            psycopg2.extras.execute_values(cur, f"""UPDATE {S}.pd_category c SET category_depth = v.d, upd_by = {"'" + MIG + "'"}, upd_date = now()
                                                    FROM (VALUES %s) AS v(id, d) WHERE c.category_id = v.id""", list(p["depth"].items()), page_size=500)
        # 4) 상품
        mv = moves[site]
        if mv:
            ids = [m[0] for m in mv]
            cur.execute(f"""INSERT INTO {BAK}._prod (prod_id, site_id, category_id_before, upd_by, upd_date)
                            SELECT prod_id, site_id, category_id, upd_by, upd_date FROM {S}.pd_prod WHERE prod_id = ANY(%s) ON CONFLICT (prod_id) DO NOTHING""", (ids,))
            psycopg2.extras.execute_values(cur, f"UPDATE {BAK}._prod b SET category_id_after = v.a, rule = v.r FROM (VALUES %s) AS v(id, a, r) WHERE b.prod_id = v.id",
                                           [(m[0], m[3], m[4]) for m in mv], page_size=500)
            psycopg2.extras.execute_values(cur, f"""UPDATE {S}.pd_prod p SET category_id = v.a, upd_by = {"'" + MIG + "'"}, upd_date = now()
                                                    FROM (VALUES %s) AS v(id, a) WHERE p.prod_id = v.id""", [(m[0], m[3]) for m in mv], page_size=500)
        print(f"[{site}] 루트 {root}({'새로' if p['new'] else '있던 것'}) · 루트 아래로 {len(p['reparent'])}건 · 깊이 변경 {len(p['depth'])}건 · 상품 재연결 {len(mv)}건")
    # 4-2) 카테고리 전시
    kept = 0
    for cp_id, site, cat_id, prod_id, typ in catprod_stray:
        root = root_of.get(site) or next(p["root"] for p in plans if p["site"] == site)
        if q1(f"SELECT count(*) FROM {S}.pd_category_prod WHERE category_id=%s AND prod_id=%s AND category_prod_type_cd=%s", (root, prod_id, typ)):
            kept += 1; continue
        cur.execute(f"INSERT INTO {BAK}._catprod (category_prod_id, category_id_before, category_id_after) VALUES (%s, %s, %s) ON CONFLICT (category_prod_id) DO NOTHING", (cp_id, cat_id, root))
        cur.execute(f"UPDATE {S}.pd_category_prod SET category_id = %s WHERE category_prod_id = %s", (root, cp_id))
    if catprod_stray:
        print(f"[pd_category_prod] {len(catprod_stray) - kept}건 루트로 · {kept}건은 같은 연결이 이미 있어 그대로 둠")
    # 5) 10단계 매핑
    r_src, r_dst = (next(p["root"] for p in plans if p["site"] == s) if s in site_ids else None for s in (SRC, DST))
    if cmap_exists and r_src and r_dst and not q1(f"SELECT count(*) FROM {CMAP}._map WHERE dst_site_id=%s AND old_category_id=%s", (DST, r_src)):
        cur.execute(f"INSERT INTO {CMAP}._map (src_site_id, old_category_id, dst_site_id, new_category_id) VALUES (%s, %s, %s, %s)", (SRC, r_src, DST, r_dst))
        cur.execute(f"INSERT INTO {BAK}._mapadd (new_category_id) VALUES (%s) ON CONFLICT DO NOTHING", (r_dst,))
        print(f"[10단계 매핑] {SRC} {r_src} → {DST} {r_dst} 추가")
    cur.execute(f"INSERT INTO {BAK}._run (mode, note) VALUES ('run', %s)",
                (f"새 루트 {len(new_root_ids)}, 루트 아래로 {sum(len(p['reparent']) for p in plans)}, 깊이 {sum(len(p['depth']) for p in plans)}, 상품 {tot_mv}",))

    # 6) 검증
    bad = []
    for site, root, n_top, nm, module in q(f"""SELECT s.site_id, s.root_category_id,
                                                 (SELECT count(*) FROM {S}.pd_category c WHERE c.site_id = s.site_id AND coalesce(c.parent_category_id, '') = ''),
                                                 (SELECT c.category_nm FROM {S}.pd_category c WHERE c.category_id = s.root_category_id AND c.site_id = s.site_id AND coalesce(c.parent_category_id, '') = ''),
                                                 {mod_expr}
                                            FROM {S}.sy_site s WHERE {mod_expr} IS NOT NULL"""):
        if not root or n_top != 1 or nm != module:
            bad.append(f"{site}: root_category_id={root}, 부모 없는 카테고리 {n_top}개, 루트 이름 {nm} (모듈 {module})")
    n = q1(f"""SELECT count(*) FROM {S}.pd_category c LEFT JOIN {S}.pd_category p ON p.category_id = c.parent_category_id
                WHERE c.site_id = ANY(%s) AND coalesce(c.parent_category_id, '') <> '' AND (p.category_id IS NULL OR p.site_id <> c.site_id)""", (site_ids,))
    if n: bad.append(f"부모가 없거나 다른 사이트인 카테고리 {n}건")
    n = q1(f"""SELECT count(*) FROM {S}.pd_category c LEFT JOIN {S}.pd_category p ON p.category_id = c.parent_category_id
                WHERE c.site_id = ANY(%s) AND c.category_depth IS DISTINCT FROM coalesce(p.category_depth, 0) + 1""", (site_ids,))
    if n: bad.append(f"깊이가 부모 + 1 이 아닌 카테고리 {n}건")
    n = q1(f"""SELECT count(*) FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id
                WHERE p.site_id = ANY(%s) AND (coalesce(p.category_id, '') = '' OR c.category_id IS NULL OR c.site_id <> p.site_id)""", (site_ids,))
    if n: bad.append(f"갈 곳 없는 상품이 아직 {n}건")
    cat_cnt_after = q1(f"SELECT count(*) FROM {S}.pd_category")
    if cat_cnt_after != cat_cnt_before + len(new_root_ids): bad.append(f"카테고리 수 {cat_cnt_before} → {cat_cnt_after} (새 루트 {len(new_root_ids)}개와 안 맞음)")
    if cmap_exists and r_src and r_dst and not q1(f"SELECT count(*) FROM {CMAP}._map WHERE dst_site_id=%s AND old_category_id=%s AND new_category_id=%s", (DST, r_src, r_dst)):
        bad.append("10단계 매핑에 루트 → 루트 가 없음")
    if bad:
        raise RuntimeError("검증 실패 — " + " / ".join(bad))
    conn.commit()
    print(f"[검증] 사이트 {len(plans)}곳 모두 부모 없는 카테고리 = 루트 1개 = sy_site.root_category_id · 깊이 = 부모 + 1 · 사이트 밖 부모 0 · 갈 곳 없는 상품 0 · 카테고리 {cat_cnt_before} → {cat_cnt_after}")
    print(f"\n[완료] run — 커밋했습니다. 백업: {BAK} (_root·_cat·_prod·_catprod·_site·_mapadd). 다음: migration_20261004_ec2_prod_copy.py run")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
