# -*- coding: utf-8 -*-
r"""
migration_20261004_category_cd.py — 카테고리 코드(pd_category.category_cd) 추가·값 채우기 (2026-10-04, 실행기 15 단계)

  목적: 사이트마다 카테고리 ID 는 다르지만(ec2 는 ec1 카테고리의 복사본) **같은 뜻의 카테고리는 같은 코드**(예 신발 = SHOES)를 가져
        전체 사이트를 가로질러 특정 카테고리를 집계할 수 있게 한다.

  코드 규칙
    · 영문 대문자·숫자·밑줄만, 1~50자 (^[A-Z0-9_]{1,50}$) — 백엔드 PdCategoryService 와 같은 규칙
    · 뜻 기반 이름: 의류 APPAREL, 가방 BAGS, 신발 SHOES, 액세서리 ACCESSORIES, 여성상의 WOMEN_TOPS, 남성화 MEN_SHOES, 시계 WATCHES …
    · 여성·남성(또는 수트) 아래에 같은 이름이 있으면 부모 맥락을 붙인다: 티셔츠 → WOMEN_TSHIRTS / MEN_TSHIRTS, 자켓 → WOMEN_JACKETS / MEN_JACKETS / SUIT_JACKETS
    · 모듈 루트(sy_site.root_category_id 가 가리키는 행)의 코드는 ROOT 고정
    · 같은 사이트 안에서는 코드가 유일(부분 유니크 인덱스), 비워 둘 수 있다(NULL)
    · 사이트가 달라도 뜻이 같으면 같은 코드: ec1 = ec2 전부, danmoo1 의 의류·가방/잡화·신발 = APPAREL·BAGS·SHOES

  사전: 아래 EC_DICT(ec1·ec2 — 73건) / DM_DICT(danmoo1 — 19건). 열쇠는 "루트 아래 경로"(이름을 '>' 로 이음) — 같은 이름이 여러 부모 아래에 있어도 구분된다.
        사전에 없는 경로는 dry 가 목록으로 경고하고 그 행은 NULL 로 둔다(나중에 BO 카테고리관리에서 직접 입력).
        이미 코드가 들어 있는 행은 건드리지 않는다(화면에서 넣은 값 유지 — 사전과 다르면 알려만 준다).

  하는 일 (run — 한 트랜잭션, 하나라도 실패하면 전체 롤백)
    1) pd_category.category_cd varchar(50) NULL 컬럼 추가(없을 때만) + 주석
    2) 코드가 빈 행을 사전·루트 규칙으로 채움 (바꾸기 전 값은 백업 스키마 _cat 에 기록)
    3) 인덱스: pd_category_ux01_site_category_cd — (site_id, category_cd) 부분 유니크(category_cd IS NOT NULL)
               pd_category_ix02_category_cd      — category_cd 일반 인덱스(사이트 간 집계용)
    4) 검증: 같은 사이트 안 같은 코드 0, 형식에 안 맞는 코드 0, 루트 = ROOT, 사전에 있는 행은 모두 채워짐

  새 백엔드(PdCategory.categoryCd)는 이 컬럼이 있어야 뜬다 → 반드시 배포 "전"(pre)에 실행한다. 컬럼만 추가하는 변경이라 옛 백엔드는 영향 없음.

  다시 실행해도 안전: 컬럼·인덱스는 없을 때만 만들고, 값은 빈 행만 채운다. 이미 다 돼 있으면 "할 일 없음".
  되돌리기(revert): 이 스크립트가 채운 값만 이전 값으로(그 뒤 화면에서 바꾼 행은 그대로 둠), 인덱스 2개 삭제, 백업 스키마 삭제.
                    컬럼 category_cd 는 남긴다(새 백엔드가 읽는다).
  백업 스키마: shopjoy_2604_bak_catcd_20261004 (_cat: 바꾼 행의 이전·새 값, _run: 실행 기록)

  status 종료코드: 0 = 적용됨 / 1 = 미적용·일부만 적용
     적용됨 = 컬럼 있음 AND 인덱스 2개 있음 AND 채울 행 0 AND 같은 사이트 중복 0

  사이트 간 집계 예 (적용 뒤)
     SELECT c.category_cd, c.site_id, count(p.prod_id) AS 직접연결상품수
       FROM shopjoy_2604.pd_category c LEFT JOIN shopjoy_2604.pd_prod p ON p.category_id = c.category_id
      WHERE c.category_cd = 'SHOES' GROUP BY c.category_cd, c.site_id;
     (하위 포함 집계는 정책서 sy.57 데이터 정비 문서의 카테고리 절, 또는 GET /api/bo/ec/pd/category/code-summary)

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261004_category_cd.py dry      # 읽기 전용 세션, SELECT 만 — 사이트별 채움 건수·코드 목록·공통 코드 표·중복 검사
     python migration_20261004_category_cd.py status
     python migration_20261004_category_cd.py run
     python migration_20261004_category_cd.py revert
"""
import os, sys, re, collections
import psycopg2

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_catcd_20261004"
UX = "pd_category_ux01_site_category_cd"
IX = "pd_category_ix02_category_cd"
ROOT_CD = "ROOT"
CD_RE = re.compile(r"^[A-Z0-9_]{1,50}$")
COL_COMMENT = "카테고리 코드 — 사이트 간 공통 집계 키(예 SHOES). 같은 사이트 안에서 유일"
USAGE = "사용법: python migration_20261004_category_cd.py dry|status|run|revert"

# ── 사전: 루트 아래 경로 → 코드 ───────────────────────────────────────────────
# ec1·ec2 (ec2 는 ec1 의 복사본이라 경로가 같다 → 같은 코드) — 73건
EC_DICT = {
    "의류": "APPAREL",
    "의류>여성상의": "WOMEN_TOPS",
    "의류>여성상의>티셔츠": "WOMEN_TSHIRTS",
    "의류>여성상의>블라우스": "WOMEN_BLOUSES",
    "의류>여성상의>셔츠": "WOMEN_SHIRTS",
    "의류>여성상의>니트": "WOMEN_KNITWEAR",
    "의류>여성상의>후드": "WOMEN_HOODIES",
    "의류>여성하의": "WOMEN_BOTTOMS",
    "의류>여성하의>청바지": "WOMEN_JEANS",
    "의류>여성하의>슬랙스": "WOMEN_SLACKS",
    "의류>여성하의>스커트": "SKIRTS",
    "의류>여성하의>레깅스": "LEGGINGS",
    "의류>원피스": "DRESSES",
    "의류>원피스>정장원피스": "FORMAL_DRESSES",
    "의류>원피스>캐주얼원피스": "CASUAL_DRESSES",
    "의류>여성아우터": "WOMEN_OUTERWEAR",
    "의류>여성아우터>코트": "WOMEN_COATS",
    "의류>여성아우터>자켓": "WOMEN_JACKETS",
    "의류>여성아우터>패딩": "WOMEN_PADDING",
    "의류>여성아우터>가디건": "WOMEN_CARDIGANS",
    "의류>남성상의": "MEN_TOPS",
    "의류>남성상의>티셔츠": "MEN_TSHIRTS",
    "의류>남성상의>셔츠": "MEN_SHIRTS",
    "의류>남성상의>니트": "MEN_KNITWEAR",
    "의류>남성상의>후드": "MEN_HOODIES",
    "의류>남성상의>맨투맨": "MEN_SWEATSHIRTS",
    "의류>남성하의": "MEN_BOTTOMS",
    "의류>남성하의>청바지": "MEN_JEANS",
    "의류>남성하의>슬랙스": "MEN_SLACKS",
    "의류>남성하의>반바지": "MEN_SHORTS",
    "의류>남성하의>트레이닝": "MEN_TRAINING_PANTS",
    "의류>남성아우터": "MEN_OUTERWEAR",
    "의류>남성아우터>코트": "MEN_COATS",
    "의류>남성아우터>자켓": "MEN_JACKETS",
    "의류>남성아우터>패딩": "MEN_PADDING",
    "의류>남성아우터>점퍼": "MEN_JUMPERS",
    "의류>수트": "SUITS",
    "의류>수트>정장세트": "SUIT_SETS",
    "의류>수트>자켓": "SUIT_JACKETS",
    "의류>수트>슬랙스": "SUIT_SLACKS",
    "가방": "BAGS",
    "가방>여성가방": "WOMEN_BAGS",
    "가방>여성가방>토트백": "TOTE_BAGS",
    "가방>여성가방>크로스백": "CROSSBODY_BAGS",
    "가방>여성가방>백팩": "WOMEN_BACKPACKS",
    "가방>여성가방>숄더백": "SHOULDER_BAGS",
    "가방>남성가방": "MEN_BAGS",
    "가방>남성가방>비즈니스백": "BUSINESS_BAGS",
    "가방>남성가방>백팩": "MEN_BACKPACKS",
    "가방>남성가방>메신저백": "MESSENGER_BAGS",
    "신발": "SHOES",
    "신발>여성화": "WOMEN_SHOES",
    "신발>여성화>운동화": "WOMEN_SNEAKERS",
    "신발>여성화>힐": "HEELS",
    "신발>여성화>플랫": "FLATS",
    "신발>여성화>부츠": "WOMEN_BOOTS",
    "신발>남성화": "MEN_SHOES",
    "신발>남성화>운동화": "MEN_SNEAKERS",
    "신발>남성화>구두": "MEN_DRESS_SHOES",
    "신발>남성화>부츠": "MEN_BOOTS",
    "액세서리": "ACCESSORIES",
    "액세서리>시계": "WATCHES",
    "액세서리>시계>손목시계": "WRIST_WATCHES",
    "액세서리>시계>스마트워치": "SMART_WATCHES",
    "액세서리>주얼리": "JEWELRY",
    "액세서리>주얼리>목걸이": "NECKLACES",
    "액세서리>주얼리>귀걸이": "EARRINGS",
    "액세서리>주얼리>반지": "RINGS",
    "액세서리>주얼리>팔찌": "BRACELETS",
    "액세서리>모자": "HATS",
    "액세서리>모자>캡": "CAPS",
    "액세서리>모자>비니": "BEANIES",
    "액세서리>모자>페도라": "FEDORAS",
}
# danmoo1 (당근형 분류) — 19건. 뜻이 ec1 과 같은 것(의류·가방/잡화·신발)은 같은 코드
DM_DICT = {
    "디지털기기": "DIGITAL",
    "생활가전": "HOME_APPLIANCES",
    "가구/인테리어": "FURNITURE",
    "생활/주방": "KITCHEN_LIVING",
    "유아동": "KIDS",
    "의류": "APPAREL",
    "의류>여성의류": "WOMEN_APPAREL",
    "의류>남성의류": "MEN_APPAREL",
    "가방/잡화": "BAGS",
    "신발": "SHOES",
    "뷰티/미용": "BEAUTY",
    "스포츠/레저": "SPORTS",
    "취미/게임/음반": "HOBBY",
    "식품": "FOOD",
    "도서": "BOOKS",
    "티켓/교환권": "TICKETS",
    "반려동물용품": "PETS",
    "식물": "PLANTS",
    "기타": "ETC",
}
DICT_BY_MODULE = {"ec1": EC_DICT, "ec2": EC_DICT, "danmoo1": DM_DICT}

# 사전 자체 점검 — 형식, ROOT 예약, 한 사전 안 코드 중복
for _name, _d in (("EC_DICT", EC_DICT), ("DM_DICT", DM_DICT)):
    _bad = [f"{k} → {v}" for k, v in _d.items() if not CD_RE.match(v) or v == ROOT_CD]
    _dup = [v for v, n in collections.Counter(_d.values()).items() if n > 1]
    if _bad or _dup:
        sys.exit(f"[사전 오류] {_name}: 형식·예약어 위반 {_bad} / 중복 코드 {_dup}")

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "status", "run", "revert") or len(sys.argv) > 2:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261004_category_cd")
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


def has_index(name):
    return bool(q("SELECT 1 FROM pg_indexes WHERE schemaname=%s AND indexname=%s", (S, name)))


# ── 현재 상태 읽기 ───────────────────────────────────────────────────────────
CAT_COLS = cols_of("pd_category")
SITE_COLS = cols_of("sy_site")
if "site_id" not in CAT_COLS:
    sys.exit("pd_category.site_id 컬럼이 없습니다 — 사이트 분리 마이그레이션을 먼저 적용하세요.")
has_col = "category_cd" in CAT_COLS
has_ux, has_ix = has_index(UX), has_index(IX)
bak_exists = has_table(BAK, "_cat")
has_root_col = "root_category_id" in SITE_COLS
mod_parts = [f"nullif(btrim({c}), '')" for c in ("module_cd", "tenant_module") if c in SITE_COLS]
mod_expr = ("coalesce(" + ", ".join(mod_parts) + ")") if len(mod_parts) > 1 else (mod_parts[0] if mod_parts else "NULL")

sites = {}      # site_id → dict(nm, module, root)
for sid, nm, module, root in q(f"SELECT site_id, site_nm, {mod_expr}, {'root_category_id' if has_root_col else 'NULL'} FROM {S}.sy_site ORDER BY site_id"):
    sites[sid] = dict(nm=nm, module=module, root=root or None)

cats = {}       # category_id → dict
for cid, site, parent, nm, sort, cd in q(f"""SELECT category_id, site_id, parent_category_id, category_nm, sort_ord, {'category_cd' if has_col else 'NULL'}
                                               FROM {S}.pd_category ORDER BY site_id, sort_ord, category_id"""):
    cats[cid] = dict(id=cid, site=site, parent=parent or None, nm=nm, sort=sort or 0, cd=(cd or None))


def path_of(cid):
    """(루트 아래 경로, 루트인가) — 경로는 이름을 '>' 로 이은 것. 모듈 루트는 경로에서 뺀다"""
    c = cats[cid]
    root_id = sites.get(c["site"], {}).get("root")
    if cid == root_id:
        return "", True
    names, cur_id, seen = [], cid, set()
    while cur_id and cur_id in cats and cur_id not in seen and cur_id != root_id:
        seen.add(cur_id)
        names.append(cats[cur_id]["nm"])
        cur_id = cats[cur_id]["parent"]
    return ">".join(reversed(names)), False


# ── 계획 ────────────────────────────────────────────────────────────────────
plan = []                 # (category_id, site_id, 경로, 지금 코드, 새 코드) — 채울 행
keep_diff = []            # 이미 코드가 있고 사전과 다른 행 — 그대로 둔다
missing = []              # 사전에 없는 행 — NULL 로 둔다
final_cd = {}             # category_id → 적용 뒤 코드(없으면 None)
for cid, c in cats.items():
    path, is_root = path_of(cid)
    module = sites.get(c["site"], {}).get("module")
    want = ROOT_CD if is_root else DICT_BY_MODULE.get(module, {}).get(path)
    label = f"{module or '(모듈 없음)'}" if is_root else path
    if c["cd"]:
        final_cd[cid] = c["cd"]
        if want and want != c["cd"]:
            keep_diff.append((c["site"], cid, label, c["cd"], want))
        continue
    final_cd[cid] = want
    if want:
        plan.append((cid, c["site"], label, c["cd"], want))
    else:
        missing.append((c["site"], cid, label, module))

by_site_code = collections.defaultdict(lambda: collections.defaultdict(list))    # site → code → [category_id]
for cid, cd in final_cd.items():
    if cd:
        by_site_code[cats[cid]["site"]][cd].append(cid)
dups = [(site, cd, ids) for site, m in sorted(by_site_code.items()) for cd, ids in sorted(m.items()) if len(ids) > 1]
bad_format = [(cats[cid]["site"], cid, cd) for cid, cd in final_cd.items() if cd and not CD_RE.match(cd)]
site_ids = sorted({c["site"] for c in cats.values()})


def site_label(sid):
    s = sites.get(sid, {})
    return f"{sid}({s.get('module') or '-'})"


def status_line():
    filled = sum(1 for c in cats.values() if c["cd"])
    items = [("컬럼 category_cd", has_col), (f"유니크 인덱스 {UX}", has_ux), (f"인덱스 {IX}", has_ix),
             (f"채울 행 0(지금 {len(plan)}건 남음)", not plan), ("같은 사이트 중복 0", not dups)]
    no = [n for n, v in items if not v]
    if not no:
        return 0, f"[status] 적용됨 — category_cd 채움 {filled}/{len(cats)}건(사전에 없어 빈 값 {len(missing)}건), 인덱스 2개, 사이트 안 중복 0"
    if not has_col and not has_ux and not has_ix:
        return 1, f"[status] 미적용 — 컬럼 category_cd 없음(채울 행 {len(plan)}건)"
    return 1, "[status] 일부만 적용 — 안 된 것: " + ", ".join(no)


if MODE == "status":
    code, line = status_line()
    print(line)
    sys.exit(code)

# ── revert ──────────────────────────────────────────────────────────────────
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"[중단] 백업 스키마 {BAK} 가 없습니다 — 되돌릴 기록이 없습니다. 아무것도 바꾸지 않았습니다.")
    try:
        n_all = q1(f"SELECT count(*) FROM {BAK}._cat")
        cur.execute(f"""UPDATE {S}.pd_category c SET category_cd = b.old_category_cd
                          FROM {BAK}._cat b
                         WHERE c.category_id = b.category_id AND c.category_cd IS NOT DISTINCT FROM b.new_category_cd""")
        n_back = cur.rowcount
        cur.execute(f"DROP INDEX IF EXISTS {S}.{UX}")
        cur.execute(f"DROP INDEX IF EXISTS {S}.{IX}")
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert: 카테고리 코드 {n_back}건 되돌림(기록 {n_all}건 중 — 나머지는 그 뒤 값이 바뀌어 그대로 둠), "
              f"인덱스 {UX}·{IX} 삭제, 백업 스키마 {BAK} 삭제 — 커밋했습니다.")
        print("   컬럼 pd_category.category_cd 는 남겨 두었습니다(새 백엔드가 읽습니다).")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ── dry / run 공통: 계획 출력 ────────────────────────────────────────────────
print(f"[대상] {MODE} — 스키마 {S}, 백업 스키마 {BAK} ({'있음' if bak_exists else '없음'})")
print(f"[컬럼] pd_category.category_cd {'있음' if has_col else '없음 → 추가 (varchar(50) NULL)'} · "
      f"인덱스 {UX} {'있음' if has_ux else '없음 → 생성'} · {IX} {'있음' if has_ix else '없음 → 생성'}")
print(f"[사전] ec1·ec2 {len(EC_DICT)}건 / danmoo1 {len(DM_DICT)}건 / 모듈 루트 = {ROOT_CD}")

print("\n[사이트별] 카테고리 수 · 이미 있음 · 이번에 채움 · 사전에 없음(빈 값으로 둠) · 적용 뒤 코드 종류")
for sid in site_ids:
    mine = [c for c in cats.values() if c["site"] == sid]
    n_has = sum(1 for c in mine if c["cd"])
    n_plan = sum(1 for p in plan if p[1] == sid)
    n_miss = sum(1 for m in missing if m[0] == sid)
    print(f"  {site_label(sid):<24} 전체 {len(mine):>3} · 이미 {n_has:>3} · 채움 {n_plan:>3} · 사전에 없음 {n_miss:>3} · 코드 {len(by_site_code[sid]):>3}종")
print(f"  합계: 전체 {len(cats)} · 이번에 채움 {len(plan)} · 사전에 없음 {len(missing)}")

print("\n[코드 목록] 사이트별 (경로 → 코드, * = 이번에 채움)")
plan_ids = {p[0] for p in plan}
for sid in site_ids:
    print(f"  ── {site_label(sid)}")
    rows = sorted(((path_of(cid)[0] or "(모듈 루트)", cid) for cid, c in cats.items() if c["site"] == sid), key=lambda r: (r[0] != "(모듈 루트)", r[0]))
    for path, cid in rows:
        print(f"     {'*' if cid in plan_ids else ' '} {path:<28} → {final_cd[cid] or '(빈 값)'}")

print("\n[사이트 간 공통 코드] 두 사이트 이상에서 쓰는 코드")
code_sites = collections.defaultdict(set)
for sid, m in by_site_code.items():
    for cd in m:
        code_sites[cd].add(sid)
common = {cd: sorted(ss) for cd, ss in code_sites.items() if len(ss) > 1}
by_group = collections.defaultdict(list)
for cd, ss in sorted(common.items()):
    by_group[", ".join(sites.get(s, {}).get("module") or s for s in ss)].append(cd)
for grp, cds in sorted(by_group.items(), key=lambda kv: -len(kv[1])):
    print(f"  [{grp}] {len(cds)}개: {', '.join(cds)}")
print(f"  공통 코드 {len(common)}개 / 전체 코드 {len(code_sites)}종 (한 사이트에서만 쓰는 코드 {len(code_sites) - len(common)}종)")

if missing:
    print(f"\n[경고] 사전에 없는 카테고리 {len(missing)}건 — 코드를 비워 둡니다(BO 카테고리관리에서 직접 넣거나 사전에 추가한 뒤 다시 실행)")
    for sid, cid, label, module in missing:
        print(f"     {site_label(sid)} {cid} {label}")
else:
    print("\n[사전] 사전에 없는 카테고리 0건 — 모든 행에 코드가 들어갑니다.")
if keep_diff:
    print(f"\n[알림] 이미 코드가 있고 사전과 다른 행 {len(keep_diff)}건 — 그대로 둡니다")
    for sid, cid, label, now, want in keep_diff:
        print(f"     {site_label(sid)} {cid} {label}: 지금 {now} (사전 {want})")

print("\n[검사] 같은 사이트 안 같은 코드: " + ("0건" if not dups else f"{len(dups)}건"))
for site, cd, ids in dups:
    print(f"     {site_label(site)} {cd}: {', '.join(ids)}")
print("[검사] 형식(영문 대문자·숫자·밑줄 1~50자)에 안 맞는 코드: " + ("0건" if not bad_format else f"{len(bad_format)}건"))
for site, cid, cd in bad_format:
    print(f"     {site_label(site)} {cid}: {cd}")

fatal = bool(dups or bad_format)
if MODE == "dry":
    if fatal:
        print("\n(dry) 위 중복·형식 문제를 먼저 풀어야 run 이 됩니다. 아무것도 바꾸지 않았습니다.")
        sys.exit(1)
    if has_col and has_ux and has_ix and not plan:
        print("\n(dry) 할 일 없음 — 이미 적용돼 있습니다. 아무것도 바꾸지 않았습니다.")
    else:
        print(f"\n(dry) run 하면: 컬럼 {'그대로' if has_col else '추가'}, 코드 {len(plan)}건 채움, 인덱스 {int(not has_ux) + int(not has_ix)}개 생성. 아무것도 바꾸지 않았습니다.")
    sys.exit(0)

# ── run ─────────────────────────────────────────────────────────────────────
if fatal:
    sys.exit("[중단] 같은 사이트 안 코드 중복 또는 형식 문제가 있습니다 — 아무것도 바꾸지 않았습니다.")
if has_col and has_ux and has_ix and not plan:
    print("\n[완료] 할 일 없음 — 이미 적용돼 있습니다.")
    sys.exit(0)
try:
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._cat (category_id varchar(21) PRIMARY KEY, site_id varchar(21), category_path text,
                                                            old_category_cd varchar(50), new_category_cd varchar(50), run_at timestamp DEFAULT now())""")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_at timestamp DEFAULT now(), col_added boolean, filled integer, note text)")
    if not has_col:
        cur.execute(f"ALTER TABLE {S}.pd_category ADD COLUMN IF NOT EXISTS category_cd varchar(50) NULL")
    cur.execute(f"COMMENT ON COLUMN {S}.pd_category.category_cd IS %s", (COL_COMMENT,))
    n_fill = 0
    for cid, site, label, old, new in plan:
        cur.execute(f"""INSERT INTO {BAK}._cat (category_id, site_id, category_path, old_category_cd, new_category_cd) VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (category_id) DO UPDATE SET new_category_cd = EXCLUDED.new_category_cd, run_at = now()""", (cid, site, label, old, new))
        cur.execute(f"UPDATE {S}.pd_category SET category_cd = %s WHERE category_id = %s AND coalesce(category_cd, '') = ''", (new, cid))
        n_fill += cur.rowcount
    cur.execute(f"CREATE UNIQUE INDEX IF NOT EXISTS {UX} ON {S}.pd_category USING btree (site_id, category_cd) WHERE category_cd IS NOT NULL")
    cur.execute(f"CREATE INDEX IF NOT EXISTS {IX} ON {S}.pd_category USING btree (category_cd)")
    cur.execute(f"INSERT INTO {BAK}._run (col_added, filled, note) VALUES (%s, %s, %s)", (not has_col, n_fill, f"사전에 없음 {len(missing)}건"))

    # 검증
    errs = []
    if n_fill != len(plan):
        errs.append(f"채운 행 {n_fill} ≠ 계획 {len(plan)} (그 사이 다른 곳에서 값이 들어감)")
    n_dup = q1(f"SELECT count(*) FROM (SELECT 1 FROM {S}.pd_category WHERE category_cd IS NOT NULL GROUP BY site_id, category_cd HAVING count(*) > 1) x")
    if n_dup:
        errs.append(f"같은 사이트 안 같은 코드 {n_dup}건")
    n_badfmt = q1(f"SELECT count(*) FROM {S}.pd_category WHERE category_cd IS NOT NULL AND category_cd !~ '^[A-Z0-9_]{{1,50}}$'")
    if n_badfmt:
        errs.append(f"형식에 안 맞는 코드 {n_badfmt}건")
    if has_root_col:
        n_root_bad = q1(f"""SELECT count(*) FROM {S}.sy_site s JOIN {S}.pd_category c ON c.category_id = s.root_category_id
                             WHERE c.category_cd IS DISTINCT FROM %s""", (ROOT_CD,))
        if n_root_bad and not any(k[3] for k in keep_diff):
            errs.append(f"코드가 ROOT 가 아닌 모듈 루트 {n_root_bad}건")
    n_null = q1(f"SELECT count(*) FROM {S}.pd_category WHERE category_cd IS NULL")
    if n_null != len(missing):
        errs.append(f"빈 코드 {n_null}건 ≠ 사전에 없는 행 {len(missing)}건")
    if errs:
        raise RuntimeError("검증 실패 — " + " / ".join(errs))
    conn.commit()
    print(f"\n[완료] run: 컬럼 {'추가' if not has_col else '그대로'}, 코드 {n_fill}건 채움(빈 값 {n_null}건), 인덱스 {UX}·{IX} — 커밋했습니다. 백업 스키마 {BAK}")
except Exception as e:
    conn.rollback()
    print(f"[실패] 롤백했습니다: {e}")
    sys.exit(1)
sys.exit(0)
