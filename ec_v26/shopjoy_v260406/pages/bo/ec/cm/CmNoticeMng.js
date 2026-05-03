/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // -- 선언부 ----------------------------------------------------------------

    const notices       = reactive([]);                                              // 공지사항 목록
    const uiState       = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' }); // 로딩·에러·코드로드 상태
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });         // 하단 상세 패널 상태 (선택ID, view|edit)
    const codes         = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] });         // 공통코드 (유형·상태)
    const pager         = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 10,
      pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {}
    });                                                                              // 페이징 상태
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { kw: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());                              // 현재 검색 조건

    // 날짜범위 옵션은 codes.date_range_opts에서 로드

    // -- computed --------------------------------------------------------------

    const cfSiteNm       = computed(() => boUtil.getSiteNm());             // 현재 사이트명
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId); // 신규 시 null, 수정 시 ID
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__'); // 조회 모드 여부
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`); // 상세 컴포넌트 강제 재마운트 키
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // -- watch -----------------------------------------------------------------

    // 앱 준비 완료 시 코드 로드 트리거

    // -- 초기화부 --------------------------------------------------------------

    // 공통코드 스토어에서 유형·상태 코드 로드
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.noticeTypes    = codeStore.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = codeStore.sgGetGrpCodes('NOTICE_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    // -- 이벤트 함수 모음 ------------------------------------------------------

    // 조회 버튼 클릭 — 1페이지부터 재조회
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    // 초기화 버튼 클릭 — 검색 조건을 초기값으로 되돌린 후 재조회
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
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

    // -- 일반 함수 모음 --------------------------------------------------------

    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // 공지사항 목록 페이징 조회
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmNotice.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) }, '공지사항관리', '조회');
        notices.splice(0, notices.length, ...(res.data?.data?.pageList || []));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage  = res.data?.data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
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
        const res = await boApiSvc.cmNotice.remove(n.noticeId, '공지사항관리', '삭제');
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
      if (pg === 'cmNoticeMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
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

    // -- return ----------------------------------------------------------------

    return {
      uiStateDetail, notices, uiState, codes, pager,
      searchParam,
      selectedId: computed(() => uiStateDetail.selectedId),
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,
      onSearch, onReset, onDateRangeChange, onSizeChange, setPage,
      handleSearchList, handleDelete, handleLoadDetail, loadView,
      openNew, closeDetail, inlineNavigate,
      fnStatusBadge, fnTypeBadge, exportExcel, onSort, sortIcon,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공지사항관리</div>

  <!-- -- 검색 영역 ------------------------------------------------------- -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="제목 검색" @keyup.enter="onSearch" />
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

  <!-- -- 목록 영역 ------------------------------------------------------- -->
  <div class="card">

    <!-- -- 툴바 ----------------------------------------------------------- -->
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>공지사항목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>

    <!-- -- 테이블 ---------------------------------------------------------- -->
    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">번호</th><th>유형</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">제목 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>고정</th>
          <th>시작일</th><th>종료일</th><th>상태</th><th>사이트명</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
          <th style="text-align:right">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="notices.length===0">
          <td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-else v-for="(n, idx) in notices" :key="n?.noticeId" :style="selectedId===n.noticeId?'background:#fff8f9;':''">
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

    <!-- -- 페이징 ---------------------------------------------------------- -->
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  </div>

  <!-- -- 상세 패널 (인라인 임베드) --------------------------------------- -->
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
