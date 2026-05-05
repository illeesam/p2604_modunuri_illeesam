# 정책서/base/ — 기반 공통 정책

전 도메인에 걸쳐 공통으로 적용되는 기반 정책. 각 도메인 정책서(ec/*/sy/)는 여기서 정의한 공통 기준을 따름.

## 파일 목록 (16개)

### 🎨 UX/UI 정책 (2개)
| 파일 | 내용 |
|------|------|
| `base.UX-admin.md` | 관리자 페이스 UX/UI 가이드라인 (컬러, 버튼, 모달, 알림) |
| `base.UX-front.md` | 사용자 페이스 UX/UI 가이드라인 (반응형, 접근성) |

### 🔐 권한 정책 (2개)
| 파일 | 내용 |
|------|------|
| `base.권한-admin.md` | 관리자 권한 체계 (RBAC, 역할별 접근 정책) |
| `base.권한-front.md` | 사용자 권한 체계 (공개/회원/VIP 노출 정책) |

### 🛠️ 기술 스택 (3개)
| 파일 | 내용 |
|------|------|
| `base.기술-admin.md` | 관리자 페이스 기술 스택 (Vue 3, Pinia, axios) |
| `base.기술-front.md` | 사용자 페이스 기술 스택 (Vue 3, CDN 로드, Pinia) |
| `base.기술-api.md` | 백엔드 API 기술 스택 (Spring Boot, MyBatis, PostgreSQL) — **§3.5 `/api/base/**` URL 직접 호출 금지** ⭐ |

### 🔑 인증 정책 (3개)
| 파일 | 내용 |
|------|------|
| `base.인증-admin.md` | 관리자 로그인/토큰 정책 (1세션, 2시간 Sliding) |
| `base.인증-front.md` | 사용자 로그인/토큰 정책 (멀티디바이스, 15일 Sliding) |
| `base.인증-authId.md` | 통합 인증 식별자 설계 (BO=user_id, FO=member_id) |

### 📋 백엔드 설계 (3개)
| 파일 | 내용 |
|------|------|
| `base.backend-EcAdminApi.md` | Spring Boot EcAdminApi 구조 및 패키지 기준 |
| `base.설정값암호화.md` | 설정값 암호화 정책 |
| `base.DDL작성규칙.md` | PostgreSQL DDL 파일 구조, ID 생성, 컬럼명 표준 |

### 📊 상태 관리 & 배포 (2개)
| 파일 | 내용 |
|------|------|
| `base.데이터흐름-상태관리.md` | Pinia 상태 관리, 데이터 흐름 설계 |
| `base.운영환경-배포설정.md` | 배포 환경 설정, CI/CD 가이드 |

### 💻 코드 스타일 (1개)
| 파일 | 내용 |
|------|------|
| `base.코드스타일-admin-vue.md` | Vue 3 Composition API 코드 스타일 가이드 |

### 🔧 특수 패턴 (1개)
| 파일 | 내용 |
|------|------|
| `base.55.codes_reactive_pattern.md` | codes reactive 패턴 설명 및 적용 가이드 |

## 관련 구현
- `base/config.js` — SITE_CONFIG, FRONT_SITE_NO 전역 설정
- `base/frontAuth.js` — 사용자 인증 init/logout/state
- `utils/adminAxios.js` / `utils/frontAxios.js` — API 래퍼
- `utils/adminUtil.js` — 공통 필터, 유틸, visibilityUtil
