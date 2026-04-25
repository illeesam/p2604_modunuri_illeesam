---
정책명: 사용자(Front Office) 권한 정책
정책번호: base-권한-front
관리자: 개발팀
최종수정: 2026-04-19
---

# 사용자(Front Office) 권한 정책

## 1. 권한 모델 개요

쇼핑몰 회원의 접근 제어는 **로그인 여부** + **회원 상태** + **회원 등급** 3가지 축으로 결정된다.

| 축 | 판단 기준 | 저장 위치 |
|---|---|---|
| 로그인 여부 | `frontAuthStore.isLoggedIn` | localStorage `modu-front-token` |
| 회원 상태 | `member_status_cd` | 서버 API |
| 회원 등급 | `mem_grade_id` | 서버 API / `frontAuth.state.user` |

---

## 2. 회원 상태별 접근 권한

| 상태 코드 | 상태명 | 접근 범위 |
|---|---|---|
| `ACTIVE` | 정상 | 전체 기능 사용 가능 |
| `DORMANT` | 휴면 | 로그인 불가 (휴면 해제 필요) |
| `SUSPENDED` | 정지 | 로그인 불가 (정지 기간 동안) |
| `WITHDRAWN` | 탈퇴 | 로그인 불가 (계정 삭제) |

---

## 3. 회원 등급별 콘텐츠 공개

전시 콘텐츠(`window.visibilityUtil`)에서 공개 대상을 인코딩하여 제어:

```
저장 포맷: '^PUBLIC^MEMBER^VIP^'  (양끝 ^ 래핑)
공개 안 함: ''
```

| 공개 대상 코드 | 설명 |
|---|---|
| `PUBLIC` | 비회원 포함 전체 공개 |
| `MEMBER` | 로그인 회원 이상 |
| `VERIFIED` | 이메일 인증 완료 회원 |
| `PREMIUM` | 프리미엄 등급 이상 |
| `VIP` | VIP 등급 이상 |
| `INVITED` | 초대받은 회원 |
| `STAFF` | 스태프 계정 |
| `EXECUTIVE` | 임원급 계정 |

---

## 4. 페이지 접근 제어

### 4.1 로그인 필요 페이지

미로그인 상태에서 접근 시 `error401` 페이지로 리다이렉트.

```js
// base/frontApp.js
const AUTH_REQUIRED_PAGES = [
  'myOrder', 'myClaim', 'myCoupon', 'myCache',
  'myContact', 'myChatt',
  'order',
  'blogEdit',
];
```

### 4.2 페이지별 등급 제한 (선택적 적용)

| 페이지 | 최소 요건 |
|---|---|
| 일반 상품 목록/상세 | PUBLIC (비회원 가능) |
| 회원 전용 상품 | MEMBER 이상 로그인 필요 |
| VIP 전용 이벤트 | VIP 등급 필요 |
| 주문/결제 | ACTIVE 상태 로그인 회원 |
| 마이페이지 | ACTIVE 상태 로그인 회원 |
| 블로그 작성 | ACTIVE 상태 로그인 회원 |

---

## 5. 기능별 접근 제어

| 기능 | 비회원 | MEMBER | 제한 등급 |
|---|---|---|---|
| 상품 목록/상세 조회 | ✅ | ✅ | 일부 VIP 전용 |
| 상품 찜 (♡) | ❌ → 로그인 유도 | ✅ | — |
| 장바구니 담기 | ❌ → 로그인 유도 | ✅ | — |
| 주문/결제 | ❌ → error401 | ✅ | — |
| 리뷰 작성 | ❌ → 로그인 유도 | ✅ (구매자만) | — |
| Q&A 작성 | ❌ → 로그인 유도 | ✅ | — |
| 쿠폰 사용 | ❌ | ✅ | 등급별 쿠폰 |
| 이벤트 참여 | ❌ → 로그인 유도 | ✅ | 등급별 이벤트 |
| 블로그 글 조회 | ✅ | ✅ | — |
| 블로그 글 작성 | ❌ → error401 | ✅ | — |
| 1:1 문의 | ❌ | ✅ | — |
| 채팅 상담 | ❌ | ✅ | — |

---

## 6. 권한 검사 패턴 (컴포넌트)

```js
// setup() 내
const auth = window.frontAuth.state;

// 로그인 여부 체크
const isLoggedIn = Vue.computed(() => !!auth.user);

// 등급 체크
const isVip = Vue.computed(() => auth.user?.gradeCode === 'VIP');

// 찜 버튼 클릭 시
const toggleLike = () => {
  if (!isLoggedIn.value) {
    // 로그인 모달 표시 또는 login 페이지 이동
    props.navigate('login');
    return;
  }
  // 찜 처리 로직
};
```

---

## 7. 콘텐츠 공개 판단 (visibilityUtil)

전시 위젯, 배너, 이벤트 등의 공개 대상 필터링:

```js
// utils/adminUtil.js
window.visibilityUtil.isVisible(targetStr, userGrade);
// targetStr: '^PUBLIC^MEMBER^VIP^' 형식
// userGrade: 'PUBLIC' | 'MEMBER' | 'PREMIUM' | 'VIP' | ...
// return: true (표시) / false (숨김)
```

비회원의 `userGrade` = `'PUBLIC'`  
로그인 회원의 `userGrade` = `frontAuth.state.user.gradeCode` 또는 `'MEMBER'`

---

## 8. 에러 페이지

| pageId | 조건 |
|---|---|
| `error401` | 미로그인 접근 |
| `error403` | 등급/상태 미충족 접근 |
| `error404` | 존재하지 않는 페이지 |
| `error500` | 서버 오류 |

---

## 관련 정책
- `base.인증-front.md` — 로그인/로그아웃/토큰 관리
- `base.UX-front.md` — 접근 제어 UX (error401 리다이렉트, 로그인 유도 모달)
- `ec.mb.*` — 회원 상태·등급 정의
- `ec.dp.*` — 전시 공개 대상(visibilityUtil) 상세
