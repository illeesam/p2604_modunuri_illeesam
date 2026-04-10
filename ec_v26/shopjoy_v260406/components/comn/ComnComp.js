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
     grpName     : 그룹 이름 (기본 '첨부파일')
     maxCount    : 최대 첨부 개수 (기본 10)
     maxSizeMb   : 파일당 최대 크기 MB (기본 10)
     allowExt    : 허용 확장자 문자열, 쉼표 구분 (기본 '*' = 전체)
   Emits:
     update:modelValue : 최초 첨부 시 생성된 attachGrpId 반환
 ─────────────────────────────────────────── */
window.ComnAttachGrp = {
  name: 'ComnAttachGrp',
  props: {
    modelValue: { default: null },
    adminData:  { required: true },
    refId:      { default: '' },
    showToast:  { type: Function, default: () => {} },
    grpCode:    { default: 'COMN_ATTACH' },
    grpName:    { default: '첨부파일' },
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
            grpName:      props.grpName,
            grpCode:      props.grpCode + '_' + Date.now(),
            description:  props.grpName + ' 자동생성 그룹',
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
          attachGrpName: props.grpName,
          fileName:     file.name,
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
<div class="comn-attach-grp">
  <input ref="fileInputRef" type="file" :accept="acceptAttr" multiple style="display:none;" @change="onFileChange" />

  <!-- 파일 목록 -->
  <div v-if="files.length" class="comn-attach-list">
    <div v-for="f in files" :key="f.attachId" class="comn-attach-item">
      <span class="comn-attach-icon">{{ extIcon(f.fileExt) }}</span>
      <span class="comn-attach-name" :title="f.fileName">{{ f.fileName }}</span>
      <span class="comn-attach-size">{{ fmtSize(f.fileSize) }}</span>
      <button class="comn-attach-del" @click.stop="removeFile(f.attachId)" title="삭제">✕</button>
    </div>
  </div>
  <div v-else class="comn-attach-empty">첨부된 파일이 없습니다.</div>

  <!-- 첨부 버튼 -->
  <div class="comn-attach-footer">
    <button class="btn btn-secondary btn-sm" @click="openPicker" type="button">
      📎 파일첨부
    </button>
    <span class="comn-attach-info">{{ files.length }} / {{ maxCount }}개 &nbsp;|&nbsp; 최대 {{ maxSizeMb }}MB<span v-if="allowExt!=='*'"> &nbsp;|&nbsp; {{ allowExt }}</span></span>
  </div>
</div>
`
};

/* ── ComnComp 레지스트리 ── */
window.ComnComp = {
  'attach_grp': window.ComnAttachGrp,
};
