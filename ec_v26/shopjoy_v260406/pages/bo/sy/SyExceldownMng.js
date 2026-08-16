/* ShopJoy Admin - 엑셀다운로드 (요청 목록 / 진행상태 / 다운로드 횟수)
 *   · 조회조건의 요청자는 "내 정보"가 기본값 — 보통 자기가 건 요청을 확인하러 들어온다.
 *   · 진행중(RUNNING)/대기(WAITING) 건은 [강제취소] 가능.
 *   · 완료 건은 생성 파일을 개별 다운로드(분할 저장 시 N개).
 *   · 알림에서 넘어올 때 refId(exceldownId)로 해당 행을 바로 펼친다.
 */
window.SyExceldownMng = {
  name: 'SyExceldownMng',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
    dtlId:        { type: String,   default: null },                        // 알림에서 전달된 대상 ID
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    /* 현재 로그인 사용자 — boApp 에는 authUser 가 없다. Pinia 스토어에서 읽는 게 이 프로젝트 표준
       (CmDashboardMyMng / StSettleCloseMng 과 동일 방식). 조회조건 "요청자" 기본값으로 쓴다. */
    const fnAuthId = () => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.authId || '') : '';
    };

    const codes = reactive({});

    const uiState = reactive({
      loading: false,
      selectedId: null,     // 상세 펼침 대상
      detail: null,         // 상세(파일 목록 포함)
      autoTimer: null,      // 진행중이 있으면 주기 갱신
    });

    /* 조회조건 — 요청자는 내 정보가 기본 */
    const searchParam = reactive({
      regBy: '',                 // initPage 에서 내 정보로 채움 (스토어 준비 시점 이후)
      exceldownStatusCd: '',
      runTypeCd: '',
      searchValue: '',
      dateRangeType: 'reg_date',
      dateRangeStart: '',
      dateRangeEnd: '',
      dateRange: '1week',
    });
    boUtil.bofApplyDateRange(searchParam, '1week');

    const rows = reactive([]);
    const baseGridPager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 50, 100], pageCond: {},
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 라우팅 */
    const handleBtnAction = (cmd, param) => {
      console.log(' ■■ SyExceldownMng : handleBtnAction -> ', cmd, param);
      if (cmd === 'search-list')      { baseGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'search-reset')     { return onReset(); }
      if (cmd === 'search-mine')      { searchParam.regBy = fnAuthId(); return handleSearchList(); }
      if (cmd === 'grid-pager-page')  { baseGridPager.pageNo = param; return handleSearchList(); }
      if (cmd === 'row-cancel')       { return handleCancel(param); }
      if (cmd === 'row-detail')       { return handleToggleDetail(param); }
      if (cmd === 'file-download')    { return handleDownloadFile(param); }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — select/페이지크기 라우팅 */
    const handleSelectAction = (cmd, param) => {
      console.log(' ■■ SyExceldownMng : handleSelectAction -> ', cmd, param);
      if (cmd === 'grid-pager-size')  { baseGridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'search-dateRange') { boUtil.bofApplyDateRange(searchParam, searchParam.dateRange); return; }
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* handleGridCellAction — 셀 클릭 → 상세 토글 */
    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'exceldown-cellClick') { return handleToggleDetail(row.exceldownId); }
    };

    /* ##### [03] 그리드 컬럼 ##################################################### */

    const columns = reactive({
      baseGrid: [
        { key: 'domainNm',   label: '대상',     width: '150px',
          fmt: (v, row) => v || row.domainCd },
        { key: 'uiNm',       label: '요청화면', width: '110px', fmt: (v) => v || '-' },
        { key: 'runTypeCd',  label: '방식',     width: '64px', align: 'center',
          badge: (row) => row.runTypeCd === 'ASYNC' ? 'badge-purple' : 'badge-blue',
          fmt: (v) => v === 'ASYNC' ? '예약' : '즉시' },
        { key: 'exceldownStatusCd', label: '상태', width: '82px', align: 'center',
          badge: (row) => fnStatusBadge(row.exceldownStatusCd),
          fmt: (v) => fnStatusLabel(v) },
        { key: 'totalCount', label: '건수',     width: '90px', align: 'right',
          fmt: (v) => coUtil.cofWon ? Number(v || 0).toLocaleString() : v },
        { key: '_progress',  label: '진행',     width: '90px', align: 'center',
          fmt: (v, row) => fnProgress(row) },
        { key: 'fileCount',  label: '파일',     width: '60px', align: 'center',
          fmt: (v) => (v == null || v === 0) ? '-' : (v + '개') },
        { key: 'downloadCount', label: '다운로드', width: '70px', align: 'center',
          fmt: (v) => (v == null ? 0 : v) + '회' },
        { key: 'regUserNm',  label: '요청자',   width: '90px',
          fmt: (v, row) => v || row.regBy || '-' },
        { key: 'regDate',    label: '요청일시', width: '140px', align: 'center',
          fmt: (v) => fnDateTime(v) },
        { key: 'elapsedMs',  label: '소요',     width: '70px', align: 'right',
          fmt: (v) => v == null ? '-' : (v < 1000 ? v + 'ms' : (v / 1000).toFixed(1) + 's') },
      ],
    });

    /* ##### [04] 내장 사용 함수 ################################################## */

    /* fnStatusLabel — 상태 한글명 */
    const fnStatusLabel = (v) => ({
      WAITING: '대기', RUNNING: '진행중', DONE: '완료',
      FAIL: '실패', TIMEOUT: '시간초과', CANCELED: '취소',
    }[v] || v || '-');

    /* fnStatusBadge — 상태 배지 색 */
    const fnStatusBadge = (v) => ({
      WAITING: 'badge-orange', RUNNING: 'badge-blue', DONE: 'badge-green',
      FAIL: 'badge-red', TIMEOUT: 'badge-red', CANCELED: 'badge-gray',
    }[v] || 'badge-gray');

    /* fnProgress — 진행률 표시 (진행중일 때만 의미) */
    const fnProgress = (row) => {
      const t = Number(row.totalCount || 0);
      const d = Number(row.doneCount || 0);
      if (row.exceldownStatusCd !== 'RUNNING') { return t > 0 && d > 0 ? '100%' : '-'; }
      if (t <= 0) { return '-'; }
      return Math.min(100, Math.floor(d * 100 / t)) + '%';
    };

    /* fnDateTime — 표시용 일시 */
    const fnDateTime = (v) => (v ? String(v).replace('T', ' ').substring(0, 19) : '-');

    /* fnFileSize — byte → 읽기 쉬운 단위 */
    const fnFileSize = (n) => {
      if (!n) { return '-'; }
      if (n < 1024) { return n + ' B'; }
      if (n < 1024 * 1024) { return (n / 1024).toFixed(1) + ' KB'; }
      return (n / 1024 / 1024).toFixed(1) + ' MB';
    };

    /* fnCanCancel — 취소 가능 여부 */
    const fnCanCancel = (row) => ['RUNNING', 'WAITING'].includes(row.exceldownStatusCd);

    /* onReset — 검색조건 초기화 (요청자는 내 정보로 되돌림) */
    const onReset = () => {
      Object.assign(searchParam, {
        regBy: fnAuthId(), exceldownStatusCd: '', runTypeCd: '',
        searchValue: '', dateRange: '1week',
      });
      boUtil.bofApplyDateRange(searchParam, '1week');
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...coUtil.cofOmitEmpty(searchParam),
        };
        delete params.dateRange;
        const res = await boApiSvc.syExceldown.getPage(params, '엑셀다운로드', '목록조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        baseGridPager.pageTotalCount = d.pageTotalCount || 0;
        baseGridPager.pageTotalPage  = d.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleToggleDetail — 행 상세(파일 목록) 펼침/접기 */
    const handleToggleDetail = async (id) => {
      if (uiState.selectedId === id) { uiState.selectedId = null; uiState.detail = null; return; }
      uiState.selectedId = id;
      uiState.detail = null;
      try {
        const res = await boApiSvc.syExceldown.getById(id, '엑셀다운로드', '상세조회');
        uiState.detail = res.data?.data || null;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '상세 조회 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleCancel — 강제취소 */
    const handleCancel = async (row) => {
      const ok = await showConfirm('강제취소',
        `[${row.domainNm || row.domainCd}] 요청을 취소하시겠습니까?\n생성 중인 파일은 삭제됩니다.`);
      if (!ok) { return; }
      try {
        await boApiSvc.syExceldown.cancel(row.exceldownId, '엑셀다운로드', '강제취소');
        showToast('취소되었습니다.', 'success');
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '취소 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleDownloadFile — 파일 다운로드 + 횟수 카운트 */
    const handleDownloadFile = async (file) => {
      try {
        const url = file.attachUrl || file.cdnImgUrl;
        if (!url) { showToast('파일 경로가 없습니다.', 'error'); return; }
        const host = (window.boEnvConsts && window.boEnvConsts.apiHost) || '';
        const a = document.createElement('a');
        a.href = url.startsWith('http') ? url : (host.replace(/\/api\/?$/, '') + url);
        a.download = file.fileNm || '';
        a.target = '_blank';
        a.click();
        if (uiState.selectedId) {
          await boApiSvc.syExceldown.markDownloaded(uiState.selectedId, '엑셀다운로드', '다운로드');
          handleSearchList();
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '다운로드 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnLoadCodes — 화면에서 쓰는 코드 그룹 지연 로딩 */
    const fnLoadCodes = async () => {
      /* 상태/방식은 고정 목록이라 코드그룹 없이 정적 옵션 사용 — 로딩 대상 없음 */
    };

    /* ##### [05] computed ####################################################### */

    /* 진행중/대기 건이 있으면 화면을 주기 갱신해 진행률이 움직이게 한다 */
    const cfHasActive = computed(() => rows.some(r => ['RUNNING', 'WAITING'].includes(r.exceldownStatusCd)));
    const cfIsMine    = computed(() => !!searchParam.regBy && searchParam.regBy === fnAuthId());

    const statusOptions = [
      { value: '',         label: '상태 전체' },
      { value: 'WAITING',  label: '대기' },
      { value: 'RUNNING',  label: '진행중' },
      { value: 'DONE',     label: '완료' },
      { value: 'FAIL',     label: '실패' },
      { value: 'TIMEOUT',  label: '시간초과' },
      { value: 'CANCELED', label: '취소' },
    ];
    const runTypeOptions = [
      { value: '',      label: '방식 전체' },
      { value: 'SYNC',  label: '즉시' },
      { value: 'ASYNC', label: '예약' },
    ];

    /* ##### [06] 라이프사이클 ##################################################### */

    const initPage = async () => {
      await fnLoadCodes();
      /* 조회조건 요청자 기본값 = 내 정보.
         단 알림에서 특정 건으로 진입한 경우엔 그 건이 반드시 보이도록 필터를 비운다. */
      searchParam.regBy = props.dtlId ? '' : fnAuthId();
      await handleSearchList();
      if (props.dtlId) { await handleToggleDetail(props.dtlId); }

      /* 진행중이 있으면 5초마다 갱신 */
      uiState.autoTimer = setInterval(() => {
        if (cfHasActive.value && !uiState.loading) { handleSearchList(); }
      }, 5000);
    };
    onMounted(initPage);

    onUnmounted(() => {
      if (uiState.autoTimer) { clearInterval(uiState.autoTimer); uiState.autoTimer = null; }
    });

    /* ##### [07] return (템플릿 노출) ############################################## */

    return {
      codes, uiState, searchParam, rows, baseGridPager, columns,   // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,   // dispatch
      fnStatusLabel, fnStatusBadge, fnProgress, fnDateTime, fnFileSize, fnCanCancel,  // 헬퍼
      cfHasActive, cfIsMine, statusOptions, runTypeOptions,        // computed / 옵션
      cofCountText: coUtil.cofCountText,
    };
  },
  template: /* html */`
<bo-page title="엑셀다운로드"
  desc-summary="엑셀다운로드 는 즉시·예약 다운로드 요청의 진행상태와 생성 파일을 관리합니다."
  :desc-detail="['✔ 예약 요청은 대기열에 쌓였다가 순서대로 생성됩니다.','✔ 진행중/대기 건은 강제취소할 수 있습니다.','✔ 완료 파일은 보관기간이 지나면 자동 삭제됩니다(이력은 유지).'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 ======================================================== -->
  <bo-container>
    <div class="search-bar">
      <span class="search-label">요청자</span>
      <input class="form-control" v-model="searchParam.regBy" placeholder="사용자ID" style="width:150px;" @keyup.enter="handleBtnAction('search-list')" />
      <button class="btn btn-secondary btn-sm" :disabled="cfIsMine" @click="handleBtnAction('search-mine')">내 요청</button>
      <span class="search-label">상태</span>
      <select class="form-control" v-model="searchParam.exceldownStatusCd" style="width:120px;">
        <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <span class="search-label">방식</span>
      <select class="form-control" v-model="searchParam.runTypeCd" style="width:110px;">
        <option v-for="o in runTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <span class="search-label">요청일</span>
      <input type="date" class="form-control" v-model="searchParam.dateRangeStart" style="width:150px;" />
      <span>~</span>
      <input type="date" class="form-control" v-model="searchParam.dateRangeEnd" style="width:150px;" />
      <span class="search-label">검색어</span>
      <input class="form-control" v-model="searchParam.searchValue" placeholder="대상/화면/파일명" style="width:180px;" @keyup.enter="handleBtnAction('search-list')" />
      <div class="search-actions">
        <button class="btn btn_reset" @click="handleBtnAction('search-reset')">초기화</button>
        <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('search-list')">조회</button>
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. 목록 ======================================================== -->
  <bo-container title="다운로드 요청 목록" :count-text="cofCountText(baseGridPager.pageTotalCount, rows.length)">
    <template #toolbar-actions>
      <span v-if="cfHasActive" style="font-size:11px;color:#1677ff;">진행중 — 5초마다 자동 갱신</span>
      <span style="font-size:11px;color:#aaa;">행 클릭 시 생성 파일 표시</span>
    </template>
    <bo-grid bare :columns="columns.baseGrid" :rows="rows" row-key="exceldownId"
      :selected-key="uiState.selectedId" :row-actions="true"
      :row-style="(r) => uiState.selectedId===r.exceldownId ? 'background:#fff8f9;' : ''"
      grid-id="exceldown-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row)"
      table-max-height="480px">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row }">
        <div class="actions">
          <button v-if="fnCanCancel(row)" class="btn btn_row_delete" @click.stop="handleBtnAction('row-cancel', row)">
            강제취소
          </button>
          <button class="btn btn_row_hist" @click.stop="handleBtnAction('row-detail', row.exceldownId)">
            파일
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager"
      :on-set-page="n => handleBtnAction('grid-pager-page', n)"
      :on-size-change="() => handleSelectAction('grid-pager-size')" />
  </bo-container>
  <!-- ===== □. 목록 ======================================================== -->
  <!-- ===== ■. 상세 (생성 파일 목록) ========================================== -->
  <bo-container v-if="uiState.selectedId" title="생성 파일">
    <div v-if="!uiState.detail" style="padding:16px;text-align:center;color:#999;font-size:12px;">
      불러오는 중...
    </div>
    <div v-else style="padding:4px 2px;">
      <!-- 요약 -->
      <table style="width:100%;font-size:12px;color:#555;margin-bottom:12px;">
        <tr>
          <td style="width:80px;color:#999;padding:3px 0;">대상</td>
          <td>{{ uiState.detail.domainNm || uiState.detail.domainCd }}</td>
          <td style="width:80px;color:#999;padding:3px 0;">상태</td>
          <td><span class="badge" :class="fnStatusBadge(uiState.detail.exceldownStatusCd)">{{ fnStatusLabel(uiState.detail.exceldownStatusCd) }}</span></td>
        </tr>
        <tr>
          <td style="color:#999;padding:3px 0;">API</td>
          <td style="font-family:monospace;font-size:11px;">{{ uiState.detail.apiUrl || '-' }}</td>
          <td style="color:#999;padding:3px 0;">실행서버</td>
          <td style="font-family:monospace;font-size:11px;">{{ uiState.detail.podId || '-' }}</td>
        </tr>
        <tr>
          <td style="color:#999;padding:3px 0;">건수</td>
          <td>{{ (uiState.detail.totalCount || 0).toLocaleString() }}건</td>
          <td style="color:#999;padding:3px 0;">보관만료</td>
          <td>{{ fnDateTime(uiState.detail.expireDate) }}</td>
        </tr>
        <tr v-if="uiState.detail.errorMsg">
          <td style="color:#999;padding:3px 0;">사유</td>
          <td colspan="3" style="color:#d9363e;">{{ uiState.detail.errorMsg }}</td>
        </tr>
      </table>
      <!-- 파일 목록 -->
      <div v-if="!uiState.detail.attachFiles || uiState.detail.attachFiles.length === 0"
        style="padding:14px;text-align:center;color:#bbb;font-size:12px;border:1px dashed #e0e0e0;border-radius:8px;">
        생성된 파일이 없습니다. (미완료이거나 보관기간이 지났습니다)
      </div>
      <div v-else>
        <div v-for="(f, i) in uiState.detail.attachFiles" :key="f.attachId"
          style="display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #eee;border-radius:8px;margin-bottom:6px;background:#fafafa;">
          <span style="font-size:11px;color:#999;width:44px;">{{ (i+1) }}/{{ uiState.detail.attachFiles.length }}</span>
          <span style="flex:1;font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.fileNm }}</span>
          <span style="font-size:11px;color:#888;width:76px;text-align:right;">{{ fnFileSize(f.fileSize) }}</span>
          <button class="btn btn_row_edit" @click="handleBtnAction('file-download', f)">다운로드</button>
        </div>
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 상세 ======================================================== -->
</bo-page>
`
};
