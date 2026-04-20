---
정책명: 백엔드 API 기술 정책 (EcAdminApi)
정책번호: base-기술-api
관리자: 개발팀
최종수정: 2026-04-20
---

# 백엔드 API 기술 정책 (EcAdminApi)

## 1. 기술 스택

| 기술 | 버전 | 비고 |
|---|---|---|
| Java | 17 | LTS |
| Spring Boot | 3.x | |
| MyBatis | 3.x | XML Mapper 방식 |
| PostgreSQL | - | Schema: `shopjoy_2604` |
| p6spy | - | SQL 로깅 |

---

## 2. 프로젝트 루트 패키지

```
com.shopjoy.ecadminapi
├── base/       기계적으로 생성된 모듈 모음 (auto-generated)
├── share/      bo / fo 양쪽에서 공통 사용하는 모듈 모음
├── bo/         Back Office (관리자 Admin) 전용 모듈 모음
├── fo/         Front Office (사용자 Front) 전용 모듈 모음
├── auth/       인증 관련
├── autorest/   자동 REST 생성
└── common/     공통 설정 (config 등)
```

---

## 3. 패키지별 역할 및 원칙

### 3.1 `base/` — 자동 생성 기반 모듈

- **정의**: DDL → 자동 생성 도구(AutoRest 등)가 기계적으로 만들어 낸 CRUD 모듈
- **특징**: 1 테이블 : 1 세트(Controller/Service/Mapper/Entity) 1:1 매핑
- **수정 금지**: 수동 비즈니스 로직 추가 금지 — 재생성 시 덮어씀
- **하위 구조**:

```
base/
├── domain/
│   ├── ec/          EC 도메인 (cm/dp/mb/od/pd/pm/st)
│   │   ├── cm/      공통·커뮤니티 (채팅, 공지, 게시판 등)
│   │   ├── dp/      전시 (Display)
│   │   ├── mb/      회원 (Member)
│   │   ├── od/      주문·클레임·배송 (Order)
│   │   ├── pd/      상품 (Product)
│   │   ├── pm/      프로모션 (Promotion: 쿠폰/캐시/적립금/이벤트)
│   │   └── st/      정산 (Settle)
│   └── sy/          SY 도메인 (시스템: 사이트/코드/사용자/권한/메뉴 등)
└── (controller/service/mapper은 각 도메인 서브패키지 내 위치)
```

### 3.2 `share/` — bo/fo 공통 모듈

- **정의**: Back Office와 Front Office 양쪽에서 호출하는 공통 비즈니스 로직
- **예시**: 공통 조회 서비스, 코드 캐시, 파일 업로드, 알림 발송 등
- **원칙**: bo/fo 어느 한 쪽에만 쓰인다면 해당 패키지로 이동

```
share/
├── controller/
├── service/
└── mapper/
```

### 3.3 `bo/` — Back Office (관리자) 전용 모듈

- **정의**: `admin.html` 관리자 화면에서만 호출하는 API 및 비즈니스 로직
- **예시**: 관리자 대시보드, 일괄 처리, 정산 마감, 배치 트리거 등
- **원칙**: Front에서 절대 호출하지 않는 기능만 여기에 위치

```
bo/
├── controller/
├── service/
└── mapper/
```

### 3.4 `fo/` — Front Office (사용자) 전용 모듈

- **정의**: `index.html` 사용자 화면에서만 호출하는 API 및 비즈니스 로직
- **예시**: 상품 목록/상세, 장바구니, 주문, 마이페이지 등 사용자 흐름
- **원칙**: 관리자에서 절대 호출하지 않는 기능만 여기에 위치

```
fo/
├── controller/
├── service/
└── mapper/
```

---

## 4. 신규 모듈 배치 기준

```
신규 기능 추가 시 판단 흐름:

1. DDL에서 자동 생성 가능한 CRUD인가?
   → YES: base/ 에 생성 (수동 수정 금지)
   → NO: 다음 단계

2. Admin(bo)과 Front(fo) 양쪽에서 사용하는가?
   → YES: share/
   → NO: 다음 단계

3. Admin(관리자)에서만 사용하는가?
   → YES: bo/

4. Front(사용자)에서만 사용하는가?
   → YES: fo/
```

---

## 5. Mapper XML 경로

Java 패키지 구조와 대응:

```
src/main/resources/mapper/
├── base/
│   ├── autorest/    자동 생성 Mapper XML
│   ├── ec/          EC 도메인 (cm/dp/mb/od/pd/pm/st)
│   └── sy/          SY 도메인
├── share/
├── bo/
└── fo/
```

MyBatis 설정: `classpath:mapper/**/*.xml` 와일드카드로 전체 스캔

---

## 6. MyBatis 설정

```
src/main/java/com/shopjoy/ecadminapi/common/config/
├── MyBatisConfig.java          DataSource, SqlSessionFactory 설정
├── MyBatisQueryInterceptor.java  쿼리 인터셉터
├── P6SpyFormatter.java         SQL 로그 포맷
├── SecurityConfig.java         Spring Security
└── WebConfig.java              CORS, MVC 설정
```

---

## 관련 정책
- `base.인증-admin.md` — 관리자 인증/토큰 정책
- `base.인증-front.md` — 사용자 인증/토큰 정책
- `sy.51.프로그램설계정책.md` — 화면 설계 기준
- `sy.52.ddl단어사전규칙.md` — DDL 컬럼명 표준
