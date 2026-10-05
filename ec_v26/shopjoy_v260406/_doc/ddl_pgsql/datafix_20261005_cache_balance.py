# -*- coding: utf-8 -*-
r"""
datafix_20261005_cache_balance.py — 클레임이 돌려준 캐시 중 "주문 때 빼지 않은 캐시" 점검과 회수 (2026-10-05, 정책 pm.03 §7·od.13)

  배경 (2026-10-05 금액 흐름 이전 버그)
    · 주문 생성이 화면이 보낸 캐시 사용액을 od_order.cache_use_amt 에 적기만 하고 회원 잔액(mb_member.cache_balance_amt)은 빼지 않았다.
    · 그런데 클레임 완료(OdClaimCompleteService)는 cache_use_amt × 비율(od_claim.refund_save_amt)을 회원 잔액에 더하고
      pm_cache(cache_type_cd='REFUND', ref_id=클레임ID, cache_desc '클레임(…) 완료 — 사용 적립금/캐시 복원') 을 남겼다 → 쓴 적 없는 캐시가 생겼다.
    · 2026-10-05 이후 주문은 선점 때 od_order_discnt(discnt_type_cd='CACHE_USE') 행을 남기고, 클레임은 그 행의 남은 금액 한도로만 돌려준다.

  점검 (dry·status — 읽기 전용)
    C1 잘못 늘어난 잔액 : 클레임이 만든 REFUND 원장 행(ref_id = od_claim.claim_id) 중 그 주문에 CACHE_USE 행이 없는 것 — 건수·금액·회원별
    C2 알림           : cache_use_amt > 0 인데 CACHE_USE 행이 없는 주문(주문 때 잔액을 빼지 않은 주문) — 건수·금액·상태
    C3 알림           : 회원 잔액(mb_member) ≠ 원장 합(pm_cache.cache_amt 합) 인 회원 수(시드 데이터는 원래 맞지 않는다 — 참고용)

  고치는 것 (run — 한 트랜잭션, 하나라도 어긋나면 전체 롤백)
    F1 C1 의 행마다 : mb_member.cache_balance_amt 에서 그 금액을 뺀다(원자적 감산 — 잔액이 모자라면 음수가 될 수 있어 알림),
                      pm_cache 에 회수 원장(cache_type_cd='ADMIN_ADJ', cache_amt = −금액, ref_id = 원래 REFUND 의 cache_id) 1행.
                      원래 REFUND 행과 od_refund·od_refund_method 이력은 지우지 않는다(무슨 일이 있었는지 남긴다).
    다시 실행해도 안전: 이미 회수 원장(ref_id = REFUND cache_id, ADMIN_ADJ)이 있는 행은 계획에 나오지 않는다.

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_cachefix_20261005
     _chg(바꾼 잔액: member_id, old_val, new_val, run_no) · _ins(넣은 회수 원장 cache_id) · _run(실행 이력)
     revert = 넣은 회수 원장 삭제 + 회원 잔액에 회수한 금액을 다시 더함(그 사이 잔액이 바뀌었어도 차이만 되돌린다), 백업 스키마 삭제

  적용 여부(status — 종료코드 0 = 고칠 것 없음, 3 = 고칠 것 남음)

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python datafix_20261005_cache_balance.py dry      # 읽기 전용 세션, SELECT 만
     python datafix_20261005_cache_balance.py status
     python datafix_20261005_cache_balance.py run
     python datafix_20261005_cache_balance.py revert

  2026-10-05 조회 결과(dry 와 같은 쿼리): C1 0건 · 0원(클레임 캐시 반환 이력 없음), C2 1건 · 5,000원(OR2610030037371192, 이미 CANCELLED) — 고칠 것 없음.
  백엔드 배포(클레임은 차감한 캐시만 반환) 전에 클레임이 완료되면 C1 이 생길 수 있어 배포 뒤 한 번 더 dry 로 확인한다.
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
BAK = "shopjoy_2604_bak_cachefix_20261005"
USAGE = "사용법: python datafix_20261005_cache_balance.py dry|status|run|revert"

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "status", "run", "revert") or len(sys.argv) > 2:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="datafix_20261005_cache_balance")
conn.set_client_encoding("UTF8")
if MODE in ("dry", "status"):
    conn.set_session(readonly=True, autocommit=True)    # 읽기 전용 — 쓰기를 시도하면 DB 가 거절한다
else:
    conn.autocommit = False
cur = conn.cursor()


def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall() if cur.description else None


def has_table(schema, name):
    return bool(q("SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (schema, name)))


bak_exists = has_table(BAK, "_run")

# ══════════════════════════════ revert ═══════════════════════════════════════
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"백업 {BAK}._run 이 없습니다 — run 을 한 적이 없습니다.")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        n_back = 0
        for member_id, old, new in q(f"SELECT member_id, old_val, new_val FROM {BAK}._chg ORDER BY run_no DESC, seq DESC"):
            cur.execute(f"UPDATE {S}.mb_member SET cache_balance_amt = coalesce(cache_balance_amt, 0) + %s, upd_by = 'DATAFIX', upd_date = now() WHERE member_id = %s",
                        (int(old) - int(new), member_id))
            n_back += cur.rowcount
        cur.execute(f"DELETE FROM {S}.pm_cache WHERE cache_id IN (SELECT cache_id FROM {BAK}._ins)")
        print(f"   회원 잔액 {n_back:,}건 되돌림, 회수 원장 {cur.rowcount:,}행 삭제")
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert — 커밋했습니다. 백업 스키마 {BAK} 삭제")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ══════════════════════════ 점검 + 계획 (dry / status / run 공통) ══════════════
# C1 — 클레임이 돌려준 캐시 중 주문 때 빼지 않은 것(회수 원장이 아직 없는 것)
C1 = q(f"""
SELECT c.cache_id, c.member_id, c.site_id, c.cache_amt, c.ref_id AS claim_id, cl.order_id, c.reg_date
  FROM {S}.pm_cache c
  JOIN {S}.od_claim cl ON cl.claim_id = c.ref_id
 WHERE c.cache_type_cd = 'REFUND' AND coalesce(c.cache_amt, 0) > 0
   AND NOT EXISTS (SELECT 1 FROM {S}.od_order_discnt d WHERE d.order_id = cl.order_id AND d.discnt_type_cd = 'CACHE_USE')
   AND NOT EXISTS (SELECT 1 FROM {S}.pm_cache x WHERE x.ref_id = c.cache_id AND x.cache_type_cd = 'ADMIN_ADJ')
 ORDER BY c.reg_date""")
# C2 — 캐시를 썼다고 적혔지만 잔액을 빼지 않은 주문
C2 = q(f"""
SELECT o.order_id, o.member_id, o.site_id, o.order_status_cd, o.cache_use_amt, o.reg_date
  FROM {S}.od_order o
 WHERE coalesce(o.cache_use_amt, 0) > 0
   AND NOT EXISTS (SELECT 1 FROM {S}.od_order_discnt d WHERE d.order_id = o.order_id AND d.discnt_type_cd = 'CACHE_USE')
 ORDER BY o.reg_date""")
# C3 — 회원 잔액 ≠ 원장 합 (참고)
C3 = q(f"""
SELECT count(*) FROM (
  SELECT m.member_id FROM {S}.mb_member m JOIN {S}.pm_cache c ON c.member_id = m.member_id
   GROUP BY m.member_id, m.cache_balance_amt HAVING coalesce(m.cache_balance_amt, 0) <> sum(coalesce(c.cache_amt, 0))) z""")[0][0]

by_member = collections.Counter()
for _, member_id, _, amt, *_ in C1: by_member[member_id] += amt
todo = len(C1)

if MODE in ("dry", "run"):
    print(f"■ C1 잘못 늘어난 잔액(클레임이 돌려줬지만 주문 때 빼지 않은 캐시): {len(C1):,}건 · {sum(r[3] for r in C1):,}원 · 회원 {len(by_member):,}명")
    for cid, member_id, site_id, amt, claim_id, order_id, reg in C1[:20]:
        print(f"   {cid}  회원 {member_id} ({site_id})  {amt:>10,}원  클레임 {claim_id}  주문 {order_id}  {reg:%Y-%m-%d %H:%M}")
    if len(C1) > 20: print(f"   … 외 {len(C1) - 20:,}건")
    for m, amt in by_member.most_common(10):
        bal = q(f"SELECT coalesce(cache_balance_amt, 0) FROM {S}.mb_member WHERE member_id = %s", (m,))
        b = bal[0][0] if bal else None
        print(f"   회원 {m}: 회수 {amt:,}원 / 지금 잔액 {b if b is None else format(b, ',')}원" + ("  ← 회수하면 음수(이미 썼음)" if b is not None and b < amt else ""))
    print(f"\n■ C2 (알림) 캐시를 썼다고 적혔지만 잔액을 빼지 않은 주문: {len(C2):,}건 · {sum(r[4] for r in C2):,}원")
    for oid, member_id, site_id, st, amt, reg in C2[:20]:
        print(f"   {oid}  회원 {member_id} ({site_id})  {st:<10} {amt:>10,}원  {reg:%Y-%m-%d %H:%M}")
    print(f"\n■ C3 (참고) 회원 잔액 ≠ 원장 합인 회원: {C3:,}명 (시드 데이터는 원래 맞지 않는다 — 이 스크립트는 고치지 않는다)")

if MODE == "status":
    print(f"백업 스키마 {BAK}: {'있음(run 한 적 있음)' if bak_exists else '없음'}")
    print(f"C1 남은 것 {len(C1):,}건 · {sum(r[3] for r in C1):,}원 / C2 알림 {len(C2):,}건")
    print("고칠 것 없음" if not todo else f"고칠 것 {todo:,}건 남음")
    sys.exit(0 if not todo else 3)

if MODE == "dry":
    print(f"\n[dry] 회수 계획 {len(C1):,}건 · {sum(r[3] for r in C1):,}원 — 아무것도 바꾸지 않았습니다. 적용: python datafix_20261005_cache_balance.py run")
    sys.exit(0)

# ══════════════════════════════ run ══════════════════════════════════════════
if not todo:
    print("고칠 것이 없습니다 — 아무것도 바꾸지 않았습니다."); sys.exit(0)
try:
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_no serial PRIMARY KEY, run_at timestamp DEFAULT now(), rows int, amt bigint)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._chg (seq bigserial PRIMARY KEY, run_no int, member_id text, old_val text, new_val text)")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._ins (seq bigserial PRIMARY KEY, run_no int, cache_id text)")
    cur.execute(f"INSERT INTO {BAK}._run (rows, amt) VALUES (%s, %s) RETURNING run_no", (len(C1), sum(r[3] for r in C1)))
    run_no = cur.fetchone()[0]
    for i, (cid, member_id, site_id, amt, claim_id, order_id, _) in enumerate(C1):
        cur.execute(f"SELECT coalesce(cache_balance_amt, 0) FROM {S}.mb_member WHERE member_id = %s FOR UPDATE", (member_id,))
        row = cur.fetchone()
        if row is None: raise RuntimeError(f"회원 {member_id} 가 없습니다")
        old = row[0]
        cur.execute(f"UPDATE {S}.mb_member SET cache_balance_amt = coalesce(cache_balance_amt, 0) - %s, upd_by = 'DATAFIX', upd_date = now() WHERE member_id = %s",
                    (amt, member_id))
        new = old - amt
        new_id = f"CF{run_no:03d}{i:06d}"[:21]
        cur.execute(f"""INSERT INTO {S}.pm_cache (cache_id, site_id, member_id, cache_type_cd, cache_amt, balance_amt, ref_id, cache_desc, proc_user_id, cache_date, reg_by, reg_date, upd_by, upd_date)
                        VALUES (%s, %s, %s, 'ADMIN_ADJ', %s, %s, %s, %s, 'DATAFIX', now(), 'DATAFIX', now(), 'DATAFIX', now())""",
                    (new_id, site_id, member_id, -amt, new, cid, f"보정: 클레임 {claim_id} 이 주문 때 빼지 않은 캐시를 돌려준 것 회수(주문 {order_id})"[:200]))
        cur.execute(f"INSERT INTO {BAK}._chg (run_no, member_id, old_val, new_val) VALUES (%s, %s, %s, %s)", (run_no, member_id, str(old), str(new)))
        cur.execute(f"INSERT INTO {BAK}._ins (run_no, cache_id) VALUES (%s, %s)", (run_no, new_id))
        print(f"   {member_id}: {old:,} → {new:,} (회수 {amt:,}원, 원래 {cid})" + ("  ← 음수" if new < 0 else ""))
    conn.commit()
    print(f"[완료] run #{run_no} — 커밋했습니다. 되돌리기: python datafix_20261005_cache_balance.py revert  (백업 {BAK})")
except Exception as e:
    conn.rollback(); print(f"[실패] 롤백했습니다 — 아무것도 바뀌지 않았습니다: {e}"); sys.exit(1)
