/**
 * BO 관리자 정보 Pinia 스토어
 * - 로그인한 관리자 정보 관리
 * - localStorage 동기화
 */
window.useBoUserStore = Pinia.defineStore('boUser', {
  state: () => {
    return {
      user: {
        userId: '',
        userName: '',
        userEmail: '',
        userHpNo: '',
        deptId: '',
        deptNm: '',
        roleId: '',
        roleNm: '',
        userStatusCd: '',
        userTypeCd: '', // BO:관리자, FO:회원, SO:판매자, DO:배달, CO:고객사용자
        isAdminYn: 'N',
        companyId: '',
        companyNm: '',
        boBookmarks: '',
      },
    };
  },

  getters: {
    isInitialized: (s) => !!(s.user && s.user.userId),
    currentUser: (s) => s.user || {},
  },

  actions: {
    /**
     * 관리자 정보 업데이트
     */
    setUser(userData) {
      if (userData) {
        this.user = {
          userId: userData.userId || '',
          userName: userData.userName || '',
          userEmail: userData.userEmail || '',
          userHpNo: userData.userHpNo || '',
          deptId: userData.deptId || '',
          deptNm: userData.deptNm || '',
          roleId: userData.roleId || '',
          roleNm: userData.roleNm || '',
          userStatusCd: userData.userStatusCd || '',
          userTypeCd: userData.userTypeCd || '',
          isAdminYn: userData.isAdminYn || 'N',
          companyId: userData.companyId || '',
          companyNm: userData.companyNm || '',
          boBookmarks: userData.boBookmarks || '',
        };

        try {
          localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
        } catch (e) {
          console.error('[boUserStore] setUser localStorage error:', e);
        }
      }
    },

    /**
     * 관리자 정보 일부 업데이트
     */
    updateUser(userData) {
      if (userData) {
        this.user = {
          ...this.user,
          ...userData,
        };

        try {
          localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
        } catch (e) {
          console.error('[boUserStore] updateUser localStorage error:', e);
        }
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.user = {
        userId: '',
        userName: '',
        userEmail: '',
        userHpNo: '',
        deptId: '',
        deptNm: '',
        roleId: '',
        roleNm: '',
        userStatusCd: '',
        userTypeCd: '',
        isAdminYn: 'N',
        companyId: '',
        companyNm: '',
        boBookmarks: '',
      };

      try {
        localStorage.removeItem('modu-bo-user');
      } catch (e) {
        console.error('[boUserStore] clear localStorage error:', e);
      }
    },

    /**
     * localStorage에서 복원
     */
    restoreFromStorage() {
      try {
        const userJson = localStorage.getItem('modu-bo-user');
        if (userJson) {
          this.user = JSON.parse(userJson);
          return true;
        }
      } catch (e) {
        console.error('[boUserStore] restoreFromStorage error:', e);
      }
      return false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoUserStore = () => {
  try {
    return window.useBoUserStore?.() || {
      user: {},
      isInitialized: false,
      currentUser: {},
    };
  } catch (e) {
    console.error('[getBoUserStore] error:', e);
    return {
      user: {},
      isInitialized: false,
      currentUser: {},
    };
  }
};
