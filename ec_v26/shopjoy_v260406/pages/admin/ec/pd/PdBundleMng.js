/* ShopJoy Admin - 묶음상품관리 */
window.PdBundleMng = {
  name: 'PdBundleMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchProd = ref('');
    const applied    = reactive({ prod: '' });
    const pager      = reactive({ page: 1, size: 20 });

    const getProdNm = id => { const p = (props.adminData.products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };

    /* 묶음상품 기준으로 그룹화 */
    const bundleGroups = computed(() => {
      const kw = applied.prod.toLowerCase();
      const items = (props.adminData.bundles || []);
      const groups = {};
      items.forEach(b => {
        if (!groups[b.bundleProdId]) groups[b.bundleProdId] = { bundleProdId: b.bundleProdId, items: [] };
        groups[b.bundleProdId].items.push(b);
      });
      return Object.values(groups).filter(g => {
        if (!kw) return true;
        return getProdNm(g.bundleProdId).toLowerCase().includes(kw);
      });
    });
    const flat = computed(() => {
      const rows = [];
      bundleGroups.value.forEach(g => g.items.forEach(item => rows.push({ ...item, bundleProdNm: getProdNm(item.bundleProdId), componentProdNm: getProdNm(item.componentProdId) })));
      return rows;
    });
    const total      = computed(() => flat.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => flat.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const onSearch = () => { Object.assign(applied, { prod: searchProd.value }); pager.page = 1; };
    const onReset  = () => { searchProd.value = ''; Object.assign(applied, { prod: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* 가격 안분율 합계 검증 */
    const rateSum = (bundleProdId) => {
      const items = (props.adminData.bundles||[]).filter(b => b.bundleProdId === bundleProdId);
      return items.reduce((s, b) => s + (b.priceRate || 0), 0);
    };
    const rateSumBadge = id => Math.abs(rateSum(id) - 100) < 0.01 ? 'badge-green' : 'badge-red';

    return { searchProd, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             bundleGroups, ynBadge, rateSum, rateSumBadge, getProdNm };
  },
  template: `
<div>
  <div class="page-title">묶음상품관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">묶음상품명</label>
        <input class="form-control" v-model="searchProd" @keyup.enter="onSearch" placeholder="묶음상품명 검색">
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">묶음상품 구성품 목록</span>
        <span class="list-count">총 {{ total }}건</span>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>묶음상품</th><th>구성품</th>
          <th style="width:80px;text-align:right">수량</th>
          <th style="width:100px;text-align:right">가격안분율(%)</th>
          <th style="width:110px;text-align:right">합계</th>
          <th style="width:60px;text-align:right">정렬</th>
          <th style="width:60px;text-align:center">사용</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.bundleItemId">
            <td><span class="badge badge-blue" style="margin-right:4px">묶음</span>{{ row.bundleProdNm }}</td>
            <td>{{ row.componentProdNm }}</td>
            <td style="text-align:right">{{ row.componentQty }}</td>
            <td style="text-align:right">{{ row.priceRate }}%</td>
            <td style="text-align:right">
              <span :class="['badge',rateSumBadge(row.bundleProdId)]" style="font-size:11px">합계 {{ rateSum(row.bundleProdId).toFixed(1) }}%</span>
            </td>
            <td style="text-align:right">{{ row.sortOrd }}</td>
            <td style="text-align:center"><span :class="['badge',ynBadge(row.useYn)]">{{ row.useYn }}</span></td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination" v-if="totalPages > 1">
        <button class="pager" @click="setPage(pager.page-1)" :disabled="pager.page===1">◀</button>
        <button v-for="n in pageNums" :key="n" class="pager" :class="{active:n===pager.page}" @click="setPage(n)">{{ n }}</button>
        <button class="pager" @click="setPage(pager.page+1)" :disabled="pager.page===totalPages">▶</button>
      </div>
    </div>
</div>`
};
