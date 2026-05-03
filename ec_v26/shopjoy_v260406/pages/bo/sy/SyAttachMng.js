/* ShopJoy Admin - 첨부관리 (좌30% 그룹 + 우70% 파일) */
window.SyAttachMng = {
  name: 'SyAttachMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const attaches = reactive([]);
    const attachGrps = reactive([]);
    const uiState = reactive({ fileEditMode: false, grpEditMode: false, loading: false, error: null, isPageCodeLoad: false, selectedGrpId: null, grpEditId: null, fileEditId: null });
    const codes = reactive({ attach_type: [], active_statuses: [], date_range_opts: [] });
    const grpSearchKw = ref('');
    const pager = reactive({
      pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageNums: [], pageSizes: [10, 20, 50, 100],
    });

    const cfFilteredGrps = computed(() => {
      const kw = grpSearchKw.value.trim().toLowerCase();
      if (!kw) return attachGrps;
      return attachGrps.filter(g =>
        (g.grpNm || '').toLowerCase().includes(kw) ||
        (g.grpCode || '').toLowerCase().includes(kw)
      );
    });

    const fnBuildPageNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    const searchParam = reactive({ kw: '', attachGrpId: '', dateRange: '', dateStart: '', dateEnd: '' });

    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };

    // 그룹 목록 로드
    const handleLoadGrps = async () => {
      try {
        const grpRes = await boApiSvc.syAttachGrp.getPage({ pageNo: 1, pageSize: 10000 }, '첨부파일관리', '그룹조회');
        attachGrps.splice(0, attachGrps.length, ...(grpRes.data?.data?.pageList || grpRes.data?.data?.list || []));
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    // 파일 목록 조회 (서버사이드 페이징)
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const p = {
          pageNo: pager.pageNo,
          pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // 좌측 그룹 클릭 선택이 우선, 없으면 검색 조건 attachGrpId 사용
        if (uiState.selectedGrpId) p.attachGrpId = uiState.selectedGrpId;
        const attachRes = await boApiSvc.syAttach.getPage(p, '첨부파일관리', '조회');
        const data = attachRes.data?.data;
        const list = data?.pageList || data?.list || [];
        attaches.splice(0, attaches.length, ...list);
        pager.pageTotalCount = data?.pageTotalCount ?? data?.totalCount ?? data?.total ?? list.length ?? 0;
        pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPageNums();
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.attach_type = codeStore.sgGetGrpCodes('ATTACH_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleLoadGrps();
      handleSearchData();
    });

    const cfSiteNm = computed(() => boUtil.getSiteNm());

    /* -- 검색 / 페이징 -- */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchData(); };
    const onReset = () => {
      Object.assign(searchParam, { kw: '', attachGrpId: '', dateStart: '', dateEnd: '', dateRange: '' });
      uiState.selectedGrpId = null;
      pager.pageNo = 1;
      handleSearchData();
    };
    const setPage      = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* -- 첨부그룹 -- */
    const grpForm = reactive({ grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });

    const selectGrp = (id) => {
      uiState.selectedGrpId = uiState.selectedGrpId === id ? null : id;
      searchParam.attachGrpId = '';
      uiState.grpEditMode = false;
      pager.pageNo = 1;
      pager.pageTotalCount = 0; pager.pageTotalPage = 1;
      handleSearchData();
    };
    const openGrpNew = () => {
      uiState.grpEditId = null; uiState.grpEditMode = true;
      Object.assign(grpForm, { grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });
    };
    const openGrpEdit = (g) => {
      uiState.grpEditId = g.attachGrpId; uiState.grpEditMode = true;
      Object.assign(grpForm, { ...g });
    };
    const handleSaveGrp = async () => {
      if (!grpForm.grpNm || !grpForm.grpCode) { showToast('그룹명과 코드는 필수입니다.', 'error'); return; }
      try {
        if (uiState.grpEditId === null) {
          await boApi.post('/bo/sy/attach-grp', { ...grpForm }, coUtil.apiHdr('첨부파일관리', '그룹등록'));
          showToast('그룹이 등록되었습니다.', 'success');
        } else {
          await boApi.put(`/bo/sy/attach-grp/${uiState.grpEditId}`, { ...grpForm }, coUtil.apiHdr('첨부파일관리', '그룹수정'));
          showToast('저장되었습니다.', 'success');
        }
        uiState.grpEditMode = false;
        await handleLoadGrps();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };
    const handleDeleteGrp = async (g) => {
      const ok = await showConfirm('그룹 삭제', `[${g.grpNm}] 그룹을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await boApi.delete(`/bo/sy/attach-grp/${g.attachGrpId}`, coUtil.apiHdr('첨부파일관리', '그룹삭제'));
        if (uiState.selectedGrpId === g.attachGrpId) { uiState.selectedGrpId = null; attaches.splice(0, attaches.length); pager.totalCount = 0; }
        showToast('삭제되었습니다.', 'success');
        await handleLoadGrps();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* -- 첨부파일 -- */
    const fileForm = reactive({
      attachGrpId: null, fileNm: '', fileSize: 0, fileExt: '', mimeTypeCd: '',
      storedNm: '', storageType: '', storagePath: '', attachUrl: '', cdnHost: '', cdnImgUrl: '',
      thumbFileNm: '', thumbStoredNm: '', thumbUrl: '', thumbCdnUrl: '', thumbGeneratedYn: 'N',
      sortOrd: 0, attachMemo: '', refId: '',
    });

    const openFileNew = () => {
      uiState.fileEditId = null; uiState.fileEditMode = true;
      Object.assign(fileForm, {
        attachGrpId: uiState.selectedGrpId, fileNm: '', fileSize: 0, fileExt: '', mimeTypeCd: '',
        storedNm: '', storageType: 'LOCAL', storagePath: '', attachUrl: '', cdnHost: '', cdnImgUrl: '',
        thumbFileNm: '', thumbStoredNm: '', thumbUrl: '', thumbCdnUrl: '', thumbGeneratedYn: 'N',
        sortOrd: 0, attachMemo: '', refId: '',
      });
    };
    const openFileEdit = (a) => {
      uiState.fileEditId = a.attachId; uiState.fileEditMode = true;
      Object.assign(fileForm, { ...a });
    };
    const handleSaveFile = async () => {
      if (!fileForm.fileNm || !fileForm.attachGrpId) { showToast('그룹과 파일명은 필수입니다.', 'error'); return; }
      try {
        if (uiState.fileEditId === null) {
          await boApi.post('/bo/sy/attach', { ...fileForm }, coUtil.apiHdr('첨부파일관리', '파일등록'));
          showToast('파일이 등록되었습니다.', 'success');
        } else {
          await boApi.put(`/bo/sy/attach/${uiState.fileEditId}`, { ...fileForm }, coUtil.apiHdr('첨부파일관리', '파일수정'));
          showToast('저장되었습니다.', 'success');
        }
        uiState.fileEditMode = false;
        pager.pageNo = 1;
        await handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };
    const handleDeleteFile = async (a) => {
      const ok = await showConfirm('파일 삭제', `[${a.fileNm}] 파일을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await boApi.delete(`/bo/sy/attach/${a.attachId}`, coUtil.apiHdr('첨부파일관리', '파일삭제'));
        showToast('삭제되었습니다.', 'success');
        await handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    const fnFmtSize = bytes => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray', 'ACTIVE': 'badge-green', 'INACTIVE': 'badge-gray' }[s] || 'badge-gray');

    // -- return ---------------------------------------------------------------
    return {
      attaches, uiState, codes, searchParam, onDateRangeChange, cfSiteNm,
      attachGrps, cfFilteredGrps, grpSearchKw, grpForm, pager,
      selectGrp, openGrpNew, openGrpEdit, handleSaveGrp, handleDeleteGrp,
      fileForm, onSearch, onReset, setPage, onSizeChange, openFileNew, openFileEdit, handleSaveFile, handleDeleteFile,
      fnFmtSize, fnStatusBadge,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">첨부관리</div>
  <div style="display:flex;gap:16px;align-items:flex-start;">

    <!-- 좌: 첨부그룹관리 (30%) -->
    <div style="flex:0 0 30%;min-width:260px;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <b style="font-size:14px;">첨부그룹관리</b>
          <button class="btn btn-primary btn-sm" @click="openGrpNew">+ 신규</button>
        </div>
        <div style="padding:0 0 10px 0;">
          <input v-model="grpSearchKw" placeholder="그룹명 / 코드 검색" style="width:100%;font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;" />
        </div>

        <!-- 그룹 폼 -->
        <div v-if="uiState.grpEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">
            {{ uiState.grpEditId===null ? '그룹 등록' : '그룹 수정' }}
            <span v-if="uiState.grpEditId" style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">#{{ uiState.grpEditId }}</span>
          </div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">그룹명 <span class="req">*</span></label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.grpNm" placeholder="그룹명" />
          </div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">그룹코드 <span class="req">*</span></label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.grpCode" placeholder="PRODUCT_IMG" />
          </div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">허용확장자</label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.allowExt" placeholder="jpg,png,pdf" />
          </div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <div class="form-group" style="flex:1;margin-bottom:0;">
              <label class="form-label" style="font-size:12px;">최대개수</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" type="number" v-model.number="grpForm.maxCount" min="1" />
            </div>
            <div class="form-group" style="flex:1;margin-bottom:0;">
              <label class="form-label" style="font-size:12px;">최대크기(MB)</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" type="number" v-model.number="grpForm.maxSizeMb" min="1" />
            </div>
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:12px;">상태</label>
            <select class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.status">
              <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" @click="handleSaveGrp">저장</button>
            <button class="btn btn-secondary btn-sm" style="flex:1;" @click="uiState.grpEditMode=false">취소</button>
          </div>
        </div>

        <!-- 그룹 목록 -->
        <div v-for="g in cfFilteredGrps" :key="g.attachGrpId"
          style="padding:10px 12px;border-bottom:1px solid #f0f0f0;cursor:pointer;border-radius:4px;transition:background .15s;"
          :style="uiState.selectedGrpId===g.attachGrpId ? 'background:#fff0f4;border-left:3px solid #e8587a;' : ''"
          @click="selectGrp(g.attachGrpId)">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:600;color:#333;">{{ g.grpNm }}</div>
              <div style="font-size:11px;color:#888;margin-top:2px;">{{ g.grpCode }} | 최대 {{ g.maxCount }}개 / {{ g.maxSizeMb }}MB</div>
              <div style="font-size:10px;color:#bbb;margin-top:1px;">#{{ g.attachGrpId }}</div>
            </div>
            <div style="display:flex;gap:4px;" @click.stop>
              <button class="btn btn-blue btn-sm" style="font-size:11px;padding:2px 6px;" @click="openGrpEdit(g)">수정</button>
              <button class="btn btn-danger btn-sm" style="font-size:11px;padding:2px 6px;" @click="handleDeleteGrp(g)">삭제</button>
            </div>
          </div>
          <div style="margin-top:4px;">
            <span class="badge" :class="fnStatusBadge(g.status)" style="font-size:10px;">{{ g.status }}</span>
            <span style="font-size:11px;color:#aaa;margin-left:6px;">{{ g.allowExt }}</span>
            <span style="font-size:11px;color:#2563eb;margin-left:8px;font-weight:500;">{{ cfSiteNm }}</span>
          </div>
        </div>
        <div v-if="!cfFilteredGrps.length" style="text-align:center;color:#999;padding:20px;font-size:13px;">{{ grpSearchKw ? '검색 결과가 없습니다.' : '그룹이 없습니다.' }}</div>
      </div>
    </div>

    <!-- 우: 첨부파일관리 (70%) -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <!-- 검색바 -->
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
          <b style="font-size:14px;white-space:nowrap;">첨부파일관리
            <span v-if="uiState.selectedGrpId" style="font-size:12px;color:#e8587a;margin-left:4px;font-weight:600;">— {{ attachGrps.find(g=>g.attachGrpId===uiState.selectedGrpId)?.grpNm }}</span>
            <span v-else style="font-size:11px;color:#aaa;font-weight:400;margin-left:4px;">(전체)</span>
          </b>
          <input v-model="searchParam.attachGrpId" placeholder="첨부그룹ID" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;width:130px;" @keyup.enter="onSearch" />
          <input v-model="searchParam.kw" placeholder="파일명 / RefID 검색" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;width:150px;" @keyup.enter="onSearch" />
          <span style="font-size:12px;color:#666;white-space:nowrap;">등록일</span>
          <input type="date" v-model="searchParam.dateStart" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" />
          <span style="font-size:12px;color:#aaa;">~</span>
          <input type="date" v-model="searchParam.dateEnd" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" />
          <select v-model="searchParam.dateRange" @change="onDateRangeChange" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;">
            <option value="">옵션선택</option>
            <option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
          </select>
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <div style="margin-left:auto;display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
            <button class="btn btn-primary btn-sm" @click="openFileNew">+ 신규</button>
          </div>
        </div>

        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          첨부파일목록 <span class="list-count">{{ pager.pageTotalCount }}건</span>
        </span>

        <!-- 파일 폼 -->
        <div v-if="uiState.fileEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:10px 14px 12px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#444;">
            {{ uiState.fileEditId===null ? '파일 등록' : '파일 수정' }}
            <span v-if="uiState.fileEditId" style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">#{{ uiState.fileEditId }}</span>
          </div>
          <!-- Grid 4열 폼 -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px 10px;margin-bottom:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">첨부그룹ID <span class="req">*</span></label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.attachGrpId" placeholder="ATG..." />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 2;">
              <label class="form-label" style="font-size:11px;">파일명 <span class="req">*</span></label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.fileNm" placeholder="파일명.jpg" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">MIME타입</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.mimeTypeCd" placeholder="image/jpeg" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">확장자</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.fileExt" placeholder="jpg" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">파일크기(byte)</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" type="number" v-model.number="fileForm.fileSize" placeholder="0" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">참조ID</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.refId" placeholder="PROD-001" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">정렬순서</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" type="number" v-model.number="fileForm.sortOrd" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">스토리지타입</label>
              <select class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.storageType">
                <option value="LOCAL">LOCAL</option>
                <option value="AWS_S3">AWS_S3</option>
                <option value="NCP_OBS">NCP_OBS</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 3;">
              <label class="form-label" style="font-size:11px;">저장경로</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.storagePath" placeholder="/cdn/{업무명}/YYYY/MM/DD/" />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 2;">
              <label class="form-label" style="font-size:11px;">저장파일명</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.storedNm" placeholder="YYYYMMDD_hhmmss_seq_random" />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 2;">
              <label class="form-label" style="font-size:11px;">첨부URL</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.attachUrl" placeholder="/uploads/..." />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 2;">
              <label class="form-label" style="font-size:11px;">CDN Host</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.cdnHost" placeholder="https://cdn.shopjoy.com" />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 2;">
              <label class="form-label" style="font-size:11px;">CDN 이미지URL</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.cdnImgUrl" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">썸네일생성</label>
              <select class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.thumbGeneratedYn">
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">썸네일파일명</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.thumbFileNm" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">썸네일저장명</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.thumbStoredNm" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">썸네일URL</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.thumbUrl" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:11px;">썸네일CDN URL</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.thumbCdnUrl" />
            </div>
            <div class="form-group" style="margin-bottom:0;grid-column:span 3;">
              <label class="form-label" style="font-size:11px;">메모</label>
              <input class="form-control" style="font-size:12px;padding:3px 6px;" v-model="fileForm.attachMemo" />
            </div>
          </div>
          <!-- 저장/취소 가운데 정렬 -->
          <div style="display:flex;gap:8px;justify-content:center;">
            <button class="btn btn-primary btn-sm" style="min-width:60px;" @click="handleSaveFile">저장</button>
            <button class="btn btn-secondary btn-sm" style="min-width:60px;" @click="uiState.fileEditMode=false">취소</button>
          </div>
        </div>

        <table class="admin-table">
          <thead><tr>
            <th style="width:36px;text-align:center;">번호</th>
            <th>그룹</th>
            <th>파일명</th>
            <th style="width:70px;">크기</th>
            <th style="width:55px;">확장자</th>
            <th style="width:100px;">참조ID</th>
            <th>메모</th>
            <th style="width:145px;">등록일</th>
            <th style="width:70px;">사이트명</th>
            <th style="width:80px;text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="uiState.loading"><td colspan="10" style="text-align:center;color:#999;padding:30px;">조회 중...</td></tr>
            <tr v-else-if="attaches.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-else v-for="(a, idx) in attaches" :key="a.attachId">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td>
                <span style="font-size:11px;color:#666;">{{ a.attachGrpNm || attachGrps.find(g=>g.attachGrpId===a.attachGrpId)?.grpNm }}</span>
                <span style="font-size:10px;color:#bbb;margin-left:4px;">#{{ a.attachGrpId }}</span>
              </td>
              <td style="font-size:12px;word-break:break-all;">{{ a.fileNm }}</td>
              <td style="font-size:12px;">{{ fnFmtSize(a.fileSize) }}</td>
              <td><span style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;">{{ a.fileExt }}</span></td>
              <td style="font-size:12px;color:#666;">{{ a.refId }}</td>
              <td style="font-size:12px;color:#888;">{{ a.memo }}</td>
              <td style="font-size:12px;">{{ String(a.regDate||'').slice(0,19) }}</td>
              <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="openFileEdit(a)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDeleteFile(a)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>

        <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />

      </div>
    </div>
  </div>
</div>
`
};
