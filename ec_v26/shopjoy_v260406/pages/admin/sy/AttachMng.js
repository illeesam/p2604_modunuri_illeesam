/* ShopJoy Admin - 첨부관리 (좌30% 그룹 + 우70% 파일) */
window.SyAttachMng = {
  name: 'SyAttachMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    /* ── 첨부그룹 ── */
    const selectedGrpId = ref(null);
    const grpForm = reactive({ grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });
    const grpEditId = ref(null);
    const grpEditMode = ref(false);

    const selectGrp = (id) => { selectedGrpId.value = selectedGrpId.value === id ? null : id; grpEditMode.value = false; };

    const openGrpNew = () => {
      grpEditId.value = null; grpEditMode.value = true;
      Object.assign(grpForm, { grpNm: '', grpCode: '', description: '', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png', status: '활성' });
    };
    const openGrpEdit = (g) => {
      grpEditId.value = g.attachGrpId; grpEditMode.value = true;
      Object.assign(grpForm, { ...g });
    };
    const saveGrp = () => {
      if (!grpForm.grpNm || !grpForm.grpCode) { props.showToast('그룹명과 코드는 필수입니다.', 'error'); return; }
      if (grpEditId.value === null) {
        props.adminData.attachGrps.push({ ...grpForm, attachGrpId: props.adminData.nextId(props.adminData.attachGrps, 'attachGrpId'), regDate: new Date().toISOString().slice(0, 10) });
        props.showToast('그룹이 등록되었습니다.');
      } else {
        const idx = props.adminData.attachGrps.findIndex(x => x.attachGrpId === grpEditId.value);
        if (idx !== -1) Object.assign(props.adminData.attachGrps[idx], grpForm);
        props.showToast('저장되었습니다.');
      }
      grpEditMode.value = false;
    };
    const deleteGrp = async (g) => {
      const ok = await props.showConfirm('그룹 삭제', `[${g.grpNm}] 그룹을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.attachGrps.findIndex(x => x.attachGrpId === g.attachGrpId);
      if (idx !== -1) props.adminData.attachGrps.splice(idx, 1);
      if (selectedGrpId.value === g.attachGrpId) selectedGrpId.value = null;
      props.showToast('삭제되었습니다.');
    };

    /* ── 첨부파일 ── */
    const searchKw = ref('');
    const fileForm = reactive({ attachGrpId: null, fileNm: '', fileSize: 0, fileExt: '', url: '', refId: '', memo: '' });
    const fileEditId = ref(null);
    const fileEditMode = ref(false);

    const applied = Vue.reactive({ kw: '', dateStart: '', dateEnd: '' });

    const filteredFiles = computed(() => props.adminData.attaches.filter(a => {
      if (selectedGrpId.value && a.attachGrpId !== selectedGrpId.value) return false;
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !a.fileNm.toLowerCase().includes(kw) && !a.refId.toLowerCase().includes(kw)) return false;
      const _d = String(a.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
    };
    const onReset = () => {
      searchKw.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', dateStart: '', dateEnd: '' });
    };

    const openFileNew = () => {
      fileEditId.value = null; fileEditMode.value = true;
      Object.assign(fileForm, { attachGrpId: selectedGrpId.value, fileNm: '', fileSize: 0, fileExt: '', url: '', refId: '', memo: '' });
    };
    const openFileEdit = (a) => {
      fileEditId.value = a.attachId; fileEditMode.value = true;
      Object.assign(fileForm, { ...a });
    };
    const saveFile = () => {
      if (!fileForm.fileNm || !fileForm.attachGrpId) { props.showToast('그룹과 파일명은 필수입니다.', 'error'); return; }
      const grp = props.adminData.attachGrps.find(g => g.attachGrpId === fileForm.attachGrpId);
      if (fileEditId.value === null) {
        props.adminData.attaches.push({ ...fileForm, attachId: props.adminData.nextId(props.adminData.attaches, 'attachId'), attachGrpNm: grp?.grpNm || '', regDate: new Date().toISOString().slice(0, 10) });
        props.showToast('파일이 등록되었습니다.');
      } else {
        const idx = props.adminData.attaches.findIndex(x => x.attachId === fileEditId.value);
        if (idx !== -1) Object.assign(props.adminData.attaches[idx], { ...fileForm, attachGrpNm: grp?.grpNm || '' });
        props.showToast('저장되었습니다.');
      }
      fileEditMode.value = false;
    };
    const deleteFile = async (a) => {
      const ok = await props.showConfirm('파일 삭제', `[${a.fileNm}] 파일을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.attaches.findIndex(x => x.attachId === a.attachId);
      if (idx !== -1) props.adminData.attaches.splice(idx, 1);
      props.showToast('삭제되었습니다.');
    };

    const fmtSize = bytes => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    return {
      searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm,
      selectedGrpId, grpForm, grpEditId, grpEditMode, selectGrp, openGrpNew, openGrpEdit, saveGrp, deleteGrp,
      searchKw, fileForm, fileEditId, fileEditMode, applied, filteredFiles, onSearch, onReset, openFileNew, openFileEdit, saveFile, deleteFile,
      fmtSize, statusBadge,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">첨부관리</div>
  <div style="display:flex;gap:16px;align-items:flex-start;">

    <!-- 좌: 첨부그룹관리 (30%) -->
    <div style="flex:0 0 30%;min-width:260px;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <b style="font-size:14px;">첨부그룹관리</b>
          <button class="btn btn-primary btn-sm" @click="openGrpNew">+ 신규</button>
        </div>

        <!-- 그룹 폼 -->
        <div v-if="grpEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">{{ grpEditId===null ? '그룹 등록' : '그룹 수정' }}</div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">그룹명 <span class="req">*</span></label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.grpNm" placeholder="그룹명" />
          </div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">그룹코드 <span class="req">*</span></label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.grpCode" placeholder="PRODUCT_IMG" />
          </div>
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label" style="font-size:12px;">허용확장자</label>
            <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.allowExt" placeholder="jpg,png,pdf" />
          </div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <div class="form-group" style="flex:1;margin-bottom:0;">
              <label class="form-label" style="font-size:12px;">최대개수</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" type="number" v-model.number="grpForm.maxCount" min="1" />
            </div>
            <div class="form-group" style="flex:1;margin-bottom:0;">
              <label class="form-label" style="font-size:12px;">최대크기(MB)</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" type="number" v-model.number="grpForm.maxSizeMb" min="1" />
            </div>
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:12px;">상태</label>
            <select class="form-control" style="font-size:12px;padding:4px 8px;" v-model="grpForm.status">
              <option>활성</option><option>비활성</option>
            </select>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" @click="saveGrp">저장</button>
            <button class="btn btn-secondary btn-sm" style="flex:1;" @click="grpEditMode=false">취소</button>
          </div>
        </div>

        <!-- 그룹 목록 -->
        <div v-for="g in adminData.attachGrps" :key="g.attachGrpId"
          style="padding:10px 12px;border-bottom:1px solid #f0f0f0;cursor:pointer;border-radius:4px;transition:background .15s;"
          :style="selectedGrpId===g.attachGrpId?'background:#fff0f4;border-left:3px solid #e8587a;':'' "
          @click="selectGrp(g.attachGrpId)">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:600;color:#333;">{{ g.grpNm }}</div>
              <div style="font-size:11px;color:#888;margin-top:2px;">{{ g.grpCode }} | 최대 {{ g.maxCount }}개 / {{ g.maxSizeMb }}MB</div>
            </div>
            <div style="display:flex;gap:4px;" @click.stop>
              <button class="btn btn-blue btn-sm" style="font-size:11px;padding:2px 6px;" @click="openGrpEdit(g)">수정</button>
              <button class="btn btn-danger btn-sm" style="font-size:11px;padding:2px 6px;" @click="deleteGrp(g)">삭제</button>
            </div>
          </div>
          <div style="margin-top:4px;">
            <span class="badge" :class="statusBadge(g.status)" style="font-size:10px;">{{ g.status }}</span>
            <span style="font-size:11px;color:#aaa;margin-left:6px;">{{ g.allowExt }}</span>
            <span style="font-size:11px;color:#2563eb;margin-left:8px;font-weight:500;">{{ siteNm }}</span>
          </div>
        </div>
        <div v-if="!adminData.attachGrps.length" style="text-align:center;color:#999;padding:20px;font-size:13px;">그룹이 없습니다.</div>
      </div>
    </div>

    <!-- 우: 첨부파일관리 (70%) -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <b style="font-size:14px;">첨부파일관리
            <span v-if="selectedGrpId" style="font-size:12px;color:#e8587a;margin-left:6px;">
              ({{ adminData.attachGrps.find(g=>g.attachGrpId===selectedGrpId)?.grpNm }})
            </span>
          </b>
          <div style="display:flex;gap:8px;align-items:center;">
            <input v-model="searchKw" placeholder="파일명 / RefID 검색" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;width:160px;" />
            <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;" /><select v-model="searchDateRange" @change="onDateRangeChange" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
            <div class="search-actions">
              <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
              <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
            </div>
            <button class="btn btn-primary btn-sm" @click="openFileNew">+ 신규</button>
          </div>
        </div>
        <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>첨부파일목록 <span class="list-count">{{ total }}건</span></span>

        <!-- 파일 폼 -->
        <div v-if="fileEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">{{ fileEditId===null ? '파일 등록' : '파일 수정' }}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div class="form-group" style="flex:1;min-width:140px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">첨부그룹 <span class="req">*</span></label>
              <select class="form-control" style="font-size:12px;padding:4px 8px;" v-model.number="fileForm.attachGrpId">
                <option :value="null">그룹 선택</option>
                <option v-for="g in adminData.attachGrps" :key="g.attachGrpId" :value="g.attachGrpId">{{ g.grpNm }}</option>
              </select>
            </div>
            <div class="form-group" style="flex:2;min-width:200px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">파일명 <span class="req">*</span></label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.fileNm" placeholder="파일명.jpg" />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">확장자</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.fileExt" placeholder="jpg" />
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div class="form-group" style="flex:2;min-width:200px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">URL</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.url" placeholder="/uploads/..." />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">참조ID</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.refId" placeholder="PROD-001" />
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:6px;">
              <label class="form-label" style="font-size:12px;">메모</label>
              <input class="form-control" style="font-size:12px;padding:4px 8px;" v-model="fileForm.memo" />
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" @click="saveFile">저장</button>
            <button class="btn btn-secondary btn-sm" @click="fileEditMode=false">취소</button>
          </div>
        </div>

        <table class="admin-table">
          <thead><tr>
            <th>ID</th><th>그룹</th><th>파일명</th><th>크기</th><th>확장자</th><th>참조ID</th><th>메모</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="filteredFiles.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="a in filteredFiles" :key="a.attachId">
              <td>{{ a.attachId }}</td>
              <td><span style="font-size:11px;color:#666;">{{ a.attachGrpNm }}</span></td>
              <td style="font-size:12px;word-break:break-all;">{{ a.fileNm }}</td>
              <td style="font-size:12px;">{{ fmtSize(a.fileSize) }}</td>
              <td><span style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;">{{ a.fileExt }}</span></td>
              <td style="font-size:12px;color:#666;">{{ a.refId }}</td>
              <td style="font-size:12px;color:#888;">{{ a.memo }}</td>
              <td style="font-size:12px;">{{ a.regDate }}</td>
              <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="openFileEdit(a)">수정</button>
                <button class="btn btn-danger btn-sm" @click="deleteFile(a)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
`
};
