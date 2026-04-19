# 정책서ec-mb — 회원(MB) 도메인

## 파일 목록

| 파일 | 내용 |
|---|---|
| `mb.01.회원상태표.md` | 회원 상태·등급 코드 표 + 액션·혜택 매트릭스 (참조 전용) |
| `mb.02.회원.md` | 고객 회원 관리, 상태, SNS연동, 디바이스토큰, 회원그룹 |

## 관련 테이블 (ec-mb/)
- `mb_member` — 회원 마스터
- `mb_member_sns` — SNS 연동
- `mb_member_withdraw` — 탈퇴 이력
- `mb_member_token_log` — 토큰 로그
- `mb_member_login_log` — 로그인 로그
- `mb_like` — 찜 목록

## 관리자 화면
| pageId | 라벨 |
|---|---|
| `mbMemberMng` | 회원관리 > 회원관리 |
| `mbCustInfoMng` | 고객센터 > 고객종합정보 |
