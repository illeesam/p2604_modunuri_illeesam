/* ShopJoy Admin - 게시판관리 상세/등록 */
window.BbmDtl = {
  name: 'BbmDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const form = reactive({
      bbmCode: '', bbmNm: '', bbmType: '일반',
      allowComment: '불가', allowAttach: '불가', allowLike: 'N',
      contentType: 'textarea', scopeType: '공개',
      sortOrd: 1, useYn: 'Y', remark: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      bbmCode: yup.string().required('게시판코드를 입력해주세요.'),
      bbmNm: yup.string().required('게시판명을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const b = props.adminData.bbms.find(x => x.bbmId === props.editId);
        if (b) Object.assign(form, { ...b });
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
        path: `bbm/${form.bbmId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.bbms.push({ ...form, bbmId: props.adminData.nextId(props.adminData.bbms, 'bbmId'), regDate: new Date().toISOString().slice(0, 10) });
          } else {
            const idx = props.adminData.bbms.findIndex(x => x.bbmId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.bbms[idx], { ...form });
          }
        },
        navigate: props.navigate,
        navigateTo: 'syBbmMng',
      });
    };

    return { isNew, form, errors, save, siteNm };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '게시판 등록' : (viewMode ? '게시판 상세' : '게시판 수정') }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">게시판코드 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmCode" placeholder="BOARD_CODE" style="font-family:monospace;" :readonly="viewMode" :class="errors.bbmCode ? 'is-invalid' : ''" />
        <span v-if="errors.bbmCode" class="field-error">{{ errors.bbmCode }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">게시판명 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.bbmNm" placeholder="게시판명" :readonly="viewMode" :class="errors.bbmNm ? 'is-invalid' : ''" />
        <span v-if="errors.bbmNm" class="field-error">{{ errors.bbmNm }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.bbmType" :disabled="viewMode">
          <option>일반</option><option>공지</option><option>갤러리</option><option>FAQ</option><option>QnA</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">댓글허용</label>
        <select class="form-control" v-model="form.allowComment" :disabled="viewMode">
          <option>불가</option><option>댓글허용</option><option>대댓글허용</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">첨부허용</label>
        <select class="form-control" v-model="form.allowAttach" :disabled="viewMode">
          <option>불가</option><option>1개</option><option>2개</option><option>3개</option><option>목록</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">좋아요허용</label>
        <select class="form-control" v-model="form.allowLike" :disabled="viewMode">
          <option value="Y">허용</option><option value="N">불가</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">내용입력</label>
        <select class="form-control" v-model="form.contentType" :disabled="viewMode">
          <option>불가</option><option>textarea</option><option>htmleditor</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">공개범위</label>
        <select class="form-control" v-model="form.scopeType" :disabled="viewMode">
          <option>공개</option><option>개인</option><option>회사</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn" :disabled="viewMode">
          <option value="Y">사용</option><option value="N">미사용</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <input class="form-control" v-model="form.remark" placeholder="비고" :readonly="viewMode" />
      </div>
    </div>
    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syBbmMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('syBbmMng')">취소</button>
      </template>
    </div>
  </div>
</div>
`
};
