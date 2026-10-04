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
     prod/img/shop/banner/…   (쇼핑 배너)              →  <사이트>/design/banner/…
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

  값 전체가 옛 상대경로 하나인 컬럼 (REL_TARGETS — 2026-10-04 추가분 포함). 새 값은 모두 전체 주소 https://…/api/cdn/<사이트>/…
     pd_prod.thumbnail_url                      /cdn/prod/img/shop/product/…         →  <사이트>/attach/prod/_sample/…
     cm_blog_file.img_url · thumb_url           /cdn/prod/img/blog/…                 →  <사이트>/design/blog/…        (사이트 = 그 글 cm_blog.site_id)
     pm_event.img_url                           /cdn/prod/img/blog/…                 →  <사이트>/design/blog/…        (블로그 샘플과 같은 파일 → 같은 새 경로)
     pm_plan.thumbnail_url · banner_url         /cdn/prod/img/shop/banner/…          →  <사이트>/design/banner/…
     dp_widget · dp_widget_lib.thumbnail_url    assets/cdn/prod/img/shop/product/…   →  <사이트>/attach/prod/_sample/… (샘플 상품 이미지 — 상품과 같은 파일 → 같은 새 경로)
     md_cb_pattern · md_sg_project.thumbnail_url  http://localhost:3000/cdn/attach/<업무>/…  →  <사이트>/attach/etc/…
        · localhost 주소는 CDN 에 그 파일이 실제로 있을 때만(옛 주소 HTTP 200) 옮긴다. 없으면 그대로 두고 알린다.
     사이트: 행의 site_id(사이트 폴더가 있는 사이트)를 따르고, site_id 가 없거나 폴더를 모르면 기본 사이트 ec1(SI260001) 폴더로 간다.
        (pd_prod 만 예전대로 사이트 불명이면 _common)
     읽는 화면: FO resolveCdnUrl · BO cofImgSrc 는 http 로 시작하면 그대로 쓰고, 나머지(BO 기획전·코바늘·소스생성 목록)는 값을 그대로 src 로 쓴다 — 전체 주소가 안전.

  본문(HTML·JSON) 안에 든 옛 경로 (2026-10-04 3차 — 전수 조사 뒤 추가. 옛 폴더를 통째로 치워도 깨지지 않게)
     한 값 안에 주소가 여러 개 있을 수 있다. /api/cdn/<옛 경로> 는 예전대로, 상대경로(src='/cdn/prod/img/…' · "imageUrl": "assets/cdn/prod/img/…")는
     그 행 사이트 폴더의 전체 주소 https://…/api/cdn/<사이트>/… 로 바꾼다(사이트를 모르면 ec1). assets/cdn/pkg/…(BO 라이브러리)·확장자 없는 글자는 건드리지 않는다.
       cm_blog.blog_content · pm_event.event_content        /cdn/prod/img/blog/…           →  <사이트>/design/blog/…
       pm_plan.plan_desc                                    /cdn/prod/img/shop/banner/…    →  <사이트>/design/banner/…
       pd_prod.content_html · pd_prod_content.content_html  (/|assets/)cdn/prod/img/shop/product/…  →  <사이트>/attach/prod/_sample/…
       dp_panel.content_json · dp_widget(_lib).widget_config_json   assets/cdn/prod/img/shop/product/…  →  <사이트>/attach/prod/_sample/…
     읽는 화면 확인(전체 주소는 가공을 거쳐도 그대로다): FO fixRelativeCdnImgSrc 는 src="/cdn/ 으로 시작할 때만, BO cofHtmlCdnToAsset·BlogView 는 (src|href)="/cdn/ 일 때만,
       BO 저장 역변환 cofHtmlAssetToCdn 은 (src|href)="assets/cdn/ 일 때만 바꾼다. FO toSafeHtml 은 script·on*·javascript: 만 지운다. BO cofImgSrc 는 http 면 그대로.
     md_sg_download_hist · md_sg_sourcegen_hist.zip_url 의 http://localhost:3000/cdn/… 은 REL_TARGETS 규칙(CDN 에 있을 때만).
     cf_file(ecBeCdn 파일 대장)은 모든 행을 새 위치로: 여러 사이트가 나눠 가진 파일은 ec1 쪽 한 벌, 어느 데이터도 가리키지 않는 파일은 _common/attach/etc 로 복사.
     원본이 CDN 에 없는(옛 주소가 HTTP 200 이 아닌) 참조는 옮기지 않고 그대로 둔다(원래 깨진 것) — 목록만 알린다.

  FO 소스가 직접 가리키는 디자인 파일 (FO_DESIGN — DB 에는 없고 화면 소스가 주소를 적어 둔 것)
     ecFeFoNuxt4 의 useCdn().designUrl(용도, 파일) 이 <사이트>/design/<용도>/<파일> 을 가리킨다. DB 가 가리키지 않는 파일은 위 계산에 안 잡히므로
     아래 FO_DESIGN 목록(사이트별 옛 경로)을 같은 규칙(new_rel)으로 복사 목록에 더한다 — plan 의 copy_files.sh · verify · run 직전 확인에 모두 들어간다(DB 는 바꾸지 않는다).
     옛 주소가 열리지 않는(HTTP 200 이 아닌) 파일은 빼고 알린다. FO 화면에 고정 이미지를 더하면 이 목록에도 더할 것.

  원칙
     · 같은 파일을 여러 사이트가 쓰면(샘플 상품 이미지, ec2 복사본) 사이트마다 한 벌씩 "복사"한다 — 사이트 폴더만 지워도 다른 사이트가 깨지지 않게.
     · copy_files.sh 는 복사만 한다(옛 파일 그대로 — run 전·후 모두 옛 URL 이 열린다). 옛 폴더 정리는 맨 끝 cleanup-plan 으로 따로(지우지 않고 옮김).
     · URL 의 호스트도 공개 주소(https://22400.illeesam.synology.me)로 통일한다 — http://illeesam.synology.me:22400 · host.docker.internal:22400
       (브라우저에서 열리지 않는 주소) 로 저장된 행이 있다.
     · picsum.photos 외부 이미지는 외부 주소라 바꾸지 않는다(dry 에 숫자만). http://localhost:3000/cdn/… 은 CDN 에 파일이 있을 때만 옮긴다(위).

  단계 (이 순서)
     1) dry          무엇이 어떻게 바뀌는지 출력(읽기 전용). --http 를 붙이면 옛 파일이 실제로 열리는지(HTTP)도 확인
     2) plan         파일 복사 스크립트·목록을 만든다(로컬 파일만 생성):  cdnmove_20261004_out/copy_files.sh · manifest.tsv
     3) (사용자) NAS 에서 복사 실행:  ssh <NAS> 'cd /volume1/docker/shopjoy/storage/ecBeCdnStorage/cdn && sh -s' < cdnmove_20261004_out/copy_files.sh
     4) verify       새 URL 이 전부 HTTP 200 인지 확인(읽기 전용)
     5) run          DB URL 을 새 경로로 UPDATE (한 트랜잭션, 바꾼 값은 백업 스키마 shopjoy_2604_bak_cdnmove_20261004._changes 에 기록).
                     verify 를 먼저 다시 돌려 하나라도 200 이 아니면 아무것도 바꾸지 않는다.
                     다시 실행할 수 있다 — 그 뒤 새로 생긴 옛 경로만 더 바꾸고 같은 _changes 에 이어 적는다.
     6) cleanup-plan 옛 폴더 정리 스크립트 cleanup_files.sh 를 만든다(만들기만). 아래를 모두 통과해야 만들어진다:
                       (a) run 이 끝났고, 바꾼 새 URL·FO 디자인 파일이 전부 HTTP 200
                       (b) DB 전체(scan 과 같은 전수 조사 — 로그·이력 테이블 제외)에 살아 있는 옛 경로 참조가 0 (원본이 없는 깨진 참조·개발 PC 주소·BO 로컬 경로는 세지 않는다)
                       (c) FO 소스(FO_SRC)가 CDN 옛 폴더를 직접 가리키는 줄이 0 — 새 FO 를 배포했다면 --fo-ok 로 건너뛴다
                     cleanup_files.sh 는 NAS 에서 옛 폴더(2026 attach common contact_content_attach prod)를 지우지 않고 cdn 과 같은 위치의
                     _cdn_old_20261004/ 로 옮긴다(mv). SI26·_common 은 건드리지 않는다. 문제없으면 그 폴더를 사용자가 지운다.
     ·  scan         DB 전체 글자 컬럼에서 옛 CDN 경로 참조를 찾아 표로(읽기 전용) — 컬럼·행 수·종류·처리 여부
     ·  revert       _changes 로 원래 URL 복원(복사된 파일은 그대로 둔다). 옛 폴더를 이미 옮겼다면 먼저 되돌려 놓을 것(mv ../_cdn_old_20261004/* ./)
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
try:
    sys.stderr.reconfigure(errors="replace") if sys.stderr.isatty() else sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

S = "shopjoy_2604"
BAK = "shopjoy_2604_bak_cdnmove_20261004"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "cdnmove_20261004_out")
PUBLIC_BASE = os.environ.get("CDN_PUBLIC_BASE", "https://22400.illeesam.synology.me").rstrip("/")
NAS_ROOT = "/volume1/docker/shopjoy/storage/ecBeCdnStorage/cdn"
USAGE = "사용법: python cdnmove_20261004_site_folder.py dry [--http] | plan | verify | run | revert | status | scan | cleanup-plan [--fo-ok] | b64dry | b64run"

# 옛 URL 의 호스트 형태 — 전부 같은 ecBeCdn 을 가리킨다
HOSTS = [r"https?://22400\.illeesam\.synology\.me", r"https?://illeesam\.synology\.me:22400", r"https?://host\.docker\.internal:22400"]
URL_RE = re.compile(r"(?P<host>" + "|".join(HOSTS) + r")?/api/cdn/(?P<path>[A-Za-z0-9_\-./%]+)")
COMMON = "_common"
# 이미 새 구조인 경로
NEW_PREFIX_RE = re.compile(r"^(?:[A-Za-z]{2}[0-9]{2}/[A-Za-z0-9]+_[A-Za-z0-9]+/(?:design|attach|private|temp)/|_common/(?:design|attach)/)")
# 사이트 폴더로 시작하는 경로(1차 규칙 형식 포함)
SITE_PREFIX_RE = re.compile(r"^([A-Za-z]{2}[0-9]{2}/[A-Za-z0-9]+_[A-Za-z0-9]+)/(.+)$")
REL_CDN_RE = re.compile(r"^/cdn/([A-Za-z0-9_\-./%]+)$")   # 옛 상대경로(/cdn/prod/…) — 값 전체가 경로 하나
# 값 전체가 옛 경로 하나인 여러 형태: /cdn/… · cdn/… · assets/cdn/…(BO 로컬 파일 경로) · http://localhost:3000/cdn/…(개발 PC 주소로 저장된 것)
REL_ANY_RE = re.compile(r"^(?:(?P<local>https?://(?:localhost|127\.0\.0\.1)(?::[0-9]+)?/)|/)?(?:assets/)?cdn/(?P<path>[A-Za-z0-9_\-./%]+)$")
DEFAULT_SITE = "SI260001"                    # site_id 가 없거나 판단할 수 없는 행이 가는 사이트(ec1)
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
DESIGN_PREFIX_RENAME = {"shop/banner/": "banner/"}   # 쇼핑 배너 — prod/img/shop/banner/… → design/banner/…
DATE_ONLY_RE = re.compile(r"^[0-9]{4}/[0-9]{2}/[0-9]{2}/")
# /api/cdn/ 아래 고정 경로(파일이 아님) — 바꾸지 않는다
RESERVED = ("auth/", "client/", "file/", "storage/", "serve/", "config/", "log/", "db/", "redis/", "upload")
THUMB_SUFFIX_RE = re.compile(r"(?:_thumbnail|_frame)?\.[A-Za-z0-9]+$")
DATA_RE = re.compile(r"data:image/(?P<ext>png|jpeg|jpg|gif|webp);base64,(?P<b64>[A-Za-z0-9+/=]+)")
# 본문(HTML·JSON) 안에 든 옛 상대경로 — src='/cdn/prod/img/…' · "imageUrl": "assets/cdn/prod/img/…" (한 값 안에 여러 개 있을 수 있다)
#   앞 글자가 경로·주소의 일부이면 잡지 않는다(…/api/cdn/… · https://cdn-ncp…/static/cdn/… · http://localhost:3000/cdn/… 은 여기 대상이 아님)
EMB_REL_RE = re.compile(r"(?<![A-Za-z0-9_\-./:%])(?P<pre>/?(?:assets/)?cdn/)(?P<path>[A-Za-z0-9_\-./%]+)")
LOCAL_URL_RE = re.compile(r"https?://(?:localhost|127\.0\.0\.1)(?::[0-9]+)?/(?:assets/)?cdn/(?P<path>[A-Za-z0-9_\-./%]+)")
FILE_EXT_RE = re.compile(r"\.[A-Za-z0-9]{2,5}$")
REL_SKIP = ("pkg/",)                         # assets/cdn/pkg/… 는 BO 가 쓰는 라이브러리 파일(이미지 아님)
# 값 전체가 주소 하나인 컬럼 — 본문 안 상대경로 치환을 하지 않는다(값 전체 상대경로는 REL_TARGETS 가 맡는다)
WHOLE_VALUE_COLS = {("pd_prod_img", "cdn_img_url"), ("pd_prod_img", "cdn_thumb_url"), ("pd_prod", "thumbnail_url"),
                    ("mb_member", "profile_img_url"), ("cm_chatt_msg", "msg_text")}
# 옛 폴더(cdn 바로 아래) — 이동이 끝나면 cleanup_files.sh 가 통째로 옮긴다
OLD_TOP_DIRS = ["2026", "attach", "common", "contact_content_attach", "prod"]
OLD_KEEP_DIR = "_cdn_old_20261004"           # cdn 과 같은 위치에 만든다(되돌릴 수 있게 지우지 않고 옮김)
# 전수 조사에서 빼는 테이블(로그·이력·백업·스냅샷) — 목록만 알린다. 스크립트가 직접 다루는 컬럼은 이 규칙보다 먼저다
LOG_TABLE_RE = re.compile(r"^(?:syh_|pdh_|odh_|mbh_|cmh_|aph_|rsh_|zz_bak|flyway_)|(?:_log|_hist)$|^zd_meta_snapshot$")
FO_SRC = os.environ.get("FO_SRC", r"C:\_pjt_github\illeesam-shopjoy\ecFeFoNuxt4")
# FO 소스가 CDN 서버의 옛 폴더를 직접 가리키는 줄(`${CDN_URL}/cdn/prod/img/…` · `…/api/cdn/prod/img`)
FO_OLD_REF_RE = re.compile(r"(?:\}|/api)/cdn/(?:prod/img|attach/|common/|contact_content_attach/|20[0-9]{2}/)")

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
    # 2026-10-04 3차(전수 조사) — 본문 HTML·설정 JSON 안에 든 옛 경로
    ("pm_event", "event_id", "event_content", "t.site_id", "", []),
    ("pm_plan", "plan_id", "plan_desc", "t.site_id", "", []),
    ("dp_panel", "panel_id", "content_json", "t.site_id", "", []),
    ("dp_widget", "widget_id", "widget_config_json", "t.site_id", "", []),
    ("dp_widget_lib", "widget_lib_id", "widget_config_json", "t.site_id", "", []),
]
# 값 전체가 옛 상대경로 하나인 컬럼 — (테이블, PK, 컬럼, 사이트 식(별칭 t), 조인, 업무, 사이트 불명일 때 기본 사이트(None 이면 _common))
#   site_id 가 있고 사이트 폴더를 아는 사이트면 그 폴더, 아니면 기본 사이트(ec1) 폴더. 새 값은 전체 주소.
REL_TARGETS = [
    ("pd_prod", "prod_id", "thumbnail_url", "t.site_id", "", "prod", None),
    ("cm_blog_file", "blog_file_id", "img_url", "b.site_id", f"LEFT JOIN {S}.cm_blog b ON b.blog_id = t.blog_id", "board", DEFAULT_SITE),
    ("cm_blog_file", "blog_file_id", "thumb_url", "b.site_id", f"LEFT JOIN {S}.cm_blog b ON b.blog_id = t.blog_id", "board", DEFAULT_SITE),
    ("dp_widget", "widget_id", "thumbnail_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("dp_widget_lib", "widget_lib_id", "thumbnail_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("pm_event", "event_id", "img_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("pm_plan", "plan_id", "thumbnail_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("pm_plan", "plan_id", "banner_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("md_cb_pattern", "pattern_id", "thumbnail_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("md_sg_project", "project_id", "thumbnail_url", "t.site_id", "", "etc", DEFAULT_SITE),
    ("md_sg_download_hist", "download_hist_id", "zip_url", "t.site_id", "", "etc", DEFAULT_SITE),      # 소스생성 zip — 개발 PC 주소(CDN 에 있을 때만)
    ("md_sg_sourcegen_hist", "sourcegen_hist_id", "zip_url", "t.site_id", "", "etc", DEFAULT_SITE),
]
REL_JOIN_NEEDS = {"cm_blog_file": [("cm_blog", "site_id")]}   # 조인에 필요한 (테이블, 컬럼) — 없으면 기본 사이트로

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

# ── FO 소스(ecFeFoNuxt4)가 직접 가리키는 디자인 파일 — 사이트 → 옛 상대경로 목록 (새 경로는 new_rel 로 계산) ──────────────
#   2026-10-04 ecFeFoNuxt4 의 app/{pages,components,layout}/<모듈> · composables/useShareTools · utils/mapCategory 에서 모은 것.
#   같은 파일을 ec1·ec2 가 함께 쓰므로 사이트마다 한 벌씩 복사한다(사이트 간 공유는 복사가 규칙).
_FO_BOTH = (
    ["slider/slider-1.jpg", "slider/slider-2.jpg", "slider/slider-3.jpg",                       # 홈 히어로 슬라이더
     "slider/03/slider-01.jpg", "slider/03/slider-02.jpg", "slider/03/slider-03.jpg", "slider/04/slider-01.jpg",
     "slider/05/slide111.webp", "slider/05/slide112.webp", "slider/05/slide113.webp"]
    + [f"client/client-{i}.jpg" for i in range(1, 6)]                                           # 고객사 로고 → design/logo
    + [f"testimonial/person-{i}.jpg" for i in range(1, 5)] + [f"testimonial/testi{i}.webp" for i in range(1, 4)]
    + ["page-title/page-title-1.jpg", "blog/comments/avater-3.png", "bg/mega-menu-bg.jpg", "payment/paypal_logo.webp",
       "logo/logo.png"]                                                                         # 공유 미리보기 기본 이미지
    + ["shop/banner/banner-big-1.jpg", "shop/banner/banner-big-2.jpg"]                          # 상품 배너 대체 이미지 → design/banner
    + [f"shop/banner/banner-sm-{i}.jpg" for i in range(1, 6)]                                   # 카테고리 배너 대체 이미지 → design/banner
)
_FO_EC1_ONLY = ["testimonial/testimonial-bg.jpg", "bg/bg-video.webp", "blog/blog-details-sm.jpg",   # home-3 · home-7 · blog-dtl (ec1 에만 있는 화면)
                "blog/comments/avater-1.png", "blog/comments/avater-2.png"]
FO_DESIGN = {   # 사이트ID → (FO 의 사이트 폴더(tenant 파일 cdnSiteDir), [옛 상대경로])
    "SI260001": ("SI26/SI260001_ec1", [DESIGN_PREFIX + p for p in _FO_BOTH + _FO_EC1_ONLY]),
    "SI260002": ("SI26/SI260002_ec2", [DESIGN_PREFIX + p for p in _FO_BOTH]),
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
        for old_p, new_p in DESIGN_PREFIX_RENAME.items():
            if rest.startswith(old_p):
                return "design/" + new_p + rest[len(old_p):]
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

    def __init__(self, conn, missing=frozenset()):
        self.cur = conn.cursor()
        self.missing = frozenset(missing)      # CDN 에 원본이 없는 옛 경로(옛 주소가 200 이 아님) — 옮기지 않고 그대로 둔다
        self.broken = collections.defaultdict(set)     # (table.col) → {원본 없는 옛 경로}
        self.body_rel = collections.Counter()  # (table.col) → 본문 안 상대경로를 전체 주소로 바꾼 개수(주소 수)
        self.cf_multi = self.cf_orphan = 0     # cf_file: 여러 사이트가 나눠 가진 파일 / 어느 데이터도 가리키지 않는 파일
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
        self.per_target = collections.Counter()
        self.url_sites = collections.defaultdict(set)  # old_rel → {site}
        self.refs = collections.defaultdict(lambda: collections.defaultdict(set))   # 파일 키 → {site → {업무}}
        self.rel_rows = collections.Counter()      # (table.col) → 값 전체가 옛 상대경로였던 행 수
        self.rel_default = collections.Counter()   # (table.col) → site_id 가 없거나 폴더를 몰라 기본 사이트(ec1)로 보낸 행 수
        self.rel_group = collections.defaultdict(collections.Counter)   # (table.col) → {(사이트 폴더, 종류): 행 수}
        self.local_missing = []    # (table.col, pk, 값, HTTP 상태) — localhost 주소인데 CDN 에 파일이 없어 그대로 둔 것
        self.fo_copies = {}        # FO 소스가 직접 가리키는 디자인 파일: new_rel → old_rel (복사·확인 대상, DB 변경 없음)
        self.fo_added = collections.Counter()  # (사이트 폴더 이름, design/<용도>) → DB 계획에 없어 새로 더한 수
        self.fo_missing = []       # (old_rel, HTTP 상태, 사이트) — 옛 주소가 열리지 않아 뺀 것
        self.fo_notes = []         # 사이트 폴더가 FO 설정과 다른 경우 등
        self._scan()
        self._scan_fo()
        self.cf = self._cf_file_changes()

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

    def _rewrite(self, value, site, label, biz, body=False):
        """문자열 안의 CDN URL 을 모두 새 경로로. 반환: 새 문자열(바뀐 것이 없으면 원래 값)
        body=True 면 본문(HTML·JSON) 안의 옛 상대경로(/cdn/… · assets/cdn/…)도 그 행 사이트 폴더의 전체 주소로 바꾼다."""
        folder = self.site_folder.get(site) if site else None
        used_common = []

        def repl(m):
            path = m.group("path")
            if path.startswith(RESERVED):
                return m.group(0)
            host = PUBLIC_BASE if m.group("host") else ""
            if NEW_PREFIX_RE.match(path):                       # 이미 새 경로 — 호스트만 통일
                return f"{host}/api/cdn/{path}"
            if path in self.missing:                            # 원본이 없다(원래 깨진 주소) — 그대로 둔다
                self.broken[label].add(path)
                return m.group(0)
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

        def repl_rel(m):                                        # 본문 안 옛 상대경로 → 전체 주소(사이트를 모르면 기본 사이트 ec1)
            path, tail = m.group("path"), ""
            while path.endswith("."):                           # 문장 끝 마침표는 경로가 아니다
                path, tail = path[:-1], "." + tail
            if path.startswith(RESERVED) or path.startswith(REL_SKIP) or NEW_PREFIX_RE.match(path) or not FILE_EXT_RE.search(path):
                return m.group(0)
            if path in self.missing:
                self.broken[label].add(path)
                return m.group(0)
            s, f = site, folder
            if not f and DEFAULT_SITE in self.site_folder:
                s, f = DEFAULT_SITE, self.site_folder[DEFAULT_SITE]
            if f:
                self.url_sites[path].add(s)
            else:
                self.common_paths.add(path)
                used_common.append(path)
            nr = new_rel(path, f or COMMON, self._biz(path, s, biz))
            self.copies[nr] = path
            self.body_rel[label] += 1
            return f"{PUBLIC_BASE}/api/cdn/{nr}{tail}"

        new = URL_RE.sub(repl, value)
        if body:
            new = EMB_REL_RE.sub(repl_rel, new)
        if used_common:
            self.common[label] += 1
        return new

    def _scan(self):
        like_url = "(t.\"{c}\" LIKE '%%/api/cdn/%%')"
        like_body = "(t.\"{c}\" LIKE '%%cdn/%%')"                  # 본문 컬럼은 상대경로(/cdn/… · assets/cdn/…)도 본다
        loaded = []     # (table, pk, col, label, rows)
        for table, pk, col, site_expr, join, needs in TARGETS:
            if table not in self.cols or col not in self.cols[table]:
                continue
            label = f"{table}.{col}"
            like = like_url if (table, col) in WHOLE_VALUE_COLS else like_body
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
                new = self._rewrite(val, site, label, TABLE_BIZ.get(table, "etc"), body=(table, col) not in WHOLE_VALUE_COLS)
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
        """값 전체가 옛 상대경로 하나인 컬럼(REL_TARGETS) → 그 행 사이트 폴더의 새 경로(전체 주소).
        FO(resolveCdnUrl)·BO(cofImgSrc)·SEO(toAbsoluteUrl) 모두 http 로 시작하는 값은 그대로 쓴다 — pd_prod.thumbnail_url 에는 이미 전체 주소로 든 행이 있다.
        http://localhost…/cdn/… 로 저장된 값은 CDN 에 그 파일이 실제로 있을 때만(옛 주소 HTTP 200) 옮긴다."""
        status = {}
        for table, pk, col, site_expr, join, biz, default_site in REL_TARGETS:
            if col not in self.cols.get(table, set()) or pk not in self.cols[table]:
                continue
            label = f"{table}.{col}"
            if any(c not in self.cols.get(t, set()) for t, c in REL_JOIN_NEEDS.get(table, [])) or ("t.site_id" in site_expr and "site_id" not in self.cols[table]):
                site_expr, join = "NULL", ""                     # 사이트를 구할 수 없는 테이블 — 기본 사이트로
            c = f't."{col}"'
            rows = self.q(f"SELECT t.{pk}, {c}, {site_expr} FROM {S}.{table} t {join} WHERE {c} LIKE '/cdn/%%' OR {c} LIKE 'cdn/%%' OR {c} LIKE 'assets/cdn/%%'"
                          f" OR {c} LIKE '/assets/cdn/%%' OR {c} LIKE 'http://localhost%%/cdn/%%' OR {c} LIKE 'http://127.0.0.1%%/cdn/%%' ORDER BY t.{pk}")
            for pkv, val, site in rows:
                m = REL_ANY_RE.match(val)
                if not m or m.group("path").startswith(RESERVED) or NEW_PREFIX_RE.match(m.group("path")):
                    continue
                path = m.group("path")
                if path in self.missing:                         # 원본이 없다(원래 깨진 주소) — 그대로 둔다
                    self.broken[label].add(path)
                    continue
                if m.group("local"):                             # 개발 PC 주소 — CDN 에 파일이 있을 때만
                    if path not in status:
                        status[path] = http_status(f"{PUBLIC_BASE}/api/cdn/{path}")
                    if status[path] != 200:
                        self.local_missing.append((label, pkv, val, status[path]))
                        continue
                folder = self.site_folder.get(site)
                if not folder and default_site and default_site in self.site_folder:
                    site, folder = default_site, self.site_folder[default_site]
                    self.rel_default[label] += 1
                if folder:
                    self.url_sites[path].add(site)
                else:
                    self.common_paths.add(path)
                    self.common[label] += 1
                nr = new_rel(path, folder or COMMON, biz)
                self.copies[nr] = path
                self.changes.append((table, pk, pkv, col, val, f"{PUBLIC_BASE}/api/cdn/{nr}"))
                self.per_target[label] += 1
                self.rel_rows[label] += 1
                self.rel_group[label][folder_group(nr)] += 1

    def _scan_fo(self):
        """FO 소스가 직접 가리키는 디자인 파일(FO_DESIGN)을 복사 목록에 더한다 — 옛 주소가 HTTP 200 인 것만. DB 는 건드리지 않는다."""
        status = {}
        for site, (fo_dir, olds) in sorted(FO_DESIGN.items()):
            folder = self.site_folder.get(site)
            if folder != fo_dir:      # FO 는 tenant 파일의 cdnSiteDir 로 주소를 만든다 — DB(sy_site 모듈)와 다르면 FO 쪽 폴더로 복사해야 화면이 열린다
                self.fo_notes.append(f"{site}: sy_site 기준 폴더({folder or '없음'}) ≠ FO 설정 폴더({fo_dir}) — FO 설정 폴더로 복사합니다")
                folder = fo_dir
            for old in olds:
                if old not in status:
                    status[old] = http_status(f"{PUBLIC_BASE}/api/cdn/{old}")
                if status[old] not in (200, 0):          # 원본이 없다 — 복사할 수 없으니 빼고 알린다
                    self.fo_missing.append((old, status[old], site))
                    continue
                if status[old] == 0:
                    self.fo_notes.append(f"옛 주소 확인 실패(네트워크) — 목록에는 넣었습니다: {old}")
                nr = new_rel(old, folder, "etc")
                self.fo_copies[nr] = old
                self.url_sites[old].add(site)
                if nr not in self.copies:
                    self.copies[nr] = old
                    self.fo_added[folder_group(nr)] += 1

    # cf_file(ecBeCdn 의 파일 대장): 옛 폴더를 통째로 치울 것이므로 모든 행의 경로를 새 위치로 바꾼다(파일ID 로 지울 때 새 파일이 지워지게)
    #   · 한 곳으로만 옮겨진 파일 → 그 새 위치
    #   · 여러 사이트가 나눠 가진 파일(샘플 이미지·ec2 복사본) → 한 벌만 가리킨다(기본 사이트 ec1 폴더 우선, 없으면 이름순 첫 번째)
    #   · 어느 데이터도 가리키지 않는 파일(올리고 저장하지 않은 것 등) → _common/attach/etc(디자인성 경로는 _common/design) 로 복사 — 잃지 않게
    #   · 원본이 CDN 에 없는 행은 그대로 둔다
    def _cf_file_changes(self):
        if "cf_file" not in self.cols:
            return []
        targets = collections.defaultdict(set)
        for nr, old in self.copies.items():
            targets[old].add(nr)
        default_folder = self.site_folder.get(DEFAULT_SITE, "") + "/"
        out = []
        for fid, fp, tp, frp in self.q(f"SELECT file_id, file_path, thumbnail_path, frame_path FROM {S}.cf_file ORDER BY file_id"):
            if not fp or NEW_PREFIX_RE.match(fp):
                continue
            if fp in self.missing:
                self.broken["cf_file.file_path"].add(fp)
                continue
            got = sorted(targets.get(fp, ()))
            if not got:
                nr = new_rel(fp, COMMON, "etc")
                self.copies[nr] = fp
                self.common_paths.add(fp)
                self.cf_orphan += 1
            elif len(got) == 1:
                nr = got[0]
            else:
                nr = next((g for g in got if g.startswith(default_folder)), got[0])
                self.cf_multi += 1
            ndir = nr.rpartition("/")[0]
            out.append(("cf_file", "file_id", fid, "file_path", fp, nr))
            for col, old in (("thumbnail_path", tp), ("frame_path", frp)):
                if old and not NEW_PREFIX_RE.match(old):
                    if old in self.missing:
                        self.broken[f"cf_file.{col}"].add(old)
                        continue
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


def http_many(paths):
    """옛·새 상대경로 여러 개의 HTTP 상태 — {경로: 상태}"""
    from concurrent.futures import ThreadPoolExecutor
    paths = list(paths)
    with ThreadPoolExecutor(8) as ex:
        return dict(zip(paths, ex.map(lambda x: http_status(f"{PUBLIC_BASE}/api/cdn/{x}"), paths)))


def build_plan(conn, check=True):
    """계획을 만든다. check 면 복사할 원본이 CDN 에 실제로 있는지(옛 주소 HTTP 200) 확인해, 없는 것은 계획에서 빼고(그 참조는 그대로 둔다) 다시 계산한다."""
    p = Plan(conn)
    p.checked = check
    if not check:
        return p
    olds = sorted(set(p.copies.values()) - set(p.fo_copies.values()))      # FO 디자인 파일은 _scan_fo 가 이미 확인했다
    st = http_many(olds)
    unknown = [o for o in olds if st[o] == 0]
    missing = {o: st[o] for o in olds if st[o] not in (200, 0)}
    if missing:
        p = Plan(conn, missing=set(missing))
        p.checked = True
    p.missing_status = missing
    p.unknown = unknown
    return p


def summarize(p):
    cf = p.cf
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
    if p.fo_copies:
        print(f"  [FO 소스 디자인 파일] {len(p.fo_copies)}개(위 복사 수에 포함) — 그중 DB 계획에 없어 새로 더한 것 {sum(p.fo_added.values())}개: "
              + ", ".join(f"{st} {g} {n}" for (st, g), n in sorted(p.fo_added.items())))
    for old, st, site in p.fo_missing:
        print(f"    [FO 원본 없음 — 뺌] HTTP {st}  {old}  ({site})")
    for note in p.fo_notes:
        print(f"    [FO 알림] {note}")
    if p.rel_rows:
        print(f"  [값 전체가 옛 상대경로인 컬럼] {sum(p.rel_rows.values())}행 → 그 행 사이트 폴더의 전체 주소로 (위 변경 행 수에 포함)")
        for label, n in p.rel_rows.items():
            where = ", ".join(f"{st}/{g} {c}" for (st, g), c in sorted(p.rel_group[label].items()))
            note = f" — site_id 없음·판단 불가 {p.rel_default[label]}행은 기본 사이트({DEFAULT_SITE})로" if p.rel_default[label] else ""
            print(f"    {label:<36} {n:>6}행 → {where}{note}")
    if p.body_rel:
        print(f"  [본문 안 옛 상대경로] 주소 {sum(p.body_rel.values())}개 → 그 행 사이트 폴더의 전체 주소로 (위 변경 행 수에 포함)")
        for label, n in p.body_rel.items():
            print(f"    {label:<36} 주소 {n:>6}개")
    if cf:
        print(f"  [cf_file] 경로 {len(cf)}건 — 여러 사이트가 나눠 가진 파일 {p.cf_multi}개는 {DEFAULT_SITE} 쪽 한 벌을, 어느 데이터도 가리키지 않는 파일 {p.cf_orphan}개는 {COMMON} 으로 복사해 가리킨다")
    if p.local_missing:
        per = collections.Counter(label for label, _, _, _ in p.local_missing)
        print(f"  [localhost 주소 — CDN 에 파일이 없어 그대로 둠] {len(p.local_missing)}행: " + ", ".join(f"{k} {v}" for k, v in per.items()))
        for label, pkv, val, st in p.local_missing[:5]:
            print(f"    HTTP {st}  {label} [{pkv}]  {val}")
        if len(p.local_missing) > 5:
            print(f"    … 외 {len(p.local_missing) - 5}행")
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
    if getattr(p, "checked", False):
        n_bad = len({o for v in p.broken.values() for o in v})
        print(f"  [원본 확인] 복사할 원본 {len(olds)}개 모두 HTTP 200" + (f" · 원본이 없어 그대로 둔 옛 경로 {n_bad}개(아래)" if n_bad else " · 원본 없는 참조 0"))
        for label, paths in sorted(p.broken.items()):
            for o in sorted(paths)[:10]:
                print(f"    [원본 없음 — 그대로 둠] HTTP {p.missing_status.get(o, '?')}  {label}  {o}")
            if len(paths) > 10:
                print(f"    … {label} 외 {len(paths) - 10}개")
        for o in getattr(p, "unknown", [])[:10]:
            print(f"    [확인 실패(네트워크) — 계획에는 넣음] {o}")
    else:
        print("  [원본 확인] 하지 않음 — dry --http · plan · run 은 원본이 CDN 에 있는지 확인하고 없는 참조는 그대로 둔다")
    print("  표본:")
    for t, pk, pkv, col, old, new in p.changes[:1] + p.changes[len(p.changes) // 2: len(p.changes) // 2 + 1] + p.changes[-1:]:
        mo, mn = URL_RE.search(old), URL_RE.search(new)
        print(f"    {t}.{col} [{pkv}]\n      옛: {mo.group(0) if mo else old[:120]}\n      새: {mn.group(0) if mn else new[:120]}")
    seen = set()
    for t, pk, pkv, col, old, new in p.changes:      # 값 전체가 상대경로였던 컬럼은 컬럼마다 한 건씩
        if f"{t}.{col}" in p.rel_rows and (t, col) not in seen and REL_ANY_RE.match(old):
            seen.add((t, col))
            print(f"    {t}.{col} [{pkv}]\n      옛: {old[:120]}\n      새: {new[:120]}")


def legacy_report(conn, p=None):
    """이 스크립트가 바꾸지 않는 이상 데이터 — 목록만"""
    cur = conn.cursor()
    print("[이상 데이터 — 이 스크립트가 바꾸지 않는 것]")
    try:
        cur.execute(f"SELECT coalesce(t.site_id, p.site_id), count(*) FROM {S}.pd_prod_img t LEFT JOIN {S}.pd_prod p ON p.prod_id = t.prod_id"
                    f" WHERE t.cdn_img_url LIKE '%%picsum.photos%%' GROUP BY 1 ORDER BY 1")
        rows = cur.fetchall()
        print(f"    {sum(n for _, n in rows):>6}행  picsum.photos 외부 이미지 (pd_prod_img) — 외부 주소라 그대로 둔다"
              + (" : " + ", ".join(f"{sid or '사이트 없음'} {n}" for sid, n in rows) if rows else ""))
    except Exception as e:
        print(f"    (조회 실패) picsum.photos: {str(e).strip()[:80]}")
    missing = len(p.local_missing) if p else 0
    print(f"    {missing:>6}행  http://localhost…/cdn/… 인데 CDN 에 파일이 없어 그대로 둔 것 (md_cb_pattern · md_sg_project 썸네일, 소스생성 zip) — 개발 PC 에만 있던 파일")


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
    stale = os.path.join(OUT, "cleanup_old_files.sh")           # 옛 방식(파일을 하나씩 rm) 정리 스크립트는 쓰지 않는다
    if os.path.exists(stale):
        os.remove(stale)
    print(f"  다음(사용자 실행): ssh <NAS 계정>@illeesam.synology.me 'cd {NAS_ROOT} && sh -s' < \"{os.path.join(OUT, 'copy_files.sh')}\"")
    print("  그다음: python cdnmove_20261004_site_folder.py verify → run")


def verify(p):
    st = http_many(sorted(p.copies))
    bad = [(nr, st[nr]) for nr in sorted(p.copies) if st[nr] != 200]
    print(f"[verify] 새 URL {len(p.copies)}개(FO 소스 디자인 파일 {len(p.fo_copies)}개 포함) 중 HTTP 200 {len(p.copies) - len(bad)}개 · 실패 {len(bad)}개")
    fo_bad = [nr for nr, _ in bad if nr in p.fo_copies]
    if fo_bad:
        print(f"    그중 FO 소스 디자인 파일 {len(fo_bad)}개 — 이 파일이 없으면 새 FO 화면의 고정 이미지(슬라이더·로고·배너)가 깨집니다. FO 배포 전에 반드시 복사하세요.")
    for old, st, site in p.fo_missing:
        print(f"    [FO 원본 없음 — 검사에서 뺌] HTTP {st}  {old}  ({site})")
    for nr, st in bad[:20]:
        print(f"    HTTP {st}  {PUBLIC_BASE}/api/cdn/{nr}")
    return not bad


def applied(conn):
    cur = conn.cursor()
    cur.execute("SELECT to_regclass(%s)", (f"{BAK}._changes",))
    return cur.fetchone()[0] is not None


def run():
    ro = connect(True)
    again = applied(ro)
    if again:
        print("[run] 이미 run 한 적이 있습니다(백업 스키마 있음) — 그 뒤 새로 생긴 옛 경로만 더 바꾸고 같은 _changes 에 이어 적습니다.")
    p = build_plan(ro)
    cf = p.cf
    summarize(p)
    ro.close()
    if "module_cd" not in p.cols["sy_site"] or "site_id" not in p.cols.get("cm_chatt", set()):
        sys.exit("[중단] run_all_20261004.py pre 가 아직입니다(sy_site.module_cd · cm_chatt.site_id 없음). 아무것도 바꾸지 않았습니다.")
    if p.pending:
        print("  [알림] 위 'pre 뒤 처리' 항목은 사이트 컬럼이 없는 테이블이라 이번에도 옮기지 않습니다(옛 경로 그대로 서빙).")
    if not p.changes and not cf:
        print("[run] 바꿀 것이 없습니다.")
        return 0
    if not verify(p):
        sys.exit("[중단] 새 경로에 파일이 없습니다 — plan 으로 만든 copy_files.sh 를 NAS 에서 먼저 실행하세요. 아무것도 바꾸지 않았습니다.")
    conn = connect(False)
    try:
        cur = conn.cursor()
        cur.execute("SET LOCAL lock_timeout = '10s'")
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {BAK}")
        cur.execute(f"CREATE TABLE IF NOT EXISTS {BAK}._changes (seq bigserial PRIMARY KEY, tbl text, pk_col text, pk text, col text, old_value text, new_value text, reg_date timestamp DEFAULT now())")
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
        print(f"  옛 폴더를 이미 {OLD_KEEP_DIR} 로 옮겼다면 NAS 에서 되돌려 놓아야 옛 URL 이 열립니다: cd {NAS_ROOT} && mv ../{OLD_KEEP_DIR}/* ./")
    except Exception as e:
        conn.rollback()
        sys.exit(f"[실패 — 롤백] {str(e).strip()}")
    finally:
        conn.close()


K_URL, K_REL, K_BO, K_LOCAL, K_CF = "서버 옛 경로(/api/cdn/…)", "상대경로(/cdn/…)", "BO 로컬 경로(assets/cdn/…)", "개발 PC 주소(localhost)", "cf_file 옛 경로"
BLOCK_KINDS = (K_URL, K_REL, K_CF)     # CDN 서버의 옛 폴더 파일을 가리키는 것 — 옛 폴더를 치우면 깨진다
CF_PATH_COLS = ("file_path", "thumbnail_path", "frame_path")


def handled_cols():
    """이 스크립트가 바꾸는 (테이블, 컬럼)"""
    return ({(t[0], t[2]) for t in TARGETS} | {(t[0], t[2]) for t in REL_TARGETS} | {("sy_attach", c) for c in ATTACH_COLS}
            | {("cf_file", c) for c in CF_PATH_COLS})


def old_refs_in(value):
    """값 하나에 든 옛 경로 참조 — {종류: {옛 상대경로}}"""
    out = collections.defaultdict(set)
    for m in URL_RE.finditer(value):
        path = m.group("path")
        if not path.startswith(RESERVED) and not NEW_PREFIX_RE.match(path):
            out[K_URL].add(path)
    for m in LOCAL_URL_RE.finditer(value):
        out[K_LOCAL].add(m.group("path"))
    for m in EMB_REL_RE.finditer(value):
        path = m.group("path").rstrip(".")
        if path.startswith(RESERVED) or path.startswith(REL_SKIP) or NEW_PREFIX_RE.match(path) or not FILE_EXT_RE.search(path):
            continue
        out[K_BO if "assets/" in m.group("pre") else K_REL].add(path)
    return out


def old_ref_scan(conn):
    """전수 조사 — 스키마의 모든 글자 컬럼에서 옛 CDN 경로 참조를 찾는다(SELECT 만).
    반환: [(테이블, 컬럼, 구분, {종류: 행 수}, {종류: {옛 경로}})] — 구분: 처리 / 미처리 / 로그·이력(제외)"""
    cur = conn.cursor()
    cur.execute("SELECT c.table_name, c.column_name FROM information_schema.columns c JOIN information_schema.tables t"
                " ON t.table_schema = c.table_schema AND t.table_name = c.table_name"
                " WHERE c.table_schema = %s AND t.table_type = 'BASE TABLE' AND c.data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')"
                " ORDER BY 1, 2", (S,))
    handled = handled_cols()
    out = []
    for t, col in cur.fetchall():
        rows, paths = collections.Counter(), collections.defaultdict(set)
        if t == "cf_file" and col in CF_PATH_COLS:           # 경로만 든 컬럼(cdn/ 글자가 없다)
            cur.execute(f'SELECT "{col}" FROM {S}.cf_file WHERE "{col}" IS NOT NULL AND "{col}" <> %s', ("",))
            for (v,) in cur.fetchall():
                if not NEW_PREFIX_RE.match(v):
                    rows[K_CF] += 1
                    paths[K_CF].add(v)
        else:
            cur.execute(f'SELECT "{col}"::text FROM {S}."{t}" WHERE "{col}"::text LIKE %s', ("%cdn/%",))
            for (v,) in cur.fetchall():
                for kind, ps in old_refs_in(v).items():
                    rows[kind] += 1
                    paths[kind] |= ps
        if rows:
            cls = "처리" if (t, col) in handled else ("로그·이력(제외)" if LOG_TABLE_RE.search(t) else "미처리")
            out.append((t, col, cls, rows, paths))
    return out


def print_scan(found):
    print(f"[scan] {S} 의 글자 컬럼 전수 조사 — 옛 CDN 경로 참조가 있는 컬럼 {len(found)}개")
    print(f"  {'테이블.컬럼':<44} {'구분':<14} 종류별 행 수")
    for cls in ("처리", "미처리", "로그·이력(제외)"):
        for t, col, c, rows, _ in found:
            if c == cls:
                print(f"  {t + '.' + col:<44} {c:<14} " + " · ".join(f"{k} {v}" for k, v in rows.items()))
    n_un = sum(1 for f in found if f[2] == "미처리")
    print(f"  처리 {sum(1 for f in found if f[2] == '처리')}개 컬럼 · 미처리 {n_un}개 컬럼 · 로그·이력 {sum(1 for f in found if f[2].startswith('로그'))}개 컬럼(바꾸지 않음)")
    print(f"  종류: {K_URL}·{K_REL}·{K_CF} 는 CDN 서버의 옛 폴더 파일 / {K_BO} 는 ecFeBo 가 자체로 가진 정적 파일(CDN 서버와 무관, 처리 컬럼에서는 CDN 주소로 통일)"
          f" / {K_LOCAL} 는 개발 PC 저장소(CDN 서버에 없으면 그대로)")


def fo_source_refs():
    """FO 소스가 CDN 옛 폴더를 직접 가리키는 줄 — [(파일, 줄 번호)]. FO 소스 폴더가 없으면 None"""
    if not os.path.isdir(FO_SRC):
        return None
    hits = []
    for sub in ("app", "server", "tenant", "nuxt.config.ts"):
        top = os.path.join(FO_SRC, sub)
        walk = os.walk(top) if os.path.isdir(top) else ([(FO_SRC, [], [sub])] if os.path.isfile(top) else [])
        for root, dirs, files in walk:
            dirs[:] = [d for d in dirs if d not in ("node_modules", "assets", ".nuxt", ".output")]
            for name in files:
                if not name.endswith((".vue", ".ts", ".js", ".jsonc", ".json")):
                    continue
                full = os.path.join(root, name)
                try:
                    with open(full, encoding="utf-8", errors="replace") as f:
                        for i, line in enumerate(f, 1):
                            if FO_OLD_REF_RE.search(line):
                                hits.append((os.path.relpath(full, FO_SRC).replace(os.sep, "/"), i))
                except OSError:
                    pass
    return hits


def cleanup_script(new_files):
    """NAS 에서 실행할 옛 폴더 정리 스크립트(글자) — 지우지 않고 cdn 과 같은 위치의 _cdn_old_20261004/ 로 옮긴다"""
    keep = NAS_ROOT.rsplit("/", 1)[0] + "/" + OLD_KEEP_DIR
    lines = [
        "#!/bin/sh",
        "# cdnmove_20261004 — 옛 폴더 정리. NAS 의 CDN 저장 폴더에서 실행한다: cd " + NAS_ROOT + " && sh cleanup_files.sh",
        "# 지우지 않는다 — 옛 폴더(" + " ".join(OLD_TOP_DIRS) + ")를 cdn 과 같은 위치의 " + OLD_KEEP_DIR + "/ 로 옮긴다(mv). 되돌릴 수 있다.",
        "# SI26 · _common 은 건드리지 않는다. 새 경로 파일이 하나라도 없으면 아무것도 옮기지 않는다. 다시 실행해도 안전하다.",
        "set -u",
        'DEST="../' + OLD_KEEP_DIR + '"',
        'case "$(pwd)" in */cdn) ;; *) echo "[중단] 여기는 cdn 폴더가 아닙니다: $(pwd) — cd ' + NAS_ROOT + ' 뒤에 실행하세요."; exit 1 ;; esac',
        'if [ ! -d SI26 ] || [ ! -d _common ]; then echo "[중단] 새 폴더(SI26 · _common)가 없습니다 — copy_files.sh 를 먼저 실행하세요. 아무것도 옮기지 않았습니다."; exit 1; fi',
        "miss=0",
        'chk() { if [ ! -f "$1" ]; then echo "새 파일 없음: $1"; miss=$((miss+1)); fi; }',
    ]
    lines += [f"chk '{nr}'" for nr in sorted(new_files)]
    lines += [
        'if [ "$miss" -gt 0 ]; then echo "[중단] 새 경로 파일 $miss 개가 없습니다 — 아무것도 옮기지 않았습니다."; exit 1; fi',
        'mkdir -p "$DEST" || { echo "[중단] $DEST 를 만들 수 없습니다."; exit 1; }',
        "moved=0",
        "for d in " + " ".join(OLD_TOP_DIRS) + "; do",
        '  case "$d" in SI26|_*|.*|*/*|"") echo "[가드] 건너뜀: $d"; continue ;; esac',
        '  if [ ! -e "$d" ]; then echo "없음(이미 옮겼거나 원래 없음): $d"; continue; fi',
        '  if [ -e "$DEST/$d" ]; then echo "[건너뜀] $DEST/$d 가 이미 있습니다 — 그 뒤 새로 생긴 $d 폴더입니다. 내용을 확인하고 직접 처리하세요."; continue; fi',
        '  if mv "$d" "$DEST/$d"; then echo "옮김: $d  →  $DEST/$d"; moved=$((moved+1)); else echo "[실패] $d 를 옮기지 못했습니다."; fi',
        "done",
        'echo "옮긴 폴더 $moved 개. 지금 cdn 폴더에 남은 것(SI26 · _common 만 있어야 정상):"',
        "ls -1",
        'echo "되돌리기: cd ' + NAS_ROOT + ' && mv ../' + OLD_KEEP_DIR + '/<폴더> ./"',
        'echo "며칠 지켜보고 문제없으면 이 폴더를 지우세요: rm -rf ' + keep + '"',
    ]
    return "\n".join(lines) + "\n"


def cleanup_plan(args):
    conn = connect(True)
    if not applied(conn):
        sys.exit("[cleanup-plan] run 이 아직입니다 — plan → copy_files.sh(NAS) → verify → run 을 먼저 끝내세요. 아무것도 만들지 않았습니다.")
    cur = conn.cursor()
    # (a) run 이 바꾼 새 URL 과 FO 디자인 파일이 전부 열리는지
    cur.execute(f"SELECT tbl, new_value FROM {BAK}._changes")
    new_files = set()
    for tbl, v in cur.fetchall():
        if tbl == "cf_file":
            if NEW_PREFIX_RE.match(v or ""):
                new_files.add(v)
            continue
        for m in URL_RE.finditer(v or ""):
            if NEW_PREFIX_RE.match(m.group("path")):
                new_files.add(m.group("path"))
    p = build_plan(conn)
    new_files |= set(p.fo_copies)
    st = http_many(sorted(new_files))
    bad = [(nr, st[nr]) for nr in sorted(new_files) if st[nr] != 200]
    print(f"[cleanup-plan] (a) 새 URL {len(new_files)}개(run 이 바꾼 값 + FO 디자인 파일 {len(p.fo_copies)}개) 중 HTTP 200 {len(new_files) - len(bad)}개 · 실패 {len(bad)}개")
    for nr, code in bad[:20]:
        print(f"    HTTP {code}  {PUBLIC_BASE}/api/cdn/{nr}")
    if bad:
        sys.exit("[중단] 새 경로에 없는 파일이 있습니다 — copy_files.sh 를 다시 실행하고 verify 가 통과한 뒤에 하세요. 아무것도 만들지 않았습니다.")
    # (b) DB 어디에도 살아 있는 옛 경로 참조가 없는지 — 계획(남은 변경) + 전수 조사
    if p.changes or p.cf:
        summarize(p)
        sys.exit(f"[중단] run 뒤에 새로 생긴 옛 경로 참조가 있습니다(DB {len(p.changes)}행 · cf_file {len(p.cf)}건) — plan → copy_files.sh → run 을 다시 한 뒤에 하세요. 아무것도 만들지 않았습니다.")
    found = old_ref_scan(conn)
    print_scan(found)
    suspects = collections.defaultdict(set)      # 옛 경로 → {테이블.컬럼}
    for t, col, cls, rows, paths in found:
        if cls.startswith("로그"):
            continue
        for kind in BLOCK_KINDS:
            for path in paths.get(kind, ()):
                suspects[path].add(f"{t}.{col}")
    st = http_many(sorted(suspects))
    live = sorted(o for o in suspects if st[o] in (200, 0))
    print(f"[cleanup-plan] (b) 로그·이력 밖에 남은 옛 경로 {len(suspects)}개 — 그중 파일이 실제로 있는(옛 폴더를 치우면 깨지는) 것 {len(live)}개"
          f" · 원래 깨진 참조 {len(suspects) - len(live)}개(파일 없음 — 정리와 무관)")
    for o in live[:30]:
        print(f"    HTTP {st[o]}  {o}   ← {', '.join(sorted(suspects[o]))}")
    if live:
        sys.exit("[중단] 아직 옛 경로의 파일을 가리키는 데이터가 있습니다 — 위 컬럼을 이 스크립트 대상(TARGETS · REL_TARGETS)에 더하거나 값을 고친 뒤에 하세요. 아무것도 만들지 않았습니다.")
    # (c) FO 소스가 옛 폴더를 직접 가리키는지
    hits = fo_source_refs()
    if hits is None:
        print(f"[cleanup-plan] (c) FO 소스 폴더({FO_SRC})가 없어 확인하지 못했습니다.")
    else:
        print(f"[cleanup-plan] (c) FO 소스가 CDN 옛 폴더를 직접 가리키는 줄 {len(hits)}개(파일 {len({h[0] for h in hits})}개) — {FO_SRC} 기준. 배포된 FO·앱이 이 버전인지는 직접 확인하세요.")
        for path, line in hits[:10]:
            print(f"    {path}:{line}")
        if len(hits) > 10:
            print(f"    … 외 {len(hits) - 10}줄")
    if (hits is None or hits) and "--fo-ok" not in args:
        sys.exit("[중단] FO 가 아직 옛 폴더의 디자인 파일(슬라이더·로고·배너 등)을 직접 가리킵니다 — 새 폴더(design/…)를 쓰는 FO 를 배포한 뒤에 하세요.\n"
                 "  배포된 FO·앱이 옛 주소를 쓰지 않는 것을 확인했다면: python cdnmove_20261004_site_folder.py cleanup-plan --fo-ok   (아무것도 만들지 않았습니다)")
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "cleanup_files.sh")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(cleanup_script(new_files))
    print(f"[cleanup-plan] 만든 파일(만들기만 했습니다):\n  {path}")
    print(f"  하는 일: 옛 폴더 {' · '.join(OLD_TOP_DIRS)} 를 {NAS_ROOT.rsplit('/', 1)[0]}/{OLD_KEEP_DIR}/ 로 옮김(지우지 않음). 새 파일 {len(new_files)}개가 모두 있는지 먼저 확인합니다.")
    print(f"  실행(사용자): ssh <NAS 계정>@illeesam.synology.me 'cd {NAS_ROOT} && sh -s' < \"{path}\"")
    print(f"  그 뒤 며칠 지켜보고 문제없으면 NAS 에서 {OLD_KEEP_DIR} 폴더를 지우세요. 문제가 있으면: mv ../{OLD_KEEP_DIR}/<폴더> ./")


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
        p = build_plan(conn, check=(mode != "dry" or "--http" in args))
        if mode == "dry":
            summarize(p)
            legacy_report(conn, p)
            print("(dry) 아무것도 바꾸지 않았습니다.")
        elif mode == "plan":
            summarize(p)
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
    elif mode == "scan":
        print_scan(old_ref_scan(connect(True)))
        print("(scan) 아무것도 바꾸지 않았습니다.")
    elif mode == "cleanup-plan":
        cleanup_plan(args)
    elif mode == "b64dry":
        b64dry()
    elif mode == "b64run":
        b64run()
    else:
        sys.exit(USAGE)


if __name__ == "__main__":
    main()
