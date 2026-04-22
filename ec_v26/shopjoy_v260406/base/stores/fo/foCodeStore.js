/**
 * FO (Front Office) 공통 코드 Pinia 스토어 (그리드 형식)
 */
window.useFoCodeStore = Pinia.defineStore('foCode', {
  state: () => {
    return {
      codes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
    };
  },

  actions: {
    setCodes(codesData) {
      console.log('[foCodeStore.setCodes] called with:', codesData);
      console.log('[foCodeStore.setCodes] isArray?', Array.isArray(codesData));
      console.log('[foCodeStore.setCodes] length?', codesData?.length);
      if (codesData) {
        this.codes = Array.isArray(codesData) ? codesData : [];
        console.log('[foCodeStore.setCodes] after assignment, this.codes:', this.codes);
      } else {
        console.log('[foCodeStore.setCodes] codesData is falsy!');
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
      this.codes = [];
    },
  },
});
