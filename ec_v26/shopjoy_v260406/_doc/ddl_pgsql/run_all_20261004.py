# -*- coding: utf-8 -*-
r"""
run_all_20261004.py — 2026-10-03~04 대기 중인 DB 변경을 정해진 순서로 한 번에 실행하는 실행기

  대상 DB: illeesam.synology.me:17632 / postgres / 스키마 shopjoy_2604 (공유 DB — 한가한 시간에 실행)

  ■ 단계 (이 순서로 실행한다)
     배포 "전"(pre)
       1    sitefix2_20261003_site_cleanup.py run            사이트 값 정비(고아 값·빈 reg_site_id·옛 SI260007)
       2    migration_20261004_noti_fcm_push.sql             sy_noti 사이트/모듈, mb_device_token, ap_app_version
       3-1  migration_20261004_noti_rename.sql (1단계)       sy_alarm·syh_alarm_send_hist·sy_noti → ap_* + 호환 뷰
       4-1  migration_20261003_cm_bbm_site_ownership.py run1 게시판 cm_ 이동·site_id 22개 테이블·sl_seller_site + 호환 뷰
       5    migration_20261004_chatt_trade.sql               cm_chatt 방 종류·거래 대상·역할, 공통코드
       6    migration_20261004_cm_meet.sql                   cm_meet 4개 테이블, 공통코드, sy_prop
       7    migration_20261004_db_timezone_kst.sql           DB 기본 시간대 Asia/Seoul
       ── 멀티테넌트 데이터 정비(2026-10-04) ──
       8-1  migration_20261004_module_cd.sql                 sy_site.module_cd 추가(tenant_module 값 복사) + 공통코드 MODULE_CD 6개
       9    migration_20261004_module_codes.sql              sy_code_grp.module_cd(모듈 한정 코드 그룹) + 모듈 전용 코드 그룹 5개·코드 23개
       10   migration_20261004_category_site.py run          카테고리: SI260002 = ec1 73건 복사, SI260003 당근형 분류 7건 보강
       10-2 migration_20261004_category_module_root.py run   카테고리 루트 = 모듈: sy_site.root_category_id 추가, 사이트 6곳에 루트(ec1 …) 생성,
                                                             기존 1단계를 루트 아래로(깊이 +1), 갈 곳 없던 상품을 분류(상품명 꼬리표)·루트로 연결
       11   migration_20261004_ec2_prod_copy.py run          ec2 상품 = ec1 대표 160건 복사(옵션·SKU·이미지·브랜드·판매자↔사이트)
     배포 "후"(post) — ecBeBo·ecFeBo 새 코드 배포·확인 뒤
       3-2  호환 뷰 sy_alarm·syh_alarm_send_hist·sy_noti 삭제 (noti_rename.sql 맨 아래 주석 처리된 2단계와 같은 문장)
       4-2  migration_20261003_cm_bbm_site_ownership.py run2 --with-pm-cache   빈 site_id 재채움·NOT NULL·호환 뷰 sy_bbm·sy_bbs 삭제
       8-2  옛 컬럼 sy_site.tenant_module 삭제 (module_cd.sql 맨 아래 주석 처리된 2단계와 같은 문장)
       12   cdnmove_20261004_site_folder.py run              CDN URL 을 사이트 폴더(SI26/<사이트ID>_<모듈>/…)로 — NAS 파일 복사(plan → copy_files.sh)를 먼저 해야 한다.
                                                             새 경로가 HTTP 200 이 아니면 이 단계는 아무것도 바꾸지 않고 멈춘다(맨 마지막 단계라 앞 단계에는 영향 없음)

  ■ 순서를 이렇게 둔 이유 (2026-10-04 스크립트 검토)
     · 2 → 3-1 : 3-1 뒤에는 sy_noti 가 뷰라서 2 의 ALTER TABLE sy_noti / CREATE INDEX 가 실패한다. 반드시 2 가 먼저.
                 (3-1 이 먼저 돌아 버린 상태에서 2 가 미적용이면 이 실행기는 멈추고 알려 준다)
     · 3-1 ↔ 4-1 : 서로 순서 무관하게 만들어져 있다 — 4-1 은 sy_alarm 이 뷰면 실제 테이블 ap_fcm_noti_send 에 site_id 를 단다.
                 3-1 을 먼저 하면 호환 뷰 sy_alarm 에는 site_id 가 없지만(옛 백엔드는 그 컬럼을 모른다) 배포 뒤에는 뷰를 쓰지 않는다.
     · 4-1 → 5 : 둘 다 cm_chatt 에 컬럼을 더한다(site_id / chatt_type_cd 등). 겹치는 컬럼·인덱스 이름 없음. 4-1 의 검증(행 수·site_id 채움)이
                 5 의 데이터 정리와 섞이지 않게 4-1 을 먼저 둔다.
     · 5·6 의 공통코드 ID: 5 = CG261004000010~12 / CD261004000010~18, 6 = CG261004070001~10 / CD261004070001~48 — 서로 겹치지 않는다
                 (check 가 DB 의 기존 행과 ID 가 겹치는지도 조회한다 — 겹치면 그 코드가 조용히 빠지므로 pre 를 시작하지 않는다).
     · 6 : cm_meet.site_id 는 처음부터 NOT NULL 로 만들어진다(4-1 의 22개 테이블과 무관).
     · 7 : 다른 단계와 무관(새 접속부터 적용). 맨 뒤.
     · 8-1 : 새 백엔드(ecBeBo c5e02de 이후)는 sy_site.module_cd 만 읽는다 → 배포 전에 반드시. 이름 바꾸기(RENAME) 대신 "추가+복사"라서
                 8-1 과 배포 사이에도 옛 백엔드(tenant_module 을 읽음)가 그대로 동작한다. 옛 컬럼은 배포 뒤 8-2 가 지운다.
     · 9 : 새 백엔드의 SyCodeGrp 엔티티가 module_cd 를 읽는다(ecBeBo 710cd35) → 배포 전에 반드시. 9 의 공통코드 ID(CG2610042000NN/CD2610042000NN)는
                 5·6·8-1(CG261004100001/CD2610041000NN)과 겹치지 않는다.
     · 4-1 → 10 → 10-2 → 11 : 11 은 sy_brand.site_id·sl_seller_site(4-1)와 10 의 카테고리 매핑, 10-2 의 루트(sy_site.root_category_id)가 있어야 한다.
                 10-2 는 10 이 만든 SI260002 복사본·SI260003 보강분까지 루트 아래로 내리므로 10 뒤에 돈다(10 이 아직이면 시작하지 않는다).
                 새 백엔드(SySite.rootCategoryId)는 sy_site.root_category_id 컬럼이 있어야 뜬다 → 10-2 는 반드시 배포 전(pre).
                 컬럼만 있고 값이 비어 있는 동안(또는 옛 백엔드)에는 예전처럼 "부모 없는 카테고리 = 1단계"로 동작한다.
     · 11 → 12 : ec2 복사본의 이미지 URL 은 원본 그대로 들어가고, 12 가 행의 사이트 기준으로 SI26/SI260002_ec2/… 로 나눈다.
     · 3-2·4-2 : 호환 뷰를 지우고 NOT NULL 을 건다 — 옛 백엔드가 떠 있으면 깨지므로 반드시 배포 뒤. 통합 코드는 pm_cache INSERT 에
                 site_id 를 넣으므로(ecBeBo 7bd2f48) run2 는 처음부터 --with-pm-cache 로 실행한다.

  ■ 사용법 (DB_PASSWORD 는 일회성 환경변수로만 — 파일·로그에 적지 않는다)
     python run_all_20261004.py check   # 각 단계 적용 여부만 조회 (읽기 전용 세션, SELECT 만)
     python run_all_20261004.py pre     # 배포 전 단계 전부. 이미 적용된 단계는 건너뜀. 실패하면 멈추고 어디서 멈췄는지 출력
     python run_all_20261004.py post    # 배포 뒤 단계. pre 가 다 끝나 있어야 한다
   PowerShell: $env:DB_PASSWORD='…'; python C:\…\run_all_20261004.py check
   bash      : DB_PASSWORD='…' python …/run_all_20261004.py check

  ■ 동작
     · .sql 파일은 psycopg2 로 파일 전체를 한 번에 보낸다(자동 커밋 접속). BEGIN…COMMIT 이 있는 파일(noti_rename)은 그 트랜잭션대로,
       없는 파일은 PostgreSQL 이 파일 전체를 한 트랜잭션으로 처리한다 → 중간에 실패하면 그 파일은 전부 롤백된다.
     · noti_rename.sql 은 2단계가 주석 처리돼 있어 파일 전체 실행 = 1단계다. 2단계(3-2)는 이 실행기가 DROP VIEW 를 직접 실행한다
       (뷰일 때만 — 같은 이름이 테이블이면 손대지 않는다).
     · .py 단계는 같은 폴더의 스크립트를 그대로 실행한다(자체 사전점검·검증·롤백·백업 스키마 포함). 종료코드가 0 이 아니면 멈춘다.
     · 단계를 실행한 뒤 적용 여부를 다시 조회해 "적용됨"이 아니면 멈춘다.
"""
import os
import subprocess
import sys

import psycopg2

try:  # 파이프·파일로 출력할 때 cp949 콘솔 인코딩 오류 방지
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
HERE = os.path.dirname(os.path.abspath(__file__))
USAGE = "사용법: python run_all_20261004.py check|pre|post"

F_SITEFIX2 = "sitefix2_20261003_site_cleanup.py"
F_FCM = "migration_20261004_noti_fcm_push.sql"
F_RENAME = "migration_20261004_noti_rename.sql"
F_CMBBM = "migration_20261003_cm_bbm_site_ownership.py"
F_CHATT = "migration_20261004_chatt_trade.sql"
F_MEET = "migration_20261004_cm_meet.sql"
F_TZ = "migration_20261004_db_timezone_kst.sql"
F_MODULE = "migration_20261004_module_cd.sql"
F_MODCODES = "migration_20261004_module_codes.sql"
F_CATEGORY = "migration_20261004_category_site.py"
F_CATROOT = "migration_20261004_category_module_root.py"
F_EC2 = "migration_20261004_ec2_prod_copy.py"
F_CDN = "cdnmove_20261004_site_folder.py"

NOTI_VIEWS = ["sy_alarm", "syh_alarm_send_hist", "sy_noti"]
NOTI_TABLES = ["ap_fcm_noti_send", "aph_fcm_noti_send_hist", "ap_fcm_noti"]
MEET_TABLES = ["cm_meet", "cm_meet_member", "cm_meet_log", "cm_meet_note"]
MEET_GRPS = ["MEET_TYPE_CD", "MEET_STATUS_CD", "MEET_HOST_TYPE_CD", "MEET_MEDIA_PROVIDER_CD", "MEET_MEMBER_TYPE_CD",
             "MEET_ROLE_CD", "MEET_INVITE_STATUS_CD", "MEET_EVENT_CD", "MEET_NOTE_TYPE_CD", "MEET_REF_TYPE_CD"]
# 5·6 이 넣는 공통코드 ID — DB 의 다른 행과 겹치면 그 코드가 조용히 빠진다(NOT EXISTS code_id 조건) → 사전 점검
CHATT_GRP_IDS = {"CG261004000010": "CHATT_STATUS", "CG261004000011": "CHATT_TYPE", "CG261004000012": "CHATT_MEMBER_ROLE"}
CHATT_CODE_IDS = [f"CD2610040000{n}" for n in range(10, 19)]
MEET_GRP_IDS = [f"CG2610040700{n:02d}" for n in range(1, 11)]
MEET_CODE_IDS = [f"CD2610040700{n:02d}" for n in range(1, 49)]
# 8-1·9 가 넣는 공통코드 (멀티테넌트 데이터 정비)
MODULE_CODES = ["ec1", "ec2", "danmoo1", "homepg1", "datavisual1", "bbm1"]
MODULE_GRP_IDS = {"CG261004100001": "MODULE_CD"}
MODULE_CODE_IDS = [f"CD2610041000{n:02d}" for n in range(1, 7)]
MODCODE_GRPS = {"CG261004200001": "TRADE_METHOD_CD", "CG261004200002": "DM_JOB_TYPE", "CG261004200003": "DM_REALTY_TYPE",
                "CG261004200004": "HP_CONTACT_SERVICE", "CG261004200005": "HP_CONTACT_CATEGORY"}
MODCODE_CODE_IDS = [f"CD2610042000{n:02d}" for n in range(1, 24)]


def connect(readonly):
    if not os.environ.get("DB_PASSWORD"):
        sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요 (예: $env:DB_PASSWORD='…'; python run_all_20261004.py check)")
    c = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                         dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                         password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="run_all_20261004")
    c.set_client_encoding("UTF8")
    if readonly:
        c.set_session(readonly=True, autocommit=True)   # 읽기 전용 — 쓰기를 시도하면 DB 가 거절한다
    else:
        c.autocommit = True                             # 파일의 BEGIN/COMMIT 을 그대로 쓰기 위해 자동 커밋
    return c


class State:
    """적용 여부 판단에 쓰는 DB 상태 — SELECT 만 한다"""

    def __init__(self):
        conn = connect(readonly=True)
        try:
            cur = conn.cursor()

            def q(sql, args=None):
                cur.execute(sql, args)
                return cur.fetchall()

            self.kind = dict(q("SELECT relname, relkind::text FROM pg_class WHERE relnamespace = %s::regnamespace AND relkind IN ('r','v','i')", (S,)))
            self.cols = {}
            for t, c, nullable in q("SELECT table_name, column_name, is_nullable FROM information_schema.columns WHERE table_schema = %s", (S,)):
                self.cols.setdefault(t, {})[c] = nullable
            self.schemas = {r[0] for r in q("SELECT nspname FROM pg_namespace")}
            self.sitefix2_marker = bool(q("SELECT 1 FROM information_schema.tables WHERE table_schema = %s AND table_name = '_changes'",
                                          ("shopjoy_2604_bak_sitefix2_20261003",)))
            self.code_grps = {r[0]: r[1] for r in q(f"SELECT code_grp, code_grp_id FROM {S}.sy_code_grp")}
            self.batch_codes = {r[0] for r in q(f"SELECT batch_code FROM {S}.sy_batch WHERE batch_code IN ('SY_SEND_ALARM','SY_SEND_NOTI')")}
            self.meet_props = q(f"SELECT count(*) FROM {S}.sy_prop WHERE prop_key IN ('app.meet.stun-urls','app.meet.turn-urls','app.meet.turn-ttl-sec')")[0][0]
            self.db_settings = [r[0] for r in q("""SELECT unnest(s.setconfig) FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase
                                                    WHERE d.datname = current_database() AND s.setrole = 0""")]
            self.timezone_now = q("SHOW timezone")[0][0]
            # 멀티테넌트 데이터 정비(8~12) 상태
            self.module_code_cnt = q(f"""SELECT count(*) FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                           WHERE g.code_grp = 'MODULE_CD' AND c.code_value = ANY(%s)""", (MODULE_CODES,))[0][0]
            self.modcode_cnt = q(f"""SELECT count(*) FROM {S}.sy_code c JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                       WHERE g.code_grp = ANY(%s)""", (list(MODCODE_GRPS.values()),))[0][0]
            self.cat_map = q("SELECT to_regclass('shopjoy_2604_map_category_20261004._map') IS NOT NULL")[0][0]
            self.cat_site2 = q(f"SELECT count(*) FROM {S}.pd_category WHERE site_id = 'SI260002'")[0][0]
            self.ec2_map = q("SELECT to_regclass('shopjoy_2604_map_ec2copy_20261004._map') IS NOT NULL")[0][0]
            self.prod_site2 = q(f"SELECT count(*) FROM {S}.pd_prod WHERE site_id = 'SI260002'")[0][0]
            self.cdn_bak = q("SELECT to_regclass('shopjoy_2604_bak_cdnmove_20261004._changes') IS NOT NULL")[0][0]
            # 공통코드 ID 충돌 (5·6·8-1·9 가 넣을 ID 를 다른 코드가 이미 쓰고 있나)
            self.id_conflicts = []
            for gid, grp in q(f"SELECT code_grp_id, code_grp FROM {S}.sy_code_grp WHERE code_grp_id = ANY(%s)", (list(MODULE_GRP_IDS) + list(MODCODE_GRPS),)):
                if grp != {**MODULE_GRP_IDS, **MODCODE_GRPS}[gid]:
                    self.id_conflicts.append(f"sy_code_grp.code_grp_id {gid} 를 다른 그룹 {grp} 가 쓰고 있음")
            for cid, grp in q(f"""SELECT c.code_id, g.code_grp FROM {S}.sy_code c LEFT JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                   WHERE c.code_id = ANY(%s)""", (MODULE_CODE_IDS + MODCODE_CODE_IDS,)):
                own = {"MODULE_CD"} if cid in MODULE_CODE_IDS else set(MODCODE_GRPS.values())
                if grp not in own:
                    self.id_conflicts.append(f"sy_code.code_id {cid} 를 다른 그룹 {grp} 의 코드가 쓰고 있음")
            for gid, grp in q(f"SELECT code_grp_id, code_grp FROM {S}.sy_code_grp WHERE code_grp_id = ANY(%s)", (list(CHATT_GRP_IDS) + MEET_GRP_IDS,)):
                want = CHATT_GRP_IDS.get(gid)
                if (want and grp != want) or (gid in MEET_GRP_IDS and grp not in MEET_GRPS):
                    self.id_conflicts.append(f"sy_code_grp.code_grp_id {gid} 를 다른 그룹 {grp} 가 쓰고 있음")
            for cid, grp in q(f"""SELECT c.code_id, g.code_grp FROM {S}.sy_code c LEFT JOIN {S}.sy_code_grp g ON g.code_grp_id = c.code_grp_id
                                   WHERE c.code_id = ANY(%s)""", (CHATT_CODE_IDS + MEET_CODE_IDS,)):
                own = set(CHATT_GRP_IDS.values()) if cid in CHATT_CODE_IDS else set(MEET_GRPS)
                if grp not in own:
                    self.id_conflicts.append(f"sy_code.code_id {cid} 를 다른 그룹 {grp} 의 코드가 쓰고 있음")
        finally:
            conn.close()

    def is_table(self, t):
        return self.kind.get(t) == "r"

    def is_view(self, t):
        return self.kind.get(t) == "v"

    def has_col(self, t, c):
        return c in self.cols.get(t, {})

    def not_null(self, t, c):
        return self.cols.get(t, {}).get(c) == "NO"


def summarize(items):
    """items: [(이름, 됐나)] → ('done'|'todo'|'partial', 설명)"""
    ok = [n for n, v in items if v]
    no = [n for n, v in items if not v]
    if not no:
        return "done", "모두 적용됨"
    if not ok:
        return "todo", "미적용"
    return "partial", "일부만 적용 — 안 된 것: " + ", ".join(no)


# ── 단계별 적용 여부 ─────────────────────────────────────────────────────────

def st_sitefix2(s):
    if s.sitefix2_marker:
        return "done", "백업 스키마 shopjoy_2604_bak_sitefix2_20261003._changes 있음(run 한 적 있음)"
    return "todo", "미적용 (백업 스키마 없음 — run 한 적 없음)"


def st_fcm(s):
    noti = "ap_fcm_noti" if s.is_table("ap_fcm_noti") else "sy_noti"
    return summarize([
        (f"{noti}.site_id", s.has_col(noti, "site_id")),
        (f"{noti}.tenant_modules", s.has_col(noti, "tenant_modules")),
        ("mb_device_token.tenant_modules", s.has_col("mb_device_token", "tenant_modules")),
        ("mb_device_token.noti_read_date", s.has_col("mb_device_token", "noti_read_date")),
        ("mb_device_token_uk01", "mb_device_token_uk01" in s.kind),
        ("ap_app_version", s.is_table("ap_app_version")),
    ])


def st_rename1(s):
    items = [(t, s.is_table(t)) for t in NOTI_TABLES]
    items.append(("sy_batch SY_SEND_NOTI", "SY_SEND_ALARM" not in s.batch_codes))
    items.append(("코드그룹 NOTI_SEND_TYPE_CD", "ALARM_TYPE_CD" not in s.code_grps))
    items.append(("옛 테이블 없음", not any(s.is_table(v) for v in NOTI_VIEWS)))
    return summarize(items)


def st_rename2(s):
    views = [v for v in NOTI_VIEWS if s.is_view(v)]
    if st_rename1(s)[0] != "done":
        return "todo", "1단계(3-1)가 아직 — 미적용"
    if views:
        return "todo", "호환 뷰 남아 있음: " + ", ".join(views)
    return "done", "호환 뷰 없음"


def alarm_table(s):
    return "ap_fcm_noti_send" if s.is_table("ap_fcm_noti_send") else "sy_alarm"


def st_cmbbm1(s):
    return summarize([
        ("cm_bbm 테이블", s.is_table("cm_bbm")),
        ("cm_bbs 테이블", s.is_table("cm_bbs")),
        ("cm_bbs_reply", s.is_table("cm_bbs_reply")),
        ("cm_bbm_menu", s.is_table("cm_bbm_menu")),
        ("cm_bbm_member", s.is_table("cm_bbm_member")),
        ("sl_seller_site", s.is_table("sl_seller_site")),
        ("cm_chatt.site_id", s.has_col("cm_chatt", "site_id")),
        ("sy_user.site_id", s.has_col("sy_user", "site_id")),
        (f"{alarm_table(s)}.site_id", s.has_col(alarm_table(s), "site_id")),
    ])


def st_cmbbm2(s):
    if st_cmbbm1(s)[0] != "done":
        return "todo", "run1(4-1)이 아직 — 미적용"
    return summarize([
        ("호환 뷰 sy_bbm 삭제", not s.is_view("sy_bbm")),
        ("호환 뷰 sy_bbs 삭제", not s.is_view("sy_bbs")),
        ("cm_chatt.site_id NOT NULL", s.not_null("cm_chatt", "site_id")),
        (f"{alarm_table(s)}.site_id NOT NULL", s.not_null(alarm_table(s), "site_id")),
        ("pm_cache.site_id NOT NULL", s.not_null("pm_cache", "site_id")),
    ])


def st_chatt(s):
    return summarize([
        ("cm_chatt.chatt_type_cd", s.has_col("cm_chatt", "chatt_type_cd")),
        ("cm_chatt.ref_type_cd", s.has_col("cm_chatt", "ref_type_cd")),
        ("cm_chatt.ref_id", s.has_col("cm_chatt", "ref_id")),
        ("cm_chatt.last_msg_text", s.has_col("cm_chatt", "last_msg_text")),
        ("cm_chatt_member.member_role_cd", s.has_col("cm_chatt_member", "member_role_cd")),
        ("cm_chatt_member.last_read_msg_id", s.has_col("cm_chatt_member", "last_read_msg_id")),
        ("코드그룹 CHATT_TYPE", "CHATT_TYPE" in s.code_grps),
        ("코드그룹 CHATT_MEMBER_ROLE", "CHATT_MEMBER_ROLE" in s.code_grps),
    ])


def st_meet(s):
    items = [(t, s.is_table(t)) for t in MEET_TABLES]
    items.append(("코드그룹 MEET_* 10개", all(g in s.code_grps for g in MEET_GRPS)))
    items.append(("sy_prop app.meet.* 3개", s.meet_props == 3))
    return summarize(items)


def st_tz(s):
    if any(x.lower().replace(" ", "") == "timezone=asia/seoul" for x in s.db_settings):
        return "done", "DB 기본 시간대 Asia/Seoul"
    return "todo", f"미적용 (DB 설정 {s.db_settings or '없음'}, 이 접속의 시간대 {s.timezone_now})"


def st_module1(s):
    return summarize([
        ("sy_site.module_cd", s.has_col("sy_site", "module_cd")),
        ("코드그룹 MODULE_CD", "MODULE_CD" in s.code_grps),
        ("MODULE_CD 코드 6개", s.module_code_cnt == len(MODULE_CODES)),
    ])


def st_module2(s):
    if st_module1(s)[0] != "done":
        return "todo", "1단계(8-1)가 아직 — 미적용"
    if s.has_col("sy_site", "tenant_module"):
        return "todo", "옛 컬럼 sy_site.tenant_module 남아 있음"
    return "done", "옛 컬럼 sy_site.tenant_module 없음"


def st_modcodes(s):
    return summarize([
        ("sy_code_grp.module_cd", s.has_col("sy_code_grp", "module_cd")),
        ("모듈 전용 코드그룹 5개", all(g in s.code_grps for g in MODCODE_GRPS.values())),
        ("그 코드 23개 이상", s.modcode_cnt >= 23),
    ])


def st_category(s):
    return summarize([("매핑 shopjoy_2604_map_category_20261004._map", s.cat_map), (f"SI260002 카테고리({s.cat_site2}건)", s.cat_site2 > 0)])


def st_catroot(s):
    """카테고리 루트 = 모듈 — 스크립트의 status(읽기 전용, 종료코드 0=적용됨)"""
    r = subprocess.run([sys.executable, os.path.join(HERE, F_CATROOT), "status"], capture_output=True, text=True, encoding="utf-8", errors="replace",
                       env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    line = (r.stdout.strip().splitlines() or [r.stderr.strip()[-200:]])[-1]
    if r.returncode == 0:
        return "done", line
    return ("partial" if "일부만" in line else "todo"), line


def st_ec2(s):
    return summarize([("매핑 shopjoy_2604_map_ec2copy_20261004._map", s.ec2_map), (f"SI260002 상품({s.prod_site2}건)", s.prod_site2 > 0)])


def st_cdn(s):
    if s.cdn_bak:
        return "done", "백업 스키마 shopjoy_2604_bak_cdnmove_20261004._changes 있음(run 한 적 있음)"
    return "todo", ("미적용 — 먼저: python cdnmove_20261004_site_folder.py plan → copy_files.sh 를 NAS 에서 실행 → verify "
                    "(새 경로가 HTTP 200 이 아니면 run 은 아무것도 바꾸지 않고 멈춘다)")


F_BOAUDIT = "migration_20261004_bo_site_audit.py"
F_DMLOCAL = "migration_20261004_dm_local.sql"


def st_dmlocal(s):
    """당무마켓 동네 글·전문가·견적요청 — cm_local_post 테이블이 있으면 적용됨"""
    c = connect(True)
    try:
        cur = c.cursor()
        cur.execute("SELECT to_regclass('shopjoy_2604.cm_local_post') IS NOT NULL")
        ok = cur.fetchone()[0]
    finally:
        c.close()
    return ("done", "cm_local_post 있음") if ok else ("todo", "미적용")


def st_boaudit(s):
    """BO 점검 보정(옛 사이트 값 md_sg_stack·사이트 선택 팝업 모듈 열) — 스크립트의 status(읽기 전용, 종료코드 0=적용됨)"""
    import subprocess
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), F_BOAUDIT), "status"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    line = (r.stdout.strip().splitlines() or [r.stderr.strip()[-200:]])[-1]
    return ("done" if r.returncode == 0 else "todo"), line


# ── 단계별 실행 ─────────────────────────────────────────────────────────────

def run_sql_file(name):
    path = os.path.join(HERE, name)
    with open(path, encoding="utf-8-sig") as f:
        sql = f.read()
    conn = connect(readonly=False)
    try:
        cur = conn.cursor()
        cur.execute(sql)          # 인자 없이 보내면 % 를 해석하지 않는다. 여러 문장은 서버가 차례로 실행
        for n in conn.notices[-30:]:
            print("     " + n.strip())
    finally:
        conn.close()


def run_py(name, *args):
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, os.path.join(HERE, name), *args], cwd=HERE, env=env)
    if r.returncode != 0:
        raise RuntimeError(f"{name} {' '.join(args)} 종료코드 {r.returncode}")


def run_drop_noti_views():
    s = State()
    views = [v for v in NOTI_VIEWS if s.is_view(v)]
    if not views:
        return
    conn = connect(readonly=False)
    try:
        cur = conn.cursor()
        # 한 번에 보내 한 트랜잭션으로 — noti_rename.sql 맨 아래 2단계와 같은 문장
        cur.execute("BEGIN; SET LOCAL lock_timeout = '10s'; "
                    + " ".join(f"DROP VIEW IF EXISTS {S}.{v};" for v in views) + " COMMIT;")
        print("     호환 뷰 삭제: " + ", ".join(views))
    finally:
        conn.close()


def run_drop_tenant_module():
    s = State()
    if not s.has_col("sy_site", "tenant_module"):
        return
    conn = connect(readonly=False)
    try:
        cur = conn.cursor()
        # module_cd.sql 맨 아래 2단계와 같은 문장 — 비어 있는 module_cd 는 옛 값으로 채운 뒤 옛 컬럼 삭제
        cur.execute("BEGIN; SET LOCAL lock_timeout = '10s'; "
                    f"UPDATE {S}.sy_site SET module_cd = NULLIF(btrim(tenant_module), '') "
                    "WHERE module_cd IS NULL AND tenant_module IS NOT NULL AND btrim(tenant_module) <> ''; "
                    f"ALTER TABLE {S}.sy_site DROP COLUMN IF EXISTS tenant_module; COMMIT;")
        print("     옛 컬럼 sy_site.tenant_module 삭제")
    finally:
        conn.close()


# (번호, 구분, 설명, 적용 여부 함수, 실행 함수, 실행 내용 표시)
STEPS = [
    ("1",   "pre",  "사이트 값 정비",                         st_sitefix2, lambda: run_py(F_SITEFIX2, "run"),               f"{F_SITEFIX2} run"),
    ("2",   "pre",  "알림 사이트/모듈·기기 토큰·앱 버전",     st_fcm,      lambda: run_sql_file(F_FCM),                     F_FCM),
    ("3-1", "pre",  "알림 이름 정리 1단계(ap_* + 호환 뷰)",    st_rename1,  lambda: run_sql_file(F_RENAME),                  f"{F_RENAME} (파일 전체 = 1단계)"),
    ("4-1", "pre",  "게시판 cm_ 이동·site_id·판매자↔사이트",  st_cmbbm1,   lambda: run_py(F_CMBBM, "run1"),                 f"{F_CMBBM} run1"),
    ("5",   "pre",  "거래 채팅(cm_chatt 컬럼·공통코드)",       st_chatt,    lambda: run_sql_file(F_CHATT),                   F_CHATT),
    ("6",   "pre",  "화상회의·면접·상담(cm_meet)",            st_meet,     lambda: run_sql_file(F_MEET),                    F_MEET),
    ("7",   "pre",  "DB 기본 시간대 한국시간",                st_tz,       lambda: run_sql_file(F_TZ),                      F_TZ),
    ("8-1", "pre",  "모듈 = 공통코드(sy_site.module_cd·MODULE_CD)", st_module1, lambda: run_sql_file(F_MODULE),                 f"{F_MODULE} (파일 전체 = 1단계)"),
    ("9",   "pre",  "모듈 한정 코드 그룹(sy_code_grp.module_cd)", st_modcodes, lambda: run_sql_file(F_MODCODES),               F_MODCODES),
    ("10",  "pre",  "사이트별 카테고리(ec2 복사·당무마켓 보강)", st_category, lambda: run_py(F_CATEGORY, "run"),              f"{F_CATEGORY} run"),
    ("10-2", "pre", "카테고리 루트 = 모듈(sy_site.root_category_id)", st_catroot, lambda: run_py(F_CATROOT, "run"),             f"{F_CATROOT} run"),
    ("11",  "pre",  "ec2 상품 = ec1 대표 160건 복사",           st_ec2,      lambda: run_py(F_EC2, "run"),                   f"{F_EC2} run"),
    ("14",  "pre",  "당무마켓 동네 글·전문가·견적요청(cm_local_post 등)", st_dmlocal, lambda: run_sql_file(F_DMLOCAL),               F_DMLOCAL),
    ("3-2", "post", "알림 이름 정리 2단계(호환 뷰 삭제)",      st_rename2,  run_drop_noti_views,                             "DROP VIEW sy_alarm·syh_alarm_send_hist·sy_noti"),
    ("4-2", "post", "site_id NOT NULL·게시판 호환 뷰 삭제",    st_cmbbm2,   lambda: run_py(F_CMBBM, "run2", "--with-pm-cache"), f"{F_CMBBM} run2 --with-pm-cache"),
    ("8-2", "post", "옛 컬럼 sy_site.tenant_module 삭제",      st_module2,  run_drop_tenant_module,                          "DROP COLUMN sy_site.tenant_module"),
    ("12",  "post", "CDN URL 사이트 폴더로(SI26/<사이트>_<모듈>)", st_cdn,    lambda: run_py(F_CDN, "run"),                    f"{F_CDN} run (NAS 파일 복사 뒤)"),
    ("13",  "post", "BO 점검 보정(사이트 선택 팝업 모듈 열 등)",   st_boaudit,  lambda: run_py(F_BOAUDIT, "run"),               f"{F_BOAUDIT} run"),
]
LABEL = {"done": "적용됨", "todo": "미적용", "partial": "일부 적용"}


def print_status(s, phases=("pre", "post")):
    out = {}
    for no, phase, title, fn, _, what in STEPS:
        if phase not in phases:
            continue
        st, detail = fn(s)
        out[no] = st
        print(f"  [{no:<4}] {'배포 전' if phase == 'pre' else '배포 뒤'} · {LABEL[st]:<5} · {title}")
        print(f"         {what}")
        print(f"         → {detail}")
    return out


def preflight(s):
    """pre 를 시작하면 안 되는 상황 — 문제 목록"""
    bad = []
    for f in (F_SITEFIX2, F_FCM, F_RENAME, F_CMBBM, F_CHATT, F_MEET, F_TZ, F_MODULE, F_MODCODES, F_CATEGORY, F_CATROOT, F_EC2, F_CDN):
        if not os.path.isfile(os.path.join(HERE, f)):
            bad.append(f"파일 없음: {os.path.join(HERE, f)}")
    bad.extend(s.id_conflicts)
    # 2 가 미적용인데 sy_noti 가 이미 뷰(3-1 이 먼저 돌았음) → 2 의 ALTER TABLE sy_noti 가 실패한다
    if st_fcm(s)[0] != "done" and s.is_view("sy_noti"):
        bad.append(f"2단계({F_FCM})가 미적용인데 sy_noti 가 이미 호환 뷰입니다 — 그 파일의 2) mb_device_token·3) ap_app_version 부분만 따로 실행한 뒤 다시 시작하세요"
                   " (1) sy_noti 부분은 noti_rename 0단계가 이미 했습니다)")
    return bad


def main():
    mode = sys.argv[1] if len(sys.argv) == 2 else ""
    if mode not in ("check", "pre", "post"):
        sys.exit(USAGE)

    s = State()
    if mode == "check":
        print(f"[check] {S} — 각 단계 적용 여부 (읽기 전용 조회)")
        st = print_status(s)
        bad = preflight(s)
        print("\n[사전 점검]")
        for m in bad:
            print(f"  [문제] {m}")
        if not bad:
            print("  [통과] 스크립트 파일 13개 있음 · 공통코드 ID 충돌 없음 · 실행 순서 문제 없음")
        pre_left = [no for no, ph, *_ in STEPS if ph == "pre" and st[no] != "done"]
        post_left = [no for no, ph, *_ in STEPS if ph == "post" and st[no] != "done"]
        print(f"\n남은 단계 — 배포 전: {', '.join(pre_left) or '없음'} / 배포 뒤: {', '.join(post_left) or '없음'}")
        print("(check) 아무것도 바꾸지 않았습니다.")
        sys.exit(1 if bad else 0)

    if mode == "pre":
        bad = preflight(s)
        if bad:
            for m in bad:
                print(f"  [문제] {m}")
            sys.exit("[중단] 사전 점검 실패 — 아무것도 실행하지 않았습니다.")
    else:
        left = [no for no, ph, _, fn, *_ in STEPS if ph == "pre" and fn(s)[0] != "done"]
        if left:
            sys.exit(f"[중단] 배포 전 단계가 아직 남았습니다: {', '.join(left)} — pre 를 먼저 끝내세요. 아무것도 실행하지 않았습니다.")
        print("⚠ post 는 ecBeBo·ecFeBo 새 코드가 배포돼 정상 동작하는 것을 확인한 뒤에만 실행합니다(호환 뷰 삭제·NOT NULL).")

    done_now, skipped = [], []
    for no, phase, title, fn, run, what in STEPS:
        if phase != mode:
            continue
        st, detail = fn(State())
        if st == "done":
            print(f"\n[{no}] 건너뜀(이미 적용됨) — {title}: {detail}")
            skipped.append(no)
            continue
        print(f"\n[{no}] 실행 — {title}\n     {what}\n     실행 전 상태: {LABEL[st]} ({detail})")
        try:
            run()
            st2, detail2 = fn(State())
            if st2 != "done":
                raise RuntimeError(f"실행은 끝났지만 적용 여부 확인이 '{LABEL[st2]}' 입니다 — {detail2}")
        except Exception as e:
            msg = str(e).strip() or e.__class__.__name__
            print(f"\n[멈춤] {no} 단계에서 실패했습니다 — {title}")
            print(f"       실행 내용: {what}")
            print(f"       오류: {msg}")
            print(f"       이번에 적용한 단계: {', '.join(done_now) or '없음'} / 건너뛴 단계: {', '.join(skipped) or '없음'}")
            rest = [n for n, ph, *_ in STEPS if ph == mode and n not in done_now and n not in skipped]
            print(f"       남은 단계: {', '.join(rest)}")
            print("       실패한 단계는 그 스크립트 안에서 롤백됩니다(.sql 은 파일 전체가 한 트랜잭션, .py 는 자체 롤백). 원인을 고친 뒤 같은 명령을 다시 실행하면 이어서 진행합니다.")
            sys.exit(1)
        print(f"[{no}] 완료 — {detail2}")
        done_now.append(no)

    print(f"\n[완료] {mode} — 적용 {', '.join(done_now) or '없음'} / 건너뜀 {', '.join(skipped) or '없음'}")
    if mode == "pre":
        print("  CDN 파일 복사 준비(언제든): python cdnmove_20261004_site_folder.py plan → 만들어진 copy_files.sh 를 NAS 에서 실행 → verify")
        print("  다음: ecBeCdn → ecBeBo → ecFeBo·ecFeFoNuxt4·ecBeBatchJenkins 새 코드 배포 → BO 알림관리·게시판·채팅, FO 종 아이콘·채팅 확인 → python run_all_20261004.py post")
        print("  ※ 3-1 뒤 ~ 배포 전에는 옛 화면에서 알림 코드 라벨·게시판 선택 팝업이 비어 보이고 옛 배치 SY_SEND_ALARM 이 돌지 않습니다 — pre 는 배포 직전에 실행하세요.")


if __name__ == "__main__":
    main()
