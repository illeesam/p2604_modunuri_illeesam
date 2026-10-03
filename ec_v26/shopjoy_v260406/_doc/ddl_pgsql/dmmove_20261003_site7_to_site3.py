# -*- coding: utf-8 -*-
"""danmoo1(당근 스타일) 모듈의 사이트를 7 → 3 으로 옮긴다 (2026-10-03).
   사용자 요청: "danmoo1 값 2604010000000003 에 danmoo1 로 옮기면 좋겠는데 관련정보 다 수정해주고".
   사이트 ID 단축(sitefix_20261003_site_id_short.py) 뒤에 실행한다 — SI260007 → SI260003. (단축 전이면 2604010000000007 → …0003 으로 동작)

   하는 일
     1) 사전 점검: 사이트 3 에 sy_site 를 뺀 어떤 테이블에도 데이터가 없어야 한다(2026-10-03 조회 0건). 사이트 7 의 FO 모듈이 danmoo1 이어야 한다.
     2) sy_site: 3 ← 7 의 tenant_module·site_type_cd·site_nm·site_domain·site_desc·logo_url·favicon_url.
                 7 은 tenant_module 해제 + 이름 뒤에 " (→site3 이전됨)". (행 삭제·상태 변경 없음)
     3) sy_site 를 뺀 모든 테이블(zz_*·뷰 제외)의 site_id / reg_site_id 7 → 3
     4) …@danmoo.com 회원 중 site_id 가 3 이 아닌 것(dm_user1 — 가입 사이트 보정 전에 만든 행) → 3
   백업: 스키마 shopjoy_2604_bak_dmmove_20261003 (sy_site 두 행 스냅샷, 회원 사이트 변경 목록)

   실행 (DB_PASSWORD 는 일회성 환경변수로만)
     python dmmove_20261003_site7_to_site3.py dry | run | revert
     revert = 3 → 7 로 되돌리고 sy_site 두 행·회원 사이트를 백업값으로 복원(이전 뒤 사이트 3 에 새로 생긴 데이터도 7 로 간다)
   적용 후: ecBeBo 재기동(SiteRegistry 캐시).
"""
import os, sys
import psycopg2

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "run", "revert"):
    sys.exit("사용법: python dmmove_20261003_site7_to_site3.py dry|run|revert")
S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_dmmove_20261003"
SITE_COLS = ["tenant_module", "site_type_cd", "site_nm", "site_domain", "site_desc", "logo_url", "favicon_url"]

conn = psycopg2.connect(host="illeesam.synology.me", port=17632, dbname="postgres", user="postgres",
                        password=os.environ["DB_PASSWORD"], connect_timeout=10)
conn.autocommit = False
cur = conn.cursor()
def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall() if cur.description else None

ids = {r[0] for r in q(f"SELECT site_id FROM {S}.sy_site")}
if {"SI260003", "SI260007"} <= ids:
    S3, S7 = "SI260003", "SI260007"
elif {"2604010000000003", "2604010000000007"} <= ids:
    S3, S7 = "2604010000000003", "2604010000000007"
else:
    sys.exit("sy_site 에 사이트 3·7 이 없습니다.")
SRC, DST = (S7, S3) if MODE != "revert" else (S3, S7)
print(f"[대상] {MODE}: {SRC} → {DST}")

cols = q("""SELECT c.table_name, c.column_name FROM information_schema.columns c
              JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
             WHERE c.table_schema=%s AND c.column_name IN ('site_id','reg_site_id') AND c.table_name NOT LIKE 'zz%%' AND c.table_name <> 'sy_site'
             ORDER BY 1, 2""", (S,))
def counts(site):
    out = []
    for t, c in cols:
        n = q(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = %s', (site,))[0][0]
        if n: out.append((t, c, n))
    return out

site_rows = {r[0]: r[1:] for r in q(f"SELECT site_id, {', '.join(SITE_COLS)} FROM {S}.sy_site WHERE site_id IN (%s, %s)", (S3, S7))}
print(f"[sy_site] {S7}: {dict(zip(SITE_COLS, site_rows[S7]))}")
print(f"[sy_site] {S3}: {dict(zip(SITE_COLS, site_rows[S3]))}")
move = counts(SRC)
print(f"[옮길 데이터] {len(move)}개 컬럼, {sum(n for *_, n in move):,}행")
for t, c, n in move:
    print(f"   {t}.{c}: {n:,}")
if MODE != "revert":
    dst_existing = counts(DST)
    if dst_existing:
        sys.exit(f"사이트 {DST} 에 이미 데이터가 있습니다 — 중단합니다: {dst_existing}")
    if site_rows[S7][0] != "danmoo1":
        sys.exit(f"사이트 {S7} 의 FO 모듈이 danmoo1 이 아닙니다({site_rows[S7][0]}) — 이미 옮겼을 수 있습니다.")
    members = q(f"SELECT member_id, site_id FROM {S}.mb_member WHERE login_id LIKE %s AND site_id <> %s AND site_id <> %s", ("%@danmoo.com", S7, S3))
    print(f"[회원 보정] @danmoo.com 이면서 다른 사이트에 있는 회원: {members}")
else:
    if not q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name='sy_site_rows'", (BAK,)):
        sys.exit(f"백업 {BAK}.sy_site_rows 가 없습니다 — run 을 한 적이 없습니다.")
    members = q(f"SELECT member_id, old_site_id FROM {BAK}._member_site")
    print(f"[회원 복원] {members}")

if MODE == "dry":
    print("\n(dry) 변경하지 않았습니다. 적용하려면 run")
    conn.rollback(); sys.exit(0)

try:
    q("SET LOCAL session_replication_role = replica")
    if MODE == "run":
        q(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
        q(f"DROP TABLE IF EXISTS {BAK}.sy_site_rows"); q(f"CREATE TABLE {BAK}.sy_site_rows AS SELECT * FROM {S}.sy_site WHERE site_id IN (%s, %s)", (S3, S7))
        q(f"DROP TABLE IF EXISTS {BAK}._member_site"); q(f"CREATE TABLE {BAK}._member_site (member_id varchar(21) PRIMARY KEY, old_site_id varchar(21))")
        cur.executemany(f"INSERT INTO {BAK}._member_site VALUES (%s, %s)", members)
        print(f"[백업] {BAK}.sy_site_rows, {BAK}._member_site")
        # sy_site: 3 ← 7 의 모듈·이름 등, 7 은 모듈 해제
        sets = ", ".join(f"{c} = o.{c}" for c in SITE_COLS)
        q(f"UPDATE {S}.sy_site s SET {sets}, upd_by='MIGRATION', upd_date=now() FROM {S}.sy_site o WHERE s.site_id=%s AND o.site_id=%s", (S3, S7))
        q(f"UPDATE {S}.sy_site SET tenant_module=NULL, site_nm = site_nm || ' (→site3 이전됨)', upd_by='MIGRATION', upd_date=now() WHERE site_id=%s", (S7,))
    else:
        # sy_site 두 행을 백업값으로 복원
        sets = ", ".join(f"{c} = b.{c}" for c in SITE_COLS)
        q(f"UPDATE {S}.sy_site s SET {sets}, upd_by='MIGRATION', upd_date=now() FROM {BAK}.sy_site_rows b WHERE s.site_id=b.site_id")
    done = 0
    for t, c, n in move:
        cur.execute(f'UPDATE {S}."{t}" SET "{c}" = %s WHERE "{c}" = %s', (DST, SRC))
        done += cur.rowcount
        print(f"   {t}.{c}: {cur.rowcount:,}")
    for mid, site in members:
        q(f"UPDATE {S}.mb_member SET site_id=%s, upd_by='MIGRATION', upd_date=now() WHERE member_id=%s", (S3 if MODE == "run" else site, mid))
    left = counts(SRC)
    if left:
        raise RuntimeError(f"{SRC} 데이터가 남았습니다: {left}")
    conn.commit()
    print(f"\n[완료] {MODE}: {done:,}행 이동, 회원 {len(members)}명 보정, sy_site 갱신 — 커밋했습니다. ecBeBo 재기동 필요(SiteRegistry 캐시).")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다: {e}")
    sys.exit(1)
