/**
 * 공통 유틸 — 각 ec_v26 앱에서 동일 API로 사용합니다.
 * @see window.cmUtil
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

  global.cmUtil = {
    codesByGroup: codesByGroup,
    codesByGroupOrStringList: codesByGroupOrStringList,
    codesByGroupOrRows: codesByGroupOrRows,
    listImgSrc: listImgSrc,
  };
})(typeof window !== 'undefined' ? window : globalThis);
