# 616. 전시 Widget 라이브러리 정책

## 1. 목적

전시 Widget 라이브러리(dp_widget_lib)는 여러 패널에서 공통으로 재사용 가능한 위젯 템플릿을 등록·관리한다.
`widget_code`로 프런트에서 참조하며, `template_html`과 `config_schema`로 위젯 구조와 관리자 입력 폼을 정의한다.
`is_system = 'Y'`인 시스템 기본 위젯은 삭제·구조 수정이 제한되며, 플랫폼 전반의 표준 위젯으로 활용된다.
dp_panel_item에서 `widget_lib_ref_yn = 'Y'`로 라이브러리를 참조하면, 라이브러리 수정 시 연결된 모든 패널에 즉시 반영된다.

---

## 2. 범위

| 역할 | 관계 |
|---|---|
| 관리자 | 라이브러리 등록·수정·삭제 (is_system=Y는 삭제 제한) |
| 개발자 | `template_html`, `config_schema` 초기 정의 및 구조 설계 |
| 프런트 | `widget_code`로 라이브러리 조회 → `template_html` + 설정값으로 위젯 렌더링 |
| 배치 | `use_yn` 기반 라이브러리 활성 여부 필터링 |

---

## 3. 관련 테이블

| 테이블 | 역할 |
|---|---|
| `dp_widget_lib` | 위젯 템플릿 라이브러리 정의 |
| `dp_widget` | 라이브러리를 참조하는 위젯 인스턴스 (widget_lib_id FK) |
| `dp_panel_item` | 패널 내 위젯 배치 시 라이브러리 참조 (widget_lib_id FK) |

---

## 4. 주요 컬럼 — dp_widget_lib

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `widget_lib_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `site_id` | VARCHAR(16) | 사이트 격리 (NULL이면 공통 라이브러리) |
| `widget_code` | VARCHAR(50) | 위젯 코드. UNIQUE 전역 — 프런트 참조 키 |
| `widget_nm` | VARCHAR(100) | 위젯 명칭 |
| `widget_type_cd` | VARCHAR(30) | 위젯 유형 코드 (WIDGET_TYPE) |
| `widget_lib_desc` | TEXT | 위젯 설명 (관리자 화면 안내용) |
| `disp_path` | VARCHAR(500) | 사용 가능 경로 (콤마 구분 다중 경로) |
| `thumbnail_url` | VARCHAR(500) | 관리자 라이브러리 선택 화면 썸네일 |
| `template_html` | TEXT | 위젯 기본 HTML 뼈대 (변수는 `{{변수명}}` 치환) |
| `config_schema` | TEXT | 관리자 입력 폼 정의 JSON Schema |
| `is_system` | CHAR(1) | 시스템 기본 제공 위젯 여부 (Y: 삭제 제한) |
| `sort_ord` | INTEGER | 라이브러리 목록 정렬 순서 |
| `use_yn` | CHAR(1) | 사용여부 (Y/N) |

---

## 5. widget_code UNIQUE 규칙

`widget_code`는 전역 UNIQUE 제약으로, 사이트 구분 없이 중복 불가.
명명 규칙: `{DOMAIN}_{TYPE}_{DESCRIPTION}` 대문자 언더스코어 구분.

```
STD_BANNER_MAIN       시스템 표준 메인 배너
STD_PROD_SLIDER       시스템 표준 상품 슬라이더
STD_PROD_BEST         시스템 표준 베스트셀러
SITE01_BANNER_TOP     사이트01 전용 상단 배너
SITE01_COUPON_VIP     사이트01 VIP 쿠폰 위젯
COMMON_COUNTDOWN      공통 카운트다운 위젯
```

---

## 6. config_schema 구조

관리자가 위젯 설정 시 입력해야 할 필드를 JSON Schema로 정의.
프런트 관리자 UI에서 이 스키마를 파싱하여 동적 입력 폼을 렌더링한다.

```json
{
  "type": "object",
  "properties": {
    "img_url": {
      "type": "string",
      "title": "이미지 URL",
      "description": "배너 이미지 경로 (/img/... 또는 https://...)",
      "required": true
    },
    "link_url": {
      "type": "string",
      "title": "클릭 링크",
      "description": "배너 클릭 시 이동할 URL",
      "required": false
    },
    "alt": {
      "type": "string",
      "title": "이미지 대체 텍스트",
      "required": false
    },
    "link_target": {
      "type": "string",
      "title": "링크 열기 방식",
      "enum": ["_self", "_blank"],
      "default": "_self"
    }
  }
}
```

---

## 7. template_html 치환 변수 규칙

`template_html` 내 `{{변수명}}` 형태로 config_schema 필드값이 치환된다.

```html
<!-- 이미지 배너 템플릿 예시 -->
<a href="{{link_url}}" target="{{link_target}}" class="disp-banner-link">
  <img src="{{img_url}}" alt="{{alt}}" class="disp-banner-img w-full" />
</a>
```

프런트에서 `widget_config_json` 값으로 `{{변수명}}`을 치환하여 최종 HTML 생성.

---

## 8. is_system 정책

| is_system | 의미 | 제약 |
|---|---|---|
| `Y` | 플랫폼 기본 제공 위젯 | 관리자 UI에서 삭제 버튼 비활성화. `widget_code` · `template_html` · `config_schema` 수정은 개발자만 가능 |
| `N` | 운영자/관리자가 생성한 커스텀 위젯 | 일반 수정·삭제 가능. 단, dp_panel_item 참조 중인 경우 삭제 전 해제 필요 |

---

## 9. disp_path — 사용 가능 경로 제한

콤마(,)로 구분한 다중 경로 지정. 해당 경로 외 Area/Panel에서 라이브러리 선택 불가.

```
disp_path = 'FRONT.모바일메인,FRONT.PC메인'
→ 모바일 메인과 PC 메인 Area에서만 선택 가능

disp_path = NULL (또는 빈 값)
→ 모든 경로에서 선택 가능 (공통 라이브러리)
```

---

## 10. 라이브러리 참조 vs 직접 생성 비교

| 구분 | 라이브러리 참조 (widget_lib_ref_yn=Y) | 직접 생성 (N) |
|---|---|---|
| 재사용 | 여러 패널·사이트에서 동일 위젯 공유 | 해당 패널 전용 |
| 수정 반영 | 라이브러리 수정 시 참조 패널 전체 즉시 반영 | 개별 패널 수정 필요 |
| 일관성 | 디자인·로직 통일 보장 | 패널별 독립 커스터마이징 가능 |
| 관리 비용 | 중앙화 — 1회 수정으로 전체 반영 | 분산 — 여러 곳 개별 수정 필요 |
| 적합한 경우 | 공통 헤더 배너, 표준 상품 슬라이더, 전사 공지 | 행사 특화 1회성 콘텐츠, A/B 테스트 변형 |

---

## 11. 활용 예시

### 예시 1. 시스템 기본 위젯 등록 (is_system=Y)
```
widget_code    = 'STD_PROD_SLIDER'
widget_nm      = '표준 상품 슬라이더'
widget_type_cd = 'product_slider'
is_system      = 'Y'
sort_ord       = 1
disp_path      = NULL  ← 모든 경로 사용 가능

config_schema = {
  "properties": {
    "title":      {"type": "string",  "title": "슬라이더 제목"},
    "category_id": {"type": "string", "title": "카테고리 ID"},
    "slide_count": {"type": "number", "title": "노출 상품 수", "default": 4},
    "auto_play":  {"type": "boolean", "title": "자동 슬라이드", "default": true}
  }
}

template_html = '
<div class="prod-slider" data-category="{{category_id}}" data-count="{{slide_count}}">
  <h3 class="slider-title">{{title}}</h3>
  <div class="slider-track"><!-- JS에서 상품 카드 동적 삽입 --></div>
</div>'
```

### 예시 2. 브랜드 전용 VIP 쿠폰 위젯 라이브러리 등록
```
widget_code    = 'SITE01_COUPON_VIP'
widget_nm      = 'VIP 전용 쿠폰 다운로드'
widget_type_cd = 'coupon'
is_system      = 'N'
site_id        = 'SITE01'
disp_path      = 'FRONT.모바일메인,FRONT.PC메인,FRONT.마이페이지'

config_schema = {
  "properties": {
    "coupon_id":  {"type": "string", "title": "쿠폰 ID", "required": true},
    "btn_label":  {"type": "string", "title": "버튼 텍스트", "default": "VIP 쿠폰 받기"},
    "desc":       {"type": "string", "title": "쿠폰 설명"},
    "expire_days": {"type": "number", "title": "유효기간(일)", "default": 7}
  }
}
```
봄 기획전, 여름 행사, 연말 세일 등 여러 패널에서 `coupon_id`만 바꿔 동일 UI 재사용.

### 예시 3. 공통 카운트다운 위젯 — 다수 행사에 재사용
```
widget_code    = 'COMMON_COUNTDOWN'
widget_nm      = '공통 카운트다운 타이머'
widget_type_cd = 'countdown'
is_system      = 'Y'

config_schema = {
  "properties": {
    "target_datetime": {"type": "string", "title": "종료 일시 (ISO 8601)", "required": true},
    "label":           {"type": "string", "title": "라벨 텍스트", "default": "행사 종료까지"},
    "finished_msg":    {"type": "string", "title": "종료 후 메시지", "default": "행사가 종료되었습니다."},
    "show_days":       {"type": "boolean", "title": "일(D) 표시", "default": true}
  }
}

template_html = '
<div class="countdown-widget" data-target="{{target_datetime}}">
  <p class="countdown-label">{{label}}</p>
  <div class="countdown-timer"><!-- JS 동적 렌더 --></div>
  <p class="countdown-finished hidden">{{finished_msg}}</p>
</div>'
```
봄 세일, 여름 세일, 크리스마스 등 행사마다 `target_datetime`만 바꿔 재사용.

### 예시 4. 라이브러리 수정 → 전체 반영 시나리오
```
1. STD_PROD_SLIDER template_html에 "리뷰 별점" 표시 추가
2. 저장 즉시 해당 라이브러리를 참조하는
   모든 dp_panel_item(widget_lib_ref_yn='Y')에서 별점 자동 노출
3. 개별 패널 수정 불필요
```

### 예시 5. 특정 경로 제한 위젯 — 관리자 대시보드 전용
```
widget_code    = 'ADMIN_CHART_SALES'
widget_nm      = '관리자 매출 차트'
widget_type_cd = 'chart_bar'
disp_path      = 'ADMIN.대시보드'

config_schema = {
  "properties": {
    "period": {"type": "string", "title": "기간", "enum": ["7D", "30D", "90D"], "default": "30D"},
    "chart_title": {"type": "string", "title": "차트 제목"}
  }
}
```
`ADMIN.대시보드` 경로 외 Area에서는 관리자 UI 라이브러리 선택 목록에 노출되지 않음.

---

## 12. 제약사항

1. `widget_code` 전역 UNIQUE — 사이트 구분 없이 중복 불가
2. `is_system = 'Y'` 위젯은 관리자 UI에서 삭제 버튼 비활성화
3. 라이브러리 삭제 시 `dp_panel_item.widget_lib_id` 참조 중인 레코드 선 해제 필요 (FK 제약)
4. `config_schema`는 유효한 JSON 형식이어야 함 — 파싱 실패 시 관리자 입력 폼 렌더링 불가
5. `template_html` 내 `{{변수명}}`은 `config_schema.properties` 키와 반드시 일치
6. `widget_type_cd`는 공통코드 `WIDGET_TYPE` 기준 — 임의 코드 입력 금지
7. `site_id = NULL`은 전 사이트 공통 라이브러리로 처리 — 모든 사이트에서 참조 가능
8. `use_yn = 'N'`이면 dp_panel_item에서 라이브러리 신규 참조 불가 (기존 참조는 유지)

---

## 13. 변경이력

- 2026-04-18: 초기 작성
