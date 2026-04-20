# 정책서-base/ 기반 공통 정책 문서

## 파일 목록
- `base.UX-admin.md` — 관리자 페이스 UX/UI 가이드라인
- `base.UX-front.md` — 사용자 페이스 UX/UI 가이드라인
- `base.권한-admin.md` — 관리자 권한 체계 (RBAC, 역할별 접근 정책)
- `base.권한-front.md` — 사용자 권한 체계 (공개/회원/VIP 노출 정책)
- `base.기술-admin.md` — 관리자 페이스 기술 스택 및 아키텍처 기준 (Vue 프론트엔드)
- `base.기술-front.md` — 사용자 페이스 기술 스택 및 아키텍처 기준 (Vue 프론트엔드)
- `base.기술-api.md` — 백엔드 API 기술 스택 및 패키지 구조 기준 (Spring Boot EcAdminApi)
- `base.인증-admin.md` — 관리자 로그인/세션/토큰 인증 정책
- `base.인증-front.md` — 사용자 로그인/세션/토큰 인증 정책

## 목적
전 도메인에 걸쳐 공통으로 적용되는 기반 정책을 정의.
각 도메인 정책서(ec-*/sy-*)는 여기서 정의한 공통 기준을 따름.

## 관련 구현
- `base/config.js` — SITE_CONFIG, FRONT_SITE_NO 전역 설정
- `base/frontAuth.js` — 사용자 인증 init/logout/state
- `utils/adminAxios.js` / `utils/frontAxios.js` — API 래퍼
- `utils/adminUtil.js` — 공통 필터, 유틸, visibilityUtil
