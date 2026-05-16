/* ShopJoy Admin - 게시글관리 상세/등록 */
window.SyBbsDtl = {
  name: 'SyBbsDtl',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
    dtlId:       { type: String, default: null }, // 수정 대상 ID
    tabMode:     { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:     { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    const { reactive, computed, onMounted, ref, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, showBbmDetail: false, error: null, isPageCodeLoad: false, selectedBbm: null, showBbmModal: false });
    const codes = reactive({ bbs_post_statuses: [] });

    /* 게시판 게시물 fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.bbs_post_statuses = codeStore.sgGetGrpCodes('BBS_POST_STATUS');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ── watch ────────────────────────────────────────────────────────────────


    const cfIsNew = computed(() => props.dtlId === null || props.dtlId === undefined);
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ── 선택된 게시판 정보 ── */
    
    /* ── 폼 ── */
    const form = reactive({
      bbsId: null, bbmId: null, bbsTitle: '', authorNm: '', bbsStatusCd: '게시',
      attachGrpId: null, contentHtml: '', viewCount: 0, commentCount: 0,
    });
    const errors = reactive({});

    const schema = yup.object({
      bbmId: yup.number().required('게시판을 선택해주세요.').min(1, '게시판을 선택해주세요.'),
      bbsTitle: yup.string().required('제목을 입력해주세요.'),
    });

    /* ── 게시판 선택 팝업 ── */
    const showBbmModal  = ref(false);

    /* 게시판 게시물 onBbmSelect */
    const onBbmSelect = (b) => {
      uiState.showBbmModal = false;
      if (uiState.selectedBbm && uiState.selectedBbm.bbmId === b.bbmId) return;
      uiState.selectedBbm = b;
      form.bbmId = b.bbmId;
      /* 게시판 변경 시 레이아웃 초기화 */
      form.bbsTitle    = '';
      form.authorNm      = '';
      form.bbsStatusCd = '게시';
      form.attachGrpId = null;
      form.contentHtml = '';
    };

    /* 게시판 contentType 에 따른 내용 입력 방식 */
    const cfContentType = computed(() => uiState.selectedBbm?.contentTypeCd || 'textarea');
    const cfAllowAttach = computed(() => uiState.selectedBbm?.allowAttach || '불가');

    /* ── 초기화 ── */

    /* 게시판 게시물 상세조회 */
    const handleLoadDetail = async () => {
      if (cfIsNew.value) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbs.getById(props.dtlId, '게시판관리', '상세조회');
        const data = res.data?.data;
        if (data) {
          Object.assign(form, data);
          uiState.selectedBbm = null;
        }
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

    /* ── 첨부 허용 개수 ── */
    const cfAttachMaxCount = computed(() => {
      const map = { '불가': 0, '1개': 1, '2개': 2, '3개': 3, '목록': 10 };
      return map[cfAllowAttach.value] ?? 0;
    });

    /* ── 저장 ── */
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
        const res = await (cfIsNew.value ? boApiSvc.syBbs.create({ ...form }, '게시판관리', '등록') : boApiSvc.syBbs.update(form.bbsId, { ...form }, '게시판관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(cfIsNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBbsMng', { reload: true });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const selectedBbm = computed(() => uiState.selectedBbm);
    const showBbmDetail = Vue.toRef(uiState, 'showBbmDetail');

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ── return ───────────────────────────────────────────────────────────────

    const dtlId = Vue.computed(() => props.dtlId);
    return { uiState, codes, cfIsNew, dtlId, form, errors, selectedBbm, cfContentType, cfAllowAttach, cfAttachMaxCount,
      showBbmModal, onBbmSelect, handleSave, cfSiteNm, cfDtlMode,
    };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ cfIsNew ? '게시글 등록' : (cfDtlMode ? '게시글 상세' : '게시글 수정') }}</div><span v-if="!cfIsNew" style="font-size:12px;color:#999;">#{{ form.bbsId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ cfSiteNm }}</div>
      </div>
    </div>

    <!-- ── 게시판 선택 ─────────────────────────────────────────────────────── -->
    <div class="form-group">
      <label class="form-label">게시판 <span v-if="!cfDtlMode" class="req">*</span></label>
      <div style="display:flex;align-items:center;gap:8px;">
        <!-- ── 신규: 선택 버튼 ──────────────────────────────────────────────── -->
        <template v-if="cfIsNew && !cfDtlMode">
          <button class="btn btn-secondary btn-sm" type="button" @click="showBbmModal=true">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="showBbmDetail=true" title="게시판 상세보기">🔍</button>
        </template>
        <!-- ── 수정 또는 cfDtlMode: 변경 불가 ──────────────────────────────────── -->
        <template v-else>
          <button class="btn btn-secondary btn-sm" type="button" disabled style="opacity:.5;cursor:not-allowed;">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="showBbmDetail=true" title="게시판 상세보기">🔍</button>
        </template>

        <!-- ── 선택된 게시판 표시 ─────────────────────────────────────────────── -->
        <span v-if="selectedBbm" style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <b style="color:#1a1a2e;">{{ selectedBbm.bbmNm }}</b>
          <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:4px;">{{ selectedBbm.bbmCode }}</code>
          <span style="font-size:11px;color:#bbb;">ID: {{ selectedBbm.bbmId }}</span>
        </span>
        <span v-else style="font-size:12px;color:#bbb;">게시판을 선택해주세요.</span>
      </div>
      <span v-if="errors.bbmId" class="field-error">{{ errors.bbmId }}</span>
    </div>

    <!-- ── 기본 정보 ──────────────────────────────────────────────────────── -->
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span v-if="!cfDtlMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbsTitle" placeholder="게시글 제목" :readonly="cfDtlMode" :class="errors.bbsTitle ? 'is-invalid' : ''" />
        <span v-if="errors.bbsTitle" class="field-error">{{ errors.bbsTitle }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">작성자</label>
        <input class="form-control" v-model="form.authorNm" placeholder="작성자명" :readonly="cfDtlMode" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.bbsStatusCd" :disabled="cfDtlMode">
          <option v-for="c in codes.bbs_post_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
    </div>

    <!-- ── 내용 입력 (contentType 에 따라 렌더링) ───────────────────────────────── -->
    <div v-if="!selectedBbm" class="form-group">
      <label class="form-label">내용</label>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">게시판을 먼저 선택하세요.</div>
    </div>
    <div v-else-if="cfContentType==='불가'" class="form-group">
      <label class="form-label">내용</label>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">이 게시판은 내용 입력을 지원하지 않습니다.</div>
    </div>
    <div v-else-if="cfContentType==='textarea'" class="form-group">
      <label class="form-label">내용</label>
      <textarea class="form-control" v-model="form.contentHtml" rows="8" placeholder="게시글 내용을 입력하세요." :readonly="cfDtlMode"></textarea>
    </div>
    <div v-else-if="cfContentType==='htmleditor'" class="form-group">
      <label class="form-label">내용</label>
      <div v-if="cfDtlMode" class="form-control" style="min-height:300px;line-height:1.6;" v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
      <base-html-editor v-else v-model="form.contentHtml" height="320px" />
    </div>

    <!-- ── 첨부파일 ───────────────────────────────────────────────────────── -->
    <div v-if="selectedBbm && cfAttachMaxCount > 0" class="form-group">
      <label class="form-label">
        첨부파일
        <span style="font-size:11px;font-weight:400;color:#bbb;margin-left:4px;">({{ cfAllowAttach }})</span>
        <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">첨부그룹ID: {{ form.attachGrpId }}</span>
      </label>
      <base-attach-grp
        :model-value="form.attachGrpId"
        @update:model-value="form.attachGrpId = $event" :ref-id="dtlId ? 'BBS-'+dtlId : ''"
        :show-toast="showToast"
        grp-code="BBS_ATTACH"
        grp-name="게시글 첨부파일"
        :max-count="cfAttachMaxCount"
        :max-size-mb="10"
        allow-ext="*"
      />
    </div>
    <div v-else-if="selectedBbm && cfAllowAttach==='불가'" class="form-group">
      <label class="form-label">첨부파일</label>
      <div style="color:#bbb;font-size:13px;padding:4px 0;">이 게시판은 첨부파일을 지원하지 않습니다.</div>
    </div>

    <div class="form-actions" v-if="!cfDtlMode">
      <template v-if="cfDtlMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBbsMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="handleSave">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBbsMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- ── 게시판 선택 팝업 ────────────────────────────────────────────────────── -->
  <bbm-select-modal
    v-if="showBbmModal" @select="onBbmSelect"
    @close="showBbmModal=false"
  />

  <!-- ── 게시판 상세보기 팝업 ──────────────────────────────────────────────────── -->
  <div v-if="showBbmDetail && selectedBbm" class="modal-overlay" @click.self="showBbmDetail=false">
    <div class="modal-box" style="max-width:420px;">
      <div class="modal-header">
        <span class="modal-title">게시판 상세</span>
        <span class="modal-close" @click="showBbmDetail=false">✕</span>
      </div>
      <div class="detail-row"><span class="detail-label">게시판ID</span><span class="detail-value">{{ selectedBbm.bbmId }}</span></div>
      <div class="detail-row"><span class="detail-label">게시판코드</span><span class="detail-value"><code style="font-size:12px;">{{ selectedBbm.bbmCode }}</code></span></div>
      <div class="detail-row"><span class="detail-label">게시판명</span><span class="detail-value">{{ selectedBbm.bbmNm }}</span></div>
      <div class="detail-row"><span class="detail-label">유형</span><span class="detail-value">{{ selectedBbm.bbmType }}</span></div>
      <div class="detail-row"><span class="detail-label">댓글허용</span><span class="detail-value">{{ selectedBbm.allowComment }}</span></div>
      <div class="detail-row"><span class="detail-label">첨부허용</span><span class="detail-value">{{ selectedBbm.allowAttach }}</span></div>
      <div class="detail-row"><span class="detail-label">내용입력</span><span class="detail-value">{{ selectedBbm.contentTypeCd }}</span></div>
      <div class="detail-row"><span class="detail-label">공개범위</span><span class="detail-value">{{ selectedBbm.scopeType }}</span></div>
      <div class="detail-row"><span class="detail-label">좋아요허용</span><span class="detail-value">{{ selectedBbm.allowLike==='Y'?'허용':'불가' }}</span></div>
      <div class="detail-row"><span class="detail-label">사용여부</span><span class="detail-value">{{ selectedBbm.useYn==='Y'?'사용':'미사용' }}</span></div>
      <div style="margin-top:16px;text-align:right;">
        <button class="btn btn-secondary" @click="showBbmDetail=false">닫기</button>
      </div>
    </div>
  </div>
</div>
`
};
