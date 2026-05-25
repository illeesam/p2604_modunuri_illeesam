/* ShopJoy Admin - 배송관리 상세/등록 */
window._odDlivDtlState = window._odDlivDtlState || { tab: 'info', tabMode: 'tab' };
window.OdDlivDtl = {
  name: 'OdDlivDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    tabMode:      { type: String, default: 'tab' }, // 뷰모드 (tab/1col/2col/3col/4col)
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    onListReload: { type: Function, default: () => {} },
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tab: window._odDlivDtlState.tab || 'info', tabMode2: window._odDlivDtlState.tabMode || 'tab' });
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ dliv_statuses: [] });
    const relatedClaims = reactive([]);                                         // 연관 클레임 목록
    const dlivItems = reactive([]);                                             // 배송 항목 목록

    const cfIsNew = computed(() => !props.dtlId);

    const form = reactive({
      dlivId: '', orderId: '', memberId: '', memberNm: '', recvNm: '',
      recvAddr: '', recvPhone: '', outboundCourierCd: '', outboundTrackingNo: '', dlivStatusCd: '준비중', regDate: '', dlivMemo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      dlivId: yup.string().required('배송ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 목록으로 이동
      } else if (cmd === 'form-cancel') {
        return props.navigate('odDlivMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 목록으로 이동
      } else if (cmd === 'form-close') {
        return props.navigate('odDlivMng');
      // 주문 참조 모달 열기
      } else if (cmd === 'form-order-ref') {
        return showRefModal('order', form.orderId);
      // 회원 참조 모달 열기
      } else if (cmd === 'form-member-ref') {
        return showRefModal('member', form.memberId);
      // 결제정보 그리드 참조 클릭
      } else if (cmd === 'payment-ref-click') {
        return showRefModal(param.type, param.id);
      // 탭 전환
      } else if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.tab = param; }
        return;
      // 뷰모드 전환
      } else if (cmd === 'viewMode-change') {
        uiState.tabMode2 = param;
        return;
      // 배송 추적 창 열기
      } else if (cmd === 'tracking-open') {
        return openTracking(param.courier, param.trackingNo);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivDtl.js : handleSelectAction -> ', cmd, param);
      // (현재 행 단위 액션 없음 — placeholder)
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    watch(() => uiState.tab, v => { window._odDlivDtlState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._odDlivDtlState.tabMode = v; });

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.odDliv.getById(props.dtlId, '배송관리', '상세조회');
        const d = res.data?.data || res.data || {};
        Object.assign(form, { ...d });
        if (!form.dlivId) { form.dlivId = props.dtlId; }
        if (d.dlivStatusCd) { form.dlivStatusCd = d.dlivStatusCd; }
        if (d.outboundCourierCd) { form.outboundCourierCd = d.outboundCourierCd; }
        // getById 응답에 임베드된 배송항목(dlivItems) 사용
        dlivItems.splice(0, dlivItems.length, ...((d.dlivItems || []).map(it => ({
          ...it,
          prodNm: it.prodNm || it.prodId || '',
          color: it.optItemId1 || '',
          size: it.optItemId2 || '',
          qty: it.dlivQty || 1,
          salePrice: it.unitPrice || 0,
          price: (it.unitPrice * (it.dlivQty || 1)) || 0,
          discAmount: it.discAmount || 0,
          discInfo: it.discInfo || '',
        }))));
        // 연관 클레임 로드 (주문ID 기준)
        if (form.orderId) {
          try {
            const claimRes = await boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 100, orderId: form.orderId }, '배송관리', '조회');
            relatedClaims.splice(0, relatedClaims.length, ...(claimRes.data?.data?.pageList || claimRes.data?.data?.list || []));
          } catch (_) { /* ignore */ }
        }
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const CLAIM_TYPE_COLOR = { '취소':'#ef4444','반품':'#FFBB00','교환':'#3b82f6' };
    const cfFirstClaim = computed(() => relatedClaims[0] || null);

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        console.error('[catch-info]', err);
        err.inner.forEach(e => { errors[e.path] = e.message; });
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const isNewDliv = cfIsNew.value;
      const ok = await showConfirm(isNewDliv ? '등록' : '저장', isNewDliv ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (isNewDliv
          ? boApiSvc.odDliv.create({ ...form }, '배송관리', '등록')
          : boApiSvc.odDliv.update(form.dlivId, { ...form }, '배송관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(isNewDliv ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('odDlivMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchDetail();
    });

    /* policy: re-fetch detail API whenever parent Mng increments reloadTrigger */
    watch(() => props.reloadTrigger, async (n, o) => {
      if (n === o || n === 0) { return; }
      try { Object.keys(errors).forEach(k => delete errors[k]); } catch(_) {}
      await handleSearchDetail();
    });

    /* fmt — 포맷 */
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    /* trackingUrl — 추적 URL */
    const trackingUrl = (courier, no) => {
      if (!no) { return ''; }
      if (courier === 'CJ대한통운') return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no;
      if (courier === '롯데택배')   return 'https://www.lotteglogis.com/open/tracking?invno=' + no;
      if (courier === '한진택배')   return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=' + no;
      if (courier === '우체국택배') return 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + no;
      if (courier === '로젠택배')   return 'https://www.ilogen.com/web/personal/trace/' + no;
      return '';
    };

    /* openTracking — 열기 */
    const openTracking = (courier, no) => {
      const url = trackingUrl(courier, no);
      if (!url) { showToast && showToast('운송장 정보가 없습니다.', 'error'); return; }
      window.open(url, 'dlivTrack', 'width=900,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
    };
    const DLIV_STEPS = ['준비중', '출고완료', '배송중', '배송완료'];
    const cfCurrentStepIdx = computed(() => DLIV_STEPS.indexOf(form.dlivStatusCd));
    const cfPaymentList = computed(() => form.orderId ? [{
      orderId: form.orderId, dlivFee: form.shippingFee || 0,
      payMethod: form.payMethod || '-', payStatus: form.payStatus || '-',
      payDate: form.regDate || '-',
    }] : []);
    const cfStatusHistList = computed(() => {
      if (!form.dlivId) { return []; }
      const d = String(form.regDate || '').slice(0,10) || '-';
      const rows = [
        { date: d+' 09:00', user:'시스템', from:'-',     to:'준비중',   memo:'배송 등록' },
      ];
      if (['출고완료','배송중','배송완료'].includes(form.dlivStatusCd)) { rows.push({ date:d+' 10:00', user:'bo', from:'준비중', to:'출고완료', memo:(form.outboundCourierCd||'-')+' 출고' }); }
      if (['배송중','배송완료'].includes(form.dlivStatusCd)) { rows.push({ date:d+' 11:30', user:'시스템', from:'출고완료', to:'배송중', memo:'배송 중' }); }
      if (form.dlivStatusCd === '배송완료') { rows.push({ date:d+' 15:20', user:'시스템', from:'배송중', to:'배송완료', memo:'수령 완료' }); }
      return rows;
    });
    const cfEditHistList = computed(() => form.dlivId ? [
      { date: String(form.regDate||'').slice(0,10)+' 10:05', user:'bo', field:'운송장번호', before:'-', after: form.outboundTrackingNo || '-' },
      { date: String(form.regDate||'').slice(0,10)+' 10:08', user:'bo', field:'택배사',     before:'-', after: form.outboundCourierCd || '-' },
    ] : []);
    const cfTabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'배송항목',      icon:'📦', count: dlivItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: cfPaymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: cfStatusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: cfEditHistList.value.length },
    ]);
    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    /* 결제정보 컬럼 */
    const paymentGridColumns = [
      { key: 'orderId',   label: '주문ID', refLink: 'order' },
      { key: 'dlivFee',   label: '배송비',   style: 'text-align:right;',
        align: 'right', cellStyle: 'font-weight:700', fmt: (v) => fmt(v) },
      { key: 'payMethod', label: '결제수단' },
      { key: 'payStatus', label: '결제상태', badge: () => 'badge-blue' },
      { key: 'payDate',   label: '결제일시' },
    ];

    /* 정보수정이력 컬럼 */
    const editHistGridColumns = [
      { key: 'date',   label: '수정일시', style: 'width:140px;' },
      { key: 'user',   label: '수정자',   style: 'width:100px;' },
      { key: 'field',  label: '항목',     style: 'width:120px;' },
      { key: 'before', label: '변경 전', cellStyle: 'color:#888' },
      { key: 'after',  label: '변경 후', cellStyle: 'color:#e8587a;font-weight:600' },
    ];

    /* 배송항목 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    const dlivItemGridColumns = [
      { key: 'prodNm',      label: '상품명', cellStyle: 'font-size:12px;',
        fmt: (v, row) => `${row.emoji || '🛍'} ${row.prodNm || ''}` },
      { key: 'color',       label: '색상',       style: 'width:60px;',                fmt: v => v || '-' },
      { key: 'size',        label: '사이즈',     style: 'width:50px;',                fmt: v => v || '-' },
      { key: 'qty',         label: '수량',       style: 'width:44px;text-align:center;',
        align: 'center', cellStyle: 'font-weight:600', fmt: (v) => v || 1 },
      { key: 'salePrice',   label: '판매금액',   style: 'width:90px;text-align:right;',
        align: 'right', cellStyle: 'color:#666',
        fmt: (v, row) => fmt(row.salePrice || row.price) },
      { key: 'discInfo',    label: '할인정보',   style: 'width:80px;', cellStyle: 'font-size:12px;',
        fmt: (v) => v || '-',
        cellInnerStyle: (v) => v ? 'font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;' : 'color:#bbb;' },
      { key: 'discAmount',  label: '할인금액',   style: 'width:90px;text-align:right;',
        align: 'right', cellStyle: 'color:#d84315;font-weight:600',
        fmt: (v) => v ? '-' + fmt(v) : '-' },
      { key: 'price',       label: '결제금액',   style: 'width:100px;text-align:right;',
        align: 'right', cellStyle: 'font-weight:700;color:#1a1a1a', fmt: (v) => fmt(v) },
      { key: 'orderStatus', label: '주문상태',   style: 'width:90px;text-align:center;', align: 'center',
        fmt: () => form.orderStatusCd || '-',
        cellInnerStyle: () => form.orderStatusCd
          ? 'font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;'
          : 'color:#ccc;' },
      { key: 'claimStatus', label: '클레임상태', style: 'width:110px;text-align:center;', align: 'center',
        fmt: () => cfFirstClaim.value ? `${cfFirstClaim.value.type} · ${cfFirstClaim.value.status}` : '-',
        cellInnerStyle: () => cfFirstClaim.value
          ? `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${CLAIM_TYPE_COLOR[cfFirstClaim.value.type]||'#9ca3af'};`
          : 'color:#ccc;' },
      { key: 'exchInfo',    label: '교환정보',   style: 'width:140px;', cellStyle: 'font-size:12px;',
        trackBoxes: {
          items: () => {
            const c = cfFirstClaim.value;
            if (!c || c.type !== '교환') { return []; }
            return [
              ...(c.exchangeCourier ? [{ label: '발송', courier: c.exchangeCourier, trackingNo: c.exchangeTrackingNo, colorVariant: 'blue' }] : []),
              ...(c.courier         ? [{ label: '수거', courier: c.courier,         trackingNo: c.trackingNo,         colorVariant: 'orange' }] : []),
            ];
          },
          onTrack: openTracking,
        } },
    ];

    const baseFormColumns = [
      { key: 'dlivId',       label: '배송ID', type: 'text', required: true,
        placeholder: 'DLIV-XXX', readonly: !cfIsNew.value },
      { key: 'orderId',      label: '주문ID', type: 'slot', name: 'orderId', required: true },
      { type: 'rowBreak' },
      { key: 'memberNm',     label: '회원명', type: 'slot', name: 'memberNm' },
      { key: 'recvNm',       label: '수령인', type: 'text' },
      { type: 'rowBreak' },
      { key: 'recvAddr',     label: '배송지 주소', type: 'text', placeholder: '주소 입력', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'recvPhone',    label: '연락처', type: 'text', placeholder: '010-0000-0000' },
      { key: 'dlivStatusCd', label: '상태', type: 'select', options: () => codes.dliv_statuses },
      { type: 'rowBreak' },
      { key: 'dlivMemo',     label: '메모', type: 'slot', name: 'memo', colSpan: 2 },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      form, errors, codes, dlivItems, relatedClaims, tab, tabMode2,                                                       // 상태 / 데이터
      baseFormColumns, paymentGridColumns, editHistGridColumns, dlivItemGridColumns,                                      // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfCurrentStepIdx, cfTabs, cfEditHistList, cfPaymentList, cfStatusHistList, cfFirstClaim,        // computed
      DLIV_STEPS, CLAIM_TYPE_COLOR,                                                                                       // 상수
      fmt, showTab,                                                                                                       // 헬퍼
      showRefModal,                                                                                                       // 모달 (template 직접 참조)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '배송 등록' : (cfDtlMode ? '배송 상세' : '배송 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.dlivId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 ======================================================= -->
  <div v-if="!cfIsNew" style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
    <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="t in cfTabs" :key="t?.id" @click="handleBtnAction('tab-change', t.id)" :disabled="tabMode2!=='tab'" :style="{ flex:1, padding:'11px 12px', border:'none', cursor: tabMode2==='tab'?'pointer':'default', fontSize:'12.5px', borderRadius:'9px', transition:'all .18s', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', opacity: tabMode2==='tab' ? 1 : 0.55, fontWeight: tab===t.id ? 800 : 600, background: (tabMode2==='tab' && tab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent', color: (tabMode2==='tab' && tab===t.id) ? '#e8587a' : '#666', boxShadow: (tabMode2==='tab' && tab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none', borderBottom: (tabMode2==='tab' && tab===t.id) ? '2px solid #e8587a' : '2px solid transparent' }">
      <span style="font-size:14px;">
        {{ t.icon }}
      </span>
      <span>
        {{ t.label }}
      </span>
      <span v-if="t.count !== undefined" :style="{ fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', background: (tabMode2==='tab' && tab===t.id) ? '#e8587a' : '#e5e7eb', color: (tabMode2==='tab' && tab===t.id) ? '#fff' : '#666', minWidth:'18px', textAlign:'center' }">
      {{ t.count }}
    </span>
  </button>
</div>
<div style="display:flex;gap:3px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
  <button v-for="v in [{id:'tab',label:'탭',icon:'📑'},{id:'1col',label:'1열',icon:'1▭'},{id:'2col',label:'2열',icon:'2▭'},{id:'3col',label:'3열',icon:'3▭'},{id:'4col',label:'4열',icon:'4▭'}]" :key="v?.id"
        @click="handleBtnAction('viewMode-change', v.id)" :title="v.label+'로 보기'"
        :style="{
        padding:'8px 12px', border:'none', cursor:'pointer', fontSize:'13px', borderRadius:'8px',
        fontWeight: tabMode2===v.id ? 800 : 600,
        background: tabMode2===v.id ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
        color: tabMode2===v.id ? '#e8587a' : '#888',
        boxShadow: tabMode2===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none'
        }">
    <span style="font-size:15px;">
      {{ v.icon }}
    </span>
  </button>
</div>
</div>
<!-- ===== □. 탭 ======================================================= -->
<!-- ===== ■. 탭 컨텐츠 =================================================== -->
<div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
  <div v-if="cfIsNew || showTab('info')" class="card">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
      📋 상세정보
    </div>
    <!-- ===== ■.■.■. 배송 진행 상태 흐름 ========================================= -->
    <div v-if="!cfIsNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#0ea5e9;">
          🚚 배송
        </span>
        <span style="font-size:13px;font-weight:700;color:#222;">
          {{ form.dlivId }}
        </span>
        <span v-if="form.orderId" style="font-size:11px;color:#888;">
          주문: {{ form.orderId }}
        </span>
        <span v-if="form.outboundCourierCd && form.outboundTrackingNo" style="font-size:11px;color:#888;margin-left:auto;">
        {{ form.outboundCourierCd }} · {{ form.outboundTrackingNo }}
      </span>
    </div>
    <div style="display:flex;align-items:flex-start;overflow-x:auto;">
      <template v-for="(step, idx) in DLIV_STEPS" :key="step">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
          <div :style="{
                width: idx === cfCurrentStepIdx ? '14px' : '10px',
                height: idx === cfCurrentStepIdx ? '14px' : '10px',
                borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
                boxShadow: idx === cfCurrentStepIdx ? '0 0 0 3px rgba(14,165,233,0.3)' : 'none',
                background: idx <= cfCurrentStepIdx ? '#0ea5e9' : '#bbb'
                }">
          </div>
          <div :style="{
                fontSize:'11.5px', fontWeight: idx === cfCurrentStepIdx ? 800 : 600,
                color: idx === cfCurrentStepIdx ? '#0284c7' : (idx < cfCurrentStepIdx ? '#444' : '#bbb'),
                whiteSpace:'nowrap'
                }">
            {{ step }}
          </div>
          <span v-if="step==='배송완료' && form.outboundTrackingNo" @click="handleBtnAction('tracking-open', { courier: form.outboundCourierCd, trackingNo: form.outboundTrackingNo })" title="배송조회 창 열기" style="margin-top:4px;padding:1px 7px;border:1px solid #86efac;background:#dcfce7;color:#15803d;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
          {{ (form.outboundCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송 🔍
        </span>
        <span v-else-if="step==='배송중' && form.outboundTrackingNo && cfCurrentStepIdx < 2" @click="handleBtnAction('tracking-open', { courier: form.outboundCourierCd, trackingNo: form.outboundTrackingNo })" title="배송조회 창 열기" style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
        {{ (form.outboundCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}배송중 🔍
      </span>
    </div>
    <div v-if="idx < DLIV_STEPS.length - 1"
              :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? '#0ea5e9' : '#bbb'}">
    </div>
  </template>
</div>
</div>
<!-- ===== ■.■.■. 기본정보 폼 (BoFormArea 자동 렌더) =========================== -->
<!-- ===== ■.■.■. 폼 영역 ================================================ -->
<bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
        :readonly="cfDtlMode" :cols="2"
        @save="handleBtnAction('form-save')"
        @cancel="handleBtnAction('form-cancel')"
        @edit="handleBtnAction('form-edit')"
        @close="handleBtnAction('form-close')">
  <!-- ===== ■.■.■.■. 주문ID + 보기 ========================================= -->
  <template #orderId>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="cfDtlMode" :class="errors.orderId ? 'is-invalid' : ''" />
      <span v-if="form.orderId" class="ref-link" @click="handleBtnAction('form-order-ref')">
        보기
      </span>
    </div>
    <span v-if="errors.orderId" class="field-error">
      {{ errors.orderId }}
    </span>
  </template>
  <!-- ===== ■.■.■.■. 회원명 + 보기 ========================================== -->
  <template #memberNm>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="form-control" v-model="form.memberNm" :readonly="cfDtlMode" />
      <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-member-ref')">
        보기
      </span>
    </div>
  </template>
  <!-- ===== ■.■.■.■. 메모: Quill 또는 view 모드 HTML ========================= -->
  <template #memo>
    <div v-if="cfDtlMode" class="form-control" style="min-height:90px;line-height:1.6;" v-html="form.dlivMemo || '<span style=color:#bbb>-</span>'">
    </div>
    <base-html-editor v-else v-model="form.dlivMemo" height="180px" />
  </template>
</bo-form-area>
</div>
<!-- ===== ■.■. 배송항목목록 탭 ============================================== -->
<div v-if="!cfIsNew && showTab('items')" class="card" style="padding:20px;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  📦 배송항목
  <span class="tab-count">
    {{ dlivItems.length }}
  </span>
</div>
<div style="background:#f9fafb;padding:10px 14px;border-radius:8px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:14px;font-size:12px;">
  <span>
    <b style="color:#888;">
      택배사:
    </b>
    {{ form.outboundCourierCd || '미지정' }}
  </span>
  <span>
    <b style="color:#888;">
      운송장번호:
    </b>
    {{ form.outboundTrackingNo || '-' }}
  </span>
  <a v-if="form.outboundCourierCd==='CJ대한통운' && form.outboundTrackingNo" :href="'https://trace.cjlogistics.com/next/tracking.html?wblNo='+form.outboundTrackingNo" target="_blank" style="color:#1565c0;">
  조회 →
</a>
<a v-else-if="form.outboundCourierCd==='롯데택배' && form.outboundTrackingNo" :href="'https://www.lotteglogis.com/open/tracking?invno='+form.outboundTrackingNo" target="_blank" style="color:#1565c0;">
조회 →
</a>
<a v-else-if="form.outboundCourierCd==='한진택배' && form.outboundTrackingNo" :href="'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2='+form.outboundTrackingNo" target="_blank" style="color:#1565c0;">
조회 →
</a>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="dlivItemGridColumns" :rows="dlivItems"
        empty-text="배송 항목 정보가 없습니다.">
  <template #tfoot>
    <tr style="background:#fafafa;font-weight:700;">
      <td style="width:36px;">
      </td>
      <td colspan="4" style="text-align:right;color:#555;">
        합계
      </td>
      <td style="width:90px;text-align:right;color:#666;">
        {{ fmt(dlivItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}
      </td>
      <td style="width:80px;">
      </td>
      <td style="width:90px;text-align:right;color:#d84315;">
        -{{ fmt(dlivItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}
      </td>
      <td style="width:100px;text-align:right;color:#1a1a1a;">
        {{ fmt(dlivItems.reduce((s,x)=>s+(x.price||0),0)) }}
      </td>
      <td colspan="3">
      </td>
    </tr>
  </template>
</bo-grid>
</div>
<!-- ===== □.□. 배송항목목록 탭 ============================================== -->
<!-- ===== ■.■. 결제정보 탭 ================================================ -->
<div v-if="!cfIsNew && showTab('payment')" class="card" style="padding:20px;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  💳 결제정보
  <span class="tab-count">
    {{ cfPaymentList.length }}
  </span>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="paymentGridColumns" :rows="cfPaymentList" empty-text="결제정보가 없습니다." @ref-click="({type,id}) => handleBtnAction('payment-ref-click', {type, id})">
</bo-grid>
</div>
<!-- ===== □.□. 결제정보 탭 ================================================ -->
<!-- ===== ■.■. 배송상태변경이력 탭 ============================================ -->
<div v-if="!cfIsNew && showTab('hist')" class="card">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">
  🕒 상태변경이력
  <span class="tab-count">
    {{ cfStatusHistList.length }}
  </span>
</div>
<od-dliv-hist :order-id="form.orderId" :navigate="navigate" />
</div>
<!-- ===== □.□. 배송상태변경이력 탭 ============================================ -->
<!-- ===== ■.■. 정보수정이력 탭 ============================================== -->
<div v-if="!cfIsNew && showTab('editHist')" class="card" style="padding:20px;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  📝 정보수정이력
  <span class="tab-count">
    {{ cfEditHistList.length }}
  </span>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="editHistGridColumns" :rows="cfEditHistList" empty-text="정보 수정 이력이 없습니다.">
</bo-grid>
</div>
</div>
</div>
<!-- ===== □.□. 정보수정이력 탭 ============================================== -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`
};
