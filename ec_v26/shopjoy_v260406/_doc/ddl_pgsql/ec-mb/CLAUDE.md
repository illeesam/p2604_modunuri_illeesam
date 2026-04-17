# ec-mb/ 회원 도메인 DDL

## 테이블 목록
- `mb_mem` — 회원 마스터 (PK: member_id)
- `mb_mem_addr` — 회원 배송지 (PK: mem_addr_id)
- `mb_like` — 찜 목록 (PK: like_id, FK: member_id + prod_id)
- `mb_mem_login_hist` — 로그인 이력 (PK: login_hist_id)
- `mb_mem_login_log` — 로그인 로그 *(log 예외: 단일 단어 컬럼 허용)*
- `mb_mem_token_log` — 토큰 로그 *(log 예외)*

## 상태 코드
- `member_status_cd`: ACTIVE / DORMANT / SUSPENDED / WITHDRAWN

## 컬럼명 주의
- 이메일: `member_email` (단일 단어 → 프리픽스 필수)
- 이름: `member_nm`
- 연락처: `member_phone`

## 관련 정책서
- `_doc/정책서ec/mb.01.회원.md`
