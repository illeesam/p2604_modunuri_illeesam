/* ShopJoy Admin - 재입고알림관리 */
window.PdRestockNotiMng = {
  name: 'PdRestockNotiMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchProd = ref('');
    const searchNoti = ref('');
    const applied    = reactive({ prod: '', noti: '' });
    const pager      = reactive({ page: 1, size: 20 });
    const checkedIds = reactive(new Set());

    const getProdNm = id => { const p = (props.adminData.products||[]).find(p => p.productId === id); return p ? p.productName : ('상품#'+id); };
    const getMemNm  = id => { const m = (props.adminData.members||[]).find(m => m.userId === id); return m ? m.name : ('회원#'+id); };

    const filtered = computed(() => {
      const kw = applied.prod.toLowerCase();
      return (props.adminData.restockNotis || []).filter(r => {
        if (kw && !getProdNm(r.prodId).toLowerCase().includes(kw)) return false;
        if (applied.noti && r.notiYn !== applied.noti) return false;
        return true;
      }).sort((a, b) => b.regDate > a.regDate ? 1 : -1);
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const allChecked    = computed(() => pageList.value.length > 0 && pageList.value.every(r => checkedIds.has(r.restockNotiId)));
    const toggleAll     = () => { if (allChecked.value) pageList.value.forEach(r => checkedIds.delete(r.restockNotiId)); else pageList.value.forEach(r => checkedIds.add(r.restockNotiId)); };
    const toggleOne     = id => { if (checkedIds.has(id)) checkedIds.delete(id); else checkedIds.add(id); };
    const checkedCount  = computed(() => checkedIds.size);

    const sendNoti = async () => {
      const targets = (props.adminData.restockNotis||[]).filter(r => checkedIds.has(r.restockNotiId) && r.notiYn === 'N');
      if (!targets.length) { props.showToast('발송할 미발송 항목을 선택하세요.', 'info'); return; }
      const ok = await props.showConfirm('알림발송', `선택한 ${targets.length}건에 재입고 알림을 발송하시겠습니까?`);
      if (!ok) return;
      const now = new Date().toLocaleString('sv').replace('T', ' '); targets.forEach(r => { r.notiYn = 'Y'; r.notiDate = now; }); checkedIds.clear();
      try {
        const res = await window.adminApi.post('pd/restock-notis/send', { ids: targets.map(r => r.restockNotiId) });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(`${targets.length}건 알림이 발송되었습니다.`, 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = () => { Object.assign(applied, { prod: searchProd.value, noti: searchNoti.value }); pager.page = 1; };
    const onReset  = () => { searchProd.value = ''; searchNoti.value = ''; Object.assign(applied, { prod: '', noti: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchProd, searchNoti, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             checkedIds, checkedCount, allChecked, toggleAll, toggleOne, sendNoti, ynBadge, getProdNm, getMemNm , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">재입고알림관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">상품명</label>
        <input class="form-control" v-model="searchProd" @keyup.enter="onSearch" placeholder="상품명 검색">
        <label class="search-label">알림발송</label>
        <select class="form-control" v-model="searchNoti">
          <option value="">전체</option><option value="N">미발송</option><option value="Y">발송완료</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">재입고알림 목록</span>
        <span class="list-count">총 {{ total }}건</span>
        <button v-if="checkedCount > 0" class="btn btn-blue btn-sm" style="margin-left:auto" @click="sendNoti">
          📣 알림발송 ({{ checkedCount }}건)
        </button>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th style="width:36px"><input type="checkbox" :checked="allChecked" @change="toggleAll"></th>
          <th>상품명</th><th style="width:100px">SKU</th><th style="width:100px">신청회원</th>
          <th style="width:80px;text-align:center">발송여부</th>
          <th style="width:140px">발송일시</th>
          <th style="width:140px">신청일</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.restockNotiId">
            <td><input type="checkbox" :checked="checkedIds.has(row.restockNotiId)" @change="toggleOne(row.restockNotiId)"></td>
            <td>{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px;color:#888">{{ row.skuId || '-' }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center"><span :class="['badge',ynBadge(row.notiYn)]">{{ row.notiYn==='Y'?'발송완료':'미발송' }}</span></td>
            <td style="font-size:12px;color:#888">{{ row.notiDate || '-' }}</td>
            <td style="font-size:12px">{{ row.regDate }}</td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
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
</div>`
};
