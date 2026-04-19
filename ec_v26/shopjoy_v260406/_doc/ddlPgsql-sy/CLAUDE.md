# SY 도메인 DDL

시스템(SY) 도메인 DDL 파일 목록. 테이블 추가 시 이 목록에도 추가할 것.

## 도메인 프리픽스
모든 테이블은 `sy_` 프리픽스 사용.

## SQL 파일 목록

### 사이트/플랫폼
- `sy_site.sql` — 사이트 마스터 (멀티사이트 격리 기준)

### 공통 코드
- `sy_code_grp.sql` — 코드 그룹
- `sy_code.sql` — 공통 코드 (code_remark)

### 다국어
- `sy_i18n.sql` — 다국어 키 마스터 (i18n_key, i18n_scope_cd)
- `sy_i18n_msg.sql` — 언어별 번역 메시지 (lang_cd, i18n_msg)

### 브랜드/업체
- `sy_brand.sql` — 브랜드 (brand_remark)
- `sy_vendor.sql` — 업체 마스터
- `sy_vendor_content.sql` — 업체 소개 내용
- `sy_vendor_user.sql` — 업체 담당자
- `sy_vendor_brand.sql` — 업체-브랜드 연결

### 사용자/조직/권한
- `sy_user.sql` — 관리자 사용자
- `sy_dept.sql` — 부서 (dept_remark)
- `sy_role.sql` — 역할 (role_remark)
- `sy_user_role.sql` — 사용자-역할 연결
- `sy_role_menu.sql` — 역할-메뉴 권한
- `syh_user_login_hist.sql` — 로그인 이력
- `syh_user_login_log.sql` — 로그인 로그 *(log 예외)*
- `syh_user_token_log.sql` — 토큰 로그 *(log 예외)*

### 메뉴/경로
- `sy_menu.sql` — 메뉴 (menu_remark)
- `sy_path.sql` — 경로 (path_remark)
- `sy_prop.sql` — 속성 (prop_remark)

### 첨부/템플릿
- `sy_attach_grp.sql` — 첨부 그룹 (attach_grp_remark)
- `sy_attach.sql` — 첨부 파일 (attach_url, attach_memo)
- `sy_template.sql` — 발송 템플릿

### 배치
- `sy_batch.sql` — 배치 마스터
- `syh_batch_hist.sql` — 배치 실행 이력
- `syh_batch_log.sql` — 배치 로그 *(log 예외)*

### 알람/게시판/문의/VOC
- `sy_alarm.sql` — 알람 발송 마스터
- `syh_alarm_send_hist.sql` — 알람 발송 이력
- `sy_bbm.sql` — BBM(메모/공지) (bbm_remark)
- `sy_bbs.sql` — 게시판 마스터
- `sy_contact.sql` — 1:1 문의
- `sy_notice.sql` — 공지사항
- `sy_voc.sql` — 고객의소리 VOC 분류 (voc_master_cd + voc_detail_cd)

### 로그
- `syh_api_log.sql` — API 호출 로그 *(log 예외)*
- `syh_send_email_log.sql` — 이메일 발송 로그 *(log 예외)*
- `syh_send_msg_log.sql` — SMS 발송 로그 *(log 예외)*

## log 테이블 예외 규칙
`*_log` 테이블은 단일 단어 컬럼 허용: `log`, `token`, `ip`, `device`, `msg`, `status` 등

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `sySiteMng` | 시스템 > 사이트관리 | sy_site |
| `syCodeMng` | 시스템 > 공통코드관리 | sy_code_grp, sy_code |
| `syBrandMng` | 시스템 > 브랜드관리 | sy_brand |
| `syBizMng` | 시스템 > 업체 | sy_vendor, sy_vendor_content, sy_vendor_brand |
| `syBizUserMng` | 시스템 > 업체사용자 | sy_vendor_user |
| `syAttachMng` | 시스템 > 첨부관리 | sy_attach_grp, sy_attach |
| `syTemplateMng` | 시스템 > 템플릿관리 | sy_template |
| `syBatchMng` | 시스템 > 배치스케줄관리 | sy_batch, sy_batch_hist, sy_batch_log |
| `syAlarmMng` | 시스템 > 알림관리 | sy_alarm, sy_alarm_send_hist |
| `syPropMng` | 시스템 > 프로퍼티관리 | sy_prop |
| `syPathMng` | 시스템 > 표시경로 | sy_path |
| `cmNoticeMng` | 시스템 > 공지사항관리 | sy_notice |
| `syBbmMng` | 시스템 > 게시판관리 | sy_bbm, sy_bbs |
| `syBbsMng` | 시스템 > 게시글관리 | sy_bbs |
| `syContactMng` | 고객센터 > 문의관리 | sy_contact |
| `syUserMng` | 시스템 > 사용자관리 | sy_user, sy_user_role |
| `syDeptMng` | 시스템 > 부서관리 | sy_dept |
| `syMenuMng` | 시스템 > 메뉴관리 | sy_menu, sy_role_menu |
| `syRoleMng` | 시스템 > 역할관리 | sy_role, sy_user_role, sy_role_menu |
| `syUserLoginHist` | 시스템 > 사용자로그인이력 | sy_user_login_hist, sy_user_login_log |
| `syI18nMng` | 시스템 > 다국어관리 | sy_i18n, sy_i18n_msg |

## 관련 정책서
- `_doc/정책서sy/sy.01.플랫폼.md`
- `_doc/정책서sy/sy.02.시스템공통.md`
- `_doc/정책서sy/sy.03.사용자.md`
- `_doc/정책서sy/sy.04.메뉴.md`
- `_doc/정책서sy/sy.05.권한.md`
- `_doc/정책서sy/sy.06.공통코드.md`
- `_doc/정책서sy/sy.07.판매자.md`
- `_doc/정책서sy/sy.08.업체.md`
