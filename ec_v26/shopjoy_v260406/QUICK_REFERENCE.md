# Quick Reference: Default Values System

## 🚀 Quick Start

### Three Layers of Safety

```
Data Layer:     window.adminDataProvider.getX() → always safe
State Layer:    reactive(window.refDefaults.xForm()) → always initialized
Template Layer: {{ (value?.prop || fallback)[0] }} → safe access
```

## 📦 Available Functions

### Data Provider (window.adminDataProvider)
```javascript
// Arrays (always return array, never undefined/null)
getProducts()           // → []
getMembers()            // → []
getOrders()             // → []
getCategories()         // → []
getRoles()              // → []

// Single Items (always return object with defaults)
getProductById(id)      // → { productId: 0, prodNm: '', ... }
getMemberById(id)       // → { userId: 0, email: '', ... }
getOrderById(id)        // → { orderId: '', ... }

// Special Queries
getUserRolesByUserId(id)   // → [] (filtered)
getCodesByGroup(code)      // → [] (filtered)
getCodeLabel(grp, val)     // → string
```

### Ref Defaults (window.refDefaults)
```javascript
// Domain Forms
productForm()       // → { productId, prodNm, category, price, ... }
memberForm()        // → { userId, email, memberNm, phone, ... }
orderForm()         // → { orderId, userId, userNm, orderDate, ... }
claimForm()         // → { claimId, userId, type, status, ... }
categoryForm()      // → { categoryId, categoryNm, parentId, ... }

// States
emptyArray()        // → []
emptyObject()       // → {}
pagerState()        // → { page: 1, size: 10 }
appliedFilter()     // → { kw: '', status: '' }
modalState()        // → { show: false, type: '', id: null, data: null }

// Utilities
initForm(type)                      // Initialize form by type
safeAssign(target, source)          // Safe merge
resetForm(form, defaults)           // Clear and reset form
```

## 💡 Usage Patterns

### Pattern 1: Load List Data
```javascript
const { ref } = Vue;
const products = ref(window.adminDataProvider.getProducts());
// OR with initialization
const products = ref(window.adminDataProvider.getProducts() || []);
```

### Pattern 2: Initialize Form
```javascript
const { reactive } = Vue;
const form = reactive(window.refDefaults.productForm());
// form is never undefined/null
```

### Pattern 3: Safe Data Assignment
```javascript
const loadProduct = (data) => {
  // Option A: Object.assign (works because form has structure)
  Object.assign(form, data);
  
  // Option B: Safe assign (handles undefined/null gracefully)
  window.refDefaults.safeAssign(form, data);
};
```

### Pattern 4: Template Protection
```vue
<!-- List -->
<div v-for="item in (products || [])" :key="item?.id">
  {{ item?.name }}
</div>

<!-- Single item -->
{{ currentUser?.name || 'Unknown' }}

<!-- String indexing -->
{{ (currentUser?.name || '')[0] || '?' }}

<!-- Object chain -->
{{ (orderItem?.product?.category || 'N/A') }}

<!-- Array indexing with guard -->
{{ list.length > 0 ? list[0].id : 'N/A' }}
```

### Pattern 5: Safe Navigation
```javascript
const navigate = (pageId) => {
  const page = pages.find(p => p.id === pageId);
  if (!page) {
    // Safe - pages is guaranteed array from provider
    navigate(pages[0]?.id || 'home');
  }
};
```

## ⚠️ Common Pitfalls to Avoid

### ❌ Bad - Direct access
```javascript
const form = reactive({});              // Empty, risky
const data = window.adminData.products; // Could be undefined
const char = name[0];                   // Could error
const item = list[0].id;                // No length check
```

### ✅ Good - With defaults
```javascript
const form = reactive(window.refDefaults.productForm()); // Safe
const data = window.adminDataProvider.getProducts();    // Safe
const char = (name || '')[0] || '?';                    // Safe
const item = list.length > 0 ? list[0].id : null;      // Safe
```

## 🔍 Debugging

### Check if Provider Works
```javascript
console.log(window.adminDataProvider);
// Should show 50+ functions, all returning safe defaults
```

### Check Form Defaults
```javascript
console.log(window.refDefaults.productForm());
// Should show { productId: null, prodNm: '', ... } with all fields
```

### Verify No Errors
```javascript
// All these should execute without error
window.adminDataProvider.getProducts();
window.adminDataProvider.getProductById(999);
window.refDefaults.productForm();
window.refDefaults.safeAssign({}, null);
```

## 📋 Checklist for New Component

When creating new admin component:

- [ ] Load data using `window.adminDataProvider.getX()`
- [ ] Initialize forms with `window.refDefaults.xForm()`
- [ ] Use optional chaining in templates: `obj?.prop`
- [ ] Provide fallbacks for critical values: `(value || default)`
- [ ] Check array length before [0]: `array.length > 0 ? array[0] : null`
- [ ] Test login and navigation - no "Cannot read properties" errors
- [ ] Open console - no undefined/null warnings

## 🎯 File Locations

| File | Purpose | Size |
|------|---------|------|
| `base/utils/adminDataProvider.js` | 50+ safe data accessors | 7.8 KB |
| `base/utils/refDefaults.js` | Form defaults & utilities | 5.9 KB |
| `bo.html` | Script loading (line 80) | - |
| `base/boApp.js` | 3 critical fixes | - |

## 📞 Support

**Documentation Files**:
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `ADMIN_DATA_PROVIDER_GUIDE.md` - Provider API reference
- `DEFAULT_VALUES_IMPLEMENTATION.md` - Implementation details
- `IMPLEMENTATION_CHECKLIST.md` - Tracking & verification

**In Code**:
- All functions have JSDoc comments
- Usage examples in each utility module
- Component examples show patterns

---

**Last Updated**: April 21, 2026  
**Status**: ✅ Production Ready
