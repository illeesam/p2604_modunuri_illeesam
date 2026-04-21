# Admin Data Provider System

## Overview

All admin components now access common data through the centralized `adminDataProvider` function system. This ensures:
- **No undefined/null values** — All functions return safe default objects/arrays
- **Type-safe data access** — Single source of truth for all adminData
- **Backward compatible** — Maintains reactivity with Vue 3

## Architecture

### Data Provider (`base/utils/adminDataProvider.js`)

Window-level utility that wraps all `window.adminData` access with guaranteed defaults:

```javascript
window.adminDataProvider = {
  getMembers()              // → array or []
  getMemberById(id)         // → object or { userId: 0, ... }
  getProducts()             // → array or []
  getProductById(id)        // → object or { productId: 0, ... }
  getOrders()               // → array or []
  getOrderById(id)          // → object or { orderId: '', ... }
  getClaims()               // → array or []
  getClaimById(id)          // → object or { claimId: '', ... }
  getCategories()           // → array or []
  getCategoryById(id)       // → object or { categoryId: 0, ... }
  getRoles()                // → array or []
  getRoleById(id)           // → object or { roleId: 0, ... }
  getUserRoles()            // → array or []
  getUserRolesByUserId(id)  // → array or []
  // ... etc for all data types
}
```

**Key Guarantee**: Every function returns a non-null, non-undefined value.

## Migration

### Before (Direct Access)
```javascript
const data = window.adminData || {};
const products = ref(data.products || []);
const categories = ref(data.categories || []);
```

**Problem**: Chain breaks if any intermediate value is null/undefined

### After (Provider Pattern)
```javascript
const products = ref(window.adminDataProvider?.getProducts?.() || []);
const categories = ref(window.adminDataProvider?.getCategories?.() || []);
```

**Benefit**: Provider methods guarantee defaults, no undefined propagation

## Updated Files

### Core Infrastructure
- `admin.html` — Added script tag for `base/utils/adminDataProvider.js`
- `base/utils/adminDataProvider.js` — NEW (function-based data provider)

### Admin Components Using Provider
- `base/boApp.js` — Updated all computeds and functions to use provider
- `pages/admin/AdminModals.js` — Refactored to use provider methods
- `pages/admin/ec/pd/PdBundleMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdCategoryMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdCategoryProdMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdQnaMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdRestockNotiMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdReviewMng.js` — Updated to provider pattern
- `pages/admin/ec/pd/PdSetMng.js` — Updated to provider pattern
- `pages/admin/ec/pm/PmEventDtl.js` — Updated to provider pattern
- `pages/admin/ec/pm/PmPlanDtl.js` — Updated to provider pattern

## Usage Examples

### Getting a List
```javascript
// In setup():
const products = ref(window.adminDataProvider.getProducts());
// Always returns array, never undefined/null
```

### Finding a Single Item
```javascript
const member = computed(() => {
  if (!selectedMemberId.value) return null;
  return window.adminDataProvider.getMemberById(selectedMemberId.value);
});
// Returns object with all fields, or safe default object
```

### In Templates
```vue
<div v-for="product in products" :key="product.productId">
  {{ product.prodNm }}
</div>
```

No need for null checks — products is guaranteed to be an array.

## Default Objects Reference

When `null/undefined` is encountered, these are the defaults returned:

```javascript
// Member
{ userId: 0, email: '', memberNm: '', phone: '', grade: '', status: '', joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0 }

// Product
{ productId: 0, prodNm: '', category: '', price: 0, stock: 0, status: '', brand: '', regDate: '' }

// Order
{ orderId: '', userId: 0, userNm: '', orderDate: '', prodNm: '', totalPrice: 0, status: '', payMethod: '', vendorId: 0 }

// Role
{ roleId: 0, roleNm: '', description: '', status: '' }

// And all other types...
```

## Testing

Test in browser console after login:
```javascript
// Should work without errors
console.log(window.adminDataProvider.getProducts());
console.log(window.adminDataProvider.getMembers().length);
console.log(window.adminDataProvider.getProductById(999));
```

All calls should return safe defaults, never throw or return undefined.

## Adding New Data Types

To expose new adminData properties:

1. **Add provider method** in `base/utils/adminDataProvider.js`:
```javascript
getMyNewType() {
  return (getAdminData().myNewType || []);
},

getMyNewTypeById(id) {
  const items = this.getMyNewType();
  return items.find(x => x?.id === id) || { id: 0, name: '', ... };
}
```

2. **Use in components**:
```javascript
const items = ref(window.adminDataProvider.getMyNewType());
```

## Performance Notes

- Provider functions are synchronous and rely on in-memory `window.adminData`
- No caching layer needed (Vue's ref/computed handle reactivity)
- All operations are O(n) for list access, O(1) for single-item lookup (after first load)

## Troubleshooting

**Issue**: "adminDataProvider is undefined"
- **Solution**: Ensure `base/utils/adminDataProvider.js` is loaded AFTER `AdminData.js` in `admin.html`

**Issue**: Component shows blank/empty lists
- **Solution**: Check that `window.adminData` is populated before component setup()
- Use `onMounted()` for async data loading from API

**Issue**: Data not updating
- **Solution**: Provider methods access current `window.adminData` in real-time
- If data changes after component setup, ensure ref is updated or use computed instead
