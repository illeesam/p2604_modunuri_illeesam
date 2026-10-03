# -*- coding: utf-8 -*-
"""sy_site.site_id 를 짧은 규칙으로 바꾼다 (2026-10-03).
   사용자 요청: "2604010000000001 를 SI260001 게 줄여줄수 있어" → "변경할게" → 권한 모드 "편집 전 확인"으로 바꾼 뒤 "계속진행해줘".

   규칙: 'SI' + 연도 2자리 + 순번 4자리.  2604010000000001 → SI260001, …, 2604010000000017 → SI260017
         (기존 ID 의 끝 4자리를 순번으로 쓴다. 새 사이트는 백엔드 SySiteService.nextSiteId() 가 SI + 올해 + 다음 순번으로 만든다)

   바꾸는 곳
     ① shopjoy_2604 의 모든 테이블(zz_* 백업·뷰 제외)의 site_id / reg_site_id 값 (2026-10-03 조회: 294개 컬럼, 160개 테이블, 약 27.7만 행)
        — sy_site.site_id(PK) 포함. 사이트 FK 제약은 없다(조회 0건). 함수·뷰·제약에는 사이트 ID 리터럴 없음(조회 0건).
     ② 컬럼 기본값(DEFAULT '2604010000000001') — 2026-10-03 조회: 68개 컬럼(dp_*, mb_*, od_*, pd_*, pm_*)
     ③ 설정·데이터 안에 ID 문자열이 들어간 텍스트 컬럼: sy_prop.prop_value(biz.site, app.auth.social.default-site-id),
        cm_dashboard_data.data_opts, zd_simul_log.detail_json  (접속·오류 로그 syh_access_log / syh_access_error_log 는 이력이라 그대로 둔다)

   실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일에 적지 않는다)
     python sitefix_20261003_site_id_short.py dry      # 계획만: 매핑·컬럼별 행 수·기본값·텍스트 대상 출력, 변경 없음
     python sitefix_20261003_site_id_short.py run      # 백업 스키마(shopjoy_2604_bak_site_20261003: sy_site 전체 + _sitemap + _sitedefault) 생성 후 한 트랜잭션으로 적용
     python sitefix_20261003_site_id_short.py revert   # 되돌리기: _sitemap 으로 SI… → 2604… 역치환 + 기본값 원복
   PowerShell 예)
     $env:DB_PASSWORD='…'; python C:\\_pjt_github\\p2604_modunuri_illeesam\\ec_v26\\shopjoy_v260406\\_doc\\ddl_pgsql\\sitefix_20261003_site_id_short.py dry

   적용 후: ecBeBo 재기동(SiteRegistry 메모리 캐시), 코드(ecBeBo/ecFeBo/ecFeFoNuxt4/z0scripts) 배포, 다시 로그인(JWT 의 siteId 가 옛 값).
"""
import os, re, sys
import psycopg2

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "run", "revert"):
    sys.exit("사용법: python sitefix_20261003_site_id_short.py dry|run|revert")
S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_site_20261003"
OLD_RE = re.compile(r"^260401\d{10}$")
TEXT_COLS = [("sy_prop", "prop_value"), ("cm_dashboard_data", "data_opts"), ("zd_simul_log", "detail_json")]

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
    pairs = [(o, "SI" + o[:2] + o[-4:]) for o in olds]   # 2604010000000001 → SI26 + 0001
    news = [n for _, n in pairs]
    if len(set(news)) != len(news):
        sys.exit(f"새 ID 가 겹칩니다: {news}")
    clash = set(news) & set(ids)
    if clash:
        sys.exit(f"새 ID 가 이미 sy_site 에 있습니다: {sorted(clash)}")
if not pairs:
    sys.exit("바꿀 사이트 ID 가 없습니다 (이미 적용됐을 수 있음).")
src_ids = [a for a, _ in pairs]
pmap = dict(pairs)
print(f"[매핑] {len(pairs)}개 ({MODE})")
for a, b in pairs:
    print(f"   {a} → {b}")

# ── 2) 대상 ───────────────────────────────────────────────────────────────
cols = q("""SELECT c.table_name, c.column_name FROM information_schema.columns c
              JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
             WHERE c.table_schema=%s AND c.column_name IN ('site_id','reg_site_id') AND c.table_name NOT LIKE 'zz%%'
             ORDER BY 1, 2""", (S,))
plan, total = [], 0
for t, c in cols:
    n = q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (src_ids,))[0][0]
    if n:
        plan.append((t, c, n)); total += n
# 컬럼 기본값: 'XXXX'::character varying 형태에서 매핑 대상 ID 를 쓰는 것
defaults = []
for t, c, d in q("""SELECT c.table_name, c.column_name, c.column_default FROM information_schema.columns c
                     JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                    WHERE c.table_schema=%s AND c.column_default IS NOT NULL ORDER BY 1, 2""", (S,)):
    m = re.match(r"^'([^']*)'::character varying$", d or "")
    if m and m.group(1) in pmap:
        defaults.append((t, c, m.group(1), pmap[m.group(1)]))
txt_plan = []
for t, c in TEXT_COLS:
    if not q("SELECT 1 FROM information_schema.columns WHERE table_schema=%s AND table_name=%s AND column_name=%s", (S, t, c)):
        continue
    n = q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}"::text ~ %s', ("(" + "|".join(src_ids) + ")",))[0][0]
    if n: txt_plan.append((t, c, n))
print(f"[값] site 컬럼 {len(cols)}개 중 값 있는 {len(plan)}개, 행 합계 {total:,}")
for t, c, n in sorted(plan, key=lambda x: -x[2])[:15]:
    print(f"   {t}.{c}: {n:,}")
if len(plan) > 15: print(f"   … 외 {len(plan) - 15}개")
print(f"[기본값] {len(defaults)}개 컬럼: " + ", ".join(sorted({f'{d[2]}→{d[3]}' for d in defaults})))
print(f"[텍스트] {txt_plan}")

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
        q(f"DROP TABLE IF EXISTS {BAK}._sitedefault"); q(f"CREATE TABLE {BAK}._sitedefault (table_name text, column_name text, old_default text, new_default text)")
        cur.executemany(f"INSERT INTO {BAK}._sitedefault VALUES (%s, %s, %s, %s)", defaults)
        print(f"[백업] {BAK}.sy_site, {BAK}._sitemap, {BAK}._sitedefault")
    q("CREATE TEMP TABLE _m (src varchar(21) PRIMARY KEY, dst varchar(21) NOT NULL) ON COMMIT DROP")
    cur.executemany("INSERT INTO _m(src, dst) VALUES (%s, %s)", pairs)
    q("SET LOCAL session_replication_role = replica")   # 트리거·제약 트리거 비활성(사이트 FK 는 없지만 안전하게)
    done = 0
    for t, c, n in plan:
        cur.execute(f'UPDATE {S}."{t}" x SET "{c}" = _m.dst FROM _m WHERE x."{c}" = _m.src')
        done += cur.rowcount
        print(f"   {t}.{c}: {cur.rowcount:,}")
    for t, c, a, b in defaults:
        q(f"ALTER TABLE {S}.\"{t}\" ALTER COLUMN \"{c}\" SET DEFAULT %s", (b,))
    print(f"   [기본값] {len(defaults)}개 컬럼 변경")
    for t, c, n in txt_plan:
        for a, b in pairs:
            cur.execute(f'UPDATE {S}."{t}" SET "{c}" = regexp_replace("{c}", %s, %s, %s) WHERE "{c}" LIKE %s',
                        (f"(?<![0-9A-Za-z]){a}(?![0-9])", b, "g", f"%{a}%"))
        print(f"   [텍스트] {t}.{c}")
    # 검증: 옛 ID 가 남아 있으면 롤백
    left = 0
    for t, c, n in plan:
        left += q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (src_ids,))[0][0]
    if left:
        raise RuntimeError(f"옛 ID 가 {left}건 남았습니다 — 롤백합니다")
    conn.commit()
    print(f"\n[완료] {MODE}: {done:,}행 + 기본값 {len(defaults)}개 변경, 커밋했습니다.")
    if MODE == "revert":
        print(f"   백업 스키마 {BAK} 는 남겨 둡니다(필요 없으면 DROP SCHEMA {BAK} CASCADE).")
    print("   다음: ecBeBo 재기동 → 코드 배포(ecBeBo/ecFeBo/ecFeFoNuxt4) → 다시 로그인")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
