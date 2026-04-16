/* ShopJoy Admin - 전시영역 상세/등록 (탭 구성) */
window.EcDispAreaDtl = {
  name: 'EcDispAreaDtl',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes'],
  setup(props) {
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = Vue.reactive({ show: false, target: null });
    const openPathPick = (target) => { pathPickModal.target = target; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.target = null; };
    const onPathPicked = (pathId) => { if (pathPickModal.target === 'form') form.pathId = pathId; };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { reactive, computed, ref, onMounted } = Vue;

    const AREA_TYPE_OPTS = [
      { value: '',        label: '-' },
      { value: 'FULL',    label: '전체폭' },
      { value: 'SIDEBAR', label: '사이드바' },
      { value: 'POPUP',   label: '팝업' },
      { value: 'GRID',    label: '그리드' },
      { value: 'BANNER',  label: '배너' },
    ];
    const LAYOUT_TYPE_OPTS = [
      { value: 'grid',      label: '그리드' },
      { value: 'dashboard', label: '대시보드' },
    ];

    const isNew = computed(() => !props.editId);

    const form = reactive({
      codeId: null, codeGrp: 'DISP_AREA',
      codeValue: '', codeLabel: '', areaType: '',
      layoutType: 'grid', gridCols: 1,
      titleYn: 'N', title: '',
      remark: '', sortOrd: 1, useYn: 'Y', regDate: '', displayPath: '', pathId: null,
    });

    const errors = reactive({});
    const schema = yup.object({
      codeValue: yup.string().required('영역코드를 입력해주세요.'),
      codeLabel: yup.string().required('영역명을 입력해주세요.'),
    });

    /* ── 로드 ── */
    onMounted(() => {
      if (!isNew.value) {
        const a = (props.dispDataset.codes || []).find(c => c.codeId === props.editId && c.codeGrp === 'DISP_AREA');
        if (a) {
          Object.assign(form, {
            codeId: a.codeId, codeGrp: a.codeGrp,
            codeValue: a.codeValue || '', codeLabel: a.codeLabel || '',
            areaType: a.areaType || '', layoutType: a.layoutType || 'grid',
            gridCols: a.gridCols || 1, titleYn: a.titleYn || 'N', title: a.title || '',
            remark: a.remark || '', sortOrd: a.sortOrd || 0, useYn: a.useYn || 'Y',
            regDate: a.regDate || '', displayPath: a.displayPath || '', pathId: a.pathId == null ? null : a.pathId,
          });
        }
      } else {
        const areas = (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_AREA');
        form.sortOrd = areas.length ? Math.max(...areas.map(c => c.sortOrd || 0)) + 1 : 1;
        const t = new Date();
        const p = n => String(n).padStart(2, '0');
        form.regDate = `${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}`;
        /* 자동 코드: DA_YYMMDD_HHMMSS */
        form.codeValue = `DA_${String(t.getFullYear()).slice(2)}${p(t.getMonth()+1)}${p(t.getDate())}_${p(t.getHours())}${p(t.getMinutes())}${p(t.getSeconds())}`;
      }
    });

    /* ── 연결된 패널 ── */
    const relatedPanels = computed(() =>
      (props.dispDataset.displays || [])
        .filter(p => p.area === form.codeValue)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* ── 패널 선택 팝업 ── */
    const pickOpen = ref(false);
    const pickKw   = ref('');
    const pickSel  = ref(new Set());
    const availablePanels = computed(() => {
      const all = (props.dispDataset.displays || []);
      const kw  = pickKw.value.trim().toLowerCase();
      return all.filter(p => {
        if (p.area === form.codeValue) return false; /* 이미 포함된 것 제외 */
        if (kw && !p.name.toLowerCase().includes(kw) && !(p.area||'').toLowerCase().includes(kw)) return false;
        return true;
      }).sort((a, b) => (a.name||'').localeCompare(b.name||''));
    });
    const openPick  = () => { pickOpen.value = true; pickKw.value = ''; pickSel.value = new Set(); };
    const movePanel = (idx, dir) => {
      const arr = relatedPanels.value;
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return;
      const a = arr[idx], b = arr[target];
      const tmp = a.sortOrder; a.sortOrder = b.sortOrder; b.sortOrder = tmp;
      props.showToast && props.showToast(`[${a.name}] 순서가 ${dir < 0 ? '위로' : '아래로'} 이동되었습니다.`, 'info');
    };
    const onPanelPicked = (p) => {
      if (!form.codeValue) { props.showToast && props.showToast('영역코드를 먼저 입력하세요.', 'error'); return; }
      p.area = form.codeValue;
      const list = (props.dispDataset.displays || []).filter(x => x.area === form.codeValue);
      list.forEach((x, i) => { x.sortOrder = i + 1; });
      props.showToast && props.showToast(`[${p.name}] 패널을 추가했습니다.`, 'info');
      pickOpen.value = false;
    };
    const closePick = () => { pickOpen.value = false; };
    const togglePick = (id) => {
      const s = new Set(pickSel.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      pickSel.value = s;
    };
    const confirmPick = () => {
      const ids = Array.from(pickSel.value);
      if (!ids.length) { closePick(); return; }
      if (!form.codeValue) { props.showToast && props.showToast('영역코드를 먼저 입력하세요.', 'error'); return; }
      const list = props.dispDataset.displays || [];
      ids.forEach(id => {
        const p = list.find(x => x.dispId === id);
        if (p) p.area = form.codeValue;
      });
      /* 순서 재부여 */
      list.filter(p => p.area === form.codeValue).forEach((p, i) => { p.sortOrder = i + 1; });
      props.showToast && props.showToast(`${ids.length}개 패널을 추가했습니다.`, 'info');
      closePick();
    };
    const removePanel = (p) => {
      props.showConfirm && props.showConfirm({
        title: '영역에서 제거',
        message: `[${p.name}]을 이 영역에서 제거하시겠습니까?`,
        onOk: () => {
          p.area = ''; /* 영역 연결 해제 */
          props.showToast && props.showToast('제거되었습니다.', 'info');
        },
      });
    };

    /* ── 탭 상태 ── */
    const activeTab = ref('base');          /* 'base' | 'panel_<dispId>' */
    const expanded  = ref(false);           /* 우측 미리보기 펼치기 */
    const previewMode = ref('default');     /* 'default' | 'pc' | 'tablet' | 'mobile' */
    const showComponentTooltip = ref(false);
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
    const selectTab = (key) => { activeTab.value = key; };
    const activePanel = computed(() => {
      if (!activeTab.value.startsWith('panel_')) return null;
      const id = Number(activeTab.value.replace('panel_', ''));
      return relatedPanels.value.find(p => p.dispId === id) || null;
    });

    /* ── 저장 ── */
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
        path: isNew.value ? 'disp-areas' : `disp-areas/${form.codeId}`,
        data: { ...form },
        confirmTitle: '저장',
        confirmMsg: isNew.value ? '신규 영역을 등록하시겠습니까?' : '영역 정보를 수정하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
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
        navigate: props.navigate,
        navigateTo: 'ecDispAreaMng',
      });
    };

    const doCancel = () => { props.navigate('ecDispAreaMng'); };

    /* ── 미리보기 액션 ── */
    const openPanelPreview = () => {
      if (!form.codeValue) return props.showToast && props.showToast('영역코드를 먼저 입력하세요.', 'error');
      const areaPageMap = {
        'HOME_BANNER':'', 'HOME_PRODUCT':'', 'HOME_CHART':'', 'HOME_EVENT':'',
        'PRODUCT_TOP':'#page=prod01list', 'PRODUCT_BTM':'#page=prod01list',
        'MY_PAGE':'#page=mypage', 'FOOTER':'',
      };
      const hash = areaPageMap[form.codeValue] || '';
      window.open(`${window.pageUrl('index.html')}${hash}`, '_blank', 'width=1280,height=900');
    };
    const openWidgetPreview = (scope) => {
      if (!activePanel.value) return props.showToast && props.showToast('미리볼 패널을 선택하세요.', 'error');
      const file = scope === 'admin' ? 'disp-admin-ui.html' : 'disp-front-ui.html';
      window.open(`${window.pageUrl(file)}?areas=${form.codeValue}&date=${form.regDate}&time=00:00`, '_blank', 'width=1280,height=900');
    };

    /* ── 패널 유형 레이블 / 위젯 요약 ── */
    const WIDGET_LABEL = {
      'image_banner':'이미지배너', 'product_slider':'상품슬라이더', 'product':'상품',
      'chart_bar':'차트', 'chart_line':'차트', 'chart_pie':'차트',
      'text_banner':'텍스트', 'info_card':'정보카드', 'popup':'팝업',
      'file':'파일', 'coupon':'쿠폰', 'html_editor':'HTML',
      'event_banner':'이벤트', 'cache_banner':'캐쉬', 'widget_embed':'위젯',
    };
    const wLabel = (t) => WIDGET_LABEL[t] || t || '-';

    const addPanelShortcut = () => {
      if (!form.codeId) return props.showToast && props.showToast('먼저 영역을 저장해주세요.', 'error');
      props.navigate('ecDispPanelDtl', { editId: null, preset: { area: form.codeValue } });
    };

    /* ── 공개 대상 (Area-Panel 매핑) ── */
    const visibilityOptions = computed(() => window.visibilityUtil.allOptions());
    const hasPanelVisibility = (code) => {
      if (!activePanel.value) return false;
      if (!activePanel.value.visibilityTargets) activePanel.value.visibilityTargets = '^PUBLIC^';
      return window.visibilityUtil.has(activePanel.value.visibilityTargets, code);
    };
    const togglePanelVisibility = (code) => {
      if (!activePanel.value) return;
      if (!activePanel.value.visibilityTargets) activePanel.value.visibilityTargets = '^PUBLIC^';
      const list = window.visibilityUtil.parse(activePanel.value.visibilityTargets);
      const i = list.indexOf(code);
      if (i >= 0) list.splice(i, 1); else list.push(code);
      if (code === 'PUBLIC' && i < 0) {
        activePanel.value.visibilityTargets = '^PUBLIC^';
        return;
      }
      const filtered = list.filter(c => c !== 'PUBLIC' || code === 'PUBLIC');
      activePanel.value.visibilityTargets = window.visibilityUtil.serialize(filtered);
    };

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      form, errors, isNew, AREA_TYPE_OPTS, LAYOUT_TYPE_OPTS,
      save, doCancel, relatedPanels,
      pickOpen, pickKw, pickSel, availablePanels, openPick, closePick, togglePick, confirmPick, removePanel, onPanelPicked, movePanel,
      activeTab, selectTab, activePanel, expanded,
      previewMode, PREVIEW_MODES, previewFrameWidth, previewPaneWidth, onSplitDrag, showComponentTooltip,
      openPanelPreview, openWidgetPreview, addPanelShortcut, wLabel,
      visibilityOptions, hasPanelVisibility, togglePanelVisibility,
    };
  },
  template: /* html */`
<div class="card" style="padding:0;overflow:hidden;">

  <!-- ── 헤더: 타이틀 + 우측 액션 ── -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;background:#fafafa;">
    <div style="font-size:16px;font-weight:700;color:#222;">
      전시 <span style="color:#e8587a;">영역</span> {{ isNew ? '등록' : '수정' }}
      <span v-if="!isNew" style="font-size:12px;color:#888;font-weight:400;margin-left:6px;">#{{ form.codeId }}</span>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="btn btn-sm" :disabled="isNew"
        :style="isNew ? 'background:#f5f5f5;border:1px solid #ddd;color:#bbb;cursor:not-allowed;' : 'background:#e3f2fd;border:1px solid #90caf9;color:#1565c0;font-weight:600;'"
        :title="isNew ? '저장 후 패널을 추가할 수 있습니다.' : ''"
        @click="!isNew && openPick()">
        ✚ 전시패널추가
      </button>
      <span style="font-size:12px;color:#888;margin-right:10px;">연결된 패널:
        <span style="background:#e3f2fd;color:#1565c0;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:4px;">{{ relatedPanels.length }}개</span>
      </span>
      <button class="btn btn-sm" style="background:#f5f0ff;border:1px solid #b39ddb;color:#6a1b9a;" @click="openPanelPreview">🖼 패널미리보기</button>
      <button class="btn btn-sm" style="background:#e0f2fe;border:1px solid #bae6fd;color:#0369a1;" @click="openWidgetPreview('front')">👁 사용자 미리보기</button>
      <button class="btn btn-sm" style="background:#fef3eb;border:1px solid #f5e8de;color:#c2410c;" @click="openWidgetPreview('admin')">👁 관리자 미리보기</button>
      <button class="btn btn-secondary btn-sm" @click="expanded = !expanded">{{ expanded ? '📥 접기' : '📤 펼치기' }}</button>
      <button class="btn btn-primary btn-sm" @click="save" style="font-weight:700;">💾 저장</button>
    </div>
  </div>

  <!-- ── 본문: 좌측 탭사이드 + 중앙 폼 + 우측 미리보기 ── -->
  <div style="display:flex;min-height:500px;">

    <!-- 좌측 탭사이드 -->
    <div style="width:140px;background:#f4f5f8;border-right:1px solid #e8ebef;padding:12px 8px;flex-shrink:0;">
      <!-- 기본정보 탭 -->
      <div @click="selectTab('base')"
        :style="{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'9px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'6px',
          fontSize:'12px',fontWeight: activeTab==='base'?'700':'500',
          background: activeTab==='base' ? '#fff' : 'transparent',
          color: activeTab==='base' ? '#e8587a' : '#555',
          border: '1px solid '+(activeTab==='base' ? '#e8587a' : 'transparent'),
        }">
        <span>📋 영역 <b>기본정보</b></span>
        <span v-if="activeTab==='base'" style="font-size:10px;">👁</span>
      </div>
      <!-- 패널 리스트 -->
      <div v-for="(p, i) in relatedPanels" :key="p.dispId"
        @click="selectTab('panel_'+p.dispId)"
        :style="{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'8px 12px',borderRadius:'8px',cursor:'pointer',marginBottom:'4px',
          fontSize:'12px',
          background: activeTab==='panel_'+p.dispId ? '#fff' : 'transparent',
          color: activeTab==='panel_'+p.dispId ? '#1565c0' : '#666',
          border: '1px solid '+(activeTab==='panel_'+p.dispId ? '#1565c0' : 'transparent'),
        }">
        <span>패널 {{ i+1 }}</span>
        <span style="display:flex;gap:4px;align-items:center;">
          <span :style="'width:6px;height:6px;border-radius:50%;background:'+(p.status==='활성'?'#43a047':'#ccc')+';'"></span>
          <template v-if="activeTab==='panel_'+p.dispId">
            <button @click.stop="movePanel(i, -1)" :disabled="i===0" title="위로"
              style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="i===0?'opacity:0.3;cursor:default;':''">▲</button>
            <button @click.stop="movePanel(i, 1)" :disabled="i===relatedPanels.length-1" title="아래로"
              style="font-size:9px;border:1px solid #e0e0e0;border-radius:3px;background:#fff;cursor:pointer;padding:1px 4px;line-height:1.2;color:#888;"
              :style="i===relatedPanels.length-1?'opacity:0.3;cursor:default;':''">▼</button>
          </template>
        </span>
      </div>
      <!-- 기존 패널 추가 + 신규 생성 -->
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
        <button @click="!isNew && openPick()" :disabled="isNew"
          :title="isNew ? '저장 후 패널을 추가할 수 있습니다.' : ''"
          :style="isNew ? 'padding:7px;border:1px solid #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:8px;font-size:11px;font-weight:600;cursor:not-allowed;' : 'padding:7px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;'">
          ✚ 기존 패널 추가
        </button>
        <button @click="!isNew && addPanelShortcut()" :disabled="isNew"
          :title="isNew ? '저장 후 신규 패널을 추가할 수 있습니다.' : ''"
          :style="isNew ? 'padding:7px;border:1px dashed #e0e0e0;background:#f5f5f5;color:#bbb;border-radius:8px;font-size:11px;cursor:not-allowed;' : 'padding:7px;border:1px dashed #ccc;background:#fff;color:#888;border-radius:8px;font-size:11px;cursor:pointer;'">
          + 신규 패널
        </button>
      </div>
    </div>

    <!-- 중앙 폼 -->
    <div style="flex:1;padding:20px;min-width:0;overflow-y:auto;">

      <!-- ── 기본정보 탭 ── -->
      <div v-if="activeTab==='base'">
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">📋 기본정보</div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group">
            <label class="form-label">영역코드 <span style="color:#e57373;">*</span></label>
            <input class="form-control" v-model="form.codeValue"
              placeholder="HOME_BANNER" style="text-transform:uppercase;font-family:monospace;"
              :class="{'is-invalid': errors.codeValue}" />
            <div v-if="errors.codeValue" class="field-error">{{ errors.codeValue }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">영역명 <span style="color:#e57373;">*</span></label>
            <input class="form-control" v-model="form.codeLabel"
              placeholder="홈 메인배너" :class="{'is-invalid': errors.codeLabel}" />
            <div v-if="errors.codeLabel" class="field-error">{{ errors.codeLabel }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">영역유형</label>
            <select class="form-control" v-model="form.areaType">
              <option v-for="o in AREA_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group" style="grid-column:1 / -1;">
            <label class="form-label">표시경로 <span style="font-size:10px;font-weight:400;color:#aaa;">영역이 노출되는 경로 (예: FRONT.모바일메인)</span></label>
            <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:form.pathId!=null?'#374151':'#9ca3af',fontWeight:form.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
            <span style="flex:1;">{{ pathLabel(form.pathId) || '경로 선택...' }}</span>
            <button type="button" @click="openPathPick('form')" title="표시경로 선택"
              :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}"
              @mouseover="$event.currentTarget.style.background='#eef2ff'"
              @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
          </div>
          </div>
        </div>

        <div style="font-size:12px;font-weight:700;color:#888;margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">🎨 표시방식</div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group">
            <label class="form-label">표시방식</label>
            <select class="form-control" v-model="form.layoutType">
              <option v-for="o in LAYOUT_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <div class="form-group" v-if="form.layoutType==='grid'">
            <label class="form-label">열수</label>
            <input class="form-control" type="number" v-model.number="form.gridCols" min="1" max="32" />
          </div>
          <div class="form-group">
            <label class="form-label">타이틀 표시</label>
            <select class="form-control" v-model="form.titleYn">
              <option value="Y">표시</option>
              <option value="N">미표시</option>
            </select>
          </div>
          <div class="form-group" v-if="form.titleYn==='Y'">
            <label class="form-label">타이틀 텍스트</label>
            <input class="form-control" v-model="form.title" placeholder="타이틀 텍스트" />
          </div>
        </div>

        <div style="font-size:12px;font-weight:700;color:#888;margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">⚙ 기타 설정</div>
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
            <input class="form-control" v-model="form.remark" placeholder="영역 설명" />
          </div>
        </div>

      </div>

      <!-- ── 패널 탭 ── -->
      <div v-else-if="activePanel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <span style="font-size:11px;color:#888;">#{{ activePanel.dispId }}</span>
            <span style="font-size:15px;font-weight:700;color:#222;margin-left:8px;">{{ activePanel.name }}</span>
            <span class="badge" :class="activePanel.status==='활성'?'badge-green':'badge-gray'" style="font-size:11px;margin-left:8px;">{{ activePanel.status }}</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-blue btn-sm" @click="navigate('ecDispPanelDtl', { editId: activePanel.dispId })">패널 편집</button>
            <button class="btn btn-danger btn-sm" @click="removePanel(activePanel)">영역에서 제거</button>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;margin-bottom:16px;">
          <span><b style="color:#888;">표시:</b> {{ activePanel.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 '+(activePanel.gridCols||1)+'열' }}</span>
          <span><b style="color:#888;">순서:</b> {{ activePanel.sortOrder ?? '-' }}</span>
          <span><b style="color:#888;">노출조건:</b> {{ activePanel.condition || '항상 표시' }}</span>
          <span v-if="activePanel.authRequired"><b style="color:#888;">인증:</b> 필요</span>
          <span><b style="color:#888;">전시기간:</b>
            <template v-if="activePanel.dispStartDate || activePanel.dispEndDate">
              {{ activePanel.dispStartDate || '∞' }} ~ {{ activePanel.dispEndDate || '∞' }}
            </template>
            <span v-else style="color:#ccc;">없음</span>
          </span>
        </div>
        <!-- 공개 대상 -->
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">
            🔒 공개 대상 (하나라도 해당하면 노출)
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <label v-for="opt in visibilityOptions" :key="opt.codeValue"
              :style="{
                display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'16px',
                border:'1px solid '+(hasPanelVisibility(opt.codeValue)?'#1565c0':'#ddd'),
                background:hasPanelVisibility(opt.codeValue)?'#e3f2fd':'#fafafa',
                color:hasPanelVisibility(opt.codeValue)?'#1565c0':'#666',
                fontSize:'12px',fontWeight:hasPanelVisibility(opt.codeValue)?700:500,
                cursor:'pointer',
              }">
              <input type="checkbox" :checked="hasPanelVisibility(opt.codeValue)"
                @change="togglePanelVisibility(opt.codeValue)"
                style="accent-color:#1565c0;" />
              {{ opt.codeLabel }}
            </label>
          </div>
          <div v-if="!activePanel.visibilityTargets" style="font-size:11px;color:#d32f2f;">⚠ 선택 없음 — 아무에게도 노출되지 않습니다.</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px;">▸ 위젯 구성 ({{ (activePanel.rows||[]).length }}개)</div>
        <div v-if="(activePanel.rows||[]).length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;">
          <div v-for="(w, wi) in activePanel.rows" :key="wi"
            style="padding:10px 12px;border:1px solid #e0e4ea;border-radius:8px;background:#fafbfc;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:11px;color:#aaa;">#{{ w.sortOrder || (wi+1) }}</span>
              <span style="background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:1px 8px;font-size:10px;">{{ wLabel(w.widgetType) }}</span>
            </div>
            <div style="font-size:12px;color:#333;font-weight:600;">{{ w.widgetNm || ('위젯 '+(wi+1)) }}</div>
            <div v-if="w.clickAction && w.clickAction!=='none'" style="font-size:10px;color:#888;margin-top:2px;">클릭: {{ w.clickAction }}</div>
          </div>
        </div>
        <div v-else style="padding:16px;text-align:center;color:#bbb;font-size:12px;border:1px dashed #e0e4ea;border-radius:8px;">
          등록된 위젯이 없습니다.
        </div>
      </div>
    </div>

    <!-- 스플리터 -->
    <div @mousedown="onSplitDrag"
      style="width:6px;cursor:col-resize;background:#e8e8e8;flex-shrink:0;position:relative;"
      title="드래그로 폭 조절">
      <div style="position:absolute;top:50%;left:1px;transform:translateY(-50%);width:4px;height:32px;background:#bbb;border-radius:2px;"></div>
    </div>
    <!-- 우측 영역미리보기 -->
    <div :style="{
      width: previewPaneWidth + 'px',
      background:'#fafafa',borderLeft:'1px solid #e8ebef',padding:'14px',flexShrink:0,
      transition:'width .2s',
      overflowX:'auto',
    }">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:700;color:#555;cursor:help;position:relative;"
          @mouseenter="showComponentTooltip=true" @mouseleave="showComponentTooltip=false">
          👁 {{ activeTab==='base' ? '영역' : '패널' }} 미리보기
          <span style="position:absolute;bottom:-28px;left:0;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:9px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;" :style="{opacity: showComponentTooltip ? 1 : 0}">
            {{ activeTab==='base' ? '&lt;disp-x02-area /&gt;' : '&lt;disp-x03-panel /&gt;' }}
          </span>
        </span>
        <span style="font-size:10px;color:#aaa;">{{ relatedPanels.length }}개 패널</span>
      </div>
      <!-- 디바이스 모드 버튼 -->
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
      <!-- 영역 기본정보 탭: disp-x02-area 로 전체 영역 렌더 -->
      <div v-if="activeTab==='base'" style="max-height:560px;overflow-y:auto;">
        <disp-x02-area v-if="form.codeValue"
          :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
          :disp-dataset="dispDataset"
          :disp-opt="{ layout:'auto', showHeader:true, showBadges:false, mode:'area_detail', showDesc:false }"
          :area-item="{ code: form.codeValue, label: form.codeLabel, info: form, panels: relatedPanels }" />
        <div v-else style="padding:20px 8px;text-align:center;color:#bbb;font-size:11px;">
          영역코드를 입력하세요.
        </div>
      </div>
      <!-- 패널 탭: disp-x03-panel 로 선택 패널 렌더 -->
      <div v-else-if="activePanel" style="max-height:560px;overflow-y:auto;">
        <disp-x03-panel
          :params="{ date: form.regDate || '', time: '00:00', status: '활성' }"
          :disp-dataset="dispDataset"
          :disp-opt="{ layout:'vertical', showBadges:false }"
          :panel-item="activePanel"
          :show-header="true" />
      </div>
      <div v-else style="padding:20px 8px;text-align:center;color:#bbb;font-size:11px;">
        미리볼 항목을 선택하세요.
      </div>
      </div><!-- /device frame -->
    </div>
  </div>

  <!-- 패널 선택 팝업 -->
  <panel-pick-modal v-if="pickOpen"
    :title="'전시패널 추가 [' + form.codeValue + ']'"
    :displays="dispDataset.displays || []"
    :areas="(dispDataset.codes||[]).filter(c => c.codeGrp==='DISP_AREA')"
    :exclude-area="form.codeValue"
    @close="closePick"
    @pick="onPanelPicked" />

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="ec_disp_area"
    :value="form.pathId" title="영역 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
  `,
};
