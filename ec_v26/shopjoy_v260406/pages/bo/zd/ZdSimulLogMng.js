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
      const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalPage: 1, pageTotalCount: 0 });
      const allLogs = ref([]);
      const codes   = reactive({});

      /* ── [02] 데이터 로드 ───────────────────────────── */
      const handleSearchList = async () => {
        try {
          const params = {
            pageNo:   pager.pageNo,
            pageSize: pager.pageSize,
          };
          if (searchParam.domain !== '전체') params.domain = searchParam.domain;
          if (searchParam.mode !== '전체')   params.mode   = searchParam.mode;
          if (searchParam.status === '성공') params.status = 'SUCCESS';
          else if (searchParam.status === '실패') params.status = 'FAIL';
          if (searchParam.dateFrom) params.dateFrom = searchParam.dateFrom;
          if (searchParam.dateTo)   params.dateTo   = searchParam.dateTo;
          if (searchParam.keyword)  params.desc     = searchParam.keyword;

          const res = await boApiSvc.zdSimulLog.getPage(params);
          const d = res.data?.data || {};
          allLogs.value = d.pageList || [];
          pager.pageTotalCount = d.pageTotalCount || 0;
          pager.pageTotalPage  = d.pageTotalPage  || 1;
        } catch (e) {
          allLogs.value = [];
        }
      };
      const onSearch = () => { pager.pageNo = 1; handleSearchList(); };
      const onReset  = () => {
        searchParam.domain   = '전체';
        searchParam.mode     = '전체';
        searchParam.status   = '전체';
        searchParam.keyword  = '';
        searchParam.dateFrom = _yearAgo();
        searchParam.dateTo   = _today();
        pager.pageNo = 1;
        handleSearchList();
      };

      onMounted(handleSearchList);

      /* ── [03] 파생 ──────────────────────────────────── */

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

      const onSetPage = (n) => { pager.pageNo = n; handleSearchList(); };

      /* ── [05] 전체 삭제 ─────────────────────────────── */
      const onClearAll = async () => {
        const ok = await props.showConfirm('로그 삭제', '전체 시뮬로그를 삭제하시겠습니까?');
        if (!ok) return;
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
        { key: 'regDate',   label: '시각', width: '148px', cellStyle: 'font-family:monospace;font-size:11px;color:#64748b;' },
        { key: 'domain',    label: '도메인', width: '64px', align: 'center',
          badge: (row) => ({ '회원': 'badge-blue', '상품': 'badge-green', '주문': 'badge-purple', '클레임': 'badge-orange', '프로모션': 'badge-purple', '기획전': 'badge-orange', '이벤트': 'badge-blue', '정산': 'badge-green' }[row.domain] || 'badge-gray') },
        { key: 'simulMode', label: '유형', width: '40px', align: 'center',
          badge: (row) => row.simulMode === '생성' ? 'badge-blue' : 'badge-orange' },
        { key: 'simulStatus', label: '결과', width: '36px', align: 'center',
          fmt: (v) => v === 'SUCCESS' ? '✓' : '✗',
          cellStyle: (v) => 'font-weight:700;font-size:14px;color:' + (v === 'SUCCESS' ? '#16a34a' : '#dc2626') },
        { key: 'uiNm',     label: '화면명', width: '110px' },
        { key: 'userNm',   label: '등록자', width: '72px', align: 'center' },
        { key: 'descTxt',  label: '내용',
          cellStyle: (v, row) => row.simulStatus !== 'SUCCESS' ? 'background:#fff5f5;' : '' },
        { key: 'reasonTxt', label: '실패 사유', width: '200px', cellStyle: 'color:#ef4444;font-size:11px;' },
        { key: 'targetId',  label: '데이터ID', width: '160px', cellStyle: 'font-family:monospace;font-size:10px;color:#64748b;' },
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
        { key: 'domain',  type: 'select', label: '도메인', options: DOMAINS_ALL.map(d => ({ value: d, label: d })) },
        { key: 'mode',    type: 'select', label: '유형',
          options: [{ value: '전체', label: '전체' }, { value: '생성', label: '생성' }, { value: '수정', label: '수정' }] },
        { key: 'status',  type: 'select', label: '결과',
          options: [{ value: '전체', label: '전체' }, { value: '성공', label: '✓ 성공' }, { value: '실패', label: '✗ 실패' }] },
        { key: 'keyword', type: 'text',   label: '내용 검색', placeholder: '내용 또는 사유 입력' },
      ];

      /* ── [08] 반환 ──────────────────────────────────── */
      return {
        searchParam, pager, allLogs, codes,
        cfStats,
        baseGridColumns, statGridColumns, baseSearchColumns,
        onSearch, onReset, onClearAll, onGoSimul, onSetPage,
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
      <div class="list-title">📋 실행 로그 <span class="list-count">{{ pager.pageTotalCount }}건</span></div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn_reset" @click="onSearch">🔄 새로고침</button>
        <button v-if="pager.pageTotalCount > 0" class="btn btn_delete" @click="onClearAll">전체 삭제</button>
      </div>
    </div>

    <div v-if="allLogs.length === 0" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#cbd5e1;border:1px solid #f1f5f9;border-radius:6px;">
      <div style="font-size:40px;margin-bottom:12px;">📭</div>
      <div style="font-size:14px;margin-bottom:6px;">{{ pager.pageTotalCount === 0 ? '시뮬레이션 로그가 없습니다.' : '검색 조건에 맞는 로그가 없습니다.' }}</div>
      <div v-if="pager.pageTotalCount === 0" style="font-size:12px;color:#94a3b8;">각 시뮬레이터에서 실행하면 이곳에 기록됩니다.</div>
    </div>

    <bo-grid v-else :rows="allLogs" :columns="baseGridColumns" :pager="pager" style="font-size:11px;" />

    <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSearch" />
  </div>
</div>`,
  };
})();
