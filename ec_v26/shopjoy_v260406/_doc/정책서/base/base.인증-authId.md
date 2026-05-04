# 인증 식별자(authId) 설계 정책

## 목적

이 시스템은 관리자(`sy_user`)와 고객(`ec_member`) 두 사용자 테이블을 단일 인증 체계로 통합 관리한다.
`authId`는 어느 테이블에서 인증된 사용자인지와 무관하게 일관되게 사용할 수 있는 **통합 인증 식별자**이다.

---

## authId 규칙

| appTypeCd | authId 값 | DB 컬럼 | 비고 |
|---|---|---|---|
| `BO` | `sy_user.user_id` | sy_user.user_id | 관리자 (Back Office) |
| `FO` | `ec_member.member_id` | ec_member.member_id | 고객 (Front Office) |
| `SO` | `sy_user.user_id` | sy_user.user_id | 판매자 (Super Owner) |

- `authId`는 JWT의 `subject` 클레임에 저장된다.
- BO/FO 구분 없이 `authId`만으로 현재 로그인 사용자를 식별할 수 있다.

---

## 필드 구조

### Backend: `AuthPrincipal` (SecurityContext에 저장)

```java
String authId;      // ★ 통합 인증 식별자 (JWT subject)
String appTypeCd;  // ★ "BO" | "FO" | "SO"
String userId;      // BO 전용: sy_user.user_id  (authId와 동일값)
String memberId;    // FO 전용: ec_member.member_id (authId와 동일값)
```

### Backend: `AccessTokenClaims` (JWT 생성 시)

```java
String authId;      // JWT subject
String userId;      // BO 전용: sy_user.user_id
String memberId;    // FO 전용: ec_member.member_id
String appTypeCd;
```

### Backend: `LoginRes` (로그인 API 응답)

```java
String authId;      // 통합 식별자
String userId;      // BO 전용 (FO는 null)
String memberId;    // FO 전용 (BO는 null)
String userNm;      // 사용자명
String appTypeCd;
```

### Frontend: `boAuthStore` user 객체

```js
{
  authId: '',       // 통합 인증 식별자 (sy_user.user_id)
  userId: '',       // BO 전용: sy_user.user_id (authId와 동일)
  memberId: null,   // FO 전용: BO는 null
  appTypeCd: 'BO',
  name: '', email: '', role: '', phone: '', dept: '', siteId: '', roleId: ''
}
```

### Frontend: `foAuthStore` user 객체

```js
{
  authId: '',       // 통합 인증 식별자 (ec_member.member_id)
  memberId: '',     // FO 전용: ec_member.member_id (authId와 동일)
  userId: null,     // BO 전용: FO는 null
  appTypeCd: 'FO',
  loginId: '', memberNm: '', siteId: ''
}
```

---

## 로그인 판별 로직

```js
// BO 로그인 판별
window.isBoLogin = () => !!(store.user.userId && store.accessToken)

// FO 로그인 판별
window.isFoLogin = () => !!(store.user.memberId && store.accessToken)
```

---

## JWT 클레임 구조

```
subject  : authId           (BO=user_id, FO=member_id)
userId   : sy_user.user_id  (BO 전용 claim)
memberId : member_id        (FO 전용 claim)
appTypeCd: "BO" | "FO"
loginId  : 계정 문자열
roles    : ["BO_GUEST"] | ["FO_GUEST"]
siteId, roleId, vendorId, memberGrade 등
```

---

## SecurityUtil 사용 패턴

```java
// 공통: authId 가져오기
String authId = SecurityUtil.getAuthId();

// BO 서비스에서
SyUser user = em.find(SyUser.class, SecurityUtil.getAuthId());

// FO 서비스에서
MbMember member = memberRepository.findById(SecurityUtil.getAuthId());

// 타입 체크
if (SecurityUtil.isBo()) { /* 관리자 로직 */ }
if (SecurityUtil.isFo()) { /* 회원 로직 */ }
```

---

## 관련 파일

### Backend
- `auth/security/AuthPrincipal.java`
- `auth/data/dto/AccessTokenClaims.java`
- `auth/data/vo/LoginRes.java`
- `auth/security/JwtProvider.java`
- `auth/security/JwtAuthFilter.java`
- `auth/service/BoAuthService.java`
- `auth/service/FoAuthService.java`

### Frontend
- `base/stores/bo/boAuthStore.js`
- `base/stores/fo/foAuthStore.js`
- `base/foAuth.js`
- `base/stores/bo/boAppInitStore.js`
- `base/stores/fo/foAppInitStore.js`

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-04-24 | authId 도입 — 기존 `userId`(통합) 역할을 `authId`로 명확히 rename, BO/FO 전용 필드 명시 |
