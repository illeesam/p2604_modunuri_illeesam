/* ShopJoy Admin - 전시관리 목록 */
window.DispMng = {
  name: 'DispMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchArea = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    const filtered = computed(() => props.adminData.displays.filter(d => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !d.name.toLowerCase().includes(kw) && !d.area.toLowerCase().includes(kw)) return false;
      if (searchArea.value && d.area !== searchArea.value) return false;
      if (searchStatus.value && d.status !== searchStatus.value) return false;
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const areas = computed(() => [...new Set(props.adminData.displays.map(d => d.area))]);
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const typeBadge = t => ({
      'image_banner': 'badge-blue', 'product_slider': 'badge-purple',
      'chart_bar': 'badge-orange', 'text_banner': 'badge-gray',
      'info_card': 'badge-blue', 'popup': 'badge-pink'
    }[t] || 'badge-gray');
    const typeLabel = t => ({
      'image_banner': '이미지배너', 'product_slider': '상품슬라이더',
      'chart_bar': '차트(Bar)', 'text_banner': '텍스트배너',
      'info_card': '정보카드', 'popup': '팝업'
    }[t] || t);

    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      const ok = await props.showConfirm('위젯 삭제', `[${d.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.displays.findIndex(x => x.dispId === d.dispId);
      if (idx !== -1) props.adminData.displays.splice(idx, 1);
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchArea, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, areas, statusBadge, typeBadge, typeLabel, onSearch, setPage, onSizeChange, doDelete };
  },
  template: /* html */`
<div>
  <div class="page-title">전시관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 영역별 위젯 관리</span></div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="위젯명 / 영역코드 검색" @keyup.enter="onSearch" />
      <select v-model="searchArea" @change="onSearch"><option value="">영역 전체</option><option v-for="a in areas" :key="a">{{ a }}</option></select>
      <select v-model="searchStatus" @change="onSearch"><option value="">상태 전체</option><option>활성</option><option>비활성</option></select>
      <button class="btn btn-primary" @click="onSearch">검색</button>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span style="font-size:13px;color:#555;">검색결과 <b>{{ total }}</b>건</span>
      <button class="btn btn-primary btn-sm" @click="navigate('dispDtl', {id:null})">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>위젯명</th><th>영역코드</th><th>위젯유형</th><th>클릭액션</th><th>조건</th><th>인증</th><th>순서</th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="d in pageList" :key="d.dispId">
          <td>{{ d.dispId }}</td>
          <td><span class="title-link" @click="navigate('dispDtl',{id:d.dispId})">{{ d.name }}</span></td>
          <td><code style="font-size:11px;background:#f5f5f5;padding:2px 5px;border-radius:3px;">{{ d.area }}</code></td>
          <td><span class="badge" :class="typeBadge(d.widgetType)">{{ typeLabel(d.widgetType) }}</span></td>
          <td>{{ d.clickAction === 'navigate' ? '이동: '+d.clickTarget : d.clickAction === 'event' ? '이벤트: '+d.clickTarget : '-' }}</td>
          <td>{{ d.condition }}</td>
          <td><span v-if="d.authRequired" class="badge badge-orange">필요 {{ d.authGrade ? '('+d.authGrade+')' : '' }}</span><span v-else class="badge badge-gray">불필요</span></td>
          <td>{{ d.sortOrder }}</td>
          <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="navigate('dispDtl',{id:d.dispId})">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="total-label">총 {{ total }}개</span>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
</div>
`
};
