/* ==========================================================================
 * TuiHtmlEditor — Toast UI Editor 래퍼 컴포넌트
 * 공통 HTML 에디터.
 *  - v-model 양방향 바인딩 (modelValue ↔ form 필드)
 *  - 디자인/HTML 소스 모드 토글
 *  - 이미지 URL/업로드/클립보드 붙여넣기/드래그앤드롭 (Base64 자동 인라인)
 *  - 한국어 IME, 한글 UI
 *
 * 사용 예:
 *   <tui-html-editor v-model="form.content" />
 *   <tui-html-editor :model-value="form.content" @update:model-value="v => form.content = v" />
 * ========================================================================== */
window.TuiHtmlEditor = {
  name: 'TuiHtmlEditor',
  props: {
    modelValue: { type: String, default: '' },
    height:     { type: String, default: '320px' },
    showSourceToggle: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { ref, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

    const editorEl = ref(null);
    const mode = ref('wysiwyg');  /* 'wysiwyg' | 'source' */
    let inst = null;
    let syncing = false;

    /* _dispose */
    const _dispose = () => {
      if (inst) { try { inst.destroy(); } catch (_) {} inst = null; }
    };

    /* _init */
    const _init = () => {
      if (inst) return;
      const el = editorEl.value;
      if (!el) return;
      const Editor = (window.toastui && window.toastui.Editor) || window.Editor;
      if (!Editor) { console.warn('[TuiHtmlEditor] Toast UI Editor library not loaded'); return; }
      inst = new Editor({
        el,
        height: props.height,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        hideModeSwitch: true,
        language: 'ko-KR',
        usageStatistics: false,
        initialValue: props.modelValue || '',
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
        ],
        hooks: {
          /* 이미지 업로드: Base64 인라인 (서버 업로드 없이 즉시 미리보기) */
          addImageBlobHook: (blob, callback) => {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result, blob.name || 'image');
            reader.readAsDataURL(blob);
          },
        },
      });
      inst.on('change', () => {
        if (syncing) return;
        try { emit('update:modelValue', inst.getHTML()); } catch (_) {}
      });
    };

    /* _syncFromProp */
    const _syncFromProp = () => {
      if (!inst) return;

      /* cur */
      const cur = (() => { try { return inst.getHTML(); } catch (_) { return ''; } })();
      const next = props.modelValue || '';
      if (cur === next) return;
      syncing = true;
      try { inst.setHTML(next, false); }
      finally { setTimeout(() => { syncing = false; }, 30); }
    };

    onMounted(async () => {
      await nextTick();
      _init();
    });

    onBeforeUnmount(() => { _dispose(); });

    /* prop 변경 시 동기화 */
    watch(() => props.modelValue, () => {
      if (mode.value === 'wysiwyg' && inst) _syncFromProp();
    });

    /* 모드 토글 시 인스턴스 재정비 */
    watch(mode, async (m) => {
      if (m === 'wysiwyg') {
        await nextTick();
        if (!inst) _init();
        else _syncFromProp();
      }
    });

    /* onSourceInput */
    const onSourceInput = (e) => {
      emit('update:modelValue', e.target.value);
    };

    return { editorEl, mode, onSourceInput };
  },
  template: /* html */`
<div>
  <div v-if="showSourceToggle" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <div style="display:flex;gap:4px;">
      <button type="button" @click="mode = 'wysiwyg'"
        :style="mode === 'wysiwyg' ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;' : 'background:#fff;color:#555;border-color:#d0d0d0;'"
        style="font-size:11px;padding:3px 12px;border:1px solid;border-radius:4px;cursor:pointer;transition:all .15s;">디자인</button>
      <button type="button" @click="mode = 'source'"
        :style="mode === 'source' ? 'background:#1e1e2e;color:#7ec8e3;border-color:#7ec8e3;' : 'background:#fff;color:#555;border-color:#d0d0d0;'"
        style="font-size:11px;padding:3px 12px;border:1px solid;border-radius:4px;cursor:pointer;font-family:monospace;transition:all .15s;">&lt;/&gt; HTML</button>
    </div>
    <button type="button" @click="$emit('update:modelValue', '')"
      style="font-size:11px;padding:3px 10px;border:1px solid #fca5a5;background:#fff0f0;color:#dc2626;border-radius:4px;cursor:pointer;">비우기</button>
  </div>
  <div v-show="mode === 'wysiwyg'" ref="editorEl" style="background:#fff;border-radius:6px;"></div>
  <textarea v-show="mode === 'source'" :value="modelValue" @input="onSourceInput"
    spellcheck="false"
    :style="{ width:'100%', minHeight: height, padding:'12px 14px', border:'1px solid #d9d9d9', borderRadius:'6px', fontFamily:\"'Consolas','D2Coding',monospace\", fontSize:'12px', lineHeight:'1.7', color:'#333', resize:'vertical', boxSizing:'border-box', margin:0, background:'#fafafa', outline:'none' }"></textarea>
</div>
`
};
