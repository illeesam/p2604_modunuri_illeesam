---
정책명: 사용자(Front Office) 인증 정책
정책번호: base-인증-front
관리자: 개발팀
최종수정: 2026-04-19
---

# 사용자(Front Office) 인증 정책

## 1. 인증 개요

쇼핑몰 회원(`ec_member`) 인증 체계.  
이메일/비밀번호 + 소셜 로그인(카카오·네이버·구글) 지원.  
Pinia(`frontAuthStore`) + `window.frontAuth` 레거시 reactive 이중 구조로 상태를 동기화한다.

---

## 2. 토큰 구조

| 토큰 | localStorage 키 | 용도 |
|---|---|---|
| accessToken | `modu-front-token` | API 요청 인증. `frontApi` 헤더에 자동 주입 |
| 사용자 정보 | `modu-front-user` | 로그인한 회원 기본 정보 (JSON) |

> **현재 구현**: 단순 토큰 1개 방식. 실 서비스 연동 시 refreshToken(`modu-front-refresh`) 추가하여  
> `utils/frontAxios.js` interceptor에서 adminAxios와 동일한 silent refresh 패턴 적용 권장.

### 실 서비스 확장 시 토큰 구조

| 토큰 | localStorage 키 | 만료 |
|---|---|---|
| accessToken | `modu-front-token` | 15분~1시간 |
| refreshToken | `modu-front-refresh` | 7~30일 |
| 사용자 정보 | `modu-front-user` | accessToken과 연동 |

---

## 3. 로그인 방식

### 3.1 이메일/비밀번호 로그인

```
1. 로그인 폼 입력 (email + password)
2. frontAuth.login(email, password)
3. GET api/base/users.json (목업) → email/password 매칭
4. 성공: token 생성 → frontAuthStore.setSession(user, token)
          → localStorage 저장 (modu-front-token, modu-front-user)
          → frontAuth.state.user 동기화
5. 실패: { ok: false, msg: '이메일 또는 비밀번호를 확인하세요.' }
```

### 3.2 소셜 로그인

| 제공사 | 방식 |
|---|---|
| 카카오 | Kakao OAuth 2.0 연동 |
| 네이버 | Naver OAuth 2.0 연동 |
| 구글 | Google OAuth 2.0 연동 |

```js
// base/frontAuth.js
frontAuth.loginSocial('kakao');
frontAuth.loginSocial('naver');
frontAuth.loginSocial('google');
// → provider별 데모 계정으로 즉시 세션 생성 (목업)
// → 실 서비스: OAuth redirect 후 콜백에서 setSession 호출
```

---

## 4. 세션 복원

페이지 로드 시 localStorage에서 토큰/사용자 정보 자동 복원:

```js
// base/stores/frontAuthStore.js — Pinia state 초기화
state: () => {
  const token = localStorage.getItem('modu-front-token') || null;
  let user = null;
  if (token) {
    user = JSON.parse(localStorage.getItem('modu-front-user') || 'null');
  }
  return { token, user };
}

// isLoggedIn getter
isLoggedIn: s => !!(s.token && s.user)
```

---

## 5. 실시간 동기화

### 5.1 DevTools / 다른 탭 감지

```js
// base/frontAuth.js init() 내부
setInterval(() => {
  store.syncFromStorage();  // 1초 폴링: 토큰 삭제 감지 → 즉시 로그아웃
}, 1000);

window.addEventListener('storage', e => {
  if (e.key === 'modu-front-token' || e.key === 'modu-front-user') {
    store.syncFromStorage();  // 다른 탭 로그인/로그아웃 즉시 반영
  }
});
```

### 5.2 syncFromStorage 로직

```
localStorage에 토큰 없음 + store에 토큰 있음 → 강제 로그아웃 (외부 삭제 감지)
localStorage 토큰이 store와 다름 → 재동기화 (다른 탭 로그인 감지)
```

---

## 6. 로그아웃

```js
frontAuth.logout()
  → frontAuthStore.clearSession()
  → localStorage.removeItem('modu-front-token')
  → localStorage.removeItem('modu-front-user')
  → frontAuth.state.user = null
```

---

## 7. 접근 제어

### 7.1 로그인 필요 페이지

```js
// base/frontApp.js 라우터
const AUTH_REQUIRED_PAGES = [
  'myOrder', 'myClaim', 'myCoupon', 'myCache',
  'myContact', 'myChatt', 'order', 'blogEdit'
];

if (AUTH_REQUIRED_PAGES.includes(page.value) && !frontAuth.state.user) {
  navigate('error401');
  return;
}
```

### 7.2 기능별 로그인 요구

| 기능 | 미로그인 처리 |
|---|---|
| 찜 버튼 (♡) | 로그인 모달 표시 |
| 장바구니 담기 | 로그인 후 진행 또는 비회원 허용 |
| 주문 페이지 | `error401` 리다이렉트 |
| 블로그 작성 | `error401` 리다이렉트 |
| 마이페이지 전체 | `error401` 리다이렉트 |

---

## 8. 회원가입

```js
frontAuth.signup(memberNm, email, phone, extra)
  → user 객체 생성 (userId: 'u_' + Date.now())
  → frontAuthStore.setSession(user, token)
  → 즉시 로그인 상태
```

실 서비스 연동 시: POST `api/member/signup` → 이메일 인증 → 활성화 후 로그인.

---

## 9. 보안 정책

| 항목 | 정책 |
|---|---|
| 비밀번호 복잡도 | 8자 이상 (실 서비스 영문+숫자+특수문자 권장) |
| 소셜 로그인 | OAuth 2.0 표준. 비밀번호 미저장 |
| 토큰 저장 | localStorage (실 서비스에서 HttpOnly 쿠키 이관 검토) |
| HTTPS | 실 서비스에서 필수 |
| 세션 유지 | localStorage 영속. 명시적 로그아웃 또는 토큰 만료 시 해제 |

---

## 10. 목업 환경 (현재 구현)

- `api/base/users.json` — 테스트 계정 목록 (email, password, userId, memberNm, phone)
- 토큰: `'sjt_' + Date.now().toString(36) + '_' + random` 형식 로컬 생성
- refreshToken 없음 (목업 단계에서는 토큰 만료 없음)

---

## 관련 정책
- `base.권한-front.md` — 회원 등급·상태 기반 접근 제어
- `base.UX-front.md` — 로그인 UI, 헤더 로그인 상태 표시
- `ec.mb.*` — 회원 상태·등급 관련 정책
