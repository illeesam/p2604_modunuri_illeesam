/* ShopJoy Admin - 전시관리 목록 + 하단 DispDtl 임베드 */
window.DispPanelMng = {
  name: 'DispPanelMng',
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
    const searchArea = ref([]);
    const searchStatus = ref('');
    const searchDispDate = ref('');
    const searchDispTime = ref('');
    const searchCondition = ref('');
    const searchAuthRequired = ref('');
    const searchAuthGrade = ref('');
    const CONDITION_OPTS = ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'];
    const AUTH_GRADE_OPTS = ['일반', '우수', 'VIP'];
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

    const applied = Vue.reactive({ kw: '', area: [], status: '', dateStart: '', dateEnd: '', dispDate: '', dispTime: '', condition: '', authRequired: '', authGrade: '' });

    const filtered = computed(() => props.adminData.displays.filter(d => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !d.name.toLowerCase().includes(kw) && !d.area.toLowerCase().includes(kw)) return false;
      if (applied.area.length && !applied.area.includes(d.area)) return false;
      if (applied.status && d.status !== applied.status) return false;
      const _d = String(d.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      /* 전시일시: 특정 일시가 패널 전시기간 내에 포함되는지 */
      if (applied.dispDate) {
        const dt = `${applied.dispDate} ${applied.dispTime || '00:00'}`;
        const ps = `${d.dispStartDate || '0000-01-01'} ${d.dispStartTime || '00:00'}`;
        const pe = `${d.dispEndDate   || '9999-12-31'} ${d.dispEndTime   || '23:59'}`;
        if (dt < ps || dt > pe) return false;
      }
      if (applied.condition && (d.condition || '항상 표시') !== applied.condition) return false;
      if (applied.authRequired === 'Y' && !d.authRequired) return false;
      if (applied.authRequired === 'N' && d.authRequired) return false;
      if (applied.authGrade && d.authGrade !== applied.authGrade) return false;
      return true;
    }));
    const areas = computed(() =>
      (props.adminData.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
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

    const setDispNow = () => {
      const now = new Date();
      searchDispDate.value = now.toISOString().slice(0, 10);
      searchDispTime.value = now.toTimeString().slice(0, 5);
    };

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        area: searchArea.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
        dispDate: searchDispDate.value,
        dispTime: searchDispTime.value,
        condition: searchCondition.value,
        authRequired: searchAuthRequired.value,
        authGrade: searchAuthGrade.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchArea.value = [];
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      searchDispDate.value = ''; searchDispTime.value = '';
      searchCondition.value = ''; searchAuthRequired.value = ''; searchAuthGrade.value = '';
      Object.assign(applied, { kw: '', area: [], status: '', dateStart: '', dateEnd: '', dispDate: '', dispTime: '', condition: '', authRequired: '', authGrade: '' });
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

    /* 영역 레이블 조회 */
    const areaLabel = (code) => {
      const found = (props.adminData.codes || []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === code);
      return found ? found.codeLabel : code;
    };

    /* 펼치기/접기 */
    const expandedIds = reactive(new Set());
    const toggleExpand = (id) => {
      if (expandedIds.has(id)) expandedIds.delete(id);
      else expandedIds.add(id);
    };
    const isExpanded = (id) => expandedIds.has(id);

    /* 위젯 유형 레이블 (목록용) */
    const WIDGET_TYPE_LABELS = {
      'image_banner':'이미지 배너', 'product_slider':'상품 슬라이더', 'product':'상품',
      'cond_product':'조건상품', 'chart_bar':'차트(Bar)', 'chart_line':'차트(Line)', 'chart_pie':'차트(Pie)',
      'text_banner':'텍스트 배너', 'info_card':'정보카드', 'popup':'팝업',
      'file':'파일', 'file_list':'파일목록', 'coupon':'쿠폰', 'html_editor':'HTML 에디터',
      'event_banner':'이벤트', 'cache_banner':'캐쉬', 'widget_embed':'위젯',
    };
    const wLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';

    /* 카드 미리보기 */
    const cardPreviewItem = ref(null);
    const openCardPreview = (d) => { cardPreviewItem.value = d; };
    const closeCardPreview = () => { cardPreviewItem.value = null; };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchArea, searchStatus, searchDispDate, searchDispTime, setDispNow, searchCondition, searchAuthRequired, searchAuthGrade, CONDITION_OPTS, AUTH_GRADE_OPTS, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, areas, statusBadge, typeBadge, typeLabel, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, previewDisp, dispSummary, exportExcel, areaLabel, expandedIds, toggleExpand, isExpanded, wLabel, cardPreviewItem, openCardPreview, closeCardPreview };
  },
  template: /* html */`
<div>
  <div class="page-title">전시패널관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 영역별 전시패널 관리</span></div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="패널명 / 영역코드 검색" />
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-size:10px;color:#888;font-weight:500;">전시영역미리보기의 영역조건</span>
        <select v-model="searchArea" multiple style="min-width:180px;height:72px;font-size:12px;border:1px solid #d0d0d0;border-radius:6px;padding:2px 4px;">
          <option v-for="a in areas" :key="a.codeValue" :value="a.codeValue">{{ a.codeValue }} {{ a.codeLabel }}</option>
        </select>
      </div>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>비활성</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <!-- 2행: 전시일·노출조건·인증 -->
    <div class="search-bar" style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;">
      <span class="search-label">전시일시</span>
      <input type="date" v-model="searchDispDate" class="date-range-input" style="width:145px;" />
      <input type="time" v-model="searchDispTime" class="date-range-input" style="width:145px;" />
      <button @click="setDispNow" style="font-size:11px;padding:3px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;">🕐 현재</button>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">노출조건</span>
      <select v-model="searchCondition" style="min-width:120px;">
        <option value="">전체</option>
        <option v-for="c in CONDITION_OPTS" :key="c" :value="c">{{ c }}</option>
      </select>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">인증필요</span>
      <select v-model="searchAuthRequired" style="min-width:90px;">
        <option value="">전체</option>
        <option value="Y">필요</option>
        <option value="N">불필요</option>
      </select>
      <span class="search-label">등급제한</span>
      <select v-model="searchAuthGrade" style="min-width:90px;">
        <option value="">전체</option>
        <option v-for="g in AUTH_GRADE_OPTS" :key="g" :value="g">{{ g }} 이상</option>
      </select>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시패널 목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:28px;"></th>
          <th style="width:44px;">ID</th>
          <th>패널명</th>
          <th style="width:160px;">화면영역</th>
          <th style="width:48px;text-align:center;">순서</th>
          <th style="width:64px;text-align:center;">상태</th>
          <th style="width:96px;text-align:center;">노출조건</th>
          <th style="width:52px;text-align:center;">인증</th>
          <th style="width:72px;text-align:center;">등급제한</th>
          <th style="width:190px;text-align:center;">전시기간</th>
          <th style="width:80px;text-align:center;">등록일</th>
          <th style="width:80px;text-align:center;">사이트</th>
          <th style="text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="13" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <template v-for="d in pageList" :key="d.dispId">
          <tr :style="selectedId===d.dispId?'background:#fff8f9;':''">
            <td style="text-align:center;padding:0;">
              <button @click="toggleExpand(d.dispId)"
                style="background:none;border:none;cursor:pointer;font-size:11px;color:#999;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
                {{ isExpanded(d.dispId) ? '▼' : '▶' }}
              </button>
            </td>
            <td style="color:#aaa;font-size:12px;">{{ d.dispId }}</td>
            <td>
              <span class="title-link" @click="loadDetail(d.dispId)"
                :style="selectedId===d.dispId?'color:#e8587a;font-weight:700;':''">
                {{ d.name }}
                <span v-if="selectedId===d.dispId" style="font-size:10px;margin-left:3px;">▼</span>
              </span>
            </td>
            <td>
              <div style="display:flex;flex-direction:column;gap:1px;">
                <code style="font-size:10px;background:#f0f2f5;color:#555;padding:1px 5px;border-radius:3px;letter-spacing:.3px;">{{ d.area }}</code>
                <span style="font-size:11px;color:#888;">{{ areaLabel(d.area) }}</span>
              </div>
            </td>
            <td style="text-align:center;font-size:13px;font-weight:600;color:#555;">{{ d.sortOrder ?? '-' }}</td>
            <td style="text-align:center;"><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
            <td style="text-align:center;">
              <span style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:10px;padding:2px 8px;white-space:nowrap;">
                {{ d.condition || '항상 표시' }}
              </span>
            </td>
            <td style="text-align:center;">
              <span v-if="d.authRequired" class="badge badge-orange" style="font-size:11px;">필요</span>
              <span v-else style="font-size:11px;color:#ccc;">-</span>
            </td>
            <td style="text-align:center;">
              <span v-if="d.authRequired && d.authGrade"
                style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:10px;padding:2px 8px;">
                {{ d.authGrade }}↑
              </span>
              <span v-else style="font-size:11px;color:#ccc;">-</span>
            </td>
            <td style="text-align:center;font-size:11px;color:#555;">
              <template v-if="d.dispStartDate || d.dispEndDate">
                <div>{{ d.dispStartDate || '∞' }} {{ d.dispStartTime || '' }}</div>
                <div style="color:#bbb;font-size:10px;">~</div>
                <div>{{ d.dispEndDate || '∞' }} {{ d.dispEndTime || '' }}</div>
              </template>
              <span v-else style="color:#ccc;">기간 없음</span>
            </td>
            <td style="text-align:center;font-size:11px;color:#aaa;">{{ d.regDate || '-' }}</td>
            <td style="text-align:center;">
              <span style="font-size:10px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:1px 7px;white-space:nowrap;">{{ siteName }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-sm" style="background:#f5f0ff;border:1px solid #b39ddb;color:#6a1b9a;font-size:11px;" title="카드 미리보기" @click="openCardPreview(d)">🖼 카드</button>
                <button class="btn btn-sm" style="background:#e8f0fe;border:1px solid #b0c4de;color:#1a73e8;font-size:11px;" title="내용 미리보기" @click="previewDisp(d)">👁 내용</button>
                <button class="btn btn-blue btn-sm" @click="loadDetail(d.dispId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
              </div>
            </td>
          </tr>
          <!-- 위젯 펼치기 서브 행 -->
          <tr v-if="isExpanded(d.dispId)" :key="'exp_'+d.dispId">
            <td colspan="12" style="padding:0;background:#f8f9fb;border-top:none;">
              <div style="padding:10px 16px 12px 44px;">
                <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;letter-spacing:.3px;">▸ 위젯 구성</div>
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                  <thead>
                    <tr style="background:#eef0f3;color:#666;">
                      <th style="padding:4px 8px;text-align:center;width:48px;font-weight:600;">순서</th>
                      <th style="padding:4px 8px;font-weight:600;">위젯명</th>
                      <th style="padding:4px 8px;text-align:center;width:120px;font-weight:600;">유형</th>
                      <th style="padding:4px 8px;text-align:center;width:100px;font-weight:600;">클릭동작</th>
                      <th style="padding:4px 8px;text-align:center;width:60px;font-weight:600;">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="d.rows && d.rows.length">
                      <tr v-for="(w, wi) in d.rows" :key="wi"
                        style="border-bottom:1px solid #e8eaed;"
                        :style="wi % 2 === 1 ? 'background:#fff;' : ''">
                        <td style="padding:4px 8px;text-align:center;color:#aaa;">{{ w.sortOrder || (wi+1) }}</td>
                        <td style="padding:4px 8px;color:#444;">{{ w.widgetName || ('위젯 ' + (wi+1)) }}</td>
                        <td style="padding:4px 8px;text-align:center;">
                          <span style="background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:1px 7px;font-size:10px;">{{ wLabel(w.widgetType) }}</span>
                        </td>
                        <td style="padding:4px 8px;text-align:center;color:#888;">{{ w.clickAction || '-' }}</td>
                        <td style="padding:4px 8px;text-align:center;">
                          <span v-if="w.useYn === 'N'" style="color:#ccc;">비활성</span>
                          <span v-else style="color:#43a047;">활성</span>
                        </td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td colspan="5" style="padding:8px;text-align:center;color:#bbb;">등록된 위젯이 없습니다. (수정 후 저장하면 위젯 정보가 표시됩니다)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </template>
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
    <disp-panel-dtl
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

  <!-- 패널 카드 미리보기 오버레이 -->
  <div v-if="cardPreviewItem"
    @click.self="closeCardPreview"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:14px;width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
      <!-- 헤더 -->
      <div style="background:linear-gradient(135deg,#e8587a,#c0395e);color:#fff;padding:15px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;">🖼 패널 카드 미리보기</span>
        <button @click="closeCardPreview" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.85;line-height:1;padding:0;">×</button>
      </div>
      <!-- 카드 본문 -->
      <div style="padding:24px;">
        <!-- 영역 + 상태 배지 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
          <code style="font-size:11px;background:#f0f2f5;color:#555;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">{{ cardPreviewItem.area }}</code>
          <span style="font-size:12px;background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 10px;">{{ areaLabel(cardPreviewItem.area) }}</span>
          <span class="badge" :class="cardPreviewItem.status==='활성'?'badge-green':'badge-gray'" style="font-size:12px;">{{ cardPreviewItem.status }}</span>
        </div>
        <!-- 패널명 -->
        <div style="font-size:22px;font-weight:800;color:#222;margin-bottom:16px;line-height:1.3;">{{ cardPreviewItem.name }}</div>
        <!-- 노출조건 / 인증 배지 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:12px;padding:4px 12px;">{{ cardPreviewItem.condition || '항상 표시' }}</span>
          <span v-if="cardPreviewItem.authRequired" style="font-size:12px;background:#fff3e0;color:#e65100;border-radius:12px;padding:4px 12px;">인증 필요</span>
          <span v-if="cardPreviewItem.authRequired && cardPreviewItem.authGrade" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:12px;padding:4px 12px;">{{ cardPreviewItem.authGrade }} 이상</span>
        </div>
        <!-- 전시 기간 -->
        <div v-if="cardPreviewItem.dispStartDate || cardPreviewItem.dispEndDate"
          style="font-size:12px;color:#555;background:#f8faff;border:1px solid #e0e8f8;border-radius:8px;padding:10px 14px;margin-bottom:16px;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:600;">📅 전시 기간</div>
          <span>{{ cardPreviewItem.dispStartDate || '∞' }} {{ cardPreviewItem.dispStartTime || '' }}</span>
          <span style="color:#aaa;margin:0 8px;">~</span>
          <span>{{ cardPreviewItem.dispEndDate || '∞' }} {{ cardPreviewItem.dispEndTime || '' }}</span>
        </div>
        <div v-else style="font-size:12px;color:#bbb;margin-bottom:16px;">전시 기간 미설정</div>
        <!-- 위젯 구성 -->
        <div style="border-top:1px solid #f0f0f0;padding-top:14px;">
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">📐 위젯 구성</div>
          <template v-if="cardPreviewItem.rows && cardPreviewItem.rows.length">
            <div v-for="(r, i) in cardPreviewItem.rows" :key="i"
              style="display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:6px;background:#fafafa;">
              <span style="font-size:11px;color:#bbb;font-weight:700;min-width:16px;text-align:center;">{{ r.sortOrder || i+1 }}</span>
              <span style="font-size:13px;font-weight:600;color:#333;flex:1;">{{ wLabel(r.widgetType) }}</span>
              <span v-if="r.clickAction && r.clickAction !== 'none'"
                style="font-size:10px;color:#888;background:#f0f0f0;border-radius:8px;padding:2px 8px;">{{ r.clickAction }}</span>
            </div>
          </template>
          <div v-else style="font-size:12px;color:#bbb;padding:12px;text-align:center;background:#f9f9f9;border-radius:8px;">
            위젯 정보가 없습니다. 수정 후 저장하면 표시됩니다.
          </div>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:12px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:#aaa;">ID: {{ cardPreviewItem.dispId }} · 등록일: {{ cardPreviewItem.regDate }}</span>
        <div style="display:flex;gap:8px;">
          <button @click="previewDisp(cardPreviewItem); closeCardPreview();" class="btn btn-sm" style="background:#e8f0fe;border:1px solid #b0c4de;color:#1a73e8;font-size:11px;">👁 내용미리보기</button>
          <button @click="closeCardPreview" class="btn btn-secondary btn-sm">닫기</button>
        </div>
      </div>
    </div>
  </div>
</div>
`
};
