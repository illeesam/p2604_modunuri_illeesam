/* ShopJoy Admin - 게시글관리 상세/등록 */
window.SyBbsDtl = {
  name: 'SyBbsDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    /* ── 선택된 게시판 정보 ── */
    const selectedBbm = ref(null);

    /* ── 폼 ── */
    const form = reactive({
      bbsId: null, bbmId: null, title: '', authorNm: '', statusCd: '게시',
      attachGrpId: null, contentHtml: '', viewCount: 0, commentCount: 0,
    });
    const errors = reactive({});

    const schema = yup.object({
      bbmId: yup.number().required('게시판을 선택해주세요.').min(1, '게시판을 선택해주세요.'),
      title: yup.string().required('제목을 입력해주세요.'),
    });

    /* ── 게시판 선택 팝업 ── */
    const showBbmModal  = ref(false);
    const showBbmDetail = ref(false);   // 상세보기 팝업

    const onBbmSelect = (b) => {
      showBbmModal.value = false;
      if (selectedBbm.value && selectedBbm.value.bbmId === b.bbmId) return;
      selectedBbm.value = b;
      form.bbmId = b.bbmId;
      /* 게시판 변경 시 레이아웃 초기화 */
      form.title       = '';
      form.authorNm      = '';
      form.statusCd    = '게시';
      form.attachGrpId = null;
      form.contentHtml = '';
      /* Quill 내용 초기화 */
      if (quill) quill.root.innerHTML = '';
    };

    /* ── Quill 에디터 ── */
    let quill = null;
    const initQuill = () => {
      if (typeof Quill === 'undefined') return;
      if (quill) return;
      quill = new Quill('#bbs-editor', { theme: 'snow', placeholder: '게시글 내용을 입력하세요.' });
      if (form.contentHtml) quill.root.innerHTML = form.contentHtml;
      quill.on('text-change', () => { form.contentHtml = quill.root.innerHTML; });
    };

    /* 게시판 contentType 에 따른 내용 입력 방식 */
    const contentType = computed(() => selectedBbm.value?.contentType || 'textarea');
    const allowAttach = computed(() => selectedBbm.value?.allowAttach || '불가');

    /* ── 초기화 ── */
    onMounted(() => {
      if (!isNew.value) {
        const b = props.adminData.bbss.find(x => x.bbsId === props.editId);
        if (b) {
          Object.assign(form, { ...b });
          selectedBbm.value = props.adminData.bbms.find(m => m.bbmId === b.bbmId) || null;
        }
      }
      /* htmleditor 초기화는 selectedBbm 결정 후 — viewMode 일 때는 초기화 불필요 */
      if (!props.viewMode && contentType.value === 'htmleditor') {
        Vue.nextTick(() => { initQuill(); });
      }
    });

    /* contentType 변화 감지 → Quill 초기화 */
    const { watch, nextTick } = Vue;
    watch(contentType, (val) => {
      if (!props.viewMode && val === 'htmleditor') {
        nextTick(() => { initQuill(); });
      } else {
        quill = null;
      }
    });

    onBeforeUnmount(() => { quill = null; });

    /* ── 첨부 허용 개수 ── */
    const attachMaxCount = computed(() => {
      const map = { '불가': 0, '1개': 1, '2개': 2, '3개': 3, '목록': 10 };
      return map[allowAttach.value] ?? 0;
    });

    /* ── 저장 ── */
    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) {
        props.adminData.bbss.unshift({ ...form, bbmId: Number(form.bbmId), bbsId: props.adminData.nextId(props.adminData.bbss, 'bbsId'), viewCount: 0, commentCount: 0, regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = props.adminData.bbss.findIndex(x => x.bbsId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.bbss[idx], { ...form, bbmId: Number(form.bbmId) });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`bbs/${form.bbsId}`, { ...form }) : window.adminApi.put(`bbs/${form.bbsId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syBbsMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return {
      isNew, form, errors, selectedBbm, contentType, allowAttach, attachMaxCount,
      showBbmModal, showBbmDetail, onBbmSelect, save, siteNm,
    };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '게시글 등록' : (viewMode ? '게시글 상세' : '게시글 수정') }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.bbsId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>

    <!-- 게시판 선택 -->
    <div class="form-group">
      <label class="form-label">게시판 <span v-if="!viewMode" class="req">*</span></label>
      <div style="display:flex;align-items:center;gap:8px;">
        <!-- 신규: 선택 버튼 -->
        <template v-if="isNew && !viewMode">
          <button class="btn btn-secondary btn-sm" type="button" @click="showBbmModal=true">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="showBbmDetail=true" title="게시판 상세보기">🔍</button>
        </template>
        <!-- 수정 또는 viewMode: 변경 불가 -->
        <template v-else>
          <button class="btn btn-secondary btn-sm" type="button" disabled style="opacity:.5;cursor:not-allowed;">📋 게시판 선택</button>
          <button v-if="selectedBbm" class="btn btn-blue btn-sm" type="button" @click="showBbmDetail=true" title="게시판 상세보기">🔍</button>
        </template>

        <!-- 선택된 게시판 표시 -->
        <span v-if="selectedBbm" style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <b style="color:#1a1a2e;">{{ selectedBbm.bbmNm }}</b>
          <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:4px;">{{ selectedBbm.bbmCode }}</code>
          <span style="font-size:11px;color:#bbb;">ID: {{ selectedBbm.bbmId }}</span>
        </span>
        <span v-else style="font-size:12px;color:#bbb;">게시판을 선택해주세요.</span>
      </div>
      <span v-if="errors.bbmId" class="field-error">{{ errors.bbmId }}</span>
    </div>

    <!-- 기본 정보 -->
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="게시글 제목" :readonly="viewMode" :class="errors.title ? 'is-invalid' : ''" />
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">작성자</label>
        <input class="form-control" v-model="form.authorNm" placeholder="작성자명" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>게시</option><option>임시</option><option>비공개</option><option>삭제</option>
        </select>
      </div>
    </div>

    <!-- 내용 입력 (contentType 에 따라 렌더링) -->
    <div v-if="!selectedBbm" class="form-group">
      <label class="form-label">내용</label>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">게시판을 먼저 선택하세요.</div>
    </div>
    <div v-else-if="contentType==='불가'" class="form-group">
      <label class="form-label">내용</label>
      <div style="color:#bbb;font-size:13px;padding:12px 0;">이 게시판은 내용 입력을 지원하지 않습니다.</div>
    </div>
    <div v-else-if="contentType==='textarea'" class="form-group">
      <label class="form-label">내용</label>
      <textarea class="form-control" v-model="form.contentHtml" rows="8" placeholder="게시글 내용을 입력하세요." :readonly="viewMode"></textarea>
    </div>
    <div v-else-if="contentType==='htmleditor'" class="form-group">
      <label class="form-label">내용</label>
      <div v-if="viewMode" class="form-control" style="min-height:300px;line-height:1.6;" v-html="form.contentHtml || '<span style=color:#bbb>-</span>'"></div>
      <div v-else id="bbs-editor" style="min-height:300px;background:#fff;"></div>
    </div>

    <!-- 첨부파일 -->
    <div v-if="selectedBbm && attachMaxCount > 0" class="form-group">
      <label class="form-label">
        첨부파일
        <span style="font-size:11px;font-weight:400;color:#bbb;margin-left:4px;">({{ allowAttach }})</span>
        <span v-if="form.attachGrpId" style="font-size:11px;font-weight:400;color:#aaa;margin-left:6px;">첨부그룹ID: {{ form.attachGrpId }}</span>
      </label>
      <base-attach-grp
        :model-value="form.attachGrpId"
        @update:model-value="form.attachGrpId = $event"
        :admin-data="adminData"
        :ref-id="editId ? 'BBS-'+editId : ''"
        :show-toast="showToast"
        grp-code="BBS_ATTACH"
        grp-name="게시글 첨부파일"
        :max-count="attachMaxCount"
        :max-size-mb="10"
        allow-ext="*"
      />
    </div>
    <div v-else-if="selectedBbm && allowAttach==='불가'" class="form-group">
      <label class="form-label">첨부파일</label>
      <div style="color:#bbb;font-size:13px;padding:4px 0;">이 게시판은 첨부파일을 지원하지 않습니다.</div>
    </div>

    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBbsMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBbsMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- 게시판 선택 팝업 -->
  <bbm-select-modal
    v-if="showBbmModal"
    :disp-dataset="adminData"
    @select="onBbmSelect"
    @close="showBbmModal=false"
  />

  <!-- 게시판 상세보기 팝업 -->
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
      <div class="detail-row"><span class="detail-label">내용입력</span><span class="detail-value">{{ selectedBbm.contentType }}</span></div>
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
