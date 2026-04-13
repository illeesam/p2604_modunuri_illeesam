/* ShopJoy Admin - 상품관리 상세/등록 */
window.EcProdDtl = {
  name: 'EcProdDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const topTab = ref('info');

    const form = reactive({
      prodNm: '', category: '상의', price: 0, stock: 0,
      brand: 'ShopJoy', status: '판매중', regDate: '', description: '',
      opt1s: '', opt2s: '',
      // 옵션설정
      optionUse: false, optionGroups: '',
      // 연관상품
      relatedProductIds: '',
      // 가격설정
      salePrice: 0, costPrice: 0, pointRate: 0, taxType: '과세',
    });
    const errors = reactive({});

    const schema = yup.object({
      prodNm: yup.string().required('상품명을 입력해주세요.'),
      price: yup.number().typeError('숫자를 입력해주세요.').required('가격을 입력해주세요.').min(1, '가격은 1원 이상이어야 합니다.'),
    });

    /* 상품 이미지 목록 [{ id, previewUrl, isMain, opt1s, opt2s }] */
    const images = ref([]);
    let imgIdSeq = 1;

    const addImageByUrl = () => {
      images.value.push({ id: imgIdSeq++, previewUrl: '', isMain: images.value.length === 0, opt1s: '', opt2s: '' });
    };

    const onFileChange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          images.value.push({ id: imgIdSeq++, previewUrl: ev.target.result, isMain: images.value.length === 0, opt1s: '', opt2s: '' });
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };

    const setMain = (id) => {
      images.value.forEach(img => { img.isMain = img.id === id; });
    };

    const removeImage = (id) => {
      const idx = images.value.findIndex(img => img.id === id);
      if (idx !== -1) {
        const wasMain = images.value[idx].isMain;
        images.value.splice(idx, 1);
        if (wasMain && images.value.length > 0) images.value[0].isMain = true;
      }
    };

    const fileInputRef = ref(null);
    const triggerFileInput = () => { if (fileInputRef.value) fileInputRef.value.click(); };

    const descEl = ref(null);
    let _qDesc = null;

    /* ── 판매계획 CRUD ── */
    const salePlans = ref([]);
    let planIdSeq = 1;

    const planVisible = computed(() => salePlans.value.filter(r => r._row_status !== 'D'));

    const planAllChecked = computed({
      get: () => planVisible.value.length > 0 && planVisible.value.every(r => r._checked),
      set: (v) => planVisible.value.forEach(r => { r._checked = v; }),
    });

    const addPlanRow = () => {
      salePlans.value.unshift({
        _id: planIdSeq++, _row_status: 'I', _checked: false,
        startDate: '', startTime: '00:00', endDate: '', endTime: '23:59',
        planStatus: '준비중',
        price: form.price || 0, salePrice: form.salePrice || 0,
        costPrice: form.costPrice || 0, pointRate: form.pointRate || 0, taxType: form.taxType || '과세',
      });
    };

    const onPlanChange = (row) => { if (row._row_status === 'N') row._row_status = 'U'; };

    const deletePlanChecked = () => {
      for (let i = salePlans.value.length - 1; i >= 0; i--) {
        const row = salePlans.value[i];
        if (!row._checked) continue;
        if (row._row_status === 'I') salePlans.value.splice(i, 1);
        else row._row_status = 'D';
      }
    };

    const deleteLastPlanRow = () => {
      const idx = salePlans.value.findIndex(r => r._row_status === 'I');
      if (idx !== -1) salePlans.value.splice(idx, 1);
      else props.showToast('삭제할 신규 행이 없습니다.', 'error');
    };

    const planRowStyle = (s) => ({
      'I': 'background:#f6ffed;',
      'U': 'background:#fffbe6;',
      'D': 'background:#fff1f0;opacity:0.6;',
    }[s] || '');

    const planStatusBadge = (s) => ({
      'I': 'badge-green', 'U': 'badge-orange', 'D': 'badge-red', 'N': 'badge-gray',
    }[s] || 'badge-gray');

    onMounted(async () => {
      if (!isNew.value) {
        const p = props.adminData.getProduct(props.editId);
        if (p) Object.assign(form, { ...p });
        // 기존 이미지 로드
        if (p && p.images && p.images.length) {
          images.value = p.images.map(img => ({ ...img, id: imgIdSeq++ }));
        } else if (p && p.mainImage) {
          images.value = [{ id: imgIdSeq++, previewUrl: p.mainImage, isMain: true, opt1s: '', opt2s: '' }];
        }
        // 판매계획 로드
        if (p && p.salePlans && p.salePlans.length) {
          salePlans.value = p.salePlans.map(r => ({ ...r, _id: planIdSeq++, _checked: false }));
        }
      }
      await nextTick();
      if (descEl.value) {
        _qDesc = new Quill(descEl.value, {
          theme: 'snow',
          placeholder: '상품 설명을 입력해주세요.',
          modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline'],[{color:[]},{background:[]}],[{list:'ordered'},{list:'bullet'}],['link','blockquote','clean']] }
        });
        if (form.description) _qDesc.root.innerHTML = form.description;
        _qDesc.on('text-change', () => { form.description = _qDesc.root.innerHTML; });
      }
    });

    onBeforeUnmount(() => { if (_qDesc) { form.description = _qDesc.root.innerHTML; _qDesc = null; } });

    /* 연관상품 파싱 */
    const relatedProducts = computed(() => {
      if (!form.relatedProductIds) return [];
      return form.relatedProductIds.split(',').map(s => Number(s.trim())).filter(Boolean)
        .map(id => props.adminData.getProduct(id)).filter(Boolean);
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const imgData = images.value.map(({ id, ...rest }) => rest);
      const mainImg = images.value.find(img => img.isMain);
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `products/${form.productId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.products.push({
              ...form,
              productId: props.adminData.nextId(props.adminData.products, 'productId'),
              price: Number(form.price), stock: Number(form.stock),
              regDate: form.regDate || new Date().toISOString().slice(0, 10),
              images: imgData,
              mainImage: mainImg ? mainImg.previewUrl : '',
            });
          } else {
            const idx = props.adminData.products.findIndex(x => x.productId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.products[idx], {
              ...form, price: Number(form.price), stock: Number(form.stock),
              images: imgData, mainImage: mainImg ? mainImg.previewUrl : '',
            });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecProdMng',
      });
    };

    return {
      isNew, topTab, form, errors, relatedProducts, save,
      images, addImageByUrl, onFileChange, setMain, removeImage, fileInputRef, triggerFileInput,
      salePlans, planVisible, planAllChecked, addPlanRow, onPlanChange,
      deletePlanChecked, deleteLastPlanRow, planRowStyle, planStatusBadge,
      descEl,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '상품 등록' : (viewMode ? '상품 상세' : '상품 수정') }}</div>
  <div class="card">

    <!-- 상단 탭 -->
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:topTab==='info'}"    @click="topTab='info'">기본정보</button>
      <button class="tab-btn" :class="{active:topTab==='option'}"  @click="topTab='option'">옵션설정</button>
      <button class="tab-btn" :class="{active:topTab==='detail'}"  @click="topTab='detail'">상세설정</button>
      <button class="tab-btn" :class="{active:topTab==='image'}"   @click="topTab='image'">상품이미지설정</button>
      <button class="tab-btn" :class="{active:topTab==='related'}" @click="topTab='related'">연관상품</button>
      <button class="tab-btn" :class="{active:topTab==='price'}"   @click="topTab='price'">가격설정</button>
    </div>

    <!-- 기본정보 -->
    <div v-show="topTab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">상품명 <span v-if="!viewMode" class="req">*</span></label>
          <input class="form-control" v-model="form.prodNm" placeholder="상품명" :readonly="viewMode" :class="errors.prodNm ? 'is-invalid' : ''" />
          <span v-if="errors.prodNm" class="field-error">{{ errors.prodNm }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">카테고리</label>
          <select class="form-control" v-model="form.category" :disabled="viewMode">
            <option>상의</option><option>하의</option><option>원피스</option><option>아우터</option><option>가방</option><option>기타</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">브랜드</label>
          <input class="form-control" v-model="form.brand" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">상태</label>
          <select class="form-control" v-model="form.status" :disabled="viewMode">
            <option>판매중</option><option>품절</option><option>판매중지</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">재고</label>
          <input class="form-control" type="number" v-model.number="form.stock" placeholder="0" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">등록일</label>
          <input class="form-control" type="date" v-model="form.regDate" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 옵션설정 -->
    <div v-show="topTab==='option'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" v-model="form.optionUse" :disabled="viewMode" />
          <span style="font-size:13px;font-weight:500;">옵션 사용</span>
        </label>
      </div>
      <template v-if="form.optionUse">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">색상 (쉼표 구분)</label>
            <input class="form-control" v-model="form.opt1s" placeholder="블랙, 화이트, 베이지" :readonly="viewMode" />
          </div>
          <div class="form-group">
            <label class="form-label">사이즈 (쉼표 구분)</label>
            <input class="form-control" v-model="form.opt2s" placeholder="XS, S, M, L, XL" :readonly="viewMode" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">옵션 그룹 (쉼표 구분)</label>
          <input class="form-control" v-model="form.optionGroups" placeholder="색상, 사이즈, 소재" :readonly="viewMode" />
        </div>
        <!-- 옵션 조합 미리보기 -->
        <div v-if="form.opt1s || form.opt2s" style="margin-top:12px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
          <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:8px;">옵션 미리보기</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span v-for="c in (form.opt1s||'').split(',').map(s=>s.trim()).filter(Boolean)" :key="c"
              class="tag" style="background:#fde8ee;color:#e8587a;">{{ c }}</span>
            <span v-for="s in (form.opt2s||'').split(',').map(s=>s.trim()).filter(Boolean)" :key="s"
              class="tag" style="background:#e6f4ff;color:#1677ff;">{{ s }}</span>
          </div>
        </div>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">옵션 사용을 활성화하면 설정이 표시됩니다.</div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 상세설정 -->
    <div v-show="topTab==='detail'">
      <div class="form-group">
        <label class="form-label">상품 설명</label>
        <div v-if="viewMode" class="form-control" style="min-height:200px;line-height:1.6;" v-html="form.description || '<span style=color:#bbb>-</span>'"></div>
        <div v-else ref="descEl" style="min-height:200px;background:#fff;"></div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 상품이미지설정 -->
    <div v-show="topTab==='image'">
      <!-- 파일 input (숨김) -->
      <input type="file" ref="fileInputRef" multiple accept="image/*" style="display:none" @change="onFileChange" />

      <!-- 추가 버튼 -->
      <div v-if="!viewMode" style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
        <button class="btn btn-secondary" @click="triggerFileInput">+ 파일 선택</button>
        <button class="btn btn-secondary" @click="addImageByUrl">+ URL 입력</button>
        <span style="font-size:12px;color:#aaa;">{{ images.length }}개 이미지</span>
      </div>

      <!-- 이미지 없음 -->
      <div v-if="images.length === 0"
        style="border:2px dashed #e0e0e0;border-radius:10px;padding:40px;text-align:center;color:#bbb;font-size:13px;"
        :style="viewMode ? '' : 'cursor:pointer;'"
        @click="viewMode ? null : triggerFileInput()">
        클릭하거나 파일을 끌어다 놓으세요
      </div>

      <!-- 이미지 목록 -->
      <div v-for="(img, idx) in images" :key="img.id"
        style="display:flex;gap:14px;align-items:flex-start;padding:14px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:10px;background:#fff;"
        :style="img.isMain ? 'border-color:#e8587a;background:#fff8f9;' : ''">

        <!-- 썸네일 -->
        <div style="flex-shrink:0;width:90px;height:90px;border-radius:8px;overflow:hidden;background:#f5f5f5;border:1px solid #e0e0e0;display:flex;align-items:center;justify-content:center;">
          <img v-if="img.previewUrl" :src="img.previewUrl" style="width:100%;height:100%;object-fit:cover;" />
          <span v-else style="font-size:11px;color:#bbb;text-align:center;padding:4px;">URL 미입력</span>
        </div>

        <!-- 설정 영역 -->
        <div style="flex:1;min-width:0;">
          <!-- URL 입력 (URL 추가 방식일 때) -->
          <div v-if="!img.previewUrl || img.previewUrl.startsWith('http')" class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:11px;">이미지 URL</label>
            <input class="form-control" v-model="img.previewUrl" placeholder="https://..." style="font-size:12px;" :readonly="viewMode" />
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:120px;margin-bottom:8px;">
              <label class="form-label" style="font-size:11px;">색상 <span style="color:#aaa;">(쉼표 구분)</span></label>
              <input class="form-control" v-model="img.opt1s" placeholder="블랙, 화이트" style="font-size:12px;" :readonly="viewMode" />
            </div>
            <div class="form-group" style="flex:1;min-width:120px;margin-bottom:8px;">
              <label class="form-label" style="font-size:11px;">사이즈 <span style="color:#aaa;">(쉼표 구분)</span></label>
              <input class="form-control" v-model="img.opt2s" placeholder="S, M, L" style="font-size:12px;" :readonly="viewMode" />
            </div>
          </div>

          <!-- 색상/사이즈 태그 미리보기 -->
          <div v-if="img.opt1s || img.opt2s" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">
            <span v-for="c in (img.opt1s||'').split(',').map(s=>s.trim()).filter(Boolean)" :key="'c'+c"
              class="tag" style="font-size:11px;background:#fde8ee;color:#e8587a;padding:2px 7px;">{{ c }}</span>
            <span v-for="s in (img.opt2s||'').split(',').map(s=>s.trim()).filter(Boolean)" :key="'s'+s"
              class="tag" style="font-size:11px;background:#e6f4ff;color:#1677ff;padding:2px 7px;">{{ s }}</span>
          </div>
        </div>

        <!-- 우측 버튼 -->
        <div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <template v-if="!viewMode">
            <button v-if="!img.isMain" class="btn btn-sm btn-secondary" @click="setMain(img.id)" style="white-space:nowrap;font-size:11px;">대표 설정</button>
            <span v-else style="font-size:11px;font-weight:700;color:#e8587a;padding:4px 8px;background:#fde8ee;border-radius:4px;">★ 대표</span>
            <button class="btn btn-sm btn-danger" @click="removeImage(img.id)" style="font-size:11px;">삭제</button>
          </template>
          <span v-else style="font-size:11px;font-weight:700;color:#e8587a;padding:4px 8px;background:#fde8ee;border-radius:4px;" v-if="img.isMain">★ 대표</span>
          <span style="font-size:11px;color:#bbb;">{{ idx+1 }}/{{ images.length }}</span>
        </div>
      </div>

      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 연관상품 -->
    <div v-show="topTab==='related'">
      <div class="form-group">
        <label class="form-label">연관 상품 ID (쉼표 구분)</label>
        <input class="form-control" v-model="form.relatedProductIds" placeholder="1, 2, 3" :readonly="viewMode" />
      </div>
      <table class="admin-table" v-if="relatedProducts.length" style="margin-top:12px;">
        <thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>관리</th></tr></thead>
        <tbody>
          <tr v-for="p in relatedProducts" :key="p.productId">
            <td>{{ p.productId }}</td>
            <td><span class="ref-link" @click="showRefModal('product', p.productId)">{{ p.prodNm }}</span></td>
            <td>{{ p.category }}</td>
            <td>{{ p.price.toLocaleString() }}원</td>
            <td>{{ p.stock }}개</td>
            <td>{{ p.status }}</td>
            <td><button class="btn btn-blue btn-sm" @click="navigate('ecProdDtl',{id:p.productId})">수정</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="!form.relatedProductIds" style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 상품 ID를 입력하세요.</div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 가격설정 -->
    <div v-show="topTab==='price'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">판매가 <span v-if="!viewMode" class="req">*</span></label>
          <input class="form-control" type="number" v-model.number="form.price" placeholder="0" :readonly="viewMode" :class="errors.price ? 'is-invalid' : ''" />
          <span v-if="errors.price" class="field-error">{{ errors.price }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">할인가 (0=미적용)</label>
          <input class="form-control" type="number" v-model.number="form.salePrice" placeholder="0" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">원가</label>
          <input class="form-control" type="number" v-model.number="form.costPrice" placeholder="0" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">적립 포인트율 (%)</label>
          <input class="form-control" type="number" v-model.number="form.pointRate" placeholder="0" min="0" max="100" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">과세 유형</label>
          <select class="form-control" v-model="form.taxType" :disabled="viewMode">
            <option>과세</option><option>면세</option><option>영세</option>
          </select>
        </div>
        <div class="form-group" v-if="form.salePrice > 0">
          <label class="form-label">할인율</label>
          <div class="readonly-field" style="color:#e8587a;font-weight:700;">
            {{ form.price > 0 ? Math.round((1 - form.salePrice/form.price)*100) : 0 }}%
          </div>
        </div>
      </div>
      <div style="margin-top:4px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
        <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">가격 요약</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center;">
          <div><div style="font-size:20px;font-weight:700;color:#1a1a2e;">{{ form.price.toLocaleString() }}원</div><div style="font-size:11px;color:#888;margin-top:2px;">판매가</div></div>
          <div><div style="font-size:20px;font-weight:700;color:#e8587a;">{{ form.salePrice > 0 ? form.salePrice.toLocaleString()+'원' : '-' }}</div><div style="font-size:11px;color:#888;margin-top:2px;">할인가</div></div>
          <div><div style="font-size:20px;font-weight:700;color:#52c41a;">{{ form.pointRate }}%</div><div style="font-size:11px;color:#888;margin-top:2px;">포인트율</div></div>
        </div>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecProdMng')">취소</button>
        </template>
      </div>

      <!-- 판매계획 CRUD -->
      <div style="margin-top:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:#333;">판매계획 <span style="font-size:12px;font-weight:400;color:#888;">{{ planVisible.length }}건</span></div>
          <div v-if="!viewMode" style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-danger"    @click="deletePlanChecked">체크삭제</button>
            <button class="btn btn-sm btn-secondary" @click="addPlanRow">행추가</button>
            <button class="btn btn-sm btn-secondary" @click="deleteLastPlanRow">행삭제</button>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="admin-table" style="min-width:1100px;font-size:12px;">
            <thead>
              <tr>
                <th style="width:40px;">순번</th>
                <th style="width:42px;">상태</th>
                <th style="width:36px;"><input type="checkbox" :checked="planAllChecked" @change="e => planAllChecked = e.target.checked" :disabled="viewMode" /></th>
                <th style="width:130px;">시작일시</th>
                <th style="width:130px;">종료일시</th>
                <th style="width:80px;">판매상태</th>
                <th style="width:90px;">판매가</th>
                <th style="width:90px;">할인가</th>
                <th style="width:80px;">원가</th>
                <th style="width:70px;">포인트율</th>
                <th style="width:70px;">과세유형</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in planVisible" :key="row._id" :style="planRowStyle(row._row_status)">
                <td style="text-align:center;color:#888;">{{ idx + 1 }}</td>
                <td style="text-align:center;">
                  <span class="badge" :class="planStatusBadge(row._row_status)" style="font-size:10px;padding:1px 5px;">{{ row._row_status }}</span>
                </td>
                <td style="text-align:center;">
                  <input type="checkbox" v-model="row._checked" :disabled="viewMode" />
                </td>
                <td>
                  <div style="display:flex;gap:2px;">
                    <input type="date" v-model="row.startDate" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100px;" :readonly="viewMode" />
                    <input type="time" v-model="row.startTime" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:70px;" :readonly="viewMode" />
                  </div>
                </td>
                <td>
                  <div style="display:flex;gap:2px;">
                    <input type="date" v-model="row.endDate" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100px;" :readonly="viewMode" />
                    <input type="time" v-model="row.endTime" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:70px;" :readonly="viewMode" />
                  </div>
                </td>
                <td>
                  <select v-model="row.planStatus" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;" :disabled="viewMode">
                    <option>준비중</option><option>판매예정</option><option>판매중</option><option>판매중지</option><option>판매종료</option>
                  </select>
                </td>
                <td><input type="number" v-model.number="row.price"     @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" :readonly="viewMode" /></td>
                <td><input type="number" v-model.number="row.salePrice" @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" :readonly="viewMode" /></td>
                <td><input type="number" v-model.number="row.costPrice" @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" :readonly="viewMode" /></td>
                <td><input type="number" v-model.number="row.pointRate" @input="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;text-align:right;" min="0" max="100" :readonly="viewMode" /></td>
                <td>
                  <select v-model="row.taxType" @change="onPlanChange(row)" style="font-size:11px;border:1px solid #ddd;border-radius:4px;padding:2px 4px;width:100%;" :disabled="viewMode">
                    <option>과세</option><option>면세</option><option>영세</option>
                  </select>
                </td>
              </tr>
              <tr v-if="planVisible.length === 0">
                <td colspan="11" style="text-align:center;color:#aaa;padding:20px;">판매계획이 없습니다. [행추가]로 추가하세요.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;font-size:11px;color:#aaa;align-items:center;">
          <span style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:3px;padding:1px 6px;color:#389e0d;">I 신규</span>
          <span style="background:#fffbe6;border:1px solid #ffe58f;border-radius:3px;padding:1px 6px;color:#d46b08;">U 수정</span>
          <span style="background:#fff1f0;border:1px solid #ffa39e;border-radius:3px;padding:1px 6px;color:#cf1322;">D 삭제예정</span>
          <span style="background:#f5f5f5;border:1px solid #d9d9d9;border-radius:3px;padding:1px 6px;color:#888;">N 미변경</span>
          <span style="margin-left:6px;">※ 가격 반영은 배치로 처리됩니다.</span>
        </div>
      </div>
    </div>

  </div>
  <div v-if="!isNew" class="card">
    <prod-hist :prod-id="editId" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" />
  </div>
</div>
`
};
