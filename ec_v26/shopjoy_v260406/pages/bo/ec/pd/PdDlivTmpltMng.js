/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const dlivTmplts = reactive([]);              // 배송템플릿 목록 (메인 그리드)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, descOpen: false, isNew: false });
    const codes = reactive({
      dliv_template_types: [],
      use_yn: [],
      dliv_methods: [{value:'COURIER',label:'택배'},{value:'DIRECT',label:'직접배송'},{value:'PICKUP',label:'방문수령'}],
      dliv_pay_types: [{value:'PREPAY',label:'선결제'},{value:'COD',label:'착불'}],
      couriers: [{value:'CJ',label:'CJ'},{value:'LOGEN',label:'LOGEN'},{value:'LOTTE',label:'LOTTE'},{value:'HANJIN',label:'HANJIN'},{value:'POST',label:'POST'},{value:'EPOST',label:'EPOST'},{value:'KGB',label:'KGB'}],
    });
    const baseForm = reactive({});                    // 상세 폼 데이터
    const SORT_MAP = { nm: { asc: 'dlivTmpltNm asc', desc: 'dlivTmpltNm desc' } };
    const METHOD_LABELS = { COURIER:'택배', DIRECT:'직접배송', PICKUP:'방문수령' };
    const PAY_LABELS = { PREPAY:'선결제', COD:'착불' };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList();
      // 신규 등록 패널 열기
      } else if (cmd === 'dlivTmplts-add') {
        return openNew();
      // 안내 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      // 상세 폼 저장
      } else if (cmd === 'baseForm-save') {
        return handleSave();
      // 상세 폼 삭제
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 상세 폼 닫기
      } else if (cmd === 'baseForm-close') {
        uiState.selectedId = null;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/정렬/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 행 클릭 → 상세 열기
      if (cmd === 'dlivTmplts-rowOpen') {
        return openDetail(param);
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'dlivTmplts-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 변경
      } else if (cmd === 'dlivTmplts-pager-setPage') {
        if (param >= 1 && param <= baseGrid.pager.pageTotalPage) { baseGrid.pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'dlivTmplts-pager-sizeChange') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ method: '', use: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 10 });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* getSortParam — 정렬 파라미터 */
    /* onSort — 정렬 */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.pdDlivTmplt.getPage({ pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '배송템플릿관리', '목록조회');
        const data = res.data?.data;
        dlivTmplts.splice(0, dlivTmplts.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    /* openDetail — 상세 열기 (토글) */
    const openDetail = (row) => {
      if (uiState.selectedId === row.dlivTmpltId) { uiState.selectedId = null; return; }
      Object.assign(baseForm, { ...row });
      uiState.selectedId = row.dlivTmpltId;
      uiState.isNew = false;
    };

    /* openNew — 신규 등록 폼 열기 */
    const openNew = () => {
      Object.assign(baseForm, { dlivTmpltId: null, siteId: 1, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!baseForm.dlivTmpltNm) { showToast('템플릿명은 필수입니다.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      const isNewTmplt = uiState.isNew;
      const src = dlivTmplts;
      if (isNewTmplt) { baseForm.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...baseForm }); uiState.selectedId = baseForm.dlivTmpltId; uiState.isNew = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === baseForm.dlivTmpltId); if (si !== -1) Object.assign(src[si], baseForm); }
      try {
        const res = await boApiSvc.pdDlivTmplt.save(baseForm.dlivTmpltId || null, { ...baseForm }, '배송템플릿관리', isNewTmplt ? '등록' : '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) { return; }
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = dlivTmplts.findIndex(t => t.dlivTmpltId === cfSelectedRow.value.dlivTmpltId); if (si !== -1) dlivTmplts.splice(si, 1); uiState.selectedId = null;
      try {
        const res = await boApiSvc.pdDlivTmplt.remove(cfSelectedRow.value.dlivTmpltId, '배송템플릿관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    배송템플릿관리
  </div>
  <!-- ===== ■. 안내 설명 박스 (접기/펼치기) ================================== -->
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span>
      <strong style="color:#1a7a52">
        배송템플릿
      </strong>
      은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다.
    </span>
    <button @click="handleBtnAction('desc-toggle')" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고
      <strong>
        상품 등록 시 템플릿을 연결
      </strong>
      해 재사용합니다.
      <br>
      ✔ 도서·산간 지역 추가 배송비,
      <strong>
        반품지 주소
      </strong>
      를 함께 관리합니다.
      <br>
      ✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.
      <br>
      <span style="color:#888;font-size:12px">
        예) 3만원 이상 무료배송, 제주·도서 추가 3,000원
      </span>
    </div>
  </div>
  <!-- ===== □. 안내 설명 박스 ================================================ -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        배송템플릿 목록
      </span>
      <span class="list-count">
        총 {{ baseGrid.pager.pageTotalCount }}건
      </span>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="handleBtnAction('dlivTmplts-add')">
        + 신규
      </button>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="dlivTmplts" :pager="baseGrid.pager" row-key="dlivTmpltId"
      list-title="목록" :count-text="baseGrid.pager.pageTotalCount + '건'"
      :sort-state="{ sortKey: baseGrid.sortKey, sortDir: baseGrid.sortDir }"
      :row-class="(row) => uiState.selectedId===row.dlivTmpltId ? 'active' : ''"
      @sort="key => handleSelectAction('dlivTmplts-sort', key)" @row-click="row => handleSelectAction('dlivTmplts-rowOpen', row)" @set-page="n => handleSelectAction('dlivTmplts-pager-setPage', n)" @size-change="handleSelectAction('dlivTmplts-pager-sizeChange')">
    </bo-grid>
  </div>
  <!-- ===== □. 목록 그리드 =================================================== -->
  <!-- ===== ■. 상세 패널 (신규/수정 폼) ====================================== -->
  <div class="card" v-if="uiState.selectedId">
    <!-- ===== ■.■. 상세 툴바: 제목 + 저장/삭제/닫기 ============================ -->
    <div class="toolbar">
      <span class="list-title">
        {{ uiState.isNew ? '배송템플릿 신규 등록' : '배송템플릿 상세 / 수정' }}
      </span>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn-blue btn-sm" @click="handleBtnAction('baseForm-save')">
          저장
        </button>
        <button v-if="!uiState.isNew" class="btn btn-danger btn-sm" @click="handleBtnAction('form-delete')">
          삭제
        </button>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseForm-close')">
          닫기
        </button>
      </div>
    </div>
    <!-- ===== □.□. 상세 툴바 ================================================ -->
    <!-- ===== ■.■. 상세 입력폼 (BoFormArea 자동 렌더) ======================== -->
    <div style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="baseFormColumns" :form="baseForm" :errors="{}"
        :cols="2" :show-actions="false" />
    </div>
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
</div>
`
};
