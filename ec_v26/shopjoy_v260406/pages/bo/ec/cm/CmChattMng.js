/* ShopJoy Admin - 채팅관리 목록 + 하단 ChattDtl 임베드 */
window.CmChattMng = {
  name: 'CmChattMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const chatts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ chatt_message_types: [], chatt_statuses: [], date_range_opts: [] });

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.chatt_message_types = await codeStore.snGetGrpCodes('CHATT_MESSAGE_TYPE') || [];
        codes.chatt_statuses = await codeStore.snGetGrpCodes('CHATT_STATUS') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { kw: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmChatt.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '채팅관리', '목록조회');
        const data = res.data?.data;
        chatts.splice(0, chatts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });

    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'cmChattMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const fnStatusBadge = s => ({ '진행중': 'badge-green', '종료': 'badge-gray' }[s] || 'badge-gray');

    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (c) => {
      const ok = await props.showConfirm('삭제', `[${c.subject}] 채팅을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = chatts.findIndex(x => x.chatId === c.chatId);
      if (idx !== -1) chatts.splice(idx, 1);
      if (uiStateDetail.selectedId === c.chatId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.cmChatt.remove(c.chatId, '채팅관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(chatts, [{label:'채팅ID',key:'chattId'},{label:'회원명',key:'userNm'},{label:'상태',key:'status'},{label:'마지막메시지',key:'lastMessage'},{label:'등록일',key:'regDate'}], '채팅목록.csv');

    // ── return ───────────────────────────────────────────────────────────────

    return {
      chatts, uiState, codes, searchParam,
      handleDateRangeChange, cfSiteNm,
      pager, fnStatusBadge,
      onSearch, onReset, setPage, onSizeChange, handleDelete,
      uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId),
      cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail,
      inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel
    };
  },
  template: /* html */`
<div>
  <div class="page-title">채팅관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="회원명 / 제목 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.chatt_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>채팅목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th><th>회원</th><th>제목</th><th>마지막 메시지</th><th>메시지수</th><th>미읽음</th><th>상태</th><th>일시</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="chatts.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(c, idx) in chatts" :key="c?.chatId" :style="uiStateDetail.selectedId===c.chatId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userNm }}</span></td>
          <td><span class="title-link" @click="handleLoadDetail(c.chatId)" :style="uiStateDetail.selectedId===c.chatId?'color:#e8587a;font-weight:700;':''">{{ c.subject }}<span v-if="uiStateDetail.selectedId===c.chatId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888;">{{ c.lastMsg || '-' }}</td>
          <td>{{ (c.messages||[]).length }}개</td>
          <td>
            <span v-if="c.unread > 0" class="badge badge-red">{{ c.unread }}</span>
            <span v-else class="badge badge-gray">0</span>
          </td>
          <td><span class="badge" :class="fnStatusBadge(c.status)">{{ c.status }}</span></td>
          <td>{{ c.date }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.chatId)">보기</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(c)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in pager.pageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── 하단 상세: ChattDtl 임베드 ──────────────────────────────────────────── -->
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <cm-chatt-dtl
      :key="uiStateDetail.selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
    />
  </div>
</div>
`
};
