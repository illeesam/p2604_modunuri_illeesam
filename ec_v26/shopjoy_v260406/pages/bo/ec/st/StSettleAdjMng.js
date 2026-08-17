/* ShopJoy Admin - 정산조정 */
window.StSettleAdjMng = {
  name: 'StSettleAdjMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const uiState = reactive({ error: null, selectedId: null, isNew: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => uiState.dtlMode === 'view');
    const codes = reactive({
      settle_adj_types: [],
      settle_adj_statuses: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleAdjMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'settleAdjs-add') {
        return openNew();
      } else if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return handleCancelEdit();
      } else if (cmd === 'form-edit') {
        return switchToEdit();
      } else if (cmd === 'form-close') {
        return closeForm();
      } else if (cmd === 'settleAdjs-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleAdjMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'settleAdjs-rowApprove') {
        return doApprove(param);
      } else if (cmd === 'settleAdjs-rowReject') {
        return doReject(param);
      } else if (cmd === 'settleAdjs-rowEdit') {
        return openEdit(param);
      } else if (cmd === 'settleAdjs-rowDelete') {
        return handleDelete(param);
      } else if (cmd === 'settleAdjs-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (번호/조정ID 클릭 시 상세 열기) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ StSettleAdjMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'settleAdjs-cellClick') {
        // 보기모드 트리거 컬럼: 조정ID(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row);
        }
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드
       ⚠ 'SETTLE_ADJ_TYPE_KR' 는 DB 에 존재하지 않는 그룹이었다(오타/미정의).
          실제 그룹은 'ADJ_TYPE_CD'(PENALTY/BONUS/ERROR_FIX/OTHER, 영문 코드값). */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['ADJ_TYPE_CD', 'APRV_STATUS_CD'], {compNm: 'StSettleAdjMng'});
      try {
        codes.settle_adj_types = codeStore.sgGetGrpCodes('ADJ_TYPE_CD');
        codes.settle_adj_statuses = codeStore.sgGetGrpCodes('APRV_STATUS_CD');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    /* settleId 선택용 — 정산마스터(st_settle) 목록.
       StSettleAdjDto 에는 vendorId/vendorNm 이 없다(정산조정은 settleId 로만 연결).
       업체·기간은 정산마스터(st_settle) 쪽 정보라 선택 라벨에 함께 보여준다. */
    const settles = reactive([]);
    const cfSettleOptions = computed(() => settles.map(s => ({
      value: s.settleId,
      label: `${s.settleId} · ${s.vendorId} · ${s.settleYm} · ${fmtW(s.finalSettleAmt)}`,
    })));

    /* handleSearchData — 처리
       ⚠ StSettleAdjDto.Request 는 settleAdjId/adjTypeCd/aprvStatusCd 만 지원한다.
          정산조정건수가 많지 않아(정책서 st.06 기준 5건) 자유검색·기간검색 필드는
          백엔드에 대응 파라미터가 없어 제거했다 — 있어도 서버가 조용히 무시했다. */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...coUtil.cofOmitEmpty(searchParam),
        };
        const res = await boApiSvc.stSettleAdj.getPage(params, '정산조정관리', '목록조회');
        const data = res.data?.data;
        adjs.splice(0, adjs.length, ...(data?.pageList || data?.list || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || adjs.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    /* fnLoadSettles — 정산마스터 선택 목록 로드 */
    const fnLoadSettles = async () => {
      try {
        const res = await boApiSvc.stSettle.getPage({ pageNo: 1, pageSize: 500 }, '정산조정관리', '정산목록조회');
        const data = res.data?.data;
        settles.splice(0, settles.length, ...(data?.pageList || data?.list || []));
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await Promise.all([handleSearchData('DEFAULT'), fnLoadSettles()]);
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    const adjs = reactive([]);
    const excelModal = reactive({ show: false });   // 엑셀 다운로드 모달 표시 여부

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const form = reactive({});
    const errors = reactive({});

    const searchParam = reactive({ adjTypeCd: '', aprvStatusCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다. */
    const searchParamInit = {};

    const schema = window.yup.object({
      settleId:  window.yup.string().required('정산건을 선택하세요.'),
      adjTypeCd: window.yup.string().required('조정유형을 선택하세요.'),
      adjAmt:    window.yup.number().required('조정금액을 입력하세요.'),
      adjReason: window.yup.string().required('사유를 입력하세요.'),
    });

    /* openNew — 신규 열기 (항상 수정모드로 시작) */
    const openNew = () => {
      Object.assign(form, { settleAdjId: null, settleId: '', adjTypeCd: '', adjAmt: 0, adjReason: '', settleAdjMemo: '', aprvStatusCd: '대기' });
      uiState.selectedId = '__new__'; uiState.isNew = true; uiState.dtlMode = 'edit';
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* _loadDetailForm — 인라인 패널에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (r, mode) => {
      Object.assign(form, {...r});
      uiState.selectedId = r.settleAdjId; uiState.isNew = false; uiState.dtlMode = mode;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* loadView — 보기모드로 인라인 패널 열기 (행 클릭) */
    const loadView = (r) => _loadDetailForm(r, 'view');

    /* openEdit — 수정모드로 인라인 패널 열기 ([수정] 버튼) */
    const openEdit = (r) => _loadDetailForm(r, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (BoFormArea readonly 상태의 [수정] 버튼) */
    const switchToEdit = () => { uiState.dtlMode = 'edit'; };

    /* closeForm — 닫기 */
    const closeForm = () => { uiState.selectedId = null; uiState.isNew = false; uiState.dtlMode = 'view'; };

    /* handleCancelEdit — 수정 취소: 신규 등록 중이면 패널 닫기, 기존 행 수정 중이면 원본 재적재 후 보기모드 복귀 */
    const handleCancelEdit = () => {
      if (uiState.isNew) { return closeForm(); }
      const row = adjs.find(a => a.settleAdjId === uiState.selectedId);
      return row ? loadView(row) : closeForm();
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSave — 저장
       ⚠ create body 는 StSettleAdj 엔티티 자체(@RequestBody StSettleAdj) 다.
          settleId/adjTypeCd/adjAmt/adjReason 은 NOT NULL — 없으면 저장이 거부된다. */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) {
      console.error('[catch-info]', err); err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '정산조정을 저장하시겠습니까?');
      if (!ok) { return; }
      const body = { settleId: form.settleId, adjTypeCd: form.adjTypeCd, adjAmt: form.adjAmt, adjReason: form.adjReason, settleAdjMemo: form.settleAdjMemo, aprvStatusCd: form.aprvStatusCd || '대기' };
      try {
        await (uiState.isNew ? boApiSvc.stSettleAdj.create(body, '정산조정관리', '등록') : boApiSvc.stSettleAdj.update(form.settleAdjId, body, '정산조정관리', '저장'));
        showToast('저장되었습니다.', 'success');
        closeForm();
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* handleDelete — 삭제 (성공 후에만 목록 갱신) */
    const handleDelete = async (r) => {
      const ok = await showConfirm('삭제', `[${r.settleAdjId}] 정산조정을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.stSettleAdj.remove(r.settleAdjId, '정산조정관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (uiState.selectedId === r.settleAdjId) closeForm();
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* doApprove — 승인 */
    const doApprove = async (r) => {
      const ok = await showConfirm('승인', '정산조정을 승인하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApiSvc.stSettleAdj.approve(r.settleAdjId, { aprvStatusCd: '승인' }, '정산조정관리', '상태변경');
        showToast('승인되었습니다.', 'success');
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* doReject — 반려 */
    const doReject = async (r) => {
      const ok = await showConfirm('반려', '정산조정을 반려하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApiSvc.stSettleAdj.approve(r.settleAdjId, { aprvStatusCd: '반려' }, '정산조정관리', '상태변경');
        showToast('반려되었습니다.', 'success');
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* fnAprvBadge — 승인상태 배지. SETTLE_ADJ_STATUS 는 sy_code.code_opt1 에 배지색이
       이미 지정돼 있다(대기=badge-blue/승인=badge-green/반려=badge-red). */
    const fnAprvBadge = s => coUtil.cofCodeBadge('APRV_STATUS_CD', s, { '승인':'badge-green', '대기':'badge-blue', '반려':'badge-red' }[s] || 'badge-gray');

    /* fnTypeBadge — 조정유형 배지 (SETTLE_ADJ_TYPE 실 코드값 기준) */
    const fnTypeBadge = t => ({ PENALTY:'badge-red', BONUS:'badge-green', ERROR_FIX:'badge-orange', OTHER:'badge-gray' }[t] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = n => coUtil.cofWon(n, true);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseSearch = [
      { key: 'adjTypeCd', label: '유형', type: 'select', options: () => codes.settle_adj_types, nullLabel: '유형 전체' },
      { key: 'aprvStatusCd', label: '승인상태', type: 'select', options: () => codes.settle_adj_statuses, nullLabel: '상태 전체' },
    ];

    /* 기본 그리드
       ⚠ key 는 백엔드 StSettleAdjDto.Item 필드명과 일치해야 값이 표시된다.
          vendorNm/adjDate/regUserNm 은 Item 에 없는 필드라 제거했다(항상 빈 값이었다).
          업체·기간이 필요하면 settleId 로 정산마스터(st_settle)를 조회해야 한다.
          상세 → _doc/정책서/ec/st/st.06.정산화면-백엔드불일치.md */
    columns.baseGrid = [
      { key: 'settleAdjId',   label: '조정ID', link: true },
      { key: 'settleId',      label: '정산ID', cellStyle: 'color:#666;font-size:11px' },
      { key: 'adjTypeCd',     label: '유형', badge: (row) => fnTypeBadge(row.adjTypeCd) },
      { key: 'adjAmt',        label: '조정금액', fmt: fmtW, cellStyle: 'color:#27ae60;font-weight:700' },
      { key: 'adjReason',     label: '사유',
        cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { key: 'aprvStatusCd',  label: '승인상태', badge: (row) => fnAprvBadge(row.aprvStatusCd) },
      { key: 'regBy',         label: '등록자' },
      { key: 'regDate',       label: '등록일', fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 조정 추가/수정 ================
    columns.baseForm = [
      { key: 'settleId', label: '정산건', type: 'select', required: true, nullLabel: '선택', colSpan: 3,
        options: () => cfSettleOptions.value },
      { key: 'adjTypeCd', label: '조정유형', type: 'select', required: true, nullable: false,
        options: () => codes.settle_adj_types },
      { key: 'adjAmt',   label: '조정금액(원)', type: 'number', required: true, placeholder: '항상 양수 — 가산/차감은 유형으로 구분' },
      { key: 'aprvStatusCd', label: '승인상태', type: 'select', nullable: false,
        options: () => codes.settle_adj_statuses },
      { type: 'rowBreak' },
      { key: 'adjReason', label: '사유', type: 'text', required: true,
        placeholder: '조정 사유를 입력하세요.', colSpan: 3 },
      { key: 'settleAdjMemo', label: '메모', type: 'textarea', colSpan: 3 },
    ];

    /* buildExcelParams — 엑셀 다운로드 조건 (목록 조회와 동일한 필터 기준) */
    const buildExcelParams = () => coUtil.cofOmitEmpty(searchParam);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, cfDtlMode, baseGridPager, adjs, searchParam, form, errors, excelModal,
      handleBtnAction, handleSelectAction, handleGridCellAction, buildExcelParams,
    };
  },
  template: /* html */`
<bo-page title="정산조정"
  desc-summary="정산건에 업체별 추가·차감 조정 항목을 입력하여 최종 정산액을 보정합니다."
  :desc-detail="['• 조정 유형: 패널티 / 보너스 / 오류수정 / 기타','• 조정 항목은 담당자 승인 후 정산마감에 반영됩니다.','• 승인 상태: 대기 / 승인 / 반려','• 마감 완료된 정산건의 조정은 재오픈 후 처리해야 합니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="정산조정 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <button class="btn btn_new" @click="handleBtnAction('settleAdjs-add')">+ 조정 추가</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="adjs" row-key="settleAdjId" :selected-key="uiState.selectedId"
      :row-actions="true"
      :row-class="(r) => uiState.selectedId===r.settleAdjId ? 'selected' : ''"
      grid-id="settleAdjs-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        액션
      </template>
      <template #row-actions="{ row: r }">
        <div class="actions">
          <button v-if="r.aprvStatusCd==='PENDING'" class="btn btn-xs btn-green" @click="handleSelectAction('settleAdjs-rowApprove', r)">승인</button>
          <button v-if="r.aprvStatusCd==='PENDING'" class="btn btn-xs btn-danger" @click="handleSelectAction('settleAdjs-rowReject', r)">반려</button>
          <button class="btn btn_row_edit" @click="handleSelectAction('settleAdjs-rowEdit', r)">수정</button>
          <button class="btn btn_row_delete"  @click="handleSelectAction('settleAdjs-rowDelete', r)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('settleAdjs-pager-setPage', n)" :on-size-change="() => handleSelectAction('settleAdjs-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 상세 패널 (항상 표시 — 미선택 시 안내, 선택/신규 시 폼) ============== -->
  <bo-container card-style="margin-top:12px"
    :title="!uiState.selectedId ? '정산조정 상세' : (uiState.isNew ? '정산조정 신규' : (cfDtlMode ? '정산조정 상세' : '정산조정 수정'))">
    <!-- ===== ■.■. 미선택 안내 (영역은 항상 표시) ================================= -->
    <div v-if="!uiState.selectedId" style="text-align:center;color:#bbb;font-size:13px;padding:32px 16px;">
      목록에서 조정 행을 선택하거나 [+ 조정 추가]를 누르면 입력할 수 있습니다.
    </div>
    <!-- ===== ■.■. 상세 입력폼 (행 선택 / 신규 시) — readonly 시 BoFormArea 가 [수정][닫기] 자동 노출 ===== -->
    <bo-form-area v-else :columns="columns.baseForm" :form="form" :errors="errors"
      :cols="3" :readonly="cfDtlMode" plain-readonly
      @save="handleBtnAction('form-save')" @cancel="handleBtnAction('form-cancel')"
      @edit="handleBtnAction('form-edit')" @close="handleBtnAction('form-close')" />
  </bo-container>
  <bo-excel-down-modal :show="excelModal.show" domain="stSettleAdj" area-nm="정산조정관리"
    ui-nm="정산조정" :columns="columns.baseGrid" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
