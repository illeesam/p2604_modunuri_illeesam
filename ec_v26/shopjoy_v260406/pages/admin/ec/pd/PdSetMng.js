/* ShopJoy Admin - 세트상품관리 (pd_prod_set_item) */
window.PdSetMng = {
  name: 'PdSetMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* ── 검색 ── */
    const searchNm = ref('');
    const applied  = reactive({ nm: '' });
    const pager    = reactive({ page: 1, size: 10 });

    /* ── Dtl 모드 ── */
    const dtlMode    = ref(null);   // null | 'new' | 'edit'
    const editSetId  = ref(null);

    /* ── 신규등록 폼 ── */
    const newForm = reactive({
      prodNm: '', brandId: '', vendorId: '',
      listPrice: 0, salePrice: 0, stock: 0,
      prodStatusCd: 'DRAFT',
    });
    const newErrors = reactive({});

    /* ── 카테고리 N개 ── */
    const dtlCategories   = reactive([]);
    const catPickerOpen   = ref(false);
    const catPickerSearch = ref('');
    const catPickerList   = computed(() => {
      const q    = catPickerSearch.value.trim().toLowerCase();
      const used = new Set(dtlCategories.map(c => String(c.categoryId)));
      return (props.adminData.categories || []).filter(c =>
        !used.has(String(c.categoryId)) && (!q || (c.categoryNm || '').toLowerCase().includes(q))
      );
    });

    const catDragIdx     = ref(null);
    const catDragoverIdx = ref(null);
    const onCatDragStart = idx => { catDragIdx.value = idx; };
    const onCatDragOver  = idx => { catDragoverIdx.value = idx; };
    const onCatDrop = () => {
      if (catDragIdx.value === null || catDragIdx.value === catDragoverIdx.value) {
        catDragIdx.value = catDragoverIdx.value = null; return;
      }
      const arr = [...dtlCategories];
      const [moved] = arr.splice(catDragIdx.value, 1);
      arr.splice(catDragoverIdx.value, 0, moved);
      dtlCategories.splice(0, dtlCategories.length, ...arr);
      catDragIdx.value = catDragoverIdx.value = null;
    };
    const addCategory    = cat => {
      if (dtlCategories.some(c => String(c.categoryId) === String(cat.categoryId))) return;
      dtlCategories.push({ categoryId: cat.categoryId, categoryNm: cat.categoryNm, depth: cat.depth || 1 });
      catPickerOpen.value = false; catPickerSearch.value = '';
    };
    const removeCategory = idx => dtlCategories.splice(idx, 1);
    const getCategoryNm  = id => { const c = (props.adminData.categories||[]).find(c=>c.categoryId==id); return c ? c.categoryNm : String(id); };
    const getCategoryDepth = id => { const c = (props.adminData.categories||[]).find(c=>c.categoryId==id); return c ? (c.depth||1) : 1; };

    /* ── 구성품 목록 ── */
    const dtlItems = reactive([]);
    let _seq = 1;

    /* ── 드래그 ── */
    const dragIdx     = ref(null);
    const dragoverIdx = ref(null);
    const onDragStart = idx => { dragIdx.value = idx; };
    const onDragOver  = idx => { dragoverIdx.value = idx; };
    const onDrop = () => {
      if (dragIdx.value === null || dragIdx.value === dragoverIdx.value) {
        dragIdx.value = dragoverIdx.value = null; return;
      }
      const arr = [...dtlItems];
      const [moved] = arr.splice(dragIdx.value, 1);
      arr.splice(dragoverIdx.value, 0, moved);
      arr.forEach((item, i) => { item.sortOrd = i + 1; });
      dtlItems.splice(0, dtlItems.length, ...arr);
      dragIdx.value = dragoverIdx.value = null;
    };

    /* ── 상품 피커 ── */
    const pickerOpen   = ref(false);
    const pickerSearch = ref('');
    const pickerList   = computed(() => {
      const q    = pickerSearch.value.trim().toLowerCase();
      const used = new Set(dtlItems.map(d => d.itemProdId).filter(Boolean));
      return (props.adminData.products || []).filter(p => {
        if (p.productId === editSetId.value) return false;
        if (used.has(p.productId)) return false;
        if (!q) return true;
        return String(p.productId).includes(q) || (p.prodNm || '').toLowerCase().includes(q);
      });
    });

    /* ── helpers ── */
    const getProd   = id => id ? (props.adminData.products || []).find(p => p.productId === id) : null;
    const getProdNm = id => { const p = getProd(id); return p ? (p.prodNm || p.productName || '상품#' + id) : id ? '상품#' + id : ''; };
    const getBrandNm = id => { const b = (props.adminData.brands||[]).find(b=>b.brandId==id); return b ? (b.brandNm||id) : id; };

    /* ── 세트상품 목록 ── */
    const setList = computed(() => {
      const kw = applied.nm.toLowerCase();
      const ids = [...new Set((props.adminData.setItems || []).map(s => s.setProdId))];
      return ids
        .map(id => {
          const items = (props.adminData.setItems || [])
            .filter(s => s.setProdId === id)
            .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
          const prod = getProd(id);
          return { setProdId: id, prodNm: getProdNm(id), prod, items, itemCount: items.length };
        })
        .filter(g => !kw || g.prodNm.toLowerCase().includes(kw));
    });

    const totalCnt   = computed(() => setList.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(totalCnt.value / pager.size)));
    const pageList   = computed(() => setList.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => {
      const c = pager.page, l = totalPages.value, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });

    const onSearch = () => { Object.assign(applied, { nm: searchNm.value }); pager.page = 1; };
    const onReset  = () => { searchNm.value = ''; Object.assign(applied, { nm: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    /* ── 신규 열기 ── */
    const openNew = () => {
      dtlMode.value = 'new';
      editSetId.value = null;
      Object.assign(newForm, { prodNm: '', brandId: '', vendorId: '', listPrice: 0, salePrice: 0, stock: 0, prodStatusCd: 'DRAFT' });
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      dtlCategories.length = 0;
      dtlItems.length = 0;
    };

    /* ── 편집 열기 ── */
    const openDtl = setProdId => {
      dtlMode.value = 'edit';
      editSetId.value = setProdId;
      const src = (props.adminData.setItems || [])
        .filter(s => s.setProdId === setProdId)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      dtlItems.splice(0, dtlItems.length, ...src.map((s, i) => ({
        _id:       _seq++,
        setItemId: s.setItemId,
        setProdId: s.setProdId,
        itemProdId: s.itemProdId ?? s.componentProdId ?? null,
        itemSkuId: s.itemSkuId || null,
        itemNm:    s.itemNm || '',
        itemQty:   s.itemQty || 1,
        itemDesc:  s.itemDesc || '',
        sortOrd:   s.sortOrd || i + 1,
        useYn:     s.useYn || 'Y',
      })));
      const pid = String(setProdId);
      const _catArr = (props.adminData.categoryProds || [])
        .filter(cp => String(cp.prodId) === pid)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(cp => ({ categoryId: cp.categoryId, categoryNm: getCategoryNm(cp.categoryId), depth: getCategoryDepth(cp.categoryId) }));
      dtlCategories.splice(0, dtlCategories.length, ..._catArr);
    };

    const closeDtl = () => { dtlMode.value = null; editSetId.value = null; dtlItems.length = 0; };

    const dtlProdNm = computed(() => dtlMode.value === 'new' ? (newForm.prodNm || '(신규 세트상품)') : getProdNm(editSetId.value));

    /* ── 구성품 추가 (연결상품) ── */
    const addItemFromProd = prod => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, setItemId: null,
        setProdId:  editSetId.value,
        itemProdId: prod.productId,
        itemSkuId:  null,
        itemNm:     prod.prodNm || prod.productName || '',
        itemQty:    1,
        itemDesc:   '',
        sortOrd:    maxSort + 1,
        useYn:      'Y',
      });
      pickerOpen.value = false; pickerSearch.value = '';
    };

    /* ── 구성품 추가 (비상품 — 직접입력) ── */
    const addItemBlank = () => {
      const maxSort = dtlItems.length ? Math.max(...dtlItems.map(d => d.sortOrd)) : 0;
      dtlItems.push({
        _id: _seq++, setItemId: null,
        setProdId:  editSetId.value,
        itemProdId: null,
        itemSkuId:  null,
        itemNm:     '',
        itemQty:    1,
        itemDesc:   '',
        sortOrd:    maxSort + 1,
        useYn:      'Y',
      });
    };

    const removeItem = idx => dtlItems.splice(idx, 1);

    /* ── 저장 ── */
    const saveDtl = async () => {
      Object.keys(newErrors).forEach(k => delete newErrors[k]);
      if (dtlMode.value === 'new') {
        if (!newForm.prodNm.trim()) newErrors.prodNm = '세트상품명을 입력해주세요.';
        if (!newForm.salePrice || newForm.salePrice <= 0) newErrors.salePrice = '판매가를 입력해주세요.';
        if (Object.keys(newErrors).length) { props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      }
      const hasBlankNm = dtlItems.some(d => !d.itemNm.trim());
      if (hasBlankNm) { props.showToast('구성품 표시명을 모두 입력해주세요.', 'error'); return; }

      const isNew     = dtlMode.value === 'new';
      const newProdId = isNew ? (Math.max(0, ...(props.adminData.products || []).map(p => p.productId)) + 1) : null;
      const setProdId = isNew ? newProdId : editSetId.value;

      const ok = await props.showConfirm(isNew ? '등록' : '저장', isNew ? '세트상품을 등록하시겠습니까?' : '구성품 설정을 저장하시겠습니까?');
      if (!ok) return;
      if (isNew) {
        props.adminData.products.push({
          productId: newProdId, prodNm: newForm.prodNm,
          brandId: newForm.brandId, vendorId: newForm.vendorId,
          listPrice: newForm.listPrice, salePrice: newForm.salePrice,
          price: newForm.salePrice, stock: newForm.stock,
          prodTypeCd: 'SET', prodStatusCd: newForm.prodStatusCd,
          status: newForm.prodStatusCd === 'ACTIVE' ? '판매중' : '준비중',
          regDate: new Date().toISOString().slice(0, 10),
        });
      }
      const others = (props.adminData.setItems || []).filter(s => s.setProdId !== setProdId);
      props.adminData.setItems = [
        ...others,
        ...dtlItems.map((d, i) => ({
          setItemId:       d.setItemId || `SI_${setProdId}_${i + 1}`,
          siteId:          '1',
          setProdId,
          itemProdId:      d.itemProdId || null,
          componentProdId: d.itemProdId || null,
          itemSkuId:       d.itemSkuId || null,
          itemNm:          d.itemNm,
          itemQty:         d.itemQty,
          itemDesc:        d.itemDesc,
          sortOrd:         d.sortOrd,
          useYn:           d.useYn,
        })),
      ];
      if (!props.adminData.categoryProds) props.adminData.categoryProds = [];
      props.adminData.categoryProds = props.adminData.categoryProds.filter(cp => String(cp.prodId) !== String(setProdId));
      dtlCategories.forEach((cat, i) => {
        props.adminData.categoryProds.push({ categoryProdId: `CP_SET_${setProdId}_${i}`, siteId: '1', categoryId: cat.categoryId, prodId: setProdId, sortOrd: i + 1 });
      });
      if (isNew) { dtlMode.value = 'edit'; editSetId.value = newProdId; }
      try {
        const res = await (isNew ? window.adminApi.post('set', { prod: { ...newForm, prodTypeCd: 'SET' }, items: dtlItems }) : window.adminApi.put(`set/${setProdId}/items`, { items: dtlItems }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew ? '등록되었습니다.' : '저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    /* ── 삭제 ── */
    const deleteProd = async setProdId => {
      const ok = await props.showConfirm('삭제', '세트상품을 삭제하시겠습니까?\n구성품 설정도 함께 삭제됩니다.');
      if (!ok) return;
      props.adminData.setItems = (props.adminData.setItems || []).filter(s => s.setProdId !== setProdId);
      if (editSetId.value === setProdId) closeDtl();
      try {
        const res = await window.adminApi.delete(`set/${setProdId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const descOpen = ref(false);

    return {
      descOpen,
      searchNm, pager, pageNums, totalPages, setPage, totalCnt, pageList,
      onSearch, onReset, getProdNm, getProd, getBrandNm,
      getCategoryNm, getCategoryDepth,
      dtlCategories, catPickerOpen, catPickerSearch, catPickerList,
      addCategory, removeCategory, catDragIdx, catDragoverIdx, onCatDragStart, onCatDragOver, onCatDrop,
      dtlMode, editSetId, newForm, newErrors, dtlProdNm,
      dtlItems, openNew, openDtl, closeDtl, saveDtl, deleteProd,
      addItemFromProd, addItemBlank, removeItem,
      pickerOpen, pickerSearch, pickerList,
      dragIdx, dragoverIdx, onDragStart, onDragOver, onDrop,
      PAGE_SIZES, onSizeChange };
  },

  template: `
<div>
  <div class="page-title">세트상품관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#fff4ec;border-left:3px solid #e3803b;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#bf5a1a">세트상품</strong>은 여러 구성품을 하나의 세트로 판매하는 방식입니다.</span>
    <button @click="descOpen=!descOpen" style="margin-left:8px;font-size:12px;color:#e3803b;background:none;border:none;cursor:pointer;padding:0">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" style="margin-top:6px">
      ✔ 안분율 없이 <strong>세트 전체 단일 가격</strong>으로 판매·정산합니다.<br>
      ✔ 클레임은 <strong>세트 전체 단위</strong>로만 가능합니다 (부분 취소·교환·반품 불가).<br>
      ✔ 구성품은 등록 상품 연결 없이 <strong>비상품 항목</strong>도 추가할 수 있습니다.<br>
      <span style="color:#888;font-size:12px">예) 선물세트, 패키지 구성품, 사은품 포함 세트</span>
    </div>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">세트상품명</label>
      <input class="form-control" v-model="searchNm" @keyup.enter="onSearch"
             placeholder="세트상품명 검색" style="max-width:320px">
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">세트상품 목록</span>
      <span class="list-count">총 {{ totalCnt }}건</span>
      <div class="pager-right">
        <button class="btn btn-green btn-sm" @click="openNew">+ 신규등록</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>세트상품</th>
        <th style="width:70px;text-align:center">구성품수</th>
        <th style="width:110px;text-align:right">판매가</th>
        <th style="width:60px;text-align:center">재고</th>
        <th style="width:90px;text-align:center">상태</th>
        <th style="width:110px;text-align:center">관리</th>
      </tr></thead>
      <tbody>
        <template v-for="g in pageList" :key="g.setProdId">
          <tr :style="(dtlMode==='edit' && editSetId===g.setProdId) ? 'background:#e6f4ff' : ''">
            <td>
              <div style="display:flex;align-items:flex-start;gap:6px">
                <span class="badge badge-orange" style="flex-shrink:0;margin-top:1px">세트</span>
                <div>
                  <span class="title-link" @click="openDtl(g.setProdId)">{{ g.prodNm }}</span>
                  <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px">
                    <span v-for="(item,i) in g.items" :key="item.setItemId||i"
                          style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 7px;border-radius:10px;white-space:nowrap">
                      {{ item.itemNm }}
                      <span style="color:#1677ff">×{{ item.itemQty }}</span>
                      <span v-if="!item.itemProdId && !item.componentProdId" style="color:#f59e0b;margin-left:2px" title="비상품구성품">◆</span>
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td style="text-align:center">{{ g.itemCount }}개</td>
            <td style="text-align:right">
              {{ g.prod ? (g.prod.salePrice || g.prod.price || 0).toLocaleString() + '원' : '-' }}
            </td>
            <td style="text-align:center">
              {{ g.prod ? (g.prod.stock ?? '-') : '-' }}
            </td>
            <td style="text-align:center">
              <span :class="['badge',
                g.prod && g.prod.status==='판매중'         ? 'badge-green'  :
                g.prod && g.prod.prodStatusCd==='ACTIVE'  ? 'badge-green'  :
                g.prod && g.prod.prodStatusCd==='DRAFT'   ? 'badge-orange' : 'badge-gray']">
                {{ g.prod ? (g.prod.status || g.prod.prodStatusCd || '-') : '-' }}
              </span>
            </td>
            <td style="text-align:center" class="actions">
              <button class="btn btn-blue btn-xs" @click="openDtl(g.setProdId)">수정</button>
              <button class="btn btn-danger btn-xs" @click="deleteProd(g.setProdId)">삭제</button>
            </td>
          </tr>
        </template>
        <tr v-if="!pageList.length">
          <td colspan="6" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td>
        </tr>
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

  <!-- 신규등록 / 구성관리 (인라인 Dtl) -->
  <div v-if="dtlMode !== null" class="card"
       :style="dtlMode==='new' ? 'border-top:3px solid #52c41a' : 'border-top:3px solid #f59e0b'">

    <!-- Dtl 헤더 -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0">
      <div style="display:flex;align-items:center;gap:10px">
        <span :class="['badge', dtlMode==='new' ? 'badge-green' : 'badge-orange']">
          {{ dtlMode==='new' ? '신규' : '세트' }}
        </span>
        <strong style="font-size:15px">{{ dtlProdNm }}</strong>
        <span style="font-size:12px;color:#aaa">{{ dtlMode==='new' ? '세트상품 등록' : '구성품 관리' }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:3px 10px">
          🔒 세트 전체 단위로만 클레임 가능
        </span>
        <button class="btn btn-secondary btn-sm" @click="closeDtl">닫기</button>
        <button class="btn btn-primary btn-sm" @click="saveDtl">
          {{ dtlMode==='new' ? '등록' : '저장' }}
        </button>
      </div>
    </div>

    <!-- ① 기본정보 (신규 시만) -->
    <div v-if="dtlMode==='new'" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:12px">세트상품 기본정보 (pd_prod)</div>
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label class="form-label">세트상품명 <span style="color:#f5222d">*</span></label>
          <input class="form-control" :class="{'is-invalid': newErrors.prodNm}"
                 v-model="newForm.prodNm" placeholder="세트상품명 입력" maxlength="200">
          <div v-if="newErrors.prodNm" class="field-error">{{ newErrors.prodNm }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="newForm.prodStatusCd">
            <option value="DRAFT">준비중 (DRAFT)</option>
            <option value="ACTIVE">판매중 (ACTIVE)</option>
            <option value="INACTIVE">판매중지 (INACTIVE)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">정가 (list_price)</label>
          <input type="number" class="form-control" v-model.number="newForm.listPrice" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">판매가 (sale_price) <span style="color:#f5222d">*</span></label>
          <input type="number" class="form-control" :class="{'is-invalid': newErrors.salePrice}"
                 v-model.number="newForm.salePrice" min="0" placeholder="0">
          <div v-if="newErrors.salePrice" class="field-error">{{ newErrors.salePrice }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">재고 (세트 단위)</label>
          <input type="number" class="form-control" v-model.number="newForm.stock" min="0" placeholder="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">브랜드</label>
          <select class="form-control" v-model="newForm.brandId">
            <option value="">선택</option>
            <option v-for="b in (adminData.brands||[])" :key="b.brandId" :value="b.brandId">
              {{ b.brandNm || b.brandName }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">판매업체</label>
          <select class="form-control" v-model="newForm.vendorId">
            <option value="">선택</option>
            <option v-for="v in (adminData.vendors||[])" :key="v.vendorId" :value="v.vendorId">
              {{ v.vendorNm || v.vendorName }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ② 카테고리 -->
    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label class="form-label">카테고리 <span style="font-size:11px;color:#aaa;font-weight:400">N개 등록 · 첫 번째 = 대표</span></label>
        <div style="border:1px solid #e2e8f0;border-radius:6px;background:#fff;min-height:38px;padding:4px 6px">
          <div v-if="dtlCategories.length===0" style="color:#aaa;font-size:12px;padding:4px 2px">카테고리를 추가해주세요</div>
          <div v-for="(cat,idx) in dtlCategories" :key="cat.categoryId"
               draggable="true" @dragstart="onCatDragStart(idx)" @dragover.prevent="onCatDragOver(idx)" @drop.prevent="onCatDrop()"
               :style="catDragoverIdx===idx ? 'opacity:0.5' : ''"
               style="display:flex;align-items:center;gap:4px;padding:2px 0">
            <span style="cursor:grab;color:#bbb;font-size:14px;flex-shrink:0">≡</span>
            <span v-if="idx===0" style="font-size:10px;background:#f9a8d4;color:#9d174d;padding:1px 5px;border-radius:10px;flex-shrink:0">대표</span>
            <span style="font-size:11px;color:#94a3b8;flex-shrink:0">{{ ['','대','중','소'][cat.depth]||cat.depth }}▸</span>
            <span style="font-size:13px;flex:1">{{ cat.categoryNm }}</span>
            <button type="button" @click="removeCategory(idx)" style="border:none;background:none;color:#f87171;cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0">✕</button>
          </div>
          <button type="button" @click="catPickerOpen=true;catPickerSearch=''"
                  style="margin-top:4px;font-size:12px;color:#6366f1;border:1px dashed #a5b4fc;background:none;border-radius:4px;padding:2px 8px;cursor:pointer;width:100%">+ 카테고리 추가</button>
        </div>
      </div>
    </div>

    <!-- ③ 구성품 목록 -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:13px;font-weight:600;color:#555">구성품 목록 (pd_prod_set_item)</span>
      <span style="font-size:11px;color:#888;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:1px 8px">
        표시 목적 · 재고 개별 차감 없음 · 안분율 없음
      </span>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th style="width:28px"></th>
        <th style="width:180px">표시명 (item_nm) <span style="color:#f5222d">*</span></th>
        <th>연결상품 (item_prod_id)</th>
        <th style="width:80px;text-align:center">수량</th>
        <th>구성품 설명</th>
        <th style="width:60px;text-align:center">사용</th>
        <th style="width:50px;text-align:center">삭제</th>
      </tr></thead>
      <tbody>
        <tr v-for="(item, idx) in dtlItems" :key="item._id"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop="onDrop()"
            :style="dragoverIdx===idx ? 'background:#e6f4ff' : (item.useYn==='N' ? 'opacity:0.55' : '')">
          <td style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
          <td>
            <input class="form-control" v-model="item.itemNm" placeholder="표시명 입력"
                   style="font-size:13px;font-weight:500"
                   :class="{ 'is-invalid': !item.itemNm.trim() }">
          </td>
          <td>
            <div v-if="item.itemProdId" style="display:flex;align-items:center;gap:6px">
              <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:1px 6px;border-radius:4px">#{{ item.itemProdId }}</span>
              <span style="font-size:13px;color:#333">{{ getProdNm(item.itemProdId) }}</span>
              <button type="button" @click="item.itemProdId=null"
                      style="border:none;background:none;color:#f87171;cursor:pointer;font-size:12px;padding:0 2px">✕ 연결해제</button>
            </div>
            <div v-else style="display:flex;align-items:center;gap:6px">
              <span class="badge badge-orange" style="font-size:10px">비상품</span>
              <span style="font-size:12px;color:#aaa">상품 미연결 (예: 증정품·박스)</span>
            </div>
          </td>
          <td style="text-align:center">
            <input type="number" class="form-control" v-model.number="item.itemQty"
                   min="1" style="width:60px;text-align:center;margin:0 auto;padding:3px 6px">
          </td>
          <td>
            <input class="form-control" v-model="item.itemDesc"
                   placeholder="소재·용량·색상 등 부가 설명" style="font-size:12px">
          </td>
          <td style="text-align:center">
            <select class="form-control" v-model="item.useYn" style="width:56px;padding:2px 4px">
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </td>
          <td style="text-align:center">
            <button class="btn btn-danger btn-xs" @click="removeItem(idx)">✕</button>
          </td>
        </tr>
        <tr v-if="!dtlItems.length">
          <td colspan="7" style="text-align:center;padding:24px;color:#aaa">
            구성품이 없습니다. 아래 버튼으로 추가하세요.
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 구성품 추가 버튼 -->
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-secondary btn-sm" @click="pickerOpen=true;pickerSearch=''">
        + 상품 구성품 추가
      </button>
      <button class="btn btn-secondary btn-sm" @click="addItemBlank">
        + 비상품 구성품 추가 <span style="font-size:11px;color:#aaa">(박스·엽서 등)</span>
      </button>
    </div>
  </div>

  <!-- 상품 피커 모달 -->
  <teleport to="body" v-if="pickerOpen">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="pickerOpen=false">
      <div style="background:#fff;border-radius:14px;padding:24px;width:580px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">구성품 상품 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="pickerOpen=false">닫기</button>
        </div>
        <input class="form-control" v-model="pickerSearch"
               placeholder="상품명 / ID 검색" style="margin-bottom:12px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <table class="admin-table" style="margin:0">
            <thead><tr>
              <th style="width:44px">ID</th>
              <th>상품명</th>
              <th style="width:70px;text-align:center">카테고리</th>
              <th style="width:90px;text-align:right">판매가</th>
              <th style="width:56px;text-align:center">선택</th>
            </tr></thead>
            <tbody>
              <tr v-for="p in pickerList" :key="p.productId">
                <td style="color:#aaa;font-size:12px">{{ p.productId }}</td>
                <td>{{ p.prodNm || p.productName }}</td>
                <td style="text-align:center;font-size:12px;color:#888">{{ p.category || '-' }}</td>
                <td style="text-align:right">{{ (p.salePrice||p.price||0).toLocaleString() }}원</td>
                <td style="text-align:center">
                  <button class="btn btn-blue btn-xs" @click="addItemFromProd(p)">선택</button>
                </td>
              </tr>
              <tr v-if="!pickerList.length">
                <td colspan="5" style="text-align:center;padding:24px;color:#aaa">검색 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 카테고리 피커 모달 -->
  <teleport to="body">
    <div v-if="catPickerOpen"
         style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="catPickerOpen=false">
      <div style="background:#fff;border-radius:12px;width:420px;max-height:520px;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18)">
        <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;background:linear-gradient(135deg,#fff0f4,#ffe4ec);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:700;font-size:15px">카테고리 선택</span>
          <button type="button" @click="catPickerOpen=false" style="border:none;background:none;font-size:18px;cursor:pointer;color:#888">✕</button>
        </div>
        <div style="padding:10px 16px">
          <input class="form-control" v-model="catPickerSearch" placeholder="카테고리 검색..." style="font-size:13px">
        </div>
        <div style="overflow-y:auto;flex:1;padding:0 8px 12px">
          <div v-if="catPickerList.length===0" style="text-align:center;color:#aaa;padding:24px;font-size:13px">검색 결과 없음</div>
          <div v-for="cat in catPickerList" :key="cat.categoryId"
               @click="addCategory(cat)"
               style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px"
               onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background=''">
            <span style="font-size:10px;color:#94a3b8;width:20px;flex-shrink:0">{{ ['','대','중','소'][cat.depth||1]||'' }}</span>
            <span>{{ cat.categoryNm }}</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</div>`
};
