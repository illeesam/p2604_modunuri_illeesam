/**
 * BO 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보 관리
 */
window.useBoAppStore = Pinia.defineStore('boApp', {
  state: () => ({
    svBoSiteNo: '01',
    svAppVersion: '2.6.0',
    svLastUpdateDate: '',
    svActive: '-',
  }),

  getters: {
    svGetAppVersion: (s) => s.svAppVersion, // 앱 버전
    svGetBoSiteNo: (s) => s.svBoSiteNo, // BO 사이트 번호
    svGetLastUpdateDate: (s) => s.svLastUpdateDate, // 마지막 업데이트 날짜
    svGetActive: (s) => s.svActive, // 활성 환경 (local/dev/prod)
  },

  actions: {
    /**
     * 앱 정보 설정
     */
    sfSetApp(appData) {
      if (appData) {
        this.svBoSiteNo = appData.boSiteNo || '01';
        this.svAppVersion = appData.appVersion || '2.6.0';
        this.svLastUpdateDate = appData.lastUpdateDate || '';
        this.svActive = appData.active || '-';
      }
    },

    /**
     * 앱 버전 업데이트
     */
    sfSetAppVersion(version) {
      if (version) {
        this.svAppVersion = version;
      }
    },

    /**
     * BO 사이트 번호 업데이트
     */
    sfSetBoSiteNo(siteNo) {
      if (siteNo) {
        this.svBoSiteNo = siteNo;
      }
    },

    /**
     * 마지막 업데이트 날짜 업데이트
     */
    sfSetLastUpdateDate(date) {
      if (date) {
        this.svLastUpdateDate = date;
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    sfClear() {
      this.svBoSiteNo = '01';
      this.svAppVersion = '2.6.0';
      this.svLastUpdateDate = '';
      this.svActive = '-';
    },
  },
});

// 함수형 유틸리티 제공
window.getBoAppStore = () => {
  try {
    return window.useBoAppStore?.() || {
      svBoSiteNo: '01',
      svAppVersion: '2.6.0',
      svLastUpdateDate: '',
      svActive: '-',
    };
  } catch (e) {
    console.error('[getBoAppStore] error:', e);
    return {
      svBoSiteNo: '01',
      svAppVersion: '2.6.0',
      svLastUpdateDate: '',
      svActive: '-',
    };
  }
};
