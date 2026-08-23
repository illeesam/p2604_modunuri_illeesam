# 정책서/md/sg/ — 모듈 > 소스젠(Source Generator) 도메인 정책

DDL 을 입력하면 백엔드·프론트·풀스택 20여 종 스택의 소스를 한 번에 생성하고,
결과 ZIP 을 첨부(sy_attach)로 DB 에 보관하는 독립 FO 모듈(`mdSgSourcegen.html`).

## 파일 목록

| 파일 | 내용 |
|---|---|
| `sg.01.소스젠.md` | 목적/범위, 화면 흐름(로그인·목록·상세), 데이터 모델, 생성결과 DB 첨부 보관 흐름, 생성 엔진 이식 내역(PK 파싱 보강), ZIP 구조, 코드그룹, 제약사항 |

## 관련 테이블
`md_sg_project`, `md_sg_sourcegen`, `md_sg_sourcegen_hist` (+ 첨부 실체는 공통 `sy_attach`)

## 관련 화면
| 위치 | pageId / URL | 라벨 |
|---|---|---|
| FO | `mdSgSourcegen.html?view=list` | 소스젠 프로젝트 목록 |
| FO | `mdSgSourcegen.html?view=editor` | 소스젠 상세/편집 |
| FO | `mdSgSourcegen.html?mine=1` | 내 소스젠 |

## 생성 엔진
`assets/md/sg/sourcegen/*.js` (21개) — 별도 프로젝트 `C:\_pjt_github\p2605_sourcegen` 이식본.
전역 함수 `gnParseDdl(ddl, dbType)` / `gnGenerate(meta, opts)` 로 동작하며 **전부 브라우저에서 실행**된다.

> ⚠️ `sourcegen.js` 의 `gnParseDdl` 은 이식하면서 **PK 파싱을 보강**했다(원본은 테이블 레벨
> `CONSTRAINT ... PRIMARY KEY (...)` 만 인식 → ShopJoy 의 컬럼 레벨 인라인 PK DDL 에서 크래시).
> 원본을 다시 가져올 때 이 수정이 덮이지 않도록 주의. 상세 → `sg.01.소스젠.md` §5-1
