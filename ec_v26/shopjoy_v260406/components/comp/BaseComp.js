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
          attachId:   f.attachId,
          fileNm:     f.fileNm,
          fileSize:   f.fileSize,
          fileExt:    f.fileExt,
          attachUrl:  f.attachUrl || f.storagePath,
          cdnImgUrl:  f.cdnImgUrl || '',
          storagePath: f.storagePath || '',
          thumbUrl:   f.thumbUrl || '',
          thumbCdnUrl: f.thumbCdnUrl || '',
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
            attachId:    f.attachId,
            fileNm:      f.originalName,
            fileSize:    f.fileSize,
            fileExt:     f.fileExt,
            attachUrl:   f.filePath,
            cdnImgUrl:   f.cdnImgUrl || '',
            storagePath: f.storagePath || '',
            thumbUrl:    f.thumbUrl || '',
            thumbCdnUrl: f.thumbCdnUrl || f.thumbUrl || '',
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

    /* ── 팝업 모달 ── */
    const thumbState = reactive({ show: false, url: '', nm: '' });
    const fnOpenThumb = (f) => { thumbState.url = f.cdnImgUrl || f.attachUrl; thumbState.nm = f.fileNm; thumbState.show = true; };
    const fnCloseThumb = () => { thumbState.show = false; };

    /* ── hover 미리보기 레이어 ── */
    const hoverState = reactive({ show: false, url: '', x: 0, y: 0 });
    const fnShowHover = (e, url) => {
      if (!url) return;
      const r = e.currentTarget.getBoundingClientRect();
      hoverState.x = r.right + 8;
      hoverState.y = r.top;
      hoverState.url = url;
      hoverState.show = true;
    };
    const fnHideHover = () => { hoverState.show = false; };

    /* ── drag & drop 정렬 ── */
    const dragState = reactive({ fromIdx: null });
    const onDragStart = (idx) => { dragState.fromIdx = idx; };
    const onDragOver  = (e) => { e.preventDefault(); };
    const onDrop = async (toIdx) => {
      const from = dragState.fromIdx;
      dragState.fromIdx = null;
      if (from === null || from === toIdx) return;
      const moved = files.splice(from, 1)[0];
      files.splice(toIdx, 0, moved);
      /* sort_ord 업데이트 (fire & forget) */
      files.forEach((f, i) => { f.sortOrd = i + 1; });
      try {
        await Promise.all(files.map((f, i) =>
          window.boApi.patch(`co/cm/upload/attach/${f.attachId}/sort`, { sortOrd: i + 1 }, window.coUtil.apiHdr('첨부파일', '순서변경'))
        ));
      } catch(e) { console.warn('[BaseAttachGrp] sort update failed', e); }
    };

    return { uiState, files, cfAcceptAttr, fileInputRef, openPicker, onFileChange, removeFile,
      fnFmtSize, fnExtIcon, loadFiles, fnIsImage,
      thumbState, fnOpenThumb, fnCloseThumb,
      hoverState, fnShowHover, fnHideHover,
      dragState, onDragStart, onDragOver, onDrop };
  },
  template: /* html */`
<div style="border:1px solid #e8e8e8;border-radius:8px;background:#fafafa;padding:12px 14px;">
  <input ref="fileInputRef" type="file" :accept="cfAcceptAttr" multiple style="display:none;" @change="onFileChange" />

  <!-- 파일 목록 -->
  <div v-if="files.length" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
    <div v-for="(f, idx) in files" :key="f.attachId"
      draggable="true"
      @dragstart="onDragStart(idx)"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop(idx)"
      style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;cursor:grab;"
      @mouseenter="e=>e.currentTarget.style.background='#fff8f9'"
      @mouseleave="e=>e.currentTarget.style.background='#fff'">
      <!-- 순서 번호 -->
      <span style="flex-shrink:0;width:16px;font-size:10px;color:#ccc;text-align:center;line-height:1;">{{ idx+1 }}</span>
      <!-- 드래그 핸들 -->
      <span style="flex-shrink:0;font-size:12px;color:#ccc;cursor:grab;line-height:1;" title="드래그하여 순서 변경">⠿</span>
      <span style="font-size:15px;flex-shrink:0;line-height:1;">{{ fnExtIcon(f.fileExt) }}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;" :title="f.fileNm">{{ f.fileNm }}</span>
        <span v-if="f.attachUrl" style="font-size:10px;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="f.attachUrl">{{ f.attachUrl }}</span>
      </span>
      <!-- 액션 아이콘: 다운로드 / 팝업보기 / 썸네일hover+클릭 -->
      <span style="display:inline-flex;align-items:center;gap:3px;flex-shrink:0;">
        <a :href="f.cdnImgUrl || f.attachUrl" :download="f.fileNm"
          :title="'다운로드 | ' + (f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#4a90d9';e.currentTarget.style.color='#4a90d9';}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';}">⬇</a>
        <!-- 팝업보기: 이미지면 hover 미리보기 + 클릭 모달, 아니면 클릭 모달 -->
        <button @click.stop="fnOpenThumb(f)" type="button"
          :title="'팝업보기 | ' + (f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#7c5cbf';e.currentTarget.style.color='#7c5cbf';fnShowHover(e, f.cdnImgUrl||f.attachUrl);}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';fnHideHover();}">↗</button>
        <!-- 썸네일 아이콘: hover 미리보기 + 클릭 모달 -->
        <button v-if="fnIsImage(f.fileExt)" @click.stop="fnOpenThumb(f)" type="button"
          :title="'썸네일보기 | ' + (f.thumbCdnUrl || f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;overflow:hidden;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';fnShowHover(e, f.thumbCdnUrl||f.cdnImgUrl||f.attachUrl);}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';fnHideHover();}">
          <img v-if="f.thumbCdnUrl" :src="f.thumbCdnUrl"
            style="width:100%;height:100%;object-fit:cover;display:block;" @error="e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='inline-flex';}" />
          <span style="font-size:12px;color:#666;" :style="{display:f.thumbCdnUrl?'none':'inline-flex'}">🖼</span>
        </button>
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

  <!-- hover 미리보기 레이어 (fixed, 마우스 우측 하단) -->
  <div v-if="hoverState.show && hoverState.url"
    style="position:fixed;z-index:10000;pointer-events:none;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.35);background:#fff;border:1px solid #e0e0e0;"
    :style="{left: hoverState.x + 'px', top: hoverState.y + 'px'}">
    <img :src="hoverState.url" style="display:block;max-width:200px;max-height:200px;object-fit:contain;" />
  </div>

  <!-- 팝업 모달 -->
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

/* ── BaseAttachOne: 단일 파일 첨부 (이미지 미리보기 전용) ── */
window.BaseAttachOne = {
  name: 'BaseAttachOne',
  props: {
    modelValue:  { default: null },          // attachGrpId
    showToast:   { type: Function, default: () => {} },
    grpCode:     { default: 'common' },
    grpNm:       { default: '첨부파일' },
    maxSizeMb:   { default: 5 },
    allowExt:    { default: 'jpg,jpeg,png,gif,webp' },
    width:       { default: '120px' },
    height:      { default: '120px' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { reactive, ref, watch, onMounted } = Vue;
    const uiState  = reactive({ uploading: false, loading: false });
    const file     = reactive({ attachId: null, cdnImgUrl: '', thumbCdnUrl: '', fileNm: '' });
    const inputRef = ref(null);

    const loadFile = async (grpId) => {
      if (!grpId) return;
      uiState.loading = true;
      try {
        const res = await window.coApiSvc.cmAttach.getFiles(grpId);
        const list = res.data?.data || [];
        const f = list[0];
        if (f) { file.attachId = f.attachId; file.cdnImgUrl = f.cdnImgUrl || ''; file.thumbCdnUrl = f.thumbCdnUrl || ''; file.fileNm = f.fileNm || ''; }
        else   { file.attachId = null; file.cdnImgUrl = ''; file.thumbCdnUrl = ''; file.fileNm = ''; }
      } catch(e) { console.error('[BaseAttachOne] load fail', e); }
      finally   { uiState.loading = false; }
    };

    onMounted(() => { if (props.modelValue) loadFile(props.modelValue); });
    watch(() => props.modelValue, v => { if (v) loadFile(v); });

    const openPicker = () => { if (!uiState.uploading) inputRef.value?.click(); };

    const onFileChange = async (e) => {
      const f = e.target.files?.[0]; e.target.value = '';
      if (!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      const allowed = props.allowExt.split(',').map(x => x.trim().toLowerCase());
      if (!allowed.includes(ext)) { props.showToast(`허용되지 않는 확장자입니다: .${ext}`, 'error'); return; }
      if (f.size > props.maxSizeMb * 1024 * 1024) { props.showToast(`${props.maxSizeMb}MB 이하 파일만 첨부 가능합니다.`, 'error'); return; }

      uiState.uploading = true;
      try {
        /* 기존 파일 삭제 후 새 파일 업로드 */
        if (file.attachId) {
          await window.coApiSvc.cmAttach.deleteFile(file.attachId);
          file.attachId = null; file.cdnImgUrl = ''; file.thumbCdnUrl = '';
        }
        const fd = new FormData();
        fd.append('files', f);
        fd.append('businessCode', props.grpCode);
        fd.append('grpNm', props.grpNm);
        if (props.modelValue) fd.append('attachGrpId', props.modelValue);
        const hdr = window.coUtil.apiHdr('첨부파일', '업로드');
        const res = await window.boApi.post('co/cm/upload/multi', fd, hdr);
        const d = res.data?.data;
        if (!d) throw new Error('업로드 응답 없음');
        const uploaded = (d.files || [])[0];
        if (uploaded) {
          file.attachId   = uploaded.attachId;
          file.cdnImgUrl  = uploaded.cdnImgUrl || '';
          file.thumbCdnUrl = uploaded.thumbCdnUrl || uploaded.cdnImgUrl || '';
          file.fileNm     = uploaded.originalName || '';
        }
        if (!props.modelValue) emit('update:modelValue', d.attachGrpId);
        props.showToast('업로드되었습니다.', 'success');
      } catch(err) {
        props.showToast(err.response?.data?.message || err.message || '업로드 오류', 'error', 0);
      } finally { uiState.uploading = false; }
    };

    const removeFile = async () => {
      if (!file.attachId) return;
      try {
        await window.coApiSvc.cmAttach.deleteFile(file.attachId);
        file.attachId = null; file.cdnImgUrl = ''; file.thumbCdnUrl = ''; file.fileNm = '';
        emit('update:modelValue', null);
        props.showToast('삭제되었습니다.', 'success');
      } catch(err) { props.showToast(err.response?.data?.message || '삭제 오류', 'error', 0); }
    };

    return { uiState, file, inputRef, openPicker, onFileChange, removeFile };
  },
  template: /* html */`
<div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;">
  <input ref="inputRef" type="file" style="display:none;" :accept="allowExt.split(',').map(e=>'.'+e.trim()).join(',')" @change="onFileChange" />
  <!-- 이미지 미리보기 박스 -->
  <div @click="openPicker"
    :style="{width:width,height:height,border:'2px dashed #e0e0e0',borderRadius:'10px',overflow:'hidden',cursor:'pointer',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',transition:'border-color .15s'}"
    @mouseenter="e=>e.currentTarget.style.borderColor='#e8587a'"
    @mouseleave="e=>e.currentTarget.style.borderColor='#e0e0e0'"
    :title="file.fileNm || '클릭하여 이미지 선택'">
    <span v-if="uiState.loading || uiState.uploading" style="font-size:22px;">⏳</span>
    <img v-else-if="file.thumbCdnUrl || file.cdnImgUrl"
      :src="file.thumbCdnUrl || file.cdnImgUrl"
      style="width:100%;height:100%;object-fit:cover;display:block;" />
    <span v-else style="font-size:32px;color:#ccc;">👤</span>
  </div>
  <!-- 버튼 -->
  <div style="display:flex;gap:6px;">
    <button type="button" @click="openPicker" :disabled="uiState.uploading"
      style="font-size:11px;padding:3px 10px;border:1px solid #d9d9d9;border-radius:5px;background:#fff;cursor:pointer;color:#555;transition:all .15s;"
      @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}"
      @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
      {{ uiState.uploading ? '업로드중…' : '📷 변경' }}
    </button>
    <button v-if="file.attachId" type="button" @click.stop="removeFile"
      style="font-size:11px;padding:3px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fff;cursor:pointer;color:#e8587a;transition:all .15s;"
      @mouseenter="e=>{e.currentTarget.style.background='#fde8e8';}"
      @mouseleave="e=>{e.currentTarget.style.background='#fff';}">✕ 삭제</button>
  </div>
  <span style="font-size:10px;color:#bbb;">{{ allowExt }} / 최대 {{ maxSizeMb }}MB</span>
</div>
`
};

/* ── BaseComp 레지스트리 ── */
window.BaseComp = {
  'attach_grp': window.BaseAttachGrp,
  'attach_one':  window.BaseAttachOne,
};
