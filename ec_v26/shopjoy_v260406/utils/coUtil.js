/**
 * 공통 유틸 함수 - API 헤더 자동 생성
 * - 필수: X-UI-Nm (화면명) + X-Cmd-Nm (기능명)
 * - 자동: X-File-Nm, X-Func-Nm, X-Line-No, X-Trace-Id, X-User-Agent, X-License-No
 * - 자동 조회: X-User-Id, X-Site-Id, X-Site-No (필요시 옵션으로 오버라이드)
 *
 * 사용법:
 *   ✅ 기본 (자동으로 파일명, 함수명, 라인번호, TraceId, 라이센스 생성)
 *   boApi.get('/path', coUtil.apiHdr('회원관리', '목록조회'))
 *
 *   ✅ 사용자/사이트 정보 오버라이드
 *   boApi.post('/path', data, coUtil.apiHdr('상품관리', '저장', { userId: 'user-001', siteId: 'SITE-001', siteNo: '01' }))
 *
 *   ✅ 커스텀 TraceId (기본: 자동 생성)
 *   boApi.get('/path', coUtil.apiHdr('주문관리', '조회', { traceId: 'custom-trace-123' }))
 */
(function (global) {
  'use strict';

  // ====== 내부 헬퍼 객체 (격리된 인터페이스) ======
  const apiInfo = {
    // TraceId 생성: YYYYMMDD_hhmmss_rand4
    generateTraceId() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return `${yyyy}${mm}${dd}_${hh}${min}${ss}_${rand}`;
    },

    // 클라이언트 정보 수집
    getClientInfo() {
      return {
        userAgent: navigator.userAgent || '',
        ipAddr: '', // 클라이언트에서 직접 IP 취득 불가 → 서버에서 요청 헤더로 취득
      };
    },

    // 호출 스택에서 파일명, 함수명, 라인번호 추출 (coUtil.js 프레임 모두 건너뜀)
    extractCallerInfo() {
      try {
        const stack = new Error().stack.split('\n');
        // 내부 라이브러리 프레임을 건너뛰고 실제 업무 컴포넌트 프레임을 찾음
        const SKIP = ['coUtil.js', 'vue.global', 'axios.min.js', 'boApiAxios.js', 'foApiAxios.js', 'pinia.iife.js', '<anonymous>'];
        let callerLine = '';
        for (let i = 1; i < stack.length; i++) {
          const line = stack[i] || '';
          if (SKIP.some(s => line.includes(s))) continue;
          // .js 파일명이 있는 프레임만 유효
          if (!line.match(/[a-zA-Z0-9_-]+\.js/)) continue;
          callerLine = line;
          break;
        }

        // 파일명 추출
        const fileMatch = callerLine.match(/([a-zA-Z0-9_-]+\.js)/);
        const fileNm = fileMatch ? fileMatch[1] : '';

        // 함수명 추출
        const funcMatch = callerLine.match(/at\s+(?:Object\.)?([a-zA-Z0-9_$.<>]+)\s+/);
        let funcNm = funcMatch ? funcMatch[1] : '';
        if (funcNm === '<anonymous>' || funcNm === 'eval') funcNm = '';

        // 라인 번호 추출
        const lineMatch = callerLine.match(/:(\d+):\d+[\)$]/);
        const lineNo = lineMatch ? lineMatch[1] : '';

        return { fileNm, funcNm, lineNo };
      } catch (e) {
        return { fileNm: '', funcNm: '', lineNo: '' };
      }
    },

    // 사용자 정보 조회 (로그인된 사용자)
    getCurrentUser() {
      try {
        // BO: useBoAuthStore
        const boAuth = global.useBoAuthStore?.();
        if (boAuth?.svAuthUser?.authId) {
          return boAuth.svAuthUser.authId;
        }
        // FO: useFoAuthStore
        const foAuth = global.useFoAuthStore?.();
        if (foAuth?.svAuthUser?.authId) {
          return foAuth.svAuthUser.authId;
        }
      } catch (e) {}
      return '';
    },

    // 사이트 ID 조회 (DB 사이트 아이디)
    getCurrentSiteId() {
      try {
        // BO: useBoConfigStore
        const boConfig = global.useBoConfigStore?.();
        if (boConfig?.svSiteId) {
          return boConfig.svSiteId;
        }
      } catch (e) {}
      return '';
    },

    // 사이트 번호 조회 (사이트 구분 번호: 01/02/03)
    getCurrentSiteNo() {
      try {
        // BO: useBoConfigStore
        const boConfig = global.useBoConfigStore?.();
        if (boConfig?.svSiteNo) {
          return boConfig.svSiteNo;
        }
        // FO: FRONT_SITE_NO
        if (global.FRONT_SITE_NO) {
          return global.FRONT_SITE_NO;
        }
      } catch (e) {}
      return '';
    },

    // 라이센스 번호 조회
    getCurrentLicenseNo() {
      try {
        // BO: useBoConfigStore
        const boConfig = global.useBoConfigStore?.();
        if (boConfig?.svLicenseNo) {
          return boConfig.svLicenseNo;
        }
        // localStorage에서 조회 (설정값)
        const storedLicense = localStorage.getItem('modu-license-no');
        if (storedLicense) {
          return storedLicense;
        }
        // window.LICENSE_NO
        if (global.LICENSE_NO) {
          return global.LICENSE_NO;
        }
      } catch (e) {}
      return '';
    },
  };

  // ====== 공개 API ======
  function apiHdr(uiNm, cmdNm, options = {}) {
    if (!uiNm || !cmdNm) {
      console.warn('[coUtil.apiHdr] Missing required parameters: uiNm or cmdNm', { uiNm, cmdNm });
    }

    // 필수 헤더
    const headers = {
      'X-UI-Nm': uiNm || '',
      'X-Cmd-Nm': cmdNm || '',
    };

    // 자동 수집: 호출 정보
    const callerInfo = apiInfo.extractCallerInfo();
    if (callerInfo.fileNm) {
      headers['X-File-Nm'] = callerInfo.fileNm;
    }
    if (callerInfo.funcNm) {
      headers['X-Func-Nm'] = callerInfo.funcNm;
    }
    if (callerInfo.lineNo) {
      headers['X-Line-No'] = callerInfo.lineNo;
    }

    // 자동 생성: TraceId (커스텀 값이 없을 때만)
    headers['X-Trace-Id'] = options.traceId || apiInfo.generateTraceId();

    // 자동 수집: 클라이언트 정보
    const clientInfo = apiInfo.getClientInfo();
    if (clientInfo.userAgent) {
      headers['X-User-Agent'] = clientInfo.userAgent;
    }

    // 서버에서 IP를 요청 헤더로 수집하므로, 여기서는 설정하지 않음
    // (클라이언트는 직접 IP 취득 불가)

    // 자동 수집: 사용자 정보 (옵션으로 오버라이드 가능)
    const userId = options.userId || apiInfo.getCurrentUser();
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    // 자동 수집: 사이트 ID (DB 사이트 아이디)
    const siteId = options.siteId || apiInfo.getCurrentSiteId();
    if (siteId) {
      headers['X-Site-Id'] = siteId;
    }

    // 자동 수집: 사이트 NO (사이트 구분 번호: 01/02/03)
    const siteNo = options.siteNo || apiInfo.getCurrentSiteNo();
    if (siteNo) {
      headers['X-Site-No'] = siteNo;
    }

    // 자동 수집: 라이센스 번호
    const licenseNo = options.licenseNo || apiInfo.getCurrentLicenseNo();
    if (licenseNo) {
      headers['X-License-No'] = licenseNo;
    }

    return { headers };
  }

  // 디버깅용: 호출자 정보 반환
  function getCallerInfo() {
    const callerInfo = apiInfo.extractCallerInfo();
    const clientInfo = apiInfo.getClientInfo();
    return {
      ...callerInfo,
      userAgent: clientInfo.userAgent,
      userId: apiInfo.getCurrentUser(),
      siteId: apiInfo.getCurrentSiteId(),
      siteNo: apiInfo.getCurrentSiteNo(),
      licenseNo: apiInfo.getCurrentLicenseNo(),
      traceId: apiInfo.generateTraceId(),
    };
  }

  // 공개 API: window.coUtil 에 등록
  global.coUtil = global.coUtil || {};
  global.coUtil.apiHdr = global.coUtil.apiHdr || apiHdr;
  global.coUtil.getCallerInfo = global.coUtil.getCallerInfo || getCallerInfo;
  global.coUtil.generateTraceId = global.coUtil.generateTraceId || (() => apiInfo.generateTraceId());
  global.coUtil.apiInfo = global.coUtil.apiInfo || apiInfo;
})(typeof window !== 'undefined' ? window : this);
