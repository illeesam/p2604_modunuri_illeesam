/* ZdSimulOrderMng — 주문 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, ref, computed, onMounted } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const STATUS_FLOW    = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'COMPLT'];
  const STATUS_LABELS  = { PENDING: '결제대기', PAID: '결제완료', PREPARING: '준비중', SHIPPED: '배송중', COMPLT: '완료' };
  const PROMO_MODES    = [
    { value: 'none',   label: '없음' },
    { value: 'random', label: '랜덤 선택' },
    { value: 'fixed',  label: '직접 지정' },
  ];
  const PAY_METHODS    = [
    { value: 'CARD',       label: '신용카드',  color: '#2563eb' },
    { value: 'TOSS_PAY',   label: '토스페이',  color: '#3b82f6' },
    { value: 'KAKAO_PAY',  label: '카카오페이', color: '#f59e0b' },
    { value: 'NAVER_PAY',  label: '네이버페이', color: '#22c55e' },
    { value: 'BANK',       label: '무통장입금', color: '#6366f1' },
    { value: 'VBANK',      label: '가상계좌',  color: '#94a3b8' },
  ];
  const ADDR_LIST      = [
    { zipCode: '06236', addr: '서울 강남구 테헤란로 152', addrDtl: 'GS타워 15층' },
    { zipCode: '03721', addr: '서울 서대문구 연세로 50', addrDtl: '연세대학교 정문' },
    { zipCode: '14068', addr: '경기 안양시 만안구 안양로 123', addrDtl: '안양역 인근' },
    { zipCode: '21565', addr: '인천 남동구 정각로 29', addrDtl: '인천시청 앞' },
    { zipCode: '61452', addr: '광주 북구 용봉로 77', addrDtl: '전남대학교 정문' },
  ];
  const RECEIVER_NAMES = ['홍길동', '이민지', '박서연', '김주혁', '최윤아', '정다은', '강민준', '조현우'];
  const UPDATE_ACTIONS = [
    { value: 'advance', label: '상태 진행' },
    { value: 'cancel',  label: '강제 취소' },
    { value: 'memo',    label: '메모 추가' },
  ];

  window.ZdSimulOrderMng = {
    name: 'ZdSimulOrderMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        itemCountMin: 1,
        itemCountMax: 4,
        amtMin: 10000,
        amtMax: 300000,
        payMethods: ['CARD', 'TOSS_PAY'],
        createStatus: 'PENDING',
        advanceSteps: 1,
        randomAddr: true,
        addDlivFee: true,
        dlivFeeAmt: 3000,
        updateAction: 'advance',
        fromStatus: 'PENDING',
        /* 고정 지정 */
        fixedMemberId: '',
        fixedMemberNm: '',
        fixedProds: [],   /* [{ prodId, prodNm, salePrice, qty }] */
        fixedOrderId: '',
        /* 결제수단 가중치 */
        fixedPayMethod: '__weighted__',
        payMethodWeights: { CARD: 45, TOSS_PAY: 20, KAKAO_PAY: 15, NAVER_PAY: 10, BANK: 7, VBANK: 3 },
        /* 프로모션 설정 */
        promoOpen: true,
        couponMode: 'random',
        fixedCouponId: '',
        fixedCouponNm: '',
        couponApplyRate: 40,
        discntMode: 'none',
        fixedDiscntId: '',
        fixedDiscntNm: '',
        discntApplyRate: 30,
        saveMode: 'none',
        saveApplyRate: 20,
        saveDeductMin: 10,
        saveDeductMax: 50,
        giftApplyRate: 0,
      });

      /* ── picker 모달 상태 ──────────────────────────── */
      const memberPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const prodPicker   = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const orderPicker  = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const couponPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const discntPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const onOpenMemberPicker = async () => {
        memberPicker.show = true;
        memberPicker.searchValue = '';
        await _loadMemberPicker();
      };
      const onOpenProdPicker = async () => {
        prodPicker.show = true;
        prodPicker.searchValue = '';
        await _loadProdPicker();
      };
      const onOpenOrderPicker = async () => {
        orderPicker.show = true;
        orderPicker.searchValue = '';
        await _loadOrderPicker();
      };
      const onOpenCouponPicker = async () => {
        couponPicker.show = true;
        couponPicker.searchValue = '';
        await _loadCouponPicker();
      };
      const onOpenDiscntPicker = async () => {
        discntPicker.show = true;
        discntPicker.searchValue = '';
        await _loadDiscntPicker();
      };

      const _loadMemberPicker = async () => {
        memberPicker.loading = true;
        try {
          const res = await boApiSvc.mbMember.getPage({
            pageNo: 1, pageSize: 30, memberStatusCd: 'ACTIVE',
            ...(memberPicker.searchValue ? { searchValue: memberPicker.searchValue, searchType: 'memberId,memberNm,loginId' } : {}),
          });
          memberPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { memberPicker.rows = []; }
        memberPicker.loading = false;
      };
      const _loadProdPicker = async () => {
        prodPicker.loading = true;
        try {
          const res = await boApiSvc.pdProd.getPage({
            pageNo: 1, pageSize: 30,
            ...(prodPicker.searchValue ? { searchValue: prodPicker.searchValue, searchType: 'prodId,prodNm' } : {}),
          });
          prodPicker.rows = res.data?.data?.pageList || [];
        } catch (err) { prodPicker.rows = []; props.showToast('상품 조회 실패: ' + (err?.response?.data?.message || err?.message || ''), 'error', 0); }
        prodPicker.loading = false;
      };
      const _loadOrderPicker = async () => {
        orderPicker.loading = true;
        try {
          const res = await boApiSvc.odOrder.getPage({
            pageNo: 1, pageSize: 30,
            ...(orderPicker.searchValue ? { searchValue: orderPicker.searchValue, searchType: 'orderId' } : {}),
          });
          orderPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { orderPicker.rows = []; }
        orderPicker.loading = false;
      };
      const _loadCouponPicker = async () => {
        couponPicker.loading = true;
        try {
          const res = await boApiSvc.pmCoupon.getPage({
            pageNo: 1, pageSize: 30,
            ...(couponPicker.searchValue ? { searchValue: couponPicker.searchValue } : {}),
          });
          couponPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { couponPicker.rows = []; }
        couponPicker.loading = false;
      };
      const _loadDiscntPicker = async () => {
        discntPicker.loading = true;
        try {
          const res = await boApiSvc.pmDiscnt.getPage({
            pageNo: 1, pageSize: 30,
            ...(discntPicker.searchValue ? { searchValue: discntPicker.searchValue } : {}),
          });
          discntPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { discntPicker.rows = []; }
        discntPicker.loading = false;
      };

      const onSelectMember = (row) => {
        domCfg.fixedMemberId = row.memberId;
        const nm = row.memberNm || row.loginId || row.memberId;
        domCfg.fixedMemberNm = window.ZdSimulBase?._sanitize ? window.ZdSimulBase._sanitize(nm) : nm;
        memberPicker.show = false;
      };
      const _prodEntry = (row) => {
        const opts = row.prodOpts || [];
        /* pd_prod_opt_type 흡수 후: prod_opt_type1_nm / prod_opt_type2_nm 직접 컬럼 사용 */
        /* optSelects: level=1 옵션, level=2 옵션 각각 구성 */
        const optSelects = [];
        if (row.prodOptType1Nm) {
          optSelects.push({
            typeNm:     row.prodOptType1Nm,
            choices:    opts.filter(o => o.prodOptTypeLevel === 1 || o.prodOptTypeLevel === '1')
                            .map(o => ({ id: o.prodOptId, nm: o.prodOptNm || o.prodOptVal || '' })),
            selectedId: '',
          });
        }
        if (row.prodOptType2Nm) {
          optSelects.push({
            typeNm:     row.prodOptType2Nm,
            choices:    opts.filter(o => o.prodOptTypeLevel === 2 || o.prodOptTypeLevel === '2')
                            .map(o => ({ id: o.prodOptId, nm: o.prodOptNm || o.prodOptVal || '' })),
            selectedId: '',
          });
        }
        return {
          prodId:      row.prodId,
          prodNm:      row.prodNm || row.prodId,
          prodTypeCd:  row.prodTypeCd || 'SINGLE',
          salePrice:   row.salePrice || 0,
          qty:         1,
          optTypeNms:  [row.prodOptType1Nm, row.prodOptType2Nm].filter(Boolean),
          optSelects,  /* 옵션 드롭다운 상태 */
        };
      };
      const onSelectProd = (row) => {
        const already = domCfg.fixedProds.find(p => p.prodId === row.prodId);
        if (!already) domCfg.fixedProds.push(_prodEntry(row));
        prodPicker.show = false;
      };
      const onRemoveFixedProd = (idx) => { domCfg.fixedProds.splice(idx, 1); };
      const onSelectOrder = (row) => {
        domCfg.fixedOrderId = row.orderId;
        orderPicker.show = false;
      };

      /* 랜덤 1건 즉시 pick */
      const onPickRandomMember = async () => {
        try {
          const rows = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
          if (!rows.length) return props.showToast('조회된 회원 없음', 'error');
          const row = rows[Math.floor(Math.random() * rows.length)];
          onSelectMember(row);
        } catch (_) { props.showToast('회원 랜덤 조회 실패', 'error'); }
      };
      /* type: 'SINGLE_NO_OPT'(단품) | 'SINGLE_OPT'(옵션) | 'SET'(세트) | 'GROUP'(묶음) */
      const onPickRandomProd = async (type) => {
        try {
          const params = { pageNo: 1, pageSize: 100 };
          if (type === 'SET')   params.prodTypeCd = 'SET';
          else if (type === 'GROUP') params.prodTypeCd = 'GROUP';
          else params.prodTypeCd = 'SINGLE';
          const rows = (await boApiSvc.pdProd.getPage(params)).data?.data?.pageList || [];
          let pool = rows;
          if (type === 'SINGLE_NO_OPT') {
            pool = rows.filter(r => !r.prodOptType1Nm);
          } else if (type === 'SINGLE_OPT') {
            pool = rows.filter(r => !!r.prodOptType1Nm);
          }
          if (!pool.length) {
            const lbl = type === 'SINGLE_NO_OPT' ? '단품' : type === 'SINGLE_OPT' ? '옵션상품' : type === 'SET' ? '세트' : type === 'GROUP' ? '묶음' : '';
            return props.showToast((lbl ? lbl + ' 상품이 없습니다.' : '조회된 상품 없음'), 'error');
          }
          const row = pool[Math.floor(Math.random() * pool.length)];
          const already = domCfg.fixedProds.find(p => p.prodId === row.prodId);
          if (!already) {
            domCfg.fixedProds.push(_prodEntry(row));
          } else {
            props.showToast('이미 추가된 상품입니다: ' + (row.prodNm || row.prodId), 'error');
          }
        } catch (err) { props.showToast('상품 랜덤 조회 실패: ' + (err?.response?.data?.message || err?.message || ''), 'error', 0); }
      };
      const onPickRandomOrder = async () => {
        try {
          const rows = (await boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 50 })).data?.data?.pageList || [];
          if (!rows.length) return props.showToast('조회된 주문 없음', 'error');
          const row = rows[Math.floor(Math.random() * rows.length)];
          onSelectOrder(row);
        } catch (_) { props.showToast('주문 랜덤 조회 실패', 'error'); }
      };
      const onSelectCoupon = (row) => {
        domCfg.fixedCouponId = row.couponId;
        domCfg.fixedCouponNm = row.couponNm || row.couponId;
        couponPicker.show = false;
      };
      const onSelectDiscnt = (row) => {
        domCfg.fixedDiscntId = row.discntId;
        domCfg.fixedDiscntNm = row.discntNm || row.discntId;
        discntPicker.show = false;
      };

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickPayMethod = () => {
        if (domCfg.fixedPayMethod && domCfg.fixedPayMethod !== '__weighted__') return domCfg.fixedPayMethod;
        const w = domCfg.payMethodWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const p of PAY_METHODS) { r -= Number(w[p.value] || 0); if (r <= 0) return p.value; }
        return PAY_METHODS[0].value;
      };

      const simul = useSimulSetup({
        domain: '주문',
        uiNm: '주문 시뮬레이터',
        label: '시뮬주문',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, simulYn, randInt, pick }) => {
          if (mode === 'create') {
            /* 상품: 고정 지정 or 랜덤 */
            let prods = [];
            if (domCfg.fixedProds && domCfg.fixedProds.length) {
              prods = domCfg.fixedProds.map(p => ({
                prodId: p.prodId, prodNm: p.prodNm, salePrice: p.salePrice || domCfg.amtMin, _fixedQty: p.qty,
                /* 선택된 옵션값 목록 (선택된 항목만) */
                selectedOpts: (p.optSelects || [])
                  .filter(os => os.selectedId)
                  .map(os => ({ prodOptTypeId: os.typeId, prodOptTypeNm: os.typeNm, prodOptId: os.selectedId, prodOptNm: (os.choices.find(c => c.id === os.selectedId) || {}).nm || '' })),
              }));
            } else {
              const cnt = randInt(domCfg.itemCountMin, domCfg.itemCountMax);
              const randRes = await boApi.post('/bo/zd/simul/order/rand-prod',
                { count: Math.max(cnt, 5) }, coUtil.cofApiHdr('주문시뮬', '상품조회'));
              prods = randRes?.data?.data?.prods || [];
            }

            /* 회원: 고정 지정 or 랜덤 */
            let member;
            if (domCfg.fixedMemberId) {
              member = { memberId: domCfg.fixedMemberId, memberNm: domCfg.fixedMemberNm };
            } else {
              const members = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
              if (!members.length) return { ok: false, reason: 'ACTIVE 회원 없음' };
              member = pick(members);
            }

            if (!prods.length) return { ok: false, reason: '판매중 상품 없음' };

            const items   = [];
            let   totalAmt = 0;
            const isFixed = !!(domCfg.fixedProds && domCfg.fixedProds.length);
            if (isFixed) {
              /* 고정 상품 목록: 지정된 각 상품을 지정 수량으로 */
              for (const p of prods) {
                const qty = p._fixedQty || 1;
                const price = p.salePrice || domCfg.amtMin;
                const item = { prodId: p.prodId, qty, unitPrice: Math.round(price), rowAmt: Math.round(price) * qty };
                if (p.selectedOpts && p.selectedOpts.length) item.selectedOpts = p.selectedOpts;
                items.push(item);
                totalAmt += Math.round(price) * qty;
              }
            } else {
              const cnt = randInt(domCfg.itemCountMin, domCfg.itemCountMax);
              for (let i = 0; i < cnt; i++) {
                const p   = pick(prods);
                const qty = randInt(1, 3);
                const price = Math.min(Math.max(domCfg.amtMin / cnt, p.salePrice || randInt(domCfg.amtMin, domCfg.amtMax)), domCfg.amtMax / cnt);
                items.push({ prodId: p.prodId, qty, unitPrice: Math.round(price), rowAmt: Math.round(price) * qty });
                totalAmt += Math.round(price) * qty;
              }
            }
            const dlivFee = domCfg.addDlivFee && totalAmt < 50000 ? domCfg.dlivFeeAmt : 0;
            const payMethod = _pickPayMethod();
            const addr = domCfg.randomAddr ? pick(ADDR_LIST) : ADDR_LIST[0];

            /* ── 프로모션 적용 판정 ── */
            const promos = {
              couponId: null, couponNm: null, couponDiscntAmt: 0,
              discntId: null, discntNm: null, discntAmt: 0,
              saveDeductAmt: 0,
              giftProdId: null,
            };
            if (domCfg.promoOpen) {
              /* 쿠폰 */
              if (domCfg.couponMode === 'fixed' && domCfg.fixedCouponId) {
                promos.couponId = domCfg.fixedCouponId;
                promos.couponNm = domCfg.fixedCouponNm;
              } else if (domCfg.couponMode === 'random' && Math.random() * 100 < domCfg.couponApplyRate) {
                try {
                  const cRes = await boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 30 });
                  const cList = cRes.data?.data?.pageList || [];
                  if (cList.length) {
                    const c = pick(cList);
                    promos.couponId = c.couponId;
                    promos.couponNm = c.couponNm || c.couponId;
                  }
                } catch (_) {}
              }
              if (promos.couponId) {
                /* 쿠폰 할인금: 정률이면 총금액의 10~20%, 정액이면 1000~5000원 시뮬 */
                promos.couponDiscntAmt = Math.round(totalAmt * (randInt(10, 20) / 100) / 100) * 100;
              }

              /* 할인 */
              if (domCfg.discntMode === 'fixed' && domCfg.fixedDiscntId) {
                promos.discntId = domCfg.fixedDiscntId;
                promos.discntNm = domCfg.fixedDiscntNm;
              } else if (domCfg.discntMode === 'random' && Math.random() * 100 < domCfg.discntApplyRate) {
                try {
                  const dRes = await boApiSvc.pmDiscnt.getPage({ pageNo: 1, pageSize: 30 });
                  const dList = dRes.data?.data?.pageList || [];
                  if (dList.length) {
                    const d = pick(dList);
                    promos.discntId = d.discntId;
                    promos.discntNm = d.discntNm || d.discntId;
                  }
                } catch (_) {}
              }
              if (promos.discntId) {
                promos.discntAmt = Math.round(totalAmt * (randInt(5, 15) / 100) / 100) * 100;
              }

              /* 적립금 차감 */
              if (domCfg.saveMode !== 'none' && Math.random() * 100 < domCfg.saveApplyRate) {
                const rate = randInt(domCfg.saveDeductMin, domCfg.saveDeductMax) / 100;
                promos.saveDeductAmt = Math.round(totalAmt * rate / 100) * 100;
              }

              /* 사은품 */
              if (domCfg.giftApplyRate > 0 && Math.random() * 100 < domCfg.giftApplyRate) {
                try {
                  const gRes = await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 20, prodTypeCd: 'GIFT' });
                  const gList = gRes.data?.data?.pageList || [];
                  if (gList.length) promos.giftProdId = pick(gList).prodId;
                } catch (_) {}
              }
            }

            const totalDiscnt = promos.couponDiscntAmt + promos.discntAmt + promos.saveDeductAmt;
            const finalPayAmt = Math.max(totalAmt + dlivFee - totalDiscnt, 0);

            const body = {
              memberId: member.memberId, memberNm: member.memberNm,
              orderStatusCd: domCfg.createStatus,
              payMethodCd: payMethod,
              orderAmt: totalAmt, dlivFee,
              discntAmt: totalDiscnt,
              totalPayAmt: finalPayAmt,
              receiverNm: pick(RECEIVER_NAMES),
              receiverPhone: '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999)),
              zipCode: addr.zipCode, dlivAddr: addr.addr, dlivAddrDtl: addr.addrDtl,
              orderItems: items,
              promos,
              simulYn: simulYn || 'Y',
            };
            body['_preview_[orderItems](' + items.length + '개)'] = items.map(it => ({
              prodId: it.prodId, qty: it.qty, unitPrice: it.unitPrice, rowAmt: it.rowAmt,
            }));
            if (promos.couponId || promos.discntId || promos.saveDeductAmt || promos.giftProdId) {
              body['_preview_[promos]'] = {
                쿠폰: promos.couponNm || '없음',
                쿠폰할인: promos.couponDiscntAmt ? promos.couponDiscntAmt.toLocaleString('ko-KR') + '원' : '-',
                할인: promos.discntNm || '없음',
                할인금액: promos.discntAmt ? promos.discntAmt.toLocaleString('ko-KR') + '원' : '-',
                적립금차감: promos.saveDeductAmt ? promos.saveDeductAmt.toLocaleString('ko-KR') + '원' : '-',
                사은품: promos.giftProdId || '없음',
                총할인: totalDiscnt.toLocaleString('ko-KR') + '원',
                최종결제: finalPayAmt.toLocaleString('ko-KR') + '원',
              };
            }
            const res = await boApi.post('/bo/zd/simul/order/create', body, coUtil.cofApiHdr('주문시뮬', '생성'));
            const id  = res?.data?.data?.orderId || '-';
            return {
              ok: true,
              desc: member.memberNm + ' | ' + cnt + '개 상품 | ' + finalPayAmt.toLocaleString('ko-KR') + '원' + (totalDiscnt > 0 ? ' (할인 ' + totalDiscnt.toLocaleString('ko-KR') + '원)' : ''),
              meta: { id, payMethod, totalAmt, dlivFee, totalDiscnt, finalPayAmt, memberId: member.memberId, params: body },
            };
          } else {
            /* 수정: 고정 주문 or 랜덤 */
            let target;
            if (domCfg.fixedOrderId) {
              target = { orderId: domCfg.fixedOrderId, orderStatusCd: domCfg.fromStatus || 'PENDING' };
            } else {
              const action = domCfg.updateAction;
              const excl   = action === 'cancel' ? [] : ['COMPLT'];
              const q      = { pageNo: 1, pageSize: 50 };
              if (domCfg.fromStatus) q.orderStatusCd = domCfg.fromStatus;
              const list = (await boApiSvc.odOrder.getPage(q)).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 주문 없음' };
              target = pick(list.filter(o => !excl.includes(o.orderStatusCd)));
              if (!target) return { ok: false, reason: '조건에 맞는 주문 없음' };
            }
            const action = domCfg.updateAction;
            let body = {}, desc = '';
            if (action === 'advance') {
              const idx = STATUS_FLOW.indexOf(target.orderStatusCd);
              const nst = STATUS_FLOW[Math.min(idx + (domCfg.advanceSteps || 1), STATUS_FLOW.length - 1)];
              body.orderStatusCd = nst; desc = (STATUS_LABELS[target.orderStatusCd] || target.orderStatusCd) + ' → ' + STATUS_LABELS[nst];
            } else if (action === 'cancel') {
              body.orderStatusCd = 'CANCEL'; desc = '강제 취소';
            } else {
              body.orderMemo = '[시뮬] ' + new Date().toLocaleTimeString('ko-KR'); desc = '메모 추가';
            }
            const updateBody = { orderId: target.orderId, ...body };
            await boApi.post('/bo/zd/simul/order/update', updateBody, coUtil.cofApiHdr('주문시뮬', '수정'));
            return { ok: true, desc: target.orderId + ' ' + desc, meta: { id: target.orderId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const cfPayMethodTotal = computed(() => Object.values(domCfg.payMethodWeights).reduce((a, b) => a + Number(b), 0) || 1);

      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        makeRangeCol('itemCountMin', 'itemCountMax', '아이템 수 범위', 1, 20, '개'),
        makeRangeCol('amtMin', 'amtMax', '주문 금액 범위', 10000, 300000, '원'),
        { key: 'createStatus',  label: '초기 상태', type: 'select',
          options: STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] })) },
        { key: 'addDlivFee',    label: '배송비 적용',    type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        { key: 'dlivFeeAmt',    label: '배송비',         type: 'number', hint: '원', visible: (f) => !!f.addDlivFee },
        { key: 'randomAddr',    label: '주소 랜덤',      type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'fromStatus',   label: '대상 상태', type: 'select',
          options: STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] })),
          visible: (f) => f.updateAction === 'advance' },
        { key: 'advanceSteps', label: '진행 단계', type: 'select',
          options: [{ value: 1, label: '1단계' }, { value: 2, label: '2단계' }, { value: 3, label: '3단계' }],
          visible: (f) => f.updateAction === 'advance' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'itemCountMin', maxKey: 'itemCountMax' },
        { minKey: 'amtMin',       maxKey: 'amtMax'       },
      ]);

      /* 상품유형 배지 — 인자 p(fixedProds 항목) 직접 받아 &&없이 처리 */
      const fnProdBadgeStyle = (p) => {
        const t = p.prodTypeCd; const o = p.optTypeNms && p.optTypeNms.length > 0;
        if (t === 'SET')   return 'display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap;background:#fdf4ff;color:#9333ea;border:1px solid #e9d5ff;';
        if (t === 'GROUP') return 'display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap;background:#fffbeb;color:#b45309;border:1px solid #fde68a;';
        if (t === 'GIFT')  return 'display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap;background:#fdf2f8;color:#ec4899;border:1px solid #fbcfe8;';
        return o
          ? 'display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;'
          : 'display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;';
      };
      const fnProdBadgeLabel = (p) => {
        const t = p.prodTypeCd; const o = p.optTypeNms && p.optTypeNms.length > 0;
        if (t === 'SET')   return '세트';
        if (t === 'GROUP') return '묶음';
        if (t === 'GIFT')  return '사은품';
        return o ? '옵션' : '단품';
      };
      const fnProdHasOpt = (p) => !!(p.optTypeNms && p.optTypeNms.length);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        cfPayMethodTotal, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        STATUS_FLOW, STATUS_LABELS, PAY_METHODS, PROMO_MODES,
        /* picker */
        memberPicker, prodPicker, orderPicker, couponPicker, discntPicker,
        onOpenMemberPicker, onOpenProdPicker, onOpenOrderPicker, onOpenCouponPicker, onOpenDiscntPicker,
        onPickRandomMember, onPickRandomProd, onPickRandomOrder,
        onSelectMember, onSelectProd, onSelectOrder, onSelectCoupon, onSelectDiscnt,
        onRemoveFixedProd,
        _loadMemberPicker, _loadProdPicker, _loadOrderPicker, _loadCouponPicker, _loadDiscntPicker,
        fnProdBadgeStyle, fnProdBadgeLabel, fnProdHasOpt,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🛒 주문 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#2563eb,#60a5fa)"
    accent-active="background:#eff6ff;border:1.5px solid #2563eb;color:#1d4ed8;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 시뮬 대상 고정 지정 -->
  <div class="card" style="padding:12px 16px;margin-top:12px;">
    <div class="list-title">🎯 시뮬 대상 지정</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-top:10px;">
      <!-- 회원/주문 지정 (왼쪽 열) -->
      <div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">👤 주문 회원 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedMemberNm || domCfg.fixedMemberId || ''" readonly
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;" />
          <button v-if="domCfg.fixedMemberId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedMemberId='';domCfg.fixedMemberNm=''">✕</button>
          <button class="btn" style="height:28px;padding:0 8px;font-size:11px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;"
            @click="onPickRandomMember">랜덤</button>
          <button class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenMemberPicker">선택</button>
        </div>
        <div v-if="domCfg.fixedMemberId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedMemberId }}</div>
        <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 ACTIVE 회원 랜덤</div>
        <!-- 수정 모드: 대상 주문 지정 -->
        <div v-if="cfg.mode==='update'" style="margin-top:10px;">
          <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">🛒 수정 대상 주문 지정</div>
          <div style="display:flex;gap:5px;align-items:center;">
            <input type="text" :value="domCfg.fixedOrderId || ''" readonly
              style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;font-family:monospace;" />
            <button v-if="domCfg.fixedOrderId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
              @click="domCfg.fixedOrderId=''">✕</button>
            <button class="btn" style="height:28px;padding:0 8px;font-size:11px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;"
              @click="onPickRandomOrder">랜덤</button>
            <button class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenOrderPicker">선택</button>
          </div>
          <div v-if="!domCfg.fixedOrderId" style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 조건에 맞는 주문 랜덤</div>
        </div>
      </div>
      <!-- 상품 지정 (N개, 그리드) -->
      <div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:600;color:#475569;">📦 주문 상품 지정</span>
          <span style="font-size:10px;color:#64748b;margin-left:2px;">랜덤 추가</span>
          <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:4px;"
            @click="onPickRandomProd('SINGLE_NO_OPT')">단품</button>
          <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:4px;"
            @click="onPickRandomProd('SINGLE_OPT')">옵션</button>
          <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#fdf4ff;color:#9333ea;border:1px solid #e9d5ff;border-radius:4px;"
            @click="onPickRandomProd('SET')">세트</button>
          <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#fffbeb;color:#b45309;border:1px solid #fde68a;border-radius:4px;"
            @click="onPickRandomProd('GROUP')">묶음</button>
          <span style="font-size:10px;color:#cbd5e1;margin:0 2px;">|</span>
          <button class="btn btn_detail" style="height:22px;padding:0 8px;font-size:10px;" @click="onOpenProdPicker">선택 추가</button>
          <button v-if="domCfg.fixedProds.length" class="btn" style="height:22px;padding:0 8px;font-size:10px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;margin-left:auto;"
            @click="domCfg.fixedProds=[]">전체 삭제</button>
        </div>
        <table v-if="domCfg.fixedProds.length" style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="width:26px;padding:4px 6px;border:1px solid #e2e8f0;text-align:center;font-weight:600;color:#475569;">No</th>
              <th style="width:46px;padding:4px 5px;border:1px solid #e2e8f0;text-align:center;font-weight:600;color:#475569;">유형</th>
              <th style="padding:4px 8px;border:1px solid #e2e8f0;text-align:left;font-weight:600;color:#475569;">상품명</th>
              <th style="width:80px;padding:4px 6px;border:1px solid #e2e8f0;text-align:right;font-weight:600;color:#475569;">판매가</th>
              <th style="width:70px;padding:4px 6px;border:1px solid #e2e8f0;text-align:center;font-weight:600;color:#475569;">수량</th>
              <th style="width:28px;padding:4px 6px;border:1px solid #e2e8f0;text-align:center;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in domCfg.fixedProds" :key="p.prodId">
              <td style="padding:3px 6px;border:1px solid #e2e8f0;text-align:center;color:#94a3b8;">{{ i+1 }}</td>
              <td style="padding:3px 5px;border:1px solid #e2e8f0;text-align:center;">
                <span :style="fnProdBadgeStyle(p)">{{ fnProdBadgeLabel(p) }}</span>
              </td>
              <td style="padding:3px 8px;border:1px solid #e2e8f0;min-width:0;">
                <div style="display:flex;align-items:center;gap:5px;min-width:0;">
                  <div style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="p.prodNm + ' (' + p.prodId + ')'">{{ p.prodNm }}</div>
                  <!-- 옵션 드롭다운 (옵션상품만, 한 줄) -->
                  <div v-if="fnProdHasOpt(p)" style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
                    <template v-for="(os, oi) in p.optSelects" :key="os.typeId">
                      <span v-if="oi > 0" style="font-size:10px;color:#cbd5e1;">/</span>
                      <select v-model="os.selectedId"
                        style="height:20px;font-size:10px;border:1px solid #c4b5fd;border-radius:3px;padding:0 3px;background:#faf5ff;color:#6d28d9;max-width:80px;">
                        <option value="">{{ os.typeNm }}</option>
                        <option v-for="c in os.choices" :key="c.id" :value="c.id">{{ c.nm }}</option>
                      </select>
                    </template>
                  </div>
                </div>
              </td>
              <td style="padding:3px 6px;border:1px solid #e2e8f0;text-align:right;color:#334155;">{{ (p.salePrice||0).toLocaleString() }}원</td>
              <td style="padding:2px 4px;border:1px solid #e2e8f0;text-align:center;">
                <input type="number" min="1" max="99" v-model.number="p.qty"
                  style="width:52px;height:22px;text-align:center;border:1px solid #cbd5e1;border-radius:3px;font-size:11px;padding:0 4px;" />
              </td>
              <td style="padding:2px 4px;border:1px solid #e2e8f0;text-align:center;">
                <button class="btn" style="height:20px;width:20px;padding:0;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:3px;line-height:1;"
                  @click="onRemoveFixedProd(i)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else style="font-size:10px;color:#94a3b8;padding:4px 0;">미지정 시 판매중 상품 랜덤 선택</div>
      </div>
    </div>

    <!-- 프로모션 적용 섹션 -->
    <div v-if="cfg.mode==='create'" style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:600;color:#475569;">🎁 프로모션 적용</span>
        <button class="btn" style="height:20px;padding:0 8px;font-size:10px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;border-radius:10px;"
          @click="domCfg.promoOpen=!domCfg.promoOpen">{{ domCfg.promoOpen ? '▲ 접기' : '▼ 펼치기' }}</button>
      </div>
      <div v-show="domCfg.promoOpen" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">

        <!-- 쿠폰 -->
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:10px;font-weight:600;color:#6366f1;margin-bottom:5px;">🎟 쿠폰</div>
          <select v-model="domCfg.couponMode" style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;font-size:11px;margin-bottom:5px;">
            <option v-for="m in PROMO_MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <div v-if="domCfg.couponMode==='fixed'" style="display:flex;gap:4px;align-items:center;margin-bottom:5px;">
            <input type="text" :value="domCfg.fixedCouponNm || domCfg.fixedCouponId || ''" readonly placeholder="쿠폰 선택"
              style="flex:1;height:24px;padding:0 6px;font-size:10px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;"
              @click="onOpenCouponPicker" />
            <button v-if="domCfg.fixedCouponId" class="btn" style="height:24px;padding:0 5px;font-size:10px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
              @click="domCfg.fixedCouponId='';domCfg.fixedCouponNm=''">✕</button>
            <button v-else class="btn" style="height:24px;padding:0 6px;font-size:10px;background:#ede9fe;color:#6366f1;border:1px solid #c4b5fd;"
              @click="onOpenCouponPicker">선택</button>
          </div>
          <div v-if="domCfg.couponMode==='random'" style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:#64748b;white-space:nowrap;">적용확률</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.couponApplyRate" style="flex:1;accent-color:#6366f1;" />
            <span style="font-size:10px;font-weight:600;color:#6366f1;min-width:28px;">{{ domCfg.couponApplyRate }}%</span>
          </div>
        </div>

        <!-- 할인 -->
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:10px;font-weight:600;color:#f59e0b;margin-bottom:5px;">💸 할인</div>
          <select v-model="domCfg.discntMode" style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;font-size:11px;margin-bottom:5px;">
            <option v-for="m in PROMO_MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <div v-if="domCfg.discntMode==='fixed'" style="display:flex;gap:4px;align-items:center;margin-bottom:5px;">
            <input type="text" :value="domCfg.fixedDiscntNm || domCfg.fixedDiscntId || ''" readonly placeholder="할인 선택"
              style="flex:1;height:24px;padding:0 6px;font-size:10px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;"
              @click="onOpenDiscntPicker" />
            <button v-if="domCfg.fixedDiscntId" class="btn" style="height:24px;padding:0 5px;font-size:10px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
              @click="domCfg.fixedDiscntId='';domCfg.fixedDiscntNm=''">✕</button>
            <button v-else class="btn" style="height:24px;padding:0 6px;font-size:10px;background:#fef3c7;color:#b45309;border:1px solid #fcd34d;"
              @click="onOpenDiscntPicker">선택</button>
          </div>
          <div v-if="domCfg.discntMode==='random'" style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:#64748b;white-space:nowrap;">적용확률</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.discntApplyRate" style="flex:1;accent-color:#f59e0b;" />
            <span style="font-size:10px;font-weight:600;color:#f59e0b;min-width:28px;">{{ domCfg.discntApplyRate }}%</span>
          </div>
        </div>

        <!-- 적립금 -->
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:10px;font-weight:600;color:#22c55e;margin-bottom:5px;">💰 적립금 차감</div>
          <select v-model="domCfg.saveMode" style="width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;font-size:11px;margin-bottom:5px;">
            <option value="none">없음</option>
            <option value="random">랜덤 적용</option>
          </select>
          <div v-if="domCfg.saveMode==='random'">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
              <span style="font-size:10px;color:#64748b;white-space:nowrap;">사용확률</span>
              <input type="range" min="0" max="100" v-model.number="domCfg.saveApplyRate" style="flex:1;accent-color:#22c55e;" />
              <span style="font-size:10px;font-weight:600;color:#22c55e;min-width:28px;">{{ domCfg.saveApplyRate }}%</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="font-size:10px;color:#64748b;white-space:nowrap;">차감범위</span>
              <input type="number" min="0" max="100" v-model.number="domCfg.saveDeductMin" style="width:36px;text-align:center;border:1px solid #e2e8f0;border-radius:3px;font-size:10px;padding:1px;" />
              <span style="font-size:10px;color:#94a3b8;">~</span>
              <input type="number" min="0" max="100" v-model.number="domCfg.saveDeductMax" style="width:36px;text-align:center;border:1px solid #e2e8f0;border-radius:3px;font-size:10px;padding:1px;" />
              <span style="font-size:10px;color:#94a3b8;">%</span>
            </div>
          </div>
        </div>

        <!-- 사은품 -->
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;">
          <div style="font-size:10px;font-weight:600;color:#ec4899;margin-bottom:5px;">🎀 사은품</div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:5px;">GIFT 타입 상품 중 랜덤</div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:#64748b;white-space:nowrap;">포함확률</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.giftApplyRate" style="flex:1;accent-color:#ec4899;" />
            <span style="font-size:10px;font-weight:600;color:#ec4899;min-width:28px;">{{ domCfg.giftApplyRate }}%</span>
          </div>
          <div v-if="domCfg.giftApplyRate===0" style="font-size:10px;color:#94a3b8;margin-top:3px;">0% = 미포함</div>
        </div>

      </div>
    </div>
  </div>

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🛒 주문 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('itemCountMin','itemCountMax',1,20,'개')}
      ${rangeSlotTemplate('amtMin','amtMax',10000,300000,'원')}
    </bo-form-area>
  </div>

  <!-- 가중치 패널 -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">💳 결제수단 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedPayMethod" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="p in PAY_METHODS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedPayMethod === '__weighted__'">
        <div v-for="p in PAY_METHODS" :key="p.value" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+p.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#475569;min-width:68px;white-space:nowrap;">{{ p.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.payMethodWeights[p.value]" :style="'flex:1;accent-color:'+p.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.payMethodWeights[p.value]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.payMethodWeights[p.value]/cfPayMethodTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="p in PAY_METHODS" :key="p.value" :style="'flex:'+domCfg.payMethodWeights[p.value]+';transition:flex .2s;background:'+p.color"></div>
        </div>
      </div>
    </div>
    <div></div>
    <div></div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 주문 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 회원 picker 모달 -->
  <bo-modal :show="memberPicker.show" title="회원 선택" @close="memberPicker.show=false" box-width="600px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="memberPicker.searchValue" placeholder="이름 / 이메일 / ID 검색" @keyup.enter="_loadMemberPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadMemberPicker">조회</button>
      </div>
      <div v-if="memberPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>ID</th>
          <th>이름</th>
          <th>이메일</th>
          <th>상태</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!memberPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in memberPicker.rows" :key="r.memberId" style="cursor:pointer;" @click="onSelectMember(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.memberId }}</td>
            <td>{{ r.memberNm }}</td>
            <td style="font-size:11px;color:#64748b;">{{ r.loginId }}</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.memberStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 상품 picker 모달 -->
  <bo-modal :show="prodPicker.show" title="상품 선택" @close="prodPicker.show=false" box-width="640px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="prodPicker.searchValue" placeholder="상품명 / 상품ID 검색" @keyup.enter="_loadProdPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadProdPicker">조회</button>
      </div>
      <div v-if="prodPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>상품ID</th>
          <th>상품명</th>
          <th style="text-align:right;">판매가</th>
          <th>상태</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!prodPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in prodPicker.rows" :key="r.prodId" style="cursor:pointer;" @click="onSelectProd(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.prodId }}</td>
            <td>{{ r.prodNm }}</td>
            <td style="text-align:right;">{{ (r.salePrice||0).toLocaleString() }}원</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.prodStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 쿠폰 picker 모달 -->
  <bo-modal :show="couponPicker.show" title="쿠폰 선택" @close="couponPicker.show=false" box-width="620px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="couponPicker.searchValue" placeholder="쿠폰명 검색" @keyup.enter="_loadCouponPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadCouponPicker">조회</button>
      </div>
      <div v-if="couponPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>쿠폰ID</th>
          <th>쿠폰명</th>
          <th>유형</th>
          <th>할인</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!couponPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in couponPicker.rows" :key="r.couponId" style="cursor:pointer;" @click="onSelectCoupon(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.couponId }}</td>
            <td>{{ r.couponNm }}</td>
            <td style="text-align:center;"><span class="badge badge-purple" style="font-size:10px;">{{ r.couponTypeCd }}</span></td>
            <td style="text-align:right;font-size:11px;">{{ r.discntRate ? r.discntRate + '%' : (r.discntAmt ? (r.discntAmt).toLocaleString() + '원' : '-') }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 할인 picker 모달 -->
  <bo-modal :show="discntPicker.show" title="할인 선택" @close="discntPicker.show=false" box-width="620px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="discntPicker.searchValue" placeholder="할인명 검색" @keyup.enter="_loadDiscntPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadDiscntPicker">조회</button>
      </div>
      <div v-if="discntPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>할인ID</th>
          <th>할인명</th>
          <th>유형</th>
          <th>할인율/금액</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!discntPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in discntPicker.rows" :key="r.discntId" style="cursor:pointer;" @click="onSelectDiscnt(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.discntId }}</td>
            <td>{{ r.discntNm }}</td>
            <td style="text-align:center;"><span class="badge badge-orange" style="font-size:10px;">{{ r.discntTypeCd }}</span></td>
            <td style="text-align:right;font-size:11px;">{{ r.discntRate ? r.discntRate + '%' : (r.discntAmt ? (r.discntAmt).toLocaleString() + '원' : '-') }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 주문 picker 모달 -->
  <bo-modal :show="orderPicker.show" title="주문 선택" @close="orderPicker.show=false" box-width="620px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="orderPicker.searchValue" placeholder="주문ID 검색" @keyup.enter="_loadOrderPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;font-family:monospace;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadOrderPicker">조회</button>
      </div>
      <div v-if="orderPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>주문ID</th>
          <th>주문자</th>
          <th>상태</th>
          <th style="text-align:right;">결제금액</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!orderPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in orderPicker.rows" :key="r.orderId" style="cursor:pointer;" @click="onSelectOrder(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.orderId }}</td>
            <td>{{ r.memberNm || '-' }}</td>
            <td style="text-align:center;"><span class="badge badge-blue" style="font-size:10px;">{{ r.orderStatusCd }}</span></td>
            <td style="text-align:right;">{{ (r.totalPayAmt||0).toLocaleString() }}원</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

</div>`,
  };
})();
