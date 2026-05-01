/**
 * FO (Front Office) 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보, 환경 관리
 */
window.useFoAppStore = Pinia.defineStore('foApp', {
  state: () => {
    return {
      svFoSiteNo: '01',
      svAppVersion: '2.6.0',
      svLastUpdateDate: '',
      svActive: '-',
    };
  },

  getters: {
    sgGetAppVersion: (s) => s.svAppVersion,
    sgGetFoSiteNo: (s) => s.svFoSiteNo,
    sgGetLastUpdateDate: (s) => s.svLastUpdateDate,
    sgGetActive: (s) => s.svActive,
  },

  actions: {
    /**
     * 앱 정보 설정
     */
    saSetApp(appData) {
      if (appData) {
        this.svFoSiteNo = appData.foSiteNo || '01';
        this.svAppVersion = appData.appVersion || '2.6.0';
        this.svLastUpdateDate = appData.lastUpdateDate || '';
        this.svActive = appData.active || '-';
      }
    },

    /**
     * 앱 버전 업데이트
     */
    saSetAppVersion(version) {
      if (version) {
        this.svAppVersion = version;
      }
    },

    /**
     * FO 사이트 번호 업데이트
     */
    saSetFoSiteNo(siteNo) {
      if (siteNo) {
        this.svFoSiteNo = siteNo;
      }
    },

    /**
     * 마지막 업데이트 날짜 업데이트
     */
    saSetLastUpdateDate(date) {
      if (date) {
        this.svLastUpdateDate = date;
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    saClear() {
      this.svFoSiteNo = '01';
      this.svAppVersion = '2.6.0';
      this.svLastUpdateDate = '';
      this.svActive = '-';
    },
  },
});
