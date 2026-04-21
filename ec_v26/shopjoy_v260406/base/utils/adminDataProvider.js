/**
 * Admin 공통 데이터 제공자 (함수형)
 * - 모든 adminData 접근을 함수로 통합
 * - undefined/null은 절대 반환하지 않음
 * - 항상 안전한 기본값 보장
 */

window.adminDataProvider = (() => {
  const getAdminData = () => window.adminData || {};

  return {
    // ==================== 회원 ====================
    getMembers() {
      return (getAdminData().members || []);
    },

    getMemberById(userId) {
      const members = this.getMembers();
      return members.find(m => m?.userId === userId) || { userId: 0, email: '', memberNm: '', phone: '', grade: '', status: '', joinDate: '', lastLogin: '', orderCount: 0, totalPurchase: 0 };
    },

    // ==================== 상품 ====================
    getProducts() {
      return (getAdminData().products || []);
    },

    getProductById(productId) {
      const products = this.getProducts();
      return products.find(p => p?.productId === productId) || { productId: 0, prodNm: '', category: '', price: 0, stock: 0, status: '', brand: '', regDate: '' };
    },

    // ==================== 주문 ====================
    getOrders() {
      return (getAdminData().orders || []);
    },

    getOrderById(orderId) {
      const orders = this.getOrders();
      return orders.find(o => o?.orderId === orderId) || { orderId: '', userId: 0, userNm: '', orderDate: '', prodNm: '', totalPrice: 0, status: '', payMethod: '', vendorId: 0 };
    },

    // ==================== 클레임 ====================
    getClaims() {
      return (getAdminData().claims || []);
    },

    getClaimById(claimId) {
      const claims = this.getClaims();
      return claims.find(c => c?.claimId === claimId) || { claimId: '', userId: 0, userNm: '', orderId: '', type: '', status: '', requestDate: '', prodNm: '', reason: '', refundAmount: 0 };
    },

    // ==================== 배송 ====================
    getDeliveries() {
      return (getAdminData().deliveries || []);
    },

    getDeliveryById(dlivId) {
      const deliveries = this.getDeliveries();
      return deliveries.find(d => d?.dlivId === dlivId) || { dlivId: '', orderId: '', status: '', carrier: '', trackingNo: '', estDeliveryDate: '' };
    },

    // ==================== 브랜드 ====================
    getBrands() {
      return (getAdminData().brands || []);
    },

    getBrandById(brandId) {
      const brands = this.getBrands();
      return brands.find(b => b?.brandId === brandId) || { brandId: 0, brandNm: '', logoUrl: '', status: '' };
    },

    // ==================== 카테고리 ====================
    getCategories() {
      return (getAdminData().categories || []);
    },

    getCategoryById(categoryId) {
      const categories = this.getCategories();
      return categories.find(c => c?.categoryId === categoryId) || { categoryId: 0, categoryNm: '', parentId: 0, level: 0, status: '' };
    },

    // ==================== 역할 ====================
    getRoles() {
      return (getAdminData().roles || []);
    },

    getRoleById(roleId) {
      const roles = this.getRoles();
      return roles.find(r => r?.roleId === roleId) || { roleId: 0, roleNm: '', description: '', status: '' };
    },

    // ==================== 사용자 역할 ====================
    getUserRoles() {
      return (getAdminData().userRoles || []);
    },

    getUserRolesByUserId(adminUserId) {
      const userRoles = this.getUserRoles();
      return userRoles.filter(ur => ur?.adminUserId === adminUserId) || [];
    },

    // ==================== 코드 ====================
    getCodes() {
      return (getAdminData().codes || []);
    },

    getCodesByGroup(codeGrp) {
      const codes = this.getCodes();
      return codes.filter(c => c?.codeGrp === codeGrp) || [];
    },

    getCodeLabel(codeGrp, codeVal) {
      const codes = this.getCodesByGroup(codeGrp);
      const code = codes.find(c => c?.codeVal === codeVal);
      return code?.codeLbl || '';
    },

    // ==================== 사이트 ====================
    getSites() {
      return (getAdminData().sites || []);
    },

    getSiteById(siteId) {
      const sites = this.getSites();
      return sites.find(s => s?.siteId === siteId) || { siteId: 0, siteNm: '', domain: '', status: '' };
    },

    // ==================== 부서 ====================
    getDepts() {
      return (getAdminData().depts || []);
    },

    getDeptById(deptId) {
      const depts = this.getDepts();
      return depts.find(d => d?.deptId === deptId) || { deptId: 0, deptNm: '', parentId: 0, status: '' };
    },

    // ==================== 메뉴 ====================
    getMenus() {
      return (getAdminData().menus || []);
    },

    getMenuById(menuId) {
      const menus = this.getMenus();
      return menus.find(m => m?.menuId === menuId) || { menuId: 0, menuNm: '', parentId: 0, url: '', status: '' };
    },

    // ==================== 관리자 사용자 ====================
    getAdminUsers() {
      return (getAdminData().adminUsers || []);
    },

    getAdminUserById(adminUserId) {
      const adminUsers = this.getAdminUsers();
      return adminUsers.find(u => u?.adminUserId === adminUserId) || { adminUserId: 0, loginId: '', password: '', name: '', email: '', phone: '', dept: '', role: '', status: '', lastLogin: '' };
    },

    // ==================== 쿠폰 ====================
    getCoupons() {
      return (getAdminData().coupons || []);
    },

    getCouponById(couponId) {
      const coupons = this.getCoupons();
      return coupons.find(c => c?.couponId === couponId) || { couponId: 0, couponNm: '', discountType: '', discountValue: 0, status: '', startDate: '', endDate: '' };
    },

    // ==================== 캐시 ====================
    getCaches() {
      return (getAdminData().caches || []);
    },

    getCacheById(cacheId) {
      const caches = this.getCaches();
      return caches.find(c => c?.cacheId === cacheId) || { cacheId: 0, cacheName: '', balance: 0, status: '' };
    },

    // ==================== 이벤트 ====================
    getEvents() {
      return (getAdminData().events || []);
    },

    getEventById(eventId) {
      const events = this.getEvents();
      return events.find(e => e?.eventId === eventId) || { eventId: 0, eventNm: '', startDate: '', endDate: '', status: '', type: '' };
    },

    // ==================== 디스플레이 ====================
    getDisplays() {
      return (getAdminData().displays || []);
    },

    getDisplayById(displayId) {
      const displays = this.getDisplays();
      return displays.find(d => d?.displayId === displayId) || { displayId: 0, displayNm: '', type: '', status: '', rows: [] };
    },

    // ==================== 업체 ====================
    getVendors() {
      return (getAdminData().vendors || []);
    },

    getVendorById(vendorId) {
      const vendors = this.getVendors();
      return vendors.find(v => v?.vendorId === vendorId) || { vendorId: 0, vendorNm: '', contact: '', email: '', phone: '', status: '' };
    },

    // ==================== 통합 조회 ====================
    getAllData() {
      return {
        members: this.getMembers(),
        products: this.getProducts(),
        orders: this.getOrders(),
        claims: this.getClaims(),
        deliveries: this.getDeliveries(),
        brands: this.getBrands(),
        categories: this.getCategories(),
        roles: this.getRoles(),
        userRoles: this.getUserRoles(),
        codes: this.getCodes(),
        sites: this.getSites(),
        depts: this.getDepts(),
        menus: this.getMenus(),
        adminUsers: this.getAdminUsers(),
        coupons: this.getCoupons(),
        caches: this.getCaches(),
        events: this.getEvents(),
        displays: this.getDisplays(),
        vendors: this.getVendors(),
      };
    }
  };
})();
