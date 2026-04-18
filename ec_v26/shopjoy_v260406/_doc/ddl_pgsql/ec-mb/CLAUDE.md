# ec-mb/ 회원 도메인 DDL

## SQL 파일 목록
- `mb_mem.sql` — 회원 마스터 (PK: member_id)
- `mb_mem_addr.sql` — 회원 배송지
- `mb_like.sql` — 찜 목록 (FK: member_id + prod_id)
- `mb_mem_login_hist.sql` — 로그인 이력
- `mb_mem_login_log.sql` — 로그인 로그 *(log 예외)*
- `mb_mem_token_log.sql` — 토큰 로그 *(log 예외)*

## 상태 코드
- `member_status_cd`: ACTIVE / DORMANT / SUSPENDED / WITHDRAWN

## 컬럼명 주의
- 이메일: `member_email` (단일 단어 → 프리픽스 필수)
- 이름: `member_nm`
- 연락처: `member_phone`

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `mbMemberMng` | 회원관리 > 회원관리 | mb_mem, mb_mem_addr, mb_like |
| `mbCustInfoMng` | 고객센터 > 고객종합정보 | mb_mem + 주문/클레임/캐시/쿠폰 등 통합 |
| `syMemberLoginHist` | 시스템 > 회원로그인이력 | mb_mem_login_hist, mb_mem_login_log |

## 관련 정책서
- `_doc/정책서ec/mb.01.회원.md`
