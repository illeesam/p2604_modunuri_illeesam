/* ShopJoy Admin - 위젯라이브러리 목록 */
window.EcDispWidgetLibMng = {
  name: 'EcDispWidgetLibMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
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
      { value: 'event_banner',   label: '이벤트' },
      { value: 'cache_banner',   label: '캐쉬' },
      { value: 'widget_embed',   label: '위젯' },
    ];
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',
    };
    const wTypeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* ── 검색 ── */
    const searchKw     = ref('');
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 50];

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

    const filtered = computed(() =>
      (props.adminData.widgetLibs || []).filter(d => {
        if (applied.kw && !d.name.toLowerCase().includes(applied.kw) && !(d.desc||'').toLowerCase().includes(applied.kw) && !(d.tags||'').toLowerCase().includes(applied.kw)) return false;
        if (applied.type   && d.widgetType !== applied.type)   return false;
        if (applied.status && d.status     !== applied.status) return false;
        return true;
      }).sort((a, b) => b.libId - a.libId)
    );

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

    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'ecDispWidgetLibMng') { selectedId.value = null; return; }
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

    return {
      WIDGET_TYPES, wTypeLabel, wIcon,
      searchKw, searchType, searchStatus, pager, PAGE_SIZES,
      filtered, totalCount, pageList, totalPages, pageNumbers,
      doSearch, doReset,
      selectedId, openMode, detailEditId, detailKey,
      siteNm,
      loadDetail, openNew, closeDetail, inlineNavigate,
      contentSummary, statusCls,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">
    전시위젯Lib
    <span style="font-size:13px;font-weight:400;color:#888;">위젯 유형별 리소스 등록·재활용</span>
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

  <!-- 목록 -->
  <div class="card" style="padding:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:13px;color:#555;">총 <b>{{ totalCount }}</b>건</span>
      <select v-model="pager.size" class="form-control" style="width:80px;margin:0;font-size:12px;" @change="pager.page=1">
        <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}건</option>
      </select>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:50px;">No.</th>
          <th style="width:50px;">ID</th>
          <th style="width:160px;">위젯 유형</th>
          <th>라이브러리명</th>
          <th>내용 요약</th>
          <th style="width:140px;">사용위치경로</th>
          <th style="width:60px;text-align:center;">적용수</th>
          <th style="width:100px;">태그</th>
          <th style="width:60px;">상태</th>
          <th style="width:90px;">등록일</th>
          <th style="width:80px;text-align:center;">사이트</th>
          <th style="width:70px;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pageList.length===0">
          <td colspan="11" style="text-align:center;padding:30px;color:#ccc;">등록된 위젯 리소스가 없습니다.</td>
        </tr>
        <tr v-for="(d, idx) in pageList" :key="d.libId"
          :style="selectedId===d.libId ? 'background:#fff8f8;' : ''"
          style="cursor:pointer;" @click="loadDetail(d.libId)">
          <td style="text-align:center;color:#aaa;font-size:12px;">{{ (pager.page-1)*pager.size + idx + 1 }}</td>
          <td style="text-align:center;font-size:12px;color:#888;">#{{ String(d.libId).padStart(4,'0') }}</td>
          <td>
            <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;">
              <span style="font-size:15px;">{{ wIcon(d.widgetType) }}</span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;color:#555;">{{ wTypeLabel(d.widgetType) }}</span>
            </span>
          </td>
          <td style="font-weight:600;font-size:13px;">{{ d.name }}</td>
          <td style="font-size:12px;color:#777;">{{ contentSummary(d) }}</td>
          <td style="font-size:11px;">
            <span v-if="!d.usedPaths || !d.usedPaths.length" style="color:#ccc;">-</span>
            <div v-else style="display:flex;flex-direction:column;gap:2px;">
              <span v-for="(p,pi) in d.usedPaths" :key="pi"
                style="display:inline-block;background:#f0f4ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:4px;padding:1px 6px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;"
                :title="p">{{ p }}</span>
            </div>
          </td>
          <td style="text-align:center;">
            <span v-if="d.usedPaths && d.usedPaths.length"
              style="display:inline-block;min-width:24px;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:10px;padding:1px 8px;font-size:12px;font-weight:700;">
              {{ d.usedPaths.length }}
            </span>
            <span v-else style="color:#d1d5db;font-size:12px;">0</span>
          </td>
          <td style="font-size:11px;color:#aaa;">{{ d.tags || '-' }}</td>
          <td style="text-align:center;"><span class="badge" :class="statusCls(d.status)">{{ d.status }}</span></td>
          <td style="text-align:center;font-size:12px;color:#aaa;">{{ d.regDate }}</td>
          <td style="text-align:center;">
            <span style="font-size:10px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:1px 7px;white-space:nowrap;">{{ siteNm }}</span>
          </td>
          <td style="text-align:center;">
            <button @click.stop="loadDetail(d.libId)" class="btn btn-sm btn-outline" style="font-size:11px;padding:2px 10px;">수정</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이저 -->
    <div style="display:flex;justify-content:center;gap:4px;padding:14px;">
      <button @click="pager.page=1"            :disabled="pager.page===1"           class="btn btn-sm btn-outline" style="font-size:12px;">«</button>
      <button @click="pager.page--"            :disabled="pager.page===1"           class="btn btn-sm btn-outline" style="font-size:12px;">‹</button>
      <button v-for="n in pageNumbers" :key="n" @click="pager.page=n"
        class="btn btn-sm" :class="pager.page===n ? 'btn-primary' : 'btn-outline'" style="font-size:12px;min-width:32px;">{{ n }}</button>
      <button @click="pager.page++"            :disabled="pager.page===totalPages"  class="btn btn-sm btn-outline" style="font-size:12px;">›</button>
      <button @click="pager.page=totalPages"   :disabled="pager.page===totalPages"  class="btn btn-sm btn-outline" style="font-size:12px;">»</button>
    </div>
  </div>

  <!-- 인라인 상세 -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <disp-widget-lib-dtl
      :key="detailKey"
      :navigate="inlineNavigate"
      :admin-data="adminData"
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
