# sg.01. 소스젠(Source Generator) 정책

> 2026-08-24 신규. DDL 을 입력하면 백엔드·프론트엔드·풀스택 20여 종 스택의 소스를 한 번에
> 생성하고, 결과 ZIP 을 **첨부(sy_attach) 형태로 DB 에 보관**하는 독립 FO 모듈.

---

## 1. 목적 / 범위

| 항목 | 내용 |
|---|---|
| 진입점 | `fo-md-sg-sourcegen.html` (독립 FO 모듈 — index.html 라우팅 밖) |
| 화면 흐름 | **로그인 → 목록 → 상세** (`fo-md-cb-cobanul.html` 과 동일한 3단 구성) |
| 생성 엔진 | `assets/md/sg/sourcegen/*.js` — 별도 프로젝트 `p2605_sourcegen` 의 순수 클라이언트 JS 이식 |
| 실행 위치 | **전부 브라우저** — 서버는 DDL 텍스트 보관 + 결과 ZIP 첨부만 담당 |
| 테이블 | `md_sg_project` / `md_sg_sourcegen` / `md_sg_sourcegen_hist` |

---

## 2. 화면 흐름 (fo-md-cb-cobanul.html 과 동일 패턴)

```
fo-md-sg-sourcegen.html              → 목록 (MdSgProjectListPage)
fo-md-sg-sourcegen.html?view=list    → 목록
fo-md-sg-sourcegen.html?view=editor  → 신규 작성 (MdSgSourcegenPage)
fo-md-sg-sourcegen.html?view=editor&projectId=xxx → 상세/편집
fo-md-sg-sourcegen.html?mine=1       → 목록(내 프로젝트만 — 검색어에 내 회원명 자동 주입)
```

- 헤더/사이드바/푸터/로그인 모달은 `lib/app/foModuleShell.js` 공용 셸이 제공
- 목록 진입은 **항상 보기모드(view)** 로 시작하고 `[수정]` 을 눌러야 편집모드(edit) 로 전환
- `window.confirm()` 금지 — 셸의 디자인 컨펌(`showConfirm`) 사용

---

## 3. 데이터 모델

### 3-1. `md_sg_project` — 프로젝트 마스터
DDL 여러 개를 묶는 단위. `base_package` 와 `db_type_cd` 는 **전체 DDL 탭이 공유**한다.

| 컬럼 | 설명 |
|---|---|
| `base_package` | 생성 소스의 Java 패키지 루트 (예: `com.exam.app`) |
| `db_type_cd` | `SG_DB_TYPE_CD` — `POSTGRESQL` / `ORACLE` |
| `ddl_count` | 등록된 DDL 탭 수 (저장 시 서버가 실제 건수로 동기화) |
| `last_gen_date` / `last_file_count` | 마지막 생성 시각·파일 수 (보관 시 서버가 갱신) |
| `project_status_cd` | `SG_PROJECT_STATUS_CD` — `DRAFT`(작성중) / `DONE`(생성완료) |

### 3-2. `md_sg_sourcegen` — DDL 탭 (최대 10개)
프로젝트당 **전체 교체(replaceAll)** 로만 저장한다. 화면에서 탭 10개를 편집한 뒤
`[저장]` 시 입력된 탭만 통째로 다시 쓴다(부분 갱신 없음).

`schema_nm` / `table_nm` / `class_nm` / `endpoint` / `swagger_tag` 는 DDL 입력 시
프론트가 자동 추출해 채우며, 사용자가 덮어쓸 수 있다(`table_nm` 만 읽기 전용).

### 3-3. `md_sg_sourcegen_hist` — 생성 이력 (첨부 보관)
"소스 생성되면 DB 에 첨부 형식으로 저장" 요건을 담당하는 테이블.

| 컬럼 | 설명 |
|---|---|
| `attach_id` | `sy_attach.attach_id` — 실제 ZIP 파일 실체는 공통 첨부 테이블이 관리 |
| `zip_file_nm` / `zip_file_size` / `zip_url` | 목록 표시·다운로드용 사본 |
| `ddl_count` / `file_count` | 이번 생성의 규모 |
| `gen_memo` | 사용자 메모 (예: "v1 초안", "리뷰 반영본") |

---

## 4. 생성결과 → DB 첨부 보관 흐름 ⭐

파일 실체를 `md_sg_*` 에 직접 넣지 않고 **기존 공통 첨부 인프라를 그대로 재사용**한다.

```
[브라우저]
 1. gnGenerate(meta, opts)         → files{ 경로 → 소스문자열 }  (탭별)
 2. JSZip 으로 전 탭 묶기            → Blob (fnZipPath 로 스택별 폴더 분리)
 3. POST /co/cm/upload/multi        → sy_attach 적재 → { attachId, cdnImgUrl }
        (businessCode = 'md_sg_gen')
 4. POST /md/sg/project/{id}/gen-hists → md_sg_sourcegen_hist 에 attachId 기록
[서버]
 5. markGenerated() → md_sg_project.last_gen_date / last_file_count / status='DONE'
```

**왜 이 구조인가**: 파일 저장·CDN·삭제·용량 정책이 이미 `sy_attach` 에 구현돼 있다.
`md_sg_sourcegen_hist` 는 "어떤 프로젝트의 몇 번째 생성물이 어느 첨부인가"만 이어주면 된다.

---

## 5. 생성 엔진 (`assets/md/sg/sourcegen/`)

`p2605_sourcegen` 프로젝트의 21개 JS 를 **그대로 이식**했다(브라우저 전역 스코프 공유 방식).

스택별 파일은 `backend/` / `frontend/` / `fullstack/` 폴더 + `{스택}_v1.js` 명명 규칙으로 정리했다
(2026-08-26 — 향후 스택별 버전 분기가 필요해지면 `{스택}_v2.js` 를 같은 폴더에 나란히 추가하는 방식 전제).

| 파일 | 역할 |
|---|---|
| `sourcegen.js` | 진입점 — `gnParseDdl(ddl, dbType)` / `gnGenerate(meta, opts)` |
| `backend/{jpa,mybatis,python,csharp_efcore,csharp_dapper,nestjs10,expressjs4}_v1.js` | JPA / MyBatis / Python / C# EFCore / C# Dapper / NestJS / Express |
| `frontend/{vue3,vue3_cdn,react,react_cdn,svelte,svelte_cdn,pyscript_cdn,flutter,react_native,android_compose,ios_swiftui}_v1.js` | Vue3 / React / Svelte(+CDN판) / PyScript / Flutter / RN / Android / iOS |
| `fullstack/{nuxt4,nextjs15}_v1.js` | Nuxt 4 / Next.js 15 (풀스택 + Prisma) |

DDL 1개당 **약 133개 파일**이 생성된다(복합키면 `*Id.java` 가 추가돼 134개).

### 5-1. ⚠️ 이식하면서 고친 것 — PK 파싱 (2026-08-24)

원본 파서는 **테이블 레벨 + 제약명** 형태만 인식했다.

```sql
CONSTRAINT pk_nm PRIMARY KEY (a, b)     -- 원본이 인식하던 유일한 형태
```

그런데 **ShopJoy 자체 DDL(`_doc/ddl_pgsql/**`)은 전부 컬럼 레벨 인라인** 스타일이다.

```sql
project_id VARCHAR(21) NOT NULL CONSTRAINT md_sg_project_pk_project_id PRIMARY KEY,
```

이 경우 원본은 `pkCols = []` 가 되어 `gnEntitySource()` 에서
`TypeError: Cannot read properties of undefined (reading 'name')` 로 **크래시**했다.
즉 이 프로젝트 DDL 을 붙여넣으면 100% 실패하는 상태였다.

`gnParseDdl` 을 아래 3가지를 모두 인식하도록 보강했다.

| 형태 | 예 |
|---|---|
| (1) 테이블 레벨 + 제약명 | `CONSTRAINT pk_nm PRIMARY KEY (a, b)` |
| (2) 테이블 레벨 제약명 없음 | `PRIMARY KEY (a)` |
| (3) **컬럼 레벨 인라인** | `col VARCHAR(21) NOT NULL ... PRIMARY KEY` |

추가로 PK 를 끝내 못 찾으면 TypeError 대신 **읽을 수 있는 에러**를 던진다
(`PRIMARY KEY 를 찾을 수 없습니다 — DDL 에 PK 정의가 있는지 확인해주세요`).

> `isPk` 는 `pkCols` 가 최종 확정된 **뒤에** 일괄 재계산한다.
> 인라인 PK 는 컬럼을 훑는 도중 발견되므로, 훑는 중에 `isPk` 를 확정하면
> 테이블 레벨 PK 행이 컬럼보다 뒤에 오는 DDL 에서 누락된다.

### 5-2. 예제 DDL 샘플 (`SG_SAMPLES`)

DDL 입력창 아래 `[샘플]` 버튼으로 예제를 바로 넣어볼 수 있다. 4종을 둔 이유는
**PK 표기 두 계열이 모두 되는지 화면에서 즉시 확인**하기 위해서다.

| 버튼 | 내용 | 검증 대상 |
|---|---|---|
| 샘플 zz_exam1 | 단일 PK | 원본 스타일(테이블 레벨) |
| 샘플 zz_exam2 | 복합 PK 2개 | 복합키 → `*Id.java` 추가 생성(134개) |
| 샘플 zz_exam3 | 복합 PK 3개 | 3중 복합키 |
| 샘플 ShopJoy 스타일 | 인라인 PK + 감사컬럼 | **이 프로젝트 자체 DDL 스타일** (§5-1 보강 대상) |

샘플을 누르면 현재 탭의 DDL 을 채우고 `fnExtractOpts` 로 Schema/Table/Class/Endpoint 까지
자동 추출한다. 기존 DDL 이 있으면 덮어쓰기 전에 컨펌을 띄운다.

### 5-3. 코드 뷰어 — Prism 문법 하이라이트

생성 결과 뷰어는 Prism 1.29.0 (tomorrow 다크 테마 + line-numbers 플러그인)을 쓴다.
로컬 복사본: `assets/cdn/pkg/prism/1.29.0/`

- 로드 순서 주의: **core → clike/javascript → 나머지 컴포넌트 → line-numbers 플러그인**.
  `clike` 는 java·csharp·jsx 의 의존이라 먼저 와야 한다.
- Vue 가 코드를 텍스트로 렌더하므로 자동 하이라이트가 걸리지 않는다.
  파일/탭 전환·생성 완료 시점에 `fnHighlight()` 가 `nextTick` 후
  `Prism.highlightElement()` 를 직접 호출한다.
- `<pre>` 에 `:key="resultTabIdx|activeFile"` 를 줘서 파일이 바뀌면 엘리먼트를 새로 만든다
  (Prism 이 넣은 `<span>` 들과 Vue 의 패치가 충돌하지 않게 하는 원본과 동일한 방식).
- Prism 로드 실패 시에도 `fnHighlight()` 는 조용히 넘어가고, CSS 폴백 규칙이
  평문 코드로 읽히게 유지한다.

### 5-4. 이식하지 않은 것

`sourcegen_ui_indexgen.js` / `sourcegen_ui_preview.js` 는 **제외**했다.
두 파일은 원본 서버 루트의 `common.css` / `common.js` 를 `fetch` 하는 전제인데
이 프로젝트에는 그 파일이 없어 항상 실패한다. 생성물 미리보기(👁) 기능이
필요해지면 두 파일과 `common.*` 을 함께 가져와야 한다.

---

## 6. ZIP 내부 구조

스택별로 폴더를 한 단계 더 감싸 JPA/MyBatis 등이 서로 덮어쓰지 않게 한다
(`fnZipPath()` — 원본 `bdZipPath` 이식).

```
sourcegen_be_jpa/src_jpa/main/java/{패키지경로}/domain/Xxx.java
sourcegen_be_mybatis/src_mybatis/main/java/{패키지경로}/...
sourcegen_be_mybatis/src_mybatis/main/resources/mapper/XxxMapper.xml
sourcegen_fe_vue3/frontend-vue3/src/views/XxxView.vue
sourcegen_full_nextjs15/fullstack-nextjs/...
ddl/{테이블명}.sql          ← DDL 은 루트 (전 스택 공용 메타)
_misc/...                   ← 분류 안 된 파일 (fallback)
```

> `SG_ZIP_PATHS` 배열은 **긴 prefix 를 먼저** 둬야 한다.
> `frontend_react_cdn_standalone/` 이 `frontend_react/` 보다 뒤에 있으면
> 앞 규칙에 먼저 걸려 CDN 판이 일반 React 폴더로 잘못 들어간다.

---

## 7. 코드그룹

| 그룹 | 값 |
|---|---|
| `SG_DB_TYPE_CD` | `POSTGRESQL`(PostgreSQL) / `ORACLE`(Oracle) |
| `SG_PROJECT_STATUS_CD` | `DRAFT`(작성중) / `DONE`(생성완료) |

---

## 8. 제약사항

- DDL 탭은 **최대 10개** (`SG_TAB_COUNT`) — 원본 소스젠과 동일
- `CREATE TABLE` 문 **1개만** 파싱한다. 한 탭에 여러 테이블을 넣으면 첫 번째만 인식
- 생성은 전부 브라우저에서 돈다 — 탭이 많으면 그만큼 느려진다(파일 수 = 탭수 × 약 133)
- 업로드는 공통 정책상 **한 번에 10개 파일**까지지만, 여기서는 ZIP 1개만 올리므로 무관
- 프로젝트 삭제 시 `md_sg_sourcegen` / `md_sg_sourcegen_hist` 도 함께 지운다.
  다만 **`sy_attach` 의 ZIP 실체는 남는다**(공통 첨부 정리 배치 `ATTACH_CLEANUP` 소관)

---

## 관련 문서

- [`cb.01.코바늘도안.md`](../cb/cb.01.코바늘도안.md) — 같은 독립 FO 모듈 패턴의 선례
- `_doc/ddl_pgsql/sg/*.sql` — 테이블 DDL 3종
