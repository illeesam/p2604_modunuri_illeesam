# -*- coding: utf-8 -*-
r"""
cdnmove_20261004_site_folder.py — CDN 파일을 멀티테넌트용 새 폴더 구조로 옮기고 DB 의 URL 을 새 경로로 바꾼다 (2026-10-04, 2차 규칙)

  사용자 승인 구조 (NAS /volume1/docker/shopjoy/storage/ecBeCdnStorage/cdn, URL https://22400.illeesam.synology.me/api/cdn/…)
     cdn/
     ├─ _common/design/…                      모든 사이트 공용
     ├─ _common/attach/etc/yyyy/mm/dd/        사이트를 알 수 없는 첨부
     └─ SI26/<사이트ID>_<모듈>/               예: SI26/SI260001_ec1
         ├─ design/{logo,banner,slider,icon,…}/   디자인 파일(뜻 있는 이름, 덮어쓰기 가능)
         ├─ attach/<업무>/yyyy/mm/dd/             첨부(시스템 ID 파일명) — 업무: prod review qna board chat member contact seller etc
         ├─ private/                              비공개 첨부(규칙만)
         └─ temp/                                 저장 전 임시(규칙만)

  옛 → 새
     prod/img/shop/product/…  (샘플 상품 이미지)      →  <사이트>/attach/prod/_sample/…
     prod/img/client/…        (고객사 로고)            →  <사이트>/design/logo/…
     prod/img/<종류>/…        (slider·testimonial 등)  →  <사이트>/design/<종류>/…
     attach/prod_img/yyyy/mm/dd/…                      →  <사이트>/attach/prod/yyyy/mm/dd/…
     yyyy/mm/dd/…             (업무 구분 없이 올린 것) →  <사이트>/attach/<업무>/yyyy/mm/dd/…
        업무는 그 파일을 가리키는 테이블로 정한다: pd_prod_img·pd_prod·pd_prod_content→prod, pd_review→review, pd_prod_qna→qna,
        게시판(cm_bbs·sy_notice·cm_faq·cm_blog)→board, cm_chatt_msg→chat, mb_member 프로필→member, sy_contact→contact, 그 밖→etc
        (썸네일 <ID>_thumbnail.<ext>·프레임은 원본과 같은 폴더로 간다)
     사이트를 알 수 없는 옛 첨부(어느 데이터에도 연결되지 않은 sy_attach)  →  _common/attach/etc/yyyy/mm/dd/…
     pd_prod.thumbnail_url 의 옛 상대경로 /cdn/prod/img/shop/product/…    →  https://…/api/cdn/<사이트>/attach/prod/_sample/…  (전체 주소로)
        · FO(resolveCdnUrl)·BO(cofImgSrc) 모두 http 로 시작하는 값은 그대로 쓴다. 상대경로로 두면 BO 미리보기가 assets/cdn/… 을 찾아 깨진다.
     1차 규칙 형식 SI26/<사이트>_<모듈>/<업무>/… 으로 올라간 파일이 있으면  →  SI26/<사이트>_<모듈>/attach/<새 업무>/…

  원칙
     · 같은 파일을 여러 사이트가 쓰면(샘플 상품 이미지, ec2 복사본) 사이트마다 한 벌씩 "복사"한다 — 사이트 폴더만 지워도 다른 사이트가 깨지지 않게.
     · 옛 파일은 지우지 않는다. 옛 URL 은 계속 열린다(ecBeCdn 의 경로 서빙은 그대로). 정리는 맨 끝 cleanup-plan 으로 따로.
     · URL 의 호스트도 공개 주소(https://22400.illeesam.synology.me)로 통일한다 — http://illeesam.synology.me:22400 · host.docker.internal:22400
       (브라우저에서 열리지 않는 주소) 로 저장된 행이 있다.
     · picsum.photos 외부 이미지·http://localhost:3000/cdn/… 은 바꾸지 않는다(dry 에 숫자만).

  단계 (이 순서)
     1) dry          무엇이 어떻게 바뀌는지 출력(읽기 전용). --http 를 붙이면 옛 파일이 실제로 열리는지(HTTP)도 확인
     2) plan         파일 복사 스크립트·목록을 만든다(로컬 파일만 생성):  cdnmove_20261004_out/copy_files.sh · manifest.tsv
     3) (사용자) NAS 에서 복사 실행:  ssh <NAS> 'cd /volume1/docker/shopjoy/storage/ecBeCdnStorage/cdn && sh -s' < cdnmove_20261004_out/copy_files.sh
     4) verify       새 URL 이 전부 HTTP 200 인지 확인(읽기 전용)
     5) run          DB URL 을 새 경로로 UPDATE (한 트랜잭션, 바꾼 값은 백업 스키마 shopjoy_2604_bak_cdnmove_20261004._changes 에 기록).
                     verify 를 먼저 다시 돌려 하나라도 200 이 아니면 아무것도 바꾸지 않는다.
     6) cleanup-plan 더 이상 어떤 데이터도 가리키지 않는 옛 파일 목록·삭제 스크립트를 만든다(만들기만 — 실행은 충분히 지켜본 뒤 사용자가)
     ·  revert       _changes 로 원래 URL 복원(복사된 파일은 그대로 둔다)
     ·  status       적용 여부(종료코드 0=적용됨, 3=미적용)

  base64 로 들어간 이미지(data:image…)
     b64dry          어느 행에 몇 건, 얼마나 큰지 출력
     b64run          파일로 올리고(ecBeCdn /api/cdn/upload, folder=SI26/<사이트>_<모듈>/attach/<업무>) URL 로 교체 — 새 ecBeCdn(2차 규칙) 배포 뒤에만

  사용법 (DB_PASSWORD 는 일회성 환경변수로만)
     PowerShell: $env:DB_PASSWORD='…'; python cdnmove_20261004_site_folder.py dry --http
     bash      : DB_PASSWORD='…' python cdnmove_20261004_site_folder.py dry

  전제: run_all_20261004.py pre 가 끝나 있어야 한다(sy_site.module_cd, cm_chatt.site_id 등). 그 전에도 dry 는 돌며, 아직 사이트를 알 수 없는 테이블은 "pre 뒤 처리"로 표시한다.
"""
import base64
import collections
import hashlib
import os
import re
import sys
import urllib.request
import uuid

import psycopg2

try:
    if sys.stdout.isatty():
        sys.stdout.reconfigure(errors="replace")
    else:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_cdnmove_20261004"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "cdnmove_20261004_out")
PUBLIC_BASE = os.environ.get("CDN_PUBLIC_BASE", "https://22400.illeesam.synology.me").rstrip("/")
NAS_ROOT = "/volume1/docker/shopjoy/storage/ecBeCdnStorage/cdn"
USAGE = "사용법: python cdnmove_20261004_site_folder.py dry [--http] | plan | verify | run | revert | status | cleanup-plan | b64dry | b64run"

# 옛 URL 의 호스트 형태 — 전부 같은 ecBeCdn 을 가리킨다
HOSTS = [r"https?://22400\.illeesam\.synology\.me", r"https?://illeesam\.synology\.me:22400", r"https?://host\.docker\.internal:22400"]
URL_RE = re.compile(r"(?P<host>" + "|".join(HOSTS) + r")?/api/cdn/(?P<path>[A-Za-z0-9_\-./%]+)")
COMMON = "_common"
# 이미 새 구조인 경로
NEW_PREFIX_RE = re.compile(r"^(?:[A-Za-z]{2}[0-9]{2}/[A-Za-z0-9]+_[A-Za-z0-9]+/(?:design|attach|private|temp)/|_common/(?:design|attach)/)")
# 사이트 폴더로 시작하는 경로(1차 규칙 형식 포함)
SITE_PREFIX_RE = re.compile(r"^([A-Za-z]{2}[0-9]{2}/[A-Za-z0-9]+_[A-Za-z0-9]+)/(.+)$")
REL_CDN_RE = re.compile(r"^/cdn/([A-Za-z0-9_\-./%]+)$")   # 옛 상대경로(/cdn/prod/…) — 값 전체가 경로 하나
# 업무 폴더 — ecBeBo CdnBizDir · ecBeCdn CfStorageService.BIZ_DIRS · 공통코드 CDN_BIZ_CD 와 같은 목록(앞쪽이 우선)
BIZ_DIRS = ["prod", "review", "qna", "board", "chat", "member", "contact", "seller", "etc"]
BIZ_KEYWORDS = [("review", "review"), ("qna", "qna"), ("chat", "chat"), ("contact", "contact"), ("profile", "member"), ("member", "member"),
                ("seller", "seller"), ("vendor", "seller"), ("bbs", "board"), ("board", "board"), ("notice", "board"), ("faq", "board"),
                ("blog", "board"), ("prod", "prod")]
# 그 파일을 가리키는 테이블 → 업무
TABLE_BIZ = {"pd_prod_img": "prod", "pd_prod": "prod", "pd_prod_content": "prod", "pd_review": "review", "pd_prod_qna": "qna",
             "cm_bbs": "board", "sy_notice": "board", "cm_faq": "board", "cm_blog": "board", "cm_chatt_msg": "chat",
             "mb_member": "member", "sy_contact": "contact", "sy_contact_content": "contact", "dp_panel_item": "etc", "sy_vendor": "seller"}
SAMPLE_PREFIX = "prod/img/shop/product/"     # 샘플 상품 이미지
DESIGN_PREFIX = "prod/img/"                  # 그 밖의 prod/img/<종류>/… 는 디자인 파일
DESIGN_RENAME = {"client": "logo"}           # 고객사 로고
DATE_ONLY_RE = re.compile(r"^[0-9]{4}/[0-9]{2}/[0-9]{2}/")
# /api/cdn/ 아래 고정 경로(파일이 아님) — 바꾸지 않는다
RESERVED = ("auth/", "client/", "file/", "storage/", "serve/", "config/", "log/", "db/", "redis/", "upload")
THUMB_SUFFIX_RE = re.compile(r"(?:_thumbnail|_frame)?\.[A-Za-z0-9]+$")
DATA_RE = re.compile(r"data:image/(?P<ext>png|jpeg|jpg|gif|webp);base64,(?P<b64>[A-Za-z0-9+/=]+)")

# (테이블, PK, 컬럼, 사이트를 구하는 SQL 식(별칭 t), 필요한 조인, 그 조인에 필요한 (테이블,컬럼) — 없으면 "pre 뒤 처리")
#   사이트는 site_id 로만 구한다(reg_site_id 는 감사 필드). 단, 어디에도 연결되지 않은 sy_attach 는 다른 데이터가 같은 파일을 가리킬 때만 그 사이트를 따른다.
TARGETS = [
    ("pd_prod_img", "prod_img_id", "cdn_img_url", "coalesce(t.site_id, p.site_id)", f"LEFT JOIN {S}.pd_prod p ON p.prod_id = t.prod_id", []),
    ("pd_prod_img", "prod_img_id", "cdn_thumb_url", "coalesce(t.site_id, p.site_id)", f"LEFT JOIN {S}.pd_prod p ON p.prod_id = t.prod_id", []),
    ("pd_prod", "prod_id", "thumbnail_url", "t.site_id", "", []),
    ("pd_prod", "prod_id", "content_html", "t.site_id", "", []),
    ("pd_prod_content", "prod_content_id", "content_html", "t.site_id", "", []),
    ("pd_review", "review_id", "review_content", "t.site_id", "", []),
    ("dp_panel_item", "panel_item_id", "widget_config_json", "t.site_id", "", []),
    ("mb_member", "member_id", "profile_img_url", "t.site_id", "", []),
    ("sy_contact", "contact_id", "contact_content", "t.site_id", "", [("sy_contact", "site_id")]),
    ("cm_chatt_msg", "chatt_msg_id", "msg_text", "c.site_id", f"LEFT JOIN {S}.cm_chatt c ON c.chatt_id = t.chatt_id", [("cm_chatt", "site_id")]),
    ("sy_notice", "notice_id", "content_html", "t.site_id", "", [("sy_notice", "site_id")]),
    ("cm_faq", "faq_id", "faq_answer", "t.site_id", "", [("cm_faq", "site_id")]),
    ("cm_bbs", "bbs_id", "content_html", "t.site_id", "", [("cm_bbs", "site_id")]),
    ("cm_blog", "blog_id", "blog_content", "t.site_id", "", [("cm_blog", "site_id")]),
]
# sy_attach — 연결된 데이터(ref_table_nm/ref_id)의 사이트를 따른다
ATTACH_COLS = ["cdn_img_url", "thumb_url", "thumb_cdn_url", "cdn_thumb_url", "attach_url"]
ATTACH_REF = {  # ref_table_nm → (테이블, PK, 사이트 식(별칭 r), 조인)
    "pd_prod_img": ("pd_prod_img", "prod_img_id", "coalesce(r.site_id, p.site_id)", f"LEFT JOIN {S}.pd_prod p ON p.prod_id = r.prod_id"),
    "pd_review": ("pd_review", "review_id", "r.site_id", ""),
    "pd_prod_qna": ("pd_prod_qna", "prod_qna_id", "r.site_id", ""),
    "sy_contact_content": ("sy_contact", "contact_id", "r.site_id", ""),
    "sy_contact": ("sy_contact", "contact_id", "r.site_id", ""),
    "cm_bbs": ("cm_bbs", "bbs_id", "r.site_id", ""),
    "mb_member": ("mb_member", "member_id", "r.site_id", ""),
}


def connect(readonly):
    if not os.environ.get("DB_PASSWORD"):
        sys.exit("DB_PASSWORD 환경변수가 없습니다 — 실행할 때만 넣어 주세요.")
    c = psycopg2.connect(host=os.environ.get("DB_HOST", "illeesam.synology.me"), port=int(os.environ.get("DB_PORT", "17632")),
                         dbname=os.environ.get("DB_NAME", "postgres"), user=os.environ.get("DB_USERNAME", "postgres"),
                         password=os.environ["DB_PASSWORD"], connect_timeout=15, application_name="cdnmove_20261004")
    c.set_client_encoding("UTF8")
    if readonly:
        c.set_session(readonly=True, autocommit=True)
    return c


def biz_dir(v):
    """업무 값(옛 값 포함) → 정해진 업무 폴더"""
    b = (v or "").strip().lower()
    if b in BIZ_DIRS:
        return b
    for key, d in BIZ_KEYWORDS:
        if key in b:
            return d
    return "etc"


def base_key(path):
    """원본·썸네일·프레임을 한 묶음으로 보는 키(폴더 + 파일 ID) — 썸네일은 원본 옆에 둔다"""
    d, _, name = path.rpartition("/")
    return d + "/" + THUMB_SUFFIX_RE.sub("", name)


def new_sub(old_rel, biz):
    """옛 상대경로 → 사이트 폴더 아래 새 경로. biz 는 날짜 폴더만 있던 파일에만 쓰인다(그 파일을 가리키는 테이블로 정한 업무)"""
    if DATE_ONLY_RE.match(old_rel):
        return f"attach/{biz}/{old_rel}"
    if old_rel.startswith(SAMPLE_PREFIX):
        return "attach/prod/_sample/" + old_rel[len(SAMPLE_PREFIX):]
    if old_rel.startswith(DESIGN_PREFIX):
        rest = old_rel[len(DESIGN_PREFIX):]
        if "/" not in rest:
            return "design/etc/" + rest
        kind, tail = rest.split("/", 1)
        return f"design/{DESIGN_RENAME.get(kind, kind)}/{tail}"
    first, _, tail = old_rel.partition("/")
    if first == "attach" and "/" in tail:                       # attach/prod_img/… → attach/prod/…
        old_biz, _, tail2 = tail.partition("/")
        return f"attach/{biz_dir(old_biz)}/{tail2}"
    if tail and biz_dir(first) != "etc":                        # <옛 업무 폴더>/… (예: CONTACT_CONTENT_ATTACH/…)
        return f"attach/{biz_dir(first)}/{tail}"
    return f"attach/{biz}/{old_rel}"


def new_rel(old_rel, folder, biz):
    """옛 상대경로 → 새 상대경로. folder = 사이트 폴더(SI26/SI260001_ec1) 또는 _common"""
    m = SITE_PREFIX_RE.match(old_rel)
    if m:                                                       # 1차 규칙 형식 SI26/<사이트>/<업무>/… → 같은 사이트의 attach/<새 업무>/…
        first, _, tail = m.group(2).partition("/")
        if first == "attach" and "/" in tail:
            first, _, tail = tail.partition("/")
        return f"{m.group(1)}/attach/{biz_dir(first)}/{tail}"
    sub = new_sub(old_rel, biz)
    if folder == COMMON and sub.startswith("attach/"):          # 공용 첨부는 etc 로만
        sub = "attach/etc/" + sub.split("/", 2)[2]
    return folder + "/" + sub


class Plan:
    """DB 를 읽어 바꿀 내용을 계산한다 (SELECT 만)"""

    def __init__(self, conn):
        self.cur = conn.cursor()
        self.cols = collections.defaultdict(set)
        for t, c in self.q("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = %s", (S,)):
            self.cols[t].add(c)
        mod_col = "module_cd" if "module_cd" in self.cols["sy_site"] else "tenant_module"
        self.site_folder = {}
        for sid, mod in self.q(f"SELECT site_id, {mod_col} FROM {S}.sy_site"):
            if re.match(r"^[A-Za-z]{2}[0-9]{2}[A-Za-z0-9]+$", sid or ""):
                m = mod.strip() if mod and re.match(r"^[A-Za-z0-9]+$", mod.strip()) else "none"
                self.site_folder[sid] = f"{sid[:4]}/{sid}_{m}"
        self.changes = []          # (table, pk_col, pk, col, old_value, new_value)
        self.copies = {}           # new_rel → old_rel
        self.pending = []          # pre 뒤 처리(사이트 컬럼 없음)
        self.common = collections.Counter()    # (table.col) → 행 수 (사이트를 알 수 없어 _common 으로)
        self.common_paths = set()
        self.no_site_paths = set()             # (옛 이름 — cleanup-plan 이 본다. 이제는 사이트 불명도 _common 으로 옮기므로 비어 있다)
        self.per_target = collections.Counter()
        self.url_sites = collections.defaultdict(set)  # old_rel → {site}
        self.refs = collections.defaultdict(lambda: collections.defaultdict(set))   # 파일 키 → {site → {업무}}
        self.rel_rows = 0          # pd_prod.thumbnail_url 옛 상대경로 행 수
        self._scan()

    def q(self, sql, args=None):
        self.cur.execute(sql, args)
        return self.cur.fetchall()

    # 1차: 어느 사이트·업무가 어떤 파일을 가리키는지 모은다
    def _note(self, value, site, biz):
        if not site or site not in self.site_folder:
            return
        for m in URL_RE.finditer(value or ""):
            path = m.group("path")
            if path.startswith(RESERVED) or NEW_PREFIX_RE.match(path):
                continue
            self.refs[base_key(path)][site].add(biz)

    def _biz(self, path, site, fallback):
        got = self.refs.get(base_key(path), {}).get(site) or {fallback}
        return next((b for b in BIZ_DIRS if b in got), "etc")

    def _rewrite(self, value, site, label, biz):
        """문자열 안의 CDN URL 을 모두 새 경로로. 반환: 새 문자열(바뀐 것이 없으면 원래 값)"""
        folder = self.site_folder.get(site) if site else None
        used_common = []

        def repl(m):
            path = m.group("path")
            if path.startswith(RESERVED):
                return m.group(0)
            host = PUBLIC_BASE if m.group("host") else ""
            if NEW_PREFIX_RE.match(path):                       # 이미 새 경로 — 호스트만 통일
                return f"{host}/api/cdn/{path}"
            if folder:
                self.url_sites[path].add(site)
                nr = new_rel(path, folder, self._biz(path, site, biz))
            else:                                               # 사이트를 알 수 없음 → 공용 폴더
                nr = new_rel(path, COMMON, "etc")
                if nr.startswith(COMMON + "/"):
                    self.common_paths.add(path)
                    used_common.append(path)
            self.copies[nr] = path
            return f"{host}/api/cdn/{nr}"

        new = URL_RE.sub(repl, value)
        if used_common:
            self.common[label] += 1
        return new

    def _scan(self):
        like = "(t.\"{c}\" LIKE '%%/api/cdn/%%')"
        loaded = []     # (table, pk, col, label, rows)
        for table, pk, col, site_expr, join, needs in TARGETS:
            if table not in self.cols or col not in self.cols[table]:
                continue
            label = f"{table}.{col}"
            missing = [f"{t}.{c}" for t, c in needs if c not in self.cols.get(t, set())]
            if missing or ("t.site_id" in site_expr and "site_id" not in self.cols[table]):
                n = self.q(f"SELECT count(*) FROM {S}.{table} t WHERE " + like.format(c=col))[0][0]
                if n:
                    self.pending.append((label, n, ", ".join(missing) or f"{table}.site_id"))
                continue
            rows = self.q(f"SELECT t.{pk}, t.\"{col}\", {site_expr} FROM {S}.{table} t {join} WHERE " + like.format(c=col))
            loaded.append((table, pk, col, label, rows))
            for pkv, val, site in rows:
                self._note(val, site, TABLE_BIZ.get(table, "etc"))
        attach = self._load_attach()
        for aid, site, biz, cols, vals in attach:
            for v in vals:
                self._note(v, site, biz)
        # 2차: 바꿀 값 계산
        for table, pk, col, label, rows in loaded:
            for pkv, val, site in rows:
                new = self._rewrite(val, site, label, TABLE_BIZ.get(table, "etc"))
                if new != val:
                    self.changes.append((table, pk, pkv, col, val, new))
                    self.per_target[label] += 1
        self._scan_rel()
        for aid, site, biz, cols, vals in attach:
            if not site:   # 연결 안 된 첨부 — 다른 데이터가 같은 파일을 가리키면(본문에 넣은 이미지, 채팅 사진, 프로필) 그 사이트를 따른다
                for v in vals:
                    m = URL_RE.search(v or "")
                    sites = self.refs.get(base_key(m.group("path")), {}) if m else {}
                    if len(sites) == 1:
                        site = next(iter(sites))
                        break
            for c, v in zip(cols, vals):
                if not v:
                    continue
                new = self._rewrite(v, site, f"sy_attach.{c}", biz)
                if new != v:
                    self.changes.append(("sy_attach", "attach_id", aid, c, v, new))
                    self.per_target[f"sy_attach.{c}"] += 1

    def _load_attach(self):
        """sy_attach 행 — [(attach_id, 사이트(연결된 데이터 기준, 없으면 None), 업무, 컬럼들, 값들)]"""
        if "sy_attach" not in self.cols:
            return []
        cols = [c for c in ATTACH_COLS if c in self.cols["sy_attach"]]
        site_of = {}
        for ref, (rt, rpk, expr, join) in ATTACH_REF.items():
            if rt not in self.cols or ("r.site_id" in expr and "site_id" not in self.cols[rt]):
                n = self.q(f"SELECT count(*) FROM {S}.sy_attach WHERE ref_table_nm = %s", (ref,))[0][0]
                if n:
                    self.pending.append((f"sy_attach(ref={ref})", n, f"{rt}.site_id"))
                continue
            for aid, site in self.q(f"SELECT a.attach_id, {expr} FROM {S}.sy_attach a JOIN {S}.{rt} r ON r.{rpk} = a.ref_id {join} WHERE a.ref_table_nm = %s", (ref,)):
                site_of[aid] = site
        sel = ", ".join(f'a."{c}"' for c in cols)
        rows = self.q(f"SELECT a.attach_id, a.ref_table_nm, {sel} FROM {S}.sy_attach a WHERE " + " OR ".join(f"a.\"{c}\" LIKE '%%/api/cdn/%%'" for c in cols))
        return [(r[0], site_of.get(r[0]), TABLE_BIZ.get(r[1] or "", "etc"), cols, list(r[2:])) for r in rows]

    def _scan_rel(self):
        """pd_prod.thumbnail_url 의 옛 상대경로(/cdn/prod/…) → 그 상품 사이트 폴더의 새 경로(전체 주소).
        FO(resolveCdnUrl)·BO(cofImgSrc)·SEO(toAbsoluteUrl) 모두 http 로 시작하는 값은 그대로 쓴다 — 같은 컬럼에 이미 전체 주소로 든 행이 있다."""
        if "thumbnail_url" not in self.cols.get("pd_prod", set()):
            return
        for pkv, val, site in self.q(f"SELECT prod_id, thumbnail_url, site_id FROM {S}.pd_prod WHERE thumbnail_url LIKE '/cdn/%%'"):
            m = REL_CDN_RE.match(val)
            if not m or m.group(1).startswith(RESERVED) or NEW_PREFIX_RE.match(m.group(1)):
                continue
            path = m.group(1)
            folder = self.site_folder.get(site)
            if folder:
                self.url_sites[path].add(site)
            else:
                self.common_paths.add(path)
                self.common["pd_prod.thumbnail_url"] += 1
            nr = new_rel(path, folder or COMMON, "prod")
            self.copies[nr] = path
            self.changes.append(("pd_prod", "prod_id", pkv, "thumbnail_url", val, f"{PUBLIC_BASE}/api/cdn/{nr}"))
            self.per_target["pd_prod.thumbnail_url"] += 1
            self.rel_rows += 1

    # cf_file: 한 곳으로만 옮겨진 파일은 경로를 새 위치로(파일ID 로 지울 때 새 파일이 지워지게). 여러 사이트가 나눠 가진 파일은 그대로 둔다
    def cf_file_changes(self):
        if "cf_file" not in self.cols:
            return []
        targets = collections.defaultdict(set)
        for nr, old in self.copies.items():
            targets[old].add(nr)
        out = []
        for fid, fp, tp, frp in self.q(f"SELECT file_id, file_path, thumbnail_path, frame_path FROM {S}.cf_file"):
            if not fp or NEW_PREFIX_RE.match(fp) or len(targets.get(fp, ())) != 1:
                continue
            nr = next(iter(targets[fp]))
            ndir = nr.rpartition("/")[0]
            out.append(("cf_file", "file_id", fid, "file_path", fp, nr))
            for col, old in (("thumbnail_path", tp), ("frame_path", frp)):
                if old and not NEW_PREFIX_RE.match(old):
                    n2 = ndir + "/" + old.rpartition("/")[2]      # 썸네일·프레임은 원본 옆
                    self.copies.setdefault(n2, old)
                    out.append(("cf_file", "file_id", fid, col, old, n2))
        return out

    def file_sizes(self):
        if "cf_file" not in self.cols:
            return {}
        return {r[0]: r[1] for r in self.q(f"SELECT file_path, file_size FROM {S}.cf_file")}


def folder_group(nr):
    """새 경로 → (사이트 폴더 이름 또는 _common, 종류/하위) — 요약용"""
    parts = nr.split("/")
    if parts[0] == COMMON:
        return COMMON, "/".join(parts[1:3])
    return parts[1], "/".join(parts[2:4])


def http_status(url):
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def summarize(p, cf, http=False):
    print(f"[요약] 사이트 폴더: " + ", ".join(sorted(p.site_folder.values())[:8]) + (" …" if len(p.site_folder) > 8 else ""))
    print(f"  DB URL 변경 {len(p.changes)}행(값 기준) + cf_file 경로 {len(cf)}건")
    for k, v in sorted(p.per_target.items(), key=lambda x: -x[1]):
        print(f"    {k:<36} {v:>6}행")
    olds = set(p.copies.values())
    sizes = p.file_sizes()
    known = sum(sizes.get(o, 0) for o in olds)
    per_site = collections.Counter(folder_group(nr)[0] for nr in p.copies)
    per_group = collections.Counter(folder_group(nr) for nr in p.copies)
    print(f"  복사할 파일 {len(p.copies)}개 (원본 {len(olds)}개 — 여러 사이트가 같이 쓰는 원본 {sum(1 for o in olds if len(p.url_sites.get(o, ())) > 1)}개)")
    print(f"    용량: cf_file 에 기록된 원본 {sum(1 for o in olds if o in sizes)}개 = {known / 1048576:.1f}MB (나머지는 cf_file 에 없는 옛 샘플·첨부 — 크기 모름)")
    for k, v in sorted(per_site.items()):
        print(f"    {k:<28} {v:>5}개   (" + ", ".join(f"{g} {n}" for (st, g), n in sorted(per_group.items()) if st == k) + ")")
    if p.rel_rows:
        print(f"  pd_prod.thumbnail_url 옛 상대경로(/cdn/…) {p.rel_rows}행 → 상품 사이트 폴더의 전체 주소로 (위 변경 행 수에 포함)")
    if p.pending:
        print("  [pre 뒤 처리] 사이트 컬럼이 아직 없어 지금은 계산하지 않은 것:")
        for label, n, why in p.pending:
            print(f"    {label:<36} {n:>6}행  (필요: {why})")
    if p.common or p.common_paths:
        print(f"  [공용 폴더로] 사이트를 알 수 없는 파일 {len(p.common_paths)}개 → {COMMON}/attach/etc/… (디자인성 경로는 {COMMON}/design/…):")
        for k, v in p.common.items():
            print(f"    {k:<36} {v:>6}행")
        for path in sorted(p.common_paths)[:5]:
            print(f"      {path}")
        if len(p.common_paths) > 5:
            print(f"      … 외 {len(p.common_paths) - 5}개")
    if http:
        bad = [(o, st) for o in sorted(olds) for st in [http_status(f"{PUBLIC_BASE}/api/cdn/{o}")] if st != 200]
        print(f"  [옛 파일 확인] {len(olds)}개 중 열리지 않는 것 {len(bad)}개")
        for o, st in bad[:20]:
            print(f"    HTTP {st}  {o}")
    print("  표본:")
    for t, pk, pkv, col, old, new in p.changes[:1] + p.changes[len(p.changes) // 2: len(p.changes) // 2 + 1] + p.changes[-1:]:
        mo, mn = URL_RE.search(old), URL_RE.search(new)
        print(f"    {t}.{col} [{pkv}]\n      옛: {mo.group(0) if mo else old[:120]}\n      새: {mn.group(0) if mn else new[:120]}")


def legacy_report(conn):
    """이 스크립트가 바꾸지 않는 이상 데이터 — 목록만"""
    cur = conn.cursor()
    print("[이상 데이터 — 이 스크립트가 바꾸지 않는 것]")
    checks = [
        ("picsum.photos 외부 이미지 (pd_prod_img)", f"SELECT count(*) FROM {S}.pd_prod_img WHERE cdn_img_url LIKE '%%picsum.photos%%'"),
        ("http://localhost:3000/cdn/… (md_cb_pattern.thumbnail_url)", f"SELECT count(*) FROM {S}.md_cb_pattern WHERE thumbnail_url LIKE 'http://localhost%%'"),
        ("http://localhost:3000/cdn/… (md_sg_project.thumbnail_url)", f"SELECT count(*) FROM {S}.md_sg_project WHERE thumbnail_url LIKE 'http://localhost%%'"),
    ]
    for label, sql in checks:
        try:
            cur.execute(sql)
            print(f"    {cur.fetchone()[0]:>6}행  {label}")
        except Exception as e:
            print(f"    (조회 실패) {label}: {str(e).strip()[:80]}")


def write_plan(p):
    os.makedirs(OUT, exist_ok=True)
    lines = ["#!/bin/sh", "# cdnmove_20261004 — NAS 의 CDN 저장 폴더에서 실행한다: cd " + NAS_ROOT + " && sh copy_files.sh",
             "# 복사만 한다(옛 파일은 그대로). 이미 있는 파일은 덮어쓰지 않는다(다시 실행해도 안전).", "set -u", "ok=0; miss=0; skip=0"]
    for d in sorted({os.path.dirname(nr) for nr in p.copies}):
        lines.append(f"mkdir -p '{d}'")
    for nr, old in sorted(p.copies.items()):
        lines.append(f"if [ -f '{nr}' ]; then skip=$((skip+1)); elif [ -f '{old}' ]; then cp -p '{old}' '{nr}' && ok=$((ok+1)); else echo \"원본 없음: {old}\"; miss=$((miss+1)); fi")
    lines.append('echo "복사 $ok · 이미 있음 $skip · 원본 없음 $miss"')
    with open(os.path.join(OUT, "copy_files.sh"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    with open(os.path.join(OUT, "manifest.tsv"), "w", encoding="utf-8", newline="\n") as f:
        f.write("old_rel\tnew_rel\n" + "".join(f"{old}\t{nr}\n" for nr, old in sorted(p.copies.items())))
    print(f"[plan] 만든 파일:\n  {os.path.join(OUT, 'copy_files.sh')}  (복사 {len(p.copies)}건)\n  {os.path.join(OUT, 'manifest.tsv')}")
    print(f"  다음(사용자 실행): ssh <NAS 계정>@illeesam.synology.me 'cd {NAS_ROOT} && sh -s' < \"{os.path.join(OUT, 'copy_files.sh')}\"")
    print("  그다음: python cdnmove_20261004_site_folder.py verify → run")


def verify(p):
    bad = []
    for nr in sorted(p.copies):
        st = http_status(f"{PUBLIC_BASE}/api/cdn/{nr}")
        if st != 200:
            bad.append((nr, st))
    print(f"[verify] 새 URL {len(p.copies)}개 중 HTTP 200 {len(p.copies) - len(bad)}개 · 실패 {len(bad)}개")
    for nr, st in bad[:20]:
        print(f"    HTTP {st}  {PUBLIC_BASE}/api/cdn/{nr}")
    return not bad


def applied(conn):
    cur = conn.cursor()
    cur.execute("SELECT to_regclass(%s)", (f"{BAK}._changes",))
    return cur.fetchone()[0] is not None


def run():
    ro = connect(True)
    if applied(ro):
        print("[run] 이미 적용돼 있습니다(백업 스키마 있음) — 건너뜁니다. 새로 생긴 옛 경로 URL 을 더 옮기려면 revert 없이 다시 돌릴 수 없으니 백업 스키마 이름을 확인하세요.")
        return 0
    p = Plan(ro)
    cf = p.cf_file_changes()
    summarize(p, cf)
    ro.close()
    if "module_cd" not in p.cols["sy_site"] or "site_id" not in p.cols.get("cm_chatt", set()):
        sys.exit("[중단] run_all_20261004.py pre 가 아직입니다(sy_site.module_cd · cm_chatt.site_id 없음). 아무것도 바꾸지 않았습니다.")
    if p.pending:
        print("  [알림] 위 'pre 뒤 처리' 항목은 사이트 컬럼이 없는 테이블이라 이번에도 옮기지 않습니다(옛 경로 그대로 서빙).")
    if not p.changes:
        print("[run] 바꿀 것이 없습니다.")
        return 0
    if not verify(p):
        sys.exit("[중단] 새 경로에 파일이 없습니다 — plan 으로 만든 copy_files.sh 를 NAS 에서 먼저 실행하세요. 아무것도 바꾸지 않았습니다.")
    conn = connect(False)
    try:
        cur = conn.cursor()
        cur.execute("SET LOCAL lock_timeout = '10s'")
        cur.execute(f"CREATE SCHEMA {BAK}")
        cur.execute(f"CREATE TABLE {BAK}._changes (seq bigserial PRIMARY KEY, tbl text, pk_col text, pk text, col text, old_value text, new_value text, reg_date timestamp DEFAULT now())")
        n = 0
        for t, pk, pkv, col, old, new in p.changes + cf:
            cur.execute(f'UPDATE {S}.{t} SET "{col}" = %s WHERE {pk} = %s AND "{col}" = %s', (new, pkv, old))
            if cur.rowcount != 1:
                raise RuntimeError(f"{t}.{col} [{pkv}] 가 그사이 바뀌었습니다(갱신 {cur.rowcount}행) — 전체 롤백")
            cur.execute(f"INSERT INTO {BAK}._changes (tbl, pk_col, pk, col, old_value, new_value) VALUES (%s,%s,%s,%s,%s,%s)", (t, pk, str(pkv), col, old, new))
            n += 1
        conn.commit()
        print(f"[run] 완료 — {n}건 변경, 기록 {BAK}._changes")
    except Exception as e:
        conn.rollback()
        sys.exit(f"[실패 — 전부 롤백] {str(e).strip()}")
    finally:
        conn.close()
    return 0


def revert():
    conn = connect(False)
    try:
        if not applied(conn):
            print("[revert] 적용 기록이 없습니다.")
            return
        cur = conn.cursor()
        cur.execute(f"SELECT tbl, pk_col, pk, col, old_value, new_value FROM {BAK}._changes ORDER BY seq DESC")
        rows = cur.fetchall()
        back = skipped = 0
        for t, pk, pkv, col, old, new in rows:
            cur.execute(f'UPDATE {S}.{t} SET "{col}" = %s WHERE {pk} = %s AND "{col}" = %s', (old, pkv, new))
            back += cur.rowcount
            skipped += 1 - cur.rowcount
        cur.execute(f"DROP SCHEMA {BAK} CASCADE")
        conn.commit()
        print(f"[revert] 복원 {back}건 · 그사이 값이 바뀌어 건너뜀 {skipped}건. 복사된 파일(SI26/… · _common/…)은 그대로 둡니다.")
    except Exception as e:
        conn.rollback()
        sys.exit(f"[실패 — 롤백] {str(e).strip()}")
    finally:
        conn.close()


def cleanup_plan():
    conn = connect(True)
    if not applied(conn):
        sys.exit("[cleanup-plan] run 을 먼저 하세요.")
    cur = conn.cursor()
    cur.execute(f"SELECT old_value FROM {BAK}._changes")
    olds = set()
    for (v,) in cur.fetchall():
        mr = REL_CDN_RE.match(v)
        if mr:                                  # pd_prod.thumbnail_url 옛 상대경로
            olds.add(mr.group(1))
            continue
        for m in URL_RE.finditer(v if "/api/cdn/" in v else "/api/cdn/" + v):
            if not NEW_PREFIX_RE.match(m.group("path")):
                olds.add(m.group("path"))
    p = Plan(conn)   # 아직 옛 경로를 가리키는 데이터가 남았는지
    still = set(p.copies.values()) | p.no_site_paths
    cur.execute(f"SELECT thumbnail_url FROM {S}.pd_prod WHERE thumbnail_url LIKE '/cdn/%%'")
    still |= {v[5:] for (v,) in cur.fetchall()}
    safe = sorted(olds - still)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "cleanup_old_files.sh")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("#!/bin/sh\n# 옛 경로 파일 삭제 — 새 경로로 옮긴 뒤 충분히 지켜본 다음에만 실행. cd " + NAS_ROOT + " 에서.\n# 운영 중인 옛 FO/앱 빌드·캐시가 옛 URL 을 아직 쓸 수 있다. FO 소스가 직접 적어 둔 디자인 경로(prod/img/slider 등)도 새 경로로 바꾼 뒤에만.\n"
                + "".join(f"rm -f '{o}'\n" for o in safe))
    print(f"[cleanup-plan] 지워도 되는 옛 파일 {len(safe)}개 (아직 옛 경로를 가리키는 데이터가 있는 {len(olds & still)}개는 뺌)\n  {path}  — 만들기만 했습니다.")


# ── base64 이미지 ───────────────────────────────────────────────────────────
B64_TARGETS = [  # (테이블, PK, 컬럼, 사이트 식, 조인, 업무 폴더 — attach/<업무>)
    ("pd_prod_img", "prod_img_id", "cdn_img_url", "coalesce(t.site_id, p.site_id)", f"LEFT JOIN {S}.pd_prod p ON p.prod_id = t.prod_id", "prod"),
    ("pd_prod_img", "prod_img_id", "cdn_thumb_url", "coalesce(t.site_id, p.site_id)", f"LEFT JOIN {S}.pd_prod p ON p.prod_id = t.prod_id", "prod"),
    ("pd_prod_content", "prod_content_id", "content_html", "t.site_id", "", "prod"),
    ("sy_notice", "notice_id", "content_html", "t.site_id", "", "board"),
    ("cm_faq", "faq_id", "faq_answer", "t.site_id", "", "board"),
    ("sy_contact", "contact_id", "contact_content", "t.site_id", "", "contact"),
    ("sy_vendor", "vendor_id", "vendor_remark", "t.site_id", "", "seller"),
]


def b64_scan(conn):
    p = Plan(conn)
    cur = conn.cursor()
    items = []   # (table, pk, pkv, col, value, site, biz)
    for table, pk, col, expr, join, biz in B64_TARGETS:
        if table not in p.cols or col not in p.cols[table]:
            continue
        if "t.site_id" in expr and "site_id" not in p.cols[table]:
            cur.execute(f"SELECT count(*) FROM {S}.{table} t WHERE t.\"{col}\" LIKE '%%data:image%%'")
            n = cur.fetchone()[0]
            if n:
                print(f"  [pre 뒤 처리] {table}.{col} {n}행 — {table}.site_id 없음")
            continue
        cur.execute(f"SELECT t.{pk}, t.\"{col}\", {expr} FROM {S}.{table} t {join} WHERE t.\"{col}\" LIKE '%%data:image%%'")
        for pkv, val, site in cur.fetchall():
            items.append((table, pk, pkv, col, val, site, biz))
    return p, items


def b64dry():
    conn = connect(True)
    p, items = b64_scan(conn)
    total = imgs = 0
    uniq = set()
    for table, pk, pkv, col, val, site, biz in items:
        found = DATA_RE.findall(val)
        size = sum(len(b) * 3 // 4 for _, b in found)
        for _, b in found:
            uniq.add(hashlib.sha1(b.encode()).hexdigest())
        imgs += len(found)
        total += size
        print(f"  {table}.{col} [{pkv}] 사이트 {site or '?'} — 이미지 {len(found)}개 {size / 1024:.0f}KB → {p.site_folder.get(site, '(사이트 없음 — 건너뜀)')}/attach/{biz}")
    print(f"[b64dry] {len(items)}행 · 이미지 {imgs}개(내용이 다른 것 {len(uniq)}개) · {total / 1048576:.2f}MB — 아무것도 바꾸지 않았습니다.")


def cdn_upload(data, filename, mime, folder):
    boundary = "----cdnmove" + uuid.uuid4().hex
    body = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"thumbnail\"\r\n\r\nfalse\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"folder\"\r\n\r\n{folder}\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n".encode(),
        data, f"\r\n--{boundary}--\r\n".encode()])
    req = urllib.request.Request(f"{PUBLIC_BASE}/api/cdn/upload", data=body, method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    import json
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode("utf-8")).get("data") or {}
    url = d.get("fileUrl") or ""
    if not url.startswith("/api/cdn/" + folder + "/"):
        raise RuntimeError(f"올린 파일이 사이트 폴더에 들어가지 않았습니다({url}) — ecBeCdn 이 folder 인자를 아는 새 버전인지 확인하세요")
    return PUBLIC_BASE + url


def b64run():
    ro = connect(True)
    p, items = b64_scan(ro)
    ro.close()
    if not items:
        print("[b64run] 바꿀 것이 없습니다.")
        return
    conn = connect(False)
    cache = {}
    try:
        cur = conn.cursor()
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}_b64")
        cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}_b64._changes (seq bigserial PRIMARY KEY, tbl text, pk_col text, pk text, col text, old_value text, new_value text, reg_date timestamp DEFAULT now())")
        done = 0
        for table, pk, pkv, col, val, site, biz in items:
            folder = p.site_folder.get(site)
            if not folder:
                print(f"  건너뜀(사이트 없음): {table}.{col} [{pkv}]")
                continue

            def repl(m):
                key = hashlib.sha1(m.group("b64").encode()).hexdigest() + folder
                if key not in cache:
                    ext = "jpg" if m.group("ext") == "jpeg" else m.group("ext")
                    cache[key] = cdn_upload(base64.b64decode(m.group("b64")), f"b64-{key[:12]}.{ext}", f"image/{m.group('ext')}", f"{folder}/attach/{biz}")
                return cache[key]

            new = DATA_RE.sub(repl, val)
            if new != val:
                cur.execute(f'UPDATE {S}.{table} SET "{col}" = %s WHERE {pk} = %s', (new, pkv))
                cur.execute(f"INSERT INTO {BAK}_b64._changes (tbl, pk_col, pk, col, old_value, new_value) VALUES (%s,%s,%s,%s,%s,%s)", (table, pk, str(pkv), col, val, new))
                done += 1
        conn.commit()
        print(f"[b64run] 완료 — {done}행 교체, 올린 파일 {len(cache)}개. 원래 값은 {BAK}_b64._changes 에 있습니다.")
    except Exception as e:
        conn.rollback()
        sys.exit(f"[실패 — DB 는 롤백. 이미 올라간 파일 {len(cache)}개는 CDN 에 남습니다] {str(e).strip()}")
    finally:
        conn.close()


def main():
    args = sys.argv[1:]
    mode = args[0] if args else ""
    if mode in ("dry", "plan", "verify"):
        conn = connect(True)
        if applied(conn):
            print("[알림] 이미 run 한 적이 있습니다(백업 스키마 있음) — 아래는 그 뒤에 새로 생긴 옛 경로 URL 기준입니다.")
        p = Plan(conn)
        cf = p.cf_file_changes()
        if mode == "dry":
            summarize(p, cf, http="--http" in args)
            legacy_report(conn)
            print("(dry) 아무것도 바꾸지 않았습니다.")
        elif mode == "plan":
            summarize(p, cf)
            write_plan(p)
        else:
            sys.exit(0 if verify(p) else 1)
    elif mode == "run":
        sys.exit(run())
    elif mode == "revert":
        revert()
    elif mode == "status":
        conn = connect(True)
        ok = applied(conn)
        print("적용됨" if ok else "미적용")
        sys.exit(0 if ok else 3)
    elif mode == "cleanup-plan":
        cleanup_plan()
    elif mode == "b64dry":
        b64dry()
    elif mode == "b64run":
        b64run()
    else:
        sys.exit(USAGE)


if __name__ == "__main__":
    main()
