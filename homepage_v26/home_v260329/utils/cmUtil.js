/**
 * 공통 유틸 — 각 homepage_v26 앱에서 동일 API로 사용합니다.
 * @see window.cmUtil
 */
(function (global) {
  'use strict';

  function codesByGroup(config, grp) {
    var codes = (config && config.codes) || [];
    return codes
      .filter(function (c) {
        return c.code_grp === grp;
      })
      .sort(function (a, b) {
        return (a.code_id || 0) - (b.code_id || 0);
      });
  }

  /** codes에 행이 있으면 사용, 없으면 문자열 배열을 code 행으로 변환 */
  function codesByGroupOrStringList(config, grp, fallbackStrings) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    if (!fallbackStrings || !fallbackStrings.length) return [];
    return fallbackStrings.map(function (x, i) {
      return { code_id: i + 1, code_grp: grp, code_value: x, code_label: x };
    });
  }

  /** codes 우선, 없으면 fallbackRows 그대로 */
  function codesByGroupOrRows(config, grp, fallbackRows) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    return fallbackRows && fallbackRows.length ? fallbackRows : [];
  }

  /** codes 우선, 없으면 config.solutions[].title */
  function codesByGroupOrSolutionTitles(config, grp) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    var sol = (config && config.solutions) || [];
    return sol.map(function (s) {
      return { code_id: s.id, code_value: s.title, code_label: s.title };
    });
  }

  /** 리스트 썸네일 (utils/imageThumb.js 가 선로드된 경우) */
  function listImgSrc(src) {
    return typeof global.imageThumbnailSrc === 'function' ? global.imageThumbnailSrc(src) : src;
  }

  global.cmUtil = {
    codesByGroup: codesByGroup,
    codesByGroupOrStringList: codesByGroupOrStringList,
    codesByGroupOrRows: codesByGroupOrRows,
    codesByGroupOrSolutionTitles: codesByGroupOrSolutionTitles,
    listImgSrc: listImgSrc,
  };
})(typeof window !== 'undefined' ? window : globalThis);
