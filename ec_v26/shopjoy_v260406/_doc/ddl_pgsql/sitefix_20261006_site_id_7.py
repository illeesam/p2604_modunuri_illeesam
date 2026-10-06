# -*- coding: utf-8 -*-
"""sy_site.site_id 를 8자리 → 7자리로 바꾼다 (2026-10-06).
   사용자 요청: "si_site 의 site_id 를 8자리에서 7자리로 바꿀수 있을까? SI260001 가 SI26001 가 되는거지"
              → "테스트포트와 맞추기위해서 그러는거야 이왕이면 해줘" → "DB 데이타들 찾아서 다 바꿔줘야해".

   규칙: 'SI' + 연도 2자리 + 순번 3자리.  SI260001 → SI26001, …, SI260017 → SI26017  (순번 4자리의 맨 앞 '0' 을 뺀다)
         순번이 1000 이상인 사이트가 있으면(앞 자리가 0 이 아님) 3자리로 못 줄이므로 중단한다.
         새 사이트는 백엔드 SySiteService.nextSiteId() 가 SI + 올해 + 다음 순번(3자리)으로 만든다(코드 같이 배포).

   바꾸는 곳 — 컬럼 이름이 아니라 **값**으로 찾는다(2026-10-06 사용자 "DB 데이타들 찾아서 다 바꿔줘야해")
     ① shopjoy_2604 의 모든 테이블(zz_* 백업·뷰 제외)에서 문자열(varchar/text/char)·JSON(json/jsonb) 컬럼 중
        옛 사이트 ID 가 들어 있는 값 — site_id·reg_site_id 처럼 값이 ID 하나인 칸, 그리고 ID 가 문장·경로·JSON 안에 섞인 칸
        (예: CDN 경로 SI26/SI260001_ec1/design/…, sy_prop 값, config_json, 대시보드 설정, 콤마 목록)
        — sy_site.site_id(PK) 포함. 값 앞뒤가 영숫자인 경우(다른 번호의 일부)는 건드리지 않는다.
     ② 컬럼 기본값(DEFAULT 'SI260001'::character varying 등)
     ③ 함수·뷰·제약 정의 안의 리터럴은 바꾸지 않고 **있으면 알려만 준다**(dry 에서 확인 — 있으면 사람이 판단)
     ④ 접속·오류 로그(syh_access_log, syh_access_error_log)는 이력이라 기본은 그대로 둔다. 같이 바꾸려면 --include-logs
   파일(CDN) 폴더 이름은 DB 가 아니라 NAS 의 파일이다 — 별도 단계(SI26/SI260001_ec1 → SI26/SI26001_ec1, README 의 CDN 절차).

   실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일에 적지 않는다)
     python sitefix_20261006_site_id_7.py dry                 # 계획만: 매핑·대상 컬럼·행 수·기본값·정의 속 리터럴 출력, 변경 없음
     python sitefix_20261006_site_id_7.py run                 # 백업 스키마(shopjoy_2604_bak_site7_20261006) 만든 뒤 한 트랜잭션으로 적용
     python sitefix_20261006_site_id_7.py revert              # 되돌리기: 7자리 → 8자리 역치환 + 기본값 원복
     (옵션) --include-logs  접속·오류 로그도 포함
   PowerShell 예)
     $env:DB_PASSWORD='…'; python C:\\_pjt_github\\p2604_modunuri_illeesam\\ec_v26\\shopjoy_v260406\\_doc\\ddl_pgsql\\sitefix_20261006_site_id_7.py dry

   ⚠ 순서(어기면 사이트 화면·API 가 깨진다): ① dry 확인 → ② 백엔드(ecBeBo) 새 코드 준비(배포는 ③ 직후) →
      ③ run → ④ ecBeBo·ecBeCdn·FO·BO·앱 코드 배포 + ecBeBo 재기동(SiteRegistry 캐시) → ⑤ CDN 폴더 이름 변경 → ⑥ 다시 로그인(JWT 의 siteId 가 옛 값).
      ③ 과 ④ 사이에는 옛 코드가 새 ID 를 모른다 — 가능한 한 짧게.
"""
import os, re, sys
import psycopg2

args = [a for a in sys.argv[1:] if not a.startswith("--")]
MODE = args[0] if args else "dry"
INCLUDE_LOGS = "--include-logs" in sys.argv
if MODE not in ("dry", "run", "revert"):
    sys.exit("사용법: python sitefix_20261006_site_id_7.py dry|run|revert [--include-logs]")
try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass
S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_site7_20261006"
OLD_RE = re.compile(r"^SI26(\d{4})$")      # SI260001
LOG_TABLES = {"syh_access_log", "syh_access_error_log"}
TEXT_TYPES = ("character varying", "text", "character")
JSON_TYPES = ("json", "jsonb")

conn = psycopg2.connect(host="illeesam.synology.me", port=17632, dbname="postgres", user="postgres",
                        password=os.environ["DB_PASSWORD"], connect_timeout=10)
conn.autocommit = False
cur = conn.cursor()
def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall() if cur.description else None

# ── 1) 매핑 ──────────────────────────────────────────────────────────────
if MODE == "revert":
    if not q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name='_sitemap'", (BAK,)):
        sys.exit(f"백업 매핑표 {BAK}._sitemap 이 없습니다 — run 을 한 적이 없거나 백업 스키마가 지워졌습니다.")
    pairs = [(new, old) for old, new in q(f"SELECT old_id, new_id FROM {BAK}._sitemap ORDER BY 1")]
else:
    ids = [r[0] for r in q(f"SELECT site_id FROM {S}.sy_site ORDER BY 1")]
    olds = [i for i in ids if OLD_RE.match(i)]
    bad = [i for i in olds if OLD_RE.match(i).group(1)[0] != "0"]
    if bad:
        sys.exit(f"순번이 1000 이상이라 3자리로 못 줄이는 사이트가 있습니다: {bad}")
    pairs = [(o, "SI26" + o[5:]) for o in olds]        # SI260001 → SI26 + 001
    news = [n for _, n in pairs]
    if len(set(news)) != len(news):
        sys.exit(f"새 ID 가 겹칩니다: {news}")
    clash = set(news) & set(ids)
    if clash:
        sys.exit(f"새 ID 가 이미 sy_site 에 있습니다: {sorted(clash)}")
    others = [i for i in ids if i not in olds]
    if others:
        print(f"[참고] 규칙 밖 사이트 ID {len(others)}개는 그대로 둠: {others}")
if not pairs:
    sys.exit("바꿀 사이트 ID 가 없습니다 (이미 적용됐을 수 있음).")
src_ids = [a for a, _ in pairs]
pmap = dict(pairs)
print(f"[매핑] {len(pairs)}개 ({MODE})")
for a, b in pairs:
    print(f"   {a} → {b}")

# 값 안의 ID 를 찾는 정규식 — 앞뒤가 영숫자(다른 번호의 일부)이면 제외. 옛 ID 만(실제 사이트) 대상.
# run: SI260(NNN) → SI26\1   revert: SI26(NNN) → SI260\1
if MODE == "revert":
    suffixes = "|".join(sorted(re.escape(a[4:]) for a in src_ids))
    FIND = rf"(?<![0-9A-Za-z])SI26({suffixes})(?![0-9])"
    REPL = r"SI260\1"
else:
    suffixes = "|".join(sorted(re.escape(a[5:]) for a in src_ids))
    FIND = rf"(?<![0-9A-Za-z])SI260({suffixes})(?![0-9])"
    REPL = r"SI26\1"

# ── 2) 대상 컬럼 ──────────────────────────────────────────────────────────
cols = q("""SELECT c.table_name, c.column_name, c.data_type FROM information_schema.columns c
              JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
             WHERE c.table_schema=%s AND c.table_name NOT LIKE 'zz%%'
               AND (c.data_type = ANY(%s) OR c.data_type = ANY(%s))
               AND COALESCE(c.is_generated,'NEVER') <> 'ALWAYS'
             ORDER BY 1, 2""", (S, list(TEXT_TYPES), list(JSON_TYPES)))
skipped_logs = []
plan, total = [], 0
for t, c, dt in cols:
    if t in LOG_TABLES and not INCLUDE_LOGS:
        skipped_logs.append((t, c)); continue
    n = q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}"::text ~ %s', (FIND,))[0][0]
    if n:
        plan.append((t, c, dt, n)); total += n

# 컬럼 기본값: 'SI260001'::character varying / ::text 형태에서 매핑 대상 ID 를 쓰는 것
defaults = []
for t, c, d in q("""SELECT c.table_name, c.column_name, c.column_default FROM information_schema.columns c
                     JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                    WHERE c.table_schema=%s AND c.column_default IS NOT NULL ORDER BY 1, 2""", (S,)):
    m = re.match(r"^'([^']*)'::(character varying|text|bpchar)$", d or "")
    if m and m.group(1) in pmap:
        defaults.append((t, c, m.group(1), pmap[m.group(1)], m.group(2)))

# 정의 속 리터럴(바꾸지 않고 알려만 준다): 함수·뷰·제약·인덱스
likes = "(" + "|".join(src_ids) + ")"
defs = []
for kind, name, df in (
    q("SELECT 'function', p.proname, pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=%s AND p.prokind='f'", (S,)) +
    q("SELECT 'view', viewname, definition FROM pg_views WHERE schemaname=%s", (S,)) +
    q("SELECT 'constraint', conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE connamespace=(SELECT oid FROM pg_namespace WHERE nspname=%s)", (S,)) +
    q("SELECT 'index', indexname, indexdef FROM pg_indexes WHERE schemaname=%s", (S,))):
    if df and re.search(likes, df):
        defs.append((kind, name))

print(f"[값] 문자열·JSON 컬럼 {len(cols)}개 중 옛 ID 가 든 {len(plan)}개, 행 합계 {total:,}")
for t, c, dt, n in sorted(plan, key=lambda x: -x[3])[:25]:
    print(f"   {t}.{c} ({dt}): {n:,}")
if len(plan) > 25: print(f"   … 외 {len(plan) - 25}개")
if skipped_logs:
    print(f"[로그 제외] {len({t for t, _ in skipped_logs})}개 테이블({', '.join(sorted({t for t, _ in skipped_logs}))}) — 이력이라 그대로, 포함하려면 --include-logs")
print(f"[기본값] {len(defaults)}개 컬럼: " + ", ".join(sorted({f'{d[2]}→{d[3]}' for d in defaults})))
print(f"[정의 속 리터럴] {len(defs)}개" + (": " + ", ".join(f"{k}:{n}" for k, n in defs) + "  ← 자동으로 바꾸지 않음, 사람이 확인" if defs else " (없음)"))

if MODE == "dry":
    print("\n(dry) 변경하지 않았습니다. 적용하려면 run")
    conn.rollback(); sys.exit(0)

# ── 3) 적용 (한 트랜잭션) ──────────────────────────────────────────────────
try:
    if MODE == "run":
        q(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
        q(f"DROP TABLE IF EXISTS {BAK}.sy_site"); q(f"CREATE TABLE {BAK}.sy_site AS SELECT * FROM {S}.sy_site")
        q(f"DROP TABLE IF EXISTS {BAK}._sitemap"); q(f"CREATE TABLE {BAK}._sitemap (old_id varchar(21) PRIMARY KEY, new_id varchar(21) UNIQUE NOT NULL)")
        cur.executemany(f"INSERT INTO {BAK}._sitemap(old_id, new_id) VALUES (%s, %s)", pairs)
        q(f"DROP TABLE IF EXISTS {BAK}._sitedefault"); q(f"CREATE TABLE {BAK}._sitedefault (table_name text, column_name text, old_default text, new_default text, cast_type text)")
        cur.executemany(f"INSERT INTO {BAK}._sitedefault VALUES (%s, %s, %s, %s, %s)", defaults)
        q(f"DROP TABLE IF EXISTS {BAK}._changed"); q(f"CREATE TABLE {BAK}._changed (table_name text, column_name text, data_type text, before_rows int)")
        cur.executemany(f"INSERT INTO {BAK}._changed VALUES (%s, %s, %s, %s)", plan)
        print(f"[백업] {BAK}.sy_site, _sitemap, _sitedefault, _changed")
    q("SET LOCAL session_replication_role = replica")   # 트리거·제약 트리거 비활성(사이트 FK 는 없지만 안전하게)
    done = 0
    for t, c, dt, n in plan:
        if dt in JSON_TYPES:
            sql = f'UPDATE {S}."{t}" SET "{c}" = (regexp_replace("{c}"::text, %s, %s, \'g\'))::{dt} WHERE "{c}"::text ~ %s'
        else:
            sql = f'UPDATE {S}."{t}" SET "{c}" = regexp_replace("{c}", %s, %s, \'g\') WHERE "{c}" ~ %s'
        cur.execute(sql, (FIND, REPL, FIND))
        done += cur.rowcount
        print(f"   {t}.{c}: {cur.rowcount:,}")
    for t, c, a, b, ct in defaults:
        q(f"ALTER TABLE {S}.\"{t}\" ALTER COLUMN \"{c}\" SET DEFAULT '{b}'::{ct}")
    print(f"   [기본값] {len(defaults)}개 컬럼 변경")
    # 검증: 옛 값이 남아 있으면 롤백
    left = 0
    for t, c, dt, n in plan:
        left += q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}"::text ~ %s', (FIND,))[0][0]
    if left:
        raise RuntimeError(f"옛 ID 가 {left}건 남았습니다 — 롤백합니다")
    if MODE == "run":
        wrong = q(f"SELECT site_id FROM {S}.sy_site WHERE site_id = ANY(%s)", (src_ids,))
        if wrong:
            raise RuntimeError(f"sy_site 에 옛 ID 가 남았습니다: {wrong} — 롤백합니다")
    conn.commit()
    print(f"\n[완료] {MODE}: {done:,}행 + 기본값 {len(defaults)}개 변경, 커밋했습니다.")
    if MODE == "revert":
        print(f"   백업 스키마 {BAK} 는 남겨 둡니다(필요 없으면 DROP SCHEMA {BAK} CASCADE).")
    print("   다음: ecBeBo 재기동 → 코드 배포(ecBeBo/ecBeCdn/FO/BO/앱) → CDN 폴더 이름 변경 → 다시 로그인")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
