# 611. 전시 관리 정책

## 목적
상품 노출 및 사용자 경험 최적화를 위한 전시 정책 정의

## 범위
- UI 구성 및 레이아웃
- 패널 및 위젯 관리
- 노출 대상 및 권한 관리
- 전시 콘텐츠 관리

## 전시 계층 구조

```
dp_ui  (화면 단위: MOBILE_MAIN / PC_MAIN / EVENT_PAGE)
  │  └─ dp_ui_area  [매핑: UI에서 어느 Area가, 언제, 누구에게 보이는지]
  │
dp_area  (구역: MAIN_BANNER / SIDEBAR_MID / POPUP)
  │  └─ dp_area_panel  [매핑: Area 안에 어느 Panel이, 어느 순서로, 언제 보이는지]
  │
dp_panel  (콘텐츠 묶음: ACTIVE/INACTIVE 상태 관리)
  │  └─ dp_panel_item  (위젯 인스턴스: 개별 노출 기간·대상 제어)
  │       └─ dp_widget_lib  (위젯 라이브러리: 재사용 템플릿)
  │
dp_widget  (위젯 정의: 타입별 content + config_json)
```

> 상세 정책: [612.전시Ui.md](612.전시Ui.md) / [613.전시Area.md](613.전시Area.md) / [614.전시Panel.md](614.전시Panel.md) / [615.전시Widget.md](615.전시Widget.md) / [616.전시WidgetLib.md](616.전시WidgetLib.md)

## 전시 상태 (DISP_STATUS)
| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | ACTIVE | 사용자에게 노출 |
| 비활성 | INACTIVE | 노출 안함 |

## 주요 정책

### 1. 영역(Area) 관리
- **기본영역**:
  - 메인배너: MAIN_BANNER
  - 상품추천: PRODUCT_RECOMMEND
  - 카테고리: CATEGORY_LIST
  - 이벤트: EVENT_PROMOTE
  - 하단: FOOTER_PROMO
- **영역코드**: 필수 (DISP_AREA)
- **정렬순서**: 영역별로 정렬

### 2. 패널(Panel) 구성
- **정의**: 영역 내 콘텐츠 단위
- **유형**:
  - 배너: 이미지 링크
  - 상품리스트: 추천상품
  - HTML: 커스텀 콘텐츠
- **상태**: ACTIVE/INACTIVE

### 3. 위젯(Widget) 관리
- **위젯타입**:
  - image_banner: 이미지 배너
  - product_slider: 상품 슬라이더
  - product: 단일상품
  - cond_product: 조건부 상품
  - chart: 차트 (막대/선/원)
  - text_banner: 텍스트 배너
  - info_card: 정보카드
  - popup: 팝업
  - file: 파일
  - file_list: 파일목록
  - coupon: 쿠폰
  - html_editor: HTML 에디터
  - event_banner: 이벤트 배너
  - cache_banner: 캐시 배너
  - widget_embed: 위젯 임베드
  - barcode: 바코드
  - countdown: 카운트다운
- **정렬순서**: 위젯별 정렬 지정

### 4. 노출 대상 (Visibility Targets)
- **공개대상**: ^코드^코드^ 형식 (하나라도 해당하면 노출)
  - PUBLIC: 전체공개
  - MEMBER: 회원만
  - VERIFIED: 이메일인증 회원
  - VIP: VIP 이상
  - PREMIUM: PREMIUM 이상
- **비노출대상**: 최소 1개 이상 지정

### 5. 클릭액션
- **타입**:
  - LINK: URL 이동
  - MODAL: 팝업 열기
  - NONE: 클릭 없음
- **타겟**: URL 또는 ID

### 6. 응답형 전시
- **디바이스별**: PC / 모바일 / 태블릿
- **해상도별**: 대응형 CSS 적용
- **레이아웃**: 화면 크기별 자동 조정

### 7. A/B 테스트
- **테스트기간**: 지정된 기간 동안만 실행
- **대상**: 특정 회원 그룹에만 노출
- **성과측정**: 노출/클릭/전환율 추적

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| panel_id | 패널ID | YYMMDDhhmmss+rand4 |
| area_cd | 영역코드 | DISP_AREA 코드 |
| panel_nm | 패널명 | 100자 이내 |
| widget_type_cd | 위젯타입 | WIDGET_TYPE 코드 |
| disp_panel_status_cd | 패널상태 | ACTIVE/INACTIVE |
| visibility_targets | 노출대상 | ^CODE^ 형식 |
| sort_ord | 정렬순서 | INTEGER |
| click_action | 클릭액션 | LINK/MODAL/NONE |
| click_target | 클릭대상 | URL 또는 ID |
| content_json | 콘텐츠데이터 | JSON 포맷 |

## 전시 시뮬레이션
- **목적**: 배포 전 사용자 입장에서 미리보기
- **기능**: 디바이스별, 회원등급별 미리보기
- **대상**: PC/모바일 개별 테스트

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| dp_ui | 디스플레이 UI (최상위 화면 정의) |
| dp_ui_area | UI-영역 매핑 |
| dp_area | 디스플레이 영역 |
| dp_area_panel | 영역-패널 매핑 |
| dp_panel | 디스플레이 패널 |
| dp_panel_item | 패널-위젯 항목 |
| dp_widget | 디스플레이 위젯 |
| dp_widget_lib | 위젯 라이브러리 (재사용 위젯) |

**계층 구조**: `dp_ui → dp_ui_area → dp_area → dp_area_panel → dp_panel → dp_panel_item → dp_widget`

**visibility_targets 인코딩**: `^PUBLIC^MEMBER^VIP^` 형식 (파이프 대신 캐럿 구분, 해당 코드가 포함되면 노출)

## 제약사항
- 영역은 중복 사용 불가
- 위젯 정렬순서는 패널별로 독립
- 노출대상은 최소 1개 필수

## 변경이력
- 2026-04-16: 초기 작성
- 2026-04-18: 계층 구조도 DDL 기반으로 재정비, 하위 상세 정책서 (612~616) 연결
