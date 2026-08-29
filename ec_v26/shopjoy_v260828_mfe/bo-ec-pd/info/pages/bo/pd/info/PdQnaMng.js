/* ShopJoy Admin - 상품Q&A관리 */
export default {
  name: 'pd-info-pdQnaMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);                // 상품 목록 (이름 변환용)
    const members = reactive([]);                 // 회원 목록 (이름 변환용)
    const qnas = reactive([]);                    // Q&A 목록 (메인 그리드 데이터)
    const uiState = reactive({ loading: false, error: null, sortKey: '', sortDir: 'asc',
                               selectedId: null, isNew: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => uiState.dtlMode === 'view');
    const codes = reactive({ qna_statuses: [] });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    /* Dtl 인라인 패널용 폼 */
    const form = reactive({ qnaId: null, siteId: null, prodId: null, memberId: null,
                            qnaTitle: '', qnaContent: '', answYn: 'N', answContent: '',
                            scrtYn: 'N', regDate: null, answDate: null });

    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdQnaMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        return handleSearchList();
      // 답변 저장
      } else if (cmd === 'form-save') {
        return handleSaveAnswer();
      // 상세 패널 닫기
      } else if (cmd === 'form-close') {
        return handleClose();
      // 상세 패널 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return switchToEdit();
      // 상세 패널 수정 취소 (보기모드 복귀 또는 닫기)
      } else if (cmd === 'form-cancel') {
        return handleCancelEdit();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'qnas-sort') {
        return onSort(param);
      // 페이지 번호 변경
      } else if (cmd === 'qnas-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/정렬/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdQnaMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'qnas-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick', e.colKey 기준 분기) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PdQnaMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'qnas-cellClick') {
        // 행 수정 버튼 → 상세/수정 패널 열기
        if (colKey === 'btn_row_edit') {
          return openDetail(row);
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* _loadDetailForm — 단건 조회 후 인라인 패널에 폼 로드 (view/edit 공용) */
    const _loadDetailForm = async (row, mode) => {
      if (!row || !row.qnaId) return;
      try {
        const res = await boApiSvc.pdQna.getById(row.qnaId, '상품Q&A관리', '단건조회');
        const data = res.data?.data || row;
        Object.assign(form, {
          qnaId: data.qnaId, siteId: data.siteId, prodId: data.prodId, memberId: data.memberId,
          qnaTitle: data.qnaTitle || '', qnaContent: data.qnaContent || '',
          answYn: data.answYn || 'N', answContent: data.answContent || '',
          scrtYn: data.scrtYn || 'N', regDate: data.regDate, answDate: data.answDate,
        });
        uiState.selectedId = data.qnaId;
        uiState.isNew = false;
        uiState.dtlMode = mode;
      } catch (err) {
        console.error('[handleLoadDetail]', err);
      }
    };

    /* loadView — 보기모드로 인라인 패널 열기 (행 클릭 / 제목 링크) */
    const loadView = (row) => _loadDetailForm(row, 'view');

    /* openDetail — 수정모드로 인라인 패널 열기 ([수정] 버튼) */
    const openDetail = (row) => _loadDetailForm(row, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 하단 [수정] 버튼) */
    const switchToEdit = () => { uiState.dtlMode = 'edit'; };

    /* handleCancelEdit — 수정 취소: 원본 답변 재적재(서버 재조회) 후 보기모드 복귀 (신규 등록 개념 없음) */
    const handleCancelEdit = () => {
      const row = qnas.find(q => q.qnaId === uiState.selectedId);
      return row ? loadView(row) : handleClose();
    };

    /* handleSaveAnswer — 답변 저장 */
    const handleSaveAnswer = async () => {
      if (!form.qnaId) return;
      try {
        await boApiSvc.pdQna.answer(form.qnaId,
          { answContent: form.answContent, answYn: form.answContent ? 'Y' : 'N' },
          '상품Q&A관리', '답변저장');
        form.answYn = form.answContent ? 'Y' : 'N';
        uiState.dtlMode = 'view';
        await handleSearchList('RELOAD');
      } catch (err) {
        console.error('[handleSaveAnswer]', err);
      }
    };

    /* handleClose — 상세 패널 닫기 */
    const handleClose = () => { uiState.selectedId = null; uiState.isNew = false; uiState.dtlMode = 'view'; };

    const searchParam = reactive({ answYn: '', prodId: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };



    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdQna.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) }, '상품Q&A관리', '목록조회');
        const data = res.data?.data;
        qnas.splice(0, qnas.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };


    /* fnProdNm — 상품명 조회 */
    const fnProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };
    const getProdNm = fnProdNm;   // 기존 호환

    /* fnMemNm — 회원명 조회 */
    const fnMemNm = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };
    const getMemNm = fnMemNm;     // 기존 호환

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = answYn => answYn === 'Y' ? 'badge-green' : 'badge-orange';

    /* fnAnswLabel — 답변 라벨 */
    const fnAnswLabel = answYn => answYn === 'Y' ? '답변완료' : '미답변';

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다.
         `QNA_STATUS` 를 읽고 있었는데 그 그룹은 DB 에 존재하지 않아 '상태' select 가
         항상 비어 있었다(2026-07-30). 이 select 의 key 는 answYn(답변여부 Y/N) 이므로
         관례({동사}_YN: SEND_YN/CLOSE_YN/CONFIRM_YN)에 맞춘 ANSW_YN 을 신설해 연결했다. */
      await codeStore.saLoadCodes(['ANSW_YN'], {compNm: 'PdQnaMng'});
      try {
        codes.qna_statuses = codeStore.sgGetGrpCodes('ANSW_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);


    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '키워드', type: 'text', placeholder: '제목 검색' },
      { key: 'answYn', label: '상태', type: 'select', options: () => codes.qna_statuses, nullLabel: '전체' },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    // 답변 폼
    columns.answerForm = [
      { key: '_qnaContent', label: '질문 내용', type: 'slot', name: 'qnaContent', colSpan: 3 },
      { key: 'answContent', label: '답변',      type: 'textarea', rows: 6, colSpan: 3,
        placeholder: '답변을 입력하세요' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'siteNm',   label: '사이트' },
      { key: 'prodId',   label: '상품명', fmt: (v) => getProdNm(v) },
      { key: 'qnaTitle', label: '제목', link: true },
      { key: 'memberId', label: '작성자', fmt: (v) => getMemNm(v) },
      { key: 'answYn',   label: '상태', badge: (q) => fnStatusBadge(q.answYn), fmt: (v) => fnAnswLabel(v) },
      { key: 'regDate',  label: '등록일', sortKey: 'reg', fmt: (v) => (v || '').slice(0, 10) },
      { type: 'actions', actions: [
        { label: '수정', cls: 'btn btn_row_edit btn-sm', onClick: (row) => handleGridCellAction('qnas-cellClick', 'btn_row_edit', row) },
      ] },
    ];

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => ({ ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      qnas, uiState, cfDtlMode, baseGridPager, searchParam, form,       // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction, // dispatch
      fnStatusBadge, fnAnswLabel, fnProdNm, fnMemNm,          // 헬퍼
    };
  },
  template: /* html */`
<bo-page :share-query="searchParam">
  <template #title>상품 Q&A 관리</template>
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <bo-container title="Q&amp;A 목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare
      :columns="columns.baseGrid" :rows="qnas" row-key="qnaId" :selected-key="uiState.selectedId"
      :loading="uiState.loading"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      empty-text="조회된 데이터가 없습니다."
      @sort="key => handleBtnAction('qnas-sort', key)"
      grid-id="qnas-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('qnas-pager-setPage', n)" :on-size-change="() => handleSelectAction('qnas-pager-sizeChange')" />
    <bo-excel-down-modal :show="excelModal.show" domain="pdQna" area-nm="상품문의"
      :columns="columns.baseGrid" ui-nm="상품Q&A관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>
  <!-- ===== □. 목록 그리드 =================================================== -->
  <!-- ===== ■. 상세 패널 (질문/답변 — 항상 표시, 미선택 시 안내) ==================== -->
  <bo-container bare>
    <div class="card" style="margin-top:14px;">
      <div class="toolbar">
        <span class="list-title">
          {{ !uiState.selectedId ? '상품문의 상세' : (cfDtlMode ? '상품문의 상세' : '상품문의 수정') }}
          <span v-if="uiState.selectedId ? (form.qnaId) : false" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
            #{{ form.qnaId }}
          </span>
          <span v-if="!uiState.selectedId" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
            목록에서 행을 선택하세요
          </span>
        </span>
      </div>
      <!-- ===== ■.■. 미선택 안내 (영역은 항상 표시) ================================= -->
      <div v-if="!uiState.selectedId" style="text-align:center;color:#bbb;font-size:13px;padding:32px 16px;">
        목록에서 Q&A 행을 선택하면 상세/답변을 입력할 수 있습니다.
      </div>
      <!-- ===== ■.■. 상세/답변 입력 (행 선택 시) ================================= -->
      <div v-else style="padding:12px;">
        <!-- 메타정보 (읽기 전용) -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;font-size:13px;margin-bottom:14px;">
          <div><span style="color:#999;">상품: </span><b>{{ fnProdNm(form.prodId) }}</b></div>
          <div><span style="color:#999;">작성자: </span><b>{{ fnMemNm(form.memberId) }}</b></div>
          <div><span style="color:#999;">상태: </span>
            <span class="badge" :class="fnStatusBadge(form.answYn)">{{ fnAnswLabel(form.answYn) }}</span>
          </div>
          <div style="grid-column:1/-1;"><span style="color:#999;">제목: </span><b>{{ form.qnaTitle }}</b></div>
        </div>
        <!-- 답변 폼 -->
        <bo-form-area :columns="columns.answerForm" :form="form" :errors="{}"
          :cols="3" :show-actions="false" :readonly="cfDtlMode" plain-readonly>
          <template #qnaContent>
            <div style="padding:12px;background:#fafafa;border:1px solid #e5e7eb;border-radius:6px;min-height:80px;white-space:pre-wrap;">
              {{ form.qnaContent || '(내용 없음)' }}
            </div>
          </template>
        </bo-form-area>
        <!-- 하단 액션 — 보기모드=[수정][닫기] / 수정모드=[답변저장][취소] -->
        <bo-form-actions :readonly="cfDtlMode" :show-delete="false" save-label="답변 저장" :edit-click="() => handleBtnAction('form-edit')"
 :save-click="() => handleBtnAction('form-save')"
 :cancel-click="() => handleBtnAction('form-cancel')"
 :close-click="() => handleBtnAction('form-close')" />
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 상세 패널 =================================================== -->
</bo-page>
`
};
