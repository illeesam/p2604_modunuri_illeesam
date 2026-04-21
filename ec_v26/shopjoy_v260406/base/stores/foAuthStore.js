/* ShopJoy - FO Auth Store (Pinia) + 함수형 유틸리티 */
window.useFoAuthStore = Pinia.defineStore('foAuth', {
  state: () => {
    const token = localStorage.getItem('modu-fo-token') || '';
    let user = null;
    if (token) {
      try {
        user = JSON.parse(localStorage.getItem('modu-fo-user') || 'null') || { userId: 0, email: '', name: '' };
      } catch (e) {
        user = { userId: 0, email: '', name: '' };
      }
    } else {
      user = { userId: 0, email: '', name: '' };
    }
    return { token, user };
  },

  getters: {
    isLoggedIn: (s) => !!(s?.token && s?.user && s.user.userId),
    currentUser: (s) => (s?.user || { userId: 0, email: '', name: '' }),
    authToken: (s) => (s?.token || ''),
  },

  actions: {
    setSession(user, token) {
      this.user = (user && typeof user === 'object') ? user : { userId: 0, email: '', name: '' };
      this.token = token || '';
      try {
        if (this.token) localStorage.setItem('modu-fo-token', this.token);
        if (this.user && this.user.userId) localStorage.setItem('modu-fo-user', JSON.stringify(this.user));
      } catch (e) {
        console.error('setSession storage error:', e);
      }
    },

    clearSession() {
      this.user = { userId: 0, email: '', name: '' };
      this.token = '';
      try {
        localStorage.removeItem('modu-fo-token');
        localStorage.removeItem('modu-fo-user');
      } catch (e) {
        console.error('clearSession storage error:', e);
      }
    },

    /* localStorage와 실시간 동기화 (DevTools 조작 감지용) */
    syncFromStorage() {
      try {
        const storedToken = localStorage.getItem('modu-fo-token');
        if (!storedToken && this.token) {
          // 토큰이 외부에서 삭제됨 → 로그아웃
          this.user = { userId: 0, email: '', name: '' };
          this.token = '';
          localStorage.removeItem('modu-fo-user');
        } else if (storedToken && storedToken !== this.token) {
          // 토큰이 외부에서 변경됨 → 재동기화
          this.token = storedToken || '';
          try {
            const userData = JSON.parse(localStorage.getItem('modu-fo-user') || 'null');
            this.user = (userData && typeof userData === 'object') ? userData : { userId: 0, email: '', name: '' };
          } catch (e) {
            this.user = { userId: 0, email: '', name: '' };
          }
        }
      } catch (e) {
        console.error('syncFromStorage error:', e);
      }
    },
  },
});

/* 함수형 유틸리티 제공 */
window.getFoAuthStore = () => {
  try {
    const store = window.useFoAuthStore?.();
    return store || {
      token: '',
      user: { userId: 0, email: '', name: '' },
      isLoggedIn: false,
    };
  } catch (e) {
    console.error('getFoAuthStore error:', e);
    return {
      token: '',
      user: { userId: 0, email: '', name: '' },
      isLoggedIn: false,
    };
  }
};

window.getFoAuthUser = () => {
  try {
    const store = window.useFoAuthStore?.();
    return (store?.user || { userId: 0, email: '', name: '' });
  } catch (e) {
    console.error('getFoAuthUser error:', e);
    return { userId: 0, email: '', name: '' };
  }
};

window.getFoAuthToken = () => {
  try {
    const store = window.useFoAuthStore?.();
    return (store?.token || '');
  } catch (e) {
    console.error('getFoAuthToken error:', e);
    return '';
  }
};

window.isFoAuthLoggedIn = () => {
  try {
    const store = window.useFoAuthStore?.();
    return !!(store?.token && store?.user && store.user.userId);
  } catch (e) {
    console.error('isFoAuthLoggedIn error:', e);
    return false;
  }
};

window.isFoLogin = () => {
  try {
    const store = window.useFoAuthStore?.();
    if (!store?.user) return false;
    const userId = store.user.userId || store.user.memberId;
    return userId && String(userId).length > 3;
  } catch (e) {
    console.error('isFoLogin error:', e);
    return false;
  }
};
