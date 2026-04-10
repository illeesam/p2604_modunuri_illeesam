/* ShopJoy Admin - 사이트관리 상세/등록 */
window.SiteDtl = {
  name: 'SiteDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);

    const SITE_TYPES = ['이커머스', '숙박공유', '전문가연결', 'IT매칭', '부동산', '교육', '중고거래', '영화예매', '음식배달', '가격비교', '시각화', '홈페이지', '기타'];

    const form = reactive({
      siteCode: '', siteType: '홈페이지', siteName: '', domain: '',
      logoUrl: '', favicon: '', description: '',
      email: '', phone: '', address: '', businessNo: '', ceo: '', status: '운영중',
    });
    const errors = reactive({});

    const schema = yup.object({
      siteCode: yup.string().required('사이트코드를 입력해주세요.'),
      siteName: yup.string().required('사이트명을 입력해주세요.'),
      domain: yup.string().required('도메인을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const s = props.adminData.sites.find(x => x.siteId === props.editId);
        if (s) Object.assign(form, { ...s });
      } else {
        /* 신규 등록 시 siteCode 자동제안 */
        const nextNum = props.adminData.nextId(props.adminData.sites, 'siteId');
        form.siteCode = 'ST' + String(nextNum).padStart(4, '0');
      }
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
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `sites/${form.siteId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.sites.push({ ...form, siteId: props.adminData.nextId(props.adminData.sites, 'siteId'), regDate: new Date().toISOString().slice(0, 10) });
          } else {
            const idx = props.adminData.sites.findIndex(x => x.siteId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.sites[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'sySiteMng',
      });
    };

    return { isNew, form, errors, save, SITE_TYPES };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '사이트 등록' : '사이트 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트코드 <span class="req">*</span></label>
        <input class="form-control" v-model="form.siteCode" placeholder="ST0001" style="font-family:monospace;font-weight:600;" :class="errors.siteCode ? 'is-invalid' : ''" />
        <span v-if="errors.siteCode" class="field-error">{{ errors.siteCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">사이트유형</label>
        <select class="form-control" v-model="form.siteType">
          <option v-for="t in SITE_TYPES" :key="t">{{ t }}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.siteName" placeholder="ShopJoy" :class="errors.siteName ? 'is-invalid' : ''" />
        <span v-if="errors.siteName" class="field-error">{{ errors.siteName }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">도메인 <span class="req">*</span></label>
        <input class="form-control" v-model="form.domain" placeholder="shopjoy.com" :class="errors.domain ? 'is-invalid' : ''" />
        <span v-if="errors.domain" class="field-error">{{ errors.domain }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">사이트 설명</label>
        <input class="form-control" v-model="form.description" placeholder="사이트 한줄 설명" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표이메일</label>
        <input class="form-control" v-model="form.email" placeholder="help@shopjoy.com" />
      </div>
      <div class="form-group">
        <label class="form-label">대표전화</label>
        <input class="form-control" v-model="form.phone" placeholder="02-1234-5678" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대표자명</label>
        <input class="form-control" v-model="form.ceo" />
      </div>
      <div class="form-group">
        <label class="form-label">사업자등록번호</label>
        <input class="form-control" v-model="form.businessNo" placeholder="000-00-00000" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">주소</label>
        <input class="form-control" v-model="form.address" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">로고 URL</label>
        <input class="form-control" v-model="form.logoUrl" placeholder="/assets/img/logo.png" />
      </div>
      <div class="form-group">
        <label class="form-label">파비콘 URL</label>
        <input class="form-control" v-model="form.favicon" placeholder="/favicon.ico" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">운영상태</label>
        <select class="form-control" v-model="form.status">
          <option>운영중</option><option>점검중</option><option>비활성</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('sySiteMng')">취소</button>
    </div>
  </div>
</div>
`
};
