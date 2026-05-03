/* ShopJoy - 공통 컴포넌트 모음 */

/* ─────────────────────────────────────────
   attach_grp : 첨부파일 그룹 컴포넌트
   ─────────────────────────────────────────
   Props:
     modelValue  : attachGrpId (String|null) — v-model 바인딩
     refId       : 참조 ID 문자열 (e.g. 'NOTICE-1')
     showToast   : 토스트 함수
     grpCode     : 업무 코드 (businessCode, 기본 'common')
     grpNm       : 그룹 이름 (기본 '첨부파일')
     maxCount    : 최대 첨부 개수 (기본 10)
     maxSizeMb   : 파일당 최대 크기 MB (기본 10)
     allowExt    : 허용 확장자 문자열, 쉼표 구분 (기본 '*' = 전체)
   Emits:
     update:modelValue : 최초 첨부 시 생성된 attachGrpId 반환
 ─────────────────────────────────────────── */
window.BaseAttachGrp = {
  name: 'BaseAttachGrp',
  props: {
    modelValue: { default: null },
    boData:     { default: null },   // 하위호환용 (미사용)
    refId:      { default: '' },
    showToast:  { type: Function, default: () => {} },
    grpCode:    { default: 'common' },
    grpNm:      { default: '첨부파일' },
    maxCount:   { default: 10 },
    maxSizeMb:  { default: 10 },
    allowExt:   { default: '*' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { computed, ref, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ uploading: false, loading: false });

    /* 업로드된 파일 목록 (로컬 상태) */
    const files = reactive([]);

    const loadFiles = async (attachGrpId) => {
      if (!attachGrpId) return;
      uiState.loading = true;
      try {
        const res = await window.coApiSvc.cmAttach.getFiles(attachGrpId);
        const list = res.data?.data || [];
        files.splice(0, files.length, ...list.map(f => ({
          attachId:  f.attachId,
          fileNm:    f.fileNm,
          fileSize:  f.fileSize,
          fileExt:   f.fileExt,
          attachUrl: f.attachUrl || f.storagePath,
        })));
      } catch (err) {
        console.error('[BaseAttachGrp] 파일 목록 조회 실패', err);
      } finally {
        uiState.loading = false;
      }
    };

    onMounted(() => { if (props.modelValue) loadFiles(props.modelValue); });
    watch(() => props.modelValue, (val) => { if (val) loadFiles(val); });

    /* 허용 확장자 accept 문자열 변환 */
    const cfAcceptAttr = computed(() => {
      if (!props.allowExt || props.allowExt === '*') return '*';
      return props.allowExt.split(',').map(e => '.' + e.trim()).join(',');
    });

    const fileInputRef = ref(null);

    const openPicker = () => {
      if (files.length >= props.maxCount) {
        props.showToast(`최대 ${props.maxCount}개까지 첨부 가능합니다.`, 'warning');
        return;
      }
      fileInputRef.value && fileInputRef.value.click();
    };

    const onFileChange = async (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      e.target.value = '';
      if (!selectedFiles.length) return;

      const maxBytes = props.maxSizeMb * 1024 * 1024;
      const allowed  = props.allowExt === '*' ? null : props.allowExt.split(',').map(x => x.trim().toLowerCase());
      const remaining = props.maxCount - files.length;

      /* 클라이언트 사전 검증 */
      const validFiles = [];
      for (const file of selectedFiles.slice(0, remaining)) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (allowed && !allowed.includes(ext)) {
          props.showToast(`허용되지 않는 확장자입니다: .${ext}`, 'error');
          continue;
        }
        if (file.size > maxBytes) {
          props.showToast(`파일 크기가 ${props.maxSizeMb}MB를 초과합니다: ${file.name}`, 'error');
          continue;
        }
        validFiles.push(file);
      }
      if (!validFiles.length) return;

      /* FormData 구성 → /api/co/cm/upload/multi */
      uiState.uploading = true;
      try {
        const fd = new FormData();
        validFiles.forEach(f => fd.append('files', f));
        fd.append('businessCode', props.grpCode);
        fd.append('grpNm', props.grpNm);
        if (props.modelValue) fd.append('attachGrpId', props.modelValue);

        const hdr = window.coUtil.apiHdr('첨부파일', '업로드');
        // Content-Type은 axios가 FormData boundary 포함해서 자동 설정
        // boApi.post는 path 앞에 http://host:3000/api/ 자동 추가
        const res = await window.boApi.post('co/cm/upload/multi', fd, hdr);

        const d = res.data?.data;
        if (!d) throw new Error('업로드 응답이 없습니다.');
        console.log('[BaseAttachGrp] upload response:', JSON.stringify(d));

        /* attachGrpId emit (첫 업로드 or 기존 그룹에 추가) */
        const grpId = d.attachGrpId;
        if (!props.modelValue) emit('update:modelValue', grpId);

        /* 파일 목록 추가 */
        (d.files || []).forEach(f => {
          files.push({
            attachId:  f.attachId,
            fileNm:    f.originalName,
            fileSize:  f.fileSize,
            fileExt:   f.fileExt,
            attachUrl: f.filePath,
          });
        });

        const uploaded = d.uploadedCount || 0;
        const failed   = d.failedCount   || 0;
        if (failed > 0 && uploaded === 0) {
          const errDetail = (d.failedFiles || []).join(', ');
          props.showToast(`업로드 실패: ${errDetail || '파일 검증 오류'}`, 'error', 0);
        } else if (failed > 0) {
          props.showToast(`${uploaded}개 업로드 완료, ${failed}개 실패`, 'warning', 0);
        } else {
          props.showToast(`${uploaded}개 파일이 업로드되었습니다.`, 'success');
        }

      } catch (err) {
        console.error('[BaseAttachGrp] 업로드 실패', err);
        const msg = err.response?.data?.message || err.message || '업로드 중 오류가 발생했습니다.';
        props.showToast(msg, 'error', 0);
      } finally {
        uiState.uploading = false;
      }
    };

    const removeFile = async (attachId) => {
      try {
        await window.coApiSvc.cmAttach.deleteFile(attachId);
      } catch (err) {
        console.error('[BaseAttachGrp] 파일 삭제 실패', err);
        props.showToast(err.response?.data?.message || '파일 삭제 중 오류가 발생했습니다.', 'error', 0);
        return;
      }
      const idx = files.findIndex(f => f.attachId === attachId);
      if (idx !== -1) files.splice(idx, 1);
      if (files.length === 0) emit('update:modelValue', null);
    };

    const fnFmtSize = (bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const fnExtIcon = (ext) => {
      const map = { pdf: '📄', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', pptx: '📑', ppt: '📑', zip: '🗜️', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', mp4: '🎬', mov: '🎬', mp3: '🎵' };
      return map[ext?.toLowerCase()] || '📎';
    };

    const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','bmp','svg']);
    const fnIsImage = (ext) => IMAGE_EXTS.has(ext?.toLowerCase());

    const thumbState = reactive({ show: false, url: '', nm: '' });
    const fnOpenThumb = (f) => { thumbState.url = f.attachUrl; thumbState.nm = f.fileNm; thumbState.show = true; };
    const fnCloseThumb = () => { thumbState.show = false; };

    return { uiState, files, cfAcceptAttr, fileInputRef, openPicker, onFileChange, removeFile, fnFmtSize, fnExtIcon, loadFiles, fnIsImage, thumbState, fnOpenThumb, fnCloseThumb };
  },
  template: /* html */`
<div style="border:1px solid #e8e8e8;border-radius:8px;background:#fafafa;padding:12px 14px;">
  <input ref="fileInputRef" type="file" :accept="cfAcceptAttr" multiple style="display:none;" @change="onFileChange" />

  <!-- 파일 목록 -->
  <div v-if="files.length" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
    <div v-for="f in files" :key="f.attachId"
      style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;"
      @mouseenter="e=>e.currentTarget.style.background='#fff8f9'"
      @mouseleave="e=>e.currentTarget.style.background='#fff'">
      <span style="font-size:15px;flex-shrink:0;line-height:1;">{{ fnExtIcon(f.fileExt) }}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;" :title="f.fileNm">{{ f.fileNm }}</span>
        <span v-if="f.attachUrl" style="font-size:10px;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="f.attachUrl">{{ f.attachUrl }}</span>
      </span>
      <!-- 액션 아이콘: 다운로드 / 팝업보기 / 썸네일보기 -->
      <span style="display:inline-flex;align-items:center;gap:3px;flex-shrink:0;">
        <a :href="f.attachUrl" :download="f.fileNm" :title="'다운로드: '+f.fileNm"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#4a90d9';e.currentTarget.style.color='#4a90d9';}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';}">⬇</a>
        <button @click.stop="window.open(f.attachUrl,'_blank')" :title="'새창보기: '+f.fileNm" type="button"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#7c5cbf';e.currentTarget.style.color='#7c5cbf';}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';}">↗</button>
        <button v-if="fnIsImage(f.fileExt)" @click.stop="fnOpenThumb(f)" :title="'썸네일보기: '+f.fileNm" type="button"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';}">🖼</button>
      </span>
      <span style="font-size:11px;color:#bbb;flex-shrink:0;white-space:nowrap;">{{ fnFmtSize(f.fileSize) }}</span>
      <button @click.stop="removeFile(f.attachId)" title="삭제"
        style="flex-shrink:0;width:18px;height:18px;border:none;background:#f0f0f0;border-radius:50%;cursor:pointer;font-size:10px;color:#888;display:inline-flex;align-items:center;justify-content:center;padding:0;line-height:1;transition:background .1s;"
        @mouseenter="e=>e.currentTarget.style.background='#fde8e8'"
        @mouseleave="e=>e.currentTarget.style.background='#f0f0f0'">✕</button>
    </div>
  </div>
  <div v-else-if="uiState.loading" style="font-size:12px;color:#c0c0c0;padding:6px 2px 10px;display:flex;align-items:center;gap:5px;">
    <span style="font-size:14px;">⏳</span> 파일 목록 불러오는 중...
  </div>
  <div v-else style="font-size:12px;color:#c0c0c0;padding:6px 2px 10px;display:flex;align-items:center;gap:5px;">
    <span style="font-size:14px;">📂</span> 첨부된 파일이 없습니다.
  </div>

  <!-- 하단 버튼 + 안내 -->
  <div style="display:flex;align-items:center;gap:10px;">
    <button @click="openPicker" :disabled="uiState.uploading" type="button"
      style="display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#555;font-weight:500;transition:all .15s;white-space:nowrap;"
      @mouseenter="e=>{if(!uiState.uploading){e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}}"
      @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
      <span v-if="uiState.uploading">⏳ 업로드 중...</span>
      <span v-else>📎 파일첨부</span>
    </button>
    <span style="font-size:11px;color:#bbb;">
      {{ files.length }} / {{ maxCount }}개
      <span style="margin:0 4px;color:#e8e8e8;">|</span>
      최대 {{ maxSizeMb }}MB
      <span v-if="allowExt!=='*'"><span style="margin:0 4px;color:#e8e8e8;">|</span>{{ allowExt }}</span>
    </span>
  </div>

  <!-- 썸네일 팝업 모달 -->
  <div v-if="thumbState.show" @click.self="fnCloseThumb"
    style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:12px;padding:16px;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 40px rgba(0,0,0,.4);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <span style="font-size:13px;color:#444;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60vw;" :title="thumbState.nm">{{ thumbState.nm }}</span>
        <button @click="fnCloseThumb" type="button"
          style="flex-shrink:0;width:24px;height:24px;border:none;background:#f0f0f0;border-radius:50%;cursor:pointer;font-size:13px;color:#888;display:inline-flex;align-items:center;justify-content:center;padding:0;"
          @mouseenter="e=>e.currentTarget.style.background='#fde8e8'"
          @mouseleave="e=>e.currentTarget.style.background='#f0f0f0'">✕</button>
      </div>
      <img :src="thumbState.url" :alt="thumbState.nm"
        style="max-width:80vw;max-height:75vh;object-fit:contain;border-radius:6px;" />
    </div>
  </div>
</div>
`
};

/* ── BaseComp 레지스트리 ── */
window.BaseComp = {
  'attach_grp': window.BaseAttachGrp,
};
