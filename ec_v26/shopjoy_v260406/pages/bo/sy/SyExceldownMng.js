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
    const fnAuthNm = () => {
      const s = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
      return s && s.svAuthUser ? (s.svAuthUser.userNm || '') : '';
    };

    const codes = reactive({});

    const uiState = reactive({
      loading: false,
      selectedId: null,     // 상세 펼침 대상 (sy-exceldown-dtl 에 dtlId 로 전달)
      autoTimer: null,      // 진행중이 있으면 주기 갱신
    });

    /* 조회조건 — 요청자는 내 정보가 기본. regBy=사용자ID/회원ID(둘 중 하나), regByNm=표시용 이름 */
    const searchParam = reactive({
      regBy: '',                 // initPage 에서 내 정보로 채움 (스토어 준비 시점 이후)
      regByNm: '',
      exceldownStatusCd: '',
      runTypeCd: '',
      searchValue: '',
      dateRangeType: 'reg_date',
      dateRangeStart: '',
      dateRangeEnd: '',
      dateRange: '1week',
    });
    boUtil.bofApplyDateRange(searchParam, '1week');

    /* 요청자 선택 팝업 — 사용자(staff) / 회원(member) 둘 다 요청자가 될 수 있음 */
    const picks = reactive({ user: false, member: false });

    /* 목록 자체 엑셀다운로드 */
    const excelModal = reactive({ show: false });

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
      if (cmd === 'search-mine')      { searchParam.regBy = fnAuthId(); searchParam.regByNm = fnAuthNm(); return handleSearchList(); }
      if (cmd === 'grid-pager-page')  { baseGridPager.pageNo = param; return handleSearchList(); }
      if (cmd === 'row-cancel')       { return handleCancel(param); }
      if (cmd === 'row-detail')       { return handleToggleDetail(param); }
      if (cmd === 'row-download')     { return handleQuickDownload(param); }
      if (cmd === 'pick-user-open')   { picks.user = true; return; }
      if (cmd === 'pick-member-open') { picks.member = true; return; }
      if (cmd === 'pick-clear')       { searchParam.regBy = ''; searchParam.regByNm = ''; return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* fnCallbackModal — 요청자 선택 팝업 통합 콜백 (사용자/회원 공용) */
    const fnCallbackModal = (popCmd, param, result) => {
      if (result == null) { picks.user = picks.member = false; return; }
      if (popCmd === 'cmPopup-user-pick') {
        searchParam.regBy   = result?.selId || '';
        searchParam.regByNm = result?.selName || result?.userNm || result?.loginId || '';
        picks.user = false;
      } else if (popCmd === 'cmPopup-member-pick') {
        searchParam.regBy   = result?.selId || '';
        searchParam.regByNm = result?.selName || result?.memberNm || result?.loginId || '';
        picks.member = false;
      }
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
        { key: 'totalCount', label: '건수(예상)', width: '90px', align: 'right',
          cellTitle: (v, row) => `예상 ${Number(v || 0).toLocaleString()}건 / 실제 ${Number(row.doneCount || 0).toLocaleString()}건`,
          fmt: (v) => Number(v || 0).toLocaleString() },
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

    /* fnCanCancel — 취소 가능 여부 */
    const fnCanCancel = (row) => ['RUNNING', 'WAITING'].includes(row.exceldownStatusCd);

    /* fnCanDownload — 완료 + 생성된 파일이 있어야 받을 게 있다.
       즉시/예약 모두 완료 시 sy_attach 에 파일을 남기므로 fileCount 로만 판단하면 된다.
       (구 버전엔 즉시는 파일을 저장하지 않았으나, 재다운로드 요구로 즉시도 저장하도록 변경됨) */
    const fnCanDownload = (row) => row.exceldownStatusCd === 'DONE' && (row.fileCount || 0) > 0;

    /* onReset — 검색조건 초기화 (요청자는 내 정보로 되돌림) */
    const onReset = () => {
      Object.assign(searchParam, {
        regBy: fnAuthId(), regByNm: fnAuthNm(), exceldownStatusCd: '', runTypeCd: '',
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
        delete params.regByNm;
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

    /* buildExcelParams — 목록 자체 엑셀다운로드용 (조회조건과 동일, 페이징 제외) */
    const buildExcelParams = () => {
      const params = { ...coUtil.cofOmitEmpty(searchParam) };
      delete params.dateRange;
      delete params.regByNm;
      return params;
    };

    /* handleToggleDetail — 행 상세(파일 목록) 펼침/접기.
       상세 데이터 자체는 <sy-exceldown-dtl :key="uiState.selectedId"> 가 dtlId 로 자체 조회한다. */
    const handleToggleDetail = (id) => {
      uiState.selectedId = uiState.selectedId === id ? null : id;
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

    /* fnTriggerDownload — 브라우저 다운로드만 실행 (API 호출 없음).
       단일/전체 다운로드가 카운트 처리 방식이 서로 달라(단일=매번 +1, 전체=한 번에 +1)
       실제 파일 내려받기 동작만 여기로 분리했다.
       ⚠ window.boEnvConsts.apiHost 는 존재하지 않는 필드라 항상 '' 로 떨어져, 상대경로가
       프론트(Live Server, 5501) origin 으로 풀리는 버그가 있었다 — 백엔드(3000)엔 그 경로가
       없어 404 HTML 을 .xlsx 로 저장해버림("파일 형식이 잘못되어..." 오류의 실제 원인, 2026-08-16
       확인). window.cdnUrl() 로 항상 백엔드 절대경로를 만든다. */
    const fnTriggerDownload = (file) => {
      const url = file.attachUrl || file.cdnImgUrl;
      if (!url) { showToast(`${file.fileNm || '파일'} 경로가 없습니다.`, 'error'); return false; }
      const a = document.createElement('a');
      a.href = window.cdnUrl ? window.cdnUrl(url) : url;
      a.download = file.fileNm || '';
      a.target = '_blank';
      a.click();
      return true;
    };

    /* handleDownloadFile — 파일 1개 다운로드 + 횟수 카운트.
       exceldownId 를 명시로 받는다 — uiState.selectedId(펼쳐진 행)에 암묵 의존하면,
       행이 안 펼쳐진 상태에서 바로 받는 handleQuickDownload 경로에서 카운트가 엉뚱한 행에 붙거나
       아예 안 붙는다. */
    const handleDownloadFile = async (file, exceldownId) => {
      try {
        if (!fnTriggerDownload(file)) { return; }
        const id = exceldownId || uiState.selectedId;
        if (id) {
          await boApiSvc.syExceldown.markDownloaded(id, '엑셀다운로드', '다운로드');
          handleSearchList();
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '다운로드 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleQuickDownload — 목록 행의 [다운로드] 버튼. 상세를 펼치지 않고 바로 받는다.
       파일이 1개면 즉시 다운로드하고, 여러 개(분할 저장)면 어떤 파일인지 골라야 하므로
       상세 패널만 펼친다 (파일 목록·전체 다운로드는 sy-exceldown-dtl 이 자체 조회해 표시). */
    const handleQuickDownload = async (row) => {
      try {
        const res = await boApiSvc.syExceldown.getById(row.exceldownId, '엑셀다운로드', '다운로드');
        const files = (res.data?.data || {}).attachFiles || [];
        if (files.length === 0) {
          showToast('생성된 파일이 없습니다. (보관기간이 지났을 수 있습니다)', 'error');
          return;
        }
        if (files.length === 1) {
          await handleDownloadFile(files[0], row.exceldownId);
          return;
        }
        uiState.selectedId = row.exceldownId;
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

    /* 목록 자체 엑셀다운로드 — 화면에 뜨는 컬럼과 동일하게(_progress 는 클라이언트 계산이라 자동 제외) */
    const cfExcelDomain  = computed(() => 'syExceldown');
    const cfExcelAreaNm  = computed(() => '엑셀다운로드');
    const cfExcelColumns = computed(() => columns.baseGrid.filter(c => !String(c.key).startsWith('_')));

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
      searchParam.regBy   = props.dtlId ? '' : fnAuthId();
      searchParam.regByNm = props.dtlId ? '' : fnAuthNm();
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
      codes, uiState, searchParam, rows, baseGridPager, columns, picks, excelModal,  // 상태 / 데이터
      showToast, showConfirm,                                     // sy-exceldown-dtl 인라인 임베드 전달용
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,  // dispatch
      fnStatusLabel, fnStatusBadge, fnProgress, fnDateTime, fnCanCancel, fnCanDownload,  // 헬퍼
      cfHasActive, cfIsMine, statusOptions, runTypeOptions,        // computed / 옵션
      cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,  // 엑셀 다운로드
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
      <span style="display:inline-flex;align-items:center;gap:4px;">
        <input class="form-control" readonly
          :value="searchParam.regBy ? (searchParam.regByNm ? searchParam.regByNm + ' (' + searchParam.regBy + ')' : searchParam.regBy) : ''"
          placeholder="사용자/회원 선택" style="width:170px;background:#f7f7f7;" />
        <button type="button" class="btn btn-secondary btn-sm" @click="handleBtnAction('pick-user-open')">사용자선택</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="handleBtnAction('pick-member-open')">회원선택</button>
        <button v-if="searchParam.regBy" type="button" title="선택 해제"
          style="background:none;border:none;padding:0 2px;color:#bbb;cursor:pointer;font-size:12px;"
          @click="handleBtnAction('pick-clear')">x</button>
      </span>
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
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
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
          <button v-if="fnCanDownload(row)" class="btn btn_row_download" @click.stop="handleBtnAction('row-download', row)">
            다운로드
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
  <bo-excel-down-modal :show="excelModal.show" domain="syExceldown"
    area-nm="엑셀다운로드" :columns="cfExcelColumns" ui-nm="엑셀다운로드" :params="buildExcelParams()"
    @close="excelModal.show = false" />
  <!-- ===== ■. 상세 (생성 파일 목록) ========================================== -->
  <bo-container v-if="uiState.selectedId" title="생성 파일">
    <sy-exceldown-dtl :key="uiState.selectedId" :navigate="navigate" :show-ref-modal="showRefModal"
      :show-toast="showToast" :show-confirm="showConfirm" :dtl-id="uiState.selectedId"
      @downloaded="handleSearchList" />
  </bo-container>
  <!-- ===== □. 상세 ======================================================== -->
  <!-- ===== ■. 요청자 선택 팝업 ================================================ -->
  <bo-cm-popup-modal popup-cmd="cmPopup-user-pick"   popup-code="user"   :show="picks.user"   :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-member-pick" popup-code="member" :show="picks.member" :on-callback="fnCallbackModal" />
  <!-- ===== □. 요청자 선택 팝업 ================================================ -->
</bo-page>
`
};
