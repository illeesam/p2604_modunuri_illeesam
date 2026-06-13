/* ShopJoy - 공통 컴포넌트 모음
 * ─────────────────────────────────────────────────────────────────────────
 * 정의된 컴포넌트 (3개) — FO/BO 공용. 태그는 kebab-case (예: <base-attach-grp>)
 *
 *   BaseAttachGrp   — 첨부파일 그룹 (다중, attachGrpId v-model, 업로드/삭제/썸네일)
 *   BaseAttachOne   — 단일 첨부파일 (이미지 1개 등)
 *   BaseHtmlEditor  — Quill 기반 리치텍스트 에디터
 *
 * 부가:
 *   window.BaseComp — 컴포넌트가 아닌 별칭 레지스트리
 *                     ({ 'attach_grp': BaseAttachGrp, 'attach_one': BaseAttachOne })
 * ───────────────────────────────────────────────────────────────────────── */

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
     readonly    : 보기(view) 모드 (Boolean, 기본 false) — 파일첨부/삭제(✕)/드래그정렬 숨김, 다운로드·미리보기 보기 액션만 노출
   Emits:
     update:modelValue : 최초 첨부 시 생성된 attachGrpId 반환
 ─────────────────────────────────────────── */
window.BaseAttachGrp = {
  name: 'BaseAttachGrp',
  props: {
    modelValue: { default: null },
    refId:      { default: '' },
    showToast:  { type: Function, default: () => {} },
    grpCode:    { default: 'common' },
    grpNm:      { default: '첨부파일' },
    maxCount:   { default: 10 },
    maxSizeMb:  { default: 10 },
    allowExt:   { default: '*' },
    readonly:   { type: Boolean, default: false },  // 보기(view) 모드: 업로드/삭제/정렬 숨김, 보기 액션만 노출
    displayMode: { default: 'list' },  // 'list' | 'image' (image: 단일 프로필 이미지 박스 UI)
    width:      { default: '120px' },  // displayMode='image' 일 때 박스 폭
    height:     { default: '120px' },  // displayMode='image' 일 때 박스 높이
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { computed, ref, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ uploading: false, loading: false });

    /* 업로드된 파일 목록 (로컬 상태) */
    const files = reactive([]);

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BaseAttachGrp : handleBtnAction -> ', cmd, param);
      if (cmd === 'attach-open-picker') {
        return openPicker();
      } else if (cmd === 'attach-close-thumb') {
        return fnCloseThumb();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BaseAttachGrp : handleSelectAction -> ', cmd, param);
      if (cmd === 'attach-row-remove') {
        return removeFile(param);
      } else if (cmd === 'attach-row-open-thumb') {
        return fnOpenThumb(param);
      } else if (cmd === 'attach-row-show-hover') {
        return fnShowHover(param.event, param.url);
      } else if (cmd === 'attach-row-hide-hover') {
        return fnHideHover();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* loadFiles */
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

    /* 자기 emit 으로 인한 watch 재진입 차단 (업로드 직후 깜빡임/리프레시 방지) */
    let _lastEmittedGrpId = null;
    onMounted(() => { if (props.modelValue) loadFiles(props.modelValue); });
    watch(() => props.modelValue, (val) => {
      if (val === _lastEmittedGrpId) { _lastEmittedGrpId = null; return; }
      if (val) loadFiles(val);
    });

    /* 허용 확장자 accept 문자열 변환 */
    const cfAcceptAttr = computed(() => {
      if (!props.allowExt || props.allowExt === '*') return '*';
      return props.allowExt.split(',').map(e => '.' + e.trim()).join(',');
    });

    const fileInputRef = ref(null);

    /* openPicker */
    const openPicker = () => {
      if (props.readonly) return;
      if (files.length >= props.maxCount) {
        props.showToast(`최대 ${props.maxCount}개까지 첨부 가능합니다.`, 'warning');
        return;
      }
      fileInputRef.value && fileInputRef.value.click();
    };

    /* onFileChange */
    const onFileChange = async (e) => {
      /* 폼 submit·페이지 이탈 차단 (브라우저 전체 새로고침 방지) */
      try { e.preventDefault?.(); e.stopPropagation?.(); } catch (_) {}
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

        // Content-Type은 axios가 FormData boundary 포함해서 자동 설정
        // coApiSvc.cmUpload 는 client()(boApi||foApi)로 FO·BO 모두 동작 — FO 에는 boApi 미로드라 직접 호출 시 크래시
        const res = await window.coApiSvc.cmUpload.uploadMulti(fd, '첨부파일', '업로드');

        const d = res.data?.data;
        if (!d) throw new Error('업로드 응답이 없습니다.');
        console.log('[BaseAttachGrp] upload response:', JSON.stringify(d));

        /* attachGrpId emit (첫 업로드 or 기존 그룹에 추가) */
        const grpId = d.attachGrpId;
        if (!props.modelValue) { _lastEmittedGrpId = grpId; emit('update:modelValue', grpId); }

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

    /* removeFile */
    const removeFile = async (attachId) => {
      if (props.readonly) return;
      try {
        await window.coApiSvc.cmAttach.deleteFile(attachId);
      } catch (err) {
        console.error('[BaseAttachGrp] 파일 삭제 실패', err);
        props.showToast(err.response?.data?.message || '파일 삭제 중 오류가 발생했습니다.', 'error', 0);
        return;
      }
      const idx = files.findIndex(f => f.attachId === attachId);
      if (idx !== -1) files.splice(idx, 1);
      if (files.length === 0) { _lastEmittedGrpId = null; emit('update:modelValue', null); }
    };

    /* fnFmtSize */
    const fnFmtSize = (bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    /* fnExtIcon */
    const fnExtIcon = (ext) => {
      const map = { pdf: '📄', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', pptx: '📑', ppt: '📑', zip: '🗜️', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', mp4: '🎬', mov: '🎬', mp3: '🎵' };
      return map[ext?.toLowerCase()] || '📎';
    };

    const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','bmp','svg']);

    /* fnIsImage */
    const fnIsImage = (ext) => IMAGE_EXTS.has(ext?.toLowerCase());

    /* ── 팝업 모달 ── */
    const thumbState = reactive({ show: false, url: '', nm: '' });

    /* fnOpenThumb */
    const fnOpenThumb = (f) => { thumbState.url = f.cdnImgUrl || f.attachUrl; thumbState.nm = f.fileNm; thumbState.show = true; };

    /* fnCloseThumb */
    const fnCloseThumb = () => { thumbState.show = false; };

    /* ── hover 미리보기 레이어 ── */
    const hoverState = reactive({ show: false, url: '', x: 0, y: 0 });

    /* fnShowHover */
    const fnShowHover = (e, url) => {
      if (!url) return;
      const r = e.currentTarget.getBoundingClientRect();
      hoverState.x = r.right + 8;
      hoverState.y = r.top;
      hoverState.url = url;
      hoverState.show = true;
    };

    /* fnHideHover */
    const fnHideHover = () => { hoverState.show = false; };

    /* ── drag & drop 정렬 ── */
    const dragState = reactive({ fromIdx: null });

    /* onDragStart */
    const onDragStart = (idx) => { dragState.fromIdx = idx; };

    /* onDragOver */
    const onDragOver  = (e) => { e.preventDefault(); };

    /* onDrop */
    const onDrop = async (toIdx) => {
      const from = dragState.fromIdx;
      dragState.fromIdx = null;
      if (props.readonly) return;
      if (from === null || from === toIdx) return;
      const moved = files.splice(from, 1)[0];
      files.splice(toIdx, 0, moved);
      /* sort_ord 즉시 저장 (드롭 시 서버 반영) */
      files.forEach((f, i) => { f.sortOrd = i + 1; });
      try {
        await Promise.all(files.map((f, i) =>
          window.coApiSvc.cmAttach.updateSort(f.attachId, i + 1)
        ));
        props.showToast('순서가 저장되었습니다.', 'success');
      } catch(e) {
        console.error('[BaseAttachGrp] sort update failed', e);
        props.showToast(e.response?.data?.message || '순서 저장 실패', 'error', 0);
      }
    };

    return {
      uiState, files, cfAcceptAttr, fileInputRef,           // 상태 / computed
      thumbState, hoverState, dragState,                    // UI 상태
      handleBtnAction, handleSelectAction,                  // dispatch
      onFileChange, onDragStart, onDragOver, onDrop,        // 직접 핸들러 (param 다양)
      fnFmtSize, fnExtIcon, fnIsImage,                      // 헬퍼
    };
  },
  template: /* html */`
<div :style="displayMode==='image' ? 'display:inline-flex;flex-direction:column;align-items:center;gap:8px;' : 'border:1px solid #e8e8e8;border-radius:8px;background:#fafafa;padding:12px 14px;'">
  <input ref="fileInputRef" type="file" :accept="cfAcceptAttr" :multiple="displayMode!=='image' && maxCount>1" style="display:none;" @change="onFileChange" @click.stop />
  <!-- ============= [image 모드] 단일 프로필 이미지 박스 UI ============= -->
  <template v-if="displayMode==='image'">
    <!-- 이미지 미리보기 박스 (보기 모드에서는 클릭 비활성) -->
    <div @click.prevent.stop="readonly ? null : handleBtnAction('attach-open-picker')"
      :style="{width:width,height:height,border:'2px dashed #e0e0e0',borderRadius:'10px',overflow:'hidden',cursor:readonly?'default':'pointer',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',transition:'border-color .15s'}"
      @mouseenter="e=>{ if(!readonly) e.currentTarget.style.borderColor='#e8587a'; }"
      @mouseleave="e=>e.currentTarget.style.borderColor='#e0e0e0'"
      :title="(files[0] && files[0].fileNm) || (readonly ? '' : '클릭하여 이미지 선택')">
      <span v-if="uiState.loading || uiState.uploading" style="font-size:22px;">
        ⏳
      </span>
      <img v-else-if="files[0] && (files[0].thumbCdnUrl || files[0].cdnImgUrl)"
        :src="files[0].thumbCdnUrl || files[0].cdnImgUrl"
        style="width:100%;height:100%;object-fit:cover;display:block;" />
      <span v-else style="font-size:32px;color:#ccc;">
        👤
      </span>
    </div>
    <!-- 버튼 (보기 모드에서는 숨김) -->
    <div v-if="!readonly" style="display:flex;gap:6px;">
      <button type="button" @click.prevent.stop="handleBtnAction('attach-open-picker')" :disabled="uiState.uploading"
        style="font-size:11px;padding:3px 10px;border:1px solid #d9d9d9;border-radius:5px;background:#fff;cursor:pointer;color:#555;transition:all .15s;"
        @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}"
        @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
        {{ uiState.uploading ? '업로드중…' : '📷 변경' }}
      </button>
      <button v-if="files[0]" type="button" @click.prevent.stop="handleSelectAction('attach-row-remove', files[0].attachId)"
        style="font-size:11px;padding:3px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fff;cursor:pointer;color:#e8587a;transition:all .15s;"
        @mouseenter="e=>{e.currentTarget.style.background='#fde8e8';}"
        @mouseleave="e=>{e.currentTarget.style.background='#fff';}">
        ✕ 삭제
      </button>
    </div>
    <span v-if="!readonly" style="font-size:10px;color:#bbb;">
      {{ allowExt }} / 최대 {{ maxSizeMb }}MB
    </span>
    <!-- 저장 기준정보 (이미지 모드: 박스 아래 세로 배치) -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#aaa;line-height:1.4;margin-top:2px;">
      <span style="display:inline-flex;align-items:center;gap:3px;">
        <span style="color:#bbb;">📂</span>
        <span style="color:#777;font-weight:500;">{{ grpNm }}</span>
      </span>
      <code style="font-family:monospace;color:#7c5cbf;background:#f7f4ff;padding:0 4px;border-radius:3px;font-size:9px;">{{ grpCode }}</code>
      <code v-if="refId" style="font-family:monospace;color:#4a90d9;background:#eff6fc;padding:0 4px;border-radius:3px;font-size:9px;">{{ refId }}</code>
      <code v-if="modelValue" style="font-family:monospace;color:#999;background:#f5f5f5;padding:0 4px;border-radius:3px;font-size:9px;">{{ modelValue }}</code>
    </div>
  </template>
  <!-- ============= [list 모드] 기본 파일 목록 UI ============= -->
  <template v-else>
  <!-- 저장 기준정보 (businessCode / grpNm / refId / attachGrpId) -->
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;font-size:11px;color:#888;margin-bottom:8px;padding:6px 8px;background:#fff;border:1px solid #f0f0f0;border-radius:4px;">
    <span style="display:inline-flex;align-items:center;gap:3px;">
      <span style="color:#bbb;">📂</span>
      <span style="color:#666;font-weight:500;">{{ grpNm }}</span>
    </span>
    <span style="color:#e0e0e0;">|</span>
    <span style="display:inline-flex;align-items:center;gap:3px;">
      <span style="color:#bbb;">분류</span>
      <code style="font-family:monospace;color:#7c5cbf;background:#f7f4ff;padding:1px 5px;border-radius:3px;">{{ grpCode }}</code>
    </span>
    <span v-if="refId" style="color:#e0e0e0;">|</span>
    <span v-if="refId" style="display:inline-flex;align-items:center;gap:3px;">
      <span style="color:#bbb;">참조</span>
      <code style="font-family:monospace;color:#4a90d9;background:#eff6fc;padding:1px 5px;border-radius:3px;">{{ refId }}</code>
    </span>
    <span v-if="modelValue" style="color:#e0e0e0;">|</span>
    <span v-if="modelValue" style="display:inline-flex;align-items:center;gap:3px;">
      <span style="color:#bbb;">그룹ID</span>
      <code style="font-family:monospace;color:#999;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ modelValue }}</code>
    </span>
  </div>
  <!-- 파일 목록 -->
  <div v-if="files.length" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
    <div v-for="(f, idx) in files" :key="f.attachId"
      :draggable="!readonly"
      @dragstart="readonly ? null : onDragStart(idx)"
      @dragover.prevent="readonly ? null : onDragOver"
      @drop.prevent="readonly ? null : onDrop(idx)"
      :style="'display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;cursor:' + (readonly ? 'default' : 'grab') + ';'"
      @mouseenter="e=>e.currentTarget.style.background='#fff8f9'"
      @mouseleave="e=>e.currentTarget.style.background='#fff'">
      <!-- 순서 번호 -->
      <span style="flex-shrink:0;width:16px;font-size:10px;color:#ccc;text-align:center;line-height:1;">
        {{ idx+1 }}
      </span>
      <!-- 드래그 핸들 (보기 모드에서는 숨김) -->
      <span v-if="!readonly" style="flex-shrink:0;font-size:12px;color:#ccc;cursor:grab;line-height:1;" title="드래그하여 순서 변경">
        ⠿
      </span>
      <span style="font-size:15px;flex-shrink:0;line-height:1;">
        {{ fnExtIcon(f.fileExt) }}
      </span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;" :title="f.fileNm">
          {{ f.fileNm }}
        </span>
        <span v-if="f.attachUrl" style="font-size:10px;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="f.attachUrl">
          {{ f.attachUrl }}
        </span>
      </span>
      <!-- 액션 아이콘: 다운로드 / 팝업보기 / 썸네일hover+클릭 -->
      <span style="display:inline-flex;align-items:center;gap:3px;flex-shrink:0;">
        <a :href="f.cdnImgUrl || f.attachUrl" :download="f.fileNm"
          :title="'다운로드 | ' + (f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#4a90d9';e.currentTarget.style.color='#4a90d9';}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';}">
          ⬇
        </a>
        <!-- 팝업보기: 이미지면 hover 미리보기 + 클릭 모달, 아니면 클릭 모달 -->
        <button @click.stop="handleSelectAction('attach-row-open-thumb', f)" type="button"
          :title="'팝업보기 | ' + (f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#7c5cbf';e.currentTarget.style.color='#7c5cbf';handleSelectAction('attach-row-show-hover', {event:e, url:f.cdnImgUrl||f.attachUrl});}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';e.currentTarget.style.color='#666';handleSelectAction('attach-row-hide-hover');}">
          ↗
        </button>
        <!-- 썸네일 아이콘: hover 미리보기 + 클릭 모달 -->
        <button v-if="fnIsImage(f.fileExt)" @click.stop="handleSelectAction('attach-row-open-thumb', f)" type="button"
          :title="'썸네일보기 | ' + (f.thumbCdnUrl || f.cdnImgUrl || f.attachUrl)"
          style="width:22px;height:22px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;cursor:pointer;font-size:12px;color:#666;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:all .15s;overflow:hidden;"
          @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';handleSelectAction('attach-row-show-hover', {event:e, url:f.thumbCdnUrl||f.cdnImgUrl||f.attachUrl});}"
          @mouseleave="e=>{e.currentTarget.style.borderColor='#e0e0e0';handleSelectAction('attach-row-hide-hover');}">
          <img v-if="f.thumbCdnUrl" :src="f.thumbCdnUrl"
            style="width:100%;height:100%;object-fit:cover;display:block;" @error="e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='inline-flex';}" />
          <span style="font-size:12px;color:#666;" :style="{display:f.thumbCdnUrl?'none':'inline-flex'}">
            🖼
          </span>
        </button>
      </span>
      <span style="font-size:11px;color:#bbb;flex-shrink:0;white-space:nowrap;">
        {{ fnFmtSize(f.fileSize) }}
      </span>
      <button v-if="!readonly" @click.stop="handleSelectAction('attach-row-remove', f.attachId)" title="삭제"
        style="flex-shrink:0;width:18px;height:18px;border:none;background:#f0f0f0;border-radius:50%;cursor:pointer;font-size:10px;color:#888;display:inline-flex;align-items:center;justify-content:center;padding:0;line-height:1;transition:background .1s;"
        @mouseenter="e=>e.currentTarget.style.background='#fde8e8'"
        @mouseleave="e=>e.currentTarget.style.background='#f0f0f0'">
        ✕
      </button>
    </div>
  </div>
  <div v-else-if="uiState.loading" style="font-size:12px;color:#c0c0c0;padding:6px 2px 10px;display:flex;align-items:center;gap:5px;">
    <span style="font-size:14px;">
      ⏳
    </span>
    파일 목록 불러오는 중...
  </div>
  <div v-else style="font-size:12px;color:#c0c0c0;padding:6px 2px 10px;display:flex;align-items:center;gap:5px;">
    <span style="font-size:14px;">
      📂
    </span>
    첨부된 파일이 없습니다.
  </div>
  <!-- 하단 버튼 + 안내 (보기 모드에서는 숨김) -->
  <div v-if="!readonly" style="display:flex;align-items:center;gap:10px;">
    <button @click="handleBtnAction('attach-open-picker')" :disabled="uiState.uploading" type="button"
      style="display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#555;font-weight:500;transition:all .15s;white-space:nowrap;"
      @mouseenter="e=>{if(!uiState.uploading){e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}}"
      @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
      <span v-if="uiState.uploading">
        ⏳ 업로드 중...
      </span>
      <span v-else>
        📎 파일첨부
      </span>
    </button>
    <span style="font-size:11px;color:#bbb;">
      {{ files.length }} / {{ maxCount }}개
      <span style="margin:0 4px;color:#e8e8e8;">
        |
      </span>
      최대 {{ maxSizeMb }}MB
      <span v-if="allowExt!=='*'">
        <span style="margin:0 4px;color:#e8e8e8;">
          |
        </span>
        {{ allowExt }}
      </span>
    </span>
  </div>
  <!-- hover 미리보기 레이어 (fixed, 마우스 우측 하단) -->
  <div v-if="hoverState.show && hoverState.url" style="position:fixed;z-index:10000;pointer-events:none;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.35);background:#fff;border:1px solid #e0e0e0;" :style="{left: hoverState.x + 'px', top: hoverState.y + 'px'}">
  <img :src="hoverState.url" style="display:block;max-width:200px;max-height:200px;object-fit:contain;" />
</div>
<!-- 팝업 모달 -->
<div v-if="thumbState.show" @click.self="handleBtnAction('attach-close-thumb')"
    style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:12px;padding:16px;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 40px rgba(0,0,0,.4);">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <span style="font-size:13px;color:#444;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60vw;" :title="thumbState.nm">
        {{ thumbState.nm }}
      </span>
      <button @click="handleBtnAction('attach-close-thumb')" type="button"
          style="flex-shrink:0;width:24px;height:24px;border:none;background:#f0f0f0;border-radius:50%;cursor:pointer;font-size:13px;color:#888;display:inline-flex;align-items:center;justify-content:center;padding:0;"
          @mouseenter="e=>e.currentTarget.style.background='#fde8e8'"
          @mouseleave="e=>e.currentTarget.style.background='#f0f0f0'">
        ✕
      </button>
    </div>
    <img :src="thumbState.url" :alt="thumbState.nm"
        style="max-width:80vw;max-height:75vh;object-fit:contain;border-radius:6px;" />
  </div>
</div>
  </template>
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
    readonly:    { type: Boolean, default: false },  // 보기(view) 모드: 변경/삭제 숨김, 미리보기만 노출
    width:       { default: '120px' },
    height:      { default: '120px' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { reactive, ref, watch, onMounted } = Vue;
    const uiState  = reactive({ uploading: false, loading: false });
    const file     = reactive({ attachId: null, cdnImgUrl: '', thumbCdnUrl: '', fileNm: '' });
    const inputRef = ref(null);

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BaseAttachOne : handleBtnAction -> ', cmd, param);
      if (cmd === 'attach-open-picker') {
        return openPicker();
      } else if (cmd === 'attach-remove') {
        return removeFile();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BaseAttachOne : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* loadFile */
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

    /* openPicker */
    const openPicker = () => { if (props.readonly) return; if (!uiState.uploading) inputRef.value?.click(); };

    /* onFileChange */
    const onFileChange = async (e) => {
      /* 폼 submit·페이지 이탈 차단 (브라우저 전체 새로고침 방지) */
      try { e.preventDefault?.(); e.stopPropagation?.(); } catch (_) {}
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
        const res = await window.coApiSvc.cmUpload.uploadMulti(fd, '첨부파일', '업로드');
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

    /* removeFile */
    const removeFile = async () => {
      if (props.readonly) return;
      if (!file.attachId) return;
      try {
        await window.coApiSvc.cmAttach.deleteFile(file.attachId);
        file.attachId = null; file.cdnImgUrl = ''; file.thumbCdnUrl = ''; file.fileNm = '';
        emit('update:modelValue', null);
        props.showToast('삭제되었습니다.', 'success');
      } catch(err) { props.showToast(err.response?.data?.message || '삭제 오류', 'error', 0); }
    };

    return {
      uiState, file, inputRef,                 // 상태
      handleBtnAction, handleSelectAction,     // dispatch
      onFileChange,                            // 직접 핸들러
    };
  },
  template: /* html */`
<div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;">
  <input ref="inputRef" type="file" style="display:none;" :accept="allowExt.split(',').map(e=>'.'+e.trim()).join(',')" @change="onFileChange" @click.stop />
  <!-- 이미지 미리보기 박스 (보기 모드에서는 클릭 비활성) -->
  <div @click.prevent.stop="readonly ? null : handleBtnAction('attach-open-picker')"
    :style="{width:width,height:height,border:'2px dashed #e0e0e0',borderRadius:'10px',overflow:'hidden',cursor:readonly?'default':'pointer',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',transition:'border-color .15s'}"
    @mouseenter="e=>{ if(!readonly) e.currentTarget.style.borderColor='#e8587a'; }"
    @mouseleave="e=>e.currentTarget.style.borderColor='#e0e0e0'"
    :title="file.fileNm || (readonly ? '' : '클릭하여 이미지 선택')">
    <span v-if="uiState.loading || uiState.uploading" style="font-size:22px;">
      ⏳
    </span>
    <img v-else-if="file.thumbCdnUrl || file.cdnImgUrl"
      :src="file.thumbCdnUrl || file.cdnImgUrl"
      style="width:100%;height:100%;object-fit:cover;display:block;" />
    <span v-else style="font-size:32px;color:#ccc;">
      👤
    </span>
  </div>
  <!-- 버튼 (보기 모드에서는 숨김) -->
  <div v-if="!readonly" style="display:flex;gap:6px;">
    <button type="button" @click.prevent.stop="handleBtnAction('attach-open-picker')" :disabled="uiState.uploading"
      style="font-size:11px;padding:3px 10px;border:1px solid #d9d9d9;border-radius:5px;background:#fff;cursor:pointer;color:#555;transition:all .15s;"
      @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}"
      @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
      {{ uiState.uploading ? '업로드중…' : '📷 변경' }}
    </button>
    <button v-if="file.attachId" type="button" @click.prevent.stop="handleBtnAction('attach-remove')"
      style="font-size:11px;padding:3px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fff;cursor:pointer;color:#e8587a;transition:all .15s;"
      @mouseenter="e=>{e.currentTarget.style.background='#fde8e8';}"
      @mouseleave="e=>{e.currentTarget.style.background='#fff';}">
      ✕ 삭제
    </button>
  </div>
  <span v-if="!readonly" style="font-size:10px;color:#bbb;">
    {{ allowExt }} / 최대 {{ maxSizeMb }}MB
  </span>
  <!-- 저장 기준정보 (그룹명/businessCode/attachGrpId) -->
  <div style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#aaa;line-height:1.4;margin-top:2px;">
    <span style="display:inline-flex;align-items:center;gap:3px;">
      <span style="color:#bbb;">📂</span>
      <span style="color:#777;font-weight:500;">{{ grpNm }}</span>
    </span>
    <code style="font-family:monospace;color:#7c5cbf;background:#f7f4ff;padding:0 4px;border-radius:3px;font-size:9px;">{{ grpCode }}</code>
    <code v-if="modelValue" style="font-family:monospace;color:#999;background:#f5f5f5;padding:0 4px;border-radius:3px;font-size:9px;">{{ modelValue }}</code>
  </div>
</div>
`
};

/* ==========================================================================
 * BaseHtmlEditor — Toast UI Editor 래퍼 컴포넌트 (구 TuiHtmlEditor)
 * 공통 HTML 에디터.
 *  - v-model 양방향 바인딩 (modelValue ↔ form 필드)
 *  - 디자인/HTML 소스/미리보기 모드 토글
 *  - 이미지 URL/업로드/클립보드 붙여넣기/드래그앤드롭 (Base64 자동 인라인)
 *  - 한국어 IME, 한글 UI
 *
 * 사용 예:
 *   <base-html-editor v-model="form.content" />
 *   <base-html-editor :model-value="form.content" @update:model-value="v => form.content = v" />
 * ========================================================================== */
/* Toast UI Editor 팝업(이미지/링크 추가) 크기 보정 — 하단 확인/취소 버튼이 잘리지 않도록
 * 최소 높이를 확보하고 스크롤 가능하게 함. 1회만 주입. */
(function injectBaseHtmlEditorStyle() {
  if (document.getElementById('base-html-editor-style')) return;
  const style = document.createElement('style');
  style.id = 'base-html-editor-style';
  style.textContent = `
    /* 에디터 컨테이너 전체 — overflow 해제로 팝업이 영역 밖으로 자유롭게 표시 */
    .toastui-editor-defaultUI,
    .toastui-editor-defaultUI-toolbar,
    .toastui-editor-toolbar,
    .toastui-editor-toolbar-icons,
    .toastui-editor-main,
    .toastui-editor-main-container,
    .toastui-editor-ww-container,
    .toastui-editor-md-container { overflow: visible !important; }

    /* 팝업 — viewport 기준 fixed 로 변경하여 어떤 부모의 overflow:hidden 도 무시 */
    .toastui-editor-popup {
      z-index: 10050 !important;
      position: fixed !important;
    }
    /* 표 팝업은 예외: 그리드 셀 좌표 계산이 fixed 컨테이너 안에서 어긋나 hover 가
     * 어긋남. absolute 유지 (폭이 작아 잘림 영향도 미미). */
    .toastui-editor-popup.toastui-editor-popup-add-table {
      position: absolute !important;
    }
    .toastui-editor-popup-body {
      min-width: 360px;
      max-height: 70vh;
      overflow-y: auto;
      padding-bottom: 8px;
    }
    /* 하단 확인/취소 버튼 영역 — 스크롤 시에도 항상 하단 고정 */
    .toastui-editor-popup .toastui-editor-button-container,
    .toastui-editor-popup-add-image .toastui-editor-button-container,
    .toastui-editor-popup-add-link  .toastui-editor-button-container,
    .toastui-editor-popup-add-table .toastui-editor-button-container {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      position: sticky;
      bottom: 0;
      background: #fff;
    }

    /* 툴바 한 줄 고정 — 줄바꿈(2줄) 방지. 좁으면 가로 스크롤 */
    .toastui-editor-toolbar { overflow-x: auto; overflow-y: visible; }
    .toastui-editor-defaultUI-toolbar {
      flex-wrap: nowrap !important;
      white-space: nowrap;
      overflow-x: auto;
      overflow-y: visible;
    }
    .toastui-editor-toolbar-group { flex-wrap: nowrap !important; flex-shrink: 0; }
  `;
  document.head.appendChild(style);
})();

window.BaseHtmlEditor = {
  name: 'BaseHtmlEditor',
  props: {
    modelValue: { type: String, default: '' },
    height:     { type: String, default: '320px' },
    showSourceToggle: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { ref, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

    const editorEl = ref(null);
    const mode = ref('wysiwyg');  /* 편집 모드 토글: 'wysiwyg'(디자인) | 'source'(HTML) — 디자인↔HTML 2-way */
    const previewOn = ref(false); /* 미리보기 독립 토글 (편집 모드와 별개). true 면 편집 영역 우측에 실시간 미리보기 패널 표시 */
    const splitPct = ref(50);     /* 미리보기 ON 시 좌측 편집 영역 비율(%) — 중앙 바 드래그로 조절 */
    const splitRoot = ref(null);  /* split 컨테이너 ref (드래그 좌표 계산용) */
    let inst = null;
    let syncing = false;
    let popupObserver = null;
    let popupMouseHandler = null;
    let popupRoot = null;
    let splitDragMove = null;
    let splitDragUp = null;

    /* _startSplitDrag — 중앙 스플리터 바 드래그 시작. 좌/우 폭 비율(splitPct) 조절 */
    const _startSplitDrag = (e) => {
      e.preventDefault();
      const rootEl = splitRoot.value;
      if (!rootEl) return;
      splitDragMove = (ev) => {
        const rect = rootEl.getBoundingClientRect();
        const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
        let pct = (x / rect.width) * 100;
        pct = Math.max(20, Math.min(80, pct));   // 20~80% 범위 제한
        splitPct.value = pct;
      };
      splitDragUp = () => {
        document.removeEventListener('mousemove', splitDragMove);
        document.removeEventListener('mouseup', splitDragUp);
        document.removeEventListener('touchmove', splitDragMove);
        document.removeEventListener('touchend', splitDragUp);
      };
      document.addEventListener('mousemove', splitDragMove);
      document.addEventListener('mouseup', splitDragUp);
      document.addEventListener('touchmove', splitDragMove, { passive: false });
      document.addEventListener('touchend', splitDragUp);
    };

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BaseHtmlEditor : handleBtnAction -> ', cmd, param);
      // 편집 모드 토글 (디자인 'wysiwyg' / HTML 'source') — 미리보기와 독립
      if (cmd === 'editor-set-mode') {
        mode.value = param;
        return;
      // 미리보기 독립 토글 (편집 모드 유지한 채 우측 미리보기 패널 on/off)
      } else if (cmd === 'editor-toggle-preview') {
        previewOn.value = !previewOn.value;
        return;
      } else if (cmd === 'editor-split-drag') {
        return _startSplitDrag(param);
      } else if (cmd === 'editor-clear') {
        return emit('update:modelValue', '');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BaseHtmlEditor : handleSelectAction -> ', cmd, param);
      if (cmd === 'editor-source-input') {
        return emit('update:modelValue', param.target.value);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* _dispose */
    const _dispose = () => {
      if (inst) { try { inst.destroy(); } catch (_) {} inst = null; }
    };

    /* _init */
    const _init = () => {
      if (inst) return;
      const el = editorEl.value;
      if (!el) return;
      const Editor = (window.toastui && window.toastui.Editor) || window.Editor;
      if (!Editor) { console.warn('[BaseHtmlEditor] Toast UI Editor library not loaded'); return; }
      inst = new Editor({
        el,
        height: props.height,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        hideModeSwitch: true,
        language: 'ko-KR',
        usageStatistics: false,
        initialValue: props.modelValue || '',
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
        ],
        hooks: {
          /* 이미지 업로드: Base64 인라인 (서버 업로드 없이 즉시 미리보기) */
          addImageBlobHook: (blob, callback) => {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result, blob.name || 'image');
            reader.readAsDataURL(blob);
          },
        },
      });
      inst.on('change', () => {
        if (syncing) return;
        try { emit('update:modelValue', inst.getHTML()); } catch (_) {}
      });

      /* 팝업(이미지/링크/표 추가)을 클릭한 toolbar 버튼 바로 아래에 띄운다.
       * - 부모 overflow:hidden 에 잘리지 않도록 CSS 에서 position:fixed 지정
       * - mousedown 으로 클릭 버튼의 좌표를 캡처해 두었다가, 팝업이 보이는 순간 그 좌표로 이동 */
      _attachPopupPositioner(el);
    };

    /* _attachPopupPositioner — toolbar 버튼 클릭 좌표를 기억했다가 팝업을 그 아래로 이동 */
    const _attachPopupPositioner = (rootEl) => {
      if (!rootEl) return;
      let lastBtnRect = null;

      /* mousedown 으로 toolbar 버튼 좌표 캡처 (popup 이 열리기 직전 시점)
       * - toolbar 영역(.toastui-editor-toolbar 또는 .toastui-editor-defaultUI-toolbar) 내부의
       *   .toastui-editor-toolbar-icons 버튼만 대상. 팝업 내부 버튼/그리드 셀은 제외. */
      const onMouseDown = (e) => {
        const btn = e.target.closest('.toastui-editor-toolbar-icons');
        if (!btn) return;
        if (!rootEl.contains(btn)) return;
        /* 팝업 내부 요소는 제외 (팝업 내부에도 .toastui-editor-toolbar-icons 가 있을 수 있음) */
        if (btn.closest('.toastui-editor-popup')) return;
        lastBtnRect = btn.getBoundingClientRect();
      };
      rootEl.addEventListener('mousedown', onMouseDown, true);

      /* 팝업 표시 감지: style 변경(display:none → block) 또는 새로 추가되는 경우 */
      const positionPopup = (popup) => {
        if (!popup || !lastBtnRect) return;
        try {
          /* requestAnimationFrame: 팝업이 렌더링되어 크기가 잡힌 뒤 측정 */
          requestAnimationFrame(() => {
            const pRect = popup.getBoundingClientRect();
            const margin = 4;
            const vH = window.innerHeight, vW = window.innerWidth;
            let top  = lastBtnRect.bottom + margin;
            let left = lastBtnRect.left;
            /* 화면 하단을 벗어나면 버튼 위쪽으로 표시 */
            if (top + pRect.height > vH - 8) {
              top = Math.max(8, lastBtnRect.top - pRect.height - margin);
            }
            /* 화면 오른쪽을 벗어나면 왼쪽으로 보정 */
            if (left + pRect.width > vW - 8) {
              left = Math.max(8, vW - pRect.width - 8);
            }
            popup.style.top    = top  + 'px';
            popup.style.left   = left + 'px';
            popup.style.right  = 'auto';
            popup.style.bottom = 'auto';
          });
        } catch (_) {}
      };

      /* 이미 위치를 잡은 팝업은 재배치하지 않는다 (그리드 hover 등 내부 상호작용 시
       * 발생하는 style 변경에 반응해 팝업이 점프하는 부작용 차단). */
      const positionedPopups = new WeakSet();
      /* 표 팝업(toastui-editor-popup-add-table)은 그리드 셀 좌표 계산이
       * position:fixed 컨테이너 안에서 어긋나므로 위치 보정 대상에서 제외 (CSS 에서도
       * fixed 적용 안 함). 표는 폭이 작아 잘릴 일이 거의 없음. */
      const isTablePopup = (popup) =>
        popup.classList && popup.classList.contains('toastui-editor-popup-add-table');
      const positionOnce = (popup) => {
        if (isTablePopup(popup)) return;
        if (positionedPopups.has(popup)) return;
        const disp = popup.style.display;
        if (disp === 'none' || disp === '') return;
        positionedPopups.add(popup);
        positionPopup(popup);
      };
      /* 팝업이 닫힐 때는 set 에서 제거하여 다음 열림 때 다시 배치되도록 */
      const resetIfHidden = (popup) => {
        if (popup.style.display === 'none') positionedPopups.delete(popup);
      };

      const observer = new MutationObserver((muts) => {
        muts.forEach((m) => {
          /* 1) 기존 팝업의 style display 가 'none' → 'block' 으로 바뀐 경우 */
          if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('toastui-editor-popup')) {
            resetIfHidden(m.target);
            positionOnce(m.target);
          }
          /* 2) 새 팝업 노드가 추가되는 경우 */
          if (m.type === 'childList') {
            m.addedNodes.forEach((n) => {
              if (n.nodeType === 1 && n.classList && n.classList.contains('toastui-editor-popup')) {
                positionOnce(n);
              }
            });
          }
        });
      });
      observer.observe(rootEl, { attributes: true, subtree: true, childList: true, attributeFilter: ['style', 'class'] });
      popupObserver = observer;
      popupMouseHandler = onMouseDown;
      popupRoot = rootEl;
    };

    /* _syncFromProp */
    const _syncFromProp = () => {
      if (!inst) return;

      /* cur */
      const cur = (() => { try { return inst.getHTML(); } catch (_) { return ''; } })();
      const next = props.modelValue || '';
      if (cur === next) return;
      syncing = true;
      try { inst.setHTML(next, false); }
      finally { setTimeout(() => { syncing = false; }, 30); }
    };

    onMounted(async () => {
      await nextTick();
      _init();
    });

    onBeforeUnmount(() => { _dispose(); });

    /* prop 변경 시 동기화 (wysiwyg 모드는 에디터 인스턴스 사용) */
    watch(() => props.modelValue, () => {
      if (mode.value === 'wysiwyg' && inst) _syncFromProp();
    });

    /* 디자인 모드 토글 시 인스턴스 재정비 */
    watch(mode, async (m) => {
      if (m === 'wysiwyg') {
        await nextTick();
        if (!inst) _init();
        else _syncFromProp();
      }
    });

    /* source 모드 textarea 스타일 (template 속성값 이스케이프 회피용 computed) */
    const cfTextareaStyle = Vue.computed(() => ({
      width: '100%',
      minHeight: props.height,
      padding: '12px 14px',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      fontFamily: "'Consolas','D2Coding',monospace",
      fontSize: '12px',
      lineHeight: '1.7',
      color: '#333',
      resize: 'vertical',
      boxSizing: 'border-box',
      margin: 0,
      background: '#fafafa',
      outline: 'none',
    }));

    /* preview 모드 컨테이너 스타일 (실제 렌더링 결과 표시) */
    const cfPreviewStyle = Vue.computed(() => ({
      width: '100%',
      minHeight: props.height,
      padding: '14px 16px',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      background: '#fff',
      boxSizing: 'border-box',
      overflowY: 'auto',
      lineHeight: '1.7',
      color: '#222',
    }));

    return {
      editorEl, mode, previewOn, splitPct, splitRoot, cfTextareaStyle, cfPreviewStyle,   // 상태
      handleBtnAction, handleSelectAction,               // dispatch
    };
  },
  template: /* html */`
<div>
  <div v-if="showSourceToggle" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <div style="display:flex;align-items:center;gap:4px;">
      <!-- 편집 모드 토글: 디자인 ↔ HTML (2-way) -->
      <button type="button" @click="handleBtnAction('editor-set-mode', 'wysiwyg')"
        :style="mode === 'wysiwyg' ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;' : 'background:#fff;color:#555;border-color:#d0d0d0;'"
        style="font-size:11px;padding:3px 12px;border:1px solid;border-radius:4px;cursor:pointer;transition:all .15s;">
        디자인
      </button>
      <button type="button" @click="handleBtnAction('editor-set-mode', 'source')"
        :style="mode === 'source' ? 'background:#1e1e2e;color:#7ec8e3;border-color:#7ec8e3;' : 'background:#fff;color:#555;border-color:#d0d0d0;'"
        style="font-size:11px;padding:3px 12px;border:1px solid;border-radius:4px;cursor:pointer;font-family:monospace;transition:all .15s;">
        &lt;/&gt; HTML
      </button>
      <!-- 구분선 -->
      <span style="width:1px;height:16px;background:#e0e0e0;margin:0 4px;"></span>
      <!-- 미리보기 독립 토글 (디자인/HTML 과 별개로 on/off) -->
      <button type="button" @click="handleBtnAction('editor-toggle-preview')"
        :style="previewOn ? 'background:#047857;color:#fff;border-color:#047857;' : 'background:#fff;color:#555;border-color:#d0d0d0;'"
        style="font-size:11px;padding:3px 12px;border:1px solid;border-radius:4px;cursor:pointer;transition:all .15s;">
        👁 미리보기
      </button>
    </div>
    <button type="button" @click="handleBtnAction('editor-clear')"
      style="font-size:11px;padding:3px 10px;border:1px solid #fca5a5;background:#fff0f0;color:#dc2626;border-radius:4px;cursor:pointer;">
      비우기
    </button>
  </div>
  <!-- 편집 영역 + (미리보기 ON 시) 우측 미리보기 패널. previewOn 이면 좌(편집)|스플리터|우(미리보기) -->
  <div ref="splitRoot" :style="previewOn ? 'display:flex;align-items:stretch;gap:0;' : ''">
    <!-- 좌측 편집 영역: 디자인(에디터 인스턴스) 또는 HTML(textarea). previewOn 일 때 splitPct% 폭 -->
    <div :style="previewOn ? ('width:' + splitPct + '%;min-width:0;') : 'width:100%;'">
      <!-- 디자인 에디터(인스턴스 DOM 항상 동일). border 명시 — 미리보기↔디자인 전환 시 테두리 유지 -->
      <div v-show="mode === 'wysiwyg'" ref="editorEl"
        :style="previewOn ? 'background:#fff;border:1px solid #d0d0d0;border-radius:6px 0 0 6px;' : 'background:#fff;border:1px solid #d0d0d0;border-radius:6px;'">
      </div>
      <!-- HTML 소스 textarea -->
      <textarea v-show="mode === 'source'" :value="modelValue" @input="handleSelectAction('editor-source-input', $event)"
        spellcheck="false" :style="cfTextareaStyle"></textarea>
    </div>
    <!-- 중앙 스플리터 바 (드래그로 좌/우 폭 조절) -->
    <div v-show="previewOn" @mousedown="handleBtnAction('editor-split-drag', $event)" @touchstart="handleBtnAction('editor-split-drag', $event)"
      title="드래그하여 크기 조절"
      style="flex:0 0 8px;cursor:col-resize;background:#e5e7eb;border-left:1px solid #d0d0d0;border-right:1px solid #d0d0d0;display:flex;align-items:center;justify-content:center;user-select:none;">
      <span style="color:#999;font-size:10px;line-height:1;">⋮⋮</span>
    </div>
    <!-- 우측 실시간 미리보기 (previewOn) -->
    <div v-show="previewOn" :style="cfPreviewStyle" style="flex:1;min-width:0;border-radius:0 6px 6px 0;"
      v-html="modelValue || '<span style=color:#bbb>(내용 없음)</span>'">
    </div>
  </div>
  </div>
`
};

/* ──────────────────────────────────────────────────────────────────────────
 * BaseTossPayWidget — 토스페이먼츠 v2 결제위젯 공통 컴포넌트 (FO·BO 공용)
 *   · coExtSdk.getTossPaymentWidgets / foEnvConsts·boEnvConsts 의존 (SDK 레이어는 공통)
 *   · 인스턴스별 고유 selector 로 한 페이지 다중 렌더 충돌 방지
 *   · 정보 불충분/실패 시 조용히 폴백하지 않고 showToast 로 이유+해결법 안내
 *   · 결제 성공 시 successUrl 로 리다이렉트(토스 표준). emit: open/close/error
 * 사용:
 *   <base-toss-pay-widget :amount="form.totalAmt" :order-id="form.orderId"
 *     :order-name="form.prodNm" :customer-key="form.memberId" :customer-name="form.memberNm"
 *     :show-toast="showToast" :show-confirm="showConfirm"
 *     success-page="odOrderMng" />
 * ────────────────────────────────────────────────────────────────────────── */
window.BaseTossPayWidget = {
  name: 'BaseTossPayWidget',
  props: {
    amount:       { type: [Number, String], default: 0 },        // 결제 금액(원)
    orderId:      { type: String, default: '' },                 // 주문번호(없으면 자동)
    orderName:    { type: String, default: '주문결제' },         // 주문명
    customerKey:  { type: String, default: '' },                 // 구매자 키(회원ID 등). 없으면 ANONYMOUS
    customerName: { type: String, default: '고객' },             // 구매자명
    successPage:  { type: String, default: '' },                 // 성공 시 이동할 #page (hash 라우팅)
    failPage:     { type: String, default: '' },                 // 실패 시 이동할 #page
    showToast:    { type: Function, default: () => {} },         // 토스트 (FO/BO 주입)
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    buttonLabel:  { type: String, default: '🧩 간편 위젯 결제' }, // 토글 버튼 라벨
  },
  emits: ['open', 'close', 'error'],
  setup(props, { emit }) {
    const { reactive, computed } = Vue;
    const ui = reactive({ open: false, ready: false, processing: false });
    /* 인스턴스 고유 id (다중 위젯 selector 충돌 방지) — Date/Math.random 금지라 카운터 사용 */
    window._baseTossPayWidgetSeq = (window._baseTossPayWidgetSeq || 0) + 1;
    const uid = window._baseTossPayWidgetSeq;
    const methodId = 'toss-pay-method-' + uid;
    const agreeId  = 'toss-pay-agreement-' + uid;
    let _widgets = null;
    let _rendered = false;

    const cfAmount = computed(() => Number(props.amount) || 0);
    const fmtWon = (n) => Number(n || 0).toLocaleString() + '원';

    /* 결제위젯 토글 + 최초 1회 렌더 */
    const toggle = async () => {
      if (ui.open) { ui.open = false; emit('close'); return; }
      const amount = cfAmount.value;
      if (amount <= 0) { props.showToast('결제금액이 0원입니다. 금액을 확인하세요.', 'error'); return; }
      ui.open = true; ui.ready = false; emit('open');
      if (!window.TossPayments) {
        props.showToast('토스 결제 SDK 가 로드되지 않았습니다. (페이지의 v2/standard 스크립트 확인)', 'error', 0); return;
      }
      if (!window.coExtSdk || !window.coExtSdk.getTossPaymentWidgets) {
        props.showToast('coExtSdk 결제위젯 헬퍼를 찾을 수 없습니다. (lib/utils/coExtSdk.js 로드 확인)', 'error', 0); return;
      }
      try {
        await Vue.nextTick();
        /* 개발용: 결제위젯 띄울 때 SDK·키·파라미터를 toast 로 표시 */
        if (window.coExtSdk.setDebugHook) {
          window.coExtSdk.setDebugHook((label, info) => {
            props.showToast('[개발] ' + label + '\n' + window.coExtSdk._fmtParams(info), 'info', 0);
          });
        }
        if (!_widgets) { _widgets = await window.coExtSdk.getTossPaymentWidgets(props.customerKey || undefined); }
        props.showToast('[개발] 토스 결제위젯 렌더\n' + window.coExtSdk._fmtParams({ customerKey: props.customerKey || 'ANONYMOUS', amount, currency: 'KRW' }), 'info', 0);
        await _widgets.setAmount({ currency: 'KRW', value: amount });
        if (!_rendered) {
          await _widgets.renderPaymentMethods({ selector: '#' + methodId, variantKey: 'DEFAULT' });
          await _widgets.renderAgreement({ selector: '#' + agreeId, variantKey: 'AGREEMENT' });
          _rendered = true;
        }
        ui.ready = true;
        if (window.coExtSdk.isTossTestKey && window.coExtSdk.isTossTestKey()) {
          props.showToast('토스 테스트 키로 위젯을 표시합니다. 실 결제는 사이트 설정에 tossClientKey(운영키)를 입력하세요.', 'info');
        }
      } catch (e) {
        console.error('[BaseTossPayWidget 렌더 실패]', e);
        ui.ready = false; emit('error', e);
        /* 실패 토스트에 [결제 설정 방법 보기] 버튼 부착 (사용자 취소면 action=null) */
        const action = window.coExtHelp && window.coExtHelp.toastAction({ kind: 'pay', provider: 'toss', error: e });
        props.showToast('토스 위젯을 표시할 수 없습니다: ' + ((e && e.message) || '알 수 없는 오류')
          + '\n→ 해결: 토스 클라이언트 키(결제위젯 연동 키, gck/ck 로 시작)를 발급받아 svTossClientKey 에 등록하세요. '
          + '미설정 시 테스트 키로 동작합니다. (자세한 발급 방법은 아래 버튼)', 'error', 0, '', action);
      }
    };

    /* 결제 요청 */
    const request = async () => {
      const amount = cfAmount.value;
      if (amount <= 0) { props.showToast('결제금액이 0원입니다.', 'error'); return; }
      if (!ui.ready || !_widgets) {
        props.showToast('결제위젯이 준비되지 않았습니다. [' + props.buttonLabel + '] 를 먼저 눌러 위젯을 표시하세요.', 'error', 0); return;
      }
      const ok = await props.showConfirm('결제 요청', fmtWon(amount) + ' 을 결제하시겠습니까?');
      if (!ok) { return; }
      ui.processing = true;
      try {
        await _widgets.setAmount({ currency: 'KRW', value: amount });   // 결제 직전 최신 금액 동기화
        const base = window.location.origin + window.location.pathname;
        await _widgets.requestPayment({
          orderId: props.orderId || ('ORDW' + String(uid).padStart(6, '0')),  // 토스 orderId 6~64자 규약 + 인스턴스 고정
          orderName: props.orderName || '주문결제',
          customerName: props.customerName || '고객',
          successUrl: base + (props.successPage ? ('#page=' + props.successPage + '&payResult=success') : '#payResult=success'),
          failUrl:    base + (props.failPage    ? ('#page=' + props.failPage    + '&payResult=fail')    : '#payResult=fail'),
        });
        /* 성공 시 successUrl 리다이렉트 → 이후 코드 보통 미실행 */
      } catch (e) {
        console.error('[BaseTossPayWidget 결제 실패]', e);
        emit('error', e);
        if (e && (e.code === 'USER_CANCEL' || /취소/.test(e.message || ''))) {
          props.showToast('결제가 취소되었습니다.', 'info');
        } else {
          /* 실패 토스트에 [결제 설정 방법 보기] 버튼 부착 */
          const action = window.coExtHelp && window.coExtHelp.toastAction({ kind: 'pay', provider: 'toss', error: e });
          props.showToast('결제 요청 실패: ' + ((e && e.message) || '알 수 없는 오류') + ' / 결제수단 선택·약관 동의 후 다시 시도하세요.', 'error', 0, '', action);
        }
      } finally {
        ui.processing = false;
      }
    };

    return { ui, methodId, agreeId, cfAmount, fmtWon, toggle, request };
  },
  template: /* html */`
<div>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <button type="button" class="btn btn-secondary btn-sm" :disabled="ui.processing" @click="toggle">
      {{ ui.open ? '✕ 위젯 닫기' : buttonLabel }}
    </button>
    <span style="font-size:12px;color:#888;">결제 금액 <b style="color:#e8587a;">{{ fmtWon(cfAmount) }}</b></span>
  </div>
  <div v-show="ui.open" style="margin-top:14px;border-top:1px dashed #e0e0e0;padding-top:14px;">
    <div style="font-size:12px;color:#888;margin-bottom:8px;">결제 수단을 선택한 뒤 [결제하기] 를 누르세요. (Toss Client Key 미설정 시 테스트 키)</div>
    <div :id="methodId"></div>
    <div :id="agreeId" style="margin-top:8px;"></div>
    <div style="text-align:right;margin-top:10px;">
      <button type="button" class="btn btn-primary" :disabled="ui.processing" @click="request">
        {{ ui.processing ? '결제 처리중…' : '결제하기' }}
      </button>
    </div>
  </div>
</div>
`
};

/* ── BaseComp 레지스트리 ── */
window.BaseComp = {
  'attach_grp': window.BaseAttachGrp,
  'attach_one':  window.BaseAttachOne,
};
