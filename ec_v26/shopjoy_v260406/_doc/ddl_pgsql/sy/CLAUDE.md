# SY 도메인 DDL

시스템(SY) 도메인 DDL 파일 목록. 테이블 추가 시 이 목록에도 추가할 것.

## 도메인 프리픽스

모든 테이블은 `sy_` 프리픽스 사용.

## 테이블 목록

### 사이트/플랫폼
- `sy_site` — 사이트 마스터 (멀티사이트 격리 기준)

### 공통 코드
- `sy_code_grp` — 코드 그룹
- `sy_code` — 공통 코드 (code_remark)

### 브랜드/업체
- `sy_brand` — 브랜드 (brand_remark)
- `sy_vendor` — 업체 마스터
- `sy_vendor_content` — 업체 소개 내용
- `sy_vendor_user` — 업체 담당자
- `sy_vendor_brand` — 업체-브랜드 연결

### 사용자/조직/권한
- `sy_user` — 관리자 사용자
- `sy_dept` — 부서 (dept_remark)
- `sy_role` — 역할 (role_remark)
- `sy_user_role` — 사용자-역할 연결
- `sy_role_menu` — 역할-메뉴 권한
- `sy_user_login_hist` — 로그인 이력
- `sy_user_login_log` — 로그인 로그 (log 예외)
- `sy_user_token_log` — 토큰 로그 (log 예외)

### 메뉴/경로
- `sy_menu` — 메뉴 (menu_remark)
- `sy_path` — 경로 (path_remark)
- `sy_prop` — 속성 (prop_remark)

### 첨부/템플릿
- `sy_attach_grp` — 첨부 그룹 (attach_grp_remark)
- `sy_attach` — 첨부 파일 (attach_url, attach_memo)
- `sy_template` — 발송 템플릿

### 배치
- `sy_batch` — 배치 마스터
- `sy_batch_hist` — 배치 실행 이력
- `sy_batch_log` — 배치 로그 (log 예외)

### 알람/게시판/문의
- `sy_alarm` — 알람 발송 마스터
- `sy_alarm_send_hist` — 알람 발송 이력
- `sy_bbm` — BBM(메모/공지) (bbm_remark)
- `sy_bbs` — 게시판 마스터
- `sy_contact` — 1:1 문의
- `sy_notice` — 공지사항

### 로그
- `sy_api_log` — API 호출 로그 (log 예외)
- `sy_send_email_log` — 이메일 발송 로그 (log 예외)
- `sy_send_msg_log` — SMS 발송 로그 (log 예외)

## log 테이블 예외 규칙
`*_log` 테이블은 단일 단어 컬럼 허용: `log`, `token`, `ip`, `device`, `msg`, `status` 등
