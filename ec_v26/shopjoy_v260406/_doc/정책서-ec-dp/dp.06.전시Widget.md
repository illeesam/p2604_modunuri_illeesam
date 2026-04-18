# 615. 전시 Widget 정책

## 1. 목적

전시 Widget(dp_widget)은 화면에 실제 렌더링되는 콘텐츠 단위를 정의한다.
위젯은 `widget_type_cd`로 동작 방식을 결정하며, `widget_config_json`에 위젯별 설정값을 저장한다.
라이브러리를 참조하거나(`widget_lib_ref_yn = 'Y'`), 직접 콘텐츠를 입력(`N`)하는 두 가지 방식을 지원한다.
관리자는 `preview_img_url`로 위젯 선택 화면에서 썸네일을 확인할 수 있다.

---

## 2. 범위

| 역할 | 관계 |
|---|---|
| 관리자 | 위젯 등록·수정·삭제, 라이브러리 참조 또는 직접 콘텐츠 입력 |
| 배치 | `disp_env` 필터링, 전시 환경별 위젯 ON/OFF |
| 프런트 | `widget_type_cd`별 렌더러로 `widget_config_json` 파싱 → 화면 출력 |

---

## 3. 관련 테이블

| 테이블 | 역할 |
|---|---|
| `dp_widget` | 위젯 인스턴스 정의 |
| `dp_widget_lib` | 위젯 템플릿 라이브러리 (widget_lib_ref_yn=Y 시 참조) |
| `dp_panel_item` | 패널 내 위젯 배치 인스턴스 (dp_widget과 별개 레이어) |

---

## 4. 주요 컬럼 — dp_widget

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `widget_id` | VARCHAR(16) | PK. YYMMDDhhmmss+rand4 |
| `widget_lib_id` | VARCHAR(16) | FK: dp_widget_lib.widget_lib_id (NULL 허용) |
| `site_id` | VARCHAR(16) | 사이트 격리 |
| `widget_nm` | VARCHAR(100) | 위젯 명칭. site_id + widget_nm UNIQUE |
| `widget_type_cd` | VARCHAR(30) | 위젯 유형 코드 (WIDGET_TYPE) |
| `widget_desc` | VARCHAR(300) | 위젯 설명 |
| `widget_title` | VARCHAR(200) | 위젯 타이틀 표시 텍스트 |
| `widget_content` | TEXT | 위젯 내용 (html_editor 타입 직접 입력) |
| `title_show_yn` | CHAR(1) | 타이틀 화면 표시 여부 (Y/N) |
| `widget_lib_ref_yn` | CHAR(1) | 라이브러리 참조 여부 (Y/N) |
| `widget_config_json` | TEXT | 위젯 타입별 상세 설정 (JSON) |
| `preview_img_url` | VARCHAR(500) | 관리자 위젯 선택 썸네일 이미지 URL |
| `sort_ord` | INTEGER | 목록 정렬 순서 |
| `use_yn` | CHAR(1) | 관리자 사용여부 토글 (Y/N) |
| `disp_env` | VARCHAR(50) | 전시 환경 (`^PROD^`, `^DEV^`, `^TEST^` 조합) |

---

## 5. widget_type_cd 전체 목록 및 widget_config_json 구조

### 5-1. image_banner — 이미지 배너
클릭 시 특정 URL로 이동하는 이미지 배너. 슬라이드형 또는 단일 이미지.
```json
{
  "img_url": "/img/spring_sale.jpg",
  "link_url": "/event/spring-sale",
  "link_target": "_self",
  "alt": "2026 봄 세일 배너",
  "mobile_img_url": "/img/spring_sale_m.jpg"
}
```

### 5-2. product_slider — 상품 슬라이더
특정 카테고리 또는 상품 목록을 가로 슬라이드로 표시.
```json
{
  "title": "이번 주 신상품",
  "category_id": "CAT_001",
  "prod_ids": ["PROD_001", "PROD_002", "PROD_003"],
  "slide_count": 4,
  "auto_play": true,
  "auto_play_interval": 3000
}
```

### 5-3. product — 단일 상품 카드
지정 상품 1개를 카드 형태로 표시.
```json
{
  "prod_id": "PROD_001",
  "show_price": true,
  "show_discount_rate": true,
  "show_badge": "NEW"
}
```

### 5-4. cond_product — 조건부 자동 상품 노출
조건(신상품/베스트/할인율순 등)으로 자동 상품 목록 조회·표시.
```json
{
  "condition": "BEST_SELLER",
  "category_id": "CAT_002",
  "limit": 8,
  "sort": "sale_cnt_desc",
  "period_days": 30
}
```
`condition` 코드: `NEW_ARRIVAL`, `BEST_SELLER`, `HIGH_DISCOUNT`, `LOW_PRICE`, `RANDOM`

### 5-5. chart_bar — 막대 차트
통계 데이터를 막대 그래프로 시각화 (관리자 대시보드 주로 사용).
```json
{
  "title": "월별 매출",
  "data_api": "/api/admin/stats/monthly-sales",
  "x_field": "month",
  "y_field": "amount",
  "color": "#ec4899"
}
```

### 5-6. chart_line — 라인 차트
추이 데이터를 선 그래프로 시각화.
```json
{
  "title": "일별 주문수",
  "data_api": "/api/admin/stats/daily-orders",
  "x_field": "date",
  "y_field": "count",
  "fill": false
}
```

### 5-7. chart_pie — 파이 차트
비율 데이터를 원형 그래프로 시각화.
```json
{
  "title": "결제수단 비율",
  "data_api": "/api/admin/stats/payment-method",
  "label_field": "method_nm",
  "value_field": "ratio"
}
```

### 5-8. text_banner — 텍스트 배너
이미지 없이 텍스트만으로 구성된 배너.
```json
{
  "text": "무료배송 이벤트 진행 중! 3만원 이상 구매 시",
  "sub_text": "2026.04.01 ~ 2026.04.30",
  "bg_color": "#fff0f4",
  "text_color": "#c0396a",
  "link_url": "/faq?q=delivery",
  "icon": "🚚"
}
```

### 5-9. info_card — 정보 카드
아이콘 + 제목 + 내용 형태의 정보 표시 카드.
```json
{
  "icon": "📦",
  "title": "당일 출고 안내",
  "content": "오후 2시 이전 결제 시 당일 발송",
  "link_url": "/faq?q=shipping"
}
```

### 5-10. popup — 레이어 팝업
페이지 진입 시 자동 노출되는 팝업 레이어.
```json
{
  "title": "봄 시즌 오픈 이벤트",
  "img_url": "/img/popup_spring.jpg",
  "link_url": "/event/spring",
  "close_label": "오늘 하루 안 보기",
  "cookie_key": "popup_spring_2604",
  "cookie_days": 1
}
```

### 5-11. file — 단일 파일 다운로드
파일 1개를 다운로드 링크로 표시.
```json
{
  "file_nm": "2026_봄_카탈로그.pdf",
  "file_url": "/uploads/catalog_spring_2026.pdf",
  "file_size": "2.4MB",
  "btn_label": "카탈로그 다운로드"
}
```

### 5-12. file_list — 파일 목록
여러 파일을 리스트 형태로 표시.
```json
{
  "title": "자료실",
  "files": [
    {"nm": "이용약관.pdf", "url": "/docs/terms.pdf"},
    {"nm": "개인정보처리방침.pdf", "url": "/docs/privacy.pdf"}
  ]
}
```

### 5-13. coupon — 쿠폰 발급 버튼
특정 쿠폰 발급 버튼을 노출. 로그인 필요.
```json
{
  "coupon_id": "COUPON_SPRING_2604",
  "btn_label": "봄 시즌 10% 쿠폰 받기",
  "desc": "3만원 이상 구매 시 사용 가능",
  "expire_days": 7
}
```

### 5-14. html_editor — 커스텀 HTML
관리자가 HTML을 직접 입력하는 자유 형식 위젯.
```json
{
  "html": "<div class='custom-notice'>...</div>",
  "css": ".custom-notice { padding: 16px; background: #fffbe6; }"
}
```
또는 `widget_content` 컬럼에 직접 HTML 저장.

### 5-15. event_banner — pm_event 연동 배너
`pm_event` 테이블과 연동하는 이벤트 배너.
```json
{
  "event_id": "EVT_2604_SPRING",
  "show_countdown": true,
  "img_url": "/img/event_spring.jpg"
}
```

### 5-16. cache_banner — 캐시 충전 배너
충전금(캐시) 프로모션 배너. `pm_cache` 연동.
```json
{
  "cache_promo_id": "CACHE_BONUS_2604",
  "title": "충전 시 최대 20% 보너스",
  "img_url": "/img/cache_bonus.jpg",
  "link_url": "/my/cache"
}
```

### 5-17. widget_embed — 위젯 임베드
다른 위젯을 현재 위치에 삽입(재사용/중첩).
```json
{
  "embed_widget_id": "WIDGET_COMMON_FOOTER_BANNER",
  "fallback": "표시할 내용 없음"
}
```

### 5-18. barcode — 바코드/QR
모바일 화면에 바코드 또는 QR 코드를 표시.
```json
{
  "type": "QR",
  "value": "https://shopjoy.kr/event/spring",
  "size": 200,
  "label": "이벤트 페이지로 이동"
}
```

### 5-19. countdown — 카운트다운 타이머
행사 종료/시작까지 남은 시간을 실시간 카운트다운으로 표시.
```json
{
  "target_datetime": "2026-04-30T23:59:59",
  "label": "봄 세일 종료까지",
  "finished_msg": "행사가 종료되었습니다.",
  "show_days": true,
  "show_hours": true
}
```

---

## 6. 활용 예시

### 예시 1. 이미지 배너 위젯 — 모바일/PC 이미지 분리
```
widget_nm    = '2026봄시즌_메인배너'
widget_type_cd = 'image_banner'
disp_env     = '^PROD^'
preview_img_url = '/img/thumb_spring_banner.jpg'
widget_config_json = {
  "img_url": "/img/spring_main_pc.jpg",
  "mobile_img_url": "/img/spring_main_m.jpg",
  "link_url": "/event/spring",
  "alt": "2026 봄 시즌 오픈"
}
```

### 예시 2. VIP 대상 쿠폰 위젯 등록
```
widget_nm    = 'VIP쿠폰_2604'
widget_type_cd = 'coupon'
widget_config_json = {
  "coupon_id": "COUPON_VIP_2604",
  "btn_label": "VIP 전용 15% 쿠폰",
  "desc": "5만원 이상 구매 시 적용, 7일 유효"
}
```
dp_panel_item에서 `visibility_targets = '^VIP^'` 설정으로 VIP에게만 노출.

### 예시 3. 개발 전용 HTML 테스트 위젯
```
widget_nm  = '[DEV]HTML테스트위젯'
widget_type_cd = 'html_editor'
disp_env   = '^DEV^TEST^'
widget_content = '<marquee>개발 환경 테스트 배너</marquee>'
```

### 예시 4. 자동 베스트셀러 상품 노출
```
widget_nm    = '베스트셀러_자동노출'
widget_type_cd = 'cond_product'
widget_config_json = {
  "condition": "BEST_SELLER",
  "limit": 6,
  "sort": "sale_cnt_desc",
  "period_days": 7
}
```
매주 자동으로 7일간 판매량 기준 상위 6개 상품을 노출.

---

## 7. 제약사항

1. `(site_id, widget_nm)` UNIQUE — 사이트별 위젯 명칭 중복 불가
2. `widget_lib_ref_yn = 'Y'`이면 `widget_lib_id` 필수 — 참조 대상 없는 라이브러리 참조 불가
3. `widget_type_cd`는 공통코드 `WIDGET_TYPE` 기준 19종 중 하나 — 임의 코드 입력 불가
4. `html_editor` 타입은 XSS 방지를 위해 서버 측 HTML Sanitize 처리 필수
5. `disp_env` 미설정 시 기본값 `^PROD^` — 운영 환경 기본 노출
6. `preview_img_url` 미설정 시 위젯 타입별 기본 썸네일 이미지 표시
7. `chart_*` 타입은 `data_api` 엔드포인트가 유효한 JSON 배열을 반환해야 함

---

## 8. 변경이력

- 2026-04-18: 초기 작성
