/* ShopJoy - BlogEdit (블로그 작성/수정) */
window.BlogEdit = {
  name: 'BlogEdit',
  props: ['navigate', 'config', 'editId', 'showToast'],
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const isEdit = computed(() => !!props.editId);
    const form = ref({
      title: '',
      category: 'fashion',
      excerpt: '',
      body: '',
      tags: '',
    });

    const categories = [
      { id: 'fashion', name: '패션' },
      { id: 'lifestyle', name: '라이프스타일' },
      { id: 'trend', name: '트렌드' },
      { id: 'howto', name: '스타일링 팁' },
    ];

    /* 수정 모드: 기존 데이터 로드 */
    onMounted(() => {
      if (isEdit.value) {
        // 목업: editId에 따른 데이터 로드
        form.value = {
          title: '2026 봄 트렌드 컬러 가이드',
          category: 'trend',
          excerpt: '올 봄 주목해야 할 트렌드 컬러와 컬러 매칭 방법을 알아봅니다.',
          body: '올 봄 주목해야 할 트렌드 컬러는 파스텔 라벤더, 소프트 민트, 코랄 핑크입니다.\n\n파스텔 컬러는 부드러운 분위기를 연출하면서도 세련된 느낌을 줍니다.',
          tags: '트렌드, 컬러, 2026SS',
        };
      }
    });

    const save = () => {
      if (!form.value.title.trim()) { props.showToast?.('제목을 입력해주세요.', 'error'); return; }
      if (!form.value.body.trim()) { props.showToast?.('본문을 입력해주세요.', 'error'); return; }
      props.showToast?.(isEdit.value ? '수정되었습니다.' : '등록되었습니다.', 'success');
      props.navigate('blog');
    };

    const cancel = () => props.navigate('blog');

    /* 이미지 첨부 (목업) */
    const images = reactive([]);
    const addImage = () => {
      images.push({ id: Date.now(), name: 'image_' + (images.length + 1) + '.jpg', size: '1.2 MB' });
    };
    const removeImage = (id) => { const idx = images.findIndex(img => img.id === id); if (idx !== -1) images.splice(idx, 1); };

    return { isEdit, form, categories, images, save, cancel, addImage, removeImage };
  },
  template: /* html */ `
<div class="page-wrap" style="max-width:760px;">

  <!-- 헤더 -->
  <div style="margin-bottom:28px;">
    <button @click="cancel"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:16px;padding:0;">
      ← 블로그 목록으로
    </button>
    <h1 style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">{{ isEdit ? '글 수정' : '새 글 작성' }}</h1>
  </div>

  <!-- 폼 -->
  <div class="card" style="padding:clamp(16px,3vw,28px);">

    <!-- 제목 -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">제목 <span style="color:#ef4444;">*</span></label>
      <input v-model="form.title" type="text" placeholder="제목을 입력하세요"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.92rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
    </div>

    <!-- 카테고리 -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">카테고리</label>
      <select v-model="form.category"
        style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);">
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </div>

    <!-- 요약 -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">요약</label>
      <input v-model="form.excerpt" type="text" placeholder="한 줄 요약"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
    </div>

    <!-- 본문 -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">본문 <span style="color:#ef4444;">*</span></label>
      <textarea v-model="form.body" rows="14" placeholder="본문을 입력하세요..."
        style="width:100%;padding:14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);resize:vertical;line-height:1.8;"></textarea>
    </div>

    <!-- 이미지 첨부 -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">이미지 첨부</label>
      <button @click="addImage" class="btn-outline" style="padding:8px 16px;font-size:0.82rem;margin-bottom:10px;">+ 이미지 추가</button>
      <div v-for="img in images" :key="img.id"
        style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-base);border-radius:6px;margin-bottom:6px;border:1px solid var(--border);">
        <span style="font-size:0.82rem;color:var(--text-secondary);flex:1;">📎 {{ img.name }} ({{ img.size }})</span>
        <button @click="removeImage(img.id)"
          style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:0.78rem;font-weight:600;">삭제</button>
      </div>
    </div>

    <!-- 태그 -->
    <div style="margin-bottom:28px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">태그 (쉼표로 구분)</label>
      <input v-model="form.tags" type="text" placeholder="패션, 트렌드, 2026SS"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
      <div v-if="form.tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
        <span v-for="tag in form.tags.split(',').map(s=>s.trim()).filter(Boolean)" :key="tag"
          style="padding:3px 10px;background:var(--blue-dim);color:var(--blue);border-radius:20px;font-size:0.72rem;font-weight:600;">#{{ tag }}</span>
      </div>
    </div>

    <!-- 버튼 -->
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn-outline" @click="cancel" style="padding:11px 28px;font-size:0.88rem;">취소</button>
      <button class="btn-blue" @click="save" style="padding:11px 28px;font-size:0.88rem;">{{ isEdit ? '수정' : '등록' }}</button>
    </div>
  </div>

</div>
  `
};
