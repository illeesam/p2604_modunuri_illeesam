/* ShopJoy Admin - 전시UI 상세/등록 (탭 + 우측 미리보기) */
window.EcDispUiDtl = {
  name: 'EcDispUiDtl',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;

    const UI_TYPE_OPTS = [
      { value: '',       label: '-' },
      { value: 'FRONT',  label: '프론트' },
      { value: 'ADMIN',  label: '관리자' },
      { value: 'MOBILE', label: '모바일' },
      { value: 'KIOSK',  label: '키오스크' },
    ];

    const isNew = computed(() => !props.editId);

    const form = reactive({
      codeId: null, codeGrp: 'DISP_UI',
      codeValue: '', codeLabel: '',
      uiType: 'FRONT',
      remark: '', sortOrd: 1, useYn: 'Y', regDate: '',
    });

    const errors = reactive({});
    const schema = yup.object({
      codeValue: yup.string().required('UI코드를 입력해주세요.'),
      codeLabel: yup.string().required('UI명을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const u = (props.dispDataset.codes || []).find(c => c.codeId === props.editId && c.codeGrp === 'DISP_UI');
        if (u) {
          Object.assign(form, {
            codeId: u.codeId, codeGrp: u.codeGrp,
            codeValue: u.codeValue || '', codeLabel: u.codeLabel || '',
            uiType: u.uiType || 'FRONT',
            remark: u.remark || '', sortOrd: u.sortOrd || 0, useYn: u.useYn || 'Y',
            regDate: u.regDate || '',
          });
        }
      } else {
        const uis = (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_UI');
        form.sortOrd = uis.length ? Math.max(...uis.map(c => c.sortOrd || 0)) + 1 : 1;
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.regDate = `${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}`;
        /* 자동 코드: DU_YYMMDD_HHMMSS */
        form.codeValue = `DU_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
    });

    const relatedAreas = computed(() =>
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.uiCode === form.codeValue)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    const activeTab = ref('base');
    const selectTab = (k) => { activeTab.value = k; };
    const activeArea = computed(() => {
      if (!activeTab.value.startsWith('area_')) return null;
      const id = Number(activeTab.value.replace('area_', ''));
      return relatedAreas.value.find(a => a.codeId === id) || null;
    });

    /* 패널(displays) 조회 헬퍼 */
    const panelsOfArea = (areaCode) =>
      (props.dispDataset.displays || [])
        .filter(p => p.area === areaCode)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    /* 디바이스 모드 + 스플리터 */
    const previewMode = ref('default');
    const PREVIEW_MODES = [
      { value: 'default', label: '기본',   width: 480  },
      { value: 'pc',      label: 'PC',     width: 1200 },
      { value: 'tablet',  label: '태블릿', width: 768  },
      { value: 'mobile',  label: '모바일', width: 375  },
    ];
    const previewFrameWidth = computed(() => {
      const m = PREVIEW_MODES.find(x => x.value === previewMode.value);
      return (m?.width || 480) + 'px';
    });
    const previewPaneWidth = ref(520);
    Vue.watch(previewMode, (m) => {
      const info = PREVIEW_MODES.find(x => x.value === m);
      previewPaneWidth.value = (info?.width || 480) + 40;
    });
    const onSplitDrag = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = previewPaneWidth.value;
      const onMove = (ev) => {
        previewPaneWidth.value = Math.max(260, Math.min(1600, startW + (startX - ev.clientX)));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    const expanded = ref(false);

    /* 영역 선택 팝업 */
    const pickOpen = ref(false);
    const pickKw   = ref('');
    const pickSel  = ref(new Set());
    const availableAreas = computed(() => {
      const all = (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_AREA');
      const kw  = pickKw.value.trim().toLowerCase();
      return all.filter(a => {
        if (a.uiCode === form.codeValue) return false;
        if (kw && !(a.codeLabel||'').toLowerCase().includes(kw) && !(a.codeValue||'').toLowerCase().includes(kw)) return false;
        return true;
      }).sort((a, b) => (a.codeLabel||'').localeCompare(b.codeLabel||''));
    });
    const openPick  = () => { pickOpen.value = true; pickKw.value = ''; pickSel.value = new Set(); };
    const closePick = () => { pickOpen.value = false; };
    const togglePick = (id) => {
      const s = new Set(pickSel.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      pickSel.value = s;
    };
    const confirmPick = () => {
      const ids = Array.from(pickSel.value);
      if (!ids.length) { closePick(); return; }
      if (!form.codeValue) { props.showToast && props.showToast('UI코드를 먼저 입력하세요.', 'error'); return; }
      const codes = props.dispDataset.codes || [];
      ids.forEach(id => {
        const a = codes.find(x => x.codeId === id);
        if (a) a.uiCode = form.codeValue;
      });
      props.showToast && props.showToast(`${ids.length}개 영역을 추가했습니다.`, 'info');
      closePick();
    };
    const removeArea = (a) => {
      props.showConfirm && props.showConfirm({
        title: 'UI에서 제거',
        message: `[${a.codeLabel}] 영역을 이 UI에서 제거하시겠습니까?`,
        onOk: () => {
          a.uiCode = '';
          props.showToast && props.showToast('제거되었습니다.', 'info');
        },
      });
    };

    /* 미리보기 액션 */
    const openUiPreview = () => {
      if (!form.codeValue) return props.showToast && props.showToast('UI코드를 먼저 입력하세요.', 'error');
      window.open(`${window.pageUrl('index.html')}`, '_blank', 'width=1280,height=900');
    };
    const openAreaPreview = () => {
      if (!activeArea.value) return props.showToast && props.showToast('미리볼 영역을 선택하세요.', 'error');
      window.open(`${window.pageUrl('disp-ui.html')}?areas=${activeArea.value.codeValue}&date=${form.regDate}&time=00:00`,
        '_blank', 'width=1280,height=900');
    };

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      form.codeValue = (form.codeValue || '').toUpperCase();
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        (err.inner || []).forEach(e => { errors[e.path] = e.message; });
        props.showToast && props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (!/^[A-Z0-9_]+$/.test(form.codeValue || '')) {
        errors.codeValue = '영문 대문자·숫자·_ 만 가능합니다.';
        props.showToast && props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: isNew.value ? 'disp-uis' : `disp-uis/${form.codeId}`,
        data: { ...form },
        confirmTitle: '저장',
        confirmMsg: isNew.value ? '신규 UI를 등록하시겠습니까?' : 'UI 정보를 수정하시겠습니까?',
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: '저장되었습니다.',
        onLocal: () => {
          const codes = props.dispDataset.codes;
          if (isNew.value) {
            const nextId = window.adminData.nextId(codes, 'codeId');
            codes.push({ ...form, codeId: nextId });
          } else {
            const idx = codes.findIndex(c => c.codeId === form.codeId);
            if (idx !== -1) Object.assign(codes[idx], form);
          }
        },
        navigate: props.navigate, navigateTo: 'ecDispUiMng',
      });
    };
    const doCancel = () => { props.navigate('ecDispUiMng'); };

    return {
      form, errors, isNew, UI_TYPE_OPTS,
      save, doCancel, relatedAreas, panelsOfArea,
      activeTab, selectTab, activeArea, expanded,
      previewMode, PREVIEW_MODES, previewFrameWidth, previewPaneWidth, onSplitDrag,
      pickOpen, pickKw, pickSel, availableAreas, openPick, closePick, togglePick, confirmPick, removeArea,
      openUiPreview, openAreaPreview,
    };
  },
  template: /* html */`
<div class="card" style="padding:0;overflow:hidden;">
  <!-- 헤더 -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;background:#fafafa;">
    <div style="font-size:16px;font-weight:700;color:#222;">
      전시 <span style="color:#e8587a;">UI</span> {{ isNew ? '등록' : '수정' }}
      <span v-if="!isNew" style="font-size:12px;color:#888;font-weight:400;margin-left:6px;">#{{ form.codeId }}</span>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <span style="font-size:12px;color:#888;margin-right:10px;">연결된 영역:
        <span style="background:#e3f2fd;color:#1565c0;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:4px;">{{ relatedAreas.length }}개</span>
      </span>
      <button class="btn btn-sm" style="background:#f5f0ff;border:1px solid #b39ddb;color:#6a1b9a;" @click="openUiPreview">🖼 UI미리보기</button>
      <button class="btn btn-sm" style="background:#e8f0fe;border:1px solid #b0c4de;color:#1a73e8;" @click="openAreaPreview">👁 영역미리보기</button>
      <button class="btn btn-secondary btn-sm" @click="expanded = !expanded">{{ expanded ? '📥 접기' : '📤 펼치기' }}</button>
    </div>
  </div>

  <!-- 본문 -->
  <div style="display:flex;min-height:520px;">
    <!-- 좌측 탭 -->
    <div style="width:160px;background:#f4f5f8;border-right:1px solid #e8ebef;padding:12px 8px;flex-shrink:0;">
      <div @click="selectTab('base')"
        :style="{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'9px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
          fontSize:'12px',fontWeight: activeTab==='base'?'700':'500',
          background: activeTab==='base' ? '#fff' : 'transparent',
          color: activeTab==='base' ? '#e8587a' : '#555',
          border: '1px solid '+(activeTab==='base' ? '#e8587a' : 'transparent'),
        }">
        <span>📋 UI <b>기본정보</b></span>
      </div>
      <div v-for="(a, i) in relatedAreas" :key="a.codeId"
        @click="selectTab('area_'+a.codeId)"
        :style="{
          padding:'8px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'4px',
          fontSize:'12px',
          background: activeTab==='area_'+a.codeId ? '#fff' : 'transparent',
          color: activeTab==='area_'+a.codeId ? '#1565c0' : '#666',
          border: '1px solid '+(activeTab==='area_'+a.codeId ? '#1565c0' : 'transparent'),
        }">
        영역 {{ i+1 }}. {{ a.codeLabel }}
      </div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
        <button @click="openPick"
          style="padding:7px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">
          ✚ 기존 영역 추가
        </button>
      </div>
    </div>

    <!-- 중앙 본문 -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">
      <div v-if="activeTab==='base'">
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">📋 기본정보</div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group">
            <label class="form-label">UI코드 <span style="color:#e57373;">*</span></label>
            <input class="form-control" v-model="form.codeValue"
              placeholder="FRONT_MAIN" style="text-transform:uppercase;font-family:monospace;"
              :class="{'is-invalid': errors.codeValue}" />
            <div v-if="errors.codeValue" class="field-error">{{ errors.codeValue }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">UI명 <span style="color:#e57373;">*</span></label>
            <input class="form-control" v-model="form.codeLabel" placeholder="프론트 메인" :class="{'is-invalid': errors.codeLabel}" />
            <div v-if="errors.codeLabel" class="field-error">{{ errors.codeLabel }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">UI유형</label>
            <select class="form-control" v-model="form.uiType">
              <option v-for="o in UI_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group">
            <label class="form-label">정렬 순서</label>
            <input class="form-control" type="number" v-model.number="form.sortOrd" />
          </div>
          <div class="form-group">
            <label class="form-label">사용 여부</label>
            <select class="form-control" v-model="form.useYn">
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </div>
          <div class="form-group" style="flex:2;">
            <label class="form-label">설명</label>
            <input class="form-control" v-model="form.remark" placeholder="UI 설명" />
          </div>
        </div>
        <div class="form-actions" style="margin-top:20px;">
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="doCancel">취소</button>
        </div>
      </div>
      <div v-else-if="activeArea">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <code style="font-size:11px;background:#f0f2f5;padding:2px 8px;border-radius:4px;">{{ activeArea.codeValue }}</code>
            <span style="font-size:15px;font-weight:700;color:#222;margin-left:8px;">{{ activeArea.codeLabel }}</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-blue btn-sm" @click="navigate('ecDispAreaMng')">영역 편집</button>
            <button class="btn btn-danger btn-sm" @click="removeArea(activeArea)">UI에서 제거</button>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;">
          <span><b style="color:#888;">유형:</b> {{ activeArea.areaType || '-' }}</span>
          <span><b style="color:#888;">표시:</b> {{ activeArea.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 '+(activeArea.gridCols||1)+'열' }}</span>
          <span><b style="color:#888;">순서:</b> {{ activeArea.sortOrd ?? '-' }}</span>
          <span><b style="color:#888;">포함 패널:</b> {{ panelsOfArea(activeArea.codeValue).length }}개</span>
          <span v-if="activeArea.remark" style="flex:1 1 100%;"><b style="color:#888;">설명:</b> {{ activeArea.remark }}</span>
        </div>
      </div>
    </div>

    <!-- 스플리터 -->
    <div @mousedown="onSplitDrag"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
      <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;"></div>
    </div>

    <!-- 우측 미리보기 -->
    <div :style="{
      width: previewPaneWidth + 'px',
      background:'#fafafa',borderLeft:'1px solid #e8ebef',padding:'14px',flexShrink:0,
      transition:'width .2s', overflowX:'auto',
    }">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:700;color:#555;">👁 {{ activeTab==='base' ? 'UI' : '영역' }} 미리보기</span>
        <span style="font-size:10px;color:#aaa;">{{ relatedAreas.length }}개 영역</span>
      </div>
      <!-- 디바이스 모드 -->
      <div style="display:flex;gap:4px;margin-bottom:10px;padding:3px;background:#eef0f3;border-radius:6px;">
        <button v-for="m in PREVIEW_MODES" :key="m.value"
          @click="previewMode = m.value"
          :style="{
            flex:'1',padding:'5px 0',fontSize:'11px',border:'none',borderRadius:'4px',cursor:'pointer',
            background: previewMode===m.value ? '#fff' : 'transparent',
            color: previewMode===m.value ? '#1565c0' : '#666',
            fontWeight: previewMode===m.value ? 700 : 500,
            boxShadow: previewMode===m.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }">{{ m.label }}</button>
      </div>
      <!-- 디바이스 프레임 -->
      <div :style="{
        width: previewFrameWidth, margin:'0 auto', border:'1px solid #d0d7de', borderRadius:'8px',
        background:'#fff', padding:'8px', transition:'width .2s',
      }">
        <!-- UI 기본정보: 모든 영역 렌더 -->
        <div v-if="activeTab==='base'" style="max-height:560px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
          <div v-if="!relatedAreas.length" style="padding:20px 8px;text-align:center;color:#bbb;font-size:11px;">
            연결된 영역이 없습니다.
          </div>
          <div v-for="a in relatedAreas" :key="a.codeId">
            <div style="font-size:10px;background:#222;color:#fff;padding:3px 8px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;">
              <code style="background:transparent;color:#fff;">{{ a.codeValue }}</code>
              <span>{{ a.codeLabel }} · {{ panelsOfArea(a.codeValue).length }}패널</span>
            </div>
            <div style="border:1px solid #222;border-top:none;border-radius:0 0 6px 6px;padding:4px;background:#fafafa;">
              <disp-x02-area
                :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
                :disp-dataset="dispDataset"
                :disp-opt="{ layout:'auto', showHeader:false, showBadges:false, mode:'area_detail', showDesc:false }"
                :area-item="{ code: a.codeValue, label: a.codeLabel, info: a, panels: panelsOfArea(a.codeValue) }" />
            </div>
          </div>
        </div>
        <!-- 영역 탭: 선택 영역만 렌더 -->
        <div v-else-if="activeArea" style="max-height:560px;overflow-y:auto;">
          <disp-x02-area
            :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
            :disp-dataset="dispDataset"
            :disp-opt="{ layout:'auto', showHeader:true, showBadges:false, mode:'area_detail', showDesc:false }"
            :area-item="{ code: activeArea.codeValue, label: activeArea.codeLabel, info: activeArea, panels: panelsOfArea(activeArea.codeValue) }" />
        </div>
      </div>
    </div>
  </div>

  <!-- 영역 선택 팝업 -->
  <div v-if="pickOpen" @click.self="closePick"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:12px;width:560px;max-width:94vw;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#fafafa;">
        <span style="font-size:14px;font-weight:700;color:#222;">기존 영역 추가</span>
        <button @click="closePick" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">✕</button>
      </div>
      <div style="padding:10px 18px;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;">
        <input v-model="pickKw" placeholder="영역명 / 영역코드 검색"
          style="flex:1;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;" />
        <span style="font-size:11px;color:#888;">선택: {{ pickSel.size }}개</span>
      </div>
      <div style="flex:1;overflow-y:auto;padding:10px 12px;">
        <div v-if="!availableAreas.length" style="padding:30px;text-align:center;color:#bbb;font-size:12px;">추가할 수 있는 영역이 없습니다.</div>
        <label v-for="a in availableAreas" :key="a.codeId"
          :style="{
            display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'6px',cursor:'pointer',marginBottom:'4px',
            background: pickSel.has(a.codeId) ? '#e3f2fd' : 'transparent',
            border: '1px solid '+(pickSel.has(a.codeId) ? '#90caf9' : '#eee'),
          }">
          <input type="checkbox" :checked="pickSel.has(a.codeId)" @change="togglePick(a.codeId)" />
          <span style="font-size:12px;font-weight:700;color:#222;flex:1;">{{ a.codeLabel }}</span>
          <code style="font-size:10px;background:#f0f2f5;color:#555;padding:1px 6px;border-radius:3px;">{{ a.codeValue }}</code>
          <span style="font-size:10px;color:#999;">{{ a.uiCode || '(미할당)' }}</span>
        </label>
      </div>
      <div style="padding:12px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:8px;background:#fafafa;">
        <button @click="closePick" class="btn btn-secondary btn-sm">취소</button>
        <button @click="confirmPick" class="btn btn-primary btn-sm" :disabled="!pickSel.size">
          선택한 {{ pickSel.size }}개 추가
        </button>
      </div>
    </div>
  </div>
</div>
  `,
};
