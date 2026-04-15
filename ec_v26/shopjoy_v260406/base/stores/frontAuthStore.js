/* ShopJoy - Auth Store (Pinia) */
window.useAuthStore = Pinia.defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('shopjoy_token') || null;
    let user = null;
    if (token) {
      try { user = JSON.parse(localStorage.getItem('shopjoy_user') || 'null'); } catch (e) {}
    }
    return { token, user };
  },

  getters: {
    isLoggedIn: s => !!(s.token && s.user),
  },

  actions: {
    setSession(user, token) {
      this.user  = user;
      this.token = token;
      localStorage.setItem('shopjoy_token', token);
      localStorage.setItem('shopjoy_user',  JSON.stringify(user));
    },

    clearSession() {
      this.user  = null;
      this.token = null;
      localStorage.removeItem('shopjoy_token');
      localStorage.removeItem('shopjoy_user');
    },

    /** localStorage와 실시간 동기화 (DevTools 조작 감지용) */
    syncFromStorage() {
      const storedToken = localStorage.getItem('shopjoy_token');
      if (!storedToken && this.token) {
        // 토큰이 외부에서 삭제됨 → 로그아웃
        this.user  = null;
        this.token = null;
        localStorage.removeItem('shopjoy_user');
      } else if (storedToken && storedToken !== this.token) {
        // 토큰이 외부에서 변경됨 → 재동기화
        this.token = storedToken;
        try { this.user = JSON.parse(localStorage.getItem('shopjoy_user') || 'null'); } catch (e) {}
      }
    },
  },
});
