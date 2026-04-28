/**
 * API 헤더 헬퍼 함수
 * - X-UI-Nm (화면명) + X-Cmd-Nm (기능명) 자동 생성
 * - 모든 boApi/foApi 호출에서 사용
 *
 * 사용법:
 *   boApi.get('/path', apiHdr('회원관리', '목록조회'))
 *   boApi.post('/path', data, apiHdr('상품관리', '저장'))
 *   foApi.get('/path', apiHdr('장바구니', '조회'))
 */
(function (global) {
  'use strict';

  function apiHdr(uiNm, cmdNm) {
    if (!uiNm || !cmdNm) {
      console.warn('[apiHdr] Missing required parameters: uiNm or cmdNm', { uiNm, cmdNm });
    }
    return {
      headers: {
        'X-UI-Nm': uiNm || '',
        'X-Cmd-Nm': cmdNm || '',
      },
    };
  }

  global.apiHdr = global.apiHdr || apiHdr;
})(typeof window !== 'undefined' ? window : this);
