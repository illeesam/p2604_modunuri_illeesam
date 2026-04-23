# 안전한 데이터 접근 패턴 가이드

## 개요

null/undefined 방지 로직을 위해 `window.safeUtil` 유틸리티를 사용합니다. 모든 템플릿에서 `{{ safe }}` 객체로 접근 가능합니다.

## 주요 메서드

### 1. safe.get(obj, path, defaultValue)
깊은 객체 경로에서 안전하게 값을 가져옵니다.

**템플릿 사용:**
```html
<!-- 객체 경로 -->
<div>{{ safe.get(user, 'profile.name', '이름없음') }}</div>

<!-- 배열 인덱스 -->
<div>{{ safe.get(items, '[0].id', '') }}</div>

<!-- 중첩된 경로 -->
<div>{{ safe.get(data, 'users[0].address.city', '미정') }}</div>
```

### 2. safe.isArray(arr)
배열이 유효한지 확인합니다 (null/undefined/빈 배열 제외).

**템플릿 사용:**
```html
<!-- 배열이 있을 때만 렌더 -->
<div v-if="safe.isArray(items)">
  <div v-for="item in items" :key="item.id">{{ item.name }}</div>
</div>

<!-- 빈 상태 표시 -->
<div v-else>데이터가 없습니다.</div>
```

### 3. safe.isObject(obj)
객체가 유효한지 확인합니다 (null/undefined/빈 객체 제외).

**템플릿 사용:**
```html
<div v-if="safe.isObject(user)">
  <p>{{ user.name }} ({{ user.email }})</p>
</div>
```

### 4. safe.isString(str)
문자열이 유효한지 확인합니다 (whitespace-only 제외).

**템플릿 사용:**
```html
<div v-if="safe.isString(message)">{{ message }}</div>
```

### 5. safe.isTruthy(val)
값이 참인지 확인합니다 (0, false, '', [] 등 falsy 제외).

**템플릿 사용:**
```html
<button v-if="safe.isTruthy(count)">{{ count }}개 선택</button>
```

### 6. safe.filterValid(arr)
배열에서 null/undefined를 제거합니다.

**스크립트 사용:**
```javascript
const validItems = window.safeUtil.filterValid(data.items);
```

### 7. safe.mapSafe(arr, fn)
배열을 안전하게 매핑합니다.

**스크립트 사용:**
```javascript
const names = window.safeUtil.mapSafe(users, u => u.name);
```

## 템플릿 패턴 예제

### 패턴 1: 리스트 렌더링 (안전)
```html
<div v-if="safe.isArray(items)" class="list">
  <div v-for="item in items" :key="safe.get(item, 'id', Math.random())" class="item">
    <h4>{{ safe.get(item, 'title', '제목없음') }}</h4>
    <p>{{ safe.get(item, 'description', '') }}</p>
  </div>
</div>
<div v-else class="empty">목록이 비어있습니다.</div>
```

### 패턴 2: 중첩된 데이터 접근
```html
<!-- 사용자 정보 표시 -->
<div v-if="safe.isObject(currentUser)">
  <span>{{ safe.get(currentUser, 'profile.name', '게스트') }}</span>
  <span>{{ safe.get(currentUser, 'role.label', '사용자') }}</span>
</div>
```

### 패턴 3: 조건부 렌더링 (여러 체크)
```html
<div v-if="safe.isArray(orders) && safe.isObject(currentUser)">
  <h3>{{ safe.get(currentUser, 'name') }}님의 주문</h3>
  <ul>
    <li v-for="order in orders" :key="order.id">
      {{ safe.get(order, 'items[0].name', '상품명') }}
    </li>
  </ul>
</div>
```

### 패턴 4: 폼 데이터 (기본값 안전성)
```html
<form @submit="handleSubmit">
  <input 
    type="text"
    :value="safe.get(form, 'name', '')"
    @input="form.name = $event.target.value"
  />
  <input
    type="email"
    :value="safe.get(form, 'email', '')"
    @input="form.email = $event.target.value"
  />
</form>
```

### 패턴 5: 테이블 렌더링
```html
<table v-if="safe.isArray(dataList)">
  <thead>
    <tr>
      <th>이름</th>
      <th>상태</th>
      <th>금액</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in dataList" :key="item.id">
      <td>{{ safe.get(item, 'name', '-') }}</td>
      <td>{{ safe.get(item, 'status.label', '미정') }}</td>
      <td>{{ safe.get(item, 'amount', 0).toLocaleString() }}</td>
    </tr>
  </tbody>
</table>
```

## 스크립트에서의 사용

### setup() 함수 내에서:
```javascript
const handleData = (data) => {
  // 배열 필터링
  const validUsers = window.safeUtil.filterValid(data.users);
  
  // 값 추출
  const userId = window.safeUtil.get(data, 'auth.user.id', null);
  
  // 조건 체크
  if (window.safeUtil.isArray(data.items)) {
    // 배열 처리
  }
};
```

### computed에서:
```javascript
const userEmail = computed(() => {
  return window.safeUtil.get(currentUser.value, 'profile.email', '이메일 없음');
});
```

## 주의사항

1. **기본값은 명시적으로**: `safe.get(obj, 'path')` 대신 `safe.get(obj, 'path', '기본값')`
2. **배열 체크 먼저**: `v-if="safe.isArray(items)"` 후 `v-for`
3. **깊은 경로는 문자열로**: `safe.get(obj, 'a.b.c')` (배열 표기법: `a[0].b`)

## API 응답 안전성

API 응답에서 항상 safe 유틸을 사용:
```javascript
async function fetchData() {
  try {
    const res = await api.get('/data');
    const items = window.safeUtil.get(res, 'data.items', []);
    return window.safeUtil.filterValid(items);
  } catch (err) {
    return [];
  }
}
```

## 최佳 사례

✅ **좋은 패턴:**
```html
<div v-if="safe.isArray(list)">
  <div v-for="item in list" :key="item.id">
    {{ safe.get(item, 'name', '제목없음') }}
  </div>
</div>
```

❌ **나쁜 패턴:**
```html
<div v-if="list">
  <div v-for="item in list">
    {{ item.name }}  <!-- undefined 위험 -->
  </div>
</div>
```
