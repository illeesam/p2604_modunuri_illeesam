/* ShopJoy Admin - 세트상품관리 */
window.PdSetMng = {
  name: 'PdSetMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchProd = ref('');
    const applied    = reactive({ prod: '' });
    const pager      = reactive({ page: 1, size: 20 });

    const getProdNm = id => { if (!id) return '-'; const p = (props.adminData.products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };

    const flat = computed(() => {
      const kw = applied.prod.toLowerCase();
      return (props.adminData.setItems || []).filter(s => {
        if (kw && !getProdNm(s.setProdId).toLowerCase().includes(kw)) return false;
        return true;
      }).map(s => ({ ...s, setProdNm: getProdNm(s.setProdId), componentProdNm: getProdNm(s.componentProdId) }));
    });
    const total      = computed(() => flat.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => flat.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const onSearch = () => { Object.assign(applied, { prod: searchProd.value }); pager.page = 1; };
    const onReset  = () => { searchProd.value = ''; Object.assign(applied, { prod: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchProd, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset, ynBadge };
  },
  template: `
<div>
  <div class="page-title">세트상품관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">세트상품명</label>
        <input class="form-control" v-model="searchProd" @keyup.enter="onSearch" placeholder="세트상품명 검색">
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">세트상품 구성품 목록</span>
        <span class="list-count">총 {{ total }}건</span>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>세트상품</th><th>구성품명</th><th>연결상품</th>
          <th style="width:80px;text-align:right">수량</th>
          <th>구성품 설명</th>
          <th style="width:60px;text-align:right">정렬</th>
          <th style="width:60px;text-align:center">사용</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.setItemId">
            <td><span class="badge badge-orange" style="margin-right:4px">세트</span>{{ row.setProdNm }}</td>
            <td style="font-weight:500">{{ row.itemNm }}</td>
            <td style="font-size:12px;color:#666">{{ row.componentProdNm }}</td>
            <td style="text-align:right">{{ row.itemQty }}</td>
            <td style="font-size:12px;color:#888">{{ row.itemDesc }}</td>
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
