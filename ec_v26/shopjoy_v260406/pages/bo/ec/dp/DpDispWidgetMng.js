/* ShopJoy Admin - 전시위젯 목록 (UI용 배치 위젯) */
window.DpDispWidgetMng = {
  name: 'DpDispWidgetMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const codes = reactive({ disp_widget_types: [] });
    const uiState = reactive({ loading: false, isPageCodeLoad: false });
    const widgetLibs = reactive([]);
    const widgets = reactive([]);

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading
          && codeStore?.svCodes?.length > 0
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      codes.disp_widget_types = codeStore.snGetGrpCodes('DISP_WIDGET_TYPE') || [];
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시
    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const [res, resLibs] = await Promise.all([
          window.boApi.get('/bo/ec/dp/widget/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/dp/widget-lib/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        widgets.splice(0, widgets.length, ...(res.data?.data?.list || []));
        widgetLibs.splice(0, widgetLibs.length, ...(resLibs.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('DpDispWidget 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    const searchParam = reactive({ kw: '', type: '', status: '' });
    const searchParamOrg = reactive({ kw: '', type: '', status: '' });

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());

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
    const wTypeLabel = (v) => codes.disp_widget_types.find(t => t.codeValue === v)?.codeLabel || v;
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* ── 검색 ── */
    const pager = reactive({ pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const applied = reactive({ kw: '', type: '', status: '' });
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.pageNo = 1;
      await handleFetchData();
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfFiltered = computed(() => (widgetLibs || []).filter(d => {
      const kw = (applied.kw || '').toLowerCase();
      if (kw && !(d.name || '').toLowerCase().includes(kw)) return false;
      if (applied.type && d.widgetType !== applied.type) return false;
      if (applied.status && d.status !== applied.status) return false;
      return true;
    }));
    const cfTotalCount = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotalCount.value / pager.pageSize)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize));
    const cfPageNums = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const cfTree = computed(() => []);
    const selectedTreeKey = ref('');
    const fnStatusCls = (v) => ({ '활성':'badge-green', '비활성':'badge-gray' }[v] || 'badge-gray');
    const contentSummary = (d) => d?.contents || d?.desc || '';

    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };
    return { widgets, widgetLibs, uiState, pathLabel,
      codes, wTypeLabel, wIcon,
      searchParam, searchParamOrg, pager,
      applied, onSearch, onReset,
      cfSiteNm,
      setPage, onSizeChange,
      uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId),
      handleLoadDetail, openNew, closeDetail, inlineNavigate,
      cfDetailEditId, cfDetailKey,
      cfFiltered, cfTotalCount, cfTotalPages, cfPageList, cfPageNums,
      cfTree, selectedTreeKey, fnStatusCls, contentSummary,
    };
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
        <input v-model="searchParam.kw" class="form-control" placeholder="이름·설명·태그" @keyup.enter="() => onSearch?.()" style="margin:0;" />
      </div>
      <div class="form-group" style="margin:0;width:160px;">
        <label class="form-label">위젯 유형</label>
        <select v-model="searchParam.type" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group" style="margin:0;width:110px;">
        <label class="form-label">상태</label>
        <select v-model="searchParam.status" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
        </select>
      </div>
      <button @click="onSearch" class="btn btn-primary" style="height:36px;padding:0 20px;">조회</button>
      <button @click="onReset"  class="btn btn-outline" style="height:36px;padding:0 16px;">초기화</button>
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
      <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ cfTotalCount }}</span>
    </div>
    <!-- 트리 노드 (root 하위로 들여쓰기) -->
    <div v-if="isOpen('__root__')" style="padding-left:12px;">
      <div v-for="node in cfTree" :key="node?.label">
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
          <div v-for="sub in node.children" :key="sub?.label"
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
    <div v-if="!cfTree.length" style="padding:20px 8px;text-align:center;color:#ccc;font-size:11px;">위젯이 없습니다.</div>
  </div>

  <!-- 우측 목록 -->
  <div style="flex:1;min-width:0;">
  <!-- 목록 -->
  <div class="card" style="padding:0;">
    <div style="padding:12px 18px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:13px;color:#555;">총 <b>{{ cfTotalCount }}</b>건</span>
    </div>

    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:56px;">ID</th>
          <th>위젯 정보</th>
          <th style="width:120px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cfPageList.length===0">
          <td colspan="3" style="text-align:center;padding:30px;color:#ccc;">등록된 위젯 리소스가 없습니다.</td>
        </tr>
        <tr v-for="(d, idx) in cfPageList" :key="d?.libId"
          :style="selectedId===d.libId ? 'background:#fff8f8;' : ''">
          <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">#{{ String(d.libId).padStart(4,'0') }}</td>
          <td style="padding:10px 12px;">
            <div style="margin-bottom:6px;">
              <span style="font-size:15px;margin-right:4px;">{{ wIcon(d.widgetType) }}</span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ wTypeLabel(d.widgetType) }}</span>
              <span class="title-link" @click="handleLoadDetail(d.libId)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===d.libId?'color:#e8587a;':'color:#222;')">{{ d.name }}</span>
              <span class="badge" :class="fnStatusCls(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
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
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
              </span>
            </div>
          </td>
          <td style="vertical-align:top;padding-top:10px;">
            <div class="actions" style="justify-content:flex-end;">
              <button @click.stop="handleLoadDetail(d.libId)" class="btn btn-blue btn-sm">수정</button>
              <button @click.stop="handleDelete(d)" class="btn btn-danger btn-sm">삭제</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이저 -->
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNumbers" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  </div><!-- /우측 목록 -->
  </div><!-- /본문 flex -->

  <!-- 인라인 상세 -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <dp-disp-widget-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
      @close="closeDetail"
    />
  </div>
</div>
`
};
