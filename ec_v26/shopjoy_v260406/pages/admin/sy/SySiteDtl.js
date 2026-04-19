/* ShopJoy Admin - 사이트관리 상세/등록 */
window.SySiteDtl = {
  name: 'SySiteDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, ref } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);

    const SITE_TYPES = ['이커머스', '숙박공유', '전문가연결', 'IT매칭', '부동산', '교육', '중고거래', '영화예매', '음식배달', '가격비교', '시각화', '홈페이지', '기타'];

    const form = reactive({
      siteId: null, siteCode: '', siteType: '홈페이지', siteNm: '', domain: '',
      logoUrl: '', favicon: '', description: '',
      email: '', phone: '',
      zipcode: '', address: '', addressDetail: '',
      businessNo: '', ceo: '', statusCd: '운영중',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const schema = yup.object({
      siteCode: yup.string().required('사이트코드를 입력해주세요.'),
      siteNm: yup.string().required('사이트명을 입력해주세요.'),
      domain: yup.string().required('도메인을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const s = props.adminData.sites.find(x => x.siteId === props.editId);
        if (s) Object.assign(form, { ...s });
      } else {
        const nextNum = props.adminData.nextId(props.adminData.sites, 'siteId');
        form.siteCode = 'ST' + String(nextNum).padStart(4, '0');
      }
    });

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.zipcode = data.zonecode;
            form.address = data.roadAddress || data.jibunAddress;
            if (addrDetailRef.value) addrDetailRef.value.focus();
          },
        }).open();
      };
      if (window.daum && window.daum.Postcode) { run(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = run;
      document.head.appendChild(s);
    };

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) {
        props.adminData.sites.push({ ...form, siteId: props.adminData.nextId(props.adminData.sites, 'siteId'), regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = props.adminData.sites.findIndex(x => x.siteId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.sites[idx], { ...form });
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`sites/${form.siteId}`, { ...form }) : window.adminApi.put(`sites/${form.siteId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('sySiteMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, SITE_TYPES, addrDetailRef, openKakaoPostcode };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '사이트 등록' : (viewMode ? '사이트 상세' : '사이트 수정') }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.siteId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트코드 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.siteCode" placeholder="ST0001" style="font-family:monospace;font-weight:600;" :readonly="viewMode" :class="errors.siteCode ? 'is-invalid' : ''" />
        <span v-if="errors.siteCode" class="field-error">{{ errors.siteCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">사이트유형</label>
        <select class="form-control" v-model="form.siteType" :disabled="viewMode">
          <option v-for="t in SITE_TYPES" :key="t">{{ t }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.siteNm" placeholder="ShopJoy" :readonly="viewMode" :class="errors.siteNm ? 'is-invalid' : ''" />
        <span v-if="errors.siteNm" class="field-error">{{ errors.siteNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">도메인 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.domain" placeholder="shopjoy.com" :readonly="viewMode" :class="errors.domain ? 'is-invalid' : ''" />
        <span v-if="errors.domain" class="field-error">{{ errors.domain }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">사이트 설명</label>
        <input class="form-control" v-model="form.description" placeholder="사이트 한줄 설명" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표이메일</label>
        <input class="form-control" v-model="form.email" placeholder="help@shopjoy.com" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">대표전화</label>
        <input class="form-control" v-model="form.phone" placeholder="02-1234-5678" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceo" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호</label>
        <input class="form-control" v-model="form.businessNo" placeholder="000-00-00000" :readonly="viewMode" />
      </div>
    </div>

    <!-- 주소 영역 -->
    <div class="form-group">
      <label class="form-label">주소</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input class="form-control" v-model="form.zipcode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!viewMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
          style="white-space:nowrap;">🔍 주소 검색</button>
      </div>
      <input class="form-control" v-model="form.address"
        placeholder="기본주소 (주소 검색 후 자동 입력)" style="margin-bottom:6px;" readonly />
      <input class="form-control" v-model="form.addressDetail" ref="addrDetailRef"
        placeholder="상세주소 (동/호수 등)" :readonly="viewMode" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">로고 URL</label>
        <input class="form-control" v-model="form.logoUrl" placeholder="/assets/img/logo.png" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">파비콘 URL</label>
        <input class="form-control" v-model="form.favicon" placeholder="/favicon.ico" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">운영상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>운영중</option><option>점검중</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('sySiteMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('sySiteMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
