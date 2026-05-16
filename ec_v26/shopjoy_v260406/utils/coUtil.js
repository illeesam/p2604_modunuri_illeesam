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
        const SKIP = ['coUtil.js', 'vue.global', 'axios.min.js', 'boApiAxios.js', 'foApiAxios.js', 'coApiSvc.js', 'boApiSvc.js', 'foApiSvc.js', 'pinia.iife.js', '<anonymous>'];
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

  /**
   * API 호출 전 _id 검증 유틸
   *
   * _id 가 null/undefined/빈문자열이면 toast 출력 후 rejected Promise 반환.
   * 정상이면 null 반환 → 호출부에서 `chkId(...) || api.xxx(...)` 패턴으로 사용.
   *
   * 사용법 (boApiSvc.js / coApiSvc.js / foApiSvc.js 내부):
   *   getById(_id, uiNm, cmdNm) {
   *     return coUtil.chkId(_id, uiNm, cmdNm) || global.boApi.get(`/path/${_id}`, hdr(uiNm, cmdNm));
   *   }
   */
  function chkId(_id, uiNm, cmdNm) {
    if (_id != null && _id !== '') return null;
    const label = [uiNm, cmdNm].filter(Boolean).join(' > ');
    const msg = `[${label || 'API'}] ID 값이 없습니다.`;
    const toast = global.boApp?.showToast || global.foApp?.showToast;
    if (toast) toast(msg, 'error');
    else console.error(msg);
    return Promise.reject(new Error(msg));
  }

  /**
   * saveList rows 에서 U/D rowStatus 인 행에 ID 가 없으면 toast 출력 후 rejected Promise 반환.
   * idKey : 각 row 에서 ID 를 담고 있는 프로퍼티 이름 (예: 'gradeId', 'batchId' …)
   *
   * 사용법:
   *   saveList(rows, uiNm, cmdNm) {
   *     return coUtil.chkRowIds(rows, 'gradeId', uiNm, cmdNm) ||
   *            global.boApi.post('/path/save-list', rows, hdr(uiNm, cmdNm));
   *   }
   */
  function chkRowIds(rows, idKey, uiNm, cmdNm) {
    const bad = (rows || []).filter(r => (r.rowStatus === 'U' || r.rowStatus === 'D') && !r[idKey]);
    if (!bad.length) return null;
    const label = [uiNm, cmdNm].filter(Boolean).join(' > ');
    /* row 안의 실제 'Id'/'id' 로 끝나는 키 후보 수집 — 키 미스매치 디버깅용 */
    const idCandidates = Array.from(new Set(
      bad.flatMap(r => Object.keys(r || {}).filter(k => /Id$|_id$/.test(k)))
    ));
    const hint = idCandidates.length
      ? ` (row 의 실제 ID 후보 키: ${idCandidates.join(', ')})`
      : '';
    const msg = `[${label || 'saveList'}] ${bad.length}건 행에 ID(${idKey})가 없습니다.${hint}`;
    /* 상세: 문제 행을 JSON 으로 함께 노출 */
    let details = '';
    try { details = JSON.stringify(bad, null, 2); } catch (_) { details = String(bad); }
    const toast = global.boApp?.showToast || global.foApp?.showToast;
    if (toast) toast(msg, 'error', 0, details);
    else console.error(msg, '\n', details);
    return Promise.reject(new Error(msg + '\n' + details));
  }

  /**
   * 비밀번호 SHA256 해시 (SubtleCrypto 사용 — 외부 라이브러리 불필요)
   * @param {string} plain 평문 비밀번호
   * @returns {Promise<string>} 소문자 hex 문자열 (64자)
   */
  async function sha256(plain) {
    if (window.CryptoJS) return CryptoJS.SHA256(plain).toString();
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 공통 코드 로드 헬퍼 (FO/BO 공통)
   * - setup() 안에서 호출. watch(isAppReady) 등록 + isAppReady computed 반환.
   * - 무한 refresh 방지:
   *   - fnLoadCodes 가 throw 해도 uiState.isPageCodeLoad 를 반드시 true 로 설정
   *   - 1회 성공 후 watch 자동 stop (재마운트 시까지 재호출 차단)
   *   - 컴포넌트 unmount 시 watch 명시 정리
   * - 사이트 자동 판별 (FO/BO):
   *   - useFoAppInitStore / useFoCodeStore  존재 → FO
   *   - useBoAppInitStore / sfGetBoCodeStore 존재 → BO
   *
   * 사용법:
   *   const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);
   *   onMounted(() => { if (isAppReady.value) fnLoadCodes(); ... });
   */
  function useAppCodeReady(uiState, fnLoadCodes) {
    const { computed, watch, onUnmounted } = Vue;
    const isAppReady = computed(() => {
      // FO/BO 자동 판별 — 정의된 store 만 호출
      const i = (typeof window.useFoAppInitStore === 'function' ? window.useFoAppInitStore() : null)
             || (typeof window.useBoAppInitStore === 'function' ? window.useBoAppInitStore() : null);
      const c = (typeof window.useFoCodeStore   === 'function' ? window.useFoCodeStore()   : null)
             || (typeof window.sfGetBoCodeStore === 'function' ? window.sfGetBoCodeStore() : null);
      return !i?.svIsLoading && (c?.svCodes?.length > 0) && !uiState.isPageCodeLoad;
    });
    let _called = false;
    const stop = watch(isAppReady, v => {
      if (!v || _called) return;
      _called = true;
      try { fnLoadCodes(); }
      catch (err) { console.error('[useAppCodeReady] fnLoadCodes failed:', err); }
      finally {
        // throw 여부와 무관하게 플래그를 세워 재트리거 차단
        try { uiState.isPageCodeLoad = true; } catch (_) {}
        try { stop && stop(); } catch (_) {}
      }
    });
    // unmount 시 watch 정리 — 단위화면 swap 반복 시 watch 잔존/누적 방지
    try { onUnmounted && onUnmounted(() => { try { stop && stop(); } catch(_){} }); } catch(_){}
    return isAppReady;
  }

  /* ─────────────────────────────────────────────────────────────────────
   * 공통 코드 헬퍼 (FO/BO 공통, 순수 함수)
   * ───────────────────────────────────────────────────────────────────── */
  function codesByGroup(config, grp) {
    const codes = (config && config.codes) || [];
    return codes
      .filter(c => c.codeGrp === grp)
      .sort((a, b) => (a.codeId || 0) - (b.codeId || 0));
  }

  function codesByGroupOrStringList(config, grp, fallbackStrings) {
    const rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    const list = (fallbackStrings || []).filter(x => typeof x === 'string');
    return list.map((x, i) => ({ codeId: i + 1, codeGrp: grp, codeValue: x, codeLabel: x }));
  }

  function codesByGroupOrRows(config, grp, fallbackRows) {
    const rows = codesByGroup(config, grp);
    if (rows.length) return rows;
    return (fallbackRows && fallbackRows.length) ? fallbackRows : [];
  }

  function listImgSrc(src) {
    return typeof window.imageThumbnailSrc === 'function' ? window.imageThumbnailSrc(src) : src;
  }

  /* ─────────────────────────────────────────────────────────────────────
   * CSV/엑셀 다운로드 (FO/BO 공통)
   * columns: [{ label:'표시명', key:'필드명' } | { label:'표시명', value: row => ... }]
   * ───────────────────────────────────────────────────────────────────── */
  function exportCsv(rows, columns, filename) {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = (rows || []).map(row =>
      columns.map(c => {
        const val = typeof c.value === 'function' ? c.value(row) : (row[c.key] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const bom = '﻿'; // UTF-8 BOM (한글 깨짐 방지)
    const blob = new Blob([bom + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'export.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ─────────────────────────────────────────────────────────────────────
   * 일반 트리 빌더 (FO/BO 공통, 순수 함수)
   * items 배열을 부모-자식 트리로 변환. useYn !== 'N' 만 포함.
   * ───────────────────────────────────────────────────────────────────── */
  function buildGenericTree(items, idKey, parentKey, labelKey, sortKey) {
    const list = (items || []).filter(x => x.useYn !== 'N');
    const byParent = {};
    list.forEach(x => {
      const k = x[parentKey] == null ? '__root__' : x[parentKey];
      (byParent[k] = byParent[k] || []).push(x);
    });

    /* build */
    const build = (pk) => (byParent[pk] || [])
      .sort((a, b) => (a[sortKey] || 0) - (b[sortKey] || 0))
      .map(x => ({
        pathId: x[idKey], path: x[idKey],
        name: x[labelKey], pathLabel: x[labelKey],
        children: build(x[idKey]), count: 0,
        _raw: x,
      }));
    const root = { pathId: null, path: null, name: '전체', pathLabel: '전체',
                   children: build('__root__'), count: list.length };

    /* recur */
    const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
    recur(root);
    return root;
  }

  /* 트리 후손 ID Set */
  function collectDescendantIds(items, idKey, parentKey, rootId) {
    if (rootId == null) return null;
    const set = new Set([rootId]);
    let added = true;
    while (added) {
      added = false;
      (items || []).forEach(x => {
        if (set.has(x[parentKey]) && !set.has(x[idKey])) { set.add(x[idKey]); added = true; }
      });
    }
    return set;
  }

  /* 트리에서 N레벨까지 펼친 pathId Set 반환 (root=null 포함) */
  function collectExpandedToDepth(tree, maxDepth) {
    const set = new Set([null]);

    /* walk */
    const walk = (n, d) => {
      if (d >= maxDepth) return;
      (n.children || []).forEach(ch => { set.add(ch.pathId); walk(ch, d + 1); });
    };
    walk(tree, 0);
    return set;
  }

  // 공개 API: window.coUtil 에 등록
  global.coUtil = global.coUtil || {};
  global.coUtil.apiHdr = global.coUtil.apiHdr || apiHdr;
  global.coUtil.getCallerInfo = global.coUtil.getCallerInfo || getCallerInfo;
  global.coUtil.generateTraceId = global.coUtil.generateTraceId || (() => apiInfo.generateTraceId());
  global.coUtil.apiInfo = global.coUtil.apiInfo || apiInfo;
  global.coUtil.chkId = global.coUtil.chkId || chkId;
  global.coUtil.chkRowIds = global.coUtil.chkRowIds || chkRowIds;
  global.coUtil.sha256 = global.coUtil.sha256 || sha256;
  global.coUtil.useAppCodeReady = global.coUtil.useAppCodeReady || useAppCodeReady;
  // 코드 그룹 헬퍼 (FO/BO 공통)
  global.coUtil.codesByGroup = global.coUtil.codesByGroup || codesByGroup;
  global.coUtil.codesByGroupOrStringList = global.coUtil.codesByGroupOrStringList || codesByGroupOrStringList;
  global.coUtil.codesByGroupOrRows = global.coUtil.codesByGroupOrRows || codesByGroupOrRows;
  global.coUtil.listImgSrc = global.coUtil.listImgSrc || listImgSrc;
  // CSV/트리 헬퍼
  global.coUtil.exportCsv = global.coUtil.exportCsv || exportCsv;
  global.coUtil.buildGenericTree = global.coUtil.buildGenericTree || buildGenericTree;
  global.coUtil.collectDescendantIds = global.coUtil.collectDescendantIds || collectDescendantIds;
  global.coUtil.collectExpandedToDepth = global.coUtil.collectExpandedToDepth || collectExpandedToDepth;
})(typeof window !== 'undefined' ? window : this);
