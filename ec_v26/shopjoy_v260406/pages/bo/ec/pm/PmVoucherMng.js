/* ShopJoy Admin - 상품권관리 목록 + 하단 VoucherDtl 임베드 */
window.PmVoucherMng = {
  name: 'PmVoucherMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vouchers = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list' });
    const codes = reactive({
      voucher_statuses: [],
      promo_statuses: [],
      date_range_opts: [],
    });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });
    /* 하단 상세 */
    const baseDetail = coUtil.cofDetail();

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmVoucherMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 상품권 신규 등록
      } else if (cmd === 'vouchers-add') {
        return openNew();
      // 상품권 엑셀 내보내기
      } else if (cmd === 'vouchers-excel') {
        return exportExcel();
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmVoucherMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬
      if (cmd === 'vouchers-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'vouchers-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'vouchers-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 행 클릭 → 상세 편집
      } else if (cmd === 'vouchers-rowEdit') {
        return handleLoadDetail(param);
      // 행 삭제
      } else if (cmd === 'vouchers-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 바우처(상품권) fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.voucher_statuses = codeStore.sgGetGrpCodes('VOUCHER_STATUS');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'voucherNm asc', desc: 'voucherNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    /* 바우처(상품권) onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'voucherNm,voucherId';
        }
        const res = await boApiSvc.pmVoucher.getPage(params, '바우처관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        vouchers.splice(0, vouchers.length, ...list);
        baseGrid.pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, res.data?.data?.pageCond || baseGrid.pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      baseGrid.pager.pageNo = 1;
    };

    /* loadView — 뷰 로드 */
    const loadView = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'view'; baseDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { baseDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmVoucherMng') { baseDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { baseDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => baseDetail.selectedId === '__new__' ? null : baseDetail.selectedId);
    const cfIsViewMode = computed(() => baseDetail.openMode === 'view' && baseDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${baseDetail.selectedId}_${baseDetail.openMode}`);
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    상품권관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        상품권목록
        <span class="list-count">
          {{ baseGrid.pager.pageTotalCount }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('vouchers-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('vouchers-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="vouchers" :pager="baseGrid.pager" row-key="voucherId"
      :row-actions="true"
      :sort-state="{ sortKey: baseGrid.sortKey, sortDir: baseGrid.sortDir }"
      :row-style="(v) => baseDetail.selectedId===v.voucherId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('vouchers-sort', key)" @row-click="v => handleSelectAction('vouchers-rowEdit', v.voucherId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: v }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('vouchers-rowEdit', v.voucherId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('vouchers-rowDelete', v)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' && baseGrid.pager.pageTotalCount > 0" :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('vouchers-pager-setPage', n)" :on-size-change="() => handleSelectAction('vouchers-pager-sizeChange')" />
    <!-- ===== □.□. 목록 영역 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="vouchers.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="v in vouchers" :key="v?.voucherId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="baseDetail.selectedId===v.voucherId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('vouchers-rowEdit', v.voucherId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            상품권 #{{ v.voucherId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('vouchers-rowEdit', v.voucherId)" :style="baseDetail.selectedId===v.voucherId?{color:'#e8587a'}:{}">
            {{ v.voucherNm }}
            <span v-if="baseDetail.selectedId===v.voucherId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(v.voucherStatusCd)" style="font-size:11px;">
              {{ v.voucherStatusCd }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              💰 액면 {{ (v.voucherValue||0).toLocaleString() }}원 / 판매 {{ (v.salePrice||0).toLocaleString() }}원
            </div>
            <div>
              📅 {{ v.startDate }} ~ {{ v.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              발행 {{ (v.issueQty||0).toLocaleString() }}개 / 판매 {{ (v.soldQty||0).toLocaleString() }}개
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('vouchers-rowEdit', v.voucherId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('vouchers-rowDelete', v)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ v.voucherId }}
          </span>
        </div>
      </div>
    </div>
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('vouchers-pager-setPage', n)" :on-size-change="() => handleSelectAction('vouchers-pager-sizeChange')" />
  </div>
  <!-- ===== □.□. 카드 뷰 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: VoucherDtl 임베드 =================================== -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-voucher-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"

      :reload-trigger="baseDetail.reloadTrigger"
      :on-list-reload="handleBtnAction"
      />
  </div>
</div>
<!-- ===== □. 하단 상세: VoucherDtl 임베드 =================================== -->
`
};
