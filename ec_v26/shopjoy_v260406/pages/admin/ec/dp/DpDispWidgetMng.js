/* ShopJoy Admin - 전시위젯 목록 (UI용 배치 위젯) */
window.DpDispWidgetMng = {
  name: 'DpDispWidgetMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { ref, reactive, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const WIDGET_TYPES = [
      { value: 'image_banner',   label: '이미지 배너' },
      { value: 'product_slider', label: '상품 슬라이더' },
      { value: 'product',        label: '상품' },
      { value: 'cond_product',   label: '조건상품' },
      { value: 'chart_bar',      label: '차트 (Bar)' },
      { value: 'chart_line',     label: '차트 (Line)' },
      { value: 'chart_pie',      label: '차트 (Pie)' },
      { value: 'text_banner',    label: '텍스트 배너' },
      { value: 'info_card',      label: '정보 카드' },
      { value: 'popup',          label: '팝업' },
      { value: 'file',           label: '파일' },
      { value: 'file_list',      label: '파일목록' },
      { value: 'coupon',         label: '쿠폰' },
      { value: 'html_editor',    label: 'HTML 에디터' },
      { value: 'textarea',       label: '텍스트 영역' },
      { value: 'markdown',       label: 'Markdown' },
      { value: 'barcode',         label: '바코드' },
      { value: 'qrcode',          label: 'QR코드' },
      { value: 'barcode_qrcode',  label: '바코드+QR' },
      { value: 'video_player',    label: '동영상 플레이어' },
      { value: 'countdown',       label: '카운트다운 타이머' },
      { value: 'payment_widget',  label: '결제위젯' },
      { value: 'approval_widget', label: '전자결재' },
      { value: 'map_widget',      label: '지도맵' },
      { value: 'event_banner',    label: '이벤트' },
      { value: 'cache_banner',   label: '캐쉬' },
      { value: 'widget_embed',   label: '위젯' },
    ];
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',    'textarea':'📋',
      'markdown':'📑',       'barcode':'🔖',           'qrcode':'📱',
      'barcode_qrcode':'🔖', 'video_player':'▶️',      'countdown':'⏱',
      'payment_widget':'💳', 'approval_widget':'✅',   'map_widget':'🗺',
    };
    const wTypeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* ── 검색 ── */
    const searchKw     = ref('');
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const applied = reactive({ kw: '', type: '', status: '' });
    const doSearch = () => {
      applied.kw     = searchKw.value.trim().toLowerCase();
      applied.type   = searchType.value;
      applied.status = searchStatus.value;
      pager.page = 1;
    };
    const doReset = () => {
      searchKw.value = ''; searchType.value = ''; searchStatus.value = '';
      Object.assign(applied, { kw: '', type: '', status: '' });
      pager.page = 1;
    };

    /* 검색 필터만 적용한 리스트 (트리 그룹화용) */
    const searchedLibs = computed(() =>
      (props.dispDataset.widgetLibs || []).filter(d => {
        if (applied.kw && !d.name.toLowerCase().includes(applied.kw) && !(d.desc||'').toLowerCase().includes(applied.kw) && !(d.tags||'').toLowerCase().includes(applied.kw)) return false;
        if (applied.type   && d.widgetType !== applied.type)   return false;
        if (applied.status && d.status     !== applied.status) return false;
        return true;
      })
    );

    /* ── 표시경로 ── */
    const selectedTreeKey = ref('');   /* '' = 전체, 'top' or 'top>sub' */
    const tree = computed(() => {
      const map = {};
      const addToPath = (lib, pathStr) => {
        const parts = pathStr.split('>').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0];
        const rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      searchedLibs.value.forEach(lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) addToPath(lib, '(미등록) > (미등록)');
        else lib.usedPaths.forEach(p => addToPath(lib, p));
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        count: Object.values(map[top]).reduce((n, arr) => n + arr.length, 0),
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          libs: map[top][sub],
          count: map[top][sub].length,
        })),
      }));
    });
    const openNodes = ref(new Set(['__root__']));
    const toggleNode = (key) => {
      if (openNodes.value.has(key)) openNodes.value.delete(key);
      else openNodes.value.add(key);
    };
    const isOpen = (key) => openNodes.value.has(key);
    const selectTree = (key) => { selectedTreeKey.value = selectedTreeKey.value === key ? '' : key; pager.page = 1; };
    const expandAll = () => {
      tree.value.forEach(n => { openNodes.value.add(n.label); });
    };
    const collapseAll = () => { openNodes.value.clear(); };

    /* 트리 선택까지 반영한 최종 리스트 */
    const filtered = computed(() => {
      const key = selectedTreeKey.value;
      let list = searchedLibs.value;
      if (key) {
        const [top, sub] = key.split('>').map(s => s.trim());
        list = list.filter(lib => {
          const paths = lib.usedPaths && lib.usedPaths.length
            ? lib.usedPaths
            : ['(미등록) > (미등록)'];
          return paths.some(p => {
            const parts = p.split('>').map(s => s.trim()).filter(Boolean);
            if (parts[0] !== top) return false;
            if (!sub) return true;
            const rest = parts.slice(1).join(' > ') || '(루트)';
            return rest === sub;
          });
        });
      }
      return [...list].sort((a, b) => b.libId - a.libId);
    });

    const totalCount  = computed(() => filtered.value.length);
    const pageList    = computed(() => {
      const s = (pager.page - 1) * pager.size;
      return filtered.value.slice(s, s + pager.size);
    });
    const totalPages  = computed(() => Math.max(1, Math.ceil(totalCount.value / pager.size)));
    const pageNumbers = computed(() => {
      const pages = []; const cur = pager.page; const tot = totalPages.value;
      for (let i = Math.max(1, cur - 2); i <= Math.min(tot, cur + 2); i++) pages.push(i);
      return pages;
    });

    /* ── 하단 인라인 Dtl ── */
    const selectedId = ref(null);
    const openMode   = ref('view');
    const loadDetail  = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew     = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const detailKey    = computed(() => `${selectedId.value}_${openMode.value}`);

    const doDelete = async (d) => {
      const ok = await props.showConfirm('삭제', `[${d.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const list = props.dispDataset.widgetLibs || [];
      const idx = list.findIndex(x => x.libId === d.libId);
      if (idx !== -1) list.splice(idx, 1);
      if (selectedId.value === d.libId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`widget-libs/${d.libId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetLibMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };

    /* 내용 요약 */
    const contentSummary = (d) => {
      if (d.widgetType === 'image_banner')   return d.imageUrl   ? d.imageUrl.split('/').pop().slice(0, 25)   : '-';
      if (d.widgetType === 'product_slider' || d.widgetType === 'product') return d.productIds ? '상품: ' + d.productIds.slice(0, 20) : '-';
      if (d.widgetType === 'text_banner')    return d.textContent ? d.textContent.replace(/<[^>]+>/g,'').slice(0, 25) + '…' : '-';
      if (d.widgetType === 'info_card')      return d.infoTitle  || '-';
      if (d.widgetType === 'coupon')         return d.couponCode || '-';
      if (d.widgetType === 'html_editor')    return d.htmlContent ? d.htmlContent.replace(/<[^>]+>/g,'').slice(0, 25) + '…' : '-';
      if (d.widgetType.startsWith('chart_')) return d.chartTitle || '-';
      if (d.widgetType === 'popup')          return d.popupWidth ? `${d.popupWidth}×${d.popupHeight}` : '-';
      if (d.widgetType === 'event_banner')   return d.eventId ? '이벤트#' + d.eventId : '-';
      if (d.widgetType === 'cache_banner')   return d.cacheDesc || '-';
      return '-';
    };

    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return {
      pathLabel,
      WIDGET_TYPES, wTypeLabel, wIcon, doDelete,
      searchKw, searchType, searchStatus, pager, PAGE_SIZES,
      filtered, totalCount, pageList, totalPages, pageNumbers,
      tree, openNodes, toggleNode, isOpen, selectedTreeKey, selectTree, expandAll, collapseAll,
      doSearch, doReset,
      selectedId, openMode, detailEditId, detailKey,
      siteNm,
      loadDetail, openNew, closeDetail, inlineNavigate,
      contentSummary, statusCls,
       setPage, onSizeChange,
    };;
  },
  template: /* html */`
<div>
  <div class="page-title">
    <span style="font-size:14px;font-weight:600;color:#333;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#999;margin:0 8px;">&gt;</span>
    <span style="font-size:14px;font-weight:600;color:#666;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#888;display:block;margin-top:4px;">위젯 유형별 리소스 등록·재활용</span>
  </div>

  <!-- 검색 필터 -->
  <div class="card" style="padding:14px 18px;margin-bottom:14px;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div class="form-group" style="margin:0;min-width:180px;flex:1;">
        <label class="form-label">검색어</label>
        <input v-model="searchKw" class="form-control" placeholder="이름·설명·태그" @keyup.enter="doSearch" style="margin:0;" />
      </div>
      <div class="form-group" style="margin:0;width:160px;">
        <label class="form-label">위젯 유형</label>
        <select v-model="searchType" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="form-group" style="margin:0;width:110px;">
        <label class="form-label">상태</label>
        <select v-model="searchStatus" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
        </select>
      </div>
      <button @click="doSearch" class="btn btn-primary" style="height:36px;padding:0 20px;">검색</button>
      <button @click="doReset"  class="btn btn-outline" style="height:36px;padding:0 16px;">초기화</button>
      <button @click="openNew"  class="btn btn-primary" style="height:36px;padding:0 18px;margin-left:auto;">+ 신규등록</button>
    </div>
  </div>

  <!-- 본문: 좌측 트리 + 우측 목록 -->
  <div style="display:flex;gap:12px;align-items:flex-start;">

  <!-- 좌측 표시경로 -->
  <div class="card" style="width:240px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
      <span style="font-size:12px;font-weight:700;color:#555;">표시경로</span>
      <span style="font-size:10px;color:#aaa;">{{ tree.length }}그룹</span>
    </div>
    <!-- 전체펼치기 / 전체닫기 -->
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      <button @click="expandAll"
        style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">
        ▼ 전체펼치기
      </button>
      <button @click="collapseAll"
        style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">
        ▶ 전체닫기
      </button>
    </div>
    <!-- Root 노드 -->
    <div @click="toggleNode('__root__'); selectTree('')"
      :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'7px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',
        background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',
        color: selectedTreeKey==='' ? '#1565c0' : '#222',
        fontWeight: 700,
        border: '1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec'),
      }">
      <span>{{ isOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
      <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ totalCount }}</span>
    </div>
    <!-- 트리 노드 (root 하위로 들여쓰기) -->
    <div v-if="isOpen('__root__')" style="padding-left:12px;">
      <div v-for="node in tree" :key="node.label">
        <div @click="toggleNode(node.label); selectTree(node.label)"
          :style="{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',
            background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',
            color: selectedTreeKey===node.label ? '#1565c0' : '#333',
            fontWeight: selectedTreeKey===node.label ? 700 : 500,
          }">
          <span>{{ isOpen(node.label) ? '▼' : '▶' }} {{ node.label }}</span>
          <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
        </div>
        <div v-if="isOpen(node.label)" style="padding-left:16px;">
          <div v-for="sub in node.children" :key="sub.label"
            @click.stop="selectTree(node.label+'>'+sub.label)"
            :style="{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'4px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',marginBottom:'2px',
              background: selectedTreeKey===(node.label+'>'+sub.label) ? '#e3f2fd' : 'transparent',
              color: selectedTreeKey===(node.label+'>'+sub.label) ? '#1565c0' : '#666',
              fontWeight: selectedTreeKey===(node.label+'>'+sub.label) ? 700 : 500,
            }">
            <span>▸
              <span style="font-size:9px;background:#f3e5f5;color:#6a1b9a;border-radius:6px;padding:1px 6px;margin-right:4px;font-weight:600;">(위젯)</span>
              {{ sub.label }}
            </span>
            <span style="font-size:10px;background:#f0f2f5;color:#888;border-radius:10px;padding:1px 7px;">{{ sub.count }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!tree.length" style="padding:20px 8px;text-align:center;color:#ccc;font-size:11px;">위젯이 없습니다.</div>
  </div>

  <!-- 우측 목록 -->
  <div style="flex:1;min-width:0;">
  <!-- 목록 -->
  <div class="card" style="padding:0;">
    <div style="padding:12px 18px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:13px;color:#555;">총 <b>{{ totalCount }}</b>건</span>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:56px;">ID</th>
          <th>위젯 정보</th>
          <th style="width:120px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pageList.length===0">
          <td colspan="3" style="text-align:center;padding:30px;color:#ccc;">등록된 위젯 리소스가 없습니다.</td>
        </tr>
        <tr v-for="(d, idx) in pageList" :key="d.libId"
          :style="selectedId===d.libId ? 'background:#fff8f8;' : ''">
          <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">#{{ String(d.libId).padStart(4,'0') }}</td>
          <td style="padding:10px 12px;">
            <div style="margin-bottom:6px;">
              <span style="font-size:15px;margin-right:4px;">{{ wIcon(d.widgetType) }}</span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ wTypeLabel(d.widgetType) }}</span>
              <span class="title-link" @click="loadDetail(d.libId)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===d.libId?'color:#e8587a;':'color:#222;')">{{ d.name }}</span>
              <span class="badge" :class="statusCls(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
              <span><b style="color:#888;">내용:</b> {{ contentSummary(d) || '-' }}</span>
              <span><b style="color:#888;">타이틀:</b>
                {{ d.titleYn==='Y' ? (d.title || '표시') : '미표시' }}
              </span>
              <span><b style="color:#888;">표시경로:</b>
                <span v-if="d.displayPath" style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;font-family:monospace;">{{ d.displayPath }}</span>
                <template v-else-if="d.usedPaths && d.usedPaths.length">
                  <span v-for="(p,pi) in d.usedPaths" :key="pi"
                    style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ p }}</span>
                </template>
                <span v-else style="color:#ccc;">미등록</span>
              </span>
              <span><b style="color:#888;">적용수:</b>
                <span style="background:#dbeafe;color:#1d4ed8;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:3px;">{{ (d.usedPaths||[]).length }}</span>
              </span>
              <span v-if="d.tags"><b style="color:#888;">태그:</b> {{ d.tags }}</span>
              <span><b style="color:#888;">등록일:</b> {{ d.regDate || '-' }}</span>
              <span><b style="color:#888;">사이트:</b>
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ siteNm }}</span>
              </span>
            </div>
          </td>
          <td style="vertical-align:top;padding-top:10px;">
            <div class="actions" style="justify-content:flex-end;">
              <button @click.stop="loadDetail(d.libId)" class="btn btn-blue btn-sm">수정</button>
              <button @click.stop="doDelete(d)" class="btn btn-danger btn-sm">삭제</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이저 -->
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNumbers" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  </div><!-- /우측 목록 -->
  </div><!-- /본문 flex -->

  <!-- 인라인 상세 -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <dp-disp-widget-dtl
      :key="detailKey"
      :navigate="inlineNavigate"
      :disp-dataset="dispDataset"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
      @close="closeDetail"
    />
  </div>
</div>
`
};
