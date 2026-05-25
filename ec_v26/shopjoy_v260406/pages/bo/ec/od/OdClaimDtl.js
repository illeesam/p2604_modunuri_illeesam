/* ShopJoy Admin - 클레임관리 상세/등록 */
window._odClaimDtlState = window._odClaimDtlState || { activeTab: 'info', tabMode: 'tab' };
window.OdClaimDtl = {
  name: 'OdClaimDtl',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    dtlId:        { type: String, default: null }, // 수정 대상 ID
    dtlMode:      { type: String, default: 'view' }, // 상세 모드 (new/view/edit),
    reloadTrigger: { type: Number, default: 0 }, // reload signal from parent Mng // 첫 탭 저장 시 상위 Mng 재조회 (UX-admin §18)
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: window._odClaimDtlState.activeTab || 'info', tabMode2: window._odClaimDtlState.tabMode || 'tab' });
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const codes = reactive({ claim_statuses: [], claim_types: [] });
    const claimItems = reactive([]);                                            // 클레임 항목 목록
    const expandedItems = reactive(new Set());                                  // 펼쳐진 클레임 항목 행 인덱스

    const cfIsNew = computed(() => !props.dtlId);

    const form = reactive({
      claimId: '', memberId: '', memberNm: '', orderId: '', prodNm: '',
      claimTypeCd: '취소', claimStatusCd: '신청', reasonCd: '', reasonDetail: '',
      refundAmt: 0, refundMethodCd: '계좌환불', requestDate: '', memo: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      claimId: yup.string().required('클레임ID를 입력해주세요.'),
      orderId: yup.string().required('주문ID를 입력해주세요.'),
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimDtl.js : handleBtnAction -> ', cmd, param);
      // 폼 저장 (신규 등록 또는 수정)
      if (cmd === 'form-save') {
        return handleSave();
      // 폼 편집 취소 → 목록으로 이동
      } else if (cmd === 'form-cancel') {
        return props.navigate('odClaimMng');
      // 상세 보기 → 편집 모드 전환
      } else if (cmd === 'form-edit') {
        return props.navigate('__switchToEdit__');
      // 폼 닫기 → 목록으로 이동
      } else if (cmd === 'form-close') {
        return props.navigate('odClaimMng');
      // 주문 참조 모달 열기
      } else if (cmd === 'form-orderRef') {
        return showRefModal('order', form.orderId);
      // 회원 참조 모달 열기
      } else if (cmd === 'form-memberRef') {
        return showRefModal('member', form.memberId);
      // 탭 전환
      } else if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.activeTab = param; }
        return;
      // 뷰모드 전환
      } else if (cmd === 'viewMode-change') {
        uiState.tabMode2 = param;
        return;
      // 클레임항목 전체 펼침 토글
      } else if (cmd === 'claimItems-toggleExpandAll') {
        if (cfAllExpanded.value) { expandedItems.clear(); }
        else { expandedItems.clear(); claimItems.forEach((_, i) => expandedItems.add(i)); }
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
      console.log(' ■■ OdClaimDtl.js : handleSelectAction -> ', cmd, param);
      // 클레임항목 행 펼침 토글
      if (cmd === 'claimItems-rowToggleExpand') {
        if (expandedItems.has(param)) { expandedItems.delete(param); }
        else { expandedItems.add(param); }
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
      codes.claim_types = codeStore.sgGetGrpCodes('CLAIM_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* CLAIM_STEPS: parentCodeValues 기반 동적 파생 */
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const cfClaimStatusCodes = computed(() =>
      (codes.claim_statuses || [])
        .filter(c => c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const cfClaimSteps = computed(() => cfClaimStatusCodes.value
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (TYPE_CD[form.claimTypeCd] || form.claimTypeCd) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l)));

    const cfCurrentStepIdx = computed(() => cfClaimSteps.value.indexOf(form.claimStatusCd));
    const cfStatusOptions   = computed(() => cfClaimSteps.value);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchDetail — 처리 */
    const handleSearchDetail = async () => {
      if (cfIsNew.value) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.odClaim.getById(props.dtlId, '클레임관리', '상세조회');
        const c = res.data?.data || res.data || {};
        Object.assign(form, { ...c });
        if (!form.claimId) { form.claimId = props.dtlId; }
        // getById 응답에 임베드된 클레임항목(claimItems) 사용
        claimItems.splice(0, claimItems.length, ...((c.claimItems || []).map(x => ({
          ...x,
          prodNm: x.prodNm,
          color: x.prodOption || '',
          size: '',
          qty: x.claimQty || 1,
          salePrice: x.unitPrice || 0,
          price: x.itemAmt || 0,
          discAmount: x.discAmount || 0,
          discInfo: x.discInfo || '',
        }))));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
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
      const isNewClaim = cfIsNew.value;
      const ok = await showConfirm(isNewClaim ? '등록' : '저장', isNewClaim ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await (isNewClaim
          ? boApiSvc.odClaim.create({ ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '등록')
          : boApiSvc.odClaim.update(form.claimId, { ...form, refundAmt: Number(form.refundAmt) }, '클레임관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(isNewClaim ? '등록되었습니다.' : '저장되었습니다.', 'success'); }
        if (props.navigate) { props.navigate('odClaimMng', { reload: true }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    watch(() => uiState.activeTab, v => { window._odClaimDtlState.activeTab = v; });
    watch(() => uiState.tabMode2, v => { window._odClaimDtlState.tabMode = v; });

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.activeTab === id;

    /* fmt — 포맷 */
    const fmt = (n) => Number(n||0).toLocaleString() + '원';

    const CLAIM_TYPE_COLOR = { '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' };

    /* isExpanded — 여부 확인 */
    const isExpanded = (i) => expandedItems.has(i);
    /* fnItemExpanded — 유틸 */
    const fnItemExpanded = (row, i) => isExpanded(i) && form.claimTypeCd === '교환';
    const cfAllExpanded = computed(() => claimItems.length > 0 && window.safeArrayUtils.safeEvery(claimItems, (_,i) => expandedItems.has(i)));

    watch(claimItems, (list) => { expandedItems.clear(); list.forEach((_,i) => expandedItems.add(i)); });

    /* getExchangedItem — 조회 */
    const getExchangedItem = (it) => {
      if (form.claimTypeCd !== '교환') { return null; }
      const swapColor = { '블랙':'네이비','네이비':'차콜','화이트':'아이보리','차콜':'블랙' };

      return {
        prodNm: it.prodNm + ' (교환품)',
        color: swapColor[it.color] || '네이비',
        size: it.size, qty: it.qty, price: it.price,
        courier: form.exchangeCourierCd,
        trackingNo: form.exchangeTrackingNo,
      };
    };

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
    const cfPaymentList = computed(() => form.refundAmt || form.claimId ? [{
      method: form.refundMethodCd || '-', status: form.claimStatusCd || '-',
      amount: form.refundAmt || 0, payDate: form.requestDate || '-',
      account: form.refundAccount || '-', apprNo: form.apprNo || '-',
    }] : []);
    const cfStatusHistList = computed(() => {
      if (!form.claimId) { return []; }
      const d = String(form.requestDate || '').slice(0,10) || '-';
      return [
        { date: d+' 09:10', user:'회원',   from:'-',           to: form.claimTypeCd+'요청', memo: form.claimTypeCd+' 접수' },
        { date: d+' 11:30', user:'bo',  from: form.claimTypeCd+'요청', to:'처리중',        memo:'검토 후 처리 시작' },
        { date: d+' 15:00', user:'bo',  from:'처리중',      to: form.claimStatusCd,  memo:'상태 갱신' },
      ];
    });
    const cfEditHistList = computed(() => form.claimId ? [
      { date: String(form.requestDate||'').slice(0,10)+' 10:00', user:'bo', field:'사유',      before:'-', after: form.reasonCd || '-' },
      { date: String(form.requestDate||'').slice(0,10)+' 12:20', user:'bo', field:'환불금액',  before:'0', after: (form.refundAmt||0).toLocaleString() },
    ] : []);
    const cfTabs = computed(() => [
      { id:'info',     label:'상세정보',      icon:'📋' },
      { id:'items',    label:'클레임항목',    icon:'↩', count: claimItems.length },
      { id:'payment',  label:'결제정보',      icon:'💳', count: cfPaymentList.value.length },
      { id:'hist',     label:'상태변경이력',  icon:'🕒', count: cfStatusHistList.value.length },
      { id:'editHist', label:'정보수정이력',  icon:'📝', count: cfEditHistList.value.length },
    ]);

    // dtlMode: 'view'이면 읽기전용, 'new'/'edit'이면 편집
    const cfDtlMode = computed(() => props.dtlMode === 'view');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* 결제정보 탭 그리드 컬럼 */
    const paymentGridColumns = [
      { key: 'method',  label: '환불수단' },
      { key: 'status',  label: '환불상태', badge: () => 'badge-orange' },
      { key: 'amount',  label: '환불금액', style: 'text-align:right;', fmt: (v) => fmt(v),
        align: 'right', cellStyle: 'font-weight:700;' },
      { key: 'payDate', label: '처리일시' },
      { key: 'account', label: '계좌/카드' },
      { key: 'apprNo',  label: '승인번호' },
    ];

    /* 정보수정이력 탭 그리드 컬럼 */
    const editHistGridColumns = [
      { key: 'date',   label: '수정일시', style: 'width:140px;' },
      { key: 'user',   label: '수정자',   style: 'width:100px;' },
      { key: 'field',  label: '항목',     style: 'width:120px;' },
      { key: 'before', label: '변경 전', cellStyle: 'color:#888;' },
      { key: 'after',  label: '변경 후', cellStyle: 'color:#e8587a;font-weight:600;' },
    ];

    /* 클레임항목 그리드 컬럼 (번호 컬럼은 bo-grid 자동) */
    const claimItemGridColumns = [
      { key: 'prodNm',      label: '상품명' },
      { key: 'color',       label: '색상',       style: 'width:60px;',                fmt: v => v || '-' },
      { key: 'size',        label: '사이즈',     style: 'width:50px;',                fmt: v => v || '-' },
      { key: 'qty',         label: '수량',       style: 'width:44px;text-align:center;',
        align: 'center', fmt: (v) => v || 1, cellStyle: 'font-weight:600;' },
      { key: 'salePrice',   label: '판매금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v, row) => fmt(row.salePrice || row.price || 0), cellStyle: 'color:#666;' },
      { key: 'discInfo',    label: '할인정보',   style: 'width:80px;', cellStyle: 'font-size:12px;',
        fmt: (v) => v || '-',
        cellInnerStyle: (v) => v ? 'font-size:11px;padding:2px 7px;border-radius:8px;background:#fff3e0;color:#e65100;font-weight:600;' : 'color:#bbb;' },
      { key: 'discAmount',  label: '할인금액',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => v ? '-' + fmt(v) : '-', cellStyle: 'color:#d84315;font-weight:600;' },
      { key: 'price',       label: '결제금액',   style: 'width:100px;text-align:right;',
        align: 'right', fmt: (v) => fmt(v || 0), cellStyle: 'font-weight:700;color:#1a1a1a;' },
      { key: 'orderStatus', label: '주문상태',   style: 'width:90px;text-align:center;', align: 'center',
        fmt: () => form.orderStatusCd || '-',
        cellInnerStyle: () => form.orderStatusCd
          ? 'font-size:10.5px;padding:2px 7px;border-radius:8px;background:#eef4ff;color:#1e40af;font-weight:600;'
          : 'color:#ccc;' },
      { key: 'claimStatus', label: '클레임상태', style: 'width:110px;text-align:center;', align: 'center',
        fmt: () => `${form.claimTypeCd || ''} · ${form.claimStatusCd || ''}`,
        cellInnerStyle: () => `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af'};` },
      { key: 'exchInfo',    label: '교환정보',   style: 'width:140px;', cellStyle: 'font-size:12px;',
        trackBoxes: {
          items: () => form.claimTypeCd !== '교환' ? [] : [
            ...(form.exchangeCourierCd ? [{ label: '발송', courier: form.exchangeCourierCd, trackingNo: form.exchangeTrackingNo, colorVariant: 'blue' }] : []),
            ...(form.returnCourierCd   ? [{ label: '수거', courier: form.returnCourierCd,   trackingNo: form.returnTrackingNo,   colorVariant: 'orange' }] : []),
          ],
          onTrack: openTracking,
        } },
    ];

    // 기본 폼
    const baseFormColumns = [
      { key: 'claimId',      label: '클레임ID', type: 'text', required: true,
        placeholder: 'CLM-2026-XXX', readonly: !cfIsNew.value },
      { key: 'orderId',      label: '주문ID', type: 'slot', name: 'orderId', required: true },
      { type: 'rowBreak' },
      { key: 'memberId',     label: '회원ID', type: 'slot', name: 'memberId' },
      { key: 'memberNm',     label: '회원명', type: 'text' },
      { type: 'rowBreak' },
      { key: 'claimTypeCd',  label: '클레임 유형', type: 'select', options: () => codes.claim_types },
      { key: 'claimStatusCd', label: '처리 상태', type: 'select', nullable: false,
        options: () => cfStatusOptions.value },
      { type: 'rowBreak' },
      { key: 'prodNm',       label: '상품명', type: 'text', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'reasonCd',     label: '사유', type: 'text' },
      { key: 'requestDate',  label: '신청일', type: 'text', placeholder: '2026-04-08 10:00' },
      { type: 'rowBreak' },
      { key: 'reasonDetail', label: '상세 사유', type: 'textarea', rows: 3, colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    /* itemExpandColumns — 클레임항목 행 펼침 BoFormArea 컬럼 (교환품 정보) */
    const itemExpandColumns = [
      { key: '_exchLabel', label: '교환품',  type: 'readonly', html: true, fmt: () => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#3b82f6;color:#fff;font-weight:800;">↔ 교환</span>` },
      { key: '_exchProd',  label: '상품명',  type: 'readonly', html: true, fmt: (v, row) => `<b style="color:#1e40af;">${getExchangedItem(row).prodNm || '-'}</b>` },
      { key: '_exchColor', label: '색상',    type: 'readonly', html: true, fmt: (v, row) => `<b>${row.color || '-'}</b> → <b style="color:#1e40af;">${getExchangedItem(row).color || '-'}</b>` },
      { key: '_exchSize',  label: '사이즈',  type: 'readonly', fmt: (v, row) => getExchangedItem(row).size || '-' },
      { key: '_exchQty',   label: '수량',    type: 'readonly', fmt: (v, row) => getExchangedItem(row).qty || '-' },
      { key: '_tracking',  label: '발송추적', type: 'slot', name: 'tracking', visible: (row) => !!getExchangedItem(row).courier },
    ];

    return {
      form, errors, codes, claimItems, expandedItems, activeTab, tabMode2,                                // 상태 / 데이터
      baseFormColumns, paymentGridColumns, editHistGridColumns, claimItemGridColumns, itemExpandColumns,  // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsNew, cfDtlMode, cfStatusOptions, cfClaimSteps, cfCurrentStepIdx, cfTabs, cfEditHistList,        // computed
      cfPaymentList, cfStatusHistList, cfAllExpanded,                                                     // computed
      CLAIM_TYPE_COLOR,                                                                                   // 상수
      fmt, showTab, isExpanded, fnItemExpanded, getExchangedItem,                                         // 헬퍼
      showRefModal,                                                                                       // 모달 (template 직접 참조)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    {{ cfIsNew ? '클레임 등록' : (cfDtlMode ? '클레임 상세' : '클레임 수정') }}
    <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">
      #{{ form.claimId }}
    </span>
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 탭 ======================================================= -->
  <div v-if="!cfIsNew" style="display:flex;gap:8px;margin-bottom:14px;align-items:stretch;">
    <div style="flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button v-for="t in cfTabs" :key="t?.id" @click="handleBtnAction('tab-change', t.id)" :disabled="tabMode2!=='tab'" :style="{ flex:1, padding:'11px 12px', border:'none', cursor: tabMode2==='tab'?'pointer':'default', fontSize:'12.5px', borderRadius:'9px', transition:'all .18s', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', opacity: tabMode2==='tab' ? 1 : 0.55, fontWeight: activeTab===t.id ? 800 : 600, background: (tabMode2==='tab' && activeTab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent', color: (tabMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#666', boxShadow: (tabMode2==='tab' && activeTab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none', borderBottom: (tabMode2==='tab' && activeTab===t.id) ? '2px solid #e8587a' : '2px solid transparent', }">
      <span style="font-size:14px;">
        {{ t.icon }}
      </span>
      <span>
        {{ t.label }}
      </span>
      <span v-if="t.count !== undefined" :style="{ fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', background: (tabMode2==='tab' && activeTab===t.id) ? '#e8587a' : '#e5e7eb', color: (tabMode2==='tab' && activeTab===t.id) ? '#fff' : '#666', minWidth:'18px', textAlign:'center', }">
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
        boxShadow: tabMode2===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none',
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
    <!-- ===== ■.■.■. 클레임 진행 상태 흐름 ======================================== -->
    <div v-if="!cfIsNew" style="margin-bottom:20px;padding:16px 18px;background:#f6f6f6;border-radius:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
        <span :style="{
            fontSize:'11px',padding:'3px 10px',borderRadius:'10px',color:'#fff',fontWeight:800,
            background: CLAIM_TYPE_COLOR[form.claimTypeCd] || '#9ca3af',
            }">
          ↩ {{ form.claimTypeCd }}
        </span>
        <span style="font-size:13px;font-weight:700;color:#222;">
          {{ form.claimId }}
        </span>
        <span v-if="form.requestDate" style="font-size:11px;color:#888;">
          신청일: {{ form.requestDate }}
        </span>
        <span v-if="form.reasonDetail" style="font-size:11px;color:#888;margin-left:auto;">
          사유: {{ form.reasonDetail }}
        </span>
      </div>
      <div style="display:flex;align-items:flex-start;overflow-x:auto;">
        <template v-for="(step, idx) in cfClaimSteps" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;min-width:80px;flex:1;">
            <div :style="{
                width: idx === cfCurrentStepIdx ? '14px' : '10px',
                height: idx === cfCurrentStepIdx ? '14px' : '10px',
                borderRadius:'50%', marginBottom:'6px', flexShrink:0, transition:'all .15s',
                boxShadow: idx === cfCurrentStepIdx ? '0 0 0 3px '+(CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af')+'40' : 'none',
                background: idx <= cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb',
                }">
            </div>
            <div :style="{
                fontSize:'11.5px', fontWeight: idx === cfCurrentStepIdx ? 800 : 600,
                color: idx === cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : (idx < cfCurrentStepIdx ? '#444' : '#bbb'),
                whiteSpace:'nowrap', textAlign:'center',
                }">
              {{ step }}
            </div>
            <span v-if="step==='수거중' && form.returnTrackingNo" @click="handleBtnAction('tracking-open', { courier: form.returnCourierCd, trackingNo: form.returnTrackingNo })" title="수거 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
            {{ (form.returnCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}수거 🔍
          </span>
          <span v-if="step==='완료' && form.exchangeTrackingNo" @click="handleBtnAction('tracking-open', { courier: form.exchangeCourierCd, trackingNo: form.exchangeTrackingNo })" title="발송 배송조회" style="margin-top:4px;padding:1px 7px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:0.7rem;font-weight:700;cursor:pointer;user-select:none;">
          {{ (form.exchangeCourierCd||'').replace('대한통운','').replace('택배','') || 'CJ' }}발송 🔍
        </span>
      </div>
      <div v-if="idx < cfClaimSteps.length - 1"
              :style="{flex:'1', height:'2px', minWidth:'12px', marginTop:'6px',
              background: idx < cfCurrentStepIdx ? (CLAIM_TYPE_COLOR[form.claimTypeCd]||'#9ca3af') : '#bbb'}">
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
  <!-- ===== ■.■.■.■. 주문ID + 보기 버튼 ====================================== -->
  <template #orderId>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="form-control" v-model="form.orderId" placeholder="ORD-2026-XXX" :readonly="cfDtlMode" :class="errors.orderId ? 'is-invalid' : ''" />
      <span v-if="form.orderId" class="ref-link" @click="handleBtnAction('form-orderRef')">
        보기
      </span>
    </div>
    <span v-if="errors.orderId" class="field-error">
      {{ errors.orderId }}
    </span>
  </template>
  <!-- ===== ■.■.■.■. 회원ID + 보기 버튼 ====================================== -->
  <template #memberId>
    <div style="display:flex;gap:8px;align-items:center;">
      <input class="form-control" v-model="form.memberId" placeholder="회원 ID" :readonly="cfDtlMode" />
      <span v-if="form.memberId" class="ref-link" @click="handleBtnAction('form-memberRef')">
        보기
      </span>
    </div>
  </template>
</bo-form-area>
</div>
<!-- ===== ■.■. 클레임항목목록 탭 ============================================= -->
<div v-if="!cfIsNew && showTab('items')" class="card" style="padding:20px;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  ↩ 클레임항목
  <span class="tab-count">
    {{ claimItems.length }}
  </span>
</div>
<div v-if="form.claimTypeCd==='교환'" style="display:flex;justify-content:flex-end;margin-bottom:10px;">
  <button class="btn btn-secondary btn-sm" @click="handleBtnAction('claimItems-toggleExpandAll')">
    {{ cfAllExpanded ? '▲ 교환품 모두접기' : '▼ 교환품 모두펼치기' }}
  </button>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="claimItemGridColumns" :rows="claimItems"
        :is-expanded="fnItemExpanded"
        empty-text="클레임 항목 정보가 없습니다.">
  <template #cell-prodNm="{ row, idx }">
    <td style="font-size:12px;">
      <span v-if="form.claimTypeCd==='교환'" @click="handleSelectAction('claimItems-rowToggleExpand', idx)" style="cursor:pointer;font-size:11px;color:#3b82f6;font-weight:800;user-select:none;margin-right:6px;" :title="isExpanded(idx)?'교환품 숨기기':'교환품 보기'">
        {{ isExpanded(idx) ? '▼' : '▶' }}
      </span>
      {{ row.prodNm }}
    </td>
  </template>
  <template #row-expand="{ row, colspan }">
    <td :colspan="colspan" style="padding:10px 14px;background:#f0f7ff;">
      <bo-form-area :columns="itemExpandColumns" :form="row" :cols="3" readonly label-left :show-actions="false">
        <template #tracking>
          <div class="readonly-field" @click="handleBtnAction('tracking-open', { courier: getExchangedItem(row).courier, trackingNo: getExchangedItem(row).trackingNo })" style="cursor:pointer;padding:2px 8px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;border-radius:4px;font-size:11px;font-weight:700;display:inline-block;">
            {{ getExchangedItem(row).courier }} · {{ getExchangedItem(row).trackingNo || '-' }} 🔍
          </div>
        </template>
      </bo-form-area>
    </td>
  </template>
  <template #tfoot>
    <tr style="background:#fafafa;font-weight:700;">
      <td style="width:36px;">
      </td>
      <td colspan="4" style="text-align:right;color:#555;">
        합계
      </td>
      <td style="width:90px;text-align:right;color:#666;">
        {{ fmt(claimItems.reduce((s,x)=>s+(x.salePrice||x.price||0),0)) }}
      </td>
      <td style="width:80px;">
      </td>
      <td style="width:90px;text-align:right;color:#d84315;">
        -{{ fmt(claimItems.reduce((s,x)=>s+(x.discAmount||0),0)) }}
      </td>
      <td style="width:100px;text-align:right;color:#1a1a1a;">
        {{ fmt(claimItems.reduce((s,x)=>s+(x.price||0),0)) }}
      </td>
      <td colspan="3">
      </td>
    </tr>
  </template>
</bo-grid>
</div>
<!-- ===== □.□. 클레임항목목록 탭 ============================================= -->
<!-- ===== ■.■. 결제정보 탭 ================================================ -->
<div v-if="!cfIsNew && showTab('payment')" class="card" style="padding:20px;">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
  💳 결제정보
  <span class="tab-count">
    {{ cfPaymentList.length }}
  </span>
</div>
<!-- ===== ■.■.■. 목록 영역 =============================================== -->
<bo-grid bare :columns="paymentGridColumns" :rows="cfPaymentList" empty-text="결제·환불 정보가 없습니다.">
</bo-grid>
</div>
<!-- ===== □.□. 결제정보 탭 ================================================ -->
<!-- ===== ■.■. 상태변경이력 탭 ============================================== -->
<div v-if="!cfIsNew && showTab('hist')" class="card">
<div v-if="tabMode2!=='tab'" class="dtl-tab-card-title" style="margin-bottom:10px;padding:0 0 10px 0;">
  🕒 상태변경이력
  <span class="tab-count">
    {{ cfStatusHistList.length }}
  </span>
</div>
<od-claim-hist :claim-id="form.claimId" :navigate="navigate" />
</div>
<!-- ===== □.□. 상태변경이력 탭 ============================================== -->
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
