/**
 * 공통 유틸 — 각 homepage_v26 앱에서 동일 API로 사용합니다.
 * @see window.cmUtil
 */
(function (global) {
  'use strict';

  function fallbackStringList(fallback) {
    if (!fallback || !fallback.length) return [];
    var first = fallback[0];
    if (typeof first === 'string') return fallback;
    if (first && first.hospitalName != null) return fallback.map(function (x) { return x.hospitalName; });
    if (first && first.departmentName != null) return fallback.map(function (x) { return x.departmentName; });
    return [];
  }

  function codesByGroup(config, grp) {
    var codes = (config && config.codes) || [];
    return codes
      .filter(function (c) {
        return c.codeGrp === grp;
      })
      .sort(function (a, b) {
        return (a.codeId || 0) - (b.codeId || 0);
      });
  }

  /** codes에 행이 있으면 사용, 없으면 문자열·hospital/department 객체 배열을 code 행으로 변환 */
  function codesByGroupOrStringList(config, grp, fallbackStrings) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    var list = fallbackStringList(fallbackStrings);
    if (!list.length) return [];
    return list.map(function (x, i) {
      return { codeId: i + 1, codeGrp: grp, codeValue: x, codeLabel: x };
    });
  }

  /** codes 우선, 없으면 fallbackRows 그대로 */
  function codesByGroupOrRows(config, grp, fallbackRows) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    return fallbackRows && fallbackRows.length ? fallbackRows : [];
  }

  /** codes 우선, 없으면 config.solutions[].solutionName */
  function codesByGroupOrSolutionTitles(config, grp) {
    var rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    var sol = (config && config.solutions) || [];
    return sol.map(function (s) {
      var sid = s.solutionId != null ? s.solutionId : s.id;
      var sn = s.solutionName != null ? s.solutionName : s.title;
      return { codeId: sid, codeGrp: grp, codeValue: sn, codeLabel: sn };
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
