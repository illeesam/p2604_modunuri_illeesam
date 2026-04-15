/* ShopJoy - Auth Store (Pinia) */
window.useFrontAuthStore = Pinia.defineStore('frontAuth', {
  state: () => {
    const token = localStorage.getItem('modu-front-token') || null;
    let user = null;
    if (token) {
      try { user = JSON.parse(localStorage.getItem('modu-front-user') || 'null'); } catch (e) {}
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
      localStorage.setItem('modu-front-token', token);
      localStorage.setItem('modu-front-user',  JSON.stringify(user));
    },

    clearSession() {
      this.user  = null;
      this.token = null;
      localStorage.removeItem('modu-front-token');
      localStorage.removeItem('modu-front-user');
    },

    /** localStorage와 실시간 동기화 (DevTools 조작 감지용) */
    syncFromStorage() {
      const storedToken = localStorage.getItem('modu-front-token');
      if (!storedToken && this.token) {
        // 토큰이 외부에서 삭제됨 → 로그아웃
        this.user  = null;
        this.token = null;
        localStorage.removeItem('modu-front-user');
      } else if (storedToken && storedToken !== this.token) {
        // 토큰이 외부에서 변경됨 → 재동기화
        this.token = storedToken;
        try { this.user = JSON.parse(localStorage.getItem('modu-front-user') || 'null'); } catch (e) {}
      }
    },
  },
});
