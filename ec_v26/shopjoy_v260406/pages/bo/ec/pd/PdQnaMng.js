/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);                // 상품 목록 (이름 변환용)
    const members = reactive([]);                 // 회원 목록 (이름 변환용)
    const qnas = reactive([]);                    // Q&A 목록 (메인 그리드 데이터)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc',
                               selectedId: null, isNew: false });
    const codes = reactive({ qna_statuses: [] });
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    /* Dtl 인라인 패널용 폼 */
    const form = reactive({ qnaId: null, siteId: null, prodId: null, memberId: null,
                            qnaTitle: '', qnaContent: '', answYn: 'N', answContent: '',
                            scrtYn: 'N', regDate: null, answDate: null });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

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
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        return handleSearchList();
      // 답변 저장
      } else if (cmd === 'form-save') {
        return handleSaveAnswer();
      // 상세 패널 닫기
      } else if (cmd === 'form-close') {
        return handleClose();
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
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return handleLoadDetail(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* handleLoadDetail — 단건 조회 후 인라인 패널에 폼 로드 */
    const handleLoadDetail = async (row) => {
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
      } catch (err) {
        console.error('[handleLoadDetail]', err);
      }
    };

    /* handleSaveAnswer — 답변 저장 */
    const handleSaveAnswer = async () => {
      if (!form.qnaId) return;
      try {
        await boApiSvc.pdQna.answer(form.qnaId,
          { answContent: form.answContent, answYn: form.answContent ? 'Y' : 'N' },
          '상품Q&A관리', '답변저장');
        form.answYn = form.answContent ? 'Y' : 'N';
        await handleSearchList('RELOAD');
      } catch (err) {
        console.error('[handleSaveAnswer]', err);
      }
    };

    /* handleClose — 상세 패널 닫기 */
    const handleClose = () => { uiState.selectedId = null; uiState.isNew = false; };

    const _initSearchParam = () => ({ status: '', prod: '' });
    const searchParam = reactive(_initSearchParam());

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

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdQna.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) }, '상품Q&A관리', '목록조회');
        const data = res.data?.data;
        qnas.splice(0, qnas.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
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
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.qna_statuses = codeStore.sgGetGrpCodes('QNA_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '키워드', type: 'text', placeholder: '제목 검색' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.qna_statuses, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'siteNm',   label: '사이트', fmt: () => cfSiteNm.value },
      { key: 'prodId',   label: '상품명', fmt: (v) => getProdNm(v) },
      { key: 'qnaTitle', label: '제목', link: true },
      { key: 'memberId', label: '작성자', fmt: (v) => getMemNm(v) },
      { key: 'answYn',   label: '상태', badge: (q) => fnStatusBadge(q.answYn), fmt: (v) => fnAnswLabel(v) },
      { key: 'regDate',  label: '등록일', sortKey: 'reg', fmt: (v) => (v || '').slice(0, 10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      qnas, uiState, codes, baseGridPager, searchParam, form,                                  // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                       // dispatch
      cfSiteNm,                                                                        // computed
      sortIcon, fnStatusBadge, fnAnswLabel, fnProdNm, fnMemNm,                         // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="상품 Q&A 관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <bo-container title="Q&amp;A 목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare
      :columns="columns.baseGrid" :rows="qnas" row-key="qnaId" :selected-key="uiState.selectedId"
      :loading="uiState.loading"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      empty-text="조회된 데이터가 없습니다."
      @sort="key => handleBtnAction('qnas-sort', key)"
      grid-id="qnas-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('qnas-pager-setPage', n)" :on-size-change="() => handleSelectAction('qnas-pager-sizeChange')" />
  </bo-container>
  <!-- ===== □. 목록 그리드 =================================================== -->
  <!-- ===== ■. 상세 패널 (질문/답변 — 항상 표시, 미선택 시 안내) ==================== -->
  <bo-container bare>
    <div class="card" style="margin-top:14px;">
      <div class="toolbar">
        <span class="list-title">
          상품 Q&A 상세 / 답변
          <span v-if="uiState.selectedId && form.qnaId" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
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
        <!-- 질문 본문 -->
        <div class="form-group">
          <label class="form-label">질문 내용</label>
          <div style="padding:12px;background:#fafafa;border:1px solid #e5e7eb;border-radius:6px;min-height:80px;white-space:pre-wrap;">
            {{ form.qnaContent || '(내용 없음)' }}
          </div>
        </div>
        <!-- 답변 입력 -->
        <div class="form-group" style="margin-top:14px;">
          <label class="form-label">답변</label>
          <textarea v-model="form.answContent" class="form-control" rows="6"
            placeholder="답변을 입력하세요"></textarea>
        </div>
        <!-- 하단 액션 -->
        <div class="form-actions">
          <button class="btn btn-blue" @click="handleBtnAction('form-save')">
            답변 저장
          </button>
          <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
            닫기
          </button>
        </div>
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 상세 패널 =================================================== -->
</bo-page>
`
};
