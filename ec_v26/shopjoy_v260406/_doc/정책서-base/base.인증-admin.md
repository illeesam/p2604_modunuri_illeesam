---
정책명: 관리자(Back Office) 인증 정책
정책번호: base-인증-admin
관리자: 개발팀
최종수정: 2026-04-20
---

# 관리자(Back Office) 인증 정책

## 1. 인증 개요

관리자(`sy_user`) 전용 인증 체계. 이메일/비밀번호 방식만 허용(소셜 로그인 없음).  
JWT 기반 accessToken + refreshToken 이중 토큰 구조로 세션을 관리한다.

---

## 2. 토큰 구조

| 토큰 | localStorage 키 | 용도 | 만료 |
|---|---|---|---|
| accessToken | `modu-admin-token` | API 요청마다 `Authorization: Bearer {token}` 헤더에 주입 | 짧음 (15분~1시간) |
| refreshToken | `modu-admin-refresh` | accessToken 만료 시 재발급 요청에 사용 | 김 (7~30일) |
| 사용자 정보 | `modu-admin-user` | 로그인한 관리자 기본 정보 (JSON) | accessToken과 연동 |

---

## 3. 로그인 흐름

```
1. 로그인 폼 입력 (loginId + password)
2. POST api/auth/admin/login
3. 서버 응답: { accessToken, refreshToken, user }
4. localStorage 저장:
     modu-admin-token   = accessToken
     modu-admin-refresh = refreshToken
     modu-admin-user    = JSON.stringify(user)
5. adminAxios 인터셉터가 이후 모든 요청에 Bearer 헤더 자동 주입
```

---

## 4. 토큰 자동 갱신 (Silent Refresh)

`utils/adminAxios.js` interceptors.response 에서 처리.

```
API 요청
  → 401 응답 수신 (accessToken 만료)
  → cfg._retry 플래그로 무한 루프 방지
  → POST api/auth/admin/refresh { refresh: refreshToken }
  → 성공: 신규 accessToken (+ 선택적 신규 refreshToken) 응답
        → localStorage modu-admin-token 갱신
        → 실패했던 원 요청 자동 재시도
  → 실패: modu-admin-token / modu-admin-refresh / modu-admin-user 모두 삭제
        → CustomEvent('api-error', { scope:'admin', status:401 }) 발행
        → UI에서 로그인 화면으로 리다이렉트
```

동시 다발 401 처리:

```js
// 이미 refreshing 중이면 큐잉 후 새 토큰으로 재시도
var isRefreshing = false;
var pending = [];  // subscribe/flush 패턴
```

---

## 5. 로그아웃

```
localStorage.removeItem('modu-admin-token')
localStorage.removeItem('modu-admin-refresh')
localStorage.removeItem('modu-admin-user')
→ AdminApp.js의 상태 초기화
→ 로그인 화면 이동
```

서버 측: 선택적으로 `POST api/auth/admin/logout` 호출하여 refreshToken 무효화.

---

## 6. 보안 정책

| 항목 | 정책 |
|---|---|
| 로그인 실패 제한 | 5회 연속 실패 시 계정 15분 잠금 |
| 비밀번호 복잡도 | 영문 대/소문자 + 숫자 + 특수문자, 8자 이상 |
| 비밀번호 변경 주기 | 90일 권장 |
| 비밀번호 이력 | 최근 3개 재사용 불가 |
| 세션 타임아웃 | 비활성 30분 후 자동 로그아웃 |
| 최대 동시 세션 | 3개 (다중 로그인 허용) |
| 토큰 전송 방식 | HTTPS only. localStorage (HttpOnly 쿠키로 이관 권장) |

---

## 7. 로그인 이력 기록

모든 로그인 시도(성공/실패)를 `sy_user_login_log`에 기록.

| 필드 | 내용 |
|---|---|
| `user_id` | 로그인한 관리자 ID |
| `login_result` | SUCCESS / FAIL |
| `fail_reason` | 실패 사유 (비밀번호 오류 / 잠금 등) |
| `ip` | 접속 IP |
| `device` | User-Agent |
| `login_date` | 로그인 일시 |

---

## 8. 다른 탭 / DevTools 로그아웃 감지

`utils/adminAxios.js` 의 `storage` 이벤트 리스너:

```js
window.addEventListener('storage', e => {
  if (e.key === 'modu-admin-token' && !e.newValue) {
    // 다른 탭 또는 DevTools에서 토큰 삭제 → 즉시 세션 종료
  }
});
```

---

## 9. 목업 환경 (현재 구현)

실제 백엔드 연동 전까지:
- `api/base/admin-users.json` 에서 loginId + password 매칭
- accessToken: `'sjt_adm_' + Date.now().toString(36)` 형식 로컬 생성
- refreshToken 재발급은 mock 응답으로 처리

---

---

## 10. JWT 클레임 구조 및 AuthPrincipal 설계 (2026-04-20 적용)

### 10.1 JWT 클레임 필드

| 클레임 | 타입 | 값 예시 | 설명 |
|---|---|---|---|
| `sub` | String | `"usr_240101..."` | 사용자 ID (userId) |
| `loginId` | String | `"admin01"` | 로그인 아이디 (access token만) |
| `roles` | List\<String\> | `["ROLE_ADMIN"]` | 권한 목록 (access token만) |
| `type` | String | `"access"` \| `"refresh"` | 토큰 종류 구분 |
| `userType` | String | `"USER"` \| `"MEMBER"` | 사용자 테이블 구분 |

### 10.2 userType 도입 이유

이 시스템에는 두 개의 사용자 테이블이 존재한다:
- `sy_user` — 관리자(Back Office). `userType = "USER"`
- `ec_member` — 고객(Front Office). `userType = "MEMBER"`

기존 Spring Security의 `UserDetailsService`는 단일 사용자 저장소를 전제하므로, 두 테이블을 구분하려면 매 요청마다 DB를 조회하거나 별도 필터가 필요하다. JWT 클레임에 `userType`을 심어두면:
1. **필터에서 DB 조회 없이** `AuthPrincipal`을 복원할 수 있다.
2. **단일 필터(`JwtAuthFilter`)**로 두 사용자 타입을 모두 처리할 수 있다.
3. Service 어디서든 `SecurityUtil`로 사용자 타입을 확인할 수 있다.

### 10.3 인증 흐름 (필터 기준)

```
HTTP 요청 (Authorization: Bearer <token>)
  └─ JwtAuthFilter
       ├─ JWT 검증 (서명, 만료)
       ├─ 클레임 추출: userId, userType, roles
       ├─ AuthPrincipal(userId, userType) 생성
       ├─ SimpleGrantedAuthority 목록 구성 (roles 클레임 기반)
       └─ SecurityContextHolder에 Authentication 저장
             ← DB 조회 없음
```

### 10.4 SecurityUtil 사용법

```java
// Controller, Service 어디서든 (파라미터 주입 불필요)
SecurityUtil.currentUserId()    // → "usr_240101..."
SecurityUtil.currentUserType()  // → "USER" 또는 "MEMBER"
SecurityUtil.isUser()           // → true: 관리자
SecurityUtil.isMember()         // → true: 고객

// 타입별 분기 예시
if (SecurityUtil.isUser()) {
    // 관리자 전용 로직
} else if (SecurityUtil.isMember()) {
    // 고객 전용 로직
}
```

### 10.5 ec_member 로그인 확장 시 추가 사항

고객 로그인 엔드포인트(`POST /auth/member/login`) 구현 시:
```java
// AuthPrincipal.MEMBER("MEMBER")를 전달하면 기존 필터·유틸을 그대로 사용
jwtProvider.createAccessToken(member.getMemberId(), member.getLoginId(), roles, AuthPrincipal.MEMBER);
jwtProvider.createRefreshToken(member.getMemberId(), AuthPrincipal.MEMBER);
```

### 10.6 주의 사항

- `@Async` 비동기 처리 시 SecurityContext가 전파되지 않음 → `SecurityContextHolder.MODE_INHERITABLETHREADLOCAL` 또는 별도 userId 파라미터 전달 필요
- refresh 엔드포인트에서 `userType`을 refresh token 클레임에서 읽으므로 DB 재조회 없이 동일 타입으로 재발급됨

---

## 관련 정책
- `base.권한-admin.md` — 역할(RBAC) 및 메뉴 접근 제어
- `sy.04.사용자.md` — 관리자 계정 등록·비밀번호·상태 관리
- `sy.05.사용자권한.md` — 사용자-역할 할당 운영
