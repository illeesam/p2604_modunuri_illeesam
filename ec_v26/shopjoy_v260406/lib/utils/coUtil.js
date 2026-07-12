/**
 * 공통 유틸 함수 - API 헤더 자동 생성
 * - 필수: X-UI-Nm (화면명) + X-Cmd-Nm (기능명)
 * - 자동: X-File-Nm, X-Func-Nm, X-Line-No, X-Trace-Id, X-User-Agent, X-License-No
 * - 자동 조회: X-User-Id, X-Site-Id, X-Site-No (필요시 옵션으로 오버라이드)
 *
 * 사용법:
 *   ✅ 기본 (자동으로 파일명, 함수명, 라인번호, TraceId, 라이센스 생성)
 *   boApi.get('/path', coUtil.cofApiHdr('회원관리', '목록조회'))
 *
 *   ✅ 사용자/사이트 정보 오버라이드
 *   boApi.post('/path', data, coUtil.cofApiHdr('상품관리', '저장', { userId: 'user-001', siteId: 'SITE-001', siteNo: '01' }))
 *
 *   ✅ 커스텀 TraceId (기본: 자동 생성)
 *   boApi.get('/path', coUtil.cofApiHdr('주문관리', '조회', { traceId: 'custom-trace-123' }))
 */
(function (global) {
  'use strict';

  // ====== 내부 헬퍼 객체 (격리된 인터페이스) ======
  const cofApiInfo = {
    // TraceId 생성: YYYYMMDD_hhmmss_rand4
    cofGenerateTraceId() {
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

    // site_no(01/02/03) → site_id 매핑 (실 DB sy_site 기준)
    // 규칙: '260401' + 10자리 0 패딩. 예: 01 → 2604010000000001 (메인몰, 대표 사이트)
    siteNoToSiteId(siteNo) {
      const no = String(siteNo || '').trim();
      if (!no) return '2604010000000001';
      return '260401' + no.padStart(10, '0');
    },

    // 사이트 ID 조회 (DB 사이트 아이디)
    // 우선순위: BO store svSiteId → localStorage(modu-{bo|fo}-site_id) → site_no 매핑
    getCurrentSiteId() {
      try {
        const boConfig = global.useBoConfigStore?.();
        if (boConfig?.svSiteId) {
          return boConfig.svSiteId;
        }
      } catch (e) {}
      try {
        const ls = localStorage.getItem('modu-bo-sy-siteId')
                || localStorage.getItem('modu-fo-sy-siteId');
        if (ls) return ls;
      } catch (e) {}
      return this.siteNoToSiteId(this.getCurrentSiteNo());
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
        const storedLicense = localStorage.getItem('modu-sy-license-no');
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
  function cofApiHdr(uiNm, cmdNm, options = {}) {
    if (!uiNm || !cmdNm) {
      console.warn('[coUtil.cofApiHdr] Missing required parameters: uiNm or cmdNm', { uiNm, cmdNm });
    }

    // 필수 헤더
    const headers = {
      'X-UI-Nm': uiNm || '',
      'X-Cmd-Nm': cmdNm || '',
    };

    // 자동 수집: 호출 정보
    const callerInfo = cofApiInfo.extractCallerInfo();
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
    headers['X-Trace-Id'] = options.traceId || cofApiInfo.cofGenerateTraceId();

    // 자동 수집: 클라이언트 정보
    const clientInfo = cofApiInfo.getClientInfo();
    if (clientInfo.userAgent) {
      headers['X-User-Agent'] = clientInfo.userAgent;
    }

    // 서버에서 IP를 요청 헤더로 수집하므로, 여기서는 설정하지 않음
    // (클라이언트는 직접 IP 취득 불가)

    // 자동 수집: 사용자 정보 (옵션으로 오버라이드 가능)
    const userId = options.userId || cofApiInfo.getCurrentUser();
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    // 자동 수집: 사이트 ID (DB 사이트 아이디)
    const siteId = options.siteId || cofApiInfo.getCurrentSiteId();
    if (siteId) {
      headers['X-Site-Id'] = siteId;
    }

    // 자동 수집: 사이트 NO (사이트 구분 번호: 01/02/03)
    const siteNo = options.siteNo || cofApiInfo.getCurrentSiteNo();
    if (siteNo) {
      headers['X-Site-No'] = siteNo;
    }

    // 자동 수집: 라이센스 번호
    const licenseNo = options.licenseNo || cofApiInfo.getCurrentLicenseNo();
    if (licenseNo) {
      headers['X-License-No'] = licenseNo;
    }

    return { headers };
  }

  /**
   * API 호출 전 _id 검증 유틸
   *
   * _id 가 null/undefined/빈문자열이면 toast 출력 후 rejected Promise 반환.
   * 정상이면 null 반환 → 호출부에서 `cofChkId(...) || api.xxx(...)` 패턴으로 사용.
   *
   * 사용법 (boApiSvc.js / coApiSvc.js / foApiSvc.js 내부):
   *   getById(_id, uiNm, cmdNm) {
   *     return coUtil.cofChkId(_id, uiNm, cmdNm) || global.boApi.get(`/path/${_id}`, hdr(uiNm, cmdNm));
   *   }
   */
  /**
   * 논리 AND 단축평가 헬퍼 — 템플릿 속성값 안의 `A && B` 대체용.
   *
   * <p>배경: 이 프로젝트의 Vue 글로벌 빌드는 `Vue.compile()`(브라우저 런타임 템플릿
   * 컴파일) 시 `decodeEntities` 가 주입되지 않아, 속성값(`:style`, `:class`, `v-if`,
   * `@click` 등) 안에 `&` 문자(주로 `&&`)가 있으면 컴파일러가 크래시한다.
   * 따라서 속성값의 `A && B` 를 `coUtil.cofAnd(A, B)` 로 치환해 `&` 를 제거한다.</p>
   *
   * <p>JS `&&` 단축평가와 의미가 100% 동일하다: 인자를 좌→우로 평가하다 처음
   * falsy 값을 만나면 그 값을 반환하고, 모두 truthy 면 마지막 인자를 반환한다.
   * (`a && b` ≡ `cofAnd(a, b)`, `a && b && c` ≡ `cofAnd(a, b, c)`)</p>
   *
   * <p>주의: 인자는 호출 시점에 모두 평가되므로 진짜 단축평가(부수효과/지연)는
   * 아니다. 템플릿 표현식은 부수효과가 없어야 하므로 실사용상 동치다.</p>
   *
   * @param {...*} args 평가할 피연산자들 (좌→우)
   * @returns 처음 만난 falsy 값, 모두 truthy 면 마지막 인자(인자 없으면 true)
   */
  function cofAnd() {
    let v = true;
    for (let i = 0; i < arguments.length; i++) {
      v = arguments[i];
      if (!v) return v;
    }
    return v;
  }

  function cofChkId(_id, uiNm, cmdNm) {
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
   *     return coUtil.cofChkRowIds(rows, 'gradeId', uiNm, cmdNm) ||
   *            global.boApi.post('/path/save-list', rows, hdr(uiNm, cmdNm));
   *   }
   */
  function cofChkRowIds(rows, idKey, uiNm, cmdNm) {
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
  async function cofSha256(plain) {
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
   *   const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);
   *   onMounted(() => { if (isAppReady.value) fnLoadCodes(); ... });
   */
  function cofUseAppCodeReady(uiState, fnLoadCodes) {
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
      catch (err) { console.error('[cofUseAppCodeReady] fnLoadCodes failed:', err); }
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
  function cofCodesByGroup(config, grp) {
    const codes = (config && config.codes) || [];
    return codes
      .filter(c => c.codeGrp === grp)
      .sort((a, b) => (a.codeId || 0) - (b.codeId || 0));
  }

  /* ─────────────────────────────────────────────────────────────────────
   * 공통코드 기반 배지/라벨 헬퍼 (FO/BO 공통)
   *  - 코드그룹의 code_opt1 에 저장된 배지 클래스(badge-green 등)를 반환
   *  - fnStatusBadge/fnTypeBadge 류 하드코딩 매핑 대체용
   *
   *   cofCodeBadge('CLAIM_STATUS_KR', '완료')           → 'badge-green' (없으면 'badge-gray')
   *   cofCodeBadge('ORDER_STATUS_KR', s, 'badge-blue')  → fallback 지정
   * ───────────────────────────────────────────────────────────────────── */
  function _codeStore() {
    try {
      if (typeof window.sfGetBoCodeStore === 'function') return window.sfGetBoCodeStore();
      if (typeof window.sfGetFoCodeStore === 'function') return window.sfGetFoCodeStore();
    } catch (_) {}
    return null;
  }
  function cofCodeBadge(grp, codeVal, fallback) {
    const fb = fallback || 'badge-gray';
    if (codeVal == null || codeVal === '') return fb;
    const st = _codeStore();
    const opt1 = st && typeof st.sgGetCodeOpt1 === 'function' ? st.sgGetCodeOpt1(grp, codeVal) : '';
    return opt1 || fb;
  }
  /* ─────────────────────────────────────────────────────────────────────
   * CSV/엑셀 다운로드 (FO/BO 공통)
   * columns: [{ label:'표시명', key:'필드명' } | { label:'표시명', value: row => ... }]
   * filename: 영역명.csv → 자동으로 영역명_YYYYMMDD_hhmmss.csv 로 변환
   * ───────────────────────────────────────────────────────────────────── */
  function cofExportCsv(rows, columns, filename) {
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
    a.href = url; a.download = cofBuildExportFilename(filename || 'export.csv'); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* cofDownloadExcel — 백엔드 엑셀(xlsx) 스트리밍 다운로드 (BO 전용)
   *   url        : '/bo/sy/user/excel' 형식 (boApiAxios baseURL 기준 상대)
   *   params     : 화면 검색조건 객체 그대로
   *   areaNm     : 파일명 prefix (백엔드에서 areaNm_YYYYMMDD_hhmmss.xlsx 로 응답.
   *                 Content-Disposition 의 filename 이 우선 적용되므로 클라이언트는 fallback 용)
   *   uiNm/cmdNm : apiHdr 용 (X-UI-Nm / X-Cmd-Nm, BO 정책)
   *
   * 동작:
   *   - boApi.get(url, { params, responseType:'blob', ...apiHdr })
   *   - 응답 Blob 을 임시 a 태그 클릭으로 다운로드
   *   - Content-Disposition 의 filename 을 우선 사용, 없으면 areaNm_타임스탬프.xlsx
   *   - 에러 시 Blob 안의 JSON 메시지를 토스트로 표시 가능 (호출자가 catch)
   */
  function cofDownloadExcel(url, params, areaNm, uiNm, cmdNm) {
    if (!global.boApi || typeof global.boApi.get !== 'function') {
      return Promise.reject(new Error('boApi 가 로드되지 않았습니다.'));
    }
    const cfg = { params: params || {}, responseType: 'blob' };
    if (typeof global.coUtil.cofApiHdr === 'function' && uiNm) {
      Object.assign(cfg, global.coUtil.cofApiHdr(uiNm, cmdNm || '엑셀다운로드'));
    }
    return global.boApi.get(url, cfg).then(res => {
      const blob = res.data;
      /* Content-Disposition 에서 filename 파싱 (filename*=UTF-8'' 우선) */
      const cd = res.headers && (res.headers['content-disposition'] || res.headers['Content-Disposition']);
      let filename = cofBuildExportFilename((areaNm || 'export') + '.xlsx');
      if (cd) {
        const mStar = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cd);
        const mAlt  = /filename\s*=\s*"?([^"]+)"?/i.exec(cd);
        if (mStar) filename = decodeURIComponent(mStar[1]);
        else if (mAlt) filename = mAlt[1].trim();
      }
      const a = document.createElement('a');
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    });
  }

  /* cofBuildExportFilename — 다운로드 파일명 표준화 (영역명_YYYYMMDD_hhmmss.확장자)
   * 입력 예: '주문목록.csv' → '주문목록_20260525_143012.csv'
   * 이미 _YYYYMMDD_hhmmss 형식이 포함되어 있으면 중복 추가하지 않음. */
  function cofBuildExportFilename(filename) {
    if (!filename) return 'export.csv';
    /* 확장자 분리 (마지막 .기준, 확장자 없으면 .csv 기본) */
    const lastDot = filename.lastIndexOf('.');
    const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
    const ext  = lastDot > 0 ? filename.slice(lastDot)    : '.csv';
    /* 이미 _YYYYMMDD_hhmmss 포함된 경우 중복 추가 방지 */
    if (/_\d{8}_\d{6}$/.test(base)) return filename;
    const d  = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const ts = d.getFullYear()
             + p2(d.getMonth() + 1)
             + p2(d.getDate()) + '_'
             + p2(d.getHours())
             + p2(d.getMinutes())
             + p2(d.getSeconds());
    return `${base}_${ts}${ext}`;
  }

  /* ─────────────────────────────────────────────────────────────────────
   * 엑셀 업로드 관련 상수/유틸 (BoExcelUploadModal 에서 사용)
   * ─────────────────────────────────────────────────────────────────────
   * EXCEL_UPLOAD_MAX_ROWS — 업로드 행수 안전 상한 (다운로드 상한과 동일).
   *   이 이상은 비동기 잡 큐로 처리 권장. 현재 동기 처리 환경에서는 차단.
   * ───────────────────────────────────────────────────────────────────── */
  const EXCEL_UPLOAD_MAX_ROWS = 300_000;

  /* cofStripHtml — HTML 문자열에서 태그 제거 + 엔티티 디코드 → 평문(목록/미리보기용).
   *   리치텍스트(htmlEditor) 내용을 그리드 셀·요약에 안전하게 텍스트로 보여줄 때 사용.
   *   block 태그(p/div/br/li 등)는 공백으로 치환해 단어 붙음 방지. max 지정 시 말줄임(…).
   * 사용: coUtil.cofStripHtml(faq.faqAnswer, 40) */
  function cofStripHtml(html, max) {
    if (html == null) return '';
    let s = String(html);
    if (!s) return '';
    // 줄바꿈/블록 경계를 공백으로
    s = s.replace(/<\s*(br|\/p|\/div|\/li|\/tr|\/h[1-6])\s*>/gi, ' ');
    // 나머지 태그 제거
    s = s.replace(/<[^>]*>/g, '');
    // 기본 HTML 엔티티 디코드
    s = s.replace(/&nbsp;/gi, ' ')
         .replace(/&amp;/gi, '&')
         .replace(/&lt;/gi, '<')
         .replace(/&gt;/gi, '>')
         .replace(/&quot;/gi, '"')
         .replace(/&#39;/g, "'");
    // 연속 공백 정리
    s = s.replace(/\s+/g, ' ').trim();
    if (typeof max === 'number' && max > 0 && s.length > max) {
      s = s.slice(0, max) + '…';
    }
    return s;
  }

  /* cofReadTime — HTML/텍스트 길이 → 대략 읽기시간 문자열('N분'). 200자/분 가정, 최소 1분.
   *   Blog 등 글 목록/상세의 _readTime 통합. 태그는 제거 후 글자수로 계산. */
  function cofReadTime(html) {
    var txt = String(html == null ? '' : html).replace(/<[^>]*>/g, '');
    return Math.max(1, Math.round(txt.length / 200)) + '분';
  }

  /* cofHashIdx — 문자열 → 0..(len-1) 결정적 인덱스. 같은 입력이면 항상 같은 인덱스.
   *   배너색/태그색 등 ID 기반 안정 배정용(랜덤 대신). Event/Blog 의 _hashIdx 통합.
   * 사용: palette[coUtil.cofHashIdx(id, palette.length)] */
  function cofHashIdx(s, len) {
    var h = 0; var str = String(s == null ? '' : s);
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return len ? h % len : 0;
  }

  /* cofParseCsv — CSV 텍스트를 [{컬럼명:값},...] 행 배열로 파싱.
   *   1행을 헤더로 사용. 따옴표 escape ("...""..."), 구분자 = 콤마 고정.
   *   BOM(﻿) 제거, CRLF/LF 모두 허용. 빈 줄은 스킵.
   * 사용: const rows = coUtil.cofParseCsv(await file.text()); */
  function cofParseCsv(text) {
    if (!text) return [];
    /* BOM 제거 */
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    /* 토큰 단위 파서 (따옴표 안 콤마/개행 보존) */
    const rows = [];
    let cur = []; let field = ''; let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuote) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } /* escape "" */
          else inQuote = false;
        } else field += c;
      } else {
        if (c === '"') inQuote = true;
        else if (c === ',') { cur.push(field); field = ''; }
        else if (c === '\r') { /* CRLF 의 CR 은 무시 */ }
        else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
        else field += c;
      }
    }
    /* 마지막 행 처리 */
    if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }

    if (!rows.length) return [];
    const headers = rows[0].map(h => (h || '').trim());
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      /* 빈 줄 스킵 (모든 셀이 빈 문자열인 경우) */
      if (row.every(v => v === '' || v == null)) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx] != null ? row[idx] : ''; });
      out.push(obj);
    }
    return out;
  }

  /* ─────────────────────────────────────────────────────────────────────
   * 일반 트리 빌더 (FO/BO 공통, 순수 함수)
   * items 배열을 부모-자식 트리로 변환. useYn !== 'N' 만 포함.
   * ───────────────────────────────────────────────────────────────────── */
  function cofBuildGenericTree(items, idKey, parentKey, labelKey, sortKey) {
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

  /* 트리에서 N레벨까지 펼친 pathId Set 반환 (root=null 포함) */
  function cofCollectExpandedToDepth(tree, maxDepth) {
    const set = new Set([null]);

    /* walk */
    const walk = (n, d) => {
      if (d >= maxDepth) return;
      (n.children || []).forEach(ch => { set.add(ch.pathId); walk(ch, d + 1); });
    };
    walk(tree, 0);
    return set;
  }

  /* ── 숫자/날짜 포맷 헬퍼 ── */

  /* cofFmt — 숫자에 천단위 콤마 (ko-KR) */
  function cofFmt(n) { return Number(n || 0).toLocaleString('ko-KR'); }

  /* cofWon — 숫자 → '1,234원' (천단위 콤마 + 원). 각 화면의 fmtW 복붙 대체.
   *   signed=true 면 음수 부호 보존 (정산조정 등): -1,234원 */
  function cofWon(n, signed) {
    const v = Number(n) || 0;
    if (signed) return (v < 0 ? '-' : '') + Math.abs(v).toLocaleString() + '원';
    return v.toLocaleString() + '원';
  }

  /* cofYmdHms — 날짜/일시 문자열을 'YYYY-MM-DD HH:MM:SS'(앞 19자)로 자르기.
   *   String(v||'').slice(0,19) 복붙 대체. null/undefined/숫자 안전. 빈값이면 ''.
   *   끝에 '-' fallback 이 필요하면 호출부에서 `coUtil.cofYmdHms(v) || '-'` */
  function cofYmdHms(v) { return String(v || '').slice(0, 19); }

  /* cofYmd — 날짜 문자열을 'YYYY-MM-DD'(앞 10자)로 자르기. String(v||'').slice(0,10) 대체. */
  function cofYmd(v) { return String(v || '').slice(0, 10); }

  /* cofDatetimeNorm — LocalDateTime 정규화: space→T + 앞 16자('YYYY-MM-DDTHH:mm').
   *   <input type="datetime-local"> 비교/바인딩용. DispX01Ui/DispX04Widget/Sample* 의 _norm 통합. */
  function cofDatetimeNorm(v) { return String(v || '').replace(' ', 'T').slice(0, 16); }

  /* cofDecodeUri — 안전한 decodeURIComponent. 디코드 실패(malformed %)시 원문 반환, 빈값이면 ''.
   *   각 로그/이력 화면의 fnDecode 복붙 대체. */
  function cofDecodeUri(s) { try { return s ? decodeURIComponent(s) : ''; } catch (_) { return s || ''; } }

  /* ──────────────────────────────────────────────────────────────────────
   * API axios 인터셉터 공용 작은 헬퍼 (foApiAxios.js / boApiAxios.js 반복 조각 추출).
   * 인터셉터 등록·refresh 큐잉 등 뼈대는 각 axios 파일에 그대로 두고, 순수 조각만 여기로.
   * ────────────────────────────────────────────────────────────────────── */

  /* cofShortApiUrl — 로그용 URL 축약. localhost/127 호출이면 '/api...' 부분만 남김. */
  function cofShortApiUrl(url) {
    var u = url || '';
    if (u && (u.indexOf('localhost') >= 0 || u.indexOf('127') >= 0)) {
      var m = u.match(/\/api(\/.*)?$/);
      if (m) return m[0];
    }
    return u;
  }

  /* cofUiTag — 로그 prefix 태그 ' [화면 > 기능]'. 디코드 포함. 없으면 ''. (cofUiNmCmdNm 과 달리 대괄호 래핑) */
  function cofUiTag(uiNm, cmdNm) {
    var u = uiNm ? cofDecodeUri(uiNm) : '';
    var c = cmdNm ? cofDecodeUri(cmdNm) : '';
    return u ? (' [' + u + (c ? ' > ' + c : '') + ']') : '';
  }

  /* cofReadHdr — AxiosHeaders(axios 1.x 소문자 정규화) 호환 헤더 읽기 + 디코드. */
  function cofReadHdr(headers, key) {
    if (!headers) return '';
    var v = (typeof headers.get === 'function')
      ? (headers.get(key) || '')
      : (headers[key] || headers[key.toLowerCase()] || '');
    return cofDecodeUri(v);
  }

  /* cofEncodeNmHeaders — X-UI-Nm/X-Cmd-Nm 한글을 encodeURIComponent (ISO-8859-1 전송 불가 대응). in-place 수정. */
  function cofEncodeNmHeaders(headers) {
    if (!headers) return;
    try {
      if (headers['X-UI-Nm'])  headers['X-UI-Nm']  = encodeURIComponent(headers['X-UI-Nm']);
      if (headers['X-Cmd-Nm']) headers['X-Cmd-Nm'] = encodeURIComponent(headers['X-Cmd-Nm']);
    } catch (_) {}
  }

  /* cofCheckNmHeaders — 필수헤더 X-UI-Nm/X-Cmd-Nm 검증. 누락 시 { ok:false, missing, errMsg }, 정상 시 { ok:true, uiNm, cmdNm }.
   *   label 예: 'FO API' / 'BO API'. (alert/console/reject 는 호출측 axios 파일이 담당) */
  function cofCheckNmHeaders(headers, label) {
    var h = headers || {};
    var uiNm  = (h['X-UI-Nm']  || h['x-ui-nm'])  || '';
    var cmdNm = (h['X-Cmd-Nm'] || h['x-cmd-nm']) || '';
    if (!uiNm || !cmdNm) {
      var missing = [];
      if (!uiNm)  missing.push('X-UI-Nm');
      if (!cmdNm) missing.push('X-Cmd-Nm');
      return { ok: false, missing: missing, errMsg: '[' + label + '] 필수 헤더 누락: ' + missing.join(', ') };
    }
    return { ok: true, uiNm: cofDecodeUri(uiNm), cmdNm: cofDecodeUri(cmdNm) };
  }

  /* cofFillTraceHeaders — coUtil.cofApiHdr 미사용 호출 대비 X-Trace-Id/X-File-Nm/X-Func-Nm/X-Line-No 자동 보충.
   *   이미 있으면 건드리지 않음. 호출 위치는 기존 cofApiInfo.extractCallerInfo() 재사용. in-place 수정. */
  function cofFillTraceHeaders(headers) {
    if (!headers) return;
    try {
      if (headers['X-Trace-Id'] || headers['x-trace-id']) return;
      headers['X-Trace-Id'] = cofApiInfo.cofGenerateTraceId();
      var info = cofApiInfo.extractCallerInfo();
      if (info) {
        if (info.fileNm) headers['X-File-Nm'] = info.fileNm;
        if (info.funcNm) headers['X-Func-Nm'] = info.funcNm;
        if (info.lineNo) headers['X-Line-No'] = info.lineNo;
      }
    } catch (_) {}
  }

  /* cofUiNmCmdNm — x-헤더 화면명/기능명을 디코드해 '화면 > 기능' 으로 결합. 둘 중 하나만 있으면 그것만, 둘 다 없으면 '-'.
   *   로그/이력 화면 _uiNm 컬럼 fmt 복붙(12곳) 대체.
   *   사용: { key:'_uiNm', fmt: (v, row) => coUtil.cofUiNmCmdNm(row.uiNm, row.cmdNm) } */
  function cofUiNmCmdNm(uiNm, cmdNm) {
    const u = uiNm ? cofDecodeUri(uiNm) : '';
    const m = cmdNm ? cofDecodeUri(cmdNm) : '';
    return u && m ? `${u} > ${m}` : (u || m || '-');
  }

  /* cofPad — 1자리 숫자 → '0N' */
  function cofPad(n) { return String(n).padStart(2, '0'); }

  /* cofToYmd — Date → 'YYYY-MM-DD' */
  function cofToYmd(d) { return `${d.getFullYear()}-${cofPad(d.getMonth() + 1)}-${cofPad(d.getDate())}`; }

  /* cofToYm — Date → 'YYYY-MM' */
  function cofToYm(d) { return `${d.getFullYear()}-${cofPad(d.getMonth() + 1)}`; }

  /* cofAddMonths — d 에 n 개월 더한 새 Date */
  function cofAddMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

  /* cofEndOfMonth — 해당 월의 마지막 날 Date */
  function cofEndOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

  /* ── SVG 차트 헬퍼 ── */

  /* cofMaxOf — 배열 최대값 (최소 1) */
  function cofMaxOf(arr) { return Math.max(1, ...arr); }

  /* cofLinePoints — 값 배열을 SVG polyline points 문자열로 변환 */
  function cofLinePoints(vals, w, h, pad = 10) {
    const max = cofMaxOf(vals);
    const step = (w - pad * 2) / Math.max(vals.length - 1, 1);
    return vals.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(' ');
  }

  /* cofAreaPath — 값 배열을 SVG path (영역 채우기용) 문자열로 변환 */
  function cofAreaPath(vals, w, h, pad = 10) {
    const pts = cofLinePoints(vals, w, h, pad);
    if (!pts) { return ''; }
    const first = pts.split(' ')[0].split(',');
    const last = pts.split(' ').slice(-1)[0].split(',');
    return `M${first[0]},${h - pad} L${pts.replace(/ /g, ' L')} L${last[0]},${h - pad} Z`;
  }

  /* ─────────────────────────────────────────────────────────────────────
   * cofDetail — Mng 인라인 Dtl 패널 표준 캡슐 (FO/BO 공통)
   *  - selectedId / openMode('view'|'edit') / reloadTrigger 관리
   *  - openView(id) / openEdit(id) / openNew() / close() / reload()
   *  - editId computed: selectedId === '__new__' 면 null (신규)
   *  - panelKey computed: Dtl <key> 바인딩용 (id_mode 조합)
   *
   * 사용법:
   *   const detailPanel = coUtil.cofDetail();
   *   // template: detailPanel.selectedId / detailPanel.editId / detailPanel.panelKey
   *   //           detailPanel.openMode / detailPanel.reloadTrigger
   *   //           detailPanel.openEdit(id) / detailPanel.openNew() / detailPanel.close()
   * ─────────────────────────────────────────────────────────────────── */
  function cofDetail() {
    const { reactive, computed } = Vue;
    const d = reactive({
      selectedId: null,
      openMode: 'view',
      reloadTrigger: 0,
      openView: (id) => { d.selectedId = id; d.openMode = 'view'; d.reloadTrigger++; },
      openEdit: (id) => { d.selectedId = id; d.openMode = 'edit'; d.reloadTrigger++; },
      openNew:  ()   => { d.selectedId = '__new__'; d.openMode = 'edit'; d.reloadTrigger++; },
      close:    ()   => { d.selectedId = null; },
      reload:   ()   => { d.reloadTrigger++; },
      switchToEdit: () => { d.openMode = 'edit'; },
    });
    d.editId   = computed(() => d.selectedId === '__new__' ? null : d.selectedId);
    d.panelKey = computed(() => `${d.selectedId}_${d.openMode}`);
    d.dtlMode  = computed(() => d.openMode === 'edit' ? (d.editId.value ? 'edit' : 'new') : 'view');
    return d;
  }

  /* cofBuildPagerNums — pager.pageNo 기준 ±2 범위 페이지 번호 배열을 pager.pageNums 에 채움
   *   사용: const res = await api.getPage(...); pager.pageTotalPage = ...; coUtil.cofBuildPagerNums(pager);
   *   기존 각 화면의 fnBuildPagerNums() 복붙 대체 */
  function cofBuildPagerNums(pager) {
    const c = pager.pageNo, l = pager.pageTotalPage;
    const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
    pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }

  /* cofOmitEmpty — 객체에서 '' / null / undefined 값 키를 제거한 새 객체 반환
   *   사용: const params = { pageNo, pageSize, ...coUtil.cofOmitEmpty(searchParam) }; */
  function cofOmitEmpty(obj) {
    return Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  }

  /* cofHexColor — opt_style 등 CSS 조각에서 색상 버튼용 hex(#xxxxxx)를 추출
   *   허용 입력: '#000', '#000000', 'background-color:#000000', 'background:#fff', '  #ABCDEF '
   *   추출 실패 시 '' 반환 (호출부에서 회색 처리) */
  function cofHexColor(style) {
    const s = (style == null ? '' : String(style)).trim();
    if (!s) { return ''; }
    const m = s.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
    return m ? '#' + m[1] : '';
  }

  /* cofImgSrc — 서버 이미지 경로를 브라우저(루트 기준)에서 접근 가능하도록 정규화
   *   서버는 '/cdn/...' (절대) 로 저장하지만 실제 파일은 'assets/cdn/...' 에 있음 → 'assets/' 프리픽스 보정
   *   - 빈값: '' 반환 (호출부에서 NO_IMAGE 폴백)
   *   - http(s)://, // , data: : 그대로 (외부/인라인)
   *   - '/cdn/...' 또는 'cdn/...' : 'assets/cdn/...' 로 보정
   *   - 그 외(이미 'assets/...' 등 상대경로): 그대로 */
  function cofImgSrc(url) {
    const s = (url == null ? '' : String(url)).trim();
    if (!s) { return ''; }
    if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:')) { return s; }
    if (s.startsWith('assets/')) { return s; }
    const rel = s.replace(/^\//, '');           // 선행 '/' 제거
    if (rel.startsWith('cdn/')) { return 'assets/' + rel; }
    return s;
  }

  /* cofHtmlCdnToAsset — HTML 본문 안의 src/href="/cdn/..." → "assets/cdn/..." 보정 (브라우저 표시용)
   *   에디터/미리보기에 넣기 전 호출. cofImgSrc 의 HTML 일괄 버전. (BlogView 본문 표시와 동일 변환) */
  function cofHtmlCdnToAsset(html) {
    if (html == null) { return ''; }
    return String(html).replace(/(src|href)=(['"])\/cdn\//g, '$1=$2assets/cdn/');
  }

  /* cofHtmlAssetToCdn — HTML 본문 안의 src/href="assets/cdn/..." → "/cdn/..." 역보정 (저장용)
   *   서버는 '/cdn/...' 절대경로로 저장하므로 저장 직전 호출. cofHtmlCdnToAsset 의 역함수. */
  function cofHtmlAssetToCdn(html) {
    if (html == null) { return ''; }
    return String(html).replace(/(src|href)=(['"])assets\/cdn\//g, '$1=$2/cdn/');
  }

  /* ──────────────────────────────────────────────────────────────────────
   * FO 상품 공용 헬퍼 (foApp.js / Home*.js / Prod*List.js / Prod*View.js 반복 제거)
   * ────────────────────────────────────────────────────────────────────── */

  /* 상품 이미지 자동 할당 기본 경로 */
  var PROD_IMG_BASE = 'assets/cdn/prod/img/shop/product';

  /* cofGenId — 임의 ID 생성: yymmddHHMMSS + rand4 (예: 2606131530AB12)
   *   foApp.js genId 통합. 장바구니 cartId 등 클라이언트 임시 키용. */
  function cofGenId() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return [d.getFullYear() % 100, d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(pad).join('') + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* cofAssignProdImage — 상품 객체에 image/images/priceNum 자동 보정 (in-place + 반환)
   *   foApp._assignImg + Prod*List.assignImage 통합.
   *   1) colors→opt1s, sizes→opt2s 호환
   *   2) thumbnailUrl → image (cofImgSrc 정규화)
   *   3) image 없으면 prodId 숫자 기반 폴백 이미지 할당
   *   4) priceNum 없으면 price 문자열에서 숫자 추출
   *   imgBase 미지정 시 기본 경로 사용. */
  function cofAssignProdImage(p, imgBase) {
    if (!p) { return p; }
    var base = imgBase || PROD_IMG_BASE;
    if (p.colors && !p.opt1s) { p.opt1s = p.colors; }
    if (p.sizes && !p.opt2s) { p.opt2s = p.sizes; }
    if (!p.image && p.thumbnailUrl) { p.image = cofImgSrc(p.thumbnailUrl); }
    if (!p.image) {
      var id = parseInt(String(p.prodId || 1).replace(/[^0-9]/g, ''), 10) || 1;
      if (id <= 12) {
        p.image = base + '/fashion/fashion-' + id + '.webp';
        p.images = [p.image, base + '/fashion/fashion-' + ((id % 12) + 1) + '.webp'];
      } else {
        var n = ((id - 1) % 23) + 1;
        p.image = base + '/product_' + n + '.png';
        p.images = [p.image, base + '/product_' + ((n % 23) + 1) + '.png'];
      }
    }
    if (!p.priceNum && p.price) {
      p.priceNum = parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0;
    }
    return p;
  }

  /* cofProdIdFromHash — 현재 URL 해시(#page=prodView&prodid=...)에서 prodid 추출.
   *   Prod*View.fnGetProdIdFromHash 통합. 실패 시 ''. */
  function cofProdIdFromHash() {
    try {
      var rawHash = String(window.location.hash || '').replace(/^#/, '');
      return new URLSearchParams(rawHash).get('prodid') || '';
    } catch (e) { return ''; }
  }

  /* cofCategoryLabel — 상품의 categoryId → SITE_CONFIG.categorys 의 categoryNm.
   *   Home*.fnCategoryLabel + Prod*List.fnCategoryLabel 통합. 매칭 없으면 categoryId 그대로. */
  function cofCategoryLabel(p) {
    if (!p) { return ''; }
    var cats = (window.SITE_CONFIG && window.SITE_CONFIG.categorys) || [];
    var row = cats.find(function (c) { return c.categoryId === p.categoryId; });
    return row ? row.categoryNm : p.categoryId;
  }

  /* cofToggleSet — Set 에 값 토글 (있으면 삭제, 없으면 추가). Prod*List toggleColor/Size/Cat 통합.
   *   사용: const toggleColor = (n) => coUtil.cofToggleSet(selColors, n); */
  function cofToggleSet(set, val) {
    if (!set) { return; }
    if (set.has(val)) { set.delete(val); } else { set.add(val); }
  }

  /* cofBannerTimer — 히어로 배너 자동 슬라이드 타이머 팩토리. Home*.startBannerTimer/setBanner 통합.
   *   onIndex(i): 다음 인덱스를 적용하는 콜백 (예: i => { uiState.bannerIdx = i; })
   *   getIndex(): 현재 인덱스 반환
   *   count: 배너 개수,  ms: 간격(기본 20000)
   *   반환: { start(), set(i), stop() } — onMounted 에서 start(), onBeforeUnmount 에서 stop(). */
  function cofBannerTimer(onIndex, getIndex, count, ms) {
    var interval = ms || 20000;
    var timer = null;
    function start() {
      stop();
      timer = setInterval(function () {
        var next = ((getIndex() || 0) + 1) % (count || 1);
        onIndex(next);
      }, interval);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function set(i) { onIndex(i); start(); }
    return { start: start, set: set, stop: stop };
  }

  /* cofMergeProdOpts — 백엔드 상품상세 응답(prod + opts + skus + images)을
   *   화면이 기대하는 단일 prod 형태(opt1s/opt2s/opt2sAll/opt2Prices/mainImage/images)로 머지.
   *   Prod*View.fnMergeProdOpts 통합 (Prod01 의 opt2sAll 포함 슈퍼셋 기준 — View02/03 도 호환).
   *   - opts.groups (PdProdOptTypeDto) → opt1s = [{ optId, name, val, priceDelta, imgUrl, prodOptStyle, hex }]
   *   - opts.items  (PdProdOptDto)     → opt2s(unique 이름) + opt2sAll(parentProdOptId 포함)
   *   - skus 의 2단별 addPrice 평균   → opt2Prices = { '사이즈명': delta } */
  function cofMergeProdOpts(prod, optsObj, skusList, imgList) {
    var groups = ((optsObj && optsObj.groups) || []).slice()
      .sort(function (a, b) { return (a.prodOptTypeLevel || a.optTypeLevel || a.optLevel || a.level || 0) - (b.prodOptTypeLevel || b.optTypeLevel || b.optLevel || b.level || 0); });
    var items = (optsObj && optsObj.items) || [];
    var imgs = imgList || [];
    var skus = skusList || [];
    var lv1 = groups.find(function (g) { return Number(g.prodOptTypeLevel || g.optTypeLevel || g.optLevel || g.level || 0) === 1; });
    var lv2 = groups.find(function (g) { return Number(g.prodOptTypeLevel || g.optTypeLevel || g.optLevel || g.level || 0) === 2; });

    var itemsOf = function (g) { return g ? items.filter(function (i) { return i.prodOptTypeId === g.prodOptTypeId; }) : []; };
    var lv1Items = itemsOf(lv1).sort(function (a, b) { return (a.sortOrd || 0) - (b.sortOrd || 0); });
    var lv2Items = itemsOf(lv2).sort(function (a, b) { return (a.sortOrd || 0) - (b.sortOrd || 0); });

    var opt1Nm = ((lv1 && (lv1.prodOptTypeNm || lv1.optTypeNm || lv1.optGrpNm || lv1.grpNm)) || '').trim() || '색상';
    var opt2Nm = ((lv2 && (lv2.prodOptTypeNm || lv2.optTypeNm || lv2.optGrpNm || lv2.grpNm)) || '').trim() || '사이즈';

    var opt1s = lv1Items.map(function (it) {
      var optImgs = imgs.filter(function (im) { return im.prodOptId1 === it.prodOptId; });
      var style = (it.prodOptStyle || '').trim();
      return {
        optId: it.prodOptId,
        name: it.prodOptNm || it.prodOptVal || '',
        val: it.prodOptVal || '',
        priceDelta: 0,
        imgUrl: cofImgSrc((optImgs[0] && (optImgs[0].cdnImgUrl || optImgs[0].cdnThumbUrl)) || ''),
        optStyle: style,
        hex: cofHexColor(style),
      };
    });

    var opt2sAll = lv2Items.map(function (it) {
      return {
        optId: it.prodOptId,
        name: it.prodOptNm || it.prodOptVal || '',
        val: it.prodOptVal || '',
        parentOptId: it.parentProdOptId || '',
      };
    });

    var seenNm = new Set();
    var opt2s = [];
    opt2sAll.forEach(function (it) { if (it.name && !seenNm.has(it.name)) { seenNm.add(it.name); opt2s.push(it.name); } });

    var opt2Prices = {};
    lv2Items.forEach(function (it) {
      var matchedSkus = skus.filter(function (s) { return (s.prodOptId2 === it.prodOptId) || (s.prodOptNm2 === it.prodOptNm); });
      if (!matchedSkus.length) { return; }
      var avg = Math.round(matchedSkus.reduce(function (a, s) { return a + (Number(s.addPrice) || 0); }, 0) / matchedSkus.length);
      if (avg) { opt2Prices[it.prodOptNm || it.prodOptVal] = avg; }
    });

    var main = imgs.find(function (im) { return im.isThumb === 'Y'; }) || imgs[0];
    var mainImage = cofImgSrc((main && (main.cdnImgUrl || main.cdnThumbUrl)) || '');
    var priceVal = prod.salePrice || prod.listPrice || prod.price || 0;

    return Object.assign({}, prod, {
      price: priceVal,
      mainImage: mainImage,
      images: imgs,
      opt1Nm: opt1Nm,
      opt2Nm: opt2Nm,
      opt1s: opt1s,
      opt2s: opt2s,
      opt2sAll: opt2sAll,
      opt2Prices: opt2Prices,
      skus: skus,
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * 전시(Display) 공용 헬퍼 (DispX0*.js / DpDisp*Preview/Simul/Relation/Dtl/Mng 반복 제거)
   * ────────────────────────────────────────────────────────────────────── */

  /* 전시 차트 위젯 공용 색상 팔레트 (DispX04Widget + DpDisp*Preview 6파일 동일 상수) */
  var DISP_CHART_COLORS = ['#e8587a', '#ff8c69', '#9c5fa3', '#1677ff', '#52c41a', '#fa8c16', '#36cfc9'];

  /* cofChartColors — 전시 차트 색상 팔레트 배열 반환 (복사본). */
  function cofChartColors() { return DISP_CHART_COLORS.slice(); }

  /* cofChartBars — chartValues/chartLabels(콤마구분 문자열 또는 배열) → 막대 데이터 배열.
   *   반환: [{ v, label, pct, color }]  (pct = value/max*100, color = 팔레트 순환)
   *   값 없으면 [] 반환. DpDisp{Area,Panel,Ui,WidgetLib}Preview 의 cfChartBars 통합. */
  function cofChartBars(chartValues, chartLabels) {
    if (chartValues == null || chartValues === '') { return []; }
    var values = Array.isArray(chartValues)
      ? chartValues.map(function (v) { return Number(v) || 0; })
      : String(chartValues).split(',').map(function (v) { return Number(v.trim()) || 0; });
    if (!values.length) { return []; }
    var labels = (chartLabels != null && chartLabels !== '')
      ? (Array.isArray(chartLabels) ? chartLabels.map(String) : String(chartLabels).split(',').map(function (l) { return l.trim(); }))
      : values.map(function (_, i) { return String(i + 1); });
    var max = Math.max.apply(null, values.concat([1]));
    return values.map(function (v, i) {
      return { v: v, label: labels[i] || '', pct: Math.round((v / max) * 100), color: DISP_CHART_COLORS[i % DISP_CHART_COLORS.length] };
    });
  }

  /* cofChartPie — cofChartBars 결과 → 파이 세그먼트(start/end deg + ratio%) 배열. */
  function cofChartPie(bars) {
    var list = bars || [];
    var total = list.reduce(function (s, b) { return s + (b.v || 0); }, 0) || 1;
    var acc = 0;
    return list.map(function (b) {
      var start = acc / total * 360;
      acc += (b.v || 0);
      var end = acc / total * 360;
      return Object.assign({}, b, { start: start, end: end, ratio: Math.round((b.v || 0) / total * 100) });
    });
  }

  /* cofChartPieGradient — 파이 세그먼트 → CSS conic-gradient 문자열. */
  function cofChartPieGradient(pieSegs) {
    var segs = pieSegs || [];
    return 'conic-gradient(' + segs.map(function (s) { return s.color + ' ' + s.start + 'deg ' + s.end + 'deg'; }).join(',') + ')';
  }

  /* cofParsePanelRows — dp_panel.content_json(문자열/객체) → rows 배열. 파싱 실패/없으면 [].
   *   DpDisp{Area,Panel,Ui}Preview / DpDispUiSimul / DpDispPanelDtl 의 rows 파싱 통합. */
  function cofParsePanelRows(contentJson) {
    try {
      var obj = typeof contentJson === 'string' ? JSON.parse(contentJson || '{}') : (contentJson || {});
      return obj.rows || [];
    } catch (e) { return []; }
  }

  /* cofPanelRowCount — content_json 의 rows 개수. DpDispPanelMng / DpDispRelationMng 통합. */
  function cofPanelRowCount(contentJson) { return cofParsePanelRows(contentJson).length; }

  /* cofPanelStatusLabel — dp_panel.disp_panel_status_cd(SHOW/HIDE) → '활성'/'비활성'.
   *   렌더러가 기대하는 라벨로 변환. 알 수 없는 값은 원문 반환.
   *   DpDisp{Area,Panel,Ui}Preview / DpDispUiSimul 어댑터 통합. */
  function cofPanelStatusLabel(statusCd) {
    return statusCd === 'SHOW' ? '활성' : (statusCd === 'HIDE' ? '비활성' : (statusCd || ''));
  }

  // 공개 API: window.coUtil 에 등록
  global.coUtil = global.coUtil || {};
  global.coUtil.cofApiHdr = global.coUtil.cofApiHdr || cofApiHdr;
  global.coUtil.cofApiInfo = global.coUtil.cofApiInfo || cofApiInfo;
  global.coUtil.cofAnd = global.coUtil.cofAnd || cofAnd;
  global.coUtil.cofChkId = global.coUtil.cofChkId || cofChkId;
  global.coUtil.cofChkRowIds = global.coUtil.cofChkRowIds || cofChkRowIds;
  global.coUtil.cofSha256 = global.coUtil.cofSha256 || cofSha256;
  global.coUtil.cofUseAppCodeReady = global.coUtil.cofUseAppCodeReady || cofUseAppCodeReady;
  // 코드 그룹 헬퍼 (FO/BO 공통)
  global.coUtil.cofCodesByGroup = global.coUtil.cofCodesByGroup || cofCodesByGroup;
  // 공통코드 배지/라벨 헬퍼
  global.coUtil.cofCodeBadge = global.coUtil.cofCodeBadge || cofCodeBadge;
  // CSV/엑셀 헬퍼
  global.coUtil.cofExportCsv = global.coUtil.cofExportCsv || cofExportCsv;
  global.coUtil.cofDownloadExcel = global.coUtil.cofDownloadExcel || cofDownloadExcel;
  global.coUtil.cofParseCsv = global.coUtil.cofParseCsv || cofParseCsv;
  global.coUtil.cofStripHtml = global.coUtil.cofStripHtml || cofStripHtml;
  global.coUtil.cofReadTime = global.coUtil.cofReadTime || cofReadTime;
  global.coUtil.cofHashIdx = global.coUtil.cofHashIdx || cofHashIdx;
  global.coUtil.EXCEL_UPLOAD_MAX_ROWS = global.coUtil.EXCEL_UPLOAD_MAX_ROWS || EXCEL_UPLOAD_MAX_ROWS;
  global.coUtil.cofBuildExportFilename = global.coUtil.cofBuildExportFilename || cofBuildExportFilename;
  global.coUtil.cofBuildGenericTree = global.coUtil.cofBuildGenericTree || cofBuildGenericTree;
  global.coUtil.cofCollectExpandedToDepth = global.coUtil.cofCollectExpandedToDepth || cofCollectExpandedToDepth;
  // 숫자/날짜 포맷 헬퍼
  global.coUtil.cofFmt = global.coUtil.cofFmt || cofFmt;
  global.coUtil.cofWon = global.coUtil.cofWon || cofWon;
  global.coUtil.cofPad = global.coUtil.cofPad || cofPad;
  global.coUtil.cofYmdHms = global.coUtil.cofYmdHms || cofYmdHms;
  global.coUtil.cofYmd = global.coUtil.cofYmd || cofYmd;
  global.coUtil.cofDatetimeNorm = global.coUtil.cofDatetimeNorm || cofDatetimeNorm;
  global.coUtil.cofDecodeUri = global.coUtil.cofDecodeUri || cofDecodeUri;
  global.coUtil.cofShortApiUrl = global.coUtil.cofShortApiUrl || cofShortApiUrl;
  global.coUtil.cofUiTag = global.coUtil.cofUiTag || cofUiTag;
  global.coUtil.cofReadHdr = global.coUtil.cofReadHdr || cofReadHdr;
  global.coUtil.cofEncodeNmHeaders = global.coUtil.cofEncodeNmHeaders || cofEncodeNmHeaders;
  global.coUtil.cofCheckNmHeaders = global.coUtil.cofCheckNmHeaders || cofCheckNmHeaders;
  global.coUtil.cofFillTraceHeaders = global.coUtil.cofFillTraceHeaders || cofFillTraceHeaders;
  global.coUtil.cofUiNmCmdNm = global.coUtil.cofUiNmCmdNm || cofUiNmCmdNm;
  global.coUtil.cofToYmd = global.coUtil.cofToYmd || cofToYmd;
  global.coUtil.cofToYm = global.coUtil.cofToYm || cofToYm;
  global.coUtil.cofAddMonths = global.coUtil.cofAddMonths || cofAddMonths;
  global.coUtil.cofEndOfMonth = global.coUtil.cofEndOfMonth || cofEndOfMonth;
  // SVG 차트 헬퍼
  global.coUtil.cofMaxOf = global.coUtil.cofMaxOf || cofMaxOf;
  global.coUtil.cofBuildPagerNums = global.coUtil.cofBuildPagerNums || cofBuildPagerNums;
  global.coUtil.cofOmitEmpty = global.coUtil.cofOmitEmpty || cofOmitEmpty;
  global.coUtil.cofImgSrc = global.coUtil.cofImgSrc || cofImgSrc;
  global.coUtil.cofHtmlCdnToAsset = global.coUtil.cofHtmlCdnToAsset || cofHtmlCdnToAsset;
  global.coUtil.cofHtmlAssetToCdn = global.coUtil.cofHtmlAssetToCdn || cofHtmlAssetToCdn;
  global.coUtil.cofHexColor = global.coUtil.cofHexColor || cofHexColor;
  // FO 상품 공용 헬퍼
  global.coUtil.cofGenId = global.coUtil.cofGenId || cofGenId;
  global.coUtil.cofAssignProdImage = global.coUtil.cofAssignProdImage || cofAssignProdImage;
  global.coUtil.cofProdIdFromHash = global.coUtil.cofProdIdFromHash || cofProdIdFromHash;
  global.coUtil.cofCategoryLabel = global.coUtil.cofCategoryLabel || cofCategoryLabel;
  global.coUtil.cofToggleSet = global.coUtil.cofToggleSet || cofToggleSet;
  global.coUtil.cofBannerTimer = global.coUtil.cofBannerTimer || cofBannerTimer;
  global.coUtil.cofMergeProdOpts = global.coUtil.cofMergeProdOpts || cofMergeProdOpts;
  // 전시(Display) 공용 헬퍼
  global.coUtil.cofChartColors = global.coUtil.cofChartColors || cofChartColors;
  global.coUtil.cofChartBars = global.coUtil.cofChartBars || cofChartBars;
  global.coUtil.cofChartPie = global.coUtil.cofChartPie || cofChartPie;
  global.coUtil.cofChartPieGradient = global.coUtil.cofChartPieGradient || cofChartPieGradient;
  global.coUtil.cofParsePanelRows = global.coUtil.cofParsePanelRows || cofParsePanelRows;
  global.coUtil.cofPanelRowCount = global.coUtil.cofPanelRowCount || cofPanelRowCount;
  global.coUtil.cofPanelStatusLabel = global.coUtil.cofPanelStatusLabel || cofPanelStatusLabel;
  global.coUtil.cofLinePoints = global.coUtil.cofLinePoints || cofLinePoints;
  global.coUtil.cofAreaPath = global.coUtil.cofAreaPath || cofAreaPath;
  // Mng 표준 캡슐 (상세패널)
  global.coUtil.cofDetail = global.coUtil.cofDetail || cofDetail;
})(typeof window !== 'undefined' ? window : this);
