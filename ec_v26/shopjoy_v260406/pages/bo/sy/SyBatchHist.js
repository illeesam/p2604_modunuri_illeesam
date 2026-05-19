/* ShopJoy Admin - 배치 실행이력 */
window.SyBatchHist = {
  name: 'SyBatchHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    boData:       { type: Object, default: () => ({}) }, // BO 공통 데이터
    batchCode:    { type: String, default: null }, // 대상 코드
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const batches = reactive([]);
    const batchLogs = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, error: null, searchBatchId: '', searchStatus: '', expandedSet: new Set() });
    const codes = reactive({ batch_run_statuses: [] });

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const logParams = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          sortBy: 'runAt', sortDir: 'desc',
          ...(uiState.searchBatchId ? { batchId: uiState.searchBatchId }   : {}),
          ...(uiState.searchStatus  ? { runStatus: uiState.searchStatus }  : {}),
        };

        const [resBatch, resLogs] = await Promise.all([
          boApiSvc.syBatch.getPage({ pageNo: 1, pageSize: 10000 }, '배치이력', '목록조회'),
          boApiSvc.syBatchLog.getPage(logParams, '배치이력', '목록조회'),
        ]);
        batches.splice(0, batches.length, ...(resBatch.data?.data?.list || []));
        const d = resLogs.data?.data;
        batchLogs.splice(0, batchLogs.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* 배치 fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.batch_run_statuses = codeStore.sgGetGrpCodes('BATCH_RUN_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfBatchOptions = computed(() =>
      batches.map(b => ({ batchId: b.batchId, label: b.batchNm }))
    );

    /* 배치 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 배치 setPage */
    const setPage      = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData().then(() => { onExpandAll(); }); } };

    /* 배치 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData().then(() => { onExpandAll(); }); };

    /* 배치 목록조회 */
    const onSearch     = () => { pager.pageNo = 1; handleSearchData('DEFAULT').then(() => { onExpandAll(); }); };

    /* ── 메시지 상세 토글 ── */
    const isExpanded = (logId) => uiState.expandedSet.has(logId);

    /* 배치 toggleExpand */
    const toggleExpand = (logId) => {
      if (uiState.expandedSet.has(logId)) uiState.expandedSet.delete(logId);
      else uiState.expandedSet.add(logId);
    };

    /* 배치 onExpandAll */
    const onExpandAll = () => {
      uiState.expandedSet.clear();
      batchLogs.forEach(l => uiState.expandedSet.add(l.batchLogId));
    };

    /* 배치 onCollapseAll */
    const onCollapseAll = () => {
      uiState.expandedSet.clear();
    };

    /* 배치 fnRunBadge */
    const fnRunBadge = s => ({ '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' }[s] || 'badge-gray');

    /* 배치 fnFmtDuration */
    const fnFmtDuration = (sec) => {
      if (!sec && sec !== 0) return '-';
      if (sec < 60) return `${sec}초`;
      return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
    };

    // ── return ───────────────────────────────────────────────────────────────

    onMounted(() => {
      handleSearchData().then(() => { onExpandAll(); });
    });

    /* BoGridReadonly 컬럼 정의 (행펼침 #row-expand) */
    const histColumns = [
      { key: 'batchLogId', label: '로그ID',  style: 'width:46px;', cellStyle: 'color:#aaa' },
      { key: 'batchNm',    label: '배치명',  style: 'min-width:120px;', cellStyle: 'font-weight:500' },
      { key: '_batchCode', label: '배치코드', style: 'min-width:150px;' },
      { key: 'runAt',      label: '실행일시', style: 'width:128px;', cellStyle: 'color:#555;font-family:monospace;font-size:11px' },
      { key: 'durationMs', label: '소요시간', style: 'width:66px;text-align:center;', align: 'center', cellStyle: 'color:#666', fmt: (v) => fnFmtDuration(v) },
      { key: 'runStatus',  label: '결과',    style: 'width:66px;text-align:center;', align: 'center', badge: (row) => fnRunBadge(row.runStatus) },
      { key: 'message',    label: '메시지',  style: 'width:auto;', cellStyle: (v, row) => 'font-size:11px;max-width:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;' + (row.runStatus === '실패' ? 'color:#dc2626' : 'color:#555') },
      { key: '_exp',       label: '',        style: 'width:32px;' },
    ];
    const fnRowExpanded = (log) => isExpanded(log.batchLogId);
    const fnHistRowStyle = (log) =>
      log.runStatus === '실패' ? 'background:#fff5f5;' : log.runStatus === '실행중' ? 'background:#f0f8ff;' : '';

    return { batches, batchLogs, uiState, cfBatchOptions,
      pager,
      setPage, onSizeChange, onSearch,
      isExpanded, toggleExpand, onExpandAll, onCollapseAll,
      fnRunBadge, fnFmtDuration,
      codes,
      histColumns, fnRowExpanded, fnHistRowStyle,
    };
  },
  template: /* html */`
<div>
  <bo-grid-readonly
    :columns="histColumns" :rows="batchLogs" :pager="pager" row-key="batchLogId"
    list-title="배치 실행이력" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnHistRowStyle" :is-expanded="fnRowExpanded" row-clickable
    empty-text="실행이력이 없습니다."
    @set-page="setPage" @size-change="onSizeChange" @row-click="row => toggleExpand(row.batchLogId)">

    <template #toolbar-actions>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-secondary btn-sm" @click="onExpandAll" style="height:30px;font-size:11px;padding:2px 8px;" title="전체 펼치기">▼ 전체펼치기</button>
        <button class="btn btn-secondary btn-sm" @click="onCollapseAll" style="height:30px;font-size:11px;padding:2px 8px;" title="전체 접기">▲ 전체접기</button>
        <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:160px;" v-model="uiState.searchBatchId">
          <option value="">배치 전체</option>
          <option v-for="b in cfBatchOptions" :key="b.batchId" :value="b.batchId">{{ b.label }}</option>
        </select>
        <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:90px;" v-model="uiState.searchStatus">
          <option value="">상태 전체</option>
          <option v-for="c in codes.batch_run_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="onSearch" style="height:30px;font-size:12px;padding:2px 12px;">조회</button>
      </div>
    </template>

    <template #cell-_batchCode="{ row }">
      <td><code style="font-size:11px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ row.batchCode }}</code></td>
    </template>
    <template #cell-_exp="{ row }">
      <td style="text-align:center;padding:0 4px;">
        <button
          @click="toggleExpand(row.batchLogId)"
          :title="isExpanded(row.batchLogId) ? '접기' : '상세 펼치기'"
          style="background:none;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;padding:2px 5px;font-size:11px;color:#888;line-height:1;transition:all .15s;"
          :style="isExpanded(row.batchLogId) ? 'background:#f0f8ff;border-color:#2563eb;color:#2563eb;' : ''">
          {{ isExpanded(row.batchLogId) ? '▲' : '▼' }}
        </button>
      </td>
    </template>

    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="padding:0;"
        :style="row.runStatus==='실패' ? 'background:#fff0f0;' : 'background:#f8faff;'">
        <div style="padding:12px 16px 14px;border-top:1px dashed #e0e0e0;">
          <div style="display:flex;gap:24px;margin-bottom:10px;flex-wrap:wrap;">
            <div>
              <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">배치명</span>
              <span style="font-size:12px;font-weight:600;color:#333;">{{ row.batchNm }}</span>
            </div>
            <div>
              <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">배치코드</span>
              <code style="font-size:12px;color:#2563eb;">{{ row.batchCode }}</code>
            </div>
            <div>
              <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">실행일시</span>
              <span style="font-size:12px;font-family:monospace;color:#555;">{{ row.runAt }}</span>
            </div>
            <div>
              <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">소요시간</span>
              <span style="font-size:12px;color:#555;">{{ fnFmtDuration(row.durationMs) }}</span>
            </div>
            <div>
              <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">실행결과</span>
              <span class="badge badge-xs" :class="fnRunBadge(row.runStatus)">{{ row.runStatus }}</span>
            </div>
          </div>
          <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:4px;">메시지</div>
          <div style="font-size:12px;padding:8px 12px;border-radius:5px;line-height:1.7;white-space:pre-wrap;word-break:break-all;"
            :style="row.runStatus==='실패'
              ? 'background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-family:monospace;'
              : 'background:#f1f5f9;border:1px solid #e2e8f0;color:#374151;'">{{ row.message }}</div>
          <template v-if="row.detail">
            <div style="font-size:11px;font-weight:600;color:#888;margin:10px 0 4px;">상세 내용</div>
            <pre style="margin:0;font-size:11px;padding:10px 12px;border-radius:5px;white-space:pre-wrap;word-break:break-all;line-height:1.65;font-family:monospace;"
              :style="row.runStatus==='실패'
                ? 'background:#1e1e1e;color:#f87171;border:1px solid #7f1d1d;'
                : 'background:#1e1e1e;color:#86efac;border:1px solid #14532d;'">{{ row.detail }}</pre>
          </template>
        </div>
      </td>
    </template>
  </bo-grid-readonly>
</div>
`,
};
