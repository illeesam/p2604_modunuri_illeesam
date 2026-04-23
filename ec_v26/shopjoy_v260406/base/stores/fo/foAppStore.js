/**
 * FO (Front Office) 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보, 환경 관리
 */
window.useFoAppStore = Pinia.defineStore('foApp', {
  state: () => {
    return {
      foSiteNo: '01',
      appVersion: '2.6.0',
      lastUpdateDate: '',
      active: '-',
    };
  },

  getters: {
    getAppVersion: (s) => s.appVersion,
    getFoSiteNo: (s) => s.foSiteNo,
    getLastUpdateDate: (s) => s.lastUpdateDate,
    getActive: (s) => s.active,
  },

  actions: {
    /**
     * 앱 정보 설정
     */
    setApp(appData) {
      if (appData) {
        this.foSiteNo = appData.foSiteNo || '01';
        this.appVersion = appData.appVersion || '2.6.0';
        this.lastUpdateDate = appData.lastUpdateDate || '';
        this.active = appData.active || '-';
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
     * FO 사이트 번호 업데이트
     */
    setFoSiteNo(siteNo) {
      if (siteNo) {
        this.foSiteNo = siteNo;
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
      this.foSiteNo = '01';
      this.appVersion = '2.6.0';
      this.lastUpdateDate = '';
      this.active = '-';
    },
  },
});
