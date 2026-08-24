/* ShopJoy Admin - 다국어관리 */
window.SyI18nMng = {
  name: 'SyI18nMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const i18ns     = reactive([]);             // 다국어 키 그리드 데이터
    const uiState  = reactive({ selectedKey: null, dtlMode: 'view' }); // UI 상태 (선택 식별은 i18nKey — UNIQUE 이므로 단독 식별 가능). dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => uiState.dtlMode === 'view');
    const codes    = reactive({ lang_code: [], use_yn: [], i18n_scopes: ['COMMON','FO','BO'] });


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyI18nMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchData();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchData();
      // 번역 메시지 저장
      } else if (cmd === 'msgForm-save') {
        return saveMsgs();
      // 번역 편집 패널 닫기
      } else if (cmd === 'msgForm-close') {
        return resetDetailToNew();
      // 번역 편집 패널 보기모드 → 수정모드 전환
      } else if (cmd === 'msgForm-edit') {
        return switchToEdit();
      // 번역 편집 패널 수정 취소 (보기모드 복귀 또는 닫기)
      } else if (cmd === 'msgForm-cancel') {
        return handleCancelEdit();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyI18nMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 번호 클릭
      if (cmd === 'i18ns-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchData(); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'i18ns-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchData();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터. colKey 기준 분기 (행 액션 버튼·셀 클릭) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyI18nMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'i18ns-cellClick') {
        // 행 수정 버튼 → 상세/수정 패널 열기
        if (colKey === 'btn_row_edit') {
          return openDetail(row);
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          // 이미 보기모드로 열려 있는 동일 행 재클릭 시 패널 닫기 (토글, 기존 동작 유지)
          if (uiState.selectedKey === row.i18nKey && uiState.dtlMode === 'view') { return resetDetailToNew(); }
          return loadView(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', i18nScopeCd: '', useYn: '' }); // 검색조건
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const baseGridPager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const LANGS       = ['ko','en','cn','ja']; // 지원 언어 (sy_i18n 언어컬럼과 1:1)
    const LANG_LABELS = { ko:'한국어', en:'English', cn:'中文', ja:'日本語' };

    const msgForm = reactive({});              // 번역 입력 폼
    const errors  = reactive({});              // 번역 입력 검증 오류 (항목 아래 빨간 라벨)

    const cfSelectedKey = computed(() => (i18ns||[]).find(k => k.i18nKey === uiState.selectedKey) || null);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchData — 목록 조회 */
    const handleSearchData = async () => {
      try {
        /* searchParam 키를 백엔드 SyI18nDto.Request 필드명과 동일하게 두어 그대로 펼친다.
           빈 값은 cofOmitEmpty 가 걸러낸다. */
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...coUtil.cofOmitEmpty({ ...searchParam, searchValue: (searchParam.searchValue || '').trim() }),
        };
        if (params.searchValue && !params.searchType) {
          /* 검색대상 미선택 시 기본 범위 — 키·설명 + 4개 언어 본문 */
          params.searchType = 'i18nKey,i18nDesc,i18nMsgKo,i18nMsgEn,i18nMsgCn,i18nMsgJa';
        }
        const res = await boApiSvc.syI18n.getPage(params, '다국어관리', '조회');
        const d = res.data?.data;
        i18ns.splice(0, i18ns.length, ...(d?.pageList || []));
        baseGridPager.pageTotalCount = d?.pageTotalCount || 0;
        baseGridPager.pageTotalPage  = d?.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
      } catch (err) {
        console.error('[handleSearchData]', err);
        i18ns.splice(0, i18ns.length);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['LANG_CODE', 'USE_YN'], {compNm: 'SyI18nMng'});
      codes.lang_code = codeStore.sgGetGrpCodes('LANG_CODE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    /* _loadDetailForm — 번역 편집 패널에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (key, mode) => {
      uiState.selectedKey = key.i18nKey;
      uiState.dtlMode = mode;
      const msgs = {};
      LANGS.forEach(lang => { msgs[lang] = getLangMsg(key, lang); });
      Object.assign(msgForm, msgs);
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* loadView — 보기모드로 번역 편집 패널 열기 (행 클릭) */
    const loadView = (key) => _loadDetailForm(key, 'view');

    /* openDetail — 수정모드로 번역 편집 패널 열기 ([수정] 버튼) */
    const openDetail = (key) => _loadDetailForm(key, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 상단 [수정] 버튼) */
    const switchToEdit = () => { uiState.dtlMode = 'edit'; };

    /* resetDetailToNew — 번역 편집 패널 닫기(=미선택 상태로 복귀) */
    const resetDetailToNew = () => { uiState.selectedKey = null; uiState.dtlMode = 'view'; };

    /* handleCancelEdit — 수정 취소: 원본 메시지 재적재 후 보기모드 복귀 (신규 등록 개념 없음) */
    const handleCancelEdit = () => {
      const row = cfSelectedKey.value;
      return row ? loadView(row) : resetDetailToNew();
    };

    /* saveMsgs — 번역 메시지 저장 */
    const saveMsgs = async () => {
      if (!cfSelectedKey.value) { return; }
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!msgForm.ko || !msgForm.ko.trim()) {
        errors.ko = '한국어(ko) 번역을 입력해주세요.';
        if (showToast) { showToast('입력 내용을 확인해주세요.', 'error'); }
        return;
      }
      const ok = await showConfirm('저장', '번역 메시지를 저장하시겠습니까?');
      if (!ok) { return; }
      try {
        /* 목록 갱신은 저장 성공 후 재조회로만 한다 (실패 시 화면이 저장된 것처럼 보이면 안 됨) */
        await boApiSvc.syI18n.updateMsgs(cfSelectedKey.value.i18nId, { msgs: { ...msgForm } }, '다국어관리', '저장');
        await handleSearchData();
        uiState.dtlMode = 'view';
        if (showToast) { showToast('저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
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
      await handleSearchData();
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnScopeBadge — 범위 배지 클래스 */
    const fnScopeBadge = s => ({ COMMON:'badge-blue', FO:'badge-green', BO:'badge-orange' }[s] || 'badge-gray');

    /* fnYnBadge — Y/N 배지 클래스 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* getLangMsg — 행의 언어컬럼(i18nMsgKo/En/Cn/Ja)에서 직접 조회
       2026-08-13 sy_i18n_msg 통합: 별도 조회 없이 목록 응답에 번역이 함께 온다 */
    const getLangMsg = (row, lang) => {
      if (!row || !lang) { return ''; }
      return row['i18nMsg' + lang.charAt(0).toUpperCase() + lang.slice(1)] || '';
    };

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (row) => uiState.selectedKey === row.i18nKey ? 'background:#fff8f9;' : '';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'i18nKey',  label: '키' },
          { value: 'i18nDesc', label: '설명' },
          { value: 'i18nMsgKo', label: '한국어' },
          { value: 'i18nMsgEn', label: 'English' },
          { value: 'i18nMsgCn', label: '中文' },
          { value: 'i18nMsgJa', label: '日本語' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'i18nScopeCd', type: 'select', label: '범위', options: () => codes.i18n_scopes, nullLabel: '전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'i18nKey',     label: '키 (i18n_key)',
        cellInnerStyle: 'font-size:12px;color:#7c3aed;font-family:monospace;' },
      { key: 'i18nDesc',    label: '설명', cellStyle: 'color:#666;font-size:12px' },
      { key: 'i18nScopeCd', label: '범위', align: 'center', badge: (row) => fnScopeBadge(row.i18nScopeCd) },
      { key: 'i18nCategory',label: '카테고리', cellStyle: 'font-size:12px;color:#888' },
      { key: 'i18nMsgKo',   label: 'ko', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row, 'ko') },
      { key: 'i18nMsgEn',   label: 'en', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row, 'en') },
      { key: 'i18nMsgCn',   label: 'cn', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row, 'cn') },
      { key: 'i18nMsgJa',   label: 'ja', align: 'center', cellStyle: 'font-size:11px;color:#555', fmt: (v, row) => getLangMsg(row, 'ja') },
      { key: 'useYn',       label: '사용', align: 'center', badge: (row) => fnYnBadge(row.useYn) },
      { type: 'actions', actions: [
        { label: '수정', cls: 'btn btn_row_edit btn-sm', onClick: (row) => handleGridCellAction('i18ns-cellClick', 'btn_row_edit', row) },
      ] },
    ];

    const msgFormColumns = LANGS.map(lang => ({
      key: lang,
      label: LANG_LABELS[lang] + ' (' + lang + ')',
      type: 'text',
      placeholder: LANG_LABELS[lang] + ' 번역 입력',
      required: lang === 'ko', // 기준 언어(한국어)는 최소 1개 필수 입력
    }));

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => {
      const p = { ...coUtil.cofOmitEmpty({ ...searchParam, searchValue: (searchParam.searchValue || '').trim() }) };
      if (p.searchValue && !p.searchType) {
        p.searchType = 'i18nKey,i18nDesc,i18nMsgKo,i18nMsgEn,i18nMsgCn,i18nMsgJa';
      }
      return p;
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, cfDtlMode, searchParam, baseGridPager, i18ns, msgForm, errors, // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      msgFormColumns, // 컬럼 정의
      handleBtnAction, handleSelectAction, handleGridCellAction,                 // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedKey, // computed
      fnRowStyle, // 헬퍼
    };
  },
  template: `
<bo-page title="다국어관리" :share-query="searchParam">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="다국어 키 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="i18ns" row-key="i18nKey" :selected-key="uiState.selectedKey"
      :row-style="fnRowStyle"
      grid-id="i18ns-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleSelectAction('i18ns-pager-setPage', n)" :on-size-change="() => handleSelectAction('i18ns-pager-sizeChange')" />
    <bo-excel-down-modal :show="excelModal.show" domain="syI18n" area-nm="다국어"
      :columns="columns.baseGrid" ui-nm="다국어관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>
  <!-- ===== ■. 번역 편집 패널 (항상 표시) ====================================== -->
  <bo-container>
    <div class="toolbar">
      <span class="list-title">
        {{ !cfSelectedKey ? '다국어 상세' : (cfDtlMode ? '다국어 상세' : '다국어 수정') }}
        <span v-if="cfSelectedKey ? (cfSelectedKey.i18nKey) : false" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
          #{{ cfSelectedKey.i18nKey }}
        </span>
        <span v-else style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">
          목록에서 다국어 키를 선택하세요
        </span>
      </span>
      <div v-if="cfSelectedKey" style="margin-left:auto;display:flex;gap:6px;">
        <template v-if="cfDtlMode">
          <button class="btn btn_edit" @click="handleBtnAction('msgForm-edit')">
            수정
          </button>
          <button class="btn btn_close" @click="handleBtnAction('msgForm-close')">
            닫기
          </button>
        </template>
        <template v-else>
          <button class="btn btn_save" @click="handleBtnAction('msgForm-save')">
            저장
          </button>
          <button class="btn btn_cancel" @click="handleBtnAction('msgForm-cancel')">
            취소
          </button>
          <button class="btn btn_close" @click="handleBtnAction('msgForm-close')">
            닫기
          </button>
        </template>
      </div>
    </div>
    <!-- ===== ■.■. 언어별 번역 입력 (BoFormArea 자동 렌더) ========================== -->
    <div style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area v-if="cfSelectedKey" :columns="msgFormColumns" :form="msgForm" :errors="errors"
        :cols="3" :show-actions="false" :readonly="cfDtlMode" plain-readonly />
      <div v-else style="text-align:center;color:#bbb;padding:28px 12px;font-size:13px;">
        목록에서 다국어 키를 선택하면 언어별 번역을 편집할 수 있습니다.
      </div>
    </div>
  </bo-container>
</bo-page>
`,
};
