/**
 * FO 전용 유틸 — 공통 유틸은 coUtil 로 이동.
 * - codesByGroup / codesByGroupOrStringList / codesByGroupOrRows / listImgSrc
 *   → coUtil.* 로 통합 (FO/BO 공통)
 * - useAppCodeReady → coUtil.cofUseAppCodeReady 로 통합
 *
 * 본 파일은 FO 전용 함수만 둔다. 현재는 통합 후 비어있으며,
 * window.foUtil 네임스페이스 자체는 다른 모듈이 참조할 수 있어 유지.
 */
(function (global) {
  'use strict';

  global.foUtil = global.foUtil || {};

})(typeof window !== 'undefined' ? window : globalThis);
