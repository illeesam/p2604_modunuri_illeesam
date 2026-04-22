/**
 * FO (Front Office) 공통 코드 Pinia 스토어
 */
window.useFoCodeStore = Pinia.defineStore('foCode', {
  state: () => {
    return {
      codes: {},
    };
  },

  actions: {
    setCodes(codesData) {
      if (codesData) {
        this.codes = codesData;
      }
    },

    addCodeGrp(grp, codeList) {
      if (grp && codeList) {
        this.codes[grp] = codeList;
      }
    },

    addCode(grp, code) {
      if (grp && code) {
        if (!this.codes[grp]) {
          this.codes[grp] = [];
        }
        this.codes[grp].push(code);
      }
    },

    updateCode(grp, codeId, code) {
      if (grp && this.codes[grp]) {
        const idx = this.codes[grp].findIndex(c => c.id === codeId);
        if (idx >= 0) {
          this.codes[grp][idx] = { ...this.codes[grp][idx], ...code };
        }
      }
    },

    removeCode(grp, codeId) {
      if (grp && this.codes[grp]) {
        const idx = this.codes[grp].findIndex(c => c.id === codeId);
        if (idx >= 0) {
          this.codes[grp].splice(idx, 1);
        }
      }
    },

    removeCodeGrp(grp) {
      if (grp) {
        delete this.codes[grp];
      }
    },

    clear() {
      this.codes = {};
    },
  },
});
