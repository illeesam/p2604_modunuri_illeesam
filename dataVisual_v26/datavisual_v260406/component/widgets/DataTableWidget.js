/* DataVisual — DataTableWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.DataTableWidget = {
  name: 'DataTableWidget',
  props: {
    title: { default: '데이터 테이블' },
    rows:  { default: 8 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">📋 {{ title }}</span>
    <div class="widget-actions" style="gap:6px;">
      <input v-model="search" type="text" placeholder="검색…" style="height:24px;padding:0 8px;font-size:0.72rem;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);width:100px;">
      <button class="widget-btn" @click="generate">↻</button>
    </div>
  </div>
  <div class="widget-body" style="padding:0;">
    <div class="widget-body-scroll">
      <table class="dv-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" style="cursor:pointer;">제품명 {{ sortKey==='name'?(sortAsc?'▲':'▼'):'' }}</th>
            <th @click="sortBy('cat')" style="cursor:pointer;">카테고리 {{ sortKey==='cat'?(sortAsc?'▲':'▼'):'' }}</th>
            <th @click="sortBy('sales')" style="cursor:pointer;">매출 {{ sortKey==='sales'?(sortAsc?'▲':'▼'):'' }}</th>
            <th @click="sortBy('growth')" style="cursor:pointer;">성장률 {{ sortKey==='growth'?(sortAsc?'▲':'▼'):'' }}</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id">
            <td style="font-weight:600;color:var(--text-primary);">{{ row.name }}</td>
            <td><span class="badge badge-blue" style="font-size:0.65rem;">{{ row.cat }}</span></td>
            <td style="font-family:monospace;color:var(--blue);">{{ row.salesFmt }}</td>
            <td>
              <span :style="'color:'+(row.growth>=0?'var(--green)':'var(--red)')">
                {{ row.growth>=0?'▲':'▼' }} {{ Math.abs(row.growth).toFixed(1) }}%
              </span>
            </td>
            <td>
              <span class="badge" :class="row.status==='활성'?'badge-green':row.status==='주의'?'badge-orange':'badge-purple'">
                {{ row.status }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length===0">
            <td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">검색 결과 없음</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, computed } = Vue;
    const tableData = ref([]);
    const search = ref('');
    const sortKey = ref('sales');
    const sortAsc = ref(false);

    const products = ['DataPulse','WorkFlow','SecureVault','CloudNest','AppForge','SalesBot','MarketAI','TechSync','WebCraft','DevTools'];
    const cats = ['분석','협업','보안','클라우드','앱','마케팅','AI','인프라'];
    const statuses = ['활성','활성','활성','주의','대기'];

    function generate() {
      tableData.value = Array.from({ length: props.rows + 4 }, (_, i) => {
        const sales = window.DvData.rand(500, 9800) * 1000;
        return {
          id: i,
          name: products[i % products.length] + ' ' + ['Pro','Lite','Enterprise','Plus'][i % 4],
          cat: cats[i % cats.length],
          sales,
          salesFmt: '₩' + (sales / 10000).toFixed(0) + '만',
          growth: window.DvData.randFloat(-15, 35),
          status: statuses[i % statuses.length],
        };
      });
    }

    function sortBy(key) {
      if (sortKey.value === key) sortAsc.value = !sortAsc.value;
      else { sortKey.value = key; sortAsc.value = false; }
    }

    const filteredRows = computed(() => {
      let rows = tableData.value;
      if (search.value) {
        const q = search.value.toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q));
      }
      return [...rows].sort((a, b) => {
        const av = a[sortKey.value], bv = b[sortKey.value];
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
        return sortAsc.value ? cmp : -cmp;
      });
    });

    generate();
    return { search, sortKey, sortAsc, filteredRows, sortBy, generate };
  }
};
