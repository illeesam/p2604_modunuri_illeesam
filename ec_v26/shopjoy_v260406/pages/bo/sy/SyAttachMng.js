/* ShopJoy Admin - 첨부관리 (좌30% 그룹 + 우70% 파일) */
window.SyAttachMng = {
  name: 'SyAttachMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const attaches = reactive([]);
    const attachGrps = reactive([]);
    const uiState = reactive({ fileEditMode: false, grpEditMode: false, loading: false, error: null, isPageCodeLoad: false, selectedGrpId: null, grpEditId: null, fileEditId: null});
    const codes = reactive({ attach_type: [] });

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const [attachRes, grpRes] = await Promise.all([
          window.boApi.get('/bo/sy/attach/page', { params: { pageNo: 1, pageSize: 10000 }, headers: { 'X-UI-Nm': '첨부파일관리', 'X-Cmd-Nm': '조회' } }),
          window.boApi.get('/bo/sy/attach-grp/page', { params: { pageNo: 1, pageSize: 10000 }, headers: { 'X-UI-Nm': '첨부파일관리', 'X-Cmd-Nm': '조회' } }),
        ]);
        attaches.splice(0, attaches.length, ...(attachRes.data?.data?.pageList || attachRes.data?.data?.list || []));
        attachGrps.splice(0, attachGrps.length, ...(grpRes.data?.data?.pageList || grpRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyAttach 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT'); });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.attach_type = await codeStore.snGetGrpCodes('ATTACH_TYPE') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    const searchParam = reactive({ dateRange: '', dateStart: '', dateEnd: '' });
    const DATE_RANGE_OPTIONS = window.boUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = window.boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };
    const cfSiteNm = computed(() => window.boUtil.getSiteNm());

    // Helper function for next ID
    const nextId = {
      value: (arr, idField) => {
        if (!Array.isArray(arr) || arr.length === 0) return 1;
        return Math.max(...arr.map(x => x[idField] || 0)) + 1;
      }
    };

    /* ── 첨부그룹 ── */
        const grpForm = reactive({ grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });
    
    const selectGrp = (id) => { uiState.selectedGrpId = uiState.selectedGrpId === id ? null : id; uiState.grpEditMode = false; };

    const openGrpNew = () => {
      uiState.grpEditId = null; uiState.grpEditMode = true;
      Object.assign(grpForm, { grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });
    };
    const openGrpEdit = (g) => {
      uiState.grpEditId = g.attachGrpId; uiState.grpEditMode = true;
      Object.assign(grpForm, { ...g });
    };
    const handleSaveGrp = () => {
      if (!grpForm.grpNm || !grpForm.grpCode) { props.showToast('그룹명과 코드는 필수입니다.', 'error'); return; }
      if (uiState.grpEditId === null) {
        if (!Array.isArray(attachGrps)) return;
        attachGrps.push({ ...grpForm, attachGrpId: nextId.value(attachGrps, 'attachGrpId'), regDate: new Date().toISOString().slice(0, 10) });
        props.showToast('그룹이 등록되었습니다.');
      } else {
        if (!Array.isArray(attachGrps)) return;
        const idx = attachGrps.findIndex(x => x.attachGrpId === uiState.grpEditId);
        if (idx !== -1) Object.assign(attachGrps[idx], grpForm);
        props.showToast('저장되었습니다.');
      }
      uiState.grpEditMode = false;
    };
    const handleDeleteGrp = async (g) => {
      const ok = await props.showConfirm('그룹 삭제', `[${g.grpNm}] 그룹을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = attachGrps.findIndex(x => x.attachGrpId === g.attachGrpId);
      if (idx !== -1) attachGrps.splice(idx, 1);
      if (uiState.selectedGrpId === g.attachGrpId) uiState.selectedGrpId = null;
      props.showToast('삭제되었습니다.');
    };

    /* ── 첨부파일 ── */
    Object.assign(searchParam, { kw: '' });
    const fileForm = reactive({ attachGrpId: null, fileNm: '', fileSize: 0, fileExt: '', url: '', refId: '', memo: '' });
    
    const applied = reactive({ kw: '', dateStart: '', dateEnd: '' });

    const cfFilteredFiles = computed(() => {
      const items = attaches || [];
      if (!Array.isArray(items)) return [];
      return items.filter(a => {
        if (uiState.selectedGrpId && a.attachGrpId !== uiState.selectedGrpId) return false;
        const kw = applied.kw.trim().toLowerCase();
        if (kw && !a.fileNm.toLowerCase().includes(kw) && !a.refId.toLowerCase().includes(kw)) return false;
        const _d = String(a.regDate || '').slice(0, 10);
        if (applied.dateStart && _d < applied.dateStart) return false;
        if (applied.dateEnd && _d > applied.dateEnd) return false;
        return true;
      });
    });

    const onSearch = async () => {
      Object.assign(applied, {
        kw: searchParam.kw,
        dateStart: searchParam.dateStart,
        dateEnd: searchParam.dateEnd,
      });
      await handleSearchData('DEFAULT');
    };
    const onReset = () => {
      searchParam.kw = '';
      searchParam.dateStart = ''; searchParam.dateEnd = ''; searchParam.dateRange = '';
      Object.assign(applied, { kw: '', dateStart: '', dateEnd: '' });
    };

    const openFileNew = () => {
      uiState.fileEditId = null; uiState.fileEditMode = true;
      Object.assign(fileForm, { attachGrpId: uiState.selectedGrpId, fileNm: '', fileSize: 0, fileExt: '', url: '', refId: '', memo: '' });
    };
    const openFileEdit = (a) => {
      uiState.fileEditId = a.attachId; uiState.fileEditMode = true;
      Object.assign(fileForm, { ...a });
    };
    const handleSaveFile = () => {
      if (!fileForm.fileNm || !fileForm.attachGrpId) { props.showToast('그룹과 파일명은 필수입니다.', 'error'); return; }
      const grp = (Array.isArray(attachGrps) ? attachGrps : []).find(g => g.attachGrpId === fileForm.attachGrpId);
      if (uiState.fileEditId === null) {
        attaches.push({ ...fileForm, attachId: nextId.value(attaches, 'attachId'), attachGrpNm: grp?.grpNm || '', regDate: new Date().toISOString().slice(0, 10) });
        props.showToast('파일이 등록되었습니다.');
      } else {
        const idx = (Array.isArray(attaches) ? attaches : []).findIndex(x => x.attachId === uiState.fileEditId);
        if (idx !== -1) Object.assign(attaches[idx], { ...fileForm, attachGrpNm: grp?.grpNm || '' });
        props.showToast('저장되었습니다.');
      }
      uiState.fileEditMode = false;
    };
    const handleDeleteFile = async (a) => {
      const ok = await props.showConfirm('파일 삭제', `[${a.fileNm}] 파일을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (Array.isArray(attaches) ? attaches : []).findIndex(x => x.attachId === a.attachId);
      if (idx !== -1) attaches.splice(idx, 1);
      props.showToast('삭제되었습니다.');
    };

    const fnFmtSize = bytes => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    const cfTotal = computed(() => cfFilteredFiles.value.length);

    const fileEditMode = Vue.toRef(uiState, 'fileEditMode');
    const grpEditMode = Vue.toRef(uiState, 'grpEditMode');

    // ── return ───────────────────────────────────────────────────────────────

    return { attaches, uiState, codes, searchParam, DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm,
      attachGrps, grpForm, cfTotal,
      selectGrp, openGrpNew, openGrpEdit, handleSaveGrp, handleDeleteGrp,
      fileForm, applied, cfFilteredFiles, onSearch, onReset, openFileNew, openFileEdit, handleSaveFile, handleDeleteFile,
      fnFmtSize, fnStatusBadge,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">첨부관리</div>
  <div style="display:flex;gap:16px;align-items:flex-start;">

    <!-- ── 좌: 첨부그룹관리 (30%) ────────────────────────────────────────────── -->
    <div style="flex:0 0 30%;min-width:260px;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <b style="font-size:14px;">첨부그룹관리</b>
          <button class="btn btn-primary btn-sm" @click="openGrpNew">+ 신규</button>
        </div>

        <!-- ── 그룹 폼 ───────────────────────────────────────────────────── -->
        <div v-if="uiState.grpEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">{{ uiState.grpEditId===null ? '그룹 등록' : '그룹 수정' }}</div>
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
              <option>활성</option><option>비활성</option>
            </select>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" @click="handleSaveGrp">저장</button>
            <button class="btn btn-secondary btn-sm" style="flex:1;" @click="grpEditMode=false">취소</button>
          </div>
        </div>

        <!-- ── 그룹 목록 ──────────────────────────────────────────────────── -->
        <div v-for="g in attachGrps" :key="g.attachGrpId"
          style="padding:10px 12px;border-bottom:1px solid #f0f0f0;cursor:pointer;border-radius:4px;transition:background .15s;"
          :style="uiState.selectedGrpId===g.attachGrpId?'background:#fff0f4;border-left:3px solid #e8587a;':'' "
          @click="selectGrp(g.attachGrpId)">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:600;color:#333;">{{ g.grpNm }}</div>
              <div style="font-size:11px;color:#888;margin-top:2px;">{{ g.grpCode }} | 최대 {{ g.maxCount }}개 / {{ g.maxSizeMb }}MB</div>
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
        <div v-if="!attachGrps.length" style="text-align:center;color:#999;padding:20px;font-size:13px;">그룹이 없습니다.</div>
      </div>
    </div>

    <!-- ── 우: 첨부파일관리 (70%) ────────────────────────────────────────────── -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <b style="font-size:14px;">첨부파일관리
            <span v-if="uiState.selectedGrpId" style="font-size:12px;color:#e8587a;margin-left:6px;">
              ({{ attachGrps.find(g=>g.attachGrpId===uiState.selectedGrpId)?.grpNm }})
            </span>
          </b>
          <div style="display:flex;gap:8px;align-items:center;">
            <input v-model="searchParam.kw" placeholder="파일명 / RefID 검색" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;width:160px;" />
            <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" /><select v-model="searchParam.dateRange" @change="onDateRangeChange" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
            <div class="search-actions">
              <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
              <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
            </div>
            <button class="btn btn-primary btn-sm" @click="openFileNew">+ 신규</button>
          </div>
        </div>
        <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>첨부파일목록 <span class="list-count">{{ cfTotal }}건</span></span>

        <!-- ── 파일 폼 ───────────────────────────────────────────────────── -->
        <div v-if="uiState.fileEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">{{ uiState.fileEditId===null ? '파일 등록' : '파일 수정' }}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:140px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">첨부그룹 <span class="req">*</span></label>
              <select class="form-control" style="font-size:12px;padding:4px 8px;" v-model.number="fileForm.attachGrpId">
                <option :value="null">그룹 선택</option>
                <option v-for="g in attachGrps" :key="g.attachGrpId" :value="g.attachGrpId">{{ g.grpNm }}</option>
              </select>
            </div>
            <div class="form-group" style="flex:2;min-width:200px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">파일명 <span class="req">*</span></label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.fileNm" placeholder="파일명.jpg" />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">확장자</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.fileExt" placeholder="jpg" />
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div class="form-group" style="flex:2;min-width:200px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">URL</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.url" placeholder="/uploads/..." />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">참조ID</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.refId" placeholder="PROD-001" />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">메모</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.memo" />
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" @click="handleSaveFile">저장</button>
            <button class="btn btn-secondary btn-sm" @click="fileEditMode=false">취소</button>
          </div>
        </div>

        <table class="bo-table">
          <thead><tr>
            <th>ID</th><th>그룹</th><th>파일명</th><th>크기</th><th>확장자</th><th>참조ID</th><th>메모</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="cfFilteredFiles.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="a in cfFilteredFiles" :key="a.attachId">
              <td>{{ a.attachId }}</td>
              <td><span style="font-size:11px;color:#666;">{{ a.attachGrpNm }}</span></td>
              <td style="font-size:12px;word-break:break-all;">{{ a.fileNm }}</td>
              <td style="font-size:12px;">{{ fnFmtSize(a.fileSize) }}</td>
              <td><span style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;">{{ a.fileExt }}</span></td>
              <td style="font-size:12px;color:#666;">{{ a.refId }}</td>
              <td style="font-size:12px;color:#888;">{{ a.memo }}</td>
              <td style="font-size:12px;">{{ a.regDate }}</td>
              <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="openFileEdit(a)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDeleteFile(a)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
`
};
