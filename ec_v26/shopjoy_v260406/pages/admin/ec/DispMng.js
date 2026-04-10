/* ShopJoy Admin - 전시관리 목록 + 하단 DispDtl 임베드 */
window.DispMng = {
  name: 'DispMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchArea = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'ecDispMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    /* 미리보기 */
    const previewDisp = (d) => {
      const areaPageMap = {
        'HOME_BANNER': '', 'HOME_PRODUCT': '', 'HOME_CHART': '', 'HOME_EVENT': '',
        'PRODUCT_TOP': '#page=products', 'PRODUCT_BTM': '#page=products',
        'MY_PAGE': '#page=mypage', 'FOOTER': '',
      };
      const hash = areaPageMap[d.area] || '';
      window.open(`http://127.0.0.1:5502/ec_v26/shopjoy_v260406/index.html${hash}`, '_blank', 'width=1280,height=900,scrollbars=yes');
    };

    /* 표현설정 요약 */
    const dispSummary = (d) => {
      if (d.widgetType === 'image_banner') return d.imageUrl ? '🖼 ' + d.imageUrl.split('/').pop().slice(0, 20) : '-';
      if (d.widgetType === 'product_slider' || d.widgetType === 'product') return d.productIds ? '상품: ' + d.productIds.slice(0, 20) : '-';
      if (d.widgetType === 'coupon') return d.couponCode ? '쿠폰: ' + d.couponCode : '-';
      if (d.widgetType === 'file') return d.fileUrl ? '파일: ' + d.fileLabel || d.fileUrl.split('/').pop() : '-';
      if (d.widgetType === 'event_banner') return d.eventId ? '이벤트#' + d.eventId : '-';
      if (d.widgetType === 'cache_banner') return d.cacheDesc || '-';
      if (d.widgetType === 'html_editor') return d.htmlContent ? d.htmlContent.replace(/<[^>]+>/g, '').slice(0, 20) + '…' : '-';
      if (d.widgetType === 'widget_embed') return d.embedCode ? d.embedCode.slice(0, 20) + '…' : '-';
      if (d.widgetType.startsWith('chart_')) return d.chartTitle || '-';
      if (d.widgetType === 'text_banner') return d.textContent ? d.textContent.slice(0, 20) + (d.textContent.length > 20 ? '…' : '') : '-';
      if (d.widgetType === 'info_card') return d.infoTitle || '-';
      if (d.widgetType === 'popup') return d.popupWidth && d.popupHeight ? `${d.popupWidth}×${d.popupHeight}` : '-';
      return '-';
    };

    const applied = Vue.reactive({ kw: '', area: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.displays.filter(d => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !d.name.toLowerCase().includes(kw) && !d.area.toLowerCase().includes(kw)) return false;
      if (applied.area && d.area !== applied.area) return false;
      if (applied.status && d.status !== applied.status) return false;
      const _d = String(d.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const areas = computed(() => [...new Set(props.adminData.displays.map(d => d.area))]);
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const typeBadge = t => ({
      'image_banner':'badge-blue', 'product_slider':'badge-purple', 'product':'badge-purple',
      'chart_bar':'badge-orange', 'chart_line':'badge-orange', 'chart_pie':'badge-orange',
      'text_banner':'badge-gray', 'info_card':'badge-blue', 'popup':'badge-red',
      'file':'badge-gray', 'coupon':'badge-green', 'html_editor':'badge-orange',
      'event_banner':'badge-blue', 'cache_banner':'badge-green', 'widget_embed':'badge-purple',
    }[t] || 'badge-gray');
    const typeLabel = t => ({
      'image_banner':'이미지배너', 'product_slider':'상품슬라이더', 'product':'상품',
      'chart_bar':'차트(Bar)', 'chart_line':'차트(Line)', 'chart_pie':'차트(Pie)',
      'text_banner':'텍스트배너', 'info_card':'정보카드', 'popup':'팝업',
      'file':'파일', 'coupon':'쿠폰', 'html_editor':'HTML에디터',
      'event_banner':'이벤트', 'cache_banner':'캐쉬', 'widget_embed':'위젯',
    }[t] || t);

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        area: searchArea.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchArea.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', area: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      await window.adminApiCall({
        method: 'delete',
        path: `disps/${d.dispId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${d.name}]을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.displays.findIndex(x => x.dispId === d.dispId);
          if (idx !== -1) props.adminData.displays.splice(idx, 1);
          if (selectedId.value === d.dispId) selectedId.value = null;
        },
      });
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'dispId'},{label:'영역',key:'dispArea'},{label:'제목',key:'title'},{label:'유형',key:'dispType'},{label:'상태',key:'status'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}], '전시목록.csv');

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchArea, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, areas, statusBadge, typeBadge, typeLabel, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, previewDisp, dispSummary, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">전시관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 영역별 위젯 관리</span></div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="위젯명 / 영역코드 검색" />
      <select v-model="searchArea"><option value="">영역 전체</option><option v-for="a in areas" :key="a">{{ a }}</option></select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>비활성</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>위젯명</th><th>영역코드</th><th>위젯유형</th><th>표현설정</th><th>조건</th><th>인증</th><th>순서</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="d in pageList" :key="d.dispId" :style="selectedId===d.dispId?'background:#fff8f9;':''">
          <td>{{ d.dispId }}</td>
          <td><span class="title-link" @click="loadDetail(d.dispId)" :style="selectedId===d.dispId?'color:#e8587a;font-weight:700;':''">{{ d.name }}<span v-if="selectedId===d.dispId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><code style="font-size:11px;background:#f5f5f5;padding:2px 5px;border-radius:3px;">{{ d.area }}</code></td>
          <td><span class="badge" :class="typeBadge(d.widgetType)">{{ typeLabel(d.widgetType) }}</span></td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#666;">{{ dispSummary(d) }}</td>
          <td>{{ d.condition }}</td>
          <td><span v-if="d.authRequired" class="badge badge-orange">필요</span><span v-else class="badge badge-gray">불필요</span></td>
          <td>{{ d.sortOrder }}</td>
          <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기" @click="previewDisp(d)">👁</button>
            <button class="btn btn-blue btn-sm" @click="loadDetail(d.dispId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
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

  <!-- 하단 상세: DispDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <disp-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};
