# -*- coding: utf-8 -*-
r"""
datafix_20261005_prod_structure.py — 상품 구조 전수 점검과 보정 (2026-10-05, 정책 sy.57 "상품 구조 기준과 보정")

  "올바른 상품 구조" 기준 (백엔드·FO·BO 코드 기준 — 실제 컬럼은 실행 시점의 DB 를 읽는다)
    · pd_prod      : site_id 로 사이트 구분, 정가(std_price) ≥ 판매가(sale_price) > 0, sale_discnt_amt = 정가 − 판매가, sale_discnt_rate = 할인율(%)
                     옵션 상품이면 prod_opt1_type_cd(/prod_opt2_type_cd) 가 있고, 옵션이 없으면 비어 있다. 상태·유형은 공통코드(PROD_STATUS_CD·PROD_TYPE_CD)
    · pd_prod_opt  : 옵션값 행(색상·사이즈 칩). prod_opt_type_level = 1|2 로 단을 구분(옵션 그룹 테이블은 따로 없다)
    · pd_prod_sku  : 옵션 조합별 단품. prod_opt1_id = 같은 상품의 1단 옵션값, prod_opt2_id = 같은 상품의 2단 옵션값, 조합은 상품 안에서 유일
                     sku_code(전체 유니크, 관례 <상품ID>-NNN — NNN 은 (1단 순서, 2단 순서) 차례), add_price, stock_qty, sale_count, use_yn
                     옵션이 없는 단품(SINGLE)은 기본 SKU 1개(옵션 참조 없음, <상품ID>-001) — 재고 차감·장바구니 수량 확인이 SKU 기준이라서
    · pd_prod_img  : 1장 이상, 대표(is_thumb='Y') 1장. prod_opt1_id/prod_opt2_id 는 같은 상품의 옵션값 ID(FO 가 색상 선택 ↔ 이미지를 ID 로 맞춘다) 또는 빈 값(공통)
    · 그 밖        : 카테고리는 같은 사이트의 것, 판매자는 그 사이트에 연결(sl_seller_site), 딸린 행의 site_id = 상품의 site_id, 상품 없는 딸린 행(고아) 없음

  고치는 것 (run — 한 트랜잭션, 하나라도 어긋나면 전체 롤백)
    F1 SKU 옵션 참조   : 없는 옵션값을 가리키거나 비어 있는 SKU → sku_code 끝 번호(NNN) 순서로 지금의 옵션값에 다시 연결
                         (옵션 저장이 옵션값 ID 를 새로 만들면서 SKU 가 옛 ID 를 물고 있던 것. 옛 ID 끝자리의 (그룹, 순번)과도 맞는지 교차 확인)
    F2 이미지 옵션 참조 : 옵션값 ID 대신 표준코드(VAL_COLOR_WHITE 등)·옛 옵션값 ID 가 든 것 → 같은 상품의 옵션값 ID.
                         ec2 복사본에서 끊긴 참조라 비워진 것은 ec1 원본의 연결을 같은 자리(단, 순번)의 복사본 옵션값으로 되살린다
    F3 대표 이미지     : 이미지는 있는데 대표가 없는 상품 → 공통(옵션 무관) 이미지 중 맨 앞(없으면 전체 중 맨 앞)을 대표로
    F4 단품 기본 SKU   : SKU 가 없는 단품(SINGLE) → 기본 SKU 1개 추가(추가금 0, 재고 100, <상품ID>-001, ID = PRS + yyMMddHHmmss + 4자리)
    F5 할인 금액·율    : 비어 있는 sale_discnt_amt / sale_discnt_rate → 정가·판매가로 계산해 채움
    F6 빈 문자열 참조   : pd_prod 의 dliv_tmplt_id·brand_id·vendor_id·md_user_id·prod_code = '' → NULL (이미지의 옵션 참조 '' 는 BO 관례라 그대로)
    ※ 사이트 제외: SI260004(homepg1 — 0원 = "별도 문의", SKU 없이 문의만 받는 구조)는 F4·F5 에서 뺀다. `--skip-site` 로 바꿀 수 있다.
    ※ 가격이 비었거나 0 인 상품은 여기서 채우지 않는다 — BO 상품 수정 API 로 16건을 채웠다(2026-10-05). 남아 있으면 점검 표에만 나온다.

  고치지 않고 알리기만 하는 것(삭제·판단이 필요한 것)
    상품 없는 딸린 행(pd_prod_content·pd_prod_tag·pd_prod_rel …), 없는 브랜드를 가리키는 상품, 공통코드에 없는 상태값, 재고가 있는데 품절 표시인 상품,
    이미지가 한 장도 없는 상품, 없는 SKU 를 가리키는 주문 품목, 규칙으로 풀 수 없는 SKU·이미지 참조

  백업·되돌리기: 백업 스키마 shopjoy_2604_bak_prodfix_20261005
     _chg(바꾼 값: tbl, pk, col, old_val, new_val, fix, run_no) · _ins(추가한 행: tbl, pk, fix, run_no) · _run(실행 이력)
     revert = _chg 의 값을 이전 값으로(그 뒤 값이 또 바뀐 것은 건드리지 않고 알림), _ins 의 SKU 삭제(장바구니·주문이 쓰고 있으면 중단, `--force` 면 그 행만 남김), 백업 스키마 삭제
  다시 실행해도 안전: 계획은 매번 지금 상태에서 다시 만든다 — 이미 고친 것은 계획에 나오지 않고, 새로 생긴 위반만 같은 백업 스키마에 이어서 기록한다.

  적용 여부(status — 종료코드 0 = 고칠 것 없음, 3 = 고칠 것 남음)

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python datafix_20261005_prod_structure.py dry      # 읽기 전용 세션, SELECT 만 — 사이트별 점검 표·보정 계획·표본
     python datafix_20261005_prod_structure.py status
     python datafix_20261005_prod_structure.py run
     python datafix_20261005_prod_structure.py revert [--force]
     공통 선택: --skip-site SI260004[,…]   --stock N(기본 SKU 재고, 기본 100)
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
BAK = "shopjoy_2604_bak_prodfix_20261005"
EMAP = "shopjoy_2604_map_ec2copy_20261004"      # ec2 상품 복사 매핑(원본 ID → 복사본 ID) — F2 의 복사본 이미지 되살리기에 쓴다
FIXBY = "DATAFIX_20261005"
USAGE = "사용법: python datafix_20261005_prod_structure.py dry|status|run|revert [--skip-site SI260004,…] [--stock N] [--force]"

ARGS = sys.argv[1:]
MODE = ARGS[0] if ARGS else "dry"
SKIP_SITES, BASE_STOCK, FORCE = {"SI260004"}, 100, False
try:
    i = 1
    while i < len(ARGS):
        if ARGS[i] == "--force": FORCE = True
        elif ARGS[i] == "--skip-site": SKIP_SITES = {x for x in ARGS[i + 1].split(",") if x}; i += 1
        elif ARGS[i] == "--stock": BASE_STOCK = int(ARGS[i + 1]); i += 1
        else: raise ValueError(ARGS[i])
        i += 1
except (ValueError, IndexError):
    sys.exit(USAGE)
if MODE not in ("dry", "status", "run", "revert"):
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="datafix_20261005_prod_structure")
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


coltype = {(t, c): dt for t, c, dt in q("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema=%s", (S,))}
bak_exists = has_table(BAK, "_chg")
PK = {"pd_prod": "prod_id", "pd_prod_sku": "prod_sku_id", "pd_prod_img": "prod_img_id"}

# ══════════════════════════════ revert ═══════════════════════════════════════
if MODE == "revert":
    if not bak_exists:
        sys.exit(f"백업 {BAK}._chg 가 없습니다 — run 을 한 적이 없습니다.")
    try:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        ins = q(f"SELECT pk FROM {BAK}._ins WHERE tbl='pd_prod_sku'")
        ids = [r[0] for r in ins]
        used = []
        for t, c in sorted(coltype):
            if c.endswith("sku_id") and t != "pd_prod_sku" and not t.startswith(("zz", "v_")) and has_table(S, t):
                n = q1(f'SELECT count(*) FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (ids,))
                if n: used.append((t, c, n))
        keep = set()
        if used:
            print("   추가한 기본 SKU 를 쓰는 데이터: " + ", ".join(f"{t}.{c} {n}행" for t, c, n in used))
            if not FORCE:
                conn.rollback(); sys.exit("[중단] 추가한 SKU 를 장바구니·주문 등이 쓰고 있습니다 — 그래도 되돌리려면 revert --force (쓰이는 SKU 는 남깁니다)")
            for t, c, _ in used:
                keep |= {r[0] for r in q(f'SELECT DISTINCT "{c}" FROM {S}."{t}" WHERE "{c}" = ANY(%s)', (ids,))}
        cur.execute(f"DELETE FROM {S}.pd_prod_sku WHERE prod_sku_id = ANY(%s)", ([x for x in ids if x not in keep],))
        print(f"   pd_prod_sku: 추가했던 기본 SKU {cur.rowcount:,}행 삭제" + (f" (쓰이는 {len(keep)}행은 남김)" if keep else ""))
        done, skipped = collections.Counter(), collections.Counter()
        # 같은 칸을 여러 번 바꿨으면 나중 것부터 거꾸로
        for tbl, pk, col, old, new in q(f"SELECT tbl, pk, col, old_val, new_val FROM {BAK}._chg ORDER BY run_no DESC, seq DESC"):
            cast = "numeric" if coltype[(tbl, col)] in ("numeric", "bigint", "integer") else "text"
            cur.execute(f'UPDATE {S}."{tbl}" SET "{col}" = CAST(%s AS {coltype[(tbl, col)]}) WHERE "{PK[tbl]}" = %s AND "{col}"::{cast} IS NOT DISTINCT FROM %s::{cast}',
                        (old, pk, new))
            (done if cur.rowcount else skipped)[f"{tbl}.{col}"] += 1
        for k, n in done.items(): print(f"   {k}: {n:,}칸 이전 값으로")
        for k, n in skipped.items(): print(f"   (알림) {k}: {n:,}칸은 그 뒤 값이 또 바뀌어 건드리지 않음")
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[완료] revert — 커밋했습니다. 백업 스키마 {BAK} 삭제")
    except Exception as e:
        conn.rollback(); print(f"[실패] 롤백했습니다: {e}"); sys.exit(1)
    sys.exit(0)

# ══════════════════════════ 점검 + 계획 (dry / status / run 공통) ══════════════
sites = [r[0] for r in q(f"SELECT site_id FROM {S}.sy_site ORDER BY 1")]
EMPTY_REF_COLS = [c for c in ("dliv_tmplt_id", "brand_id", "vendor_id", "md_user_id", "prod_code") if ("pd_prod", c) in coltype]     # '' 로 저장돼 있으면 NULL 로(F6)
prods = {r[0]: dict(site=r[1], type=r[2], status=r[3], std=r[4], sale=r[5], damt=r[6], drate=r[7], o1=r[8], o2=r[9], soldout=r[10], nm=r[11], empty=r[12])
         for r in q(f"""SELECT prod_id, site_id, prod_type_cd, prod_status_cd, std_price, sale_price, sale_discnt_amt, sale_discnt_rate,
                               prod_opt1_type_cd, prod_opt2_type_cd, sold_out_yn, prod_nm,
                               array_remove(ARRAY[{", ".join(f"CASE WHEN {c} = '' THEN '{c}' END" for c in EMPTY_REF_COLS)}], NULL)
                          FROM {S}.pd_prod ORDER BY prod_id""")}
opts = collections.defaultdict(lambda: {1: [], 2: [], 0: []})    # prod_id -> level -> [(opt_id, std_cd, val)] (정렬순서 차례)
opt_owner = {}
for oid, pid, lv, std, val in q(f"SELECT prod_opt_id, prod_id, prod_opt_type_level, prod_opt_std_cd, prod_opt_val FROM {S}.pd_prod_opt ORDER BY prod_id, prod_opt_type_level, sort_ord, prod_opt_id"):
    opts[pid][lv if lv in (1, 2) else 0].append((oid, std, val)); opt_owner[oid] = (pid, lv)
skus = collections.defaultdict(list)                              # prod_id -> [dict]
for r in q(f"SELECT prod_sku_id, prod_id, prod_opt1_id, prod_opt2_id, sku_code, add_price, stock_qty, use_yn, site_id FROM {S}.pd_prod_sku ORDER BY prod_id, sku_code, prod_sku_id"):
    skus[r[1]].append(dict(id=r[0], o1=r[2], o2=r[3], code=r[4], add=r[5], stock=r[6], use=r[7], site=r[8]))
imgs = collections.defaultdict(list)
for r in q(f"SELECT prod_img_id, prod_id, prod_opt1_id, prod_opt2_id, sort_ord, is_thumb, (coalesce(cdn_img_url, '') = '') FROM {S}.pd_prod_img ORDER BY prod_id, sort_ord, prod_img_id"):
    imgs[r[1]].append(dict(id=r[0], o1=r[2], o2=r[3], ord=r[4], thumb=r[5], nourl=r[6]))
emap_exists = has_table(EMAP, "_map")
emap = collections.defaultdict(dict)                              # tbl -> {원본 ID: 복사본 ID}
if emap_exists:
    for t, o, n in q(f"SELECT tbl, old_id, new_id FROM {EMAP}._map WHERE tbl IN ('pd_prod', 'pd_prod_img')"):
        emap[t][o] = n

viol = collections.defaultdict(lambda: collections.defaultdict(list))    # 위반 이름 -> site -> [예시 ID]
changes = []      # (fix, tbl, pk, col, old, new)
inserts = []      # 기본 SKU dict
manual = []       # 규칙으로 풀 수 없어 사람이 봐야 하는 것


def V(name, site, pid): viol[name][site or "(사이트 없음)"].append(pid)


OLD_OPT = re.compile(r"^PV\d{16}(\d)(\d{1,2})$")      # BO 옵션 저장이 만든 ID: PV + yyMMddHHmmss + 4자리 + 그룹 순번(0|1) + 값 순번


def decode_old(oid):
    m = OLD_OPT.match(oid or "")
    return (int(m.group(1)) + 1, int(m.group(2))) if m else None      # (단, 0부터 순번)


final_img = {}     # prod_img_id -> (o1, o2) 보정 뒤 값 (복사본 되살리기에 쓴다)
for pid, p in prods.items():
    site = p["site"]
    L1, L2 = opts[pid][1], opts[pid][2]
    ids1, ids2 = {o[0] for o in L1}, {o[0] for o in L2}
    has_opt = bool(L1 or L2)
    # ── 가격 ──
    if site not in SKIP_SITES:
        nm_free = "나눔" in (p["nm"] or "")
        if p["sale"] is None: V("판매가 비어 있음", site, pid)
        elif p["sale"] == 0 and not nm_free: V("판매가 0원(나눔 아님)", site, pid)
        if p["sale"] and (p["std"] is None or p["std"] < p["sale"]): V("정가 없음·판매가보다 작음", site, pid)
        if p["sale"] and p["std"] and p["std"] >= p["sale"]:
            amt = p["std"] - p["sale"]; rate = round(amt * 100 / p["std"], 2)
            if p["damt"] is None or p["drate"] is None:
                V("할인 금액·율 비어 있음", site, pid)
                if p["damt"] is None: changes.append(("F5", "pd_prod", pid, "sale_discnt_amt", None, amt))
                if p["drate"] is None: changes.append(("F5", "pd_prod", pid, "sale_discnt_rate", None, rate))
            elif p["damt"] != amt: V("할인 금액 ≠ 정가 − 판매가", site, pid)
    for c in p["empty"]:
        V("참조 컬럼에 빈 문자열(" + c + ")", site, pid); changes.append(("F6", "pd_prod", pid, c, "", None))
    # ── 옵션 사용 표시 ↔ 실제 옵션 ──
    if opts[pid][0]: V("옵션값의 단(level)이 1·2 가 아님", site, pid)
    if bool(p["o1"]) != bool(L1) or bool(p["o2"]) != bool(L2): V("옵션 유형 표시 ↔ 옵션값 불일치", site, pid)
    if p["type"] == "OPTION" and not has_opt: V("옵션 상품인데 옵션값 없음", site, pid)
    if p["type"] == "SINGLE" and has_opt: V("단품인데 옵션값 있음", site, pid)
    # ── SKU ──
    sk = skus.get(pid, [])
    n1, n2 = len(L1), len(L2)
    expect = (n1 or 1) * (n2 or 1) if has_opt else 1
    if has_opt and not sk: V("옵션값은 있는데 SKU 없음", site, pid); manual.append(f"{pid}: 옵션값 {n1}×{n2} 인데 SKU 0건 — BO 가격·재고 탭에서 조합 저장 필요")
    if has_opt and sk and len(sk) != expect: V("SKU 수 ≠ 옵션 조합 수", site, pid)
    if any(s["stock"] is None or s["add"] is None for s in sk): V("SKU 추가금·재고 비어 있음", site, pid)
    bad = [s for s in sk if has_opt and ((n1 and s["o1"] not in ids1) or (n2 and s["o2"] not in ids2) or (not n2 and s["o2"]))]
    if not has_opt and any(s["o1"] or s["o2"] for s in sk): V("옵션 없는 상품의 SKU 가 옵션값을 가리킴", site, pid)
    if bad:
        V("SKU 옵션 참조 끊김·비어 있음", site, pid)
        # sku_code 끝 번호 → (1단 순번, 2단 순번). 상품 전체가 이 규칙에 맞을 때만 고친다
        nums = {}
        for s in sk:
            m = re.search(r"-(\d+)$", s["code"] or "")
            if m: nums[s["id"]] = int(m.group(1))
        ok = len(sk) == expect and len(nums) == len(sk) and sorted(nums.values()) == list(range(1, len(sk) + 1))
        plan, agree, differ = [], 0, 0
        if ok:
            for s in sk:
                k = nums[s["id"]] - 1
                i1, i2 = (k // n2, k % n2) if n2 else (k, None)
                w1 = L1[i1][0] if n1 else None
                w2 = L2[i2][0] if n2 else None
                if s not in bad and (s["o1"], s["o2"]) != (w1, w2): ok = False; break      # 멀쩡한 SKU 가 규칙과 다르면 이 상품은 규칙 밖
                for old, lv, idx in ((s["o1"], 1, i1), (s["o2"], 2, i2)):
                    d = decode_old(old) if old and old not in opt_owner else None
                    if d: agree, differ = agree + (d == (lv, idx)), differ + (d != (lv, idx))
                plan.append((s, w1, w2))
        if ok and not differ:
            for s, w1, w2 in plan:
                if s["o1"] != w1: changes.append(("F1", "pd_prod_sku", s["id"], "prod_opt1_id", s["o1"], w1))
                if s["o2"] != w2: changes.append(("F1", "pd_prod_sku", s["id"], "prod_opt2_id", s["o2"], w2))
                s["_o1"], s["_o2"] = w1, w2
            p["_f1"] = f"SKU {len(bad)}건, 옛 ID 순번과 교차 확인 일치 {agree}건"
        else:
            manual.append(f"{pid}: SKU 옵션 참조 {len(bad)}건을 규칙(sku_code 순서)으로 풀 수 없음" + (f" — 옛 ID 순번과 다름 {differ}건" if differ else ""))
    combos = collections.Counter((s.get("_o1", s["o1"]), s.get("_o2", s["o2"])) for s in sk)
    if has_opt and any(n > 1 for n in combos.values()) and not (bad and "_f1" not in p): V("같은 옵션 조합의 SKU 중복", site, pid)
    if p["type"] == "SINGLE" and not has_opt and not sk and site not in SKIP_SITES:
        V("단품인데 기본 SKU 없음", site, pid)
        inserts.append(dict(prod_id=pid, site_id=site, sku_code=f"{pid}-001"))
    stock = sum((s["stock"] or 0) for s in sk if s["use"] != "N")
    if sk and stock > 0 and p["soldout"] == "Y": V("재고가 있는데 품절 표시(알림만)", site, pid)
    if any(s["site"] != site for s in sk): V("SKU 의 site_id ≠ 상품의 site_id", site, pid)
    # ── 이미지 ──
    im = imgs.get(pid, [])
    if not im: V("이미지 0장(알림만)", site, pid)
    if any(x["nourl"] for x in im): V("이미지 URL 빈 값", site, pid)
    for x in im:
        new = {}
        for slot, lv, L, idset in (("o1", 1, L1, ids1), ("o2", 2, L2, ids2)):
            v = x[slot]
            if not v or v in idset: continue
            V("이미지 옵션 참조가 옵션값 ID 가 아님", site, pid)
            by_std = [o[0] for o in L if v in (o[1], o[2])]
            d = decode_old(v) if v not in opt_owner else None
            if len(by_std) == 1: new[slot] = by_std[0]
            elif d and d[0] == lv and d[1] < len(L): new[slot] = L[d[1]][0]
            else: manual.append(f"{pid}: 이미지 {x['id']} 의 옵션 참조 '{v}' 를 풀 수 없음")
        for slot, nv in new.items():
            changes.append(("F2", "pd_prod_img", x["id"], "prod_opt1_id" if slot == "o1" else "prod_opt2_id", x[slot], nv))
        final_img[x["id"]] = (new.get("o1", x["o1"]), new.get("o2", x["o2"]))
    if im:
        ys = [x for x in im if x["thumb"] == "Y"]
        if len(ys) > 1: V("대표 이미지 2장 이상", site, pid)
        if not ys:
            V("대표 이미지 없음", site, pid)
            pick = next((x for x in im if not x["o1"] and not x["o2"]), im[0])
            changes.append(("F3", "pd_prod_img", pick["id"], "is_thumb", pick["thumb"], "Y"))

# F2-복사본: ec2 복사 때 끊긴 참조라 비워진 이미지 옵션 → 원본의 (단, 순번)과 같은 자리의 복사본 옵션값
img_owner = {x["id"]: pid for pid, L in imgs.items() for x in L}
img_by_id = {x["id"]: x for L in imgs.values() for x in L}
restored = 0
for src_img, dst_img in emap["pd_prod_img"].items():
    if src_img not in final_img or dst_img not in img_by_id: continue
    d = img_by_id[dst_img]; dpid = img_owner[dst_img]
    for k, (slot, lv) in enumerate((("o1", 1), ("o2", 2))):
        sv = final_img[src_img][k]
        if not sv or d[slot]: continue
        spid = img_owner[src_img]
        pos = next((n for n, o in enumerate(opts[spid][lv]) if o[0] == sv), None)
        if pos is None or pos >= len(opts[dpid][lv]): continue
        V("복사본 이미지의 옵션 연결이 비워짐", prods[dpid]["site"], dpid)
        changes.append(("F2", "pd_prod_img", dst_img, "prod_opt1_id" if slot == "o1" else "prod_opt2_id", d[slot], opts[dpid][lv][pos][0])); restored += 1

# ── 고치지 않고 알리기만 하는 것 ──
notes = []
for t, c in [("pd_prod_opt", "prod_id"), ("pd_prod_sku", "prod_id"), ("pd_prod_img", "prod_id"), ("pd_prod_content", "prod_id"), ("pd_category_prod", "prod_id"),
             ("pd_prod_tag", "prod_id"), ("pd_prod_rel", "prod_id"), ("pd_prod_rel", "rel_prod_id"), ("pd_prod_plan", "prod_id"),
             ("pd_prod_bundle_item", "bundle_prod_id"), ("pd_prod_bundle_item", "item_prod_id"), ("pd_prod_set_item", "set_prod_id")]:
    if (t, c) not in coltype: continue
    n, d, a, b = q(f'SELECT count(*), count(DISTINCT x."{c}"), min(x."{c}"), max(x."{c}") FROM {S}."{t}" x WHERE x."{c}" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod p WHERE p.prod_id = x."{c}")')[0]
    if n: notes.append(f"상품 없는 딸린 행(고아): {t}.{c} {n:,}행 · 상품ID {d}종 ({a} ~ {b})")
for t in ("pd_prod_opt", "pd_prod_sku", "pd_prod_img", "pd_prod_content", "pd_category_prod"):
    if (t, "site_id") in coltype:
        n = q1(f'SELECT count(*) FROM {S}."{t}" x JOIN {S}.pd_prod p ON p.prod_id = x.prod_id WHERE x.site_id IS DISTINCT FROM p.site_id')
        if n: notes.append(f"딸린 행의 site_id ≠ 상품의 site_id: {t} {n:,}행")
for name, sql in [
    ("카테고리 없음·다른 사이트 카테고리", f"SELECT p.site_id, p.prod_id FROM {S}.pd_prod p LEFT JOIN {S}.pd_category c ON c.category_id = p.category_id WHERE c.category_id IS NULL OR c.site_id IS DISTINCT FROM p.site_id"),
    ("없는 브랜드를 가리킴(알림만)", f"SELECT p.site_id, p.prod_id FROM {S}.pd_prod p LEFT JOIN {S}.sy_brand b ON b.brand_id = p.brand_id WHERE coalesce(p.brand_id, '') <> '' AND b.brand_id IS NULL"),
    ("판매자가 그 사이트에 연결돼 있지 않음", f"SELECT p.site_id, p.prod_id FROM {S}.pd_prod p WHERE p.seller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {S}.sl_seller_site e WHERE e.seller_id = p.seller_id AND e.site_id = p.site_id)"),
    ("상태값이 공통코드(PROD_STATUS_CD)에 없음(알림만)", f"""SELECT p.site_id, p.prod_id FROM {S}.pd_prod p WHERE NOT EXISTS (SELECT 1 FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                                       WHERE g.code_grp = 'PROD_STATUS_CD' AND c.code_value = p.prod_status_cd)"""),
    ("유형값이 공통코드(PROD_TYPE_CD)에 없음(알림만)", f"""SELECT p.site_id, p.prod_id FROM {S}.pd_prod p WHERE NOT EXISTS (SELECT 1 FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                                     WHERE g.code_grp = 'PROD_TYPE_CD' AND c.code_value = p.prod_type_cd)"""),
]:
    for site, pid in q(sql): V(name, site, pid)
n = q1(f"SELECT count(*) FROM {S}.od_order_item x WHERE x.prod_sku_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod_sku s WHERE s.prod_sku_id = x.prod_sku_id)")
if n: notes.append(f"없는 SKU 를 가리키는 주문 품목: od_order_item {n}행 (지난 주문 — 그대로 둠)")
n = q1(f"SELECT count(*) FROM {S}.od_cart x WHERE x.prod_sku_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod_sku s WHERE s.prod_sku_id = x.prod_sku_id)")
if n: notes.append(f"없는 SKU 를 가리키는 장바구니: od_cart {n}행")
dup = q1(f"SELECT count(*) FROM (SELECT sku_code FROM {S}.pd_prod_sku WHERE sku_code IS NOT NULL GROUP BY 1 HAVING count(*) > 1) z")
if dup: notes.append(f"sku_code 중복 {dup}종")

# 기본 SKU 의 새 ID·코드 충돌 점검
BASE_TS = datetime.datetime.now().replace(microsecond=0)
problems = []
if inserts:
    prefix = "PRS" + BASE_TS.strftime("%y%m%d")
    used = {r[0] for r in q(f"SELECT prod_sku_id FROM {S}.pd_prod_sku WHERE prod_sku_id LIKE %s", (prefix + "%",))}
    seq = 0
    for row in inserts:
        while True:
            nid = f"PRS{BASE_TS.strftime('%y%m%d%H%M%S')}{seq:04d}"; seq += 1
            if nid not in used: break
        row["prod_sku_id"] = nid
    hit = q(f"SELECT sku_code FROM {S}.pd_prod_sku WHERE sku_code = ANY(%s)", ([r["sku_code"] for r in inserts],))
    if hit: problems.append(f"기본 SKU 코드가 이미 있음 {len(hit)}건: {[h[0] for h in hit[:5]]}")
    if len(inserts) > 10000: problems.append("기본 SKU 추가가 1만 건을 넘습니다 — ID 생성 범위를 확인하세요")
    long = [r["sku_code"] for r in inserts if len(r["sku_code"]) > 50]
    if long: problems.append(f"기본 SKU 코드 길이 초과 {len(long)}건")

FIX_NM = {"F1": "SKU 옵션 참조 다시 연결", "F2": "이미지 옵션 참조 → 옵션값 ID", "F3": "대표 이미지 지정", "F4": "단품 기본 SKU 추가", "F5": "할인 금액·율 채움", "F6": "빈 문자열 참조 → NULL"}
by_fix = collections.Counter(c[0] for c in changes)
rows_fix = {f: len({(c[1], c[2]) for c in changes if c[0] == f}) for f in by_fix}
todo = len(changes) + len(inserts)

if MODE == "status":
    print(f"[상태] 백업 스키마 {BAK}: {'있음' if bak_exists else '없음'}" + (f" (기록 {q1(f'SELECT count(*) FROM {BAK}._chg'):,}칸 · 추가 {q1(f'SELECT count(*) FROM {BAK}._ins'):,}행)" if bak_exists else ""))
    print(f"[상태] 지금 고칠 것: 값 {len(changes):,}칸 + 추가 {len(inserts):,}행, 사람이 봐야 하는 것 {len(manual)}건 → " + ("고칠 것 없음" if not todo else "고칠 것 남음"))
    sys.exit(0 if not todo else 3)

print(f"[대상] {MODE} — 스키마 {S}, 백업 스키마 {BAK} ({'있음' if bak_exists else '없음'}), F4·F5 제외 사이트 {sorted(SKIP_SITES)}, 기본 SKU 재고 {BASE_STOCK}")
cnt = collections.Counter(p["site"] for p in prods.values())
print("[상품 수] " + ", ".join(f"{s} {cnt[s]}" for s in sorted(cnt)))
print("\n[점검 표] 위반 종류 — 사이트별 상품 수 (예시 ID)")
for name in sorted(viol):
    parts = []
    for s in sorted(viol[name]):
        ids = sorted(set(viol[name][s]))
        parts.append(f"{s} {len(ids)}건({ids[0]})")
    print(f"   · {name}: " + ", ".join(parts))
if not viol: print("   (위반 없음)")
print("\n[알림 — 고치지 않음(삭제·판단 필요)]")
for l in notes: print("   · " + l)
for l in manual[:30]: print("   · (수동) " + l)
if not notes and not manual: print("   (없음)")

print("\n[보정 계획]")
for f in sorted(FIX_NM):
    if f == "F4":
        per = collections.Counter(r["site_id"] for r in inserts)
        print(f"   F4 {FIX_NM[f]}: {len(inserts):,}행" + (" — " + ", ".join(f"{s} {n}" for s, n in sorted(per.items())) + f" (재고 {BASE_STOCK}, 추가금 0, 코드 <상품ID>-001, ID {inserts[0]['prod_sku_id']} ~ {inserts[-1]['prod_sku_id']})" if inserts else ""))
        continue
    print(f"   {f} {FIX_NM[f]}: {by_fix.get(f, 0):,}칸 / {rows_fix.get(f, 0):,}행" + (f" (그중 복사본 되살리기 {restored}칸)" if f == "F2" and restored else ""))
for pid, p in prods.items():
    if "_f1" in p: print(f"      F1 {pid}({p['site']}): {p['_f1']}")
print("   표본:")
seen = collections.Counter()
for c in changes:
    if seen[c[0]] < 3:
        seen[c[0]] += 1; print(f"      {c[0]} {c[1]}.{c[3]} [{c[2]}] {c[4]!r} → {c[5]!r}")
for r in inserts[:3]: print(f"      F4 pd_prod_sku [{r['prod_sku_id']}] 상품 {r['prod_id']} 코드 {r['sku_code']}")
print(f"   합계: 값 {len(changes):,}칸 + 추가 {len(inserts):,}행")
if problems:
    print("\n[사전점검 실패 — run 은 시작하지 않습니다]"); [print("   !! " + x) for x in problems]
if MODE == "dry":
    print("\n(dry) 읽기 전용 세션 — 아무것도 바꾸지 않았습니다.")
    sys.exit(1 if problems else 0)

# ══════════════════════════════ run ══════════════════════════════════════════
if problems:
    conn.rollback(); print("\n[중단] 아무것도 바꾸지 않았습니다."); sys.exit(1)
if not todo:
    conn.rollback(); print("\n[완료] 고칠 것이 없습니다 — 아무것도 바꾸지 않았습니다."); sys.exit(0)
try:
    t0 = datetime.datetime.now()
    cur.execute("SET LOCAL lock_timeout = '10s'")
    cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
    cur.execute(f"""CREATE TABLE IF NOT EXISTS {BAK}._chg (seq bigserial PRIMARY KEY, run_no integer NOT NULL, fix varchar(4) NOT NULL, tbl varchar(40) NOT NULL,
                    pk varchar(40) NOT NULL, col varchar(40) NOT NULL, old_val text, new_val text, chg_at timestamp DEFAULT now())""")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._ins (tbl varchar(40) NOT NULL, pk varchar(40) NOT NULL, fix varchar(4), run_no integer, PRIMARY KEY (tbl, pk))")
    cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._run (run_no integer PRIMARY KEY, run_at timestamp DEFAULT now(), note text)")
    run_no = q1(f"SELECT coalesce(max(run_no), 0) + 1 FROM {BAK}._run")
    S2 = lambda v: None if v is None else str(v)
    for fix, tbl, pk, col, old, new in changes:
        cast = "numeric" if coltype[(tbl, col)] in ("numeric", "bigint", "integer") else "text"
        cur.execute(f'UPDATE {S}."{tbl}" SET "{col}" = CAST(%s AS {coltype[(tbl, col)]}) WHERE "{PK[tbl]}" = %s AND "{col}"::{cast} IS NOT DISTINCT FROM %s::{cast}',
                    (S2(new), pk, S2(old)))
        if cur.rowcount != 1:
            raise RuntimeError(f"{tbl}.{col} [{pk}] 가 계획을 세운 뒤 바뀌었습니다(영향 {cur.rowcount}행)")
    psycopg2.extras.execute_values(cur, f"INSERT INTO {BAK}._chg (run_no, fix, tbl, pk, col, old_val, new_val) VALUES %s",
                                   [(run_no, f, t, pk, c, S2(o), S2(n)) for f, t, pk, c, o, n in changes], page_size=2000)
    now = datetime.datetime.now()
    sku_cols = [c for c in ("prod_sku_id", "site_id", "reg_site_id", "prod_id", "sku_code", "add_price", "stock_qty", "sale_count", "use_yn", "reg_by", "reg_date", "upd_by", "upd_date")
                if ("pd_prod_sku", c) in coltype]
    for r in inserts:
        v = dict(prod_sku_id=r["prod_sku_id"], site_id=r["site_id"], reg_site_id=r["site_id"], prod_id=r["prod_id"], sku_code=r["sku_code"], add_price=0, stock_qty=BASE_STOCK,
                 sale_count=0, use_yn="Y", reg_by=FIXBY, reg_date=now, upd_by=FIXBY, upd_date=now)
        cur.execute(f"INSERT INTO {S}.pd_prod_sku ({', '.join(sku_cols)}) VALUES ({', '.join(['%s'] * len(sku_cols))})", [v[c] for c in sku_cols])
    psycopg2.extras.execute_values(cur, f"INSERT INTO {BAK}._ins (tbl, pk, fix, run_no) VALUES %s", [("pd_prod_sku", r["prod_sku_id"], "F4", run_no) for r in inserts]) if inserts else None

    # ── 사후 검증 (하나라도 어긋나면 전체 롤백) ──
    bad = []
    checks = [
        ("SKU 옵션1 참조 끊김", f"""SELECT count(*) FROM {S}.pd_prod_sku s WHERE s.prod_id = ANY(%s) AND NOT EXISTS
                                   (SELECT 1 FROM {S}.pd_prod_opt o WHERE o.prod_opt_id = s.prod_opt1_id AND o.prod_id = s.prod_id AND o.prod_opt_type_level = 1)""",
         ([pid for pid, p in prods.items() if "_f1" in p],)),
        ("SKU 옵션2 참조 끊김", f"""SELECT count(*) FROM {S}.pd_prod_sku s WHERE s.prod_id = ANY(%s) AND s.prod_opt2_id IS NOT NULL AND NOT EXISTS
                                   (SELECT 1 FROM {S}.pd_prod_opt o WHERE o.prod_opt_id = s.prod_opt2_id AND o.prod_id = s.prod_id AND o.prod_opt_type_level = 2)""",
         ([pid for pid, p in prods.items() if "_f1" in p],)),
        ("같은 옵션 조합 SKU 중복", f"SELECT count(*) FROM (SELECT prod_id, prod_opt1_id, prod_opt2_id FROM {S}.pd_prod_sku WHERE prod_id = ANY(%s) GROUP BY 1, 2, 3 HAVING count(*) > 1) z",
         ([pid for pid, p in prods.items() if "_f1" in p],)),
        ("고친 이미지의 옵션 참조", f"""SELECT count(*) FROM {S}.pd_prod_img i WHERE i.prod_img_id = ANY(%s) AND
                                     ((coalesce(i.prod_opt1_id, '') <> '' AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod_opt o WHERE o.prod_opt_id = i.prod_opt1_id AND o.prod_id = i.prod_id))
                                   OR (coalesce(i.prod_opt2_id, '') <> '' AND NOT EXISTS (SELECT 1 FROM {S}.pd_prod_opt o WHERE o.prod_opt_id = i.prod_opt2_id AND o.prod_id = i.prod_id)))""",
         ([c[2] for c in changes if c[0] == "F2"],)),
        ("대표 이미지가 1장이 아님", f"""SELECT count(*) FROM (SELECT prod_id FROM {S}.pd_prod_img WHERE prod_id IN (SELECT prod_id FROM {S}.pd_prod_img WHERE prod_img_id = ANY(%s))
                                       GROUP BY 1 HAVING count(*) FILTER (WHERE is_thumb = 'Y') <> 1) z""", ([c[2] for c in changes if c[0] == "F3"],)),
        ("기본 SKU 가 1개가 아님", f"SELECT count(*) FROM (SELECT prod_id FROM {S}.pd_prod_sku WHERE prod_id = ANY(%s) GROUP BY 1 HAVING count(*) <> 1) z", ([r["prod_id"] for r in inserts],)),
        ("sku_code 중복", f"SELECT count(*) FROM (SELECT sku_code FROM {S}.pd_prod_sku WHERE sku_code IS NOT NULL GROUP BY 1 HAVING count(*) > 1) z", None),
    ]
    for name, sql, args in checks:
        n = q1(sql, args)
        if n: bad.append(f"{name} {n}건")
    if q1(f"SELECT count(*) FROM {S}.pd_prod") != len(prods): bad.append("상품 수가 바뀜")
    if q1(f"SELECT count(*) FROM {S}.pd_prod_sku") != sum(len(v) for v in skus.values()) + len(inserts): bad.append("SKU 수가 (이전 + 추가)와 다름")
    if bad:
        raise RuntimeError("사후 검증 실패 — " + " / ".join(bad))
    cur.execute(f"INSERT INTO {BAK}._run (run_no, note) VALUES (%s, %s)",
                (run_no, ", ".join(f"{f} {by_fix.get(f, 0)}칸" for f in sorted(by_fix)) + f", F4 추가 {len(inserts)}행"))
    conn.commit()
    print(f"\n[검증] {len(checks)}개 점검 통과 · 상품 수 그대로 · SKU +{len(inserts)}")
    print(f"[완료] run #{run_no} — 커밋했습니다 ({(datetime.datetime.now() - t0).seconds}초). 백업: {BAK}._chg / _ins")
    print("   다음: FO 상품 상세(옵션 선택 → 가격·재고 → 장바구니)를 확인하세요. 상품 캐시를 쓰면 만료를 기다리거나 비우세요. ecBeBo 재기동은 필요 없습니다.")
except Exception as e:
    conn.rollback()
    print(f"\n[실패] 롤백했습니다(백업 스키마 포함): {e}")
    sys.exit(1)
