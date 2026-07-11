/* ZdSimulProdMng — 상품 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed, ref, onMounted } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const SALE_TYPES = [
    { cd: 'NORMAL', label: '단품',   badge: 'badge-blue',   color: '#3b82f6' },
    { cd: 'OPTION', label: '옵션형', badge: 'badge-purple', color: '#a855f7' },
    { cd: 'SET',    label: '세트',   badge: 'badge-orange', color: '#f97316' },
    { cd: 'BUNDLE', label: '묶음',   badge: 'badge-green',  color: '#22c55e' },
  ];
  const PROD_STATUSES = [
    { value: 'SELLING',     label: '판매중'   },
    { value: 'SOLDOUT',     label: '품절'     },
    { value: 'PAUSE',       label: '판매중지' },
    { value: 'READY',       label: '판매준비' },
    { value: 'DISCONTINUED',label: '단종'     },
  ];
  const UPDATE_ACTIONS = [
    { value: 'status', label: '상태 변경' },
    { value: 'price',  label: '가격 조정' },
    { value: 'stock',  label: '재고 조정' },
    { value: 'name',   label: '상품명 변경' },
    { value: 'adcopy', label: '광고문구 갱신' },
  ];
  const AD_COPIES = [
    '한정 수량! 지금 바로 구매하세요',
    '오늘만 이 가격! 놓치지 마세요',
    '베스트셀러 상품, 품절 전 서두르세요',
    '고객 만족도 1위! 믿고 사는 제품',
    '특가 이벤트 진행 중',
    '시즌 한정 특별 할인',
    '신상품 출시 기념 특가',
    '리뷰 1000개 돌파! 검증된 품질',
  ];
  const PROD_PREFIXES = ['프리미엄','스페셜','에코','프로','울트라','스마트','베이직','럭셔리','클래식','미니'];
  const PROD_NAMES = ['무선 이어폰','텀블러','노트북 파우치','가죽 지갑','실리콘 케이스','캔버스 토트백','스테인리스 컵','스포츠 양말','코튼 후드티','LED 스탠드'];

  /* 옵션 카테고리 프리셋 — 각 프리셋은 opt1/opt2 풀 슬라이스 범위를 정의 */
  const OPT_PRESETS = [
    { cd: 'CLOTH',    label: '의류 (색상-사이즈-소재)',   color: '#3b82f6', opt1Pool: ['레드','화이트','블랙','네이비','그린','옐로우','퍼플','그레이'], opt1LabelType: 'color', opt2Pool: ['XS','S','M','L','XL','XXL'], opt2LabelType: 'size'  },
    { cd: 'OUTER',    label: '아우터 (색상-사이즈)',      color: '#0ea5e9', opt1Pool: ['블랙','네이비','그레이','화이트','카키'],                      opt1LabelType: 'color', opt2Pool: ['S','M','L','XL','XXL'],           opt2LabelType: 'size'  },
    { cd: 'PANTS',    label: '바지 (색상-허리사이즈)',    color: '#6366f1', opt1Pool: ['블랙','네이비','그레이','카키','화이트'],                      opt1LabelType: 'color', opt2Pool: ['26','28','30','32','34','36'],     opt2LabelType: 'other' },
    { cd: 'SHOES',    label: '신발 (신발사이즈-색상)',    color: '#a855f7', opt1Pool: ['225','230','235','240','245','250','255','260'],              opt1LabelType: 'other', opt2Pool: ['블랙','화이트','그레이','네이비'], opt2LabelType: 'color' },
    { cd: 'BAG',      label: '가방 (색상-소재)',          color: '#f97316', opt1Pool: ['블랙','브라운','베이지','화이트','네이비'],                    opt1LabelType: 'color', opt2Pool: ['가죽','캔버스','나일론','스웨이드'], opt2LabelType: 'other' },
    { cd: 'COSMETIC', label: '화장품 (색상/쉐이드-용량)', color: '#ec4899', opt1Pool: ['#01 내추럴','#02 누드','#03 로즈','#04 레드','#05 버건디'],   opt1LabelType: 'other', opt2Pool: ['10ml','30ml','50ml','100ml'],      opt2LabelType: 'other' },
    { cd: 'PERFUME',  label: '향수 (향-용량)',            color: '#8b5cf6', opt1Pool: ['플로럴','우디','시트러스','머스크','오리엔탈'],                opt1LabelType: 'other', opt2Pool: ['30ml','50ml','100ml'],             opt2LabelType: 'other' },
    { cd: 'FOOD',     label: '식품/음료 (맛-용량)',       color: '#22c55e', opt1Pool: ['오리지널','딸기','초코','바닐라','말차'],                      opt1LabelType: 'other', opt2Pool: ['100g','200g','500g','1kg'],        opt2LabelType: 'other' },
    { cd: 'ETC',      label: '기타/커스텀 (직접입력)',    color: '#94a3b8', opt1Pool: ['레드','화이트','블랙','네이비'],                               opt1LabelType: 'color', opt2Pool: ['S','M','L','XL'],                 opt2LabelType: 'size'  },
  ];

  window.ZdSimulProdMng = {
    name: 'ZdSimulProdMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        priceMin: 5000,
        priceMax: 500000,
        costRateMin: 40,
        costRateMax: 70,
        stockMin: 0,
        stockMax: 999,
        priceRoundUnit: 100,
        fixedSaleType: '__weighted__',
        saleTypeWeights: { NORMAL: 60, OPTION: 25, SET: 10, BUNDLE: 5 },
        createStatus: 'SELLING',
        useAdCopy: true,
        useOptImg: true,
        fixedCategoryId: '',
        fixedOptPreset: '__weighted__',
        optPresetWeights: { CLOTH: 40, OUTER: 15, PANTS: 10, SHOES: 10, BAG: 10, COSMETIC: 5, PERFUME: 5, FOOD: 3, ETC: 2 },
        opt1CountMin: 2,
        opt1CountMax: 3,
        opt2CountMin: 2,
        opt2CountMax: 3,
        imgCountMin: 2,
        imgCountMax: 3,
        updateAction: 'status',
        updateStatus: 'SOLDOUT',
        priceChangeRateMin: -20,
        priceChangeRateMax: 20,
        stockAddMin: -50,
        stockAddMax: 200,
        /* 수정 모드 고정 대상 */
        fixedProdId: '',
        fixedProdNm: '',
      });

      /* 카테고리 목록 (onMounted 로드) */
      const categories = ref([]);

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        if (domCfg.fixedSaleType && domCfg.fixedSaleType !== '__weighted__') {
          return SALE_TYPES.find(t => t.cd === domCfg.fixedSaleType) || SALE_TYPES[0];
        }
        const w = domCfg.saleTypeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of SALE_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return SALE_TYPES[0];
      };
      const _round = (n) => Math.round(n / (domCfg.priceRoundUnit || 100)) * (domCfg.priceRoundUnit || 100);

      /* 옵션 프리셋 선택 */
      const _pickOptPreset = () => {
        if (domCfg.fixedOptPreset && domCfg.fixedOptPreset !== '__weighted__') {
          return OPT_PRESETS.find(p => p.cd === domCfg.fixedOptPreset) || OPT_PRESETS[0];
        }
        const w = domCfg.optPresetWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const p of OPT_PRESETS) { r -= Number(w[p.cd] || 0); if (r <= 0) return p; }
        return OPT_PRESETS[0];
      };

      /* 레거시 호환 — 기본 풀 (카테고리 프리뷰용) */
      const OPT1_POOL = ['레드', '화이트', '블랙', '네이비', '그린', '옐로우', '퍼플', '그레이'];
      const OPT2_POOL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      /* 옵션1 색상에 대응하는 hex 팔레트 */
      const OPT1_COLORS = {
        '레드': '#e74c3c', '화이트': '#f5f5f5', '블랙': '#2c2c2c',
        '네이비': '#1a3a5c', '그린': '#27ae60', '옐로우': '#f1c40f',
        '퍼플': '#8e44ad', '그레이': '#7f8c8d', '카키': '#7d8c3a',
        '브라운': '#7b5e3a', '베이지': '#c8b79b',
      };

      /* Canvas로 단색 PNG Blob 생성 (400×400) */
      const _makeColorBlob = (hex) => new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, 400, 400);
        /* 색상명 라벨 */
        ctx.fillStyle = (hex === '#f5f5f5') ? '#555' : '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex, 200, 200);
        canvas.toBlob(resolve, 'image/png');
      });

      /* opt 이미지 업로드 — 색상 배열 기준 Promise.all */
      const _uploadOptImgs = async (opt1List) => {
        const results = [];
        for (const nm of opt1List) {
          const hex  = OPT1_COLORS[nm] || '#cccccc';
          const blob = await _makeColorBlob(hex);
          const fd   = new FormData();
          fd.append('file', blob, 'opt_' + nm + '.png');
          try {
            const r = await coApiSvc.cmUpload.uploadOne(fd, '상품시뮬', '옵션이미지');
            const url = r?.data?.data?.cdnImgUrl || r?.data?.data?.attachUrl || '';
            results.push({ nm, url });
          } catch (e) {
            results.push({ nm, url: '' });
          }
        }
        return results;
      };

      const simul = useSimulSetup({
        domain: '상품',
        uiNm: '상품 시뮬레이터',
        label: '시뮬상품',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, simulYn, suffix, randInt, randF, pick, previewOnly, _makeSimulId }) => {
          if (mode === 'create') {
            const type      = _pickType();
            const salePrice = _round(randInt(domCfg.priceMin, domCfg.priceMax));
            const costRate  = randInt(domCfg.costRateMin, domCfg.costRateMax);
            const costPrice = _round(salePrice * costRate / 100);
            const stock     = randInt(domCfg.stockMin, domCfg.stockMax);
            const pfix      = pick(PROD_PREFIXES);
            const pnm       = pick(PROD_NAMES);
            const prodNm    = (namePrefix || '') + pfix + ' ' + pnm + (suffix ? ' ' + suffix : '');
            const isOption  = type.cd === 'OPTION';
            /* 카테고리 결정: 고정 지정 > 랜덤 배정 */
            let categoryId = '';
            if (domCfg.fixedCategoryId) {
              categoryId = domCfg.fixedCategoryId;
            } else if (categories.value.length) {
              categoryId = pick(categories.value).categoryId;
            }
            const body = {
              prodNm, salePrice,
              purchasePrice: costPrice,           /* pd_prod.purchase_price */
              prodStock: isOption ? 0 : stock,    /* pd_prod.prod_stock */
              prodTypeCd: type.cd,                /* pd_prod.prod_type_cd (SINGLE/OPTION/SET) */
              prodStatusCd: domCfg.createStatus,
              advrtStmt: domCfg.useAdCopy ? pick(AD_COPIES) : '', /* pd_prod.advrt_stmt */
              ...(categoryId                ? { categoryId }                              : {}),
              ...(defaults.value.siteId     ? { siteId:     defaults.value.siteId }     : {}),
              ...(defaults.value.dlivTmpltId ? { dlivTmpltId: defaults.value.dlivTmpltId } : {}),
              simulYn: simulYn || 'Y',
              /* 항상 포함 — 값 없으면 null/[] */
              optTypeCd:   null,    /* pd_prod.opt_type_cd */
              prodOpts:    [],      /* pd_prod_opt[] */
              prodSkus:    [],      /* pd_prod_sku[] (참고) */
              prodImages:  [],      /* pd_prod_img[] */
            };
            /* 옵션형: 프리셋 기반 opt1/opt2 풀 선택 후 count range 기준 슬라이스 */
            let opt1List = null, opt2List = null;
            let optPresetLabel = '';
            const _makeVal = (nm, type, prefix) => {
              if (type === 'color') return 'COL_' + nm.replace(/[^A-Za-z0-9가-힣]/g, '_').toUpperCase();
              if (type === 'size')  return 'SIZ_' + nm;
              return (prefix || 'OPT') + '_' + nm.replace(/[^A-Za-z0-9가-힣]/g, '_').toUpperCase();
            };
            /* 상품 자체 임시 ID — 본 ID에 tmp- 접두어, body.prodId로 전송 */
            const tmpProdId = 'tmp-prod-01';
            body.prodId = tmpProdId;

            if (isOption) {
              const preset = _pickOptPreset();
              optPresetLabel = preset.label;
              const useCustomPool = domCfg.fixedOptPreset === '__weighted__';
              const pool1 = useCustomPool && cfOpt1Pool.value.length ? cfOpt1Pool.value : preset.opt1Pool;
              const pool2 = useCustomPool && cfOpt2Pool.value.length ? cfOpt2Pool.value : preset.opt2Pool;
              const o1cnt = randInt(domCfg.opt1CountMin, Math.min(domCfg.opt1CountMax, pool1.length));
              const o2cnt = randInt(domCfg.opt2CountMin, Math.min(domCfg.opt2CountMax, pool2.length));
              opt1List = pool1.slice(0, o1cnt);
              opt2List = pool2.slice(0, o2cnt);
              const grp1Nm = preset.opt1LabelType === 'color' ? '색상' : preset.opt1LabelType === 'size' ? '사이즈' : '옵션1';
              const grp2Nm = preset.opt2LabelType === 'size' ? '사이즈' : preset.opt2LabelType === 'color' ? '색상' : '옵션2';
              /* 상품 레벨 옵션 카테고리 코드 (pd_prod.opt_type_cd) */
              body.optTypeCd = preset.cd;
              /* 옵션항목 임시 ID: 본 ID(optItemId)에 tmp-opt1-/tmp-opt2- 접두어 */
              const _pad2 = (n) => String(n + 1).padStart(2, '0');
              const opt1Items = opt1List.map((nm, i) => ({
                optItemId: 'tmp-opt1-' + _pad2(i),
                optNm: nm, optVal: _makeVal(nm, preset.opt1LabelType, 'O1'),
                optTypeCd: preset.opt1LabelType, sortOrd: i + 1, useYn: 'Y',
              }));
              const opt2Items = opt2List.map((nm, i) => ({
                optItemId: 'tmp-opt2-' + _pad2(i),
                optNm: nm, optVal: _makeVal(nm, preset.opt2LabelType, 'O2'),
                optTypeCd: preset.opt2LabelType, sortOrd: i + 1, useYn: 'Y',
              }));
              /* 실제 전송 body: prodOpts — pd_prod_opt.opt_grp_nm 에 저장, optTypeCdNm 키로 전송 */
              body.prodOpts = [
                { optTypeCdNm: grp1Nm, optTypeCd: preset.opt1LabelType, optLevel: 1, optInputTypeCd: 'SELECT', sortOrd: 1, prodOptItems: opt1Items },
                { optTypeCdNm: grp2Nm, optTypeCd: preset.opt2LabelType, optLevel: 2, optInputTypeCd: 'SELECT', sortOrd: 2, prodOptItems: opt2Items },
              ];
              if (previewOnly) {
                /* prodOpts: 실제 전송 key. pd_prod_opt Entity 컬럼명 기준 표시 */
                body['_preview_[prodOpts]'] = body.prodOpts.map(grp => ({
                  optTypeCdNm: grp.optTypeCdNm,
                  optTypeCd: grp.optTypeCd,
                  optLevel: grp.optLevel,
                  optInputTypeCd: grp.optInputTypeCd,
                  sortOrd: grp.sortOrd,
                  prodOptItems: grp.prodOptItems.map(it => ({
                    optItemId: it.optItemId,
                    optNm: it.optNm,
                    optVal: it.optVal,
                    optTypeCd: it.optTypeCd,
                    sortOrd: it.sortOrd,
                    useYn: it.useYn,
                  })),
                }));
                body['_hide_prodOpts'] = body.prodOpts;
                delete body.prodOpts;
                /* prodSkus: 백엔드가 prodOpts에서 자동 생성 (별도 전송 key 없음, 참고용) */
                const skuPreview = [];
                let addP = 0;
                let skuIdx = 0;
                for (const o1 of opt1Items) {
                  for (const o2 of opt2Items) {
                    skuPreview.push({
                      skuId: 'tmp-sku-' + _pad2(skuIdx++),
                      skuNm: o1.optNm + ' / ' + o2.optNm,
                      optItemId1: o1.optItemId,
                      optItemId2: o2.optItemId,
                      addPrice: addP,
                      prodOptStock: randInt(domCfg.stockMin, domCfg.stockMax),
                      useYn: 'Y',
                    });
                    addP += 1000;
                  }
                }
                body.prodSkus = skuPreview;
                /* prodImages: 옵션 이미지 (미리보기) */
                const imgPreview = [];
                if (domCfg.useOptImg && preset.opt1LabelType === 'color') {
                  const perColor = randInt(domCfg.imgCountMin, domCfg.imgCountMax);
                  let imgIdx = 0;
                  for (const o1 of opt1Items) {
                    for (let j = 0; j < perColor; j++) {
                      imgPreview.push({
                        prodImgId: 'tmp-img-' + _pad2(imgIdx++),
                        optItemId1: o1.optItemId,
                        optNm: o1.optNm,
                        cdnImgUrl: 'https://picsum.photos/seed/' + (200 + imgIdx * 37) + '/400/400',
                        isThumb: imgIdx === 1 ? 'Y' : 'N',
                        sortOrd: imgIdx,
                      });
                    }
                  }
                }
                body.prodImages = imgPreview;
              } else {
                /* 실제 실행: 이미지 업로드 (색상 opt1) */
                if (domCfg.useOptImg && preset.opt1LabelType === 'color') {
                  const perColor = randInt(domCfg.imgCountMin, domCfg.imgCountMax);
                  /* 색상별로 perColor장씩 업로드 (같은 색상 Blob 재사용) */
                  let imgIdx = 0;
                  for (let ci = 0; ci < opt1Items.length; ci++) {
                    const o1 = opt1Items[ci];
                    const hex = OPT1_COLORS[o1.optNm] || '#cccccc';
                    const blob = await _makeColorBlob(hex);
                    for (let j = 0; j < perColor; j++) {
                      const fd = new FormData();
                      fd.append('file', blob, 'opt_' + o1.optNm + '_' + (j + 1) + '.png');
                      try {
                        const r = await coApiSvc.cmUpload.uploadOne(fd, '상품시뮬', '옵션이미지');
                        const url = r?.data?.data?.cdnImgUrl || r?.data?.data?.attachUrl || '';
                        if (url) {
                          body.prodImages.push({
                            prodImgId: 'tmp-img-' + _pad2(imgIdx++),
                            cdnImgUrl: url,
                            optItemId1: o1.optItemId,
                            isThumb: imgIdx === 1 ? 'Y' : 'N',
                            sortOrd: imgIdx,
                          });
                        }
                      } catch (_) { /* 업로드 실패 시 해당 장 건너뜀 */ }
                    }
                  }
                }
              }
            } else {
              /* 단품/세트/묶음: 대표 이미지 1장 (백엔드 picsum 자동) */
              /* prodSkus: 백엔드가 자동 생성, 단일 SKU 참고용 */
              body.prodSkus = [{ skuNm: prodNm, salePrice, purchasePrice: costPrice, prodOptStock: stock, useYn: 'Y' }];
              if (previewOnly) {
                body.prodImages = [{ cdnImgUrl: 'https://picsum.photos/seed/200/400/400', isThumb: 'Y', sortOrd: 1 }];
              }
            }
            const res = await boApi.post('/bo/zd/simul/prod/create', body, coUtil.cofApiHdr('상품시뮬', '생성'));
            const savedProdId = res?.data?.data?.prodId || tmpProdId;

            const id = savedProdId || '-';
            if (!window._zdSimulStats['상품']) window._zdSimulStats['상품'] = { totalPrice: 0, count: 0, byType: {}, byStatus: {} };
            const st = window._zdSimulStats['상품'];
            st.count++; st.totalPrice += salePrice;
            st.byType[type.cd]  = (st.byType[type.cd] || 0) + 1;
            st.byStatus[domCfg.createStatus] = (st.byStatus[domCfg.createStatus] || 0) + 1;
            const optNote = isOption
              ? ' +옵션(' + (opt1List ? opt1List.length : 0) + 'x' + (opt2List ? opt2List.length : 0) + ')[' + optPresetLabel.split(' ')[0] + ']' + (domCfg.useOptImg ? '+이미지' : '')
              : '';
            return { ok: true, desc: '[' + type.label + '] ' + prodNm + ' ' + salePrice.toLocaleString('ko-KR') + '원' + optNote, meta: { id, type: type.label, salePrice, params: body } };
          } else {
            let target;
            if (domCfg.fixedProdId) {
              target = { prodId: domCfg.fixedProdId, prodNm: domCfg.fixedProdNm || domCfg.fixedProdId, salePrice: 10000, stockQty: 0 };
            } else {
              const list = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 50, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 판매중 상품 없음' };
              target = pick(list);
            }
            const action  = domCfg.updateAction;
            let body = {}, desc = '';
            if (action === 'status') {
              body.prodStatusCd = domCfg.updateStatus; desc = '상태→' + domCfg.updateStatus;
            } else if (action === 'price') {
              const rate = randInt(domCfg.priceChangeRateMin, domCfg.priceChangeRateMax);
              const newPrice = _round(Math.max(1000, (target.salePrice || 10000) * (1 + rate / 100)));
              body.salePrice = newPrice; desc = '가격 ' + (rate >= 0 ? '+' : '') + rate + '% → ' + newPrice.toLocaleString() + '원';
            } else if (action === 'stock') {
              const add = randInt(domCfg.stockAddMin, domCfg.stockAddMax);
              body.stockQty = Math.max(0, (target.stockQty || 0) + add);
              desc = '재고 ' + (add >= 0 ? '+' : '') + add + ' → ' + body.stockQty;
            } else if (action === 'name') {
              body.prodNm = target.prodNm + ' [리뉴얼]'; desc = '상품명 변경';
            } else {
              body.adCopy = pick(AD_COPIES); desc = '광고문구 갱신';
            }
            const updateBody = { prodId: target.prodId, ...body };
            await boApi.post('/bo/zd/simul/prod/update', updateBody, coUtil.cofApiHdr('상품시뮬', '수정'));
            return { ok: true, desc: target.prodNm + ' — ' + desc, meta: { id: target.prodId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] Defaults + 카테고리 로드 ──────────────── */
      const defaults = ref({ siteId: '', dlivTmpltId: '', dlivTmpltNm: '' });
      onMounted(async () => {
        try {
          const r = await boApi.post('/bo/zd/simul/prod/defaults', {}, coUtil.cofApiHdr('상품시뮬', 'defaults'));
          if (r?.data?.data) Object.assign(defaults.value, r.data.data);
        } catch (e) { /* defaults 실패 시 백엔드가 자동 처리 */ }
        try {
          const cr = await boApiSvc.pdCategory.getList({ useYn: 'Y', pageSize: 300 }, '상품시뮬', '카테고리조회');
          const raw = cr?.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.pageList || raw?.list || []);
          /* 트리 순서로 정렬: depth1 → depth2 → depth3, parent 기준 그룹화 */
          const byParent = {};
          list.forEach(c => {
            const pid = c.parentCategoryId || '__root__';
            if (!byParent[pid]) byParent[pid] = [];
            byParent[pid].push(c);
          });
          const sorted = [];
          const nameMap = {};
          list.forEach(c => { nameMap[c.categoryId] = c.categoryNm; });
          const walk = (pid, ancestors) => {
            (byParent[pid] || []).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => {
              const path = [...ancestors, c.categoryNm];
              sorted.push({ ...c, _fullPath: path.join(' > ') });
              walk(c.categoryId, path);
            });
          };
          walk('__root__', []);
          categories.value = sorted;
        } catch (e) { /* 카테고리 로드 실패 무시 */ }
      });

      /* ── [04] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.saleTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfOptPresetTotal = computed(() => Object.values(domCfg.optPresetWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* 옵션 풀 — wrap=true 모드: 전체 선택도 명시적 콤마 문자열로 저장 */
      const opt1PoolStr = ref(OPT1_POOL.join(','));
      const opt2PoolStr = ref(OPT2_POOL.join(','));
      const cfOpt1Pool = computed(() => (opt1PoolStr.value || '').split(',').map(s => s.trim()).filter(Boolean));
      const cfOpt2Pool = computed(() => (opt2PoolStr.value || '').split(',').map(s => s.trim()).filter(Boolean));

      /* ── [05] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        makeRangeCol('priceMin', 'priceMax', '가격 범위', 5000, 500000, '원'),
        makeRangeCol('costRateMin', 'costRateMax', '원가율 범위', 0, 100, '%'),
        makeRangeCol('stockMin',    'stockMax',    '재고 범위',   0, 999, '개'),
        { key: 'priceRoundUnit', label: '가격 단위',     type: 'select',
          options: [{ value: 100, label: '100원' }, { value: 500, label: '500원' }, { value: 1000, label: '1,000원' }] },
        { key: 'createStatus',   label: '초기 판매상태', type: 'select', options: PROD_STATUSES },
        { key: 'useAdCopy',      label: '광고문구 자동 생성', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        { key: 'useOptImg',      label: '옵션별 이미지 자동 업로드', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }],
          hint: '옵션1 색상별 단색 이미지 생성 후 첨부' },
        makeRangeCol('opt1CountMin', 'opt1CountMax', '옵션1 항목 수', 1, 10, '개',
          { hint: '색상 (레드~그레이 풀)' }),
        makeRangeCol('opt2CountMin', 'opt2CountMax', '옵션2 항목 수', 1, 10, '개',
          { hint: '사이즈 (XS~XXL 풀)' }),
        makeRangeCol('imgCountMin', 'imgCountMax', '옵션1별 이미지 수', 1, 10, '장',
          { hint: '옵션1 색상별 이미지 장수 범위' }),
        { key: 'fixedCategoryId', label: '카테고리 선택', type: 'slot', name: 'catPick' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction',  label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus',  label: '변경 상태', type: 'select', options: PROD_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        makeRangeCol('priceChangeRateMin', 'priceChangeRateMax', '가격 변동률 범위', -50, 50, '%',
          { visible: (f) => f.updateAction === 'price' }),
        makeRangeCol('stockAddMin', 'stockAddMax', '재고 증감 범위', -200, 500, '개',
          { visible: (f) => f.updateAction === 'stock' }),
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'priceMin',           maxKey: 'priceMax'           },
        { minKey: 'costRateMin',        maxKey: 'costRateMax'        },
        { minKey: 'stockMin',           maxKey: 'stockMax'           },
        { minKey: 'opt1CountMin',       maxKey: 'opt1CountMax'       },
        { minKey: 'opt2CountMin',       maxKey: 'opt2CountMax'       },
        { minKey: 'imgCountMin',        maxKey: 'imgCountMax'        },
        { minKey: 'priceChangeRateMin', maxKey: 'priceChangeRateMax' },
        { minKey: 'stockAddMin',        maxKey: 'stockAddMax'        },
      ]);

      /* ── [05] 상품 picker (수정 모드 대상 지정) ──────── */
      const updateProdPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const _loadUpdateProdPicker = async () => {
        updateProdPicker.loading = true;
        try {
          const res = await boApiSvc.pdProd.getPage({
            pageNo: 1, pageSize: 20,
            ...(updateProdPicker.searchValue ? { searchValue: updateProdPicker.searchValue, searchType: 'prodId,prodNm' } : {}),
          });
          updateProdPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { updateProdPicker.rows = []; }
        updateProdPicker.loading = false;
      };
      const onOpenUpdateProdPicker = async () => {
        updateProdPicker.show = true;
        updateProdPicker.searchValue = '';
        await _loadUpdateProdPicker();
      };
      const onSelectUpdateProd = (row) => {
        domCfg.fixedProdId = row.prodId;
        domCfg.fixedProdNm = row.prodNm || '';
        updateProdPicker.show = false;
      };

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        defaults, cfTypeTotal, cfOptPresetTotal, categories, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        SALE_TYPES, PROD_STATUSES, UPDATE_ACTIONS, OPT1_POOL, OPT2_POOL, OPT1_COLORS, OPT_PRESETS,
        opt1PoolStr, opt2PoolStr, cfOpt1Pool, cfOpt2Pool,
        updateProdPicker, onOpenUpdateProdPicker, onSelectUpdateProd, _loadUpdateProdPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">📦 상품 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#059669,#34d399)"
    accent-active="background:#ecfdf5;border:1.5px solid #059669;color:#065f46;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">📦 상품 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('priceMin','priceMax',5000,500000,'원')}
      ${rangeSlotTemplate('costRateMin','costRateMax',0,100,'%')}
      ${rangeSlotTemplate('stockMin','stockMax',0,999,'개')}
      ${rangeSlotTemplate('opt1CountMin','opt1CountMax',1,10,'개')}
      ${rangeSlotTemplate('opt2CountMin','opt2CountMax',1,10,'개')}
      ${rangeSlotTemplate('imgCountMin','imgCountMax',1,10,'장')}
      <template #catPick>
        <select v-model="domCfg.fixedCategoryId" class="form-control" style="width:100%;font-size:12px;">
          <option value="">— 랜덤 배정</option>
          <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">{{ c._fullPath }}</option>
          <option v-if="!categories.length" disabled value="">카테고리 로딩 중...</option>
        </select>
      </template>
    </bo-form-area>

    <!-- 옵션 풀 선택 (체크박스 드롭다운) -->
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div>
        <label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">옵션1 색상 풀</label>
        <bo-multi-check-select
          v-model="opt1PoolStr"
          :options="OPT1_POOL.map(nm => ({ value: nm, label: nm, color: OPT1_COLORS[nm] || '#ccc' }))"
          placeholder="색상 선택"
          all-label="전체 색상"
          :wrap="true"
          min-width="100%"
          style="width:100%;display:block;" />
      </div>
      <div>
        <label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">옵션2 사이즈 풀</label>
        <bo-multi-check-select
          v-model="opt2PoolStr"
          :options="OPT2_POOL.map(nm => ({ value: nm, label: nm }))"
          placeholder="사이즈 선택"
          all-label="전체 사이즈"
          :wrap="true"
          min-width="100%"
          style="width:100%;display:block;" />
      </div>
      <div></div>
    </div>
  </div>

  <!-- 가중치 패널 (판매유형 + 옵션 카테고리) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 판매유형 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 판매유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">유형 지정</label>
        <select v-model="domCfg.fixedSaleType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in SALE_TYPES" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSaleType === '__weighted__'">
        <div v-for="t in SALE_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span :class="'badge '+t.badge" style="min-width:42px;text-align:center;font-size:11px;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saleTypeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saleTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.saleTypeWeights[t.cd]/cfTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in SALE_TYPES" :key="t.cd" :style="'flex:'+domCfg.saleTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 옵션 카테고리 가중치 (옵션형일 때만 적용) -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🗂 옵션 카테고리 가중치</div>
      <div style="margin-top:4px;margin-bottom:6px;font-size:11px;color:#94a3b8;">옵션형 상품 생성 시 옵션 구성 카테고리 비율</div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">카테고리 지정</label>
        <select v-model="domCfg.fixedOptPreset" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="p in OPT_PRESETS" :key="p.cd" :value="p.cd">{{ p.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedOptPreset === '__weighted__'">
        <div v-for="p in OPT_PRESETS" :key="p.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+p.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="min-width:120px;font-size:11px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="p.label">{{ p.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.optPresetWeights[p.cd]" :style="'flex:1;accent-color:'+p.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.optPresetWeights[p.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.optPresetWeights[p.cd]/cfOptPresetTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="p in OPT_PRESETS" :key="p.cd" :style="'flex:'+domCfg.optPresetWeights[p.cd]+';transition:flex .2s;background:'+p.color+';'"></div>
        </div>
      </div>
      <div v-if="domCfg.fixedOptPreset !== '__weighted__'" style="margin-top:4px;">
        <div v-for="p in OPT_PRESETS.filter(x => x.cd === domCfg.fixedOptPreset)" :key="p.cd">
          <div style="font-size:11px;color:#64748b;margin-bottom:4px;">옵션1 풀: {{ p.opt1Pool.join(', ') }}</div>
          <div style="font-size:11px;color:#64748b;">옵션2 풀: {{ p.opt2Pool.join(', ') }}</div>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 상품 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('priceChangeRateMin','priceChangeRateMax',-50,50,'%')}
      ${rangeSlotTemplate('stockAddMin','stockAddMax',-200,500,'개')}
    </bo-form-area>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">🎯 수정 대상 지정 (미지정 시 랜덤)</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#64748b;min-width:64px;">상품</span>
        <input type="text" :value="domCfg.fixedProdNm || domCfg.fixedProdId" readonly placeholder="미지정 (판매중 상품 중 랜덤)"
          style="flex:1;padding:4px 8px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;background:#f8fafc;cursor:default;" />
        <button class="btn btn-sm" style="background:#059669;color:#fff;" @click="onOpenUpdateProdPicker">선택</button>
        <button v-if="domCfg.fixedProdId" class="btn btn-sm btn-secondary" @click="domCfg.fixedProdId='';domCfg.fixedProdNm=''">해제</button>
      </div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 수정 대상 상품 picker 모달 -->
  <bo-modal :show="updateProdPicker.show" title="수정 대상 상품 선택" width="720px" @close="updateProdPicker.show=false">
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <input type="text" v-model="updateProdPicker.searchValue" placeholder="상품ID/상품명 검색" class="form-control"
        style="flex:1;" @keyup.enter="_loadUpdateProdPicker" />
      <button class="btn btn-sm btn_search" @click="_loadUpdateProdPicker">조회</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>상품ID</th>
        <th>상품명</th>
        <th>상태</th>
        <th style="text-align:right;">판매가</th>
        <th style="width:60px;"></th>
      </tr></thead>
      <tbody>
        <tr v-if="updateProdPicker.loading"><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8;">조회 중...</td></tr>
        <tr v-else-if="!updateProdPicker.rows.length"><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8;">조회 결과 없음</td></tr>
        <tr v-for="(row,idx) in updateProdPicker.rows" :key="row.prodId">
          <td style="text-align:center;">{{ idx+1 }}</td>
          <td style="font-family:monospace;font-size:11px;">{{ row.prodId }}</td>
          <td>{{ row.prodNm }}</td>
          <td>{{ row.prodStatusCd }}</td>
          <td style="text-align:right;">{{ (row.salePrice||0).toLocaleString() }}원</td>
          <td><button class="btn btn-xs btn_select" @click="onSelectUpdateProd(row)">선택</button></td>
        </tr>
      </tbody>
    </table>
  </bo-modal>
</div>`,
  };
})();
