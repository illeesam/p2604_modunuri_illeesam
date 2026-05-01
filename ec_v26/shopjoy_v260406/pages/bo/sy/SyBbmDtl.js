/* ShopJoy Admin - 게시판관리 상세/등록 */
window.SyBbmDtl = {
  name: 'SyBbmDtl',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { reactive, computed, watch, onMounted, ref } = Vue;

    const bbms = reactive([]);
    const uiState = reactive({ loading: false, error: null, error: null, isPageCodeLoad: false });
    const codes = reactive({ bbm_types: [], bbm_comment_types: [], bbm_attach_types: [], bbm_content_types: [], bbm_scope_types: [], use_yn: [],
      allow_yn_opts: [{codeValue:'Y',codeLabel:'허용'},{codeValue:'N',codeLabel:'불가'}],
    });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/sy/bbm/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('게시판모드관리', '상세조회')
        });
        bbms = res.data?.data?.pageList || res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (codeStore?.snGetGrpCodes) {
          codes.bbm_types = await codeStore.snGetGrpCodes('BBM_TYPE') || [];
          codes.bbm_comment_types = await codeStore.snGetGrpCodes('BBM_COMMENT_TYPE') || [];
          codes.bbm_attach_types = await codeStore.snGetGrpCodes('BBM_ATTACH_TYPE') || [];
          codes.bbm_content_types = await codeStore.snGetGrpCodes('BBM_CONTENT_TYPE') || [];
          codes.bbm_scope_types = await codeStore.snGetGrpCodes('BBM_SCOPE_TYPE') || [];
          codes.use_yn = await codeStore.snGetGrpCodes('USE_YN') || [];
        }
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
      handleSearchList();
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    const cfIsNew = computed(() => props.editId === null || props.editId === undefined);
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const form = reactive({
      bbmId: null, bbmCode: '', bbmNm: '', bbmType: '일반',
      allowComment: '불가', allowAttach: '불가', allowLike: 'N',
      contentType: 'textarea', scopeType: '공개',
      sortOrd: 1, useYn: 'Y', remark: '', pathId: null,
    });
    const errors = reactive({});

    /* ── 표시경로 모달 ── */
    const pathPickModal = reactive({ show: false });
    const openPathPick = () => { pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; };
    const onPathPicked = (pathId) => { form.pathId = pathId; pathPickModal.show = false; };
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const schema = yup.object({
      bbmCode: yup.string().required('게시판코드를 입력해주세요.'),
      bbmNm: yup.string().required('게시판명을 입력해주세요.'),
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) {
        const b = bbms.find(x => x.bbmId === props.editId);
        if (b) Object.assign(form, { ...b });
      }
    });

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (cfIsNew.value) {
        bbms.push({ ...form, bbmId: nextId.value(bbms, 'bbmId'), regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = bbms.findIndex(x => x.bbmId === props.editId);
        if (idx !== -1) Object.assign(bbms[idx], { ...form });
      }
      try {
        const res = await (cfIsNew.value ? boApi.post(`/bo/sy/bbm/${form.bbmId}`, { ...form }, coUtil.apiHdr('게시판모드관리', '등록')) : boApi.put(`/bo/sy/bbm/${form.bbmId}`, { ...form }, coUtil.apiHdr('게시판모드관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBbmMng');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

    return { bbms, uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '게시판 등록' : (viewMode ? '게시판 상세' : '게시판 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.bbmId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">게시판코드 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmCode" placeholder="BOARD_CODE" style="font-family:monospace;" :readonly="viewMode" :class="errors.bbmCode ? 'is-invalid' : ''" />
        <span v-if="errors.bbmCode" class="field-error">{{ errors.bbmCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">게시판명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmNm" placeholder="게시판명" :readonly="viewMode" :class="errors.bbmNm ? 'is-invalid' : ''" />
        <span v-if="errors.bbmNm" class="field-error">{{ errors.bbmNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.bbmType" :disabled="viewMode">
          <option v-for="c in codes.bbm_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">댓글허용</label>
        <select class="form-control" v-model="form.allowComment" :disabled="viewMode">
          <option v-for="c in codes.bbm_comment_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">첨부허용</label>
        <select class="form-control" v-model="form.allowAttach" :disabled="viewMode">
          <option v-for="c in codes.bbm_attach_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">좋아요허용</label>
        <select class="form-control" v-model="form.allowLike" :disabled="viewMode">
          <option v-for="o in codes.allow_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">내용입력</label>
        <select class="form-control" v-model="form.contentType" :disabled="viewMode">
          <option v-for="c in codes.bbm_content_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">공개범위</label>
        <select class="form-control" v-model="form.scopeType" :disabled="viewMode">
          <option v-for="c in codes.bbm_scope_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">표시경로</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <div :style="{flex:1,padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'13px',background:viewMode?'#f9fafb':'#fff',color:form.pathId!=null?'#374151':'#9ca3af',minHeight:'34px',display:'flex',alignItems:'center'}">
            {{ pathLabel(form.pathId) || '경로 선택...' }}
          </div>
          <button v-if="!viewMode" type="button" class="btn btn-secondary btn-sm" @click="openPathPick">🔍 선택</button>
          <button v-if="!viewMode && form.pathId != null" type="button" class="btn btn-sm" @click="form.pathId=null" style="color:#999;">✕</button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn" :disabled="viewMode">
          <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <input class="form-control" v-model="form.remark" placeholder="비고" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBbmMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBbmMng')">취소</button>
      </template>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal.show" biz-cd="sy_bbm"
    :value="form.pathId"
    title="게시판 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};
