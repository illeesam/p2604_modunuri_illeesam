---
정책명: 사용자(Front Office) 인증 정책
정책번호: base-인증-front
관리자: 개발팀
최종수정: 2026-04-24
---

# 사용자(Front Office) 인증 정책

## 1. 인증 개요

쇼핑몰 회원(`ec_member`) 인증 체계.  
이메일/비밀번호 로그인 지원 (소셜 로그인은 별도 OAuth 연동으로 확장).  
Pinia(`frontAuthStore`) + `window.frontAuth` 레거시 reactive 이중 구조로 상태를 동기화한다.  
**refreshToken은 서버 DB(`mbh_member_token_log`)에만 저장하며 클라이언트에 전달하지 않는다.**

---

## 2. 토큰 구조

| 토큰 | 저장 위치 | 용도 | 만료 |
|---|---|---|---|
| accessToken | 클라이언트 localStorage (`modu-fo-accessToken`) | API 요청마다 `Authorization: Bearer {token}` 헤더 자동 주입 | 15분 |
| refreshToken | 서버 DB (`mbh_member_token_log.refresh_token`) | accessToken 재발급 용도. 클라이언트 미전달 | 15일 (Sliding) |
| 사용자 정보 | 클라이언트 localStorage (`modu-fo-authUser`) | 로그인한 회원 기본 정보 (JSON) | accessToken과 연동 |

> refreshToken을 클라이언트에 노출하지 않으므로 localStorage 탈취 시에도 세션 연장 불가.

---

## 3. 세션 정책

| 항목 | 정책 |
|---|---|
| 동시 세션 | **멀티디바이스 허용**. 로그인마다 `mbh_member_token_log`에 행 추가 (기존 행 유지) |
| refreshToken 갱신 방식 | **Sliding**: 갱신 시마다 15일 연장 |
| refreshToken 만료 시 | 해당 디바이스 세션 종료. 재로그인 필요 |
| 로그아웃 | 해당 디바이스의 `mbh_member_token_log` 행만 삭제 (다른 디바이스 세션 유지) |

---

## 4. 로그인 흐름

```
1. 로그인 폼 입력 (loginId + password)
2. POST /api/auth/fo/auth/login  { loginId, loginPwd }
3. 서버 처리:
     a. ec_member 조회 → 비밀번호 검증
     b. accessToken(15분) + refreshToken(15일) 신규 발급
     c. mbh_member_token_log에 INSERT (access_token, refresh_token 저장)
        (멀티디바이스: 기존 행 삭제 없음)
     d. 응답: { accessToken, refreshToken: null, authId, userNm, ... }
4. 클라이언트 저장:
     modu-fo-accessToken = accessToken
     modu-fo-authUser    = JSON.stringify(authUser)
     (refreshToken은 응답에 없음 → 저장 안 함)
5. foApiAxios 인터셉터가 이후 모든 요청에 Bearer 헤더 자동 주입
```

---

## 5. 토큰 자동 갱신 (Silent Refresh)

`utils/foApiAxios.js` interceptors.response 에서 처리.

```
API 요청
  → 401 응답 수신 (accessToken 만료)
  → cfg._retry 플래그로 무한 루프 방지
  → POST /api/auth/fo/auth/refresh
       Authorization: Bearer {만료된_accessToken}  ← body 없음
  → 서버 처리:
       a. 만료 토큰에서 authId(=memberId) 추출 (getClaimsAllowExpired)
       b. mbh_member_token_log에서 access_token이 일치하는 행의 refresh_token 조회
          (멀티디바이스: accessToken으로 해당 디바이스 행 특정)
       c. refreshToken 유효성 검증
       d. 신규 accessToken + refreshToken 발급
       e. mbh_member_token_log 해당 행 갱신 (토큰 로테이션)
       f. 응답: { accessToken, refreshToken: null }
  → 성공: 신규 accessToken → localStorage modu-fo-accessToken 갱신
          → 실패했던 원 요청 자동 재시도
  → 실패: modu-fo-accessToken / modu-fo-authUser 삭제
          → foAuth.logout() 호출
          → CustomEvent('api-error', { scope:'fo', status:401 }) 발행
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
POST /api/auth/fo/auth/logout
  Authorization: Bearer {accessToken}
서버: accessToken에서 authId 추출 → mbh_member_token_log에서 해당 행 DELETE
      (같은 memberId의 다른 디바이스 행은 유지)

클라이언트:
  localStorage.removeItem('modu-fo-accessToken')
  localStorage.removeItem('modu-fo-authUser')
  → frontAuthStore 상태 초기화
  → 홈 또는 로그인 화면 이동
```

---

## 7. 세션 복원 (페이지 로드)

```js
// base/stores/frontAuthStore.js — Pinia state 초기화
state: () => {
  const token = localStorage.getItem('modu-fo-accessToken') || null;
  let authUser = null;
  if (token) {
    authUser = JSON.parse(localStorage.getItem('modu-fo-authUser') || 'null');
  }
  return { accessToken: token, authUser };
}
```

---

## 8. 실시간 동기화

```js
// base/frontAuth.js init() 내부
setInterval(() => {
  store.syncFromStorage();  // 1초 폴링: 토큰 삭제 감지 → 즉시 로그아웃
}, 1000);

window.addEventListener('storage', e => {
  if (e.key === 'modu-fo-accessToken' || e.key === 'modu-fo-authUser') {
    store.syncFromStorage();  // 다른 탭 로그인/로그아웃 즉시 반영
  }
});
```

---

## 9. 접근 제어

### 9.1 로그인 필요 페이지

```js
const AUTH_REQUIRED_PAGES = [
  'myOrder', 'myClaim', 'myCoupon', 'myCache',
  'myContact', 'myChatt', 'order', 'blogEdit'
];
// 비로그인 접근 시 → error401 리다이렉트
```

### 9.2 기능별 로그인 요구

| 기능 | 미로그인 처리 |
|---|---|
| 찜 버튼 (♡) | 로그인 모달 표시 |
| 장바구니 담기 | 로그인 후 진행 또는 비회원 허용 |
| 주문 페이지 | `error401` 리다이렉트 |
| 블로그 작성 | `error401` 리다이렉트 |
| 마이페이지 전체 | `error401` 리다이렉트 |

---

## 10. 보안 정책

| 항목 | 정책 |
|---|---|
| refreshToken 노출 | 클라이언트 미전달. 서버 DB에만 저장 |
| 비밀번호 복잡도 | 8자 이상 (영문+숫자+특수문자 권장) |
| 소셜 로그인 | OAuth 2.0 표준 (카카오·네이버·구글 확장 예정) |
| 토큰 전송 방식 | Authorization: Bearer 헤더 (HTTPS only 권장) |
| 멀티디바이스 세션 | 각 디바이스별 독립 세션. 한 디바이스 로그아웃이 타 디바이스에 영향 없음 |

---

## 11. mbh_member_token_log 테이블 구조

| 컬럼 | 설명 |
|---|---|
| `log_id` | PK (TLyyMMddHHmmss + rand4) |
| `member_id` | ec_member.member_id |
| `access_token` | 현재 유효 accessToken (디바이스 식별 키) |
| `refresh_token` | 서버 보관 refreshToken |
| `token_exp` | refreshToken 만료 시각 |
| `prev_token` | 갱신 전 이전 accessToken |
| `action_cd` | LOGIN / REFRESH / LOGOUT |
| `token_type_cd` | FO |

---

## 관련 정책
- `base.권한-front.md` — 회원 등급·상태 기반 접근 제어
- `base.UX-front.md` — 로그인 UI, 헤더 로그인 상태 표시
- `ec.mb.02.회원.md` — 회원 상태·등급 관련 정책
