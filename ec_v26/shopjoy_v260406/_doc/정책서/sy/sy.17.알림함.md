# 알림함 정책 (sy_noti)

## 정책명 & 목적

**알림 통합 수신함 정책** — 관리자(BO)·회원(FO)이 받는 모든 알림을 한 테이블에 모으고,
각 화면 상단 종(🔔) 아이콘에서 누적 확인·읽음관리·상세이동을 일관되게 제공한다.

기존에는 오류/공지/발송 메시지가 토스트나 500 화면으로 **한 번 스쳐 지나가면 사라져서**
"방금 뭐라고 떴는지" 확인할 방법이 없었다. 이를 누적 보관으로 해결한다.

## 범위

- **역할**: 관리자 사용자(sy_user), 쇼핑몰 회원(mb_member)
- **대상 화면**: BO 전 화면 상단 헤더, FO 전 화면 상단 헤더
- **관련 컴포넌트**: `components/comp/CoNotiBell.js`, `lib/utils/coNotiStore.js`

## 주요 정책

### 1. 알림 유형 4종

| 유형 코드 | 라벨 | 아이콘 | 저장 위치 |
|---|---|---|---|
| `NOTICE` | 공지사항 | 📢 | **DB (sy_noti)** |
| `ALARM` | 수신알림 | 🔔 | **DB (sy_noti)** |
| `SPECIAL` | 특이사항 | ⚠️ | **DB (sy_noti)** |
| `ERROR` | 오류정보 | 💥 | **브라우저 sessionStorage (DB 미저장)** |

### 2. 오류(ERROR)만 DB 에 저장하지 않는 이유 ⭐

- 오류 알림은 **서버가 죽었을 때 대량 발생**한다. 그 시점에 DB 쓰기를 시도하면
  정작 기록이 필요한 순간에 기록이 남지 않는다.
- 브라우저·세션 단위의 진단 정보라 **수신자(recv_id) 개념이 없다**.
- 따라서 오류는 `sessionStorage`(`modu-{bo|fo}-noti-local`)에만 쌓고, 목록에서 `· 로컬` 로 구분 표기한다.
- F5 해도 유지되고 탭을 닫으면 사라진다. localStorage 는 탭·창이 공유해 서로 간섭하므로 쓰지 않는다.

### 3. 수신자 1명 = 1행

`sy_noti` 는 **수신자별로 행을 따로 만든다**. 여러 명이 같은 공지를 받아도 N행이 생긴다.
읽음 상태(`read_yn`/`read_date`)를 각자 관리해야 하므로 공유 행을 두지 않는다.

### 4. 수신자 스코프는 서버가 강제한다 (보안)

- BO: `BoSyNotiService` 가 `recvTypeCd='USER'` + 로그인 사용자ID 를 **서버에서 주입**
- FO: `FoSyNotiService` 가 `recvTypeCd='MEMBER'` + 로그인 회원ID 를 **서버에서 주입**
- 읽음 처리·삭제도 `entity.recvId` 와 대조해 본인 것이 아니면 `접근 권한이 없습니다` 예외
- ❌ 클라이언트가 보낸 `recvId` 를 그대로 신뢰하면 남의 알림을 조회/삭제할 수 있다

### 5. 동일 오류 병합

같은 `method + URL + status` 조합의 오류는 5분 이내면 새 행을 만들지 않고
`count` 를 올리고 시각만 갱신한다 → 목록에 `N회 반복` 으로 표시.
백엔드 장애 시 같은 오류가 수십 건 쏟아지는 상황에서 원인 파악이 쉬워진다.

### 6. 신규 알림 수신 방식

푸시 채널이 없으므로 **60초 폴링**(`fnLoadServer`)으로 갱신한다.
종 클릭·알림함 열기 시에도 즉시 재조회한다.

### 7. 읽음/안읽음 표기 규칙

| 상태 | 표기 |
|---|---|
| 안읽음 | 좌측 유형색 3px 액센트 바 + 옅은 배경 + **굵은 제목** + 채운 점 + `NEW` 칩 |
| 읽음 | 흰 배경 + 보통 굵기 + 회색 제목 + 빈 점 |

행 우측 아이콘: `▾` 그 자리에서 펼쳐보기(펼치면 읽음 처리) / `↗` 상세화면 이동(`link_page` 있을 때만) / `✕` 삭제

## 상태 코드 / 필드

| 컬럼 | 값 |
|---|---|
| `recv_type_cd` | `MEMBER`(쇼핑몰 회원) / `USER`(관리자 사용자) |
| `noti_type_cd` | `NOTICE` / `ALARM` / `SPECIAL` (ERROR 는 DB 미사용) |
| `channel_cd` | `mail` / `sms` / `kakao` / `chat` / `notice` |
| `read_yn` | `Y` / `N` |

## 관련 테이블

`sy_noti`

## 관련 API

| 구분 | 엔드포인트 |
|---|---|
| BO 내 알림 | `GET /api/bo/sy/noti/my`, `/my/page`, `/my/unread-count` |
| BO 발송 | `POST /api/bo/sy/noti/send` (수신자 N명 → N행) |
| BO 읽음/삭제 | `PATCH /api/bo/sy/noti/{id}/read`, `POST /my/read-all`, `DELETE /{id}`, `DELETE /my/all` |
| FO 내 알림 | `GET /api/fo/my/noti/list`, `/page`, `/unread-count` |
| FO 읽음/삭제 | `PATCH /api/fo/my/noti/{id}/read`, `POST /read-all`, `DELETE /{id}`, `DELETE /all` |

## 관련 화면

| pageId | 라벨 |
|--------|------|
| `zdSimulNotiKakao` | 시뮬레이션 > 알림 > 메시지전송(알림톡) |
| `zdSimulNotiSms` | 시뮬레이션 > 알림 > 메시지전송(SMS) |
| `zdSimulNotiMail` | 시뮬레이션 > 알림 > 메시지전송(메일) |
| `zdSimulNotiChat` | 시뮬레이션 > 알림 > 메시지전송(채팅) |
| `zdSimulNotiNotice` | 시뮬레이션 > 알림 > 공지사항생성 |
| `zdSimulNotiError` | 시뮬레이션 > 알림 > 오류정보생성 |

---

## 테스트 수신처 통일 정책 ⭐ (2026-08-15)

### 규칙

개발/테스트 환경의 **모든 회원·사용자 연락처를 실제 수신 가능한 단일 값으로 통일**한다.
메일/SMS/알림톡 발송 시뮬레이션 결과를 실제로 받아 확인하기 위함이며,
샘플 데이터의 가짜 주소로 발송되어 **실존하지 않는 곳으로 나가거나 반송되는 것을 막는다**.

| 항목 | 값 |
|---|---|
| 이메일 | `illeesam@gmail.com` |
| 휴대폰 | `010-3805-0206` |

### 적용 컬럼

| 테이블 | 컬럼 | 비고 |
|---|---|---|
| `mb_member` | `member_email` | **신설 컬럼** (2026-08-15) |
| `mb_member` | `member_phone` | |
| `sy_user` | `user_email` | |
| `sy_user` | `user_phone` | |

### ⛔ `mb_member.login_id` 는 절대 덮어쓰지 않는다

- `login_id` 에는 `mb_member_uk_login_id` **UNIQUE 제약**이 있다 → 전 회원을 같은 값으로 바꾸면 실패한다
- `login_id` 는 **로그인 식별자**다. 같은 값으로 통일하면 회원 로그인 자체가 불가능해진다
- 그래서 수신용 이메일을 담는 `member_email` 컬럼을 별도로 신설했다
  (기존에는 mb_member 에 이메일 컬럼이 아예 없어 `login_id` 를 이메일처럼 쓰고 있었다 — 설계 결함)

### 적용 SQL

```sql
ALTER TABLE shopjoy_2604.mb_member ADD COLUMN IF NOT EXISTS member_email VARCHAR(100);
COMMENT ON COLUMN shopjoy_2604.mb_member.member_email IS '회원 이메일 (수신용. 로그인ID(login_id)와 별개)';

UPDATE shopjoy_2604.mb_member SET member_email='illeesam@gmail.com', member_phone='010-3805-0206';
UPDATE shopjoy_2604.sy_user   SET user_email  ='illeesam@gmail.com', user_phone  ='010-3805-0206';
```

적용 결과(2026-08-15): `mb_member` 49행 / `sy_user` 81행 전건 반영 완료.

### 신규 데이터 시딩 시

새로 회원·사용자 샘플을 만들 때도 **이메일/휴대폰은 위 값으로 고정**한다.
`@example.com` 류의 가짜 주소를 새로 넣지 않는다.

### ⚠️ 운영(prod) 반영 금지

이 정책은 **local/dev 전용**이다. 운영 데이터에 적용하면 전 회원의 연락처가 파괴된다.

## 제약사항

- 오류 알림은 브라우저에만 남으므로 **다른 기기·브라우저에서 조회되지 않는다** (의도된 동작)
- 푸시 채널이 없어 실시간 수신이 아니다 (최대 60초 지연)
- `sy_noti` 는 자동 정리 배치가 없다 — 장기 운영 시 보관기간 정책·삭제 배치가 필요하다

## 변경 이력

| 날짜 | 변경 내용 |
|------|---------|
| 2026-08-15 | 최초 작성 — sy_noti 신설, 알림 유형 4종, 오류 로컬 보관 근거, 수신자 서버 스코프 강제 |
| 2026-08-15 | 테스트 수신처 통일 정책 추가 — mb_member.member_email 신설, 전건 통일 |
