/* ShopJoy Admin - 회원로그인이력 */
window.SyMemberLoginHist = {
  name: 'SyMemberLoginHist',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const descOpen = ref(false);
    const activeTab = ref('log'); // 'log' | 'hist' | 'token'

    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) { const r = window.adminUtil.getDateRange(dateRange.value); dateStart.value = r ? r.from : ''; dateEnd.value = r ? r.to : ''; }
    };
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    const searchKw      = ref('');
    const searchResult  = ref('');
    const searchIp      = ref('');
    const searchTokenAction = ref('');
    const pager = reactive({ page: 1, size: 20 });

    const members = computed(() => props.adminData.members || []);

    const OS_LIST      = ['Windows 11','Windows 10','macOS 14','macOS 13','iOS 17','Android 14'];
    const BROWSER_LIST = ['Chrome 123','Safari 17','Edge 122','Firefox 124','Samsung Browser 24'];
    const IP_LIST      = ['220.75.12.34','14.49.108.22','175.223.45.11','61.83.204.7','222.110.5.89','123.45.67.89'];
    const COUNTRY_LIST = ['KR','KR','KR','KR','KR','US'];
    const RESULT_CODES = ['SUCCESS','SUCCESS','SUCCESS','SUCCESS','SUCCESS','FAIL_PW','FAIL_LOCKED','FAIL_NOT_FOUND','FAIL_DORMANT'];
    const TOKEN_HASHES = [
      'a3f8e2c1d4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      'b4c9f3d2e5c6f7a8b9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      'c5d0a4e3f6d7a8b9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      'd6e1b5f4a7e8b9c0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
      'e7f2c6a5b8f9c0d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    ];

    const LOG_DATES = [
      '2026-04-19 09:12:34','2026-04-19 08:55:10','2026-04-18 22:30:07','2026-04-18 18:14:52',
      '2026-04-17 14:05:33','2026-04-17 11:44:21','2026-04-16 20:08:55','2026-04-16 09:22:41',
      '2026-04-15 17:33:18','2026-04-15 10:00:05','2026-04-14 23:11:44','2026-04-14 12:38:02',
      '2026-04-13 08:47:29','2026-04-12 19:55:16','2026-04-11 15:22:43','2026-04-10 09:05:37',
    ];

    const logList = computed(() => {
      const rows = [];
      LOG_DATES.forEach((dt, i) => {
        const m = members.value[i % Math.max(1, members.value.length)];
        if (!m) return;
        const resultCd = RESULT_CODES[i % RESULT_CODES.length];
        const isSuccess = resultCd === 'SUCCESS';
        const tHash = TOKEN_HASHES[i % TOKEN_HASHES.length];
        rows.push({
          logId:           '26' + String(i + 1).padStart(14, '0').slice(-14),
          loginDate:       dt,
          memberId:        'MBR-' + String(m.userId).padStart(6, '0'),
          memberNm:        m.memberNm,
          loginId:         m.email,
          resultCd,
          failCnt:         isSuccess ? 0 : (i % 3) + 1,
          ip:              IP_LIST[i % IP_LIST.length],
          device:          BROWSER_LIST[i % BROWSER_LIST.length] + ' / ' + OS_LIST[i % OS_LIST.length],
          os:              OS_LIST[i % OS_LIST.length],
          browser:         BROWSER_LIST[i % BROWSER_LIST.length],
          country:         COUNTRY_LIST[i % COUNTRY_LIST.length],
          accessToken:     isSuccess ? tHash.slice(0, 32) + '...' : null,
          accessTokenExp:  isSuccess ? dt.slice(0, 11) + '10:12:34' : null,
          refreshToken:    isSuccess ? tHash.slice(16, 48) + '...' : null,
          refreshTokenExp: isSuccess ? dt.slice(0, 8) + '29 09:12:34' : null,
        });
      });
      return rows;
    });

    const histList = computed(() => logList.value.map(r => ({
      histId:    'HIST-' + r.logId.slice(-6),
      loginDate: r.loginDate,
      memberId:  r.memberId,
      memberNm:  r.memberNm,
      ip:        r.ip,
      device:    r.device,
      resultCd:  r.resultCd,
    })));

    const TOKEN_ACTIONS = ['ISSUE','REFRESH','REFRESH','REVOKE','EXPIRE'];
    const TOKEN_TYPES   = ['ACCESS','REFRESH'];
    const REVOKE_REASONS = ['','','','LOGOUT','FORCE'];

    const tokenList = computed(() => {
      const rows = [];
      logList.value.filter(l => l.accessToken).forEach((l, i) => {
        const tHash = TOKEN_HASHES[i % TOKEN_HASHES.length];
        const actionCd = TOKEN_ACTIONS[i % TOKEN_ACTIONS.length];
        rows.push({
          tokenLogId:   'TK' + l.logId.slice(-12),
          loginLogId:   l.logId,
          regDate:      l.loginDate,
          memberId:     l.memberId,
          memberNm:     l.memberNm,
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
      const kw = searchKw.value.trim().toLowerCase();
      return list.filter(r => {
        if (dateStart.value && r.loginDate?.slice(0,10) < dateStart.value && r.regDate?.slice(0,10) < dateStart.value) return false;
        if (dateEnd.value   && r.loginDate?.slice(0,10) > dateEnd.value   && r.regDate?.slice(0,10)  > dateEnd.value)   return false;
        if (searchResult.value && r.resultCd !== searchResult.value) return false;
        if (searchTokenAction.value && r.actionCd !== searchTokenAction.value) return false;
        if (searchIp.value && !r.ip?.includes(searchIp.value.trim())) return false;
        if (kw && !r[keyField]?.toLowerCase().includes(kw)
               && !(r.memberNm || '').toLowerCase().includes(kw)
               && !(r.loginId  || '').toLowerCase().includes(kw)
               && !(r.ip || '').includes(kw)) return false;
        return true;
      });
    };

    const filtered = computed(() => {
      if (activeTab.value === 'log')   return filterRows(logList.value,   'logId');
      if (activeTab.value === 'token') return filterRows(tokenList.value, 'tokenLogId');
      return filterRows(histList.value, 'histId');
    });

    const total    = computed(() => filtered.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const summary = computed(() => {
      const all = filterRows(logList.value, 'logId');
      const tk  = filterRows(tokenList.value, 'tokenLogId');
      return {
        total:   all.length,
        success: all.filter(r => r.resultCd === 'SUCCESS').length,
        fail:    all.filter(r => r.resultCd !== 'SUCCESS').length,
        revoke:  tk.filter(r => r.actionCd === 'REVOKE').length,
        tokenTotal: tk.length,
      };
    });

    const expandedRows = reactive(new Set());
    const toggleRow = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };
    const isExpanded = id => expandedRows.has(id);

    const resultBadge = cd => ({ 'SUCCESS':'badge-green','FAIL_PW':'badge-red','FAIL_LOCKED':'badge-orange','FAIL_NOT_FOUND':'badge-gray','FAIL_DORMANT':'badge-purple' }[cd] || 'badge-gray');
    const resultLabel = cd => ({ 'SUCCESS':'성공','FAIL_PW':'비밀번호오류','FAIL_LOCKED':'계정잠금','FAIL_NOT_FOUND':'없는계정','FAIL_DORMANT':'휴면계정' }[cd] || cd);
    const actionBadge = cd => ({ 'ISSUE':'badge-blue','REFRESH':'badge-green','REVOKE':'badge-red','EXPIRE':'badge-orange' }[cd] || 'badge-gray');
    const actionLabel = cd => ({ 'ISSUE':'발급','REFRESH':'갱신','REVOKE':'폐기','EXPIRE':'만료' }[cd] || cd);
    const typeBadge   = cd => ({ 'ACCESS':'badge-purple','REFRESH':'badge-blue' }[cd] || 'badge-gray');

    const onSearch     = () => { pager.page = 1; };
    const onReset      = () => { searchKw.value=''; searchResult.value=''; searchIp.value=''; searchTokenAction.value=''; dateRange.value='이번달'; onDateRangeChange(); pager.page=1; };
    const setPage      = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const onTabChange  = tab => { activeTab.value = tab; pager.page = 1; };

    return {
      descOpen, activeTab, onTabChange,
      DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange,
      searchKw, searchResult, searchIp, searchTokenAction,
      pager, PAGE_SIZES, filtered, total, totPages, pageList, pageNums, summary,
      expandedRows, toggleRow, isExpanded,
      resultBadge, resultLabel, actionBadge, actionLabel, typeBadge,
      onSearch, onReset, setPage, onSizeChange,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">회원로그인이력</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">회원의 로그인 시도 이력, 로그인 로그, 토큰 생애주기(발급·갱신·폐기·만료)를 조회합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 로그인 로그: mbh_member_login_log — OS/브라우저/국가/발급토큰 해시 포함
• 로그인 이력: mbh_member_login_hist — 로그인 시도 간략 이력
• 토큰 이력: mbh_member_token_log — 토큰 액션 (ISSUE발급 / REFRESH갱신 / REVOKE폐기 / EXPIRE만료)
• 토큰은 SHA-256 해시값 저장. 실제 토큰 원문 복원 불가
• 행 클릭 시 상세 정보 확장 표시</div>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchResult" style="width:130px">
        <option value="">로그인결과 전체</option>
        <option value="SUCCESS">성공</option><option value="FAIL_PW">비밀번호오류</option>
        <option value="FAIL_LOCKED">계정잠금</option><option value="FAIL_NOT_FOUND">없는계정</option><option value="FAIL_DORMANT">휴면계정</option>
      </select>
      <select v-model="searchTokenAction" style="width:110px">
        <option value="">토큰액션 전체</option>
        <option value="ISSUE">발급</option><option value="REFRESH">갱신</option>
        <option value="REVOKE">폐기</option><option value="EXPIRE">만료</option>
      </select>
      <input v-model="searchIp" placeholder="IP 주소" style="width:140px" @keyup.enter="onSearch" />
      <input v-model="searchKw" placeholder="회원ID / 이름 / 이메일" style="width:190px" @keyup.enter="onSearch" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 집계 -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0">
    <div class="card" style="text-align:center;padding:12px;background:#f0f4ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">총 로그인 시도</div>
      <div style="font-size:22px;font-weight:700;color:#3498db">{{ summary.total }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#f0fff4;margin-bottom:0">
      <div style="font-size:11px;color:#888">성공</div>
      <div style="font-size:22px;font-weight:700;color:#27ae60">{{ summary.success }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fff8f8;margin-bottom:0">
      <div style="font-size:11px;color:#888">실패</div>
      <div style="font-size:22px;font-weight:700;color:#e74c3c">{{ summary.fail }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fdf8ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">토큰 이력</div>
      <div style="font-size:22px;font-weight:700;color:#8e44ad">{{ summary.tokenTotal }}</div>
    </div>
    <div class="card" style="text-align:center;padding:12px;background:#fff0f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">토큰 폐기</div>
      <div style="font-size:22px;font-weight:700;color:#e74c3c">{{ summary.revoke }}</div>
    </div>
  </div>

  <!-- 탭 + 목록 -->
  <div class="card">
    <div class="tab-nav" style="margin-bottom:16px">
      <button class="tab-btn" :class="{active:activeTab==='log'}"   @click="onTabChange('log')">로그인 로그 <span class="tab-count" v-if="activeTab==='log'">{{ total }}</span></button>
      <button class="tab-btn" :class="{active:activeTab==='hist'}"  @click="onTabChange('hist')">로그인 이력 <span class="tab-count" v-if="activeTab==='hist'">{{ total }}</span></button>
      <button class="tab-btn" :class="{active:activeTab==='token'}" @click="onTabChange('token')">토큰 이력 <span class="tab-count" v-if="activeTab==='token'">{{ total }}</span></button>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>

    <!-- ── 로그인 로그 탭 ── -->
    <div v-if="activeTab==='log'">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:24px"></th><th>로그ID</th><th>로그인일시</th><th>회원</th><th>로그인ID</th>
            <th>결과</th><th>실패</th><th>IP</th><th>OS / 브라우저</th><th>국가</th><th>토큰</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in pageList" :key="r.logId">
            <tr style="cursor:pointer" :style="isExpanded(r.logId)?'background:#fafbff':''" @click="toggleRow(r.logId)">
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.logId)?'▲':'▼' }}</td>
              <td style="font-size:11px;color:#888;font-family:monospace">{{ r.logId }}</td>
              <td style="white-space:nowrap">{{ r.loginDate }}</td>
              <td><div style="font-weight:600">{{ r.memberNm }}</div><div style="font-size:11px;color:#aaa">{{ r.memberId }}</div></td>
              <td style="font-size:12px;color:#555">{{ r.loginId }}</td>
              <td><span class="badge" :class="resultBadge(r.resultCd)">{{ resultLabel(r.resultCd) }}</span></td>
              <td style="text-align:center" :style="r.failCnt>0?'color:#e74c3c;font-weight:700':''">{{ r.failCnt > 0 ? r.failCnt+'회' : '-' }}</td>
              <td style="font-family:monospace;font-size:12px">{{ r.ip }}</td>
              <td><div style="font-size:12px">{{ r.browser }}</div><div style="font-size:11px;color:#aaa">{{ r.os }}</div></td>
              <td style="text-align:center"><span class="badge" :class="r.country==='KR'?'badge-blue':'badge-orange'" style="font-size:11px">{{ r.country }}</span></td>
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
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">국가</td><td>{{ r.country }}</td></tr>
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
                      <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">ℹ SHA-256 해시 저장. 유효기간 1시간</div>
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
                      <div style="margin-top:6px;padding:5px 8px;background:#f0f8ff;border-radius:4px;font-size:11px;color:#888">ℹ 장기 세션 유지용. 유효기간 30일</div>
                    </div>
                    <div v-else style="color:#bbb;padding:8px 0;font-size:12px">로그인 실패 — 토큰 미발급</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!pageList.length"><td colspan="11" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── 로그인 이력 탭 ── -->
    <div v-if="activeTab==='hist'">
      <table class="admin-table">
        <thead><tr><th>이력ID</th><th>로그인일시</th><th>회원</th><th>IP</th><th>디바이스</th><th>결과</th></tr></thead>
        <tbody>
          <tr v-for="r in pageList" :key="r.histId">
            <td style="font-size:11px;color:#888;font-family:monospace">{{ r.histId }}</td>
            <td style="white-space:nowrap">{{ r.loginDate }}</td>
            <td><div style="font-weight:600">{{ r.memberNm }}</div><div style="font-size:11px;color:#aaa">{{ r.memberId }}</div></td>
            <td style="font-family:monospace;font-size:12px">{{ r.ip }}</td>
            <td style="font-size:12px;color:#666;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.device }}</td>
            <td><span class="badge" :class="resultBadge(r.resultCd)">{{ resultLabel(r.resultCd) }}</span></td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="6" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── 토큰 이력 탭 ── -->
    <div v-if="activeTab==='token'">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:24px"></th><th>토큰로그ID</th><th>일시</th><th>회원</th>
            <th>액션</th><th>토큰유형</th><th>토큰(해시)</th><th>만료일시</th><th>IP</th><th>폐기사유</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in pageList" :key="r.tokenLogId">
            <tr style="cursor:pointer" :style="isExpanded(r.tokenLogId)?'background:#fafbff':''" @click="toggleRow(r.tokenLogId)">
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.tokenLogId)?'▲':'▼' }}</td>
              <td style="font-size:11px;color:#888;font-family:monospace">{{ r.tokenLogId }}</td>
              <td style="white-space:nowrap">{{ r.regDate }}</td>
              <td><div style="font-weight:600">{{ r.memberNm }}</div><div style="font-size:11px;color:#aaa">{{ r.memberId }}</div></td>
              <td><span class="badge" :class="actionBadge(r.actionCd)">{{ actionLabel(r.actionCd) }}</span></td>
              <td><span class="badge" :class="typeBadge(r.tokenTypeCd)" style="font-size:11px">{{ r.tokenTypeCd }}</span></td>
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
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">액션</td><td><span class="badge" :class="actionBadge(r.actionCd)">{{ actionLabel(r.actionCd) }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">토큰유형</td><td><span class="badge" :class="typeBadge(r.tokenTypeCd)">{{ r.tokenTypeCd }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">만료일시</td><td :style="r.actionCd==='EXPIRE'||r.actionCd==='REVOKE'?'color:#e74c3c;font-weight:700':''">{{ r.tokenExp }}</td></tr>
                      <tr v-if="r.revokeReason"><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">폐기사유</td><td style="color:#e74c3c;font-weight:600">{{ r.revokeReason }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:6px;border-bottom:1px solid #e0c0f0;padding-bottom:3px">토큰 해시값</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">현재 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.token }}</td></tr>
                      <tr v-if="r.prevToken"><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">이전 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#aaa">{{ r.prevToken }}</td></tr>
                      <tr><td style="color:#888;padding:3px 8px 3px 0;white-space:nowrap">IP</td><td style="font-family:monospace">{{ r.ip }}</td></tr>
                    </table>
                    <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">ℹ SHA-256 해시. 원문 복원 불가 — mbh_member_token_log</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!pageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totPages" @click="setPage(totPages)">»</button>
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
