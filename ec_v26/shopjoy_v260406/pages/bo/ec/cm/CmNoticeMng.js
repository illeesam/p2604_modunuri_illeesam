/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // ── 선언부 ────────────────────────────────────────────────────────────────

    const notices       = reactive([]);                                              // 공지사항 목록
    const uiState       = reactive({ loading: false, error: null, isPageCodeLoad: false }); // 로딩·에러·코드로드 상태
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });         // 하단 상세 패널 상태 (선택ID, view|edit)
    const codes         = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] });         // 공통코드 (유형·상태)
    const pager         = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 10,
      pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {}
    });                                                                              // 페이징 상태
    const searchParam = reactive({
      kw: '', type: '', status: '', dateStart: '', dateEnd: '', dateRange: ''
    });                                                                              // 현재 검색 조건
    const searchParamOrg = reactive({
      kw: '', type: '', status: '', dateStart: '', dateEnd: '', dateRange: ''
    });                                                                              // 초기화용 검색 조건 스냅샷

    // 날짜범위 옵션은 codes.date_range_opts에서 로드

    // ── computed ──────────────────────────────────────────────────────────────

    const cfSiteNm       = computed(() => boUtil.getSiteNm());             // 현재 사이트명
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId); // 신규 시 null, 수정 시 ID
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__'); // 조회 모드 여부
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`); // 상세 컴포넌트 강제 재마운트 키
    const cfPageNums     = computed(() => {                                         // 현재 페이지 기준 ±2 페이지 번호 배열
      const cur = pager.pageNo, last = pager.pageTotalPage;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const isAppReady     = computed(() => {                                         // 앱 초기화 + 코드 로드 완료 여부
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    // ── watch ─────────────────────────────────────────────────────────────────

    // 앱 준비 완료 시 코드 로드 트리거

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    // ── 초기화부 ──────────────────────────────────────────────────────────────

    // 공통코드 스토어에서 유형·상태 코드 로드
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.noticeTypes    = await codeStore.snGetGrpCodes('NOTICE_TYPE')   || [];
        codes.noticeStatuses = await codeStore.snGetGrpCodes('NOTICE_STATUS') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      Object.assign(searchParamOrg, searchParam);
    });

    // ── 이벤트 함수 모음 ──────────────────────────────────────────────────────

    // 조회 버튼 클릭 — 1페이지부터 재조회
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    // 초기화 버튼 클릭 — 검색 조건을 초기값으로 되돌린 후 재조회
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };

    // 날짜범위 옵션 변경 — 선택된 옵션으로 dateStart·dateEnd 자동 세팅
    const onDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
      pager.pageNo = 1;
    };

    // 페이지당 건수 변경 — 1페이지부터 재조회
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // 페이지 번호 클릭
    const setPage = (n) => {
      if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); }
    };

    // ── 일반 함수 모음 ────────────────────────────────────────────────────────

    // 공지사항 목록 페이징 조회
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmNotice.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) }, '공지사항관리', '조회');
        notices.splice(0, notices.length, ...(res.data?.data?.pageList || []));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage  = res.data?.data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // 공지사항 삭제 — 확인 후 낙관적 UI 제거 → API 호출 → 목록 갱신
    const handleDelete = async (n) => {
      const ok = await props.showConfirm('삭제', `[${n.noticeTitle}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = notices.findIndex(x => x.noticeId === n.noticeId);
      if (idx !== -1) notices.splice(idx, 1);
      if (uiStateDetail.selectedId === n.noticeId) uiStateDetail.selectedId = null;
      try {
        const res = await boApi.delete(`/bo/ec/cm/notice/${n.noticeId}`, { ...coUtil.apiHdr('공지사항관리', '삭제') });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    // 조회 모드로 하단 상세 열기 (같은 행 재클릭 시 닫힘)
    const loadView = (id) => {
      if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; }
      uiStateDetail.selectedId = id;
      uiStateDetail.openMode = 'view';
    };

    // 수정 모드로 하단 상세 열기 (같은 행 재클릭 시 닫힘)
    const handleLoadDetail = (id) => {
      if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; }
      uiStateDetail.selectedId = id;
      uiStateDetail.openMode = 'edit';
    };

    // 신규 등록 폼 열기
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };

    // 하단 상세 패널 닫기
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    // 상세 컴포넌트 내부 navigate 인터셉터 — 목록 복귀·편집전환은 페이지 이동 없이 처리
    const inlineNavigate = (pg, opts = {}) => {
      console.log('[inlineNavigate]', pg, opts);
      if (pg === 'cmNoticeMng')      {
        console.log('[inlineNavigate] 목록 복귀, 상세 패널 닫고 재조회');
        uiStateDetail.selectedId = null;
        handleSearchList();
        return;
      }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    // 상태 코드 → badge 클래스 변환
    const fnStatusBadge = s => ({ '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' }[s] || 'badge-gray');

    // 유형 코드 → badge 클래스 변환
    const fnTypeBadge   = t => ({ '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' }[t] || 'badge-gray');

    // 현재 목록을 CSV로 내보내기
    const exportExcel = () => boUtil.exportCsv(
      notices,
      [{ label: 'ID', key: 'noticeId' }, { label: '제목', key: 'noticeTitle' }, { label: '유형', key: 'noticeTypeCd' },
       { label: '상태', key: 'noticeStatusCd' }, { label: '조회수', key: 'viewCount' }, { label: '등록일', key: 'regDate' }],
      '공지목록.csv'
    );

    // ── return ────────────────────────────────────────────────────────────────

    return {
      uiStateDetail, notices, uiState, codes, pager,
      searchParam, searchParamOrg,
      selectedId: computed(() => uiStateDetail.selectedId),
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey, cfPageNums,
      onSearch, onReset, onDateRangeChange, onSizeChange, setPage,
      handleSearchList, handleDelete, handleLoadDetail, loadView,
      openNew, closeDetail, inlineNavigate,
      fnStatusBadge, fnTypeBadge, exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공지사항관리</div>

  <!-- ── 검색 영역 ─────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="제목 검색" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="c in codes.noticeTypes" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.noticeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="onDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ── 목록 영역 ─────────────────────────────────────────────────────── -->
  <div class="card">

    <!-- ── 툴바 ─────────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>공지사항목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>

    <!-- ── 테이블 ────────────────────────────────────────────────────────── -->
    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">번호</th><th>유형</th><th>제목</th><th>고정</th>
          <th>시작일</th><th>종료일</th><th>상태</th><th>사이트명</th><th>등록일</th>
          <th style="text-align:right">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="notices.length===0">
          <td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(n, idx) in notices" :key="n?.noticeId" :style="selectedId===n.noticeId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="badge" :class="fnTypeBadge(n.noticeTypeCd)">{{ n.noticeTypeCd }}</span></td>
          <td>
            <span class="title-link" @click="handleLoadDetail(n.noticeId)" :style="selectedId===n.noticeId?'color:#e8587a;font-weight:700;':''">
              {{ n.noticeTitle }}
              <span v-if="n.isFixed==='Y'" style="margin-left:4px;font-size:10px;color:#e8587a;">📌</span>
              <span v-if="selectedId===n.noticeId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
          </td>
          <td><span class="badge" :class="n.isFixed==='Y'?'badge-red':'badge-gray'">{{ n.isFixed==='Y' ? '고정' : '-' }}</span></td>
          <td>{{ n.startDate || '-' }}</td>
          <td>{{ n.endDate || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(n.noticeStatusCd)">{{ n.noticeStatusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td>{{ n.regDate }}</td>
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleLoadDetail(n.noticeId)">수정</button>
              <button class="btn btn-danger btn-sm" @click="handleDelete(n)">삭제</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── 페이징 ────────────────────────────────────────────────────────── -->
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>

  </div>

  <!-- ── 상세 패널 (인라인 임베드) ─────────────────────────────────────── -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <cm-notice-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
      :view-mode="cfIsViewMode"
    />
  </div>

</div>
`
};
