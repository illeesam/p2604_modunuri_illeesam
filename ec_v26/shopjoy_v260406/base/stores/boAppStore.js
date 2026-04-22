/**
 * BO 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보 관리
 */
window.useBoAppStore = Pinia.defineStore('boApp', {
  state: () => {
    return {
      boSiteNo: '01',
      appVersion: '2.6.0',
      lastUpdateDate: '',
    };
  },

  getters: {
    getAppVersion: (s) => s.appVersion, // 앱 버전
    getBoSiteNo: (s) => s.boSiteNo, // BO 사이트 번호
    getLastUpdateDate: (s) => s.lastUpdateDate, // 마지막 업데이트 날짜
  },

  actions: {
    /**
     * 앱 정보 설정
     */
    setApp(appData) {
      if (appData) {
        this.boSiteNo = appData.boSiteNo || '01';
        this.appVersion = appData.appVersion || '2.6.0';
        this.lastUpdateDate = appData.lastUpdateDate || '';
      }
    },

    /**
     * 앱 버전 업데이트
     */
    setAppVersion(version) {
      if (version) {
        this.appVersion = version;
      }
    },

    /**
     * BO 사이트 번호 업데이트
     */
    setBoSiteNo(siteNo) {
      if (siteNo) {
        this.boSiteNo = siteNo;
      }
    },

    /**
     * 마지막 업데이트 날짜 업데이트
     */
    setLastUpdateDate(date) {
      if (date) {
        this.lastUpdateDate = date;
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.boSiteNo = '01';
      this.appVersion = '2.6.0';
      this.lastUpdateDate = '';
    },
  },
});

// 함수형 유틸리티 제공
window.getBoAppStore = () => {
  try {
    return window.useBoAppStore?.() || {
      boSiteNo: '01',
      appVersion: '2.6.0',
      lastUpdateDate: '',
    };
  } catch (e) {
    console.error('[getBoAppStore] error:', e);
    return {
      boSiteNo: '01',
      appVersion: '2.6.0',
      lastUpdateDate: '',
    };
  }
};
