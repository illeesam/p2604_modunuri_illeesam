---
정책명: 사용자(Front Office) 인증 정책
정책번호: base-인증-fo
관리자: 개발팀
최종수정: 2026-04-24
---

# 사용자(Front Office) 인증 정책

## 1. 인증 개요

쇼핑몰 회원(`ec_member`) 인증 체계.  
이메일/비밀번호 로그인 지원 (소셜 로그인은 별도 OAuth 연동으로 확장).  
Pinia(`foAuthStore`) + `window.foAuth` 레거시 reactive 이중 구조로 상태를 동기화한다.  
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
2. POST /api/co/fo-auth/login  { loginId, loginPwd }
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

`lib/utils/foApiAxios.js` interceptors.response 에서 처리.

```
API 요청
  → 401 응답 수신 (accessToken 만료)
  → cfg._retry 플래그로 무한 루프 방지
  → POST /api/co/fo-auth/token-refresh
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
          → CustomEvent('api-response-error', { scope:'fo', status:401 }) 발행
          → UI에서 로그인 화면으로 리다이렉트
```

동시 다발 401 처리 (큐잉 패턴):

```js
var isRefreshing = false;
var pending = [];  // subscribe/flush 패턴으로 중복 refresh 방지
```

### ⭐ 401 vs 403 분리 (2026-06-10 critical 수정)

`/api/fo/my/**`, `/api/fo/order/**`, `/api/fo/ec/od/**`(장바구니·주문), `/api/fo/ec/mb/like/**`(찜), `/api/fo/ec/pm/cache/**` 등 인증 필요 경로는 `FO_ONLY` 인가라, accessToken 만료 시 **403** 을 반환했고 프론트는 **401 에서만** refresh 를 트리거해 **자동 갱신이 작동하지 않았다**(BO 와 동일 결함). → `SecurityConfig.exceptionHandling` 에 `authenticationEntryPoint`(401) 추가로 **미인증(만료/무토큰)=401, 권한부족=403** 분리. 상세는 [`base.인증-bo.md`](base.인증-bo.md) §5 참조.

> FO 비로그인 허용 경로(`/api/fo/**` permitAll)는 애초에 인가 통과하므로 영향 없음 — 인증 필요 경로만 해당.

### 운영 전 보완 항목 (high)

- **refreshToken 재사용 탐지 부재**: FO 는 멀티디바이스(token_log 행 추가, 삭제 없음)라 행별 독립 회전 → 특정 행 탈취 시 만료 전까지 무한 갱신 가능. jti 일회성 + 폐기 토큰 재사용 시 디바이스 행 REVOKE 필요
- **토큰 평문 저장**(`mbh_member_token_log.access_token`) → SHA-256 해시 저장·비교 권장
- **로그아웃 디바이스 식별**: FO 로그아웃은 `WHERE authId AND accessToken(평문)` 으로 해당 디바이스 행만 삭제 → 토큰 truncation/불일치 시 서버 refreshToken 잔존 위험. 안정 키(log_id/해시)로 변경 권장
- **소셜 로그인 refreshToken**: 소셜도 일반 로그인과 동일하게 refreshToken 을 서버 token_log 에만 저장하고 클라이언트엔 `null` 반환(의도된 설계). 만료 후 token-refresh(Authorization 헤더 accessToken 기반)로 갱신 가능

---

## 6. 로그아웃

```
POST /api/co/fo-auth/logout
  Authorization: Bearer {accessToken}
서버: accessToken에서 authId 추출 → mbh_member_token_log에서 해당 행 DELETE
      (같은 memberId의 다른 디바이스 행은 유지)

클라이언트:
  localStorage.removeItem('modu-fo-accessToken')
  localStorage.removeItem('modu-fo-authUser')
  → foAuthStore 상태 초기화
  → 홈 또는 로그인 화면 이동
```

---

## 7. 세션 복원 (페이지 로드)

```js
// lib/stores/fo/foAuthStore.js — Pinia state 초기화
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

## 8. 실시간 동기화 + 교차탭 계정변경

```js
// lib/base/foAuth.js init() 내부
setInterval(() => { store.saSyncFromStorage(); }, 3000);  // 3초 폴링: 토큰 삭제 감지

window.addEventListener('storage', e => {
  if (e.key === 'modu-fo-accessToken' || e.key === 'modu-fo-authUser') {
    const prevAuthId = store.svAuthUser?.authId || '';
    store.saSyncFromStorage();
    const nextAuthId = store.svAuthUser?.authId || '';
    // ⭐ '로그인돼 있던 회원'이 로그아웃되거나 다른 계정으로 바뀌면 reload (이전 회원 데이터 격리)
    //    단 '비로그인 → 로그인'(prev='')은 reload 생략 — 둘러보던 상태·장바구니 보존
    if (prevAuthId && prevAuthId !== nextAuthId) {
      // 인증 필요 페이지(마이페이지/주문 등)에 머물러 있으면 reload 후 다시 진입하지 않도록 home 으로
      const curPage = new URLSearchParams((location.hash||'').replace(/^#/,'')).get('page') || '';
      if (AUTH_PAGES.includes(curPage)) location.hash = '#page=home';
      location.reload();
    }
  }
});
```

**⭐ 교차탭 계정변경 보안 (BO와 동일 원칙, FO 특성 반영)**: 다른 탭에서 회원이 로그아웃하거나 **다른 계정으로 재로그인**하면 이 탭 메모리에 이전 회원의 개인정보(마이페이지 주문/캐시/쿠폰 등)가 잔존하므로 `location.reload()` 로 격리한다.
단 BO와 달리 FO는 **비로그인이 정상 케이스**이므로, `prevAuthId === ''`(비로그인 둘러보기 중 다른 탭에서 로그인) 인 경우는 reload 하지 않는다 → 둘러보던 화면과 **장바구니(`shopjoy_cart`)를 보존**한다.

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
| 상품 둘러보기 / 검색 | **허용** (FO 는 비로그인 둘러보기가 정상 케이스) |
| 장바구니 담기 / 수정 / 삭제 | **허용 (비로그인 자유)** — `localStorage('shopjoy_cart')` 브라우저 기준, 로그인 무관. 결제 시점에 로그인 |
| 찜 버튼 (♡) | 로그인 모달 표시 |
| 주문 페이지 | `error401` 리다이렉트 (로그인 후 진행) |
| 블로그 작성 | `error401` 리다이렉트 |
| 마이페이지 전체 | `error401` 리다이렉트 |

> **로그인 화면 = 모달** (BO 의 전용 화면과 반대). 사용자는 둘러보다 장바구니/주문 시점에 그 자리에서 모달로 로그인 → 페이지 이탈 없음.
> **장바구니 정책**: 회원별 분리 없이 브라우저 단일 키(`shopjoy_cart`). 비로그인으로 담아두고 로그인 후 결제하는 게스트 장바구니 흐름. 교차탭 reload 시에도 별도 키라 보존됨. 로그아웃해도 장바구니 유지(`onLogout` 은 장바구니 미변경, 마이페이지에 있으면 `home` 으로 이동).

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
- `base.권한-fo.md` — 회원 등급·상태 기반 접근 제어
- `base.UX-fo.md` — 로그인 UI, 헤더 로그인 상태 표시
- `ec.mb.02.회원.md` — 회원 상태·등급 관련 정책
