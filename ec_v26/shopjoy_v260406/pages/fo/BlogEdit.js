/* ShopJoy - BlogEdit (블로그 작성/수정) */
window.BlogEdit = {
  name: 'BlogEdit',
  props: {
    navigate:  { type: Function, required: true },        // 페이지 이동
    dtlId:    { type: String,   default: null },          // 대상 ID
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, computed, reactive, onMounted, watch } = Vue;
    const showToast            = window.foApp.showToast;  // 토스트 알림

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const cfIsEdit = computed(() => !!props.dtlId);
    const form = reactive({
      title: '',
      category: 'fashion',
      excerpt: '',
      body: '',
      tags: '',
    });
    const errors = reactive({});

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BlogEdit.js : handleBtnAction -> ', cmd, param);
      // 저장 / 수정
      if (cmd === 'form-save') {
        return handleSave();
      // 취소 — 블로그 목록 이동
      } else if (cmd === 'form-cancel') {
        return cancel();
      // 이미지 추가
      } else if (cmd === 'form-addImage') {
        return addImage();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BlogEdit.js : handleSelectAction -> ', cmd, param);
      // 이미지 행 삭제 (param: imageId)
      if (cmd === 'form-rowRemoveImage') {
        return removeImage(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const categories = [
      { id: 'fashion', name: '패션' },
      { id: 'lifestyle', name: '라이프스타일' },
      { id: 'trend', name: '트렌드' },
      { id: 'howto', name: '스타일링 팁' },
    ];

    /* FoFormArea columns 정의 */
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // --- [컬럼 정의] ---
    const baseFormColumns = [
      { key: 'title',    label: '제목',     type: 'text',     required: true, colSpan: 2,
        placeholder: '제목을 입력하세요' },
      { type: 'rowBreak' },
      { key: 'category', label: '카테고리', type: 'select',   colSpan: 2,
        nullable: false,
        options: () => categories.map(c => ({ value: c.id, label: c.name })) },
      { type: 'rowBreak' },
      { key: 'excerpt',  label: '요약',     type: 'text',     colSpan: 2,
        placeholder: '한 줄 요약' },
      { type: 'rowBreak' },
      { key: 'body',     label: '본문',     type: 'textarea', required: true, colSpan: 2,
        rows: 14, placeholder: '본문을 입력하세요...' },
    ];

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async (searchType = 'DEFAULT') => {
      if (!cfIsEdit.value) { return; }
      try {
        const res = await foApiSvc.cmBltn.getById(props.dtlId, '블로그편집', '상세조회');
        Object.assign(form, res.data?.data || {});
      } catch (e) {
        Object.assign(form, {
          title: '2026 봄 트렌드 컬러 가이드',
          category: 'trend',
          excerpt: '올 봄 주목해야 할 트렌드 컬러와 컬러 매칭 방법을 알아봅니다.',
          body: '올 봄 주목해야 할 트렌드 컬러는 파스텔 라벤더, 소프트 민트, 코랄 핑크입니다.\n\n파스텔 컬러는 부드러운 분위기를 연출하면서도 세련된 느낌을 줍니다.',
          tags: '트렌드, 컬러, 2026SS',
        });
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* handleSave — 저장 */
    const handleSave = () => {
      if (!form.title.trim()) { showToast?.('제목을 입력해주세요.', 'error'); return; }
      if (!form.body.trim()) { showToast?.('본문을 입력해주세요.', 'error'); return; }
      showToast?.(cfIsEdit.value ? '수정되었습니다.' : '등록되었습니다.', 'success');
      props.navigate('blog');
    };

    /* cancel — 취소 */
    const cancel = () => props.navigate('blog');

    /* 이미지 첨부 (목업) */
    const images = reactive([]);

    /* addImage — 추가 */
    const addImage = () => {
      images.push({ id: Date.now(), name: 'image_' + (images.length + 1) + '.jpg', size: '1.2 MB' });
    };

    /* removeImage — 제거 */
    const removeImage = (id) => { const idx = images.findIndex(img => img.id === id); if (idx !== -1) images.splice(idx, 1); };

    onMounted(() => {
      handleSearchDetail();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes,                                                  // 상태
      handleBtnAction, handleSelectAction,                             // dispatch
      cfIsEdit, form, errors, baseFormColumns,                         // 폼
      categories, images,                                              // 데이터
      handleSave, cancel, addImage, removeImage,                       // 이벤트 (호환)
    };
  },
  template: /* html */ `
<div class="page-wrap" style="max-width:760px;">
  <!-- ===== ■. 헤더 ====================================================== -->
  <div style="margin-bottom:28px;">
    <button @click="handleBtnAction('form-cancel')"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:16px;padding:0;">
      ← 블로그 목록으로
    </button>
    <h1 style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">
      {{ cfIsEdit ? '글 수정' : '새 글 작성' }}
    </h1>
  </div>
  <!-- ===== □. 헤더 ====================================================== -->
  <!-- ===== ■. 폼 ======================================================= -->
  <div class="card" style="padding:clamp(16px,3vw,28px);">
    <!-- ===== ■.■. 제목 / 카테고리 / 요약 / 본문 =================================== -->
    <fo-form-area :columns="baseFormColumns" :form="form" :errors="errors" :cols="2" />
    <!-- ===== ■.■. 이미지 첨부 ================================================ -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
        이미지 첨부
      </label>
      <button @click="handleBtnAction('form-addImage')" class="btn-outline" style="padding:8px 16px;font-size:0.82rem;margin-bottom:10px;">
        + 이미지 추가
      </button>
      <div v-for="img in images" :key="img.id"
        style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-base);border-radius:6px;margin-bottom:6px;border:1px solid var(--border);">
        <span style="font-size:0.82rem;color:var(--text-secondary);flex:1;">
          📎 {{ img.name }} ({{ img.size }})
        </span>
        <button @click="handleSelectAction('form-rowRemoveImage', img.id)"
          style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:0.78rem;font-weight:600;">
          삭제
        </button>
      </div>
    </div>
    <!-- ===== □.□. 이미지 첨부 ================================================ -->
    <!-- ===== ■.■. 태그 ==================================================== -->
    <div style="margin-bottom:28px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">
        태그 (쉼표로 구분)
      </label>
      <input v-model="form.tags" type="text" placeholder="패션, 트렌드, 2026SS"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
      <div v-if="form.tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
        <span v-for="tag in form.tags.split(',').map(s=>s.trim()).filter(Boolean)" :key="tag"
          style="padding:3px 10px;background:var(--blue-dim);color:var(--blue);border-radius:20px;font-size:0.72rem;font-weight:600;">
          #{{ tag }}
        </span>
      </div>
    </div>
    <!-- ===== □.□. 태그 ==================================================== -->
    <!-- ===== ■.■. 버튼 ==================================================== -->
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn-outline" @click="handleBtnAction('form-cancel')" style="padding:11px 28px;font-size:0.88rem;">
        취소
      </button>
      <button class="btn-blue" @click="handleBtnAction('form-save')" style="padding:11px 28px;font-size:0.88rem;">
        {{ cfIsEdit ? '수정' : '등록' }}
      </button>
    </div>
  </div>
</div>
<!-- ===== □.□. 버튼 ==================================================== -->
<!-- ===== □. 폼 ======================================================= -->
`
};
