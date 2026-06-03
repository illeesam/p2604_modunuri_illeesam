/* ShopJoy Admin - 배치 실행이력 */
window.SyBatchHist = {
  name: 'SyBatchHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    boData:       { type: Object, default: () => ({}) }, // BO 공통 데이터
    batchCode:    { type: String, default: null }, // 대상 코드
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const batches = reactive([]);                  // 배치 마스터 목록 (select 옵션용)
    const batchLogs = reactive([]);                // 배치 실행이력 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, isPageCodeLoad: false, error: null,
      searchBatchId: '', searchStatus: '', expandedSet: new Set(),
    });
    const codes = reactive({ batch_run_statuses: [] });

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBatchHist.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchData('DEFAULT').then(() => { onExpandAll(); });
      // 모든 행 펼치기
      } else if (cmd === 'batchLogs-expandAll') {
        return onExpandAll();
      // 모든 행 접기
      } else if (cmd === 'batchLogs-collapseAll') {
        return onCollapseAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBatchHist.js : handleSelectAction -> ', cmd, param);
      // 페이지 번호 클릭
      if (cmd === 'batchLogs-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'batchLogs-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 펼침 토글
      } else if (cmd === 'batchLogs-rowToggle') {
        return toggleExpand(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchData — 목록 조회 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const logParams = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          sortBy: 'runAt', sortDir: 'desc',
          ...(uiState.searchBatchId ? { batchId: uiState.searchBatchId } : {}),
          ...(uiState.searchStatus  ? { runStatus: uiState.searchStatus } : {}),
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

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData().then(() => { onExpandAll(); }); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData().then(() => { onExpandAll(); }); };

    /* isExpanded — 펼침 여부 */
    const isExpanded = (logId) => uiState.expandedSet.has(logId);

    /* toggleExpand — 펼침 토글 */
    const toggleExpand = (logId) => {
      if (uiState.expandedSet.has(logId)) { uiState.expandedSet.delete(logId); }
      else { uiState.expandedSet.add(logId); }
    };

    /* onExpandAll — 전체 펼치기 */
    const onExpandAll = () => {
      uiState.expandedSet.clear();
      batchLogs.forEach(l => uiState.expandedSet.add(l.batchLogId));
    };

    /* onCollapseAll — 전체 접기 */
    const onCollapseAll = () => { uiState.expandedSet.clear(); };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* fnLoadCodes — 공통코드 로드 */
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData().then(() => { onExpandAll(); });
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* 배치 fnRunBadge — sy_code BATCH_RUN_STATUS code_opt1 우선, 없으면 FB */
    const _BATCH_RUN_STATUS_FB = { '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' };
    /* fnRunBadge — 실행 결과 배지 */
    const fnRunBadge = s => coUtil.cofCodeBadge('BATCH_RUN_STATUS', s, _BATCH_RUN_STATUS_FB[s] || 'badge-gray');

    /* fnFmtDuration — 소요시간 포맷 */
    const fnFmtDuration = (sec) => {
      if (!sec && sec !== 0) { return '-'; }
      if (sec < 60) { return `${sec}초`; }
      return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
    };

    /* fnRowExpanded — 행 펼침 여부 */
    const fnRowExpanded = (log) => isExpanded(log.batchLogId);

    /* fnHistRowStyle — 행 스타일 (실패/실행중 배경 강조) */
    const fnHistRowStyle = (log) =>
      log.runStatus === '실패' ? 'background:#fff5f5;' : log.runStatus === '실행중' ? 'background:#f0f8ff;' : '';

    const cfBatchOptions = computed(() =>
      batches.map(b => ({ batchId: b.batchId, label: b.batchNm }))
    );

    // 이력 그리드
    const columns = {};
    columns.histGrid = [
      { key: 'batchLogId', label: '로그ID',  style: 'width:46px;', cellStyle: 'color:#aaa' },
      { key: 'batchNm',    label: '배치명',  style: 'min-width:120px;', cellStyle: 'font-weight:500' },
      { key: '_batchCode', label: '배치코드', style: 'min-width:150px;',
        cellInnerStyle: 'font-size:11px;background:#f5f5f5;padding:1px 5px;border-radius:3px;font-family:monospace;' },
      { key: 'runAt',      label: '실행일시', style: 'width:128px;', cellStyle: 'color:#555;font-family:monospace;font-size:11px' },
      { key: 'durationMs', label: '소요시간', style: 'width:66px;text-align:center;', align: 'center', cellStyle: 'color:#666', fmt: (v) => fnFmtDuration(v) },
      { key: 'runStatus',  label: '결과',    style: 'width:66px;text-align:center;', align: 'center', badge: (row) => fnRunBadge(row.runStatus) },
      { key: 'message',    label: '메시지',  style: 'width:auto;', cellStyle: (v, row) => 'font-size:11px;max-width:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;' + (row.runStatus === '실패' ? 'color:#dc2626' : 'color:#555') },
    ];

    /* histExpandColumns — 실행이력 행 펼침 BoFormArea 컬럼 (cols=5, labelLeft) */
    columns.histExpand = [
      { key: '_batchNm',   label: '배치명',   type: 'readonly', fmt: (v, row) => row.batchNm || '-' },
      { key: '_batchCode', label: '배치코드', type: 'readonly', mono: true, fmt: (v, row) => row.batchCode || '-' },
      { key: '_runAt',     label: '실행일시', type: 'readonly', mono: true, fmt: (v, row) => row.runAt || '-' },
      { key: '_duration',  label: '소요시간', type: 'readonly', fmt: (v, row) => fnFmtDuration(row.durationMs) },
      { key: '_runStatus', label: '실행결과', type: 'readonly', html: true, fmt: (v, row) => `<span class="badge badge-xs ${fnRunBadge(row.runStatus)}">${row.runStatus || '-'}</span>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      batches, batchLogs, uiState, codes, pager,                        // 상태 / 데이터
      handleBtnAction, handleSelectAction,                               // dispatch (모든 이벤트 / 액션 라우팅)
      cfBatchOptions,                                                    // computed
      fnRunBadge, fnFmtDuration, fnRowExpanded, fnHistRowStyle,          // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid
    :columns="columns.histGrid" :rows="batchLogs" row-key="batchLogId"
    list-title="배치 실행이력" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnHistRowStyle" :is-expanded="fnRowExpanded" row-clickable
    empty-text="실행이력이 없습니다."
    @row-click="row => handleSelectAction('batchLogs-rowToggle', row.batchLogId)">
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('batchLogs-expandAll')" style="height:30px;font-size:11px;padding:2px 8px;" title="전체 펼치기">
          ▼ 전체펼치기
        </button>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('batchLogs-collapseAll')" style="height:30px;font-size:11px;padding:2px 8px;" title="전체 접기">
          ▲ 전체접기
        </button>
        <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:160px;" v-model="uiState.searchBatchId">
          <option value="">
            배치 전체
          </option>
          <option v-for="b in cfBatchOptions" :key="b.batchId" :value="b.batchId">
            {{ b.label }}
          </option>
        </select>
        <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:90px;" v-model="uiState.searchStatus">
          <option value="">
            상태 전체
          </option>
          <option v-for="c in codes.batch_run_statuses" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('searchParam-list')" style="height:30px;font-size:12px;padding:2px 12px;">
          조회
        </button>
      </div>
    </template>
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan"
        :style="(row.runStatus==='실패' ? 'background:#fff5f5;' : 'background:#eef3fb;') + 'padding:0;border-top:2px solid ' + (row.runStatus==='실패' ? '#f3b4b4' : '#bcd0ee') + ';'">
        <div :style="'margin:10px 14px 12px;padding:12px 14px;background:#fff;border-radius:8px;border:1px solid ' + (row.runStatus==='실패' ? '#f0c4c4' : '#d4e0f2') + ';box-shadow:inset 3px 0 0 ' + (row.runStatus==='실패' ? '#ef4444' : '#3b82f6') + ';'">
        <div style="font-size:11px;font-weight:700;letter-spacing:.3px;margin-bottom:8px;" :style="row.runStatus==='실패' ? 'color:#b91c1c;' : 'color:#1d4ed8;'">
          ▼ 실행 상세
        </div>
        <bo-form-area :columns="columns.histExpand" :form="row" :cols="5" readonly label-left compact :show-actions="false" />
        <div style="font-size:11px;font-weight:600;color:#888;margin:6px 0 3px;">
          메시지
        </div>
        <div style="font-size:12px;padding:8px 12px;border-radius:5px;line-height:1.7;white-space:pre-wrap;word-break:break-all;"
          :style="row.runStatus==='실패'
            ? 'background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-family:monospace;'
            : 'background:#f1f5f9;border:1px solid #e2e8f0;color:#374151;'">
          {{ row.message }}
        </div>
        <template v-if="row.detail">
          <div style="font-size:11px;font-weight:600;color:#888;margin:6px 0 3px;">
            상세 내용
          </div>
          <pre style="margin:0;font-size:11px;padding:10px 12px;border-radius:5px;white-space:pre-wrap;word-break:break-all;line-height:1.65;font-family:monospace;"
            :style="row.runStatus==='실패'
              ? 'background:#1e1e1e;color:#f87171;border:1px solid #7f1d1d;'
              : 'background:#1e1e1e;color:#86efac;border:1px solid #14532d;'">{{ row.detail }}</pre>
        </template>
        </div>
      </td>
    </template>
      </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('batchLogs-pager-setPage', n)" :on-size-change="() => handleSelectAction('batchLogs-pager-sizeChange')" />
      <!-- ===== □. 목록 영역 =================================================== -->
    </div>
`,
};
