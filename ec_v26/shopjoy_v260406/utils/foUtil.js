/**
 * 공통 유틸 — 각 ec_v26 앱에서 동일 API로 사용합니다.
 * @see foUtil
 */
(function (global) {
  'use strict';

  function codesByGroup(config, grp) {
    var codes = (config && config.codes) || [];
    return codes
      .filter(function (c) { return c.codeGrp === grp; })
      .sort(function (a, b) { return (a.codeId || 0) - (b.codeId || 0); });
  }

  function codesByGroupOrStringList(config, grp, fallbackStrings) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    var list = (fallbackStrings || []).filter(function (x) { return typeof x === 'string'; });
    return list.map(function (x, i) {
      return { codeId: i + 1, codeGrp: grp, codeValue: x, codeLabel: x };
    });
  }

  function codesByGroupOrRows(config, grp, fallbackRows) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    return fallbackRows && fallbackRows.length ? fallbackRows : [];
  }

  function listImgSrc(src) {
    return typeof global.imageThumbnailSrc === 'function' ? global.imageThumbnailSrc(src) : src;
  }

  global.foUtil = {
    codesByGroup: codesByGroup,
    codesByGroupOrStringList: codesByGroupOrStringList,
    codesByGroupOrRows: codesByGroupOrRows,
    listImgSrc: listImgSrc,
  };

  /* ── 공통 코드 로드 헬퍼 ──
   * setup() 안에서 호출. watch(isAppReady) 등록 + isAppReady computed 반환.
   * 무한 refresh 방지:
   *   - fnLoadCodes 가 throw 해도 uiState.isPageCodeLoad 를 반드시 true 로 설정
   *   - 1회 성공 후 watch 자동 stop (재마운트 시까지 재호출 차단)
   * 사용법:
   *   const isAppReady = foUtil.useAppCodeReady(uiState, fnLoadCodes);
   *   onMounted(() => { if (isAppReady.value) fnLoadCodes(); ... });
   */
  global.foUtil.useAppCodeReady = function(uiState, fnLoadCodes) {
    var computed = Vue.computed, watch = Vue.watch;
    var isAppReady = computed(function() {
      var i = window.useFoAppInitStore?.();
      var c = window.useFoCodeStore?.();
      return !i?.svIsLoading && c?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });
    var _called = false;
    var stop = watch(isAppReady, function(v) {
      if (!v || _called) return;
      _called = true;
      try { fnLoadCodes(); }
      catch (err) { console.error('[useAppCodeReady] fnLoadCodes failed:', err); }
      finally {
        try { uiState.isPageCodeLoad = true; } catch (_) {}
        try { if (stop) stop(); } catch (_) {}
      }
    });
    return isAppReady;
  };
})(typeof window !== 'undefined' ? window : globalThis);
