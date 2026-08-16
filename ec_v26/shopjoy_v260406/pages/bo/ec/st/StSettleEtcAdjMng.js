/* ShopJoy Admin - 정산기타조정 */
window.StSettleEtcAdjMng = {
  name: 'StSettleEtcAdjMng',
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
      settle_etc_adj_types: [],
      adj_dirs: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleEtcAdjMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'etcAdjs-add') {
        return openNew();
      } else if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return handleCancelEdit();
      } else if (cmd === 'form-edit') {
        return switchToEdit();
      } else if (cmd === 'form-close') {
        return closeForm();
      } else if (cmd === 'etcAdjs-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleEtcAdjMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'etcAdjs-rowEdit') {
        return openEdit(param);
      } else if (cmd === 'etcAdjs-rowDelete') {
        return handleDelete(param);
      } else if (cmd === 'etcAdjs-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (번호/조정ID 클릭 시 상세 열기) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ StSettleEtcAdjMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'etcAdjs-cellClick') {
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

    /* fnLoadCodes — 공통코드 로드.
       ⚠ st_settle_etc_adj 테이블에는 승인상태 컬럼이 없다(SETTLE_ADJ_STATUS 는
          st_settle_adj 전용). 대신 가산/차감 방향(ADJ_DIR)이 NOT NULL 필수값인데
          이전 화면은 이 필드 자체를 다루지 않아 저장이 항상 실패했다. */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['ETC_ADJ_TYPE_CD', 'ETC_ADJ_DIR_CD'], {compNm: 'StSettleEtcAdjMng'});
      try {
        codes.settle_etc_adj_types = codeStore.sgGetGrpCodes('ETC_ADJ_TYPE_CD');
        codes.adj_dirs = codeStore.sgGetGrpCodes('ETC_ADJ_DIR_CD');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    /* settleId 선택용 — 정산마스터(st_settle) 목록 (StSettleAdjMng 과 동일 패턴) */
    const settles = reactive([]);
    const cfSettleOptions = computed(() => settles.map(s => ({
      value: s.settleId,
      label: `${s.settleId} · ${s.vendorId} · ${s.settleYm} · ${fmtW(s.finalSettleAmt)}`,
    })));

    /* handleSearchData — 처리
       ⚠ StSettleEtcAdjDto.Request 는 settleEtcAdjId/etcAdjTypeCd 만 지원한다. */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...coUtil.cofOmitEmpty(searchParam),
        };
        const res = await boApiSvc.stSettleEtcAdj.getPage(params, '정산기타조정', '목록조회');
        const data = res.data?.data;
        etcAdjs.splice(0, etcAdjs.length, ...(data?.pageList || data?.list || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || etcAdjs.length;
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
        const res = await boApiSvc.stSettle.getPage({ pageNo: 1, pageSize: 500 }, '정산기타조정', '정산목록조회');
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

    const etcAdjs = reactive([]);

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const form = reactive({});
    const errors = reactive({});

    const searchParam = reactive({ etcAdjTypeCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다. */
    const searchParamInit = {};

    const schema = window.yup.object({
      settleId:     window.yup.string().required('정산건을 선택하세요.'),
      etcAdjTypeCd: window.yup.string().required('조정유형을 선택하세요.'),
      etcAdjDirCd:  window.yup.string().required('가산/차감을 선택하세요.'),
      etcAdjAmt:    window.yup.number().required('조정금액을 입력하세요.'),
      etcAdjReason: window.yup.string().required('사유를 입력하세요.'),
    });

    /* openNew — 신규 열기 (항상 수정모드로 시작) */
    const openNew = () => {
      Object.assign(form, { settleEtcAdjId: null, settleId: '', etcAdjTypeCd: '', etcAdjDirCd: '', etcAdjAmt: 0, etcAdjReason: '', settleEtcAdjMemo: '' });
      uiState.selectedId = '__new__'; uiState.isNew = true; uiState.dtlMode = 'edit';
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* _loadDetailForm — 인라인 패널에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (r, mode) => {
      Object.assign(form, {...r});
      uiState.selectedId = r.settleEtcAdjId; uiState.isNew = false; uiState.dtlMode = mode;
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
      const row = etcAdjs.find(a => a.settleEtcAdjId === uiState.selectedId);
      return row ? loadView(row) : closeForm();
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSave — 저장
       ⚠ create body 는 StSettleEtcAdj 엔티티 자체다.
          settleId/etcAdjTypeCd/etcAdjDirCd/etcAdjAmt/etcAdjReason 은 NOT NULL —
          하나라도 없으면 저장이 거부된다(이전 화면은 etcAdjDirCd 자체를 다루지 않아 항상 실패했다). */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) {
      console.error('[catch-info]', err); err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '기타조정을 저장하시겠습니까?');
      if (!ok) { return; }
      const body = { settleId: form.settleId, etcAdjTypeCd: form.etcAdjTypeCd, etcAdjDirCd: form.etcAdjDirCd, etcAdjAmt: form.etcAdjAmt, etcAdjReason: form.etcAdjReason, settleEtcAdjMemo: form.settleEtcAdjMemo };
      try {
        await (uiState.isNew ? boApiSvc.stSettleEtcAdj.create(body, '정산기타조정', '등록') : boApiSvc.stSettleEtcAdj.update(form.settleEtcAdjId, body, '정산기타조정', '저장'));
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
      const ok = await showConfirm('삭제', `[${r.settleEtcAdjId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.stSettleEtcAdj.remove(r.settleEtcAdjId, '정산기타조정', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (uiState.selectedId === r.settleEtcAdjId) closeForm();
        await handleSearchData();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        showToast(errMsg, 'error', 0);
      }
    };

    /* fnTypeBadge — 조정유형 배지 (SETTLE_ETC_ADJ_TYPE 실 코드값 기준 — 한글/영문 혼재) */
    const fnTypeBadge = t => ({ '위약금':'badge-red', '인센티브':'badge-green', '세금조정':'badge-orange', '기타':'badge-gray',
      PENALTY:'badge-red', RETURN_SHIP:'badge-orange', SHIP:'badge-blue' }[t] || 'badge-gray');

    /* fnDirBadge — 가산/차감 배지 (ADJ_DIR: ADD=가산 / SUB,DEDUCT=차감) */
    const fnDirBadge = d => (d === 'ADD' ? 'badge-green' : 'badge-red');

    /* fmtW — 포맷 W */
    const fmtW = n => coUtil.cofWon(n, true);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseSearch = [
      { key: 'etcAdjTypeCd', label: '유형', type: 'select', options: () => codes.settle_etc_adj_types, nullLabel: '유형 전체' },
    ];

    /* 기본 그리드
       ⚠ key 는 백엔드 StSettleEtcAdjDto.Item 필드명과 일치해야 값이 표시된다.
          vendorNm/adjDate/regUserNm/aprvStatusCd 는 Item 에 없는 필드라 제거했다
          (aprvStatusCd 는 st_settle_adj 전용 — 이 테이블엔 승인 개념이 없다).
          상세 → _doc/정책서/ec/st/st.06.정산화면-백엔드불일치.md */
    columns.baseGrid = [
      { key: 'settleEtcAdjId', label: '조정ID', link: true },
      { key: 'settleId',       label: '정산ID', cellStyle: 'color:#666;font-size:11px' },
      { key: 'etcAdjTypeCd',   label: '유형', badge: (row) => fnTypeBadge(row.etcAdjTypeCd) },
      { key: 'etcAdjDirCd',    label: '방향', badge: (row) => fnDirBadge(row.etcAdjDirCd),
        fmt: (v) => (v === 'ADD' ? '가산' : '차감') },
      { key: 'etcAdjAmt',      label: '조정금액', fmt: fmtW,
        cellStyle: (v, row) => row.etcAdjDirCd === 'ADD' ? 'color:#27ae60;font-weight:700' : 'color:#e74c3c;font-weight:700' },
      { key: 'etcAdjReason',   label: '사유',
        cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { key: 'regBy',          label: '등록자' },
      { key: 'regDate',        label: '등록일', fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 기타조정 추가/수정 ============
    columns.baseForm = [
      { key: 'settleId', label: '정산건', type: 'select', required: true, nullLabel: '선택', colSpan: 3,
        options: () => cfSettleOptions.value },
      { key: 'etcAdjTypeCd', label: '조정유형', type: 'select', required: true, nullable: false,
        options: () => codes.settle_etc_adj_types },
      { key: 'etcAdjDirCd', label: '가산/차감', type: 'select', required: true, nullable: false,
        options: () => codes.adj_dirs },
      { key: 'etcAdjAmt',   label: '조정금액(원)', type: 'number', required: true, placeholder: '항상 양수 — 가산/차감은 방향으로 구분' },
      { type: 'rowBreak' },
      { key: 'etcAdjReason',   label: '사유', type: 'text', required: true,
        placeholder: '기타조정 사유를 입력하세요.', colSpan: 3 },
      { key: 'settleEtcAdjMemo', label: '메모', type: 'textarea', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, cfDtlMode, baseGridPager, etcAdjs, searchParam, form, errors,
      handleBtnAction, handleSelectAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="정산기타조정"
  desc-summary="배송비·반품비·패널티 등 정산조정 외 기타 항목을 별도 관리합니다."
  :desc-detail="['• 정산조정(StSettleAdjMng)에서 처리하기 어려운 비정형 항목을 등록합니다.','• 항목 유형: 배송비 / 반품배송비 / 패널티 / 인센티브 / 세금조정 / 기타','• 가산/차감 방향을 함께 지정해야 합니다.','• 승인 개념이 없어 등록 즉시 정산마감 집계에 포함됩니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 ================================================= -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="정산기타조정 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('etcAdjs-add')">+ 기타조정 추가</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="etcAdjs" row-key="settleEtcAdjId" :selected-key="uiState.selectedId"
      :row-actions="true"
      :row-class="(r) => uiState.selectedId===r.settleEtcAdjId ? 'selected' : ''"
      grid-id="etcAdjs-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        액션
      </template>
      <template #row-actions="{ row: r }">
        <div class="actions">
          <button class="btn btn_row_edit" @click="handleSelectAction('etcAdjs-rowEdit', r)">수정</button>
          <button class="btn btn_row_delete"  @click="handleSelectAction('etcAdjs-rowDelete', r)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('etcAdjs-pager-setPage', n)" :on-size-change="() => handleSelectAction('etcAdjs-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 상세 패널 (전체 폭 — 항상 표시, 미선택 시 안내) ===================== -->
  <bo-container card-style="margin-top:12px"
    :title="!uiState.selectedId ? '기타정산조정 상세' : (uiState.isNew ? '기타정산조정 신규' : (cfDtlMode ? '기타정산조정 상세' : '기타정산조정 수정'))">
    <!-- ===== ■.■. 미선택 안내 (영역은 항상 표시) ================================= -->
    <div v-if="!uiState.selectedId" style="text-align:center;color:#bbb;font-size:13px;padding:32px 16px;">
      목록에서 기타조정 행을 선택하거나 [+ 기타조정 추가]를 누르면 입력할 수 있습니다.
    </div>
    <!-- ===== ■.■. 상세 입력폼 (행 선택 / 신규 시) — readonly 시 BoFormArea 가 [수정][닫기] 자동 노출 ===== -->
    <bo-form-area v-else :columns="columns.baseForm" :form="form" :errors="errors"
      :cols="3" :readonly="cfDtlMode" plain-readonly
      @save="handleBtnAction('form-save')" @cancel="handleBtnAction('form-cancel')"
      @edit="handleBtnAction('form-edit')" @close="handleBtnAction('form-close')" />
  </bo-container>
</bo-page>
`,
};
