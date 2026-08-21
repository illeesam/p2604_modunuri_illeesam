/**
 * FO 전용 유틸 — 공통 유틸은 coUtil 로 이동.
 * - codesByGroup / codesByGroupOrStringList / codesByGroupOrRows / listImgSrc
 *   → coUtil.* 로 통합 (FO/BO 공통)
 * - useAppCodeReady 폐기(2026-07-30) → 코드는 fnLoadCodes 의 saLoadCodes 로 지연 로딩
 *
 * 본 파일은 FO 전용 함수만 둔다. 현재는 통합 후 비어있으며,
 * window.foUtil 네임스페이스 자체는 다른 모듈이 참조할 수 있어 유지.
 */
(function (global) {
  'use strict';

  global.foUtil = global.foUtil || {};

  /* fofSetPageMeta / fofResetPageMeta — 라우트(상품상세 등)별 document.title·meta description
     동적 교체. 구글봇은 JS 실행 후 최종 DOM을 읽으므로(해시 라우팅이라 URL 자체는 여전히
     동일하게 취급되지만) 렌더된 title/description 은 반영된다. 순수 클라이언트 DOM 조작이라
     JS 를 안 돌리는 카톡/페이스북 미리보기 봇에는 효과 없음(그건 백엔드 쪽 별도 대응 필요) */
  var _defaultTitle = null;
  var _defaultDesc  = null;

  function _descTag() {
    var el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'description');
      document.head.appendChild(el);
    }
    return el;
  }

  /** 페이지 진입 시 title/description 을 지정 값으로 교체. description 없으면 title만 바꾼다 */
  global.foUtil.fofSetPageMeta = function (opts) {
    opts = opts || {};
    if (_defaultTitle === null) _defaultTitle = document.title;
    var descEl = _descTag();
    if (_defaultDesc === null) _defaultDesc = descEl.getAttribute('content') || '';
    if (opts.title) document.title = opts.title;
    if (opts.description) descEl.setAttribute('content', opts.description);
  };

  /** 페이지 이탈 시 사이트 공통 title/description 으로 복원 */
  global.foUtil.fofResetPageMeta = function () {
    if (_defaultTitle !== null) document.title = _defaultTitle;
    if (_defaultDesc !== null) _descTag().setAttribute('content', _defaultDesc);
  };

})(typeof window !== 'undefined' ? window : globalThis);
