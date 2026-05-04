---
정책명: 관리자(Back Office) 인증 정책
정책번호: base-인증-admin
관리자: 개발팀
최종수정: 2026-04-24
---

# 관리자(Back Office) 인증 정책

## 1. 인증 개요

관리자(`sy_user`) 전용 인증 체계. 이메일/비밀번호 방식만 허용(소셜 로그인 없음).  
JWT 기반 accessToken + refreshToken 이중 토큰 구조로 세션을 관리한다.  
**refreshToken은 서버 DB(`syh_user_token_log`)에만 저장하며 클라이언트에 전달하지 않는다.**

---

## 2. 토큰 구조

| 토큰 | 저장 위치 | 용도 | 만료 |
|---|---|---|---|
| accessToken | 클라이언트 localStorage (`modu-bo-accessToken`) | API 요청마다 `Authorization: Bearer {token}` 헤더 자동 주입 | 15분 |
| refreshToken | 서버 DB (`syh_user_token_log.refresh_token`) | accessToken 재발급 용도. 클라이언트 미전달 | 2시간 (Sliding) |
| 사용자 정보 | 클라이언트 localStorage (`modu-bo-authUser`) | 로그인한 관리자 기본 정보 (JSON) | accessToken과 연동 |

> refreshToken을 클라이언트에 노출하지 않으므로 localStorage 탈취 시에도 세션 연장 불가.

---

## 3. 세션 정책

| 항목 | 정책 |
|---|---|
| 동시 세션 | **1세션** 제한. 신규 로그인 시 기존 `syh_user_token_log` 행 삭제 후 재발급 |
| refreshToken 갱신 방식 | **Sliding**: 갱신 시마다 2시간 연장 |
| refreshToken 만료 시 | 세션 종료. 재로그인 필요 |

---

## 4. 로그인 흐름

```
1. 로그인 폼 입력 (loginId + password)
2. POST /api/auth/bo/auth/login  { loginId, loginPwd }
3. 서버 처리:
     a. sy_user 조회 → 비밀번호 검증
     b. syh_user_token_log에서 기존 행 DELETE (1세션 정책)
     c. accessToken(15분) + refreshToken(2시간) 신규 발급
     d. syh_user_token_log에 INSERT (access_token, refresh_token 저장)
     e. 응답: { accessToken, refreshToken: null, authId, userNm, ... }
4. 클라이언트 저장:
     modu-bo-accessToken = accessToken
     modu-bo-authUser    = JSON.stringify(authUser)
     (refreshToken은 응답에 없음 → 저장 안 함)
5. boApiAxios 인터셉터가 이후 모든 요청에 Bearer 헤더 자동 주입
```

---

## 5. 토큰 자동 갱신 (Silent Refresh)

`utils/boApiAxios.js` interceptors.response 에서 처리.

```
API 요청
  → 401 응답 수신 (accessToken 만료)
  → cfg._retry 플래그로 무한 루프 방지
  → POST /api/auth/bo/auth/refresh
       Authorization: Bearer {만료된_accessToken}  ← body 없음
  → 서버 처리:
       a. 만료 토큰에서 authId 추출 (getClaimsAllowExpired)
       b. syh_user_token_log에서 해당 userId의 refresh_token 조회
       c. refreshToken 유효성 검증
       d. 신규 accessToken + refreshToken 발급
       e. syh_user_token_log 행 갱신 (토큰 로테이션)
       f. 응답: { accessToken, refreshToken: null }
  → 성공: 신규 accessToken → localStorage modu-bo-accessToken 갱신
          → 실패했던 원 요청 자동 재시도
  → 실패: modu-bo-accessToken / modu-bo-authUser 삭제
          → CustomEvent('api-error', { scope:'bo', status:401 }) 발행
          → UI에서 로그인 화면으로 리다이렉트
```

동시 다발 401 처리 (큐잉 패턴):

```js
var isRefreshing = false;
var pending = [];  // subscribe/flush 패턴으로 중복 refresh 방지
```

---

## 6. 로그아웃

```
POST /api/auth/bo/auth/logout
  Authorization: Bearer {accessToken}
서버: accessToken에서 authId 추출 → syh_user_token_log DELETE

클라이언트:
  localStorage.removeItem('modu-bo-accessToken')
  localStorage.removeItem('modu-bo-authUser')
  → boApp.js 상태 초기화 (currentAuthUser 리셋)
  → 로그인 화면 이동
```

---

## 7. 보안 정책

| 항목 | 정책 |
|---|---|
| refreshToken 노출 | 클라이언트 미전달. 서버 DB에만 저장 |
| 로그인 실패 제한 | 5회 연속 실패 시 계정 잠금 |
| 비밀번호 복잡도 | 영문 대/소문자 + 숫자 + 특수문자, 8자 이상 |
| 비밀번호 변경 주기 | 90일 권장 |
| 토큰 전송 방식 | Authorization: Bearer 헤더 (HTTPS only 권장) |
| 세션 강제 종료 | 신규 로그인 시 기존 세션 자동 무효화 (1세션) |

---

## 8. 로그인 이력 기록

모든 로그인 시도(성공/실패)를 `sy_user_login_log`에 기록.  
토큰 발급/갱신/로그아웃은 `syh_user_token_log`에 기록 (`action_cd`: LOGIN / REFRESH / LOGOUT).

---

## 9. 다른 탭 / DevTools 로그아웃 감지

`base/stores/bo/boAuthStore.js`:

```js
// storage 이벤트: 다른 탭 로그아웃 즉시 감지
window.addEventListener('storage', e => {
  if (e.key === 'modu-bo-accessToken') store.syncFromStorage();
});

// 1초 폴링: 같은 탭 DevTools에서 토큰 삭제 감지
setInterval(() => {
  store.syncFromStorage();
}, 1000);
```

---

## 10. JWT 클레임 구조 및 AuthPrincipal 설계

### 10.1 accessToken 클레임 필드

| 클레임 | 타입 | 값 예시 | 설명 |
|---|---|---|---|
| `sub` | String | `"US260424123456xxxx"` | authId (sy_user.user_id) |
| `loginId` | String | `"admin01"` | 로그인 아이디 |
| `roles` | List\<String\> | `["BO_GUEST"]` | 권한 목록 |
| `type` | String | `"access"` | 토큰 종류 |
| `appTypeCd` | String | `"BO"` | 사용자 구분 (BO / FO) |
| `roleId` | String | `"ROLE_001"` | 역할 ID |
| `userId` | String | `"US260424..."` | BO 전용: sy_user.user_id |
| `memberId` | String | `null` | FO 전용: BO는 null |
| `siteId` | String | `"SITE01"` | 소속 사이트 |

### 10.2 인증 흐름 (필터 기준)

```
HTTP 요청 (Authorization: Bearer <accessToken>)
  └─ JwtAuthFilter
       ├─ JWT 서명 검증 + 만료 확인
       ├─ 클레임 추출: authId, appTypeCd, roles, ...
       ├─ AuthPrincipal 생성 (DB 조회 없음)
       └─ SecurityContextHolder에 Authentication 저장
```

### 10.3 SecurityUtil 사용법

```java
SecurityUtil.currentUserId()    // → authId ("US260424...")
SecurityUtil.currentAppType()  // → "BO" 또는 "FO"
```

---

## 11. syh_user_token_log 테이블 구조

| 컬럼 | 설명 |
|---|---|
| `log_id` | PK (TLyyMMddHHmmss + rand4) |
| `user_id` | sy_user.user_id |
| `access_token` | 현재 유효 accessToken |
| `refresh_token` | 서버 보관 refreshToken |
| `token_exp` | refreshToken 만료 시각 |
| `prev_token` | 갱신 전 이전 accessToken |
| `action_cd` | LOGIN / REFRESH / LOGOUT |
| `token_type_cd` | BO |

---

## 관련 정책
- `base.권한-admin.md` — 역할(RBAC) 및 메뉴 접근 제어
- `sy.04.사용자.md` — 관리자 계정 등록·비밀번호·상태 관리
- `sy.05.사용자권한.md` — 사용자-역할 할당 운영
