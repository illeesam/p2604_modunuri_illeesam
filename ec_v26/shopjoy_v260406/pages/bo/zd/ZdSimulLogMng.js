/* ZdSimulLogMng — 시뮬레이션 실행 로그 통합 조회 (bo-grid 활용) */
(function () {
  const { ref, reactive, computed, onMounted } = Vue;

  const DOMAIN_PAGE_MAP = {
    '회원': 'zdSimulMember', '상품': 'zdSimulProd', '주문': 'zdSimulOrder',
    '클레임': 'zdSimulClaim', '프로모션': 'zdSimulPromo', '적립금': 'zdSimulSave', '기획전': 'zdSimulPlan',
    '이벤트': 'zdSimulEvent', '정산': 'zdSimulSettle',
  };
  const DOMAINS_ALL = ['전체', '회원', '상품', '주문', '클레임', '프로모션', '적립금', '기획전', '이벤트', '정산'];

  window.ZdSimulLogMng = {
    name: 'ZdSimulLogMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 상태 ──────────────────────────────────── */
      const _today   = () => new Date().toISOString().slice(0, 10);
      const _yearAgo = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); };
      const searchParam = reactive({
        domain: '전체',
        mode: '전체',
        status: '전체',
        keyword: '',
        dateFrom: _yearAgo(),
        dateTo: _today(),
      });
      const pager = reactive({ pageNo: 1, pageSize: 50, pageTotalPage: 1, pageTotalCount: 0 });
      const allLogs = ref([]);
      const codes   = reactive({});

      /* ── [02] 데이터 로드 ───────────────────────────── */
      const handleSearchList = () => {
        allLogs.value = window._zdSimulLogs ? [...window._zdSimulLogs] : [];
        pager.pageNo = 1;
      };
      const onSearch = () => handleSearchList();
      const onReset  = () => {
        searchParam.domain   = '전체';
        searchParam.mode     = '전체';
        searchParam.status   = '전체';
        searchParam.keyword  = '';
        searchParam.dateFrom = _yearAgo();
        searchParam.dateTo   = _today();
        handleSearchList();
      };

      onMounted(handleSearchList);

      /* ── [03] 필터 + 클라이언트 페이징 (예외 허용) ──── */
      const cfFiltered = computed(() => {
        let list = allLogs.value;
        if (searchParam.domain !== '전체') list = list.filter(r => r.domain === searchParam.domain);
        if (searchParam.mode !== '전체')   list = list.filter(r => r.mode === searchParam.mode);
        if (searchParam.status !== '전체') {
          if (searchParam.status === '성공') list = list.filter(r => r.status === 'ok');
          else list = list.filter(r => r.status !== 'ok');
        }
        if (searchParam.dateFrom) list = list.filter(r => (r.ts || '') >= searchParam.dateFrom);
        if (searchParam.dateTo)   list = list.filter(r => (r.ts || '').slice(0, 10) <= searchParam.dateTo);
        if (searchParam.keyword) {
          const kw = searchParam.keyword.toLowerCase();
          list = list.filter(r => (r.desc || '').toLowerCase().includes(kw) || (r.reason || '').toLowerCase().includes(kw));
        }
        return list;
      });
      const cfPageList = computed(() => {
        const start = (pager.pageNo - 1) * pager.pageSize;
        return cfFiltered.value.slice(start, start + pager.pageSize);
      });
      const cfPageNums = computed(() => {
        const total = Math.max(1, Math.ceil(cfFiltered.value.length / pager.pageSize));
        pager.pageTotalPage  = total;
        pager.pageTotalCount = cfFiltered.value.length;
        const start = Math.max(1, pager.pageNo - 4);
        const end   = Math.min(total, start + 8);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      });

      /* ── [04] 통계 ──────────────────────────────────── */
      const cfStats = computed(() => {
        const stats = window._zdSimulStats || {};
        return Object.keys(stats).map(k => ({
          domain: k,
          total: stats[k].total || 0,
          ok:    stats[k].ok    || 0,
          fail:  stats[k].fail  || 0,
          rate:  stats[k].total ? Math.round(stats[k].ok / stats[k].total * 100) : 0,
        }));
      });

      /* ── [05] 전체 삭제 ─────────────────────────────── */
      const onClearAll = async () => {
        const ok = await props.showConfirm('로그 삭제', '전체 시뮬로그를 삭제하시겠습니까?');
        if (!ok) return;
        window._zdSimulLogs  = [];
        window._zdSimulStats = {};
        handleSearchList();
        props.showToast('전체 로그가 삭제되었습니다.', 'success');
      };

      /* ── [06] 해당 화면으로 이동 ─────────────────────── */
      const onGoSimul = (domain) => {
        const pageId = DOMAIN_PAGE_MAP[domain];
        if (pageId) props.navigate(pageId);
      };

      /* ── [07] 그리드 컬럼 ───────────────────────────── */
      const baseGridColumns = [
        { key: '_no',    label: '번호', width: '40px',  align: 'center', fmt: (v, row, i) => (pager.pageNo - 1) * pager.pageSize + i + 1 },
        { key: 'ts',     label: '시각', width: '148px', cellStyle: 'font-family:monospace;font-size:11px;color:#64748b;' },
        { key: 'domain', label: '도메인', width: '64px', align: 'center',
          badge: (row) => ({ '회원': 'badge-blue', '상품': 'badge-green', '주문': 'badge-purple', '클레임': 'badge-orange', '프로모션': 'badge-purple', '기획전': 'badge-orange', '이벤트': 'badge-blue', '정산': 'badge-green' }[row.domain] || 'badge-gray') },
        { key: 'mode',   label: '유형', width: '40px',  align: 'center',
          badge: (row) => row.mode === '생성' ? 'badge-blue' : 'badge-orange' },
        { key: 'status', label: '결과', width: '36px',  align: 'center',
          fmt: (v) => v === 'ok' ? '✓' : '✗',
          cellStyle: (v) => 'font-weight:700;font-size:14px;color:' + (v === 'ok' ? '#16a34a' : '#dc2626') },
        { key: 'desc',   label: '내용',
          cellStyle: (v, row) => row.status !== 'ok' ? 'background:#fff5f5;' : '' },
        { key: 'reason', label: '실패 사유', width: '200px', cellStyle: 'color:#ef4444;font-size:11px;' },
      ];

      /* 통계 그리드 컬럼 */
      const statGridColumns = [
        { key: 'domain', label: '도메인',   width: '80px' },
        { key: 'total',  label: '총 실행',  width: '70px', align: 'right' },
        { key: 'ok',     label: '성공',     width: '60px', align: 'right', cellStyle: 'color:#16a34a;font-weight:600;' },
        { key: 'fail',   label: '실패',     width: '60px', align: 'right', cellStyle: 'color:#dc2626;font-weight:600;' },
        { key: 'rate',   label: '성공률',   width: '60px', align: 'right', fmt: (v) => v + '%' },
        { key: '_goto',  label: '재생성', width: '60px', align: 'center', type: 'slot', name: 'gotoBtn' },
      ];

      /* 검색 컬럼 */
      const baseSearchColumns = [
        { key: 'dateRange', type: 'dateRange', label: '등록기간',
          startKey: 'dateFrom', endKey: 'dateTo', typeKey: null },
        { key: 'domain', type: 'select', label: '도메인', options: DOMAINS_ALL.map(d => ({ value: d, label: d })) },
        { key: 'mode',   type: 'select', label: '유형',
          options: [{ value: '전체', label: '전체' }, { value: '생성', label: '생성' }, { value: '수정', label: '수정' }] },
        { key: 'status', type: 'select', label: '결과',
          options: [{ value: '전체', label: '전체' }, { value: '성공', label: '성공' }, { value: '실패', label: '실패' }] },
        { key: 'keyword', type: 'text', label: '내용 검색', placeholder: '내용 또는 사유 입력' },
      ];

      /* ── [08] 반환 ──────────────────────────────────── */
      return {
        searchParam, pager, allLogs, codes,
        cfFiltered, cfPageList, cfPageNums, cfStats,
        baseGridColumns, statGridColumns, baseSearchColumns,
        onSearch, onReset, onClearAll, onGoSimul,
        handleSearchList,
        DOMAINS_ALL, DOMAIN_PAGE_MAP,
      };
    },

    template: `
<div>
  <div class="page-title">📊 시뮬레이션 로그</div>

  <!-- 통계 카드 -->
  <div v-if="cfStats.length > 0" class="card" style="padding:14px 16px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="list-title">📈 도메인별 통계</div>
      <button class="btn btn_delete" @click="onClearAll">🗑 전체 삭제</button>
    </div>
    <bo-grid :rows="cfStats" :columns="statGridColumns" style="font-size:12px;">
      <template #gotoBtn="{ row }">
        <button v-if="DOMAIN_PAGE_MAP[row.domain]" class="btn btn_preview" style="font-size:10px;padding:2px 8px;" @click="onGoSimul(row.domain)">▶ 이동</button>
      </template>
    </bo-grid>
  </div>

  <!-- 검색바 -->
  <div class="card" style="padding:12px 16px;margin-bottom:12px;">
    <bo-search-area :columns="baseSearchColumns" :param="searchParam" @search="onSearch" @reset="onReset" />
  </div>

  <!-- 로그 그리드 -->
  <div class="card" style="padding:14px 16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div class="list-title">📋 실행 로그 <span class="list-count">{{ cfFiltered.length }}건</span></div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn_reset" @click="onSearch">🔄 새로고침</button>
        <button v-if="allLogs.length" class="btn btn_delete" @click="onClearAll">전체 삭제</button>
      </div>
    </div>

    <div v-if="cfFiltered.length === 0" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#cbd5e1;border:1px solid #f1f5f9;border-radius:6px;">
      <div style="font-size:40px;margin-bottom:12px;">📭</div>
      <div style="font-size:14px;margin-bottom:6px;">{{ allLogs.length === 0 ? '시뮬레이션 로그가 없습니다.' : '검색 조건에 맞는 로그가 없습니다.' }}</div>
      <div v-if="allLogs.length === 0" style="font-size:12px;color:#94a3b8;">각 시뮬레이터에서 실행하면 이곳에 기록됩니다.</div>
    </div>

    <bo-grid v-else :rows="cfPageList" :columns="baseGridColumns" style="font-size:11px;" />

    <!-- 페이지네이션 -->
    <div v-if="cfPageNums.length > 1" style="display:flex;justify-content:center;gap:4px;margin-top:12px;flex-wrap:wrap;">
      <button class="btn btn-xs" :disabled="pager.pageNo===1" @click="pager.pageNo=1">«</button>
      <button class="btn btn-xs" :disabled="pager.pageNo===1" @click="pager.pageNo--">‹</button>
      <button v-for="n in cfPageNums" :key="n" class="btn btn-xs"
        :style="n===pager.pageNo ? 'background:#3b82f6;color:#fff;border-color:#2563eb;' : ''"
        @click="pager.pageNo=n">{{ n }}</button>
      <button class="btn btn-xs" :disabled="pager.pageNo===pager.pageTotalPage" @click="pager.pageNo++">›</button>
      <button class="btn btn-xs" :disabled="pager.pageNo===pager.pageTotalPage" @click="pager.pageNo=pager.pageTotalPage">»</button>
      <span style="font-size:11px;color:#94a3b8;align-self:center;margin-left:8px;">
        {{ (pager.pageNo-1)*pager.pageSize+1 }}–{{ Math.min(pager.pageNo*pager.pageSize, cfFiltered.length) }} / {{ cfFiltered.length }}건
      </span>
    </div>
  </div>
</div>`,
  };
})();
