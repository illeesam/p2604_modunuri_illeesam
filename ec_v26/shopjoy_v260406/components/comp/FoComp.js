/**
 * FoComp.js — 사용자(Front Office) 공통 UI 컴포넌트
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 정의된 컴포넌트:
 *   FoTabBar — Dtl/My 화면 공통 탭바 + 뷰모드 아이콘 그룹 (BoTabBar 와 동일 마크업)
 *
 * FO 개별 위젯/영역 컴포넌트는 components/comp/FoAreaComp.js 에 정의됨
 *   (FoSearchArea / FoGrid / FoGridCrud / FoModal).
 * FO 전용 단위 컴포넌트가 새로 필요하면 'Fo' prefix / 'fo-' 태그로 이 파일에 추가.
 * ───────────────────────────────────────────────────────────────────────── */

/* ── FoTabBar ────────────────────────────────────────────────────────────
 * FO Dtl/My 화면 공통 탭바 + 뷰모드(📑/1▭/2▭/3▭/4▭) 아이콘 그룹.
 *
 * Props:
 *   tabs      (Array<{id, label, icon?, count?}>)  탭 정의 (필수)
 *   tab       (String)   현재 선택된 탭 id
 *   tabMode   (String)   'tab' | '1col' | '2col' | '3col' | '4col' (기본 'tab')
 *   showModes (Boolean)  뷰모드 아이콘 그룹 노출 여부 (기본 false — FO 는 보통 탭만 사용)
 *
 * Emits:
 *   tab-select(id)       탭 클릭
 *   mode-select(mode)    뷰모드 클릭
 *
 * 사용:
 *   <fo-tab-bar :tabs="cfTabs" :tab="tab"
 *     @tab-select="id => handleBtnAction('tab-select', id)" />
 * ───────────────────────────────────────────────────────────────────────── */
window.FoTabBar = {
  name: 'FoTabBar',
  props: {
    tabs:      { type: Array,   default: () => [] },
    tab:       { type: String,  default: '' },
    tabMode:   { type: String,  default: 'tab' },
    showModes: { type: Boolean, default: false },
  },
  emits: ['tab-select', 'mode-select'],
  setup(props, { emit }) {
    const VIEW_MODES = [
      { id: 'tab',  label: '탭',  icon: '📑' },
      { id: '1col', label: '1열', icon: '1▭' },
      { id: '2col', label: '2열', icon: '2▭' },
      { id: '3col', label: '3열', icon: '3▭' },
      { id: '4col', label: '4열', icon: '4▭' },
    ];
    const onTab  = (id) => { if (props.tabMode === 'tab') emit('tab-select', id); };
    const onMode = (id) => emit('mode-select', id);
    const isTabMode = () => props.tabMode === 'tab';
    return { VIEW_MODES, onTab, onMode, isTabMode };
  },
  template: /* html */`
<div style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
  <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
    <template v-for="t in tabs" :key="t?.id">
      <button v-if="t.visible===undefined || t.visible" @click="onTab(t.id)" :disabled="!isTabMode()"
        :style="{
          flex:1, padding:'11px 12px', border:'none', cursor: isTabMode() ? 'pointer' : 'default',
          fontSize:'12.5px', borderRadius:'9px', transition:'all .18s',
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
          opacity: isTabMode() ? 1 : 0.55,
          fontWeight: tab===t.id ? 800 : 600,
          background: (isTabMode() && tab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color:      (isTabMode() && tab===t.id) ? '#e8587a' : '#666',
          boxShadow:  (isTabMode() && tab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none',
          borderBottom: (isTabMode() && tab===t.id) ? '2px solid #e8587a' : '2px solid transparent'
        }">
        <span v-if="t.icon" style="font-size:14px;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" :style="{
          fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px',
          background: (isTabMode() && tab===t.id) ? '#e8587a' : '#e5e7eb',
          color:      (isTabMode() && tab===t.id) ? '#fff' : '#666',
          minWidth:'18px', textAlign:'center'
        }">{{ t.count }}</span>
      </button>
    </template>
  </div>
  <div v-if="showModes" style="display:flex;gap:3px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
    <button v-for="v in VIEW_MODES" :key="v?.id" @click="onMode(v.id)" :title="v.label+'로 보기'"
      :style="{
        padding:'8px 12px', border:'none', cursor:'pointer', fontSize:'13px', borderRadius:'8px',
        fontWeight:  tabMode===v.id ? 800 : 600,
        background:  tabMode===v.id ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
        color:       tabMode===v.id ? '#e8587a' : '#888',
        boxShadow:   tabMode===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none'
      }">
      <span style="font-size:15px;">{{ v.icon }}</span>
    </button>
  </div>
</div>
`,
};
