/**
 * 공통 유틸 함수
 * - X-UI-Nm (화면명) + X-Cmd-Nm (기능명) 자동 생성
 * - 모든 boApi/foApi 호출에서 사용
 *
 * 사용법:
 *   boApi.get('/path', coUtil.apiHdr('회원관리', '목록조회'))
 *   boApi.post('/path', data, coUtil.apiHdr('상품관리', '저장'))
 *   foApi.get('/path', coUtil.apiHdr('장바구니', '조회'))
 */
(function (global) {
  'use strict';

  function apiHdr(uiNm, cmdNm) {
    if (!uiNm || !cmdNm) {
      console.warn('[coUtil.apiHdr] Missing required parameters: uiNm or cmdNm', { uiNm, cmdNm });
    }
    return {
      headers: {
        'X-UI-Nm': uiNm || '',
        'X-Cmd-Nm': cmdNm || '',
      },
    };
  }

  global.coUtil = global.coUtil || {};
  global.coUtil.apiHdr = global.coUtil.apiHdr || apiHdr;
})(typeof window !== 'undefined' ? window : this);
