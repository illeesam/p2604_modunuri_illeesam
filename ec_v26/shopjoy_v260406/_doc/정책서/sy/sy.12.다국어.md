# sy.12. 다국어(i18n) 관리 정책

## 목적
시스템 내 모든 화면 텍스트(버튼·라벨·메시지·오류 등)를 언어 코드 기반으로 관리하여
다국어 서비스(한국어·영어·일본어·인도네시아어 등)를 지원한다.

## 범위
| 적용 대상 | 설명 |
|---|---|
| **FO** (Front Office) | 사용자 페이스 — 상품·주문·마이페이지 화면 텍스트 |
| **BO** (Back Office) | 관리자 페이스 — 운영 메뉴·폼·테이블 헤더 텍스트 |
| **COMMON** | FO·BO 공용 — 공통 버튼·오류 메시지 등 |

---

## 테이블 구조

```
sy_i18n (키 마스터)
└─ sy_i18n_msg (언어별 메시지)
     key: i18n_id + lang_cd
```

- `sy_i18n`: 다국어 키 정의 (key명·범위·카테고리)
- `sy_i18n_msg`: 언어 코드별 번역 메시지

---

## 키 명명 규칙

형식: `{카테고리}.{유형}.{이름}` (소문자 + 점(`.`) 구분)

| 유형 접두어 | 용도 | 예시 |
|---|---|---|
| `*.bt.*` | 버튼 텍스트 | `common.bt.save`, `common.bt.cancel` |
| `*.title.*` | 필드·섹션 제목 | `tsy_i18n.title.code`, `location.title.city` |
| `*.label.*` | 라벨 | `common.label.product`, `common.label.category` |
| `*.msg.*` | 결과 메시지 | `common.msg.save`, `common.msg.delete` |
| `*.check.*` | 입력 검증 메시지 | `common.check.title`, `common.check.select` |
| `*.confirm.*` | 확인 다이얼로그 | `common.confirm.remove`, `common.confirm.delete` |
| `error.*` | 오류 메시지 | `error.FORBIDDEN`, `error.valid.required` |
| `link.*` | 링크 텍스트 | `link.home`, `link.back`, `link.register` |
| `paging.link.*` | 페이지네이션 | `paging.link.first`, `paging.link.next` |

### 주요 카테고리

| 카테고리 | 범위 | 설명 |
|---|---|---|
| `common` | COMMON | 공통 버튼·라벨·메시지 |
| `error` | COMMON | 오류 메시지 (HTTP 상태코드·유효성) |
| `link` | BO | 링크 라벨 |
| `paging` | BO | 페이지네이션 텍스트 |
| `commerce.bo` | BO | 백오피스 소개·환영 메시지 |
| `commerce.fo` | FO | 프론트 페이지 텍스트 |
| `sys` | BO | 시스템 관련 메시지 |
| `{entity}.title` | BO | 엔티티별 필드명 (예: `location.title`, `tsy_i18n.title`) |

---

## 지원 언어

| lang_cd | 언어 | 비고 |
|---|---|---|
| `ko` | 한국어 | 기본 언어 |
| `en` | 영어 | 필수 |
| `ja` | 일본어 | 선택 |
| `in` | 인도네시아어 | 선택 |

- 언어 코드: `LANG_CODE` 공통코드로 관리
- 언어 추가 시 `sy_code`에 `LANG_CODE` 코드값 추가 후 `sy_i18n_msg`에 해당 언어 행 추가

---

## 범위(Scope) 조회 우선순위

1. **FO 화면**: `i18n_scope_cd = 'FO'` 우선 → 없으면 `'COMMON'` fallback
2. **BO 화면**: `i18n_scope_cd = 'BO'` 우선 → 없으면 `'COMMON'` fallback
3. 동일 키가 FO·BO에 각각 등록된 경우 각자 독립 관리

---

## 사이트별 오버라이드

- `site_id = NULL`: 전체 공용 기본 번역
- `site_id = 'SITE001'`: 특정 사이트 전용 번역 (기본값 덮어쓰기)
- 조회 시: `site_id = 현재 사이트` → `site_id IS NULL` 순으로 fallback

---

## 관리 정책

| 구분 | 정책 |
|---|---|
| 키 등록 | 개발팀 + 운영팀 협의 후 등록 |
| 번역 수정 | 관리자 화면(`syI18nMng`)에서 직접 수정 가능 |
| 키 삭제 | `use_yn = 'N'` 처리 (물리 삭제 금지) |
| 중복 키 | `UNIQUE(i18n_key, i18n_scope_cd)` 제약으로 방지 |
| 누락 언어 | 기본언어(ko) fallback 처리 — 번역 없으면 ko 출력 |

---

## 관련 테이블
- `sy_i18n` — 다국어 키 마스터
- `sy_i18n_msg` — 언어별 번역 메시지

## 관련 화면
| pageId | 라벨 |
|---|---|
| `syI18nMng` | 시스템 > 다국어관리 |

## 관련 코드
- `I18N_SCOPE`: FO / BO / COMMON
- `LANG_CODE`: ko / en / ja / in

## 변경이력
- 2026-04-18: 초기 작성 (ec2 sy_i18n_dtl·sy_i18n_fo_dtl 참고)
