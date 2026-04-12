/* ShopJoy - 공통 컴포넌트 모음 */

/* ─────────────────────────────────────────
   attach_grp : 첨부파일 그룹 컴포넌트
   ─────────────────────────────────────────
   Props:
     modelValue  : attachGrpId (Number|null) — v-model 바인딩
     adminData   : adminData 객체 (attaches, attachGrps 포함)
     refId       : 참조 ID 문자열 (e.g. 'NOTICE-1')
     showToast   : 토스트 함수
     grpCode     : 그룹 코드 prefix (기본 'COMN_ATTACH')
     grpNm     : 그룹 이름 (기본 '첨부파일')
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
    adminData:  { required: true },
    refId:      { default: '' },
    showToast:  { type: Function, default: () => {} },
    grpCode:    { default: 'COMN_ATTACH' },
    grpNm:    { default: '첨부파일' },
    maxCount:   { default: 10 },
    maxSizeMb:  { default: 10 },
    allowExt:   { default: '*' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { computed, ref } = Vue;

    /* 현재 그룹의 파일 목록 */
    const files = computed(() =>
      props.modelValue
        ? props.adminData.attaches.filter(a => a.attachGrpId === props.modelValue)
        : []
    );

    /* 허용 확장자 accept 문자열 변환 */
    const acceptAttr = computed(() => {
      if (!props.allowExt || props.allowExt === '*') return '*';
      return props.allowExt.split(',').map(e => '.' + e.trim()).join(',');
    });

    const fileInputRef = ref(null);

    const openPicker = () => {
      if (files.value.length >= props.maxCount) {
        props.showToast(`최대 ${props.maxCount}개까지 첨부 가능합니다.`, 'warning');
        return;
      }
      fileInputRef.value && fileInputRef.value.click();
    };

    const onFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (!selectedFiles.length) return;

      const maxBytes = props.maxSizeMb * 1024 * 1024;
      const allowed  = props.allowExt === '*' ? null : props.allowExt.split(',').map(x => x.trim().toLowerCase());
      const remaining = props.maxCount - files.value.length;

      /* grpId는 루프 바깥에서 초기화 — 다중 파일 시 동일 그룹 공유 */
      let grpId = props.modelValue;
      let addedCount = 0;
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

        /* 최초 첨부 → attachGrps 신규 생성 후 ID emit */
        if (!grpId) {
          const newGrp = {
            attachGrpId:  props.adminData.nextId(props.adminData.attachGrps, 'attachGrpId'),
            grpNm:      props.grpNm,
            grpCode:      props.grpCode + '_' + Date.now(),
            description:  props.grpNm + ' 자동생성 그룹',
            maxCount:     props.maxCount,
            maxSizeMb:    props.maxSizeMb,
            allowExt:     props.allowExt,
            status:       '활성',
            regDate:      new Date().toISOString().slice(0, 10),
          };
          props.adminData.attachGrps.push(newGrp);
          grpId = newGrp.attachGrpId;
          emit('update:modelValue', grpId);
        }

        props.adminData.attaches.push({
          attachId:     props.adminData.nextId(props.adminData.attaches, 'attachId'),
          attachGrpId:  grpId,
          attachGrpNm: props.grpNm,
          fileNm:     file.name,
          fileSize:     file.size,
          fileExt:      ext,
          url:          '/uploads/comn/' + file.name,
          refId:        props.refId || '',
          memo:         '',
          regDate:      new Date().toISOString().slice(0, 10),
        });
        addedCount++;
      }

      /* input 초기화 (같은 파일 재선택 허용) */
      e.target.value = '';
      if (addedCount) props.showToast(`${addedCount}개 파일이 첨부되었습니다.`);
    };

    const removeFile = (attachId) => {
      const idx = props.adminData.attaches.findIndex(a => a.attachId === attachId);
      if (idx !== -1) props.adminData.attaches.splice(idx, 1);
      /* 그룹 내 파일이 모두 삭제되면 grpId 초기화 */
      if (files.value.length === 0) emit('update:modelValue', null);
    };

    const fmtSize = (bytes) => {
      if (!bytes) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const extIcon = (ext) => {
      const map = { pdf: '📄', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', pptx: '📑', ppt: '📑', zip: '🗜️', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', mp4: '🎬', mov: '🎬', mp3: '🎵' };
      return map[ext?.toLowerCase()] || '📎';
    };

    return { files, acceptAttr, fileInputRef, openPicker, onFileChange, removeFile, fmtSize, extIcon };
  },
  template: /* html */`
<div style="border:1px solid #e8e8e8;border-radius:8px;background:#fafafa;padding:12px 14px;">
  <input ref="fileInputRef" type="file" :accept="acceptAttr" multiple style="display:none;" @change="onFileChange" />

  <!-- 파일 목록 -->
  <div v-if="files.length" style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
    <div v-for="f in files" :key="f.attachId"
      style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;"
      @mouseenter="e=>e.currentTarget.style.background='#fff8f9'"
      @mouseleave="e=>e.currentTarget.style.background='#fff'">
      <span style="font-size:15px;flex-shrink:0;line-height:1;">{{ extIcon(f.fileExt) }}</span>
      <span style="flex:1;font-size:12px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;" :title="f.fileNm">{{ f.fileNm }}</span>
      <span style="font-size:11px;color:#bbb;flex-shrink:0;white-space:nowrap;">{{ fmtSize(f.fileSize) }}</span>
      <button @click.stop="removeFile(f.attachId)" title="삭제"
        style="flex-shrink:0;width:18px;height:18px;border:none;background:#f0f0f0;border-radius:50%;cursor:pointer;font-size:10px;color:#888;display:inline-flex;align-items:center;justify-content:center;padding:0;line-height:1;transition:background .1s;"
        @mouseenter="e=>e.currentTarget.style.background='#fde8e8'"
        @mouseleave="e=>e.currentTarget.style.background='#f0f0f0'">✕</button>
    </div>
  </div>
  <div v-else style="font-size:12px;color:#c0c0c0;padding:6px 2px 10px;display:flex;align-items:center;gap:5px;">
    <span style="font-size:14px;">📂</span> 첨부된 파일이 없습니다.
  </div>

  <!-- 하단 버튼 + 안내 -->
  <div style="display:flex;align-items:center;gap:10px;">
    <button @click="openPicker" type="button"
      style="display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#555;font-weight:500;transition:all .15s;white-space:nowrap;"
      @mouseenter="e=>{e.currentTarget.style.borderColor='#e8587a';e.currentTarget.style.color='#e8587a';}"
      @mouseleave="e=>{e.currentTarget.style.borderColor='#d9d9d9';e.currentTarget.style.color='#555';}">
      📎 파일첨부
    </button>
    <span style="font-size:11px;color:#bbb;">
      {{ files.length }} / {{ maxCount }}개
      <span style="margin:0 4px;color:#e8e8e8;">|</span>
      최대 {{ maxSizeMb }}MB
      <span v-if="allowExt!=='*'"><span style="margin:0 4px;color:#e8e8e8;">|</span>{{ allowExt }}</span>
    </span>
  </div>
</div>
`
};

/* ── BaseComp 레지스트리 ── */
window.BaseComp = {
  'attach_grp': window.BaseAttachGrp,
};
