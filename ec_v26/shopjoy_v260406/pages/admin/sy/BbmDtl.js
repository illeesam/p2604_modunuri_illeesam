/* ShopJoy Admin - 게시판관리 상세/등록 */
window.BbmDtl = {
  name: 'BbmDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const form = reactive({
      bbmCode: '', bbmName: '', bbmType: '일반',
      allowComment: '불가', allowAttach: '불가', allowLike: 'N',
      contentType: 'textarea', scopeType: '공개',
      sortOrd: 1, useYn: 'Y', remark: '',
    });

    onMounted(() => {
      if (!isNew.value) {
        const b = props.adminData.bbms.find(x => x.bbmId === props.editId);
        if (b) Object.assign(form, { ...b });
      }
    });

    const save = () => {
      if (!form.bbmCode.trim()) { props.showToast('게시판코드를 입력해주세요.', 'error'); return; }
      if (!form.bbmName.trim()) { props.showToast('게시판명을 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.bbms.push({
          ...form,
          bbmId: props.adminData.nextId(props.adminData.bbms, 'bbmId'),
          regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('게시판이 등록되었습니다.');
      } else {
        const idx = props.adminData.bbms.findIndex(x => x.bbmId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.bbms[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('syBbmMng');
    };

    return { isNew, form, save };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '게시판 등록' : '게시판 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">게시판코드 <span class="req">*</span></label>
        <input class="form-control" v-model="form.bbmCode" placeholder="BOARD_CODE" style="font-family:monospace;" />
      </div>
      <div class="form-group">
        <label class="form-label">게시판명 <span class="req">*</span></label>
        <input class="form-control" v-model="form.bbmName" placeholder="게시판명" />
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.bbmType">
          <option>일반</option><option>공지</option><option>갤러리</option><option>FAQ</option><option>QnA</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">댓글허용</label>
        <select class="form-control" v-model="form.allowComment">
          <option>불가</option><option>댓글허용</option><option>대댓글허용</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">첨부허용</label>
        <select class="form-control" v-model="form.allowAttach">
          <option>불가</option><option>1개</option><option>2개</option><option>3개</option><option>목록</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">좋아요허용</label>
        <select class="form-control" v-model="form.allowLike">
          <option value="Y">허용</option><option value="N">불가</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">내용입력</label>
        <select class="form-control" v-model="form.contentType">
          <option>불가</option><option>textarea</option><option>htmleditor</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">공개범위</label>
        <select class="form-control" v-model="form.scopeType">
          <option>공개</option><option>개인</option><option>회사</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정렬순서</label>
        <input class="form-control" type="number" v-model.number="form.sortOrd" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn">
          <option value="Y">사용</option><option value="N">미사용</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">비고</label>
        <input class="form-control" v-model="form.remark" placeholder="비고" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('syBbmMng')">취소</button>
    </div>
  </div>
</div>
`
};
