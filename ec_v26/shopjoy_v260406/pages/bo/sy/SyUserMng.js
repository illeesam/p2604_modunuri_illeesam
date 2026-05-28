/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const users = reactive([]);                    // 사용자 목록 (메인 그리드 데이터)
    const depts = reactive([]);                    // 부서 트리 (좌측 트리)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      boUsers: [], selectedDeptId: null,
    });
    const codes = reactive({ user_status: [], user_roles: [], user_date_types: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'userNm asc', desc: 'userNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 사용자 신규 등록 (인라인 패널)
      } else if (cmd === 'users-add') {
        return openNew();
      // 사용자 목록 엑셀 내보내기
      } else if (cmd === 'users-excel') {
        return exportExcel();
      // 사용자 엑셀 업로드 모달 열기
      } else if (cmd === 'users-excel-upload') {
        excelUploadModal.reloadTrigger++;
        excelUploadModal.show = true;
        return;
      // 부서 트리 전체 펼치기
      } else if (cmd === 'deptTree-expandAll') {
        return expandAll();
      // 부서 트리 전체 접기
      } else if (cmd === 'deptTree-collapseAll') {
        return collapseAll();
      // 부서 트리 노드 펼치기/접기 토글
      } else if (cmd === 'deptTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
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
      console.log(' ■■ SyUserMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'users-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'users-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'users-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 클릭 → 편집 패널 열기
      } else if (cmd === 'users-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'users-rowDelete') {
        return handleDelete(param);
      // 부서 트리 노드 선택 → 우측 그리드 필터링 + 상세 패널 닫기
      } else if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        baseGrid.pager.pageNo = 1;
        baseDetail.selectedId = null;
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', role: '', status: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* ===== 좌측 부서 트리 ===== */
    const expanded = reactive(new Set([null]));

    /* ===== 상세 인라인 패널 ===== */
    const baseDetail = coUtil.cofDetail(); // 인라인 Dtl 패널 상태

    /* ===== 엑셀 업로드 모달 (컬럼은 다운로드 파일의 3행 헤더에서 자동 추출) ===== */
    const excelUploadModal = reactive({ show: false, reloadTrigger: 0 });
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.user_status = codeStore.sgGetGrpCodes('USER_STATUS');
      codes.user_roles = codeStore.sgGetGrpCodes('USER_ROLE');
      codes.user_date_types = codeStore.sgGetGrpCodes('USER_DATE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 트리 + 목록 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchTree();
      expanded.add(null);
      await handleSearchList('DEFAULT');
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize,
          ...baseGrid.sortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'userId,loginId,userNm,userEmail';
        }
        if (uiState.selectedDeptId != null) { params.deptId = uiState.selectedDeptId; }
        const res = await boApiSvc.syUser.getPage(params, '사용자관리', '목록조회');
        const data = res.data?.data;
        users.splice(0, users.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || users.length;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchTree — 부서 트리 조회 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syDept.getTree('사용자관리', '트리조회');
        depts.splice(0, depts.length, ...(res.data?.data || []));
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };

    /* buildTree — 부서 트리 빌드 */
    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) { map[d.parentDeptId].children.push(map[d.deptId]); }
        else { roots.push(map[d.deptId]); }
      });
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));

    /* expandAll — 트리 전체 펼치기 */
    const expandAll = () => { const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); }; cfTree.value.children.forEach(walk); expanded.add(null); };

    /* collapseAll — 트리 전체 접기 */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      baseGrid.pager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'view'; baseDetail.reloadTrigger++; };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 */
    const handleLoadDetail = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* openNew — 신규 등록 */
    const openNew = () => { baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { baseDetail.selectedId = null; };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { baseDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { baseDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    /* exportExcel — 엑셀(xlsx) 내보내기. 백엔드 SXSSF 스트리밍 — 대용량 메모리 안전. */
    const exportExcel = () => {
      const params = {
        ...baseGrid.sortParam(),
        ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
      };
      if (uiState.selectedDeptId != null) { params.deptId = uiState.selectedDeptId; }
      return coUtil.cofDownloadExcel('/bo/sy/user/excel', params, '사용자목록', '사용자관리', '엑셀다운로드');
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    사용자관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 부서 트리 ================================================= -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">
          📂 부서
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-expandAll')" style="flex:1;font-size:11px;">
          ▼ 전체펼치기
        </button>
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-collapseAll')" style="flex:1;font-size:11px;">
          ▶ 전체닫기
        </button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedDeptId"
          :on-toggle="id => handleBtnAction('deptTree-toggle', id)"
          :on-select="id => handleSelectAction('deptTree-select', id)"
          :depth="0" />
      </div>
    </div>
    <div>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid
        :columns="baseGridColumns" :rows="users" :pager="baseGrid.pager" row-key="userId"
        list-title="사용자목록" :count-text="baseGrid.pager.pageTotalCount + '건'"
        :sort-state="baseGrid" :row-style="fnRowStyle"
        @sort="key => handleSelectAction('users-sort', key)"
        @set-page="n => handleSelectAction('users-pager-setPage', n)"
        @size-change="handleSelectAction('users-pager-sizeChange')"
        @row-click="row => handleSelectAction('users-rowEdit', row.userId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="handleBtnAction('users-excel')">
              📥 엑셀
            </button>
            <button class="btn btn-blue btn-sm" @click="handleBtnAction('users-excel-upload')">
              📤 엑셀업로드
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('users-add')">
              + 신규
            </button>
          </div>
        </template>
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row }">
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleSelectAction('users-rowEdit', row.userId)">
                수정
              </button>
              <button class="btn btn-danger btn-sm" @click="handleSelectAction('users-rowDelete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="baseDetail.reloadTrigger"
      :on-list-reload="handleSearchList" />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->

  <!-- ===== ■. 엑셀 업로드 모달 (도메인은 모달 안의 select 로 전환 가능) ===== -->
  <bo-excel-upload-modal v-if="excelUploadModal.show"
    default-domain="user"
    @close="excelUploadModal.show = false"
    @saved="handleSearchList" />
</div>
`,
};
