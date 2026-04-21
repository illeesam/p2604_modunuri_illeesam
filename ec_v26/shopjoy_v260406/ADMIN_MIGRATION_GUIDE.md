# Admin 목업 데이터 → API 마이그레이션 가이드

## 현황

### Phase 1: ✅ 완료
- Pinia 인증 스토어 (`authStore.js`) 생성
- Pinia 설정 스토어 (`configStore.js`) 생성
- AdminApp.js 로그인/로그아웃 로직 → API 호출로 변경
- `adminData` Props 제거 준비

### Phase 2: 🚀 진행 중
111개 컴포넌트에서 `props.adminData` → API 호출로 변경

### Phase 3: 🔮 완료 후
- 모든 목업 데이터 제거
- `adminData` Props 완전 삭제
- `AdminData.js` 불필요해짐 (선택적 삭제)

---

## Phase 2: 컴포넌트별 마이그레이션

### 방식 A: onMounted에서 API 로드

각 Mng 컴포넌트마다 다음 패턴을 적용합니다.

**Example: MbMemberMng.js**

```javascript
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  // ✅ props.adminData 제거
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;

    // 1️⃣ 로컬 데이터 state (adminData 대신)
    const members = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // 2️⃣ 필터링 (adminData.members 대신 로컬 members 사용)
    const searchKw = ref('');
    const applied = Vue.reactive({ kw: '' });
    const filtered = computed(() => members.value.filter(m => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !m.memberNm.toLowerCase().includes(kw)) return false;
      return true;
    }));

    // 3️⃣ onMounted에서 API 로드
    onMounted(async () => {
      loading.value = true;
      try {
        const res = await window.adminApi.get('/bo/ec/mb/member/page', {
          params: { pageNo: 1, pageSize: 1000 }
        });
        members.value = res.data?.data?.list || [];
        error.value = null;
      } catch (err) {
        error.value = err.message;
        showToast('회원 목록 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    });

    // 4️⃣ 삭제 시 로컬 배열도 업데이트
    const doDelete = async (m) => {
      const ok = await props.showConfirm('삭제', `[${m.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await window.adminApi.delete(`/bo/ec/mb/member/${m.userId}`);
        const idx = members.value.findIndex(x => x.userId === m.userId);
        if (idx !== -1) members.value.splice(idx, 1);
        showToast('삭제되었습니다.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 실패', 'error');
      }
    };

    return {
      members, loading, error, filtered, applied,
      searchKw, doDelete, // ... 기타
    };
  },
  // template은 props.adminData 대신 로컬 members 사용
  template: `...`
};
```

### 주요 변경점

| 항목 | 기존 (adminData) | 신규 (API) |
|------|------------------|-----------|
| Props | `props.adminData` 전달 | 제거 |
| 데이터 소스 | `props.adminData.members` | `members.value` (로컬 ref) |
| 로드 | AdminApp.js에서 미리 로드 | `onMounted`에서 API 호출 |
| 삭제/수정 | `props.adminData 배열` 직접 수정 | `members.value` 수정 + API 호출 |

---

## 도메인별 엔드포인트

### EC 도메인 (전자상거래)
```
GET/POST /bo/ec/mb/member        → 회원
GET/POST /bo/ec/pd/prod          → 상품
GET/POST /bo/ec/od/order         → 주문
GET/POST /bo/ec/od/claim         → 클레임
GET/POST /bo/ec/od/dliv          → 배송
GET/POST /bo/ec/pm/coupon        → 쿠폰
GET/POST /bo/ec/pm/cache         → 캐시
GET/POST /bo/ec/pm/discnt        → 할인
GET/POST /bo/ec/dp/ui            → 전시UI
GET/POST /bo/ec/dp/area          → 전시영역
GET/POST /bo/ec/dp/widget-lib    → 위젯라이브러리
```

### SY 도메인 (시스템)
```
GET      /bo/sy/code             → 공통코드
GET      /bo/sy/code/{grp}       → 코드그룹별
GET/POST /bo/sy/alarm            → 알람
GET/POST /bo/sy/batch            → 배치
GET/POST /bo/sy/user             → 사용자
GET/POST /bo/sy/dept             → 부서
GET/POST /bo/sy/menu             → 메뉴
GET/POST /bo/sy/role             → 역할
```

---

## 마이그레이션 체크리스트

### Mng 컴포넌트 (목록)
- [ ] Props에서 `adminData` 제거
- [ ] 로컬 `ref()` 데이터 선언
- [ ] `onMounted`에서 API 로드
- [ ] 필터링 로직 업데이트 (로컬 배열 사용)
- [ ] 삭제/저장 시 로컬 배열도 동기화
- [ ] 템플릿 렌더링 (props 대신 로컬 변수 사용)

### Dtl 컴포넌트 (상세)
- [ ] Props에서 `adminData` 제거
- [ ] `onMounted`에서 단건 조회 API 호출
- [ ] 저장/삭제 시 로컬 폼 데이터 관리
- [ ] 필요시 참조 데이터 로드 (예: 회원 목록)

---

## 예시: adminData 사용 현황

### 회원관리 (MbMemberMng.js)
```javascript
// 기존
const filtered = computed(() => props.adminData.members.filter(m => ...));
const doDelete = async (m) => {
  props.adminData.members.splice(idx, 1); // ❌ 목업 데이터 직접 수정
};

// 신규
const members = ref([]);
const filtered = computed(() => members.value.filter(m => ...));
const doDelete = async (m) => {
  await window.adminApi.delete(`/bo/ec/mb/member/${m.userId}`); // ✅ API 호출
  members.value.splice(idx, 1); // ✅ 로컬 상태 동기화
};
```

### 상품관리 (PdProdMng.js)
```javascript
// 기존
const filtered = computed(() => props.dispDataset.products.filter(p => ...));

// 신규
const products = ref([]);
onMounted(async () => {
  const res = await window.adminApi.get('/bo/ec/pd/prod/page', {
    params: { pageNo: 1, pageSize: 1000 }
  });
  products.value = res.data?.data?.list || [];
});
const filtered = computed(() => products.value.filter(p => ...));
```

---

## adminAxios 토큰 자동 주입

이미 구현되어 있음:
- `/utils/adminAxios.js`에서 자동으로 `modu-admin-token` Bearer 토큰 주입
- 401 응답 → 자동으로 `/auth/bo/auth/refresh` 호출해서 토큰 갱신
- 추가 작업 불필요 ✅

---

## AdminData.js 역할 변경

### 현재
```javascript
window.adminData = {
  members: [...],      // 목업 데이터
  products: [...],     // 목업 데이터
  orders: [...],       // 목업 데이터
  adminUsers: [...],   // 로그인용 목업
};
```

### 마이그레이션 후 (선택)
- **옵션 1**: 완전 삭제 (권장)
- **옵션 2**: 공통 코드/설정만 유지
- **옵션 3**: 개발/테스트 모드 전용으로 유지

---

## 진행 순서 (우선순위)

1. **높음**: 자주 사용되는 도메인 먼저
   - 회원 (MbMemberMng/Dtl) 
   - 상품 (PdProdMng/Dtl)
   - 주문 (OdOrderMng/Dtl)

2. **중간**: 다음 도메인
   - 클레임, 배송, 프로모션

3. **낮음**: 시스템 도메인
   - 코드, 알람, 배치 등

---

## 완료 후

모든 111개 컴포넌트 마이그레이션 완료 시:
```bash
# AdminData.js 삭제 (선택)
rm pages/admin/AdminData.js

# admin.html에서 AdminData.js 로드 제거
# <script src="pages/admin/AdminData.js"></script> 삭제
```

이후 완전한 API 기반 운영 ✅
