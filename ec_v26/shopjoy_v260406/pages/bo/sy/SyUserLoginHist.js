/* ShopJoy Admin - 사용자로그인이력 */
window.SyUserLoginHist = {
  name: 'SyUserLoginHist',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const uiState = reactive({ descOpen: false, isPageCodeLoad: false, activeTab: 'log', dateRange: '이번달', dateStart: '', dateEnd: '', searchKw: '', searchResult: '', searchIp: '', searchTokenAction: '' });
    const tab = Vue.toRef(uiState, 'tab');
    const activeTab = Vue.toRef(uiState, 'activeTab');
     // 'log' | 'hist' | 'token'

    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (uiState.dateRange) { const r = window.boCmUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = window.boCmUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const pager = reactive({ page: 1, size: 20 });

    const boUserList = reactive([]);
    const cfBoUsers = computed(() => boUserList);

    const handleFetchData = async () => {
      try {
        const res = await window.boApi.get('/bo/sy/user/page', { params: { pageNo: 1, pageSize: 10000 } });
        boUserList.splice(0, boUserList.length, ...(res.data?.data?.list || []));
      } catch (_) {}
    };

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      uiState.isPageCodeLoad = true;
      handleFetchData();
    };

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    const OS_LIST      = ['Windows 11','Windows 10','macOS 14','macOS 13','iOS 17'];
    const BROWSER_LIST = ['Chrome 123','Edge 122','Safari 17','Firefox 124','Chrome 122'];
    const IP_LIST      = ['192.168.1.10','10.0.0.5','172.16.0.22','192.168.0.35','10.1.1.100','221.148.12.5'];
    const RESULT_CODES = ['SUCCESS','SUCCESS','SUCCESS','SUCCESS','SUCCESS','SUCCESS','FAIL_PW','FAIL_LOCKED','FAIL_NOT_FOUND'];
    const TOKEN_HASHES = [
      'f1e2d3c4b5a6978869504132ab0cdef0112233445566778899aabbccddeeff00',
      'a0b1c2d3e4f5067718293a4b5c6d7e8f9091a2b3c4d5e6f7081929304152637',
      '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
      'cafebabe0f0e0d0c0b0a09080706050403020100ffeeddccbbaa998877665544',
    ];

    const LOG_DATES = [
      '2026-04-19 09:05:12','2026-04-19 08:48:33','2026-04-18 22:11:04','2026-04-18 18:02:55',
      '2026-04-17 13:44:28','2026-04-17 10:22:47','2026-04-16 19:55:13','2026-04-16 08:30:06',
      '2026-04-15 16:07:39','2026-04-15 09:15:22','2026-04-14 22:44:11','2026-04-14 11:28:55',
      '2026-04-13 07:58:31','2026-04-12 18:35:44','2026-04-11 14:02:19','2026-04-10 08:47:58',
    ];

    const cfLogList = computed(() => {
      const rows = [];
      LOG_DATES.forEach((dt, i) => {
        const u = cfBoUsers.value[i % Math.max(1, cfBoUsers.value.length)];
        if (!u) return;
        const resultCd = RESULT_CODES[i % RESULT_CODES.length];
        const isSuccess = resultCd === 'SUCCESS';
        const tHash = TOKEN_HASHES[i % TOKEN_HASHES.length];
        rows.push({
          logId:           'UL' + String(i + 1).padStart(14, '0').slice(-14),
          loginDate:       dt,
          userId:          'USR-' + String(u.boUserId).padStart(6, '0'),
          userNm:          u.name,
          dept:            u.dept,
          role:            u.role,
          loginId:         u.loginId,
          resultCd,
          failCnt:         isSuccess ? 0 : (i % 4) + 1,
          ip:              IP_LIST[i % IP_LIST.length],
          device:          BROWSER_LIST[i % BROWSER_LIST.length] + ' / ' + OS_LIST[i % OS_LIST.length],
          os:              OS_LIST[i % OS_LIST.length],
          browser:         BROWSER_LIST[i % BROWSER_LIST.length],
          accessToken:     isSuccess ? tHash.slice(0, 32) + '...' : null,
          accessTokenExp:  isSuccess ? dt.slice(0, 11) + '10:05:12' : null,
          refreshToken:    isSuccess ? tHash.slice(16, 48) + '...' : null,
          refreshTokenExp: isSuccess ? dt.slice(0, 8) + '26 09:05:12' : null,
        });
      });
      return rows;
    });

    const cfHistList = computed(() => cfLogList.value.map(r => ({
      histId:    'UHIST-' + r.logId.slice(-5),
      loginDate: r.loginDate,
      userId:    r.userId,
      userNm:    r.userNm,
      dept:      r.dept,
      ip:        r.ip,
      device:    r.device,
      resultCd:  r.resultCd,
    })));

    const TOKEN_ACTIONS  = ['ISSUE','REFRESH','REFRESH','REVOKE','EXPIRE'];
    const TOKEN_TYPES    = ['ACCESS','REFRESH'];
    const REVOKE_REASONS = ['','','','LOGOUT','FORCE'];

    const cfTokenList = computed(() => {
      const rows = [];
      cfLogList.value.filter(l => l.accessToken).forEach((l, i) => {
        const tHash = TOKEN_HASHES[i % TOKEN_HASHES.length];
        const actionCd = TOKEN_ACTIONS[i % TOKEN_ACTIONS.length];
        rows.push({
          tokenLogId:   'UTK' + l.logId.slice(-11),
          loginLogId:   l.logId,
          regDate:      l.loginDate,
          userId:       l.userId,
          userNm:       l.userNm,
          dept:         l.dept,
          actionCd,
          tokenTypeCd:  TOKEN_TYPES[i % TOKEN_TYPES.length],
          token:        tHash.slice(0, 32) + '...',
          tokenExp:     actionCd === 'EXPIRE' ? l.loginDate : l.accessTokenExp,
          prevToken:    actionCd === 'REFRESH' ? TOKEN_HASHES[(i+1) % TOKEN_HASHES.length].slice(0,16) + '...' : null,
          ip:           l.ip,
          device:       l.device,
          revokeReason: REVOKE_REASONS[i % REVOKE_REASONS.length] || null,
        });
      });
      return rows;
    });

    const filterRows = (list, keyField) => {
      const kw = uiState.searchKw.trim().toLowerCase();
      return list.filter(r => {
        const dt = r.loginDate || r.regDate || '';
        if (uiState.dateStart && dt.slice(0,10) < uiState.dateStart) return false;
        if (uiState.dateEnd   && dt.slice(0,10) > uiState.dateEnd)   return false;
        if (uiState.searchResult      && r.resultCd !== uiState.searchResult)       return false;
        if (uiState.searchTokenAction && r.actionCd !== uiState.searchTokenAction)  return false;
        if (uiState.searchIp && !r.ip?.includes(uiState.searchIp.trim()))           return false;
        if (kw && !r[keyField]?.toLowerCase().includes(kw)
               && !(r.userNm  || '').toLowerCase().includes(kw)
               && !(r.loginId || '').toLowerCase().includes(kw)
               && !(r.dept    || '').toLowerCase().includes(kw)
               && !(r.ip || '').includes(kw)) return false;
        return true;
      });
    };

    const cfFiltered = computed(() => {
      if (uiState.activeTab === 'log')   return filterRows(cfLogList.value,   'logId');
      if (uiState.activeTab === 'token') return filterRows(cfTokenList.value, 'tokenLogId');
      return filterRows(cfHistList.value, 'histId');
    });

    const cfTotal    = computed(() => cfFiltered.value.length);
    const cfTotPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const cfPageNums = computed(() => { const c=pager.page,l=cfTotPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const cfSummary = computed(() => {
      const all = filterRows(cfLogList.value, 'logId');
      const tk  = filterRows(cfTokenList.value, 'tokenLogId');
      const uniqueUsers = new Set(all.filter(r=>r.resultCd==='SUCCESS').map(r=>r.userId)).size;
      return {
        total:       all.length,
        success:     all.filter(r => r.resultCd === 'SUCCESS').length,
        fail:        all.filter(r => r.resultCd !== 'SUCCESS').length,
        tokenTotal:  tk.length,
        revoke:      tk.filter(r => r.actionCd === 'REVOKE').length,
        uniqueUsers,
      };
    });

    const expandedRows = reactive(new Set());
    const toggleRow = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };
    const isExpanded = id => expandedRows.has(id);

    const fnResultBadge = cd => ({ 'SUCCESS':'badge-green','FAIL_PW':'badge-red','FAIL_LOCKED':'badge-orange','FAIL_NOT_FOUND':'badge-gray' }[cd] || 'badge-gray');
    const fnResultLabel = cd => ({ 'SUCCESS':'성공','FAIL_PW':'비밀번호오류','FAIL_LOCKED':'계정잠금','FAIL_NOT_FOUND':'없는계정' }[cd] || cd);
    const fnActionBadge = cd => ({ 'ISSUE':'badge-blue','REFRESH':'badge-green','REVOKE':'badge-red','EXPIRE':'badge-orange' }[cd] || 'badge-gray');
    const fnActionLabel = cd => ({ 'ISSUE':'발급','REFRESH':'갱신','REVOKE':'폐기','EXPIRE':'만료' }[cd] || cd);
    const fnTypeBadge   = cd => ({ 'ACCESS':'badge-purple','REFRESH':'badge-blue' }[cd] || 'badge-gray');

    const onSearch     = async () => { pager.page = 1; await handleFetchData(); };
    const onReset      = async () => { uiState.searchKw=''; uiState.searchResult=''; uiState.searchIp=''; uiState.searchTokenAction=''; uiState.dateRange='이번달'; onDateRangeChange(); pager.page=1; await handleFetchData(); };
    const setPage      = n => { if (n >= 1 && n <= cfTotPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const onTabChange  = tab => { uiState.activeTab = tab; pager.page = 1; };

    return {
      uiState, onTabChange,
      DATE_RANGE_OPTIONS, onDateRangeChange,
      pager, PAGE_SIZES, cfFiltered, cfTotal, cfTotPages, cfPageList, cfPageNums, cfSummary,
      expandedRows, toggleRow, isExpanded,
      fnResultBadge, fnResultLabel, fnActionBadge, fnActionLabel, fnTypeBadge,
      onSearch, onReset, setPage, onSizeChange,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">사용자로그인이력</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">관리자 사용자의 로그인 시도 이력, 로그인 로그, 토큰 생애주기(발급·갱신·폐기·만료)를 조회합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 로그인 로그: syh_user_login_log — OS/브라우저/발급토큰 해시 포함
• 로그인 이력: syh_user_login_hist — 로그인 시도 간략 이력
• 토큰 이력: syh_user_token_log — 토큰 액션 (ISSUE발급 / REFRESH갱신 / REVOKE폐기 / EXPIRE만료)
• 토큰은 SHA-256 해시값 저장. 실제 토큰 원문 복원 불가
• 이상 로그인(외부IP/연속실패/REVOKE)은 보안 담당자에게 즉시 보고하세요.</div>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="uiState.searchResult" style="width:130px">
        <option value="">로그인결과 전체</option>
        <option value="SUCCESS">성공</option><option value="FAIL_PW">비밀번호오류</option>
        <option value="FAIL_LOCKED">계정잠금</option><option value="FAIL_NOT_FOUND">없는계정</option>
      </select>
      <select v-model="uiState.searchTokenAction" style="width:110px">
        <option value="">토큰액션 전체</option>
        <option value="ISSUE">발급</option><option value="REFRESH">갱신</option>
        <option value="REVOKE">폐기</option><option value="EXPIRE">만료</option>
      </select>
      <input v-model="uiState.searchIp" placeholder="IP 주소" style="width:140px" @keyup.enter="onSearch" />
      <input v-model="uiState.searchKw" placeholder="사용자ID / 이름 / 부서" style="width:190px" @keyup.enter="onSearch" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 집계 -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:12px 0">
    <div class="card" style="text-align:center;padding:12px;background:#f0f4ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">총 시도</div>
      <div style="font-size:20px;font-weight:700;color:#3498db">{{ cfSummary.total }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#f0fff4;margin-bottom:0">
      <div style="font-size:11px;color:#888">성공</div>
      <div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.success }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fff8f8;margin-bottom:0">
      <div style="font-size:11px;color:#888">실패</div>
      <div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.fail }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#f0f8f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">접속 인원</div>
      <div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.uniqueUsers }}명</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fdf8ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">토큰 이력</div>
      <div style="font-size:20px;font-weight:700;color:#8e44ad">{{ cfSummary.tokenTotal }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fff0f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">토큰 폐기</div>
      <div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.revoke }}</div>
    </div>
  </div>

  <!-- 탭 + 목록 -->
  <div class="card">
    <div class="tab-nav" style="margin-bottom:16px">
      <button class="tab-btn" :class="{active:uiState.activeTab==='log'}"   @click="onTabChange('log')">로그인 로그 <span class="tab-count" v-if="uiState.activeTab==='log'">{{ cfTotal }}</span></button>
      <button class="tab-btn" :class="{active:uiState.activeTab==='hist'}"  @click="onTabChange('hist')">로그인 이력 <span class="tab-count" v-if="uiState.activeTab==='hist'">{{ cfTotal }}</span></button>
      <button class="tab-btn" :class="{active:uiState.activeTab==='token'}" @click="onTabChange('token')">토큰 이력 <span class="tab-count" v-if="uiState.activeTab==='token'">{{ cfTotal }}</span></button>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfTotal }}건</span></div>

    <!-- ── 로그인 로그 탭 ── -->
    <div v-if="uiState.activeTab==='log'">
      <table class="bo-table">
        <thead>
          <tr>
            <th style="width:24px"></th><th>로그ID</th><th>로그인일시</th><th>사용자</th><th>부서/역할</th>
            <th>로그인ID</th><th>결과</th><th>실패</th><th>IP</th><th>OS / 브라우저</th><th>토큰</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in cfPageList" :key="r.logId">
            <tr style="cursor:pointer" :style="isExpanded(r.logId)?'background:#fafbff':''" @click="toggleRow(r.logId)">
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.logId)?'▲':'▼' }}</td>
              <td style="font-size:11px;color:#888;font-family:monospace">{{ r.logId }}</td>
              <td style="white-space:nowrap">{{ r.loginDate }}</td>
              <td><div style="font-weight:600">{{ r.userNm }}</div><div style="font-size:11px;color:#aaa">{{ r.userId }}</div></td>
              <td><div style="font-size:12px">{{ r.dept }}</div><div style="font-size:11px;color:#aaa">{{ r.role }}</div></td>
              <td style="font-size:12px;color:#555;font-family:monospace">{{ r.loginId }}</td>
              <td><span class="badge" :class="fnResultBadge(r.resultCd)">{{ fnResultLabel(r.resultCd) }}</span></td>
              <td style="text-align:center" :style="r.failCnt>0?'color:#e74c3c;font-weight:700':''">{{ r.failCnt > 0 ? r.failCnt+'회' : '-' }}</td>
              <td style="font-family:monospace;font-size:12px">{{ r.ip }}</td>
              <td><div style="font-size:12px">{{ r.browser }}</div><div style="font-size:11px;color:#aaa">{{ r.os }}</div></td>
              <td style="text-align:center">
                <span v-if="r.accessToken" class="badge badge-purple" style="font-size:10px">발급</span>
                <span v-else style="color:#ccc;font-size:12px">-</span>
              </td>
            </tr>
            <tr v-if="isExpanded(r.logId)">
              <td colspan="11" style="background:#f4f6fb;padding:14px 20px;border-top:none">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px">
                  <div>
                    <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">접속 정보</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">IP 주소</td><td style="font-family:monospace">{{ r.ip }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">OS</td><td>{{ r.os }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">브라우저</td><td>{{ r.browser }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">연속실패</td><td :style="r.failCnt>0?'color:#e74c3c;font-weight:700':''">{{ r.failCnt > 0 ? r.failCnt+'회' : '-' }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:6px;border-bottom:1px solid #e0c0f0;padding-bottom:3px">🔑 Access Token</div>
                    <div v-if="r.accessToken">
                      <table style="width:100%;border-collapse:collapse">
                        <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">토큰(해시)</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.accessToken }}</td></tr>
                        <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">만료일시</td><td style="color:#8e44ad;font-weight:600">{{ r.accessTokenExp }}</td></tr>
                      </table>
                      <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">ℹ SHA-256 해시. 유효기간 1시간</div>
                    </div>
                    <div v-else style="color:#bbb;padding:8px 0;font-size:12px">로그인 실패 — 토큰 미발급</div>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#2980b9;margin-bottom:6px;border-bottom:1px solid #c0d8f0;padding-bottom:3px">🔄 Refresh Token</div>
                    <div v-if="r.refreshToken">
                      <table style="width:100%;border-collapse:collapse">
                        <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">토큰(해시)</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.refreshToken }}</td></tr>
                        <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">만료일시</td><td style="color:#2980b9;font-weight:600">{{ r.refreshTokenExp }}</td></tr>
                      </table>
                      <div style="margin-top:6px;padding:5px 8px;background:#f0f8ff;border-radius:4px;font-size:11px;color:#888">ℹ 관리자 세션 유지용. 유효기간 7일</div>
                    </div>
                    <div v-else style="color:#bbb;padding:8px 0;font-size:12px">로그인 실패 — 토큰 미발급</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!cfPageList.length"><td colspan="11" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── 로그인 이력 탭 ── -->
    <div v-if="uiState.activeTab==='hist'">
      <table class="bo-table">
        <thead><tr><th>이력ID</th><th>로그인일시</th><th>사용자</th><th>부서</th><th>IP</th><th>디바이스</th><th>결과</th></tr></thead>
        <tbody>
          <tr v-for="r in cfPageList" :key="r.histId">
            <td style="font-size:11px;color:#888;font-family:monospace">{{ r.histId }}</td>
            <td style="white-space:nowrap">{{ r.loginDate }}</td>
            <td><div style="font-weight:600">{{ r.userNm }}</div><div style="font-size:11px;color:#aaa">{{ r.userId }}</div></td>
            <td style="font-size:12px;color:#666">{{ r.dept }}</td>
            <td style="font-family:monospace;font-size:12px">{{ r.ip }}</td>
            <td style="font-size:12px;color:#666;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.device }}</td>
            <td><span class="badge" :class="fnResultBadge(r.resultCd)">{{ fnResultLabel(r.resultCd) }}</span></td>
          </tr>
          <tr v-if="!cfPageList.length"><td colspan="7" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── 토큰 이력 탭 ── -->
    <div v-if="uiState.activeTab==='token'">
      <table class="bo-table">
        <thead>
          <tr>
            <th style="width:24px"></th><th>토큰로그ID</th><th>일시</th><th>사용자</th>
            <th>액션</th><th>토큰유형</th><th>토큰(해시)</th><th>만료일시</th><th>IP</th><th>폐기사유</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in cfPageList" :key="r.tokenLogId">
            <tr style="cursor:pointer" :style="isExpanded(r.tokenLogId)?'background:#fafbff':''" @click="toggleRow(r.tokenLogId)">
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.tokenLogId)?'▲':'▼' }}</td>
              <td style="font-size:11px;color:#888;font-family:monospace">{{ r.tokenLogId }}</td>
              <td style="white-space:nowrap">{{ r.regDate }}</td>
              <td><div style="font-weight:600">{{ r.userNm }}</div><div style="font-size:11px;color:#aaa">{{ r.userId }}</div></td>
              <td><span class="badge" :class="fnActionBadge(r.actionCd)">{{ fnActionLabel(r.actionCd) }}</span></td>
              <td><span class="badge" :class="fnTypeBadge(r.tokenTypeCd)" style="font-size:11px">{{ r.tokenTypeCd }}</span></td>
              <td style="font-family:monospace;font-size:11px;color:#555;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.token }}</td>
              <td style="font-size:12px" :style="r.actionCd==='EXPIRE'||r.actionCd==='REVOKE'?'color:#e74c3c':''">{{ r.tokenExp }}</td>
              <td style="font-family:monospace;font-size:12px">{{ r.ip }}</td>
              <td style="font-size:12px;color:#e74c3c">{{ r.revokeReason || '-' }}</td>
            </tr>
            <tr v-if="isExpanded(r.tokenLogId)">
              <td colspan="10" style="background:#f4f6fb;padding:14px 20px;border-top:none">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px">
                  <div>
                    <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">토큰 정보</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">토큰로그ID</td><td style="font-family:monospace;font-size:11px">{{ r.tokenLogId }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">연결 로그인ID</td><td style="font-family:monospace;font-size:11px">{{ r.loginLogId }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">액션</td><td><span class="badge" :class="fnActionBadge(r.actionCd)">{{ fnActionLabel(r.actionCd) }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">토큰유형</td><td><span class="badge" :class="fnTypeBadge(r.tokenTypeCd)">{{ r.tokenTypeCd }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">만료일시</td><td :style="r.actionCd==='EXPIRE'||r.actionCd==='REVOKE'?'color:#e74c3c;font-weight:700':''">{{ r.tokenExp }}</td></tr>
                      <tr v-if="r.revokeReason"><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">폐기사유</td><td style="color:#e74c3c;font-weight:600">{{ r.revokeReason }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">IP</td><td style="font-family:monospace">{{ r.ip }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:6px;border-bottom:1px solid #e0c0f0;padding-bottom:3px">토큰 해시값</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">현재 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.token }}</td></tr>
                      <tr v-if="r.prevToken"><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">이전 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#aaa">{{ r.prevToken }}</td></tr>
                    </table>
                    <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">ℹ SHA-256 해시. 원문 복원 불가 — syh_user_token_log</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!cfPageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotPages" @click="setPage(cfTotPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
</div>
`,
};
