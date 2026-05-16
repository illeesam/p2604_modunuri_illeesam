/* ShopJoy Admin - 게시판관리 상세/등록 */
window.SyBbmDtl = {
  name: 'SyBbmDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, watch, onMounted, ref } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ bbm_types: [], bbm_comment_types: [], bbm_attach_types: [], bbm_content_types: [], bbm_scope_types: [], use_yn: [],
      allow_yn_opts: [{codeValue:'Y',codeLabel:'허용'},{codeValue:'N',codeLabel:'불가'}],
    });

    /* 게시판 마스터 fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.bbm_types = codeStore.sgGetGrpCodes('BBM_TYPE');
        codes.bbm_comment_types = codeStore.sgGetGrpCodes('BBM_COMMENT_TYPE');
        codes.bbm_attach_types = codeStore.sgGetGrpCodes('BBM_ATTACH_TYPE');
        codes.bbm_content_types = codeStore.sgGetGrpCodes('BBM_CONTENT_TYPE');
        codes.bbm_scope_types = codeStore.sgGetGrpCodes('BBM_SCOPE_TYPE');
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
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

    /* 게시판 마스터 openPathPick */
    const openPathPick = () => { pathPickModal.show = true; };

    /* 게시판 마스터 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; };

    /* 게시판 마스터 onPathPicked */
    const onPathPicked = (pathId) => { form.pathId = pathId; pathPickModal.show = false; };

    /* 게시판 마스터 pathLabel */
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const schema = yup.object({
      bbmCode: yup.string().required('게시판코드를 입력해주세요.'),
      bbmNm: yup.string().required('게시판명을 입력해주세요.'),
    });

    /* 게시판 마스터 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbm.getById(props.dtlId, '게시판모드관리', '상세조회');
        const data = res.data?.data;
        if (data) Object.assign(form, data);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 상세 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      if (!cfIsNew.value) { await handleLoadDetail(); }
    });
    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) return;
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleLoadDetail();
    });

    /* 게시판 마스터 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm(cfIsNew.value ? '등록' : '저장', cfIsNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = await (cfIsNew.value ? boApiSvc.syBbm.create({ ...form }, '게시판모드관리', '등록') : boApiSvc.syBbm.update(form.bbmId, { ...form }, '게시판모드관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBbmMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, codes, cfIsNew, form, errors, handleSave, cfSiteNm, cfDtlMode, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '게시판 등록' : (cfDtlMode ? '게시판 상세' : '게시판 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.bbmId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">게시판코드 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmCode" placeholder="BOARD_CODE" style="font-family:monospace;" :readonly="cfDtlMode" :class="errors.bbmCode ? 'is-invalid' : ''" />
        <span v-if="errors.bbmCode" class="field-error">{{ errors.bbmCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">게시판명 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmNm" placeholder="게시판명" :readonly="cfDtlMode" :class="errors.bbmNm ? 'is-invalid' : ''" />
        <span v-if="errors.bbmNm" class="field-error">{{ errors.bbmNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.bbmType" :disabled="cfDtlMode">
          <option v-for="c in codes.bbm_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">댓글허용</label>
        <select class="form-control" v-model="form.allowComment" :disabled="cfDtlMode">
          <option v-for="c in codes.bbm_comment_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">첨부허용</label>
        <select class="form-control" v-model="form.allowAttach" :disabled="cfDtlMode">
          <option v-for="c in codes.bbm_attach_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">좋아요허용</label>
        <select class="form-control" v-model="form.allowLike" :disabled="cfDtlMode">
          <option v-for="o in codes.allow_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">내용입력</label>
        <select class="form-control" v-model="form.contentType" :disabled="cfDtlMode">
          <option v-for="c in codes.bbm_content_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">공개범위</label>
        <select class="form-control" v-model="form.scopeType" :disabled="cfDtlMode">
          <option v-for="c in codes.bbm_scope_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">표시경로</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <div :style="{flex:1,padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'13px',background:cfDtlMode?'#f9fafb':'#fff',color:form.pathId!=null?'#374151':'#9ca3af',minHeight:'34px',display:'flex',alignItems:'center'}">
            {{ pathLabel(form.pathId) || '경로 선택...' }}
          </div>
          <button v-if="!cfDtlMode" type="button" class="btn btn-secondary btn-sm" @click="openPathPick">🔍 선택</button>
          <button v-if="!cfDtlMode && form.pathId != null" type="button" class="btn btn-sm" @click="form.pathId=null" style="color:#999;">✕</button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn" :disabled="cfDtlMode">
          <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <input class="form-control" v-model="form.remark" placeholder="비고" :readonly="cfDtlMode" />
      </div>
    </div>
    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
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
