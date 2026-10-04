# -*- coding: utf-8 -*-
r"""
migration_20261004_bo_site_audit.py — BO 멀티테넌트 데이터 점검 + 보정 (2026-10-04, BO 업무 전수 점검)

  점검 (dry / run 모두 출력 — SELECT 만)
    A) site_id 가 있는 모든 테이블: 전체 건수 · site_id 빈 값 · sy_site 에 없는 사이트를 가리키는 행 · 사이트별 분포
    B) 부모와 사이트가 다른 자식 (주문↔주문상품/결제/배송/클레임/환불, 상품↔SKU/이미지/옵션/리뷰/Q&A,
       카테고리↔상품, 쿠폰↔발급/사용, 회원↔주문/적립금 …) — 사이트 불일치 건수와, 부모 행이 아예 없는(고아) 건수
    C) 그 밖: reg_site_id 가 없는 사이트를 가리키는 행, 비회원 주문, 판매자 없는 상품, 회원 로그인ID 사이트 내 중복
    컬럼·테이블은 실행 시점에 information_schema 로 읽어 있는 것만 본다(대기 마이그레이션으로 site_id 가 늘어도 그대로 동작).

  보정 (run — 한 트랜잭션, 하나라도 실패하면 전체 롤백)
    1) md_sg_stack: site_id · reg_site_id 가 옛 값 'SITE000001'(sy_site 에 없음) → 'SI260001'
       되돌리기용 원본은 백업 스키마 shopjoy_2604_bak_bo_site_audit_20261004.md_sg_stack 에 남긴다.
    2) 공통필터 '사이트 선택' 팝업(cm_popup.popup_code = 'site')에 '모듈' 열 추가 (cm_popup_item 1행)
       필드명은 sy_site 에 module_cd 컬럼이 있으면 'moduleCd', 아니면 'tenantModule'(이름을 바꾸기 전) — 그때의 엔티티 필드명과 같아야 팝업이 열린다.
       이미 'tenantModule' 로 들어가 있는데 컬럼이 module_cd 로 바뀌었으면 필드명만 'moduleCd' 로 고친다.
    고아 행(부모가 없는 옛 시드 데이터: 주문상품·리뷰·상품태그·쿠폰사용 등)은 **보정하지 않는다** — 건수만 보고한다(지울지 말지는 사용자 결정).

  적용 여부 판별(실행기 check 용)
    적용됨 = md_sg_stack 에 sy_site 에 없는 site_id 0건  AND  사이트 선택 팝업에 모듈 열 있음(필드명이 지금 컬럼과 맞음)
      SELECT count(*) FROM shopjoy_2604.md_sg_stack WHERE site_id NOT IN (SELECT site_id FROM shopjoy_2604.sy_site);   -- 0
    `status` 모드가 같은 기준으로 '적용됨/미적용/일부만' 을 한 줄로 출력한다(종료코드 0=적용됨, 3=미적용·일부).

  실행 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python migration_20261004_bo_site_audit.py dry      # 읽기 전용 세션, SELECT 만 — 점검표 + 보정 계획 출력
     python migration_20261004_bo_site_audit.py status   # 읽기 전용 — 적용 여부 한 줄
     python migration_20261004_bo_site_audit.py run      # 점검표 출력 + 보정 적용(이미 적용이면 건너뜀)
     python migration_20261004_bo_site_audit.py revert   # 백업·추가 기록 기준으로 되돌리기
   PowerShell: $env:DB_PASSWORD='…'; python C:\…\migration_20261004_bo_site_audit.py dry
  실행 순서: 모듈 컬럼 이름 변경(migration_20261004_module_codes.sql)·site_id 추가(run_all pre) **뒤**, 새 백엔드 배포와 같은 때.
             (2번 보정의 필드명이 그때의 엔티티 필드명과 같아야 하므로 — 컬럼만 바뀌고 옛 백엔드가 떠 있는 동안에는 돌리지 않는다)
"""
import os, sys
import psycopg2

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_bo_site_audit_20261004"
MIG = "MIGRATION_20261004"
MAIN = "SI260001"
OLD_SITE = "SITE000001"
USAGE = "사용법: python migration_20261004_bo_site_audit.py dry|status|run|revert"

# (자식, 자식 FK, 부모, 부모 PK) — 둘 다 site_id 가 있을 때만 사이트를 비교한다
RELS = [
    ("od_order_item", "order_id", "od_order", "order_id"), ("od_pay", "order_id", "od_order", "order_id"),
    ("od_dliv", "order_id", "od_order", "order_id"), ("od_dliv_item", "dliv_id", "od_dliv", "dliv_id"),
    ("od_claim", "order_id", "od_order", "order_id"), ("od_claim_item", "claim_id", "od_claim", "claim_id"),
    ("od_refund", "order_id", "od_order", "order_id"), ("od_refund", "claim_id", "od_claim", "claim_id"),
    ("od_order", "member_id", "mb_member", "member_id"), ("od_claim", "member_id", "mb_member", "member_id"),
    ("od_cart", "member_id", "mb_member", "member_id"), ("od_cart", "prod_id", "pd_prod", "prod_id"),
    ("od_order_item", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_sku", "prod_id", "pd_prod", "prod_id"), ("pd_prod_img", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_opt", "prod_id", "pd_prod", "prod_id"), ("pd_prod_content", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_tag", "prod_id", "pd_prod", "prod_id"), ("pd_prod_tag", "tag_id", "pd_tag", "tag_id"),
    ("pd_prod_rel", "prod_id", "pd_prod", "prod_id"), ("pd_prod_qna", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod_qna", "member_id", "mb_member", "member_id"), ("pd_review", "prod_id", "pd_prod", "prod_id"),
    ("pd_review", "member_id", "mb_member", "member_id"), ("pd_review_comment", "review_id", "pd_review", "review_id"),
    ("pd_category_prod", "category_id", "pd_category", "category_id"), ("pd_category_prod", "prod_id", "pd_prod", "prod_id"),
    ("pd_prod", "category_id", "pd_category", "category_id"), ("pd_category", "parent_category_id", "pd_category", "category_id"),
    ("pd_prod", "brand_id", "sy_brand", "brand_id"),
    ("pm_coupon_issue", "coupon_id", "pm_coupon", "coupon_id"), ("pm_coupon_issue", "member_id", "mb_member", "member_id"),
    ("pm_coupon_item", "coupon_id", "pm_coupon", "coupon_id"), ("pm_coupon_usage", "coupon_id", "pm_coupon", "coupon_id"),
    ("pm_coupon_usage", "order_id", "od_order", "order_id"), ("pm_coupon_usage", "member_id", "mb_member", "member_id"),
    ("pm_discnt_item", "discnt_id", "pm_discnt", "discnt_id"), ("pm_discnt_usage", "discnt_id", "pm_discnt", "discnt_id"),
    ("pm_discnt_usage", "order_id", "od_order", "order_id"),
    ("pm_event_item", "event_id", "pm_event", "event_id"), ("pm_event_benefit", "event_id", "pm_event", "event_id"),
    ("pm_gift_cond", "gift_id", "pm_gift", "gift_id"), ("pm_gift_issue", "gift_id", "pm_gift", "gift_id"),
    ("pm_gift_issue", "member_id", "mb_member", "member_id"), ("pm_plan_item", "plan_id", "pm_plan", "plan_id"),
    ("pm_save", "member_id", "mb_member", "member_id"), ("pm_save_issue", "member_id", "mb_member", "member_id"),
    ("pm_save_usage", "member_id", "mb_member", "member_id"), ("pm_cache", "member_id", "mb_member", "member_id"),
    ("pm_voucher_issue", "voucher_id", "pm_voucher", "voucher_id"), ("pm_voucher_issue", "member_id", "mb_member", "member_id"),
    ("mb_member_addr", "member_id", "mb_member", "member_id"), ("mb_member_sns", "member_id", "mb_member", "member_id"),
    ("dp_area", "ui_id", "dp_ui", "ui_id"), ("dp_panel", "area_id", "dp_area", "area_id"),
    ("dp_panel_item", "panel_id", "dp_panel", "panel_id"), ("dp_widget", "widget_lib_id", "dp_widget_lib", "widget_lib_id"),
    ("cm_bbs", "bbm_id", "cm_bbm", "bbm_id"), ("cm_blog", "blog_cate_id", "cm_blog_cate", "blog_cate_id"),
    ("st_settle_raw", "order_id", "od_order", "order_id"),
]

MODE = sys.argv[1] if len(sys.argv) > 1 else "dry"
if MODE not in ("dry", "status", "run", "revert") or len(sys.argv) > 2:
    sys.exit(USAGE)
if not os.environ.get("DB_PASSWORD"):
    sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")

conn = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                        dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                        password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="migration_20261004_bo_site_audit")
conn.set_client_encoding("UTF8")
if MODE in ("dry", "status"):
    conn.set_session(readonly=True)   # 읽기 전용 세션 — 쓰기 문장이 섞여도 DB 가 막는다
cur = conn.cursor()


def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall()


def q1(sql, args=None):
    cur.execute(sql, args)
    r = cur.fetchone()
    return r[0] if r else None


def load_cols():
    cols = {}
    for t, c in q("select table_name, column_name from information_schema.columns where table_schema=%s", (S,)):
        cols.setdefault(t, set()).add(c)
    base = {r[0] for r in q("select table_name from information_schema.tables where table_schema=%s and table_type='BASE TABLE'", (S,))}
    return {t: c for t, c in cols.items() if t in base}


COLS = load_cols()


def report():
    """점검표 출력. 반환: (없는 사이트를 가리키는 테이블 목록, 사이트 불일치 목록, 고아 목록)"""
    bad_tabs, mism, orphans = [], [], []
    tabs = sorted(t for t, c in COLS.items() if "site_id" in c and not t.startswith("zz_") and t != "sy_site")
    print(f"■ A. site_id 가 있는 테이블 {len(tabs)}개 (zz_ 백업 테이블 제외)")
    print(f"  {'테이블':28} {'전체':>8} {'빈 값':>6} {'없는 사이트':>10}  사이트별(끝 2자리:건수)")
    for t in tabs:
        tot, nul, bad = q(f"select count(*), count(*) filter (where site_id is null or btrim(site_id)=''),"
                          f" count(*) filter (where site_id is not null and btrim(site_id)<>'' and site_id not in (select site_id from {S}.sy_site))"
                          f" from {S}.{t}")[0]
        dist = " ".join(f"{(s or 'NULL')[-2:]}:{n}" for s, n in q(f"select site_id, count(*) from {S}.{t} group by 1 order by 1"))
        flag = "  <<<" if nul or bad else ""
        print(f"  {t:28} {tot:>8} {nul:>6} {bad:>10}  {dist}{flag}")
        if nul or bad:
            bad_tabs.append((t, nul, bad))

    print("\n■ B. 부모와 사이트가 다른 자식 / 부모가 없는(고아) 자식")
    print(f"  {'자식.FK → 부모':46} {'참조':>7} {'사이트 불일치':>10} {'고아':>6}")
    for ch, fk, pa, pk in RELS:
        if ch not in COLS or pa not in COLS or fk not in COLS[ch] or pk not in COLS[pa]:
            continue
        both = "site_id" in COLS[ch] and "site_id" in COLS[pa]
        mis_expr = "count(*) filter (where p.%s is not null and p.site_id is distinct from c.site_id)" % pk if both else "null"
        ref, mis, orp = q(f"select count(*) filter (where c.{fk} is not null and btrim(c.{fk}::text)<>''), {mis_expr},"
                          f" count(*) filter (where c.{fk} is not null and btrim(c.{fk}::text)<>'' and p.{pk} is null)"
                          f" from {S}.{ch} c left join {S}.{pa} p on p.{pk}=c.{fk}")[0]
        flag = "  <<<" if (mis or 0) or orp else ""
        print(f"  {(ch + '.' + fk + ' → ' + pa):46} {ref:>7} {('-' if mis is None else mis):>10} {orp:>6}{flag}")
        if mis:
            mism.append((ch, fk, pa, mis))
        if orp:
            orphans.append((ch, fk, pa, orp))

    print("\n■ C. 그 밖")
    reg_bad = []
    for t in sorted(t for t, c in COLS.items() if "reg_site_id" in c and not t.startswith("zz_")):
        for v, n in q(f"select reg_site_id, count(*) from {S}.{t} where reg_site_id is not null and btrim(reg_site_id)<>''"
                      f" and reg_site_id not in (select site_id from {S}.sy_site) group by 1"):
            reg_bad.append((t, v, n))
    print("  reg_site_id(감사 필드)가 없는 사이트를 가리키는 행:", reg_bad or "없음")
    print("  비회원 주문(od_order.member_id 빈 값):", q1(f"select count(*) from {S}.od_order where member_id is null or btrim(member_id)=''"))
    print("  판매자 없는 상품(pd_prod.seller_id NULL — 플랫폼 직영):", q1(f"select count(*) from {S}.pd_prod where seller_id is null"))
    print("  회원 로그인ID 사이트 내 중복:", q1(f"select count(*) from (select site_id, login_id from {S}.mb_member group by 1,2 having count(*)>1) x"))
    print(f"\n  요약: site_id 빈 값·없는 사이트 테이블 {len(bad_tabs)}개 / 부모와 사이트 불일치 관계 {len(mism)}개 / 고아 관계 {len(orphans)}개(보정 대상 아님 — 보고만)")
    return bad_tabs, mism, orphans


def module_field():
    return "moduleCd" if "module_cd" in COLS.get("sy_site", set()) else "tenantModule"


def fix_plan():
    """보정 대상 조회. 반환: dict(stack=건수, popup=('insert'|'rename'|None, popup_id, item_id))"""
    stack = 0
    if "md_sg_stack" in COLS:
        cond = " or ".join(f"{c} = %s" for c in ("site_id", "reg_site_id") if c in COLS["md_sg_stack"])
        n = len([c for c in ("site_id", "reg_site_id") if c in COLS["md_sg_stack"]])
        stack = q1(f"select count(*) from {S}.md_sg_stack where {cond}", (OLD_SITE,) * n) if n else 0
    popup = (None, None, None)
    if "cm_popup" in COLS and "cm_popup_item" in COLS:
        pid = q1(f"select popup_id from {S}.cm_popup where popup_code = 'site'")
        if pid:
            want = module_field()
            rows = q(f"select popup_item_id, field_nm from {S}.cm_popup_item where popup_id = %s and field_nm in ('moduleCd','tenantModule')", (pid,))
            if not rows:
                popup = ("insert", pid, None)
            elif all(f != want for _, f in rows):
                popup = ("rename", pid, rows[0][0])
    return {"stack": stack, "popup": popup}


def is_applied(plan):
    return plan["stack"] == 0 and plan["popup"][0] is None


if MODE == "status":
    plan = fix_plan()
    done = [plan["stack"] == 0, plan["popup"][0] is None]
    word = "적용됨" if all(done) else ("미적용" if not any(done) else "일부만")
    print(f"migration_20261004_bo_site_audit: {word} (md_sg_stack 옛 사이트 {plan['stack']}건, 사이트 선택 팝업 모듈 열 {'있음' if done[1] else '없음/필드명 다름'})")
    conn.close()
    sys.exit(0 if all(done) else 3)

if MODE in ("dry", "run"):
    report()
    plan = fix_plan()
    print("\n■ 보정 계획")
    print(f"  1) md_sg_stack: site_id·reg_site_id '{OLD_SITE}' → '{MAIN}' — {plan['stack']}건")
    act, pid, item = plan["popup"]
    print(f"  2) 사이트 선택 팝업 모듈 열: {'추가(필드 ' + module_field() + ')' if act == 'insert' else ('필드명 → ' + module_field() if act == 'rename' else '할 일 없음')}")
    if MODE == "dry":
        print("\n(dry — 읽기 전용, 바꾼 것 없음)")
        conn.close()
        sys.exit(0)
    if is_applied(plan):
        print("\n이미 적용됨 — 건너뜀")
        conn.close()
        sys.exit(0)
    try:
        cur.execute(f"create schema if not exists {BAK}")
        if plan["stack"]:
            cur.execute(f"create table if not exists {BAK}.md_sg_stack as select * from {S}.md_sg_stack where false")
            if q1(f"select count(*) from {BAK}.md_sg_stack") == 0:
                cur.execute(f"insert into {BAK}.md_sg_stack select * from {S}.md_sg_stack where site_id = %s or reg_site_id = %s", (OLD_SITE, OLD_SITE))
            cur.execute(f"update {S}.md_sg_stack set site_id = %s where site_id = %s", (MAIN, OLD_SITE))
            a = cur.rowcount
            cur.execute(f"update {S}.md_sg_stack set reg_site_id = %s where reg_site_id = %s", (MAIN, OLD_SITE))
            print(f"  1) md_sg_stack site_id {a}건, reg_site_id {cur.rowcount}건 보정")
        if act == "insert":
            nxt = q1(f"select coalesce(max(substring(popup_item_id from 4)::bigint), 0) + 1 from {S}.cm_popup_item where popup_item_id ~ '^PPI[0-9]+$'")
            new_id = "PPI" + str(nxt).zfill(15)
            cur.execute(f"""insert into {S}.cm_popup_item (popup_item_id, popup_id, field_nm, field_label, field_type_cd, search_yn, search_type_cd,
                              list_yn, tree_label_yn, col_width, link_yn, sort_ord, use_yn, remark, reg_by, reg_date, required_yn, reg_site_id)
                            values (%s, %s, %s, '모듈', 'TEXT', 'N', 'LIKE', 'Y', 'N', '110px', 'N', 15, 'Y', 'BO 멀티테넌트 점검(2026-10-04) — 사이트 모듈 표시', %s, now(), 'N', %s)""",
                        (new_id, pid, module_field(), MIG, MAIN))
            print(f"  2) 사이트 선택 팝업에 모듈 열 추가: {new_id} ({module_field()})")
        elif act == "rename":
            cur.execute(f"update {S}.cm_popup_item set field_nm = %s, upd_by = %s, upd_date = now() where popup_item_id = %s", (module_field(), MIG, item))
            print(f"  2) 사이트 선택 팝업 모듈 열 필드명 → {module_field()} ({item})")
        after = fix_plan()
        if not is_applied(after):
            raise RuntimeError(f"보정 뒤 확인 실패: {after}")
        conn.commit()
        print("\n적용 완료(커밋)")
    except Exception as e:
        conn.rollback()
        print("\n실패 — 전체 롤백:", e)
        conn.close()
        sys.exit(1)
    conn.close()
    sys.exit(0)

if MODE == "revert":
    try:
        if q1("select to_regclass(%s)", (f"{BAK}.md_sg_stack",)):
            pk = [r[0] for r in q("""select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
                                     where i.indrelid = %s::regclass and i.indisprimary""", (f"{S}.md_sg_stack",))]
            if not pk:
                raise RuntimeError("md_sg_stack 기본키를 찾지 못했습니다")
            on = " and ".join(f"t.{c} = b.{c}" for c in pk)
            cur.execute(f"update {S}.md_sg_stack t set site_id = b.site_id, reg_site_id = b.reg_site_id from {BAK}.md_sg_stack b where {on}")
            print(f"  1) md_sg_stack {cur.rowcount}건 원래 값으로")
        cur.execute(f"delete from {S}.cm_popup_item where reg_by = %s and field_nm in ('moduleCd','tenantModule')"
                    f" and popup_id = (select popup_id from {S}.cm_popup where popup_code = 'site')", (MIG,))
        print(f"  2) 사이트 선택 팝업 모듈 열 {cur.rowcount}건 삭제(이 스크립트가 넣은 것만)")
        conn.commit()
        print("되돌리기 완료(커밋) — 백업 스키마는 남겨 둡니다:", BAK)
    except Exception as e:
        conn.rollback()
        print("실패 — 전체 롤백:", e)
        conn.close()
        sys.exit(1)
    conn.close()
