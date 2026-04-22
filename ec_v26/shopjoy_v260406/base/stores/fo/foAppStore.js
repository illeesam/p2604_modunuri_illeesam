/**
 * FO (Front Office) 앱 정보 Pinia 스토어
 */
window.useFoAppStore = Pinia.defineStore('foApp', {
  state: () => {
    return {
      app: {
        foSiteNo: '01',
        appVersion: '2.6.0',
        lastUpdateDate: '',
      },
    };
  },

  actions: {
    setApp(appData) {
      if (appData) {
        this.app = {
          foSiteNo: appData.foSiteNo || '01',
          appVersion: appData.appVersion || '2.6.0',
          lastUpdateDate: appData.lastUpdateDate || '',
        };
      }
    },

    setAppVersion(version) {
      if (version) {
        this.app.appVersion = version;
      }
    },

    setFoSiteNo(siteNo) {
      if (siteNo) {
        this.app.foSiteNo = siteNo;
      }
    },

    setLastUpdateDate(date) {
      if (date) {
        this.app.lastUpdateDate = date;
      }
    },

    clear() {
      this.app = {
        foSiteNo: '01',
        appVersion: '2.6.0',
        lastUpdateDate: '',
      };
    },
  },
});
