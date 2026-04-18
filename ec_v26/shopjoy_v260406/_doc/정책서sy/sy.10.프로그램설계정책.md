---
정책명: 프로그램 설계 및 개발 정책
정책번호: 920
관리자: 개발팀
최종수정: 2026-04-17
---

# 920. 프로그램 설계 및 개발 정책

## 목적

사용자 경험을 향상시키고 데이터 입력 작업을 최소화하여 시스템의 생산성과 사용성을 극대화한다.

## 기본 원칙

### 1. 합리적인 초기값 설정

**정의**: 새로운 항목 추가 시 통상적으로 가장 많이 사용되는 값을 기본값으로 설정한다.

**적용 범위**:
- 드롭다운 선택 필드
- 텍스트 입력 필드
- 날짜/기간 필드
- 체크박스 / 라디오 버튼
- 상태 코드 필드

**예시**:
```
전시 항목 추가 시:
- 사용여부(useYn): Y (활성 상태가 기본)
- 전시여부(dispYn): Y (노출 기본)
- 사용기간(useStartDate ~ useEndDate): 오늘 ~ 10년 후
- 전시기간(dispStartDate ~ dispEndDate): 오늘 00:00 ~ 10년 후 23:59
- 전시환경(dispEnv): DEV (개발 환경에서 먼저 테스트)

UI/영역/패널 추가 시:
- 사용여부(useYn): Y
- 사용기간: 오늘 ~ 10년 후

위젯 라이브러리 추가 시:
- 전시환경(dispEnv): DEV
```

### 2. 사용자 입력 최소화

**정의**: 프로그램 로직으로 계산 또는 자동 생성 가능한 항목은 사용자가 입력하지 않도록 한다.

**적용 사례**:

#### 2.1 자동 계산/생성
| 항목 | 입력 방식 | 예시 |
|---|---|---|
| 생성일(regDate) | 자동 입력 | 시스템이 현재 날짜 자동 설정 |
| 정렬순서(sortOrd) | 자동 계산 | 기존 항목 수 + 1 |
| 코드(codeValue) | 자동 생성 | `DU_YYMMDD_HHMMSS` 형식 |
| 기간 종료일(endDate) | 자동 계산 | 시작일 + 10년 |
| 기간 종료시간(endTime) | 자동 설정 | 23:59 (업무 마감 시각) |

#### 2.2 합리적 기본값
| 항목 | 기본값 | 이유 |
|---|---|---|
| 상태(status) | 활성 | 대부분의 신규 항목이 활성 상태부터 시작 |
| 레이아웃(layoutType) | grid | 가장 일반적인 레이아웃 |
| 그리드 열(gridCols) | 1 | 단일 열로 시작 후 필요시 조정 |
| 헤더 표시(titleYn) | N | 선택적 요소 (필요 시만 활성화) |
| 시작시간(startTime) | 00:00 | 날짜의 시작 |
| 종료시간(endTime) | 23:59 | 날짜의 마지막 |

### 3. 입력 필드 제약사항

**최소 필수 입력**:
- 고유 식별값 (코드, 이름 등): 자동 생성되지 않는 경우만
- 관계 설정값: 부모/참조 항목 선택
- 상태/활성 여부: 선택지가 명확한 경우만

**자동 설정 금지 입력**:
- 사용자의 의도를 직접 반영해야 하는 항목
- 법적/보안상 중요한 정보
- 비용/금액 관련 정보

## 구현 가이드

### 데이터 모델 설계 시
```javascript
// ❌ 나쁜 예: 모든 필드가 비어있음
const form = reactive({
  useYn: '',
  useStartDate: '',
  useEndDate: '',
  dispEnv: '',
  // ...
});

// ✅ 좋은 예: 합리적인 기본값 설정
const form = reactive({
  useYn: 'Y',
  useStartDate: DEFAULT_START_DATE,      // 오늘
  useEndDate: DEFAULT_END_DATE,          // 10년 후
  dispEnv: '^DEV^',                      // DEV 환경
  status: '활성',
  sortOrd: nextSortOrder,                // 자동 계산
  regDate: todayString,                  // 자동 생성
  // ...
});
```

### 폼 초기값 팩토리 함수
```javascript
const makeRowData = (overrides = {}) => ({
  // 기본값들 (모두 채워짐)
  useYn: 'Y',
  dispYn: 'Y',
  useStartDate: DEFAULT_START_DATE,
  useEndDate: DEFAULT_END_DATE,
  dispStartDate: DEFAULT_START_DATE,
  dispStartTime: '00:00',
  dispEndDate: DEFAULT_END_DATE,
  dispEndTime: '23:59',
  dispEnv: '^DEV^',
  // ...
  
  // 오버라이드 허용 (특수한 경우 기본값 재정의)
  ...overrides,
});
```

## 검증 및 테스트

1. **신규 항목 추가 시**: 기본값이 올바르게 설정되었는지 확인
2. **필드 수정 시**: 사용자가 최소한의 필드만 수정하면 되는지 확인
3. **중복 생성 시**: 같은 항목 여러 개 추가 시에도 기본값이 일관되는지 확인

## 제외 사항

다음 필드는 사용자 선택이 필수이므로 기본값을 설정하지 않는다:
- 항목명/라벨 (codeLabel, name, title 등) - 구분 불가능
- 참조/관계 필드 (영역선택, 패널선택 등) - 사용자 의도 필수
- 비용/수수료 정보 - 정확성 필요
- 설명/내용 필드 - 항목별로 상이함

## 정책 적용 현황

### 적용됨 (2026-04-17)
✓ DispPanelDtl.js - 전시항목 추가 시 기본값  
✓ DispAreaDtl.js - 전시영역 추가 시 기본값  
✓ DispUiDtl.js - 전시UI 추가 시 기본값  
✓ DispWidgetDtl.js - 위젯 라이브러리 추가 시 기본값

### 향후 확대 대상
- [ ] 상품 정보 관리
- [ ] 주문/배송 정보
- [ ] 회원 정보
- [ ] 쿠폰/프로모션
- [ ] 기타 업무 화면

## 4. 목록 및 테이블 표시 정책

### 4.1 헤더 정렬

**모든 테이블/목록의 헤더는 가운데 정렬**

```html
<!-- ✅ 좋은 예 -->
<thead>
  <tr>
    <th style="text-align: center;">항목명</th>
    <th style="text-align: center;">코드</th>
    <th style="text-align: center;">생성일</th>
  </tr>
</thead>
```

### 4.2 데이터 정렬 규칙

목록 행(row)의 값은 필드 타입에 따라 정렬 방식을 다르게 적용한다.

| 필드 타입 | 정렬 방식 | CSS | 예시 |
|---|---|---|---|
| **기본값** (텍스트, 설명) | 좌측 정렬 | `text-align: left;` | 상품명, 회원명, 설명 |
| **코드값** (code, codeValue) | 가운데 정렬 | `text-align: center;` | ORDER_STATUS_CD, DISP_AREA |
| **라벨** (label, codeLabel) | 가운데 정렬 | `text-align: center;` | 상태명, 영역명 |
| **날짜값** (Date) | 가운데 정렬 | `text-align: center;` | 생성일, 수정일, 시작일, 종료일 |
| **숫자값** (Number, Integer, Bigint) | 우측 정렬 | `text-align: right;` | 수량, 금액, 가격, 조회수 |

**구현 예시**:
```html
<tbody>
  <tr>
    <!-- 기본값: 좌측 정렬 -->
    <td style="text-align: left;">상품A</td>
    
    <!-- 코드값: 가운데 정렬 -->
    <td style="text-align: center;">PROD_001</td>
    
    <!-- 라벨: 가운데 정렬 -->
    <td style="text-align: center;">활성</td>
    
    <!-- 날짜: 가운데 정렬 -->
    <td style="text-align: center;">2026-04-17</td>
    
    <!-- 숫자: 우측 정렬 -->
    <td style="text-align: right;">1,500</td>
  </tr>
</tbody>
```

### 4.3 그리드보기 표시 형식

테이블 목록에서 특정 필드 타입의 표시 형식을 표준화한다.

#### 숫자값 - 1000단위 구분
**모든 숫자값은 1,000단위로 쉼표 구분 표시**

```javascript
// ✅ 좋은 예
1,234,567      // O (1000단위 구분)
123            // O (3자리 이하는 그대로)

// ❌ 나쁜 예
1234567        // X (구분 없음)
```

**Vue 구현**:
```javascript
// 필터 또는 computed
const formatNumber = (num) => {
  if (num == null) return '-';
  return Number(num).toLocaleString('ko-KR');
};

// 템플릿
<td style="text-align: right;">{{ formatNumber(row.amount) }}</td>
```

#### 날짜값 - YYYY-MM-DD 형식
**모든 날짜는 년-월-일 형식으로 표시**

```javascript
// ✅ 좋은 예
2026-04-17    // O (YYYY-MM-DD)

// ❌ 나쁜 예
04/17/2026    // X (MM/DD/YYYY)
2026년4월17일  // X (한글 형식)
```

#### 시분값 - HH:MM 형식
**모든 시간 값은 시:분 형식으로 표시**

```javascript
// ✅ 좋은 예
14:30         // O (HH:MM, 24시간 형식)
09:00         // O

// ❌ 나쁜 예
14:30:00      // X (초까지 표시)
2:30 PM       // X (12시간 형식)
```

### 4.4 열 표시 설정 (Column Visibility Control)

**테이블 우측에 설정 아이콘 추가**

#### 기능
1. 그리드 우측 상단에 **⚙️ 열설정** 아이콘 배치
2. 클릭 시 레이어(모달/팝오버) 펼침
3. 레이어 내용:
   - 각 열의 체크박스 (표시/숨김 토글)
   - 열 순서 변경 (드래그 또는 위/아래 버튼)
   - 초기값으로 리셋 버튼

#### 구현 패턴

```vue
<template>
  <!-- 테이블 헤더 -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <h3>{{ tableTitle }}</h3>
    <button @click="toggleColumnSettings" style="background: none; border: none; cursor: pointer; font-size: 20px;">
      ⚙️
    </button>
  </div>

  <!-- 열설정 레이어 (펼침 상태일 때) -->
  <div v-if="showColumnSettings" class="column-settings-panel" style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
    <h4>열 표시 설정</h4>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div v-for="(col, idx) in visibleColumns" :key="col.key" style="display: flex; align-items: center; gap: 10px;">
        <!-- 열 순서 조정 버튼 -->
        <div style="display: flex; gap: 3px;">
          <button v-if="idx > 0" @click="moveColumnUp(idx)" style="padding: 2px 6px; font-size: 12px;">▲</button>
          <button v-if="idx < visibleColumns.length - 1" @click="moveColumnDown(idx)" style="padding: 2px 6px; font-size: 12px;">▼</button>
        </div>
        
        <!-- 열 표시/숨김 체크박스 -->
        <input 
          type="checkbox" 
          :checked="col.visible" 
          @change="toggleColumnVisibility(col.key)"
          style="margin: 0;"
        />
        <label style="margin: 0;">{{ col.label }}</label>
      </div>
    </div>
    
    <!-- 초기값 리셋 -->
    <button @click="resetColumns" style="margin-top: 10px; padding: 6px 12px; font-size: 12px;">초기값으로 리셋</button>
  </div>

  <!-- 실제 테이블 -->
  <table class="admin-table">
    <!-- 동적 열 렌더링 -->
    <thead>
      <tr>
        <th v-for="col in visibleColumns" :key="col.key" :style="{ textAlign: 'center' };">
          {{ col.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <td v-for="col in visibleColumns" :key="col.key" :style="{ textAlign: getAlignment(col.type) };">
          {{ formatValue(row[col.key], col.type) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  data() {
    return {
      showColumnSettings: false,
      
      // 모든 열의 메타데이터
      allColumns: [
        { key: 'name', label: '이름', type: 'text', visible: true, order: 1 },
        { key: 'code', label: '코드', type: 'code', visible: true, order: 2 },
        { key: 'status', label: '상태', type: 'label', visible: true, order: 3 },
        { key: 'createdDate', label: '생성일', type: 'date', visible: true, order: 4 },
        { key: 'amount', label: '금액', type: 'number', visible: true, order: 5 },
        { key: 'startTime', label: '시작시간', type: 'time', visible: false, order: 6 },
      ],
    };
  },
  
  computed: {
    // 표시 설정된 열만, 순서대로 반환
    visibleColumns() {
      return this.allColumns
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order);
    },
  },
  
  methods: {
    toggleColumnSettings() {
      this.showColumnSettings = !this.showColumnSettings;
    },
    
    toggleColumnVisibility(key) {
      const col = this.allColumns.find(c => c.key === key);
      if (col) col.visible = !col.visible;
    },
    
    moveColumnUp(idx) {
      if (idx > 0) {
        [this.visibleColumns[idx - 1].order, this.visibleColumns[idx].order] = 
        [this.visibleColumns[idx].order, this.visibleColumns[idx - 1].order];
      }
    },
    
    moveColumnDown(idx) {
      if (idx < this.visibleColumns.length - 1) {
        [this.visibleColumns[idx].order, this.visibleColumns[idx + 1].order] = 
        [this.visibleColumns[idx + 1].order, this.visibleColumns[idx].order];
      }
    },
    
    resetColumns() {
      // 초기 상태로 복구 (localStorage에서 로드)
      this.allColumns.forEach((col, idx) => {
        col.visible = col.defaultVisible;
        col.order = col.defaultOrder;
      });
    },
    
    getAlignment(type) {
      switch (type) {
        case 'code':
        case 'label':
        case 'date':
          return 'center';
        case 'number':
          return 'right';
        default:
          return 'left';
      }
    },
    
    formatValue(value, type) {
      if (value == null || value === '') return '-';
      
      switch (type) {
        case 'number':
          return Number(value).toLocaleString('ko-KR');
        case 'date':
          return new Date(value).toISOString().slice(0, 10);
        case 'time':
          return value.slice(0, 5); // "14:30:00" → "14:30"
        default:
          return value;
      }
    },
  },
};
</script>
```

### 4.5 열 설정 데이터 저장

사용자의 열 표시/순서 설정을 localStorage에 저장하여 다음 방문 시 유지

```javascript
// 저장
const saveColumnSettings = () => {
  const settings = {
    columns: allColumns.map(col => ({
      key: col.key,
      visible: col.visible,
      order: col.order,
    })),
  };
  localStorage.setItem(`${pageId}_columns`, JSON.stringify(settings));
};

// 로드
const loadColumnSettings = () => {
  const saved = localStorage.getItem(`${pageId}_columns`);
  if (saved) {
    const settings = JSON.parse(saved);
    settings.columns.forEach(savedCol => {
      const col = allColumns.find(c => c.key === savedCol.key);
      if (col) {
        col.visible = savedCol.visible;
        col.order = savedCol.order;
      }
    });
  }
};
```

## 5. 상세화면 ID 표시 정책

### 5.1 목적

관리자 상세화면에서 편집 중인 항목의 ID를 명확하게 표시하여 사용자가 현재 작업 중인 항목을 즉시 파악할 수 있도록 한다.

### 5.2 표시 위치

**페이지 제목(Page Title) 바로 우측에 인라인 표시**

- 위치: 제목 텍스트 바로 다음 (공간 구분 없음)
- 형식: `#ID` (예: `#12345`, `#2026041712345678`)
- 간격: 제목과 ID 사이에 8px 여백

### 5.3 HTML 구현 패턴

```html
<!-- 신규 등록 시: ID 표시 안 함 -->
<div class="page-title">쿠폰 등록</div>

<!-- 수정/상세 시: ID를 제목 바로 우측에 표시 -->
<div class="page-title">
  쿠폰 수정
  <span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.couponId }}</span>
</div>
```

### 5.4 Vue 구현 패턴

```javascript
// 신규/수정 상태 판정
const isNew = computed(() => !props.editId);

// 폼 데이터
const form = reactive({
  couponId: null,
  couponNm: '',
  // ... 기타 필드
});

// onMounted에서 ID 할당
onMounted(() => {
  if (!isNew.value) {
    const data = props.adminData.getCoupon(props.editId);
    if (data) Object.assign(form, { ...data });
    // form.couponId는 자동으로 설정됨
  }
});

// 반환값에 form 포함
return { isNew, form, ... };
```

### 5.5 적용 범위

**적용 대상**: 모든 관리자 상세화면 (Dtl.js 파일)

| 도메인 | 파일 | ID 필드 |
|--------|------|--------|
| 판촉 | PmCouponDtl | couponId |
| 판촉 | PmCacheDtl | cacheId |
| 판촉 | PmDiscntDtl | discntId |
| 판촉 | PmSaveDtl | saveId |
| 판촉 | PmGiftDtl | giftId |
| 판촉 | PmEventDtl | eventId |
| 판촉 | PmPlanDtl | planId |
| 상품 | PdCategoryDtl | categoryId |
| 상품 | PdProdDtl | productId |
| 회원 | MbMemberDtl | userId |
| 주문 | OdOrderDtl | orderId |
| 클레임 | OdClaimDtl | claimId |
| 배송 | OdDlivDtl | dlivId |
| 공지 | CmNoticeDtl | noticeId |
| 채팅 | CmChattDtl | chatId |
| 전시UI | DpDispUiDtl | dispUiId |
| 전시영역 | DpDispAreaDtl | areaId |
| 전시패널 | DpDispPanelDtl | panelId |
| 전시위젯 | DpDispWidgetDtl | widgetId |

### 5.6 조건

- **신규 등록**: ID 미할당 상태이므로 표시 안 함
- **수정/상세**: ID 할당된 상태이므로 표시
- **보기 모드 지원**: viewMode prop 있는 경우에도 ID 표시 유지

### 5.7 스타일 가이드

| 속성 | 값 | 이유 |
|------|-----|------|
| font-size | 12px | 보조정보 크기 |
| color | #999 | 회색 (메인 제목과 구분) |
| margin-left | 8px | 제목과의 시각적 간격 |

**CSS 클래스 미사용**: 인라인 style 사용으로 일관성 유지

## 관련 정책
- 611. 전시관리 정책
- 911. 시스템공통 정책
