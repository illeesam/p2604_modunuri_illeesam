/* ShopJoy - Sample07: Postman-style API Tester  (데이터: api/xs/sample07.json) */
window.XsSample07 = {
  name: 'XsSample07',
  setup() {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    /* ===== Tree (JSON 로딩) ===== */
    const treeRoot   = reactive([]);
    const treeLoaded = ref(false);

    const makeNode = n => {
      const node = reactive({
        id: n.id, appId: n.appId || '', label: n.label, type: n.type,
        open: n.open ?? false,
        method: n.method || '', url: n.url || '', desc: n.desc || '',
        params: (n.params || []).map(p => ({ ...p })),
        body: n.body || '',
      });
      if (n.children) node.children = n.children.map(makeNode);
      return node;
    };

    /* 직계 부모 label 탐색 */
    const findParentLabel = (nodes, targetId) => {
      for (const n of nodes) {
        if (n.children) {
          if (n.children.some(c => c.id === targetId)) return n.label;
          const r = findParentLabel(n.children, targetId);
          if (r !== null) return r;
        }
      }
      return null;
    };

    /* ===== Auto CRUD 트리 생성 ===== */
    const AUTO_CRUD_DOMAINS = [
      { domain:'ec', sub:'cm', label:'EC CM', tables:['cm_bltn_cate','cm_bltn_file','cm_bltn_good','cm_bltn_reply','cm_bltn_tag','cm_bltn','cm_chatt_msg','cm_chatt_room','cm_path','cmh_push_log'] },
      { domain:'ec', sub:'dp', label:'EC DP', tables:['dp_area_panel','dp_area','dp_panel_item','dp_panel','dp_ui_area','dp_ui','dp_widget_lib','dp_widget'] },
      { domain:'ec', sub:'mb', label:'EC MB', tables:['mb_dvc_token','mb_like','mb_member_addr','mb_member_grade','mb_member_group','mb_member','mb_sns_member','mbh_member_login_hist','mbh_member_login_log','mbh_member_token_log'] },
      { domain:'ec', sub:'od', label:'EC OD', tables:['od_cart','od_claim_item','od_claim','od_dliv_item','od_dliv','od_order_discnt','od_order_item_discnt','od_order_item','od_order','od_pay_method','od_pay','od_refund_method','od_refund','odh_claim_chg_hist','odh_claim_item_chg_hist','odh_claim_item_status_hist','odh_claim_status_hist','odh_dliv_chg_hist','odh_dliv_item_chg_hist','odh_dliv_status_hist','odh_order_chg_hist','odh_order_item_chg_hist','odh_order_item_status_hist','odh_order_status_hist','odh_pay_chg_hist','odh_pay_status_hist'] },
      { domain:'ec', sub:'pd', label:'EC PD', tables:['pd_category_prod','pd_category','pd_dliv_tmplt','pd_prod_bundle_item','pd_prod_content','pd_prod_img','pd_prod_opt_item','pd_prod_opt','pd_prod_qna','pd_prod_rel','pd_prod_set_item','pd_prod_sku','pd_prod_tag','pd_prod','pd_restock_noti','pd_review_attach','pd_review_comment','pd_review','pd_tag','pdh_prod_chg_hist','pdh_prod_content_chg_hist','pdh_prod_sku_chg_hist','pdh_prod_sku_price_hist','pdh_prod_sku_stock_hist','pdh_prod_status_hist','pdh_prod_view_log'] },
      { domain:'ec', sub:'pm', label:'EC PM', tables:['pm_cache','pm_coupon_issue','pm_coupon_item','pm_coupon_usage','pm_coupon','pm_discnt_item','pm_discnt_usage','pm_discnt','pm_event_benefit','pm_event_item','pm_event','pm_gift_cond','pm_gift_issue','pm_gift','pm_plan_item','pm_plan','pm_save_issue','pm_save_usage','pm_save','pm_voucher_issue','pm_voucher'] },
      { domain:'ec', sub:'st', label:'EC ST', tables:['st_erp_voucher_line','st_erp_voucher','st_recon','st_settle_adj','st_settle_close','st_settle_config','st_settle_etc_adj','st_settle_item','st_settle_pay','st_settle_raw','st_settle'] },
      { domain:'sy', sub:'sy', label:'SY',    tables:['sy_alarm','sy_attach_grp','sy_attach','sy_batch','sy_bbm','sy_bbs','sy_brand','sy_code_grp','sy_code','sy_contact','sy_dept','sy_i18n_msg','sy_i18n','sy_menu','sy_notice','sy_path','sy_prop','sy_role_menu','sy_role','sy_site','sy_template','sy_user_role','sy_user','sy_vendor_brand','sy_vendor_content','sy_vendor_user','sy_vendor','sy_voc','syh_alarm_send_hist','syh_api_log','syh_batch_hist','syh_batch_log','syh_send_email_log','syh_send_msg_log','syh_user_login_hist','syh_user_login_log','syh_user_token_log'] },
    ];
    const CRUD_OPS = [
      { label:'단건',    urlFn: p => `select${p}`,              method:'POST'   },
      { label:'목록',    urlFn: p => `select${p}List`,           method:'POST'   },
      { label:'페이지',  urlFn: p => `select${p}Page`,           method:'POST'   },
      { label:'건수',    urlFn: p => `select${p}Count`,          method:'POST'   },
      { label:'등록',    urlFn: p => `insert${p}Insert`,         method:'POST'   },
      { label:'수정',    urlFn: p => `update${p}Update`,         method:'PUT'    },
      { label:'부분수정',urlFn: p => `update${p}UpdateOption`,   method:'PUT'    },
      { label:'삭제',    urlFn: p => `delete${p}Delete`,         method:'DELETE' },
      { label:'일괄삭제',urlFn: p => `delete${p}DeleteList`,     method:'DELETE' },
    ];
    const REST_CRUD_OPS = [
      { label:'목록 조회',  urlFn: t => t,              method:'GET'    },
      { label:'페이지 조회',urlFn: t => `${t}/page`,    method:'GET'    },
      { label:'건수 조회',  urlFn: t => `${t}/count`,   method:'GET'    },
      { label:'단건 조회',  urlFn: t => `${t}/{id}`,    method:'GET'    },
      { label:'등록',       urlFn: t => t,              method:'POST'   },
      { label:'수정',       urlFn: t => `${t}/{id}`,    method:'PUT'    },
      { label:'부분수정',   urlFn: t => `${t}/{id}`,    method:'PATCH'  },
      { label:'삭제',       urlFn: t => `${t}/{id}`,    method:'DELETE' },
      { label:'일괄삭제',   urlFn: t => t,              method:'DELETE' },
    ];
    const toPascal = name => name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
    let _acSeq = 0;
    const buildAutoCrudNodes = () => makeNode({
      id: 'ac_root', appId: 'samples', label: 'adminAutoCrud-method', type: 'app', open: false,
      children: AUTO_CRUD_DOMAINS.map(({ domain, sub, label, tables }) => ({
        id: `ac_${domain}_${sub}`, label, type: 'folder', open: false,
        children: tables.map(tbl => {
          const pascal = toPascal(tbl);
          return {
            id: `ac_${tbl}`, label: tbl, type: 'folder', open: false,
            children: CRUD_OPS.map(op => ({
              id: `ac_${tbl}_${++_acSeq}`,
              label: `${op.label} (${op.method})`,
              type: 'req', method: op.method,
              url: `/auto/${domain}/${sub}/${op.urlFn(pascal)}`,
              desc: `${pascal} ${op.label}`,
              params: [], body: '',
            })),
          };
        }),
      })),
    });
    let _arSeq = 0;
    const buildAutoCrudRestNodes = () => makeNode({
      id: 'ar_root', appId: 'samples', label: 'adminAutoCrud-rest', type: 'app', open: false,
      children: AUTO_CRUD_DOMAINS.map(({ domain, sub, label, tables }) => ({
        id: `ar_${domain}_${sub}`, label, type: 'folder', open: false,
        children: tables.map(tbl => ({
          id: `ar_${tbl}`, label: tbl, type: 'folder', open: false,
          children: REST_CRUD_OPS.map(op => ({
            id: `ar_${tbl}_${++_arSeq}`,
            label: `${op.label} (${op.method})`,
            type: 'req', method: op.method,
            url: `/autoRest/${domain}/${sub}/${op.urlFn(tbl)}`,
            desc: `${tbl} ${op.label}`,
            params: [], body: '',
          })),
        })),
      })),
    });

    /* ===== App Filter ===== */
    const appFilter = reactive({ front: true, admin: true, samples: true });
    const APP_META  = {
      front:   { label: 'Front',   color: '#1a73e8' },
      admin:   { label: 'Admin',   color: '#e8587a' },
      samples: { label: 'Samples', color: '#34a853' },
    };

    /* ===== Tree Search & Flatten ===== */
    const treeSearch = ref('');
    const toggleNode = node => { if (node.type !== 'req') node.open = !node.open; };

    const flattenTree = (nodes, depth = 0) => {
      const result = [];
      const kw = treeSearch.value.toLowerCase();
      for (const n of nodes) {
        if (n.type === 'app' && !appFilter[n.appId]) continue;
        if (kw && n.type === 'req' && !n.label.toLowerCase().includes(kw) && !n.url.toLowerCase().includes(kw)) continue;
        result.push({ n, depth });
        if (n.type !== 'req' && (n.open || kw)) {
          flattenTree(n.children || [], depth + 1).forEach(x => result.push(x));
        }
      }
      return result;
    };
    const flatTree = computed(() => flattenTree(treeRoot));

    /* ===== Settings (localStorage 자동저장) ===== */
    const SETTINGS_KEY = 'sj_sample07_v2';
    const settingsOpen = ref(false);
    const hostUrl      = ref(window.location.origin);
    const token        = ref('');
    const defHeaders   = reactive([{ k: 'Content-Type', v: 'application/json' }, { k: '', v: '' }]);

    const saveSettings = () => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          hostUrl: hostUrl.value, token: token.value,
          defHeaders: defHeaders.filter(h => h.k.trim()),
        }));
      } catch {}
    };
    const loadSettings = () => {
      try {
        const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        if (s.hostUrl) hostUrl.value = s.hostUrl;
        if (s.token)   token.value   = s.token;
        if (s.defHeaders?.length) {
          defHeaders.splice(0);
          s.defHeaders.forEach(h => defHeaders.push({ ...h }));
          defHeaders.push({ k: '', v: '' });
        }
      } catch {}
    };
    watch([hostUrl, token, defHeaders], saveSettings, { deep: true });

    /* ===== LocalStorage Viewer ===== */
    const lsItems = reactive([]);
    const refreshLs = () => {
      lsItems.splice(0);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        lsItems.push({ k, v: String(localStorage.getItem(k)).substring(0, 100) });
      }
      if (!lsItems.length) lsItems.push({ k: '(비어 있음)', v: '-' });
    };

    /* ===== Tab System ===== */
    const openTabs    = reactive([]);
    const activeTabId = ref(null);
    let _tabSeq = 0;

    const activeTab = computed(() => openTabs.find(t => t.tabId === activeTabId.value) || null);

    const makeTab = (node) => {
      const parentLabel = findParentLabel(treeRoot, node.id) || '';
      const tabLabel    = [parentLabel, node.method, node.label].filter(Boolean).join(' · ');
      const shortLabel  = parentLabel ? `${parentLabel} · ${node.label}` : node.label;
      return reactive({
        tabId:      `t${++_tabSeq}`,
        nodeId:     node.id,
        tabLabel, shortLabel,
        method:     node.method,
        desc:       node.desc || '',
        reqMethod:  node.method,
        reqUrl:     node.url  || '',
        reqBody:    node.body || '',
        reqTab:     (['POST','PUT','PATCH'].includes(node.method) && node.body) ? 'body' : 'params',
        reqParams:  reactive([...(node.params||[]).map(p=>({...p})), {k:'',v:''}]),
        reqHeaders: reactive([{k:'',v:''}]),
        resTab:     'json',
        resJson:    '',
        resStatus:  null,
        resTime:    null,
        resData:    null,
        sending:    false,
        // 자동실행
        autoMs:     0,        // 0 = 없음
        autoLabel:  '',       // 표시용 "5초", "1분" 등
      });
    };

    const selectApiNode = node => {
      if (node.type !== 'req') return;
      const existing = openTabs.find(t => t.nodeId === node.id);
      if (existing) { activeTabId.value = existing.tabId; return; }
      const tab = makeTab(node);
      openTabs.push(tab);
      activeTabId.value = tab.tabId;
    };

    /* ===== 자동실행 타이머 관리 ===== */
    const _timers   = {};   // tabId → intervalId
    const _nextFire = {};   // tabId → 다음 실행 timestamp
    const countdown = reactive({});  // tabId → 남은 초 (화면 표시용)

    // 0.5초마다 카운트다운 갱신
    setInterval(() => {
      for (const tabId of Object.keys(_nextFire)) {
        countdown[tabId] = Math.max(0, Math.ceil((_nextFire[tabId] - Date.now()) / 1000));
      }
    }, 500);

    const stopAutoRun = (tabId) => {
      if (_timers[tabId]) { clearInterval(_timers[tabId]); delete _timers[tabId]; }
      delete _nextFire[tabId];
      delete countdown[tabId];
    };

    const startAutoRun = (tab, ms, label) => {
      stopAutoRun(tab.tabId);
      tab.autoMs    = ms;
      tab.autoLabel = label;
      if (!ms) return;
      _nextFire[tab.tabId] = Date.now() + ms;
      countdown[tab.tabId] = Math.ceil(ms / 1000);
      _timers[tab.tabId] = setInterval(() => {
        doSend(tab);
        _nextFire[tab.tabId] = Date.now() + ms;
      }, ms);
    };

    /* ===== 자동실행 팝업 ===== */
    const autoPopupTabId = ref(null);
    const autoPopupPos   = reactive({ top: 0, left: 0 });

    const SECS  = [1,2,3,4,5,6,7,10,15,20,30,50,60];
    const MINS  = [1,2,3,4,5,10,15,20,30];
    const HOURS = [1,2,3,4,6,12];
    const MAX_ROWS = Math.max(SECS.length, MINS.length, HOURS.length);
    // 행별 [초값, 분값, 시값] (없으면 null)
    const POPUP_ROWS = Array.from({ length: MAX_ROWS }, (_, i) => ({
      s: SECS[i]  != null ? SECS[i]  : null,
      m: MINS[i]  != null ? MINS[i]  : null,
      h: HOURS[i] != null ? HOURS[i] : null,
    }));

    const openAutoPopup = (tab, evt) => {
      evt.stopPropagation();
      // 이미 자동실행 중이면 토글(끄기)
      if (tab.autoMs) { startAutoRun(tab, 0, ''); return; }
      if (autoPopupTabId.value === tab.tabId) { autoPopupTabId.value = null; return; }
      const rect = evt.currentTarget.getBoundingClientRect();
      autoPopupPos.top  = rect.top;
      autoPopupPos.left = rect.right + 6;
      autoPopupTabId.value = tab.tabId;
    };
    const closeAutoPopup = () => { autoPopupTabId.value = null; };

    const selectAuto = (tab, ms, label) => {
      startAutoRun(tab, ms, label);
      autoPopupTabId.value = null;
    };

    const closeTab = (tabId, e) => {
      e?.stopPropagation();
      stopAutoRun(tabId);
      const idx = openTabs.findIndex(t => t.tabId === tabId);
      if (idx === -1) return;
      openTabs.splice(idx, 1);
      if (activeTabId.value === tabId) {
        const next = openTabs[idx] || openTabs[idx - 1];
        activeTabId.value = next ? next.tabId : null;
      }
      if (autoPopupTabId.value === tabId) autoPopupTabId.value = null;
    };

    const closeAllTabs = () => {
      openTabs.forEach(t => stopAutoRun(t.tabId));
      openTabs.splice(0);
      activeTabId.value = null;
      autoPopupTabId.value = null;
    };

    /* ===== Toast ===== */
    const TOAST_MS = 20000;
    const toasts   = reactive([]);
    let _toastSeq  = 0;
    const safeStr  = v => (v != null ? String(v) : '');

    const pushToast = ({ type, tabLabel, method, url, status, resJson }) => {
      const id  = ++_toastSeq;
      const t   = reactive({ id, seq: id, type, tabLabel, method, url, status, resJson, jsonOpen: false, progress: 100 });
      toasts.push(t);
      const startMs = Date.now();
      const tick = setInterval(() => {
        const elapsed = Date.now() - startMs;
        t.progress = Math.max(0, Math.round((1 - elapsed / TOAST_MS) * 100));
        if (elapsed >= TOAST_MS) {
          clearInterval(tick);
          const idx = toasts.findIndex(x => x.id === id);
          if (idx !== -1) toasts.splice(idx, 1);
        }
      }, 200);
      t._tick = tick;
    };
    const closeToast = (id) => {
      const idx = toasts.findIndex(x => x.id === id);
      if (idx !== -1) {
        clearInterval(toasts[idx]._tick);
        toasts.splice(idx, 1);
      }
    };

    /* ===== Send ===== */
    const buildUrl = (tab) => {
      let base = tab.reqUrl.trim();
      if (!base.startsWith('http')) {
        base = hostUrl.value.replace(/\/$/, '') + (base.startsWith('/') ? base : '/' + base);
      }
      const params = tab.reqParams.filter(p => safeStr(p.k).trim());
      if (params.length) {
        const qs = params.map(p => `${encodeURIComponent(safeStr(p.k))}=${encodeURIComponent(safeStr(p.v))}`).join('&');
        base += (base.includes('?') ? '&' : '?') + qs;
      }
      return base;
    };

    const doSend = async (targetTab) => {
      const tab = targetTab || activeTab.value;
      if (!tab || !tab.reqUrl?.trim()) return;
      tab.sending = true;
      tab.resJson = ''; tab.resStatus = null; tab.resTime = null; tab.resData = null;
      const finalUrl = buildUrl(tab);
      const method   = tab.reqMethod.toLowerCase();
      const t0 = Date.now();
      const headers = {};
      defHeaders.filter(h => safeStr(h.k).trim()).forEach(h => { headers[safeStr(h.k)] = safeStr(h.v); });
      tab.reqHeaders.filter(h => safeStr(h.k).trim()).forEach(h => { headers[safeStr(h.k)] = safeStr(h.v); });
      if (token.value.trim()) headers['Authorization'] = `Bearer ${token.value.trim()}`;
      let status = null, elapsed = null;
      try {
        const config = { method, url: finalUrl, headers };
        if (['post','put','patch'].includes(method) && tab.reqBody?.trim()) {
          try { config.data = JSON.parse(tab.reqBody); } catch { config.data = tab.reqBody; }
        }
        const res = await axios(config);
        elapsed = Date.now() - t0; status = res.status;
        tab.resStatus = status; tab.resTime = elapsed;
        tab.resData = res.data; tab.resJson = JSON.stringify(res.data, null, 2);
      } catch (err) {
        elapsed = Date.now() - t0; status = err.response?.status || 0;
        tab.resStatus = status; tab.resTime = elapsed;
        const errData = err.response?.data || { error: err.message };
        tab.resData = errData; tab.resJson = JSON.stringify(errData, null, 2);
      } finally {
        tab.sending = false;
        const _now = new Date();
        const _ts  = _now.toTimeString().slice(0, 8);
        const _safeReqParams   = (tab.reqParams  || []).filter(p => safeStr(p.k).trim()).map(p => ({ k: safeStr(p.k), v: safeStr(p.v) }));
        const _safeReqHeaders  = (tab.reqHeaders || []).filter(h => safeStr(h.k).trim()).map(h => ({ k: safeStr(h.k), v: safeStr(h.v) }));
        history.unshift({
          id: Date.now(), method: tab.reqMethod, url: finalUrl,
          status, time: elapsed, ts: _ts, tabLabel: tab.tabLabel,
          resJson: tab.resJson,
          reqInfo: {
            method: tab.reqMethod, url: tab.reqUrl,
            params: _safeReqParams, headers: _safeReqHeaders,
            body: tab.reqBody,
            token: token.value,
            host: hostUrl.value,
            defHeaders: defHeaders.filter(h => safeStr(h.k).trim()).map(h => ({ k: safeStr(h.k), v: safeStr(h.v) })),
          },
        });
        if (history.length > 50) history.splice(50);
        // toast 알림
        if (status !== null) {
          pushToast({
            type:     status >= 200 && status < 300 ? 'info' : 'error',
            tabLabel: tab.tabLabel,
            method:   tab.reqMethod,
            url:      finalUrl,
            status,
            resJson:  tab.resJson,
          });
        }
      }
    };

    /* ===== History ===== */
    const history      = reactive([]);
    const histSelIdx   = ref(null);
    const histModal    = ref(null);
    const histModalTab = ref('req');  // 'req' | 'res'

    // 편집용 복사본 (histModal 원본은 건드리지 않음)
    const editReq = reactive({ method:'', host:'', url:'', token:'', body:'', params:[], headers:[] });

    const selectHistory = (h, idx) => {
      histSelIdx.value   = idx;
      histModal.value    = h;
      histModalTab.value = 'req';
      // editReq 에 딥카피
      editReq.method  = h.reqInfo.method  || '';
      editReq.host    = h.reqInfo.host    || '';
      editReq.url     = h.reqInfo.url     || '';
      editReq.token   = h.reqInfo.token   || '';
      editReq.body    = h.reqInfo.body    || '';
      editReq.params  = (h.reqInfo.params  || []).map(p  => ({k:p.k,  v:p.v}));
      editReq.headers = (h.reqInfo.headers || []).map(h2 => ({k:h2.k, v:h2.v}));
    };
    const closeHistModal = () => { histModal.value = null; };

    const histResJson     = ref('');
    const histResSending  = ref(false);
    const histResStatus   = ref(null);
    const histResTime     = ref(null);
    const histResTs       = ref('');
    const histResProgress = ref(0);  // 0~100, 전송 중 진행 표시

    const resendHist = async () => {
      if (!activeTab.value) return;
      const tab = activeTab.value;
      tab.reqMethod = editReq.method;
      tab.reqUrl    = editReq.url;
      tab.reqBody   = editReq.body || '';
      tab.reqParams.splice(0, tab.reqParams.length, ...editReq.params.map(p=>({...p})), {k:'',v:''});
      tab.reqHeaders.splice(0, tab.reqHeaders.length, ...editReq.headers.map(h=>({...h})), {k:'',v:''});
      if (editReq.token) token.value   = editReq.token;
      if (editReq.host)  hostUrl.value = editReq.host;
      // 응답 초기화 + 전송 시작
      histResJson.value     = '';
      histResStatus.value   = null;
      histResTime.value     = null;
      histResTs.value       = '';
      histResProgress.value = 0;
      histResSending.value  = true;
      // progress 애니메이션: 0→85 느리게, 나머지는 완료 후 100
      const _start = Date.now();
      const _tick = setInterval(() => {
        const elapsed = Date.now() - _start;
        // 5초 안에 85까지 수렴
        histResProgress.value = Math.min(85, Math.round((elapsed / 5000) * 85));
      }, 80);
      await doSend(tab);
      clearInterval(_tick);
      histResProgress.value = 100;
      histResSending.value  = false;
      histResJson.value     = tab.resJson;
      histResStatus.value   = tab.resStatus;
      histResTime.value     = tab.resTime;
      histResTs.value       = new Date().toTimeString().slice(0, 8);
    };

    /* ===== Response Grid (active tab) ===== */
    const resGridCols = computed(() => {
      const d = activeTab.value?.resData;
      if (!d) return [];
      const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.list) ? d.list : null;
      return arr?.length ? Object.keys(arr[0]) : [];
    });
    const resGridRows = computed(() => {
      const d = activeTab.value?.resData;
      if (!d) return [];
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.data)) return d.data;
      if (Array.isArray(d?.list)) return d.list;
      return [];
    });

    /* ===== Quick Run ===== */
    const quickRun = (node, evt) => {
      evt.stopPropagation();
      // 기존 탭 있으면 재사용, 없으면 새 탭
      let tab = openTabs.find(t => t.nodeId === node.id);
      if (!tab) {
        tab = makeTab(node);
        openTabs.push(tab);
      }
      activeTabId.value = tab.tabId;
      doSend(tab);
    };

    /* ===== Helpers ===== */
    const addRow    = arr => arr.push({ k: '', v: '' });
    const removeRow = (arr, i) => { if (arr.length > 1) arr.splice(i, 1); };

    const methodStyle = m => ({
      GET:    'background:#dcfce7;color:#166534;',
      POST:   'background:#dbeafe;color:#1e40af;',
      PUT:    'background:#fef3c7;color:#92400e;',
      PATCH:  'background:#f3e8ff;color:#6b21a8;',
      DELETE: 'background:#fee2e2;color:#991b1b;',
    }[m] || 'background:#f0f0f0;color:#666;');

    const statusStyle = s => !s ? '' : s < 300 ? 'color:#166534;font-weight:700;'
      : s < 400 ? 'color:#92400e;font-weight:700;' : 'color:#991b1b;font-weight:700;';

    const methodDot = m => ({ GET:'#166534', POST:'#1e40af', PUT:'#92400e', PATCH:'#6b21a8', DELETE:'#991b1b' }[m] || '#888');

    /* ===== Mount ===== */
    onMounted(async () => {
      loadSettings(); refreshLs();
      try {
        const res = await window.frontApi.get('xs/sample07.json');
        (res.data || []).forEach(n => treeRoot.push(makeNode(n)));
        treeLoaded.value = true;
        treeRoot.push(buildAutoCrudNodes());
        treeRoot.push(buildAutoCrudRestNodes());
      } catch {
        treeRoot.push(makeNode({ id:'err', label:'데이터 로딩 실패', type:'folder', open:false, appId:'front' }));
      }
    });

    return {
      flatTree, treeSearch, toggleNode, selectApiNode, treeLoaded, appFilter, APP_META,
      openTabs, activeTabId, activeTab, closeTab, closeAllTabs,
      settingsOpen, hostUrl, token, defHeaders, lsItems, refreshLs,
      toasts, closeToast,
      doSend, history, histSelIdx, histModal, histModalTab, editReq, histResJson, histResSending, histResStatus, histResTime, histResTs, histResProgress, selectHistory, closeHistModal, resendHist,
      resGridCols, resGridRows,
      addRow, removeRow, methodStyle, statusStyle, methodDot, quickRun,
      // 자동실행
      autoPopupTabId, autoPopupPos, POPUP_ROWS, SECS, MINS, HOURS,
      openAutoPopup, closeAutoPopup, selectAuto, countdown,
    };
  },

  template: /* html */`
<div style="display:flex;height:calc(100vh - 56px);overflow:hidden;font-size:12px;background:#fff;">

  <!-- ━━━ 1. Tree Panel (좌측) ━━━ -->
  <div style="width:220px;flex-shrink:0;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;background:#f7f8fa;overflow:hidden;">
    <!-- Header -->
    <div style="padding:7px 10px 6px;border-bottom:1px solid #e0e0e0;background:#f0f2f5;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#333;">API Endpoints</span>
        <button @click="settingsOpen=!settingsOpen" title="공통 설정"
          style="border:none;background:none;cursor:pointer;font-size:15px;padding:0;line-height:1;"
          :style="settingsOpen?'color:#1a73e8;':'color:#999;'">⚙</button>
      </div>
      <div style="display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap;">
        <label v-for="(meta,key) in APP_META" :key="key"
          style="font-size:10px;font-weight:700;cursor:pointer;padding:2px 7px;border-radius:10px;border:1px solid #ddd;background:#fff;transition:all .12s;user-select:none;"
          :style="appFilter[key]?'background:'+meta.color+';color:#fff;border-color:'+meta.color+';':''">
          <input type="checkbox" v-model="appFilter[key]" style="display:none;" />{{ meta.label }}
        </label>
      </div>
      <input v-model="treeSearch" placeholder="🔍 이름 / URL 검색"
        style="width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;border:1px solid #ddd;border-radius:4px;outline:none;background:#fff;" />
    </div>
    <!-- Tree -->
    <div style="flex:1;overflow-y:auto;padding:4px 0;">
      <div v-if="!treeLoaded" style="text-align:center;padding:20px;color:#ccc;font-size:11px;">로딩 중…</div>
      <div v-for="item in flatTree" :key="item.n.id"
        @click="item.n.type==='req' ? selectApiNode(item.n) : toggleNode(item.n)"
        style="display:flex;align-items:center;gap:3px;padding:3px 6px;cursor:pointer;white-space:nowrap;overflow:hidden;transition:background .1s;user-select:none;"
        :style="'padding-left:'+(6+item.depth*11)+'px;'+(openTabs.some(t=>t.nodeId===item.n.id)?'color:#1a73e8;':'')"
        @mouseenter="e=>{ e.currentTarget.style.background='#eef2ff'; const b=e.currentTarget.querySelector('.tree-run-btn'); if(b) b.style.opacity='1'; }"
        @mouseleave="e=>{ e.currentTarget.style.background=''; const b=e.currentTarget.querySelector('.tree-run-btn'); if(b) b.style.opacity='0'; }">
        <span style="flex-shrink:0;font-size:9px;color:#bbb;width:8px;text-align:center;">
          <template v-if="item.n.type==='app'">{{ item.n.open?'▼':'▶' }}</template>
          <template v-else-if="item.n.type==='folder'">{{ item.n.open?'▾':'▸' }}</template>
          <template v-else>·</template>
        </span>
        <template v-if="item.n.type==='app'">
          <span style="font-size:10px;font-weight:800;padding:1px 6px;border-radius:3px;background:#333;color:#fff;">{{ item.n.label }}</span>
        </template>
        <template v-else-if="item.n.type==='folder'">
          <span style="font-size:11px;font-weight:700;color:#444;overflow:hidden;text-overflow:ellipsis;">📁 {{ item.n.label }}</span>
        </template>
        <template v-else>
          <span style="font-size:9px;padding:1px 3px;border-radius:2px;font-weight:700;flex-shrink:0;min-width:38px;text-align:center;" :style="methodStyle(item.n.method)">{{ item.n.method }}</span>
          <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;flex:1;" :title="item.n.url">{{ item.n.label }}</span>
          <button @click.stop="quickRun(item.n, $event)" title="바로 실행"
            style="flex-shrink:0;border:none;background:none;cursor:pointer;font-size:10px;color:#bbb;padding:1px 3px;border-radius:3px;line-height:1;opacity:0;transition:opacity .1s;"
            class="tree-run-btn">▶</button>
        </template>
      </div>
    </div>
  </div>

  <!-- ━━━ 2. 열린탭 바 (세로 좌측면) ━━━ -->
  <div style="width:172px;flex-shrink:0;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;background:#f4f5f7;overflow:hidden;">
    <div style="padding:5px 8px 4px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;background:#eeeff2;">
      <span style="font-size:10px;font-weight:800;color:#555;">열린 탭
        <span style="font-weight:400;color:#aaa;margin-left:2px;">{{ openTabs.length }}</span>
      </span>
      <button v-if="openTabs.length" @click="closeAllTabs" title="전체 닫기"
        style="border:none;background:none;cursor:pointer;font-size:10px;color:#aaa;padding:0;">✕ 전체</button>
    </div>
    <!-- 탭 없을 때 -->
    <div v-if="!openTabs.length" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#ccc;">
      <span style="font-size:22px;">📂</span>
      <span style="font-size:10px;text-align:center;line-height:1.4;">좌측 API 목록을<br>클릭하세요</span>
    </div>
    <!-- 탭 목록 -->
    <div style="flex:1;overflow-y:auto;">
      <div v-for="tab in openTabs" :key="tab.tabId"
        @click="activeTabId=tab.tabId"
        class="sj-tab-item"
        style="position:relative;padding:6px 6px 6px 6px;cursor:pointer;border-bottom:1px solid #e8e9ec;transition:background .1s;"
        :style="activeTabId===tab.tabId
          ? 'background:#fff;border-left:3px solid #e8587a;'
          : 'background:transparent;border-left:3px solid transparent;'"
        @mouseenter="e=>{ e.currentTarget.querySelectorAll('.tab-btn').forEach(b=>b.style.opacity='1'); if(activeTabId!==tab.tabId) e.currentTarget.style.background='#eaebee'; }"
        @mouseleave="e=>{ e.currentTarget.querySelectorAll('.tab-btn').forEach(b=>b.style.opacity='0'); if(activeTabId!==tab.tabId) e.currentTarget.style.background=''; }">

        <!-- 상단: 메서드 + 아이콘 버튼들 -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:8px;padding:1px 4px;border-radius:2px;font-weight:700;flex-shrink:0;" :style="methodStyle(tab.method)">{{ tab.method }}</span>
          <div style="display:flex;align-items:center;gap:1px;">
            <!-- 자동실행 토글 아이콘 -->
            <button @click.stop="openAutoPopup(tab, $event)"
              style="border:none;background:none;cursor:pointer;font-size:12px;padding:1px 2px;border-radius:3px;line-height:1;transition:all .15s;"
              :style="tab.autoMs ? 'opacity:1;color:#22a84a;text-shadow:0 0 4px #86efac;' : 'opacity:0.55;color:#777;'"
              :title="tab.autoMs ? '자동실행 중: '+tab.autoLabel : '자동실행 설정'">⏱</button>
            <!-- 닫기 -->
            <button class="tab-btn" @click.stop="closeTab(tab.tabId)"
              style="border:none;background:none;cursor:pointer;font-size:11px;color:#aaa;padding:1px 3px;border-radius:3px;opacity:0;transition:opacity .15s;line-height:1;"
              title="탭 닫기">✕</button>
          </div>
        </div>

        <!-- 탭 레이블 -->
        <div style="font-size:10px;font-weight:600;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3;" :title="tab.tabLabel">
          {{ tab.shortLabel }}
        </div>

        <!-- 하단 상태 -->
        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;min-height:13px;">
          <span v-if="tab.sending" style="font-size:9px;color:#1a73e8;">전송 중…</span>
          <span v-else-if="tab.resStatus" style="font-size:9px;" :style="statusStyle(tab.resStatus)">{{ tab.resStatus }} · {{ tab.resTime }}ms</span>
          <!-- 자동실행 라벨 + 카운트다운 -->
          <span v-if="tab.autoMs" style="font-size:9px;color:#22a84a;margin-left:auto;font-weight:600;white-space:nowrap;">
            ⏱ {{ tab.autoLabel }} <span style="color:#aaa;font-weight:400;">({{ countdown[tab.tabId] ?? '-' }}초)</span>
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- ━━━ 자동실행 주기 선택 팝업 ━━━ -->
  <template v-if="autoPopupTabId">
    <!-- backdrop -->
    <div @click="closeAutoPopup" style="position:fixed;inset:0;z-index:8000;"></div>
    <!-- popup -->
    <div style="position:fixed;z-index:8001;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.18);min-width:230px;overflow:hidden;"
      :style="'top:'+autoPopupPos.top+'px;left:'+autoPopupPos.left+'px;'">
      <!-- 헤더: 자동실행 없음 -->
      <div @click="selectAuto(openTabs.find(t=>t.tabId===autoPopupTabId), 0, '')"
        style="padding:8px 14px;font-size:11px;font-weight:700;color:#555;border-bottom:1px solid #eee;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .1s;"
        @mouseenter="e=>e.currentTarget.style.background='#f5f5f5'"
        @mouseleave="e=>e.currentTarget.style.background=''">
        <span>🚫 자동실행 없음</span>
        <span v-if="openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs===0||!openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs" style="font-size:10px;color:#34a853;">✔ 현재</span>
      </div>
      <!-- 구분선 + 표 -->
      <div style="padding:8px;">
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr>
              <th style="padding:3px 6px;text-align:center;font-weight:700;color:#888;font-size:10px;border-bottom:1px solid #eee;width:33%;">초 (sec)</th>
              <th style="padding:3px 6px;text-align:center;font-weight:700;color:#888;font-size:10px;border-bottom:1px solid #eee;width:34%;">분 (min)</th>
              <th style="padding:3px 6px;text-align:center;font-weight:700;color:#888;font-size:10px;border-bottom:1px solid #eee;width:33%;">시 (hr)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row,ri) in POPUP_ROWS" :key="ri">
              <!-- 초 -->
              <td style="padding:1px 4px;text-align:center;">
                <button v-if="row.s!=null" @click="selectAuto(openTabs.find(t=>t.tabId===autoPopupTabId), row.s*1000, row.s+'초')"
                  style="width:100%;padding:3px 4px;font-size:11px;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;transition:all .1s;background:#f9f9f9;"
                  :style="openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs===row.s*1000?'background:#e8f4fd;border-color:#1a73e8;color:#1a73e8;font-weight:700;':''"
                  @mouseenter="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.s*1000) e.currentTarget.style.background='#eef2ff'; }"
                  @mouseleave="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.s*1000) e.currentTarget.style.background='#f9f9f9'; }">
                  {{ row.s }}초
                </button>
              </td>
              <!-- 분 -->
              <td style="padding:1px 4px;text-align:center;">
                <button v-if="row.m!=null" @click="selectAuto(openTabs.find(t=>t.tabId===autoPopupTabId), row.m*60000, row.m+'분')"
                  style="width:100%;padding:3px 4px;font-size:11px;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;transition:all .1s;background:#f9f9f9;"
                  :style="openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs===row.m*60000?'background:#e8f4fd;border-color:#1a73e8;color:#1a73e8;font-weight:700;':''"
                  @mouseenter="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.m*60000) e.currentTarget.style.background='#eef2ff'; }"
                  @mouseleave="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.m*60000) e.currentTarget.style.background='#f9f9f9'; }">
                  {{ row.m }}분
                </button>
              </td>
              <!-- 시 -->
              <td style="padding:1px 4px;text-align:center;">
                <button v-if="row.h!=null" @click="selectAuto(openTabs.find(t=>t.tabId===autoPopupTabId), row.h*3600000, row.h+'시간')"
                  style="width:100%;padding:3px 4px;font-size:11px;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;transition:all .1s;background:#f9f9f9;"
                  :style="openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs===row.h*3600000?'background:#e8f4fd;border-color:#1a73e8;color:#1a73e8;font-weight:700;':''"
                  @mouseenter="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.h*3600000) e.currentTarget.style.background='#eef2ff'; }"
                  @mouseleave="e=>{ if(openTabs.find(t=>t.tabId===autoPopupTabId)?.autoMs!==row.h*3600000) e.currentTarget.style.background='#f9f9f9'; }">
                  {{ row.h }}시간
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>

  <!-- ━━━ 3. Main Panel (우측) ━━━ -->
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;">

    <!-- ⚙ Settings Panel -->
    <div v-show="settingsOpen" style="border-bottom:2px solid #1a73e8;background:#fff;flex-shrink:0;padding:10px 14px 12px;">
      <div style="font-size:11px;font-weight:800;color:#1a73e8;margin-bottom:8px;">
        ⚙ 공통 설정
        <span style="font-size:10px;font-weight:400;color:#aaa;margin-left:6px;">변경사항은 localStorage에 자동 저장</span>
      </div>
      <!-- 1행: HOST URL + BEARER TOKEN -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>
          <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;text-transform:uppercase;">Host URL</div>
          <input v-model="hostUrl" style="width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;border:1px solid #ddd;border-radius:4px;outline:none;font-family:monospace;" />
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;text-transform:uppercase;">🔑 Bearer Token</div>
          <input v-model="token" placeholder="eyJhbGci…" style="width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;border:1px solid #ddd;border-radius:4px;outline:none;font-family:monospace;" />
          <div v-if="token" style="font-size:10px;color:#1a73e8;margin-top:3px;">✔ Authorization 헤더에 자동 추가</div>
        </div>
      </div>
      <!-- 2행: 기본 Headers + LocalStorage -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
        <div>
          <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;text-transform:uppercase;">기본 Headers</div>
          <div v-for="(h,i) in defHeaders" :key="i" style="display:flex;gap:3px;margin-bottom:3px;">
            <input v-model="h.k" placeholder="Key"   style="flex:1;min-width:0;font-size:11px;padding:3px 5px;border:1px solid #ddd;border-radius:3px;outline:none;" />
            <input v-model="h.v" placeholder="Value" style="flex:1;min-width:0;font-size:11px;padding:3px 5px;border:1px solid #ddd;border-radius:3px;outline:none;" />
            <button @click="removeRow(defHeaders,i)" style="font-size:10px;padding:2px 5px;border:1px solid #fca5a5;border-radius:3px;background:#fee2e2;color:#991b1b;cursor:pointer;flex-shrink:0;">✕</button>
          </div>
          <button @click="addRow(defHeaders)" style="font-size:10px;padding:2px 8px;border:1px dashed #ccc;border-radius:3px;background:#f0f0f0;color:#666;cursor:pointer;">+ 추가</button>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;">LocalStorage</span>
            <button @click="refreshLs" style="font-size:10px;padding:1px 5px;border:1px solid #ddd;border-radius:3px;background:#f0f0f0;cursor:pointer;color:#666;">↻</button>
          </div>
          <div style="max-height:80px;overflow-y:auto;border:1px solid #eee;border-radius:4px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
              <tr v-for="item in lsItems" :key="item.k" style="border-bottom:1px solid #f5f5f5;">
                <td style="padding:2px 5px;color:#555;font-weight:600;width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="item.k">{{ item.k }}</td>
                <td style="padding:2px 5px;color:#888;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="item.v">{{ item.v }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 탭 없을 때 빈 상태 -->
    <div v-if="!activeTab" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#ccc;background:#fafafa;">
      <span style="font-size:40px;">🚀</span>
      <div style="font-size:14px;font-weight:600;color:#bbb;">좌측 API Endpoints에서 항목을 선택하세요</div>
      <div style="font-size:11px;color:#ccc;">선택하면 여기에 탭으로 열립니다</div>
    </div>

    <!-- 활성 탭 내용 -->
    <template v-if="activeTab">
      <!-- Request Bar -->
      <div style="padding:8px 12px;border-bottom:1px solid #e0e0e0;background:#fff;flex-shrink:0;">
        <!-- 탭 풀 네임 표시 -->
        <div style="font-size:10px;color:#aaa;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="activeTab.tabLabel">
          📌 {{ activeTab.tabLabel }}
          <span v-if="activeTab.desc" style="margin-left:6px;color:#ccc;">— {{ activeTab.desc }}</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <select v-model="activeTab.reqMethod"
            style="font-size:12px;padding:5px 6px;border:1px solid #ddd;border-radius:5px;font-weight:700;width:90px;cursor:pointer;"
            :style="methodStyle(activeTab.reqMethod)">
            <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
          </select>
          <input v-model="activeTab.reqUrl" placeholder="URL" @keyup.enter="doSend()"
            style="flex:1;font-size:12px;padding:5px 10px;border:1px solid #ddd;border-radius:5px;outline:none;font-family:monospace;min-width:0;" />
          <button @click="doSend()" :disabled="activeTab.sending"
            style="font-size:12px;padding:5px 20px;border:none;border-radius:5px;background:#e8587a;color:#fff;cursor:pointer;font-weight:700;white-space:nowrap;flex-shrink:0;"
            :style="activeTab.sending?'opacity:.55;cursor:not-allowed;':''">
            {{ activeTab.sending ? '전송 중…' : '▶ 전송' }}
          </button>
          <span v-if="activeTab.resStatus!==null" style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:5px;flex-shrink:0;"
            :style="activeTab.resStatus<300?'background:#dcfce7;color:#166534;':activeTab.resStatus<400?'background:#fef3c7;color:#92400e;':'background:#fee2e2;color:#991b1b;'">
            {{ activeTab.resStatus }}
          </span>
          <span v-if="activeTab.resTime!==null" style="font-size:11px;color:#aaa;flex-shrink:0;">{{ activeTab.resTime }}ms</span>
        </div>
      </div>

      <!-- Middle: Params + Response -->
      <div style="flex:1;display:flex;overflow:hidden;min-height:0;">

        <!-- Params / Headers / Body -->
        <div style="width:42%;flex-shrink:0;border-right:1px solid #e0e0e0;display:flex;flex-direction:column;overflow:hidden;">
          <div style="display:flex;border-bottom:1px solid #e0e0e0;background:#f8f8f8;flex-shrink:0;">
            <button v-for="t in [{id:'params',nm:'Params'},{id:'headers',nm:'Headers'},{id:'body',nm:'Body'}]" :key="t.id"
              @click="activeTab.reqTab=t.id"
              style="padding:5px 13px;font-size:11px;border:none;cursor:pointer;font-weight:600;border-bottom:2px solid transparent;transition:all .12s;"
              :style="activeTab.reqTab===t.id?'background:#fff;border-bottom-color:#e8587a;color:#e8587a;':'background:transparent;color:#999;'">
              {{ t.nm }}
            </button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:8px;">
            <template v-if="activeTab.reqTab==='params'">
              <div v-for="(p,i) in activeTab.reqParams" :key="i" style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                <input v-model="p.k" placeholder="Key"   style="flex:1;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #ddd;border-radius:3px;outline:none;" />
                <input v-model="p.v" placeholder="Value" style="flex:1;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #ddd;border-radius:3px;outline:none;" />
                <button @click="removeRow(activeTab.reqParams,i)" style="font-size:10px;padding:3px 6px;border:1px solid #fca5a5;border-radius:3px;background:#fee2e2;color:#991b1b;cursor:pointer;flex-shrink:0;">✕</button>
              </div>
              <button @click="addRow(activeTab.reqParams)" style="font-size:10px;padding:3px 10px;border:1px dashed #ccc;border-radius:3px;background:#f9f9f9;color:#666;cursor:pointer;">+ 추가</button>
            </template>
            <template v-if="activeTab.reqTab==='headers'">
              <div v-for="(h,i) in activeTab.reqHeaders" :key="i" style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                <input v-model="h.k" placeholder="Key"   style="flex:1;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #ddd;border-radius:3px;outline:none;" />
                <input v-model="h.v" placeholder="Value" style="flex:1;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #ddd;border-radius:3px;outline:none;" />
                <button @click="removeRow(activeTab.reqHeaders,i)" style="font-size:10px;padding:3px 6px;border:1px solid #fca5a5;border-radius:3px;background:#fee2e2;color:#991b1b;cursor:pointer;flex-shrink:0;">✕</button>
              </div>
              <button @click="addRow(activeTab.reqHeaders)" style="font-size:10px;padding:3px 10px;border:1px dashed #ccc;border-radius:3px;background:#f9f9f9;color:#666;cursor:pointer;">+ 추가</button>
            </template>
            <template v-if="activeTab.reqTab==='body'">
              <textarea v-model="activeTab.reqBody" placeholder='{\n  "key": "value"\n}'
                style="width:100%;box-sizing:border-box;font-size:11px;font-family:monospace;padding:7px 8px;border:1px solid #ddd;border-radius:4px;outline:none;resize:vertical;line-height:1.55;min-height:180px;"></textarea>
            </template>
          </div>
        </div>

        <!-- Response -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;">
          <div style="display:flex;border-bottom:1px solid #e0e0e0;background:#f8f8f8;flex-shrink:0;align-items:center;">
            <button v-for="t in [{id:'json',nm:'응답 JSON'},{id:'grid',nm:'Grid'}]" :key="t.id"
              @click="activeTab.resTab=t.id"
              style="padding:5px 13px;font-size:11px;border:none;cursor:pointer;font-weight:600;border-bottom:2px solid transparent;transition:all .12s;"
              :style="activeTab.resTab===t.id?'background:#fff;border-bottom-color:#1a73e8;color:#1a73e8;':'background:transparent;color:#999;'">
              {{ t.nm }}
              <span v-if="t.id==='grid'&&resGridRows.length" style="font-size:9px;background:#e8f0fe;color:#1a73e8;padding:1px 5px;border-radius:8px;margin-left:3px;">{{ resGridRows.length }}</span>
            </button>
            <span v-if="activeTab.sending" style="margin-left:auto;padding:0 12px;font-size:11px;color:#aaa;">전송 중…</span>
          </div>
          <div style="flex:1;overflow:auto;padding:8px;">
            <template v-if="activeTab.resTab==='json'">
              <pre v-if="activeTab.resJson" style="font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;line-height:1.55;">{{ activeTab.resJson }}</pre>
              <div v-else style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100px;color:#ccc;gap:6px;">
                <span style="font-size:22px;">📭</span>
                <span style="font-size:12px;">응답이 여기에 표시됩니다</span>
              </div>
            </template>
            <template v-if="activeTab.resTab==='grid'">
              <div v-if="!resGridRows.length" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100px;color:#ccc;gap:6px;">
                <span style="font-size:22px;">📊</span>
                <span style="font-size:12px;">{{ activeTab.resData ? 'Array 데이터가 없습니다' : '응답이 여기에 표시됩니다' }}</span>
              </div>
              <div v-else style="overflow-x:auto;">
                <div style="font-size:10px;color:#aaa;margin-bottom:5px;">총 {{ resGridRows.length }}건</div>
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                  <thead>
                    <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
                      <th style="padding:4px 6px;text-align:center;width:30px;color:#ccc;font-size:10px;font-weight:400;">#</th>
                      <th v-for="col in resGridCols" :key="col" style="padding:4px 8px;text-align:left;font-weight:600;color:#555;white-space:nowrap;font-size:11px;">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row,i) in resGridRows" :key="i" style="border-bottom:1px solid #f5f5f5;">
                      <td style="text-align:center;padding:3px 6px;color:#ddd;font-size:10px;">{{ i+1 }}</td>
                      <td v-for="col in resGridCols" :key="col" style="padding:3px 8px;color:#333;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;" :title="String(row[col])">{{ row[col] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- History -->
    <div style="border-top:2px solid #e0e0e0;background:#fafafa;flex-shrink:0;">
      <div style="padding:4px 12px;border-bottom:1px solid #ebebeb;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;font-weight:700;color:#555;">전송 이력
          <span style="font-weight:400;color:#e8587a;margin-left:3px;">{{ history.length }}</span>
        </span>
        <button @click="history.splice(0);histSelIdx=null;" style="font-size:10px;padding:2px 8px;border:1px solid #ddd;border-radius:3px;background:#f0f0f0;cursor:pointer;color:#888;">전체 삭제</button>
      </div>
      <div style="max-height:228px;overflow-y:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead style="position:sticky;top:0;background:#f8f9fa;z-index:1;">
            <tr style="border-bottom:1px solid #e0e0e0;">
              <th style="padding:3px 6px;width:32px;text-align:center;font-weight:600;color:#bbb;font-size:10px;">#</th>
              <th style="padding:3px 8px;width:68px;text-align:center;font-weight:600;color:#666;">메서드</th>
              <th style="padding:3px 8px;width:110px;text-align:left;font-weight:600;color:#666;">탭명</th>
              <th style="padding:3px 8px;text-align:left;font-weight:600;color:#666;">URL</th>
              <th style="padding:3px 8px;width:50px;text-align:center;font-weight:600;color:#666;">상태</th>
              <th style="padding:3px 8px;width:64px;text-align:center;font-weight:600;color:#666;">응답시간</th>
              <th style="padding:3px 8px;width:68px;text-align:center;font-weight:600;color:#666;">요청시간</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!history.length"><td colspan="7" style="text-align:center;padding:12px;color:#ccc;">전송 이력이 없습니다</td></tr>
            <tr v-for="(h,i) in history" :key="h.id"
              @click="selectHistory(h,i)"
              style="cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
              :style="histSelIdx===i?'background:#e8f0fe;':''"
              @mouseenter="e=>{ if(histSelIdx!==i) e.currentTarget.style.background='#f5f5f5'; }"
              @mouseleave="e=>{ e.currentTarget.style.background=histSelIdx===i?'#e8f0fe':''; }">
              <!-- 번호 + 상태 원 -->
              <td style="text-align:center;padding:2px 6px;">
                <span style="position:relative;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:#999;">
                  <span v-if="h.status && h.status<300" style="position:absolute;top:-2px;right:-4px;width:6px;height:6px;border-radius:50%;background:#22c55e;"></span>
                  <span v-else-if="h.status && h.status>=300" style="position:absolute;top:-2px;right:-4px;width:6px;height:6px;border-radius:50%;background:#ef4444;"></span>
                  {{ history.length - i }}
                </span>
              </td>
              <td style="text-align:center;padding:2px 8px;">
                <span style="font-size:9px;padding:1px 5px;border-radius:2px;font-weight:700;" :style="methodStyle(h.method)">{{ h.method }}</span>
              </td>
              <td style="padding:2px 8px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:0;font-size:10px;" :title="h.tabLabel">{{ h.tabLabel }}</td>
              <td style="padding:2px 8px;font-family:monospace;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:0;">{{ h.url }}</td>
              <td style="text-align:center;padding:2px 8px;" :style="statusStyle(h.status)">{{ h.status||'-' }}</td>
              <td style="text-align:center;padding:2px 8px;color:#888;">{{ h.time }}ms</td>
              <td style="text-align:center;padding:2px 8px;color:#aaa;">{{ h.ts }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- History 상세 모달 -->
    <template v-if="histModal">
      <div @click="closeHistModal" style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.45);"></div>
      <div style="position:fixed;z-index:9001;top:50%;left:50%;transform:translate(-50%,-50%);width:900px;max-width:96vw;max-height:86vh;background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;">
        <!-- 제목 헤더 -->
        <div style="padding:10px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px;flex-shrink:0;background:#f8f9fa;">
          <span style="font-size:12px;font-weight:800;color:#555;">전송이력상세</span>
          <span style="position:relative;font-size:11px;font-weight:700;color:#888;padding:0 6px;">
            <span v-if="histModal.status && histModal.status<300" style="position:absolute;top:-2px;right:0;width:6px;height:6px;border-radius:50%;background:#22c55e;"></span>
            <span v-else-if="histModal.status && histModal.status>=300" style="position:absolute;top:-2px;right:0;width:6px;height:6px;border-radius:50%;background:#ef4444;"></span>
            #{{ history.length - histSelIdx }}
          </span>
          <span style="font-size:10px;padding:2px 7px;border-radius:3px;font-weight:700;" :style="methodStyle(histModal.method)">{{ histModal.method }}</span>
          <span style="font-size:11px;font-family:monospace;color:#555;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="histModal.url">{{ histModal.url }}</span>
          <button @click="closeHistModal" style="border:none;background:none;cursor:pointer;font-size:16px;color:#aaa;padding:0;line-height:1;flex-shrink:0;">✕</button>
        </div>
        <!-- 탭명 -->
        <div v-if="histModal.tabLabel" style="padding:3px 16px;background:#fff;border-bottom:1px solid #f0f0f0;font-size:10px;color:#aaa;flex-shrink:0;">
          탭: <span style="color:#666;">{{ histModal.tabLabel }}</span>
        </div>
        <!-- 좌/우 2컬럼 본문 -->
        <div style="flex:1;display:flex;overflow:hidden;min-height:0;">
          <!-- 좌: 요청 (편집 가능) -->
          <div style="width:50%;flex-shrink:0;border-right:1px solid #e8e8e8;overflow-y:auto;padding:12px 14px;background:#fafafa;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
              <span style="font-size:10px;font-weight:800;color:#1a73e8;text-transform:uppercase;letter-spacing:.05em;">요청</span>
              <span style="font-size:10px;color:#aaa;">{{ histModal.ts }}</span>
              <span style="flex:1;"></span>
              <button @click="resendHist" :disabled="histResSending"
                style="font-size:11px;font-weight:700;padding:4px 14px;border:none;border-radius:5px;background:#e8587a;color:#fff;cursor:pointer;white-space:nowrap;"
                :style="histResSending?'opacity:.55;cursor:not-allowed;':''">
                {{ histResSending ? '전송 중…' : '▶ 재전송' }}
              </button>
            </div>
            <!-- 메서드 -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">메서드</div>
              <select v-model="editReq.method"
                style="width:100%;box-sizing:border-box;font-size:11px;padding:5px 8px;border:1px solid #c8d6f0;border-radius:4px;background:#fff;font-family:monospace;font-weight:700;color:#333;outline:none;cursor:pointer;">
                <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
              </select>
            </div>
            <!-- HOST -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">HOST</div>
              <input v-model="editReq.host"
                style="width:100%;box-sizing:border-box;font-size:11px;padding:5px 8px;border:1px solid #c8d6f0;border-radius:4px;background:#fff;font-family:monospace;color:#555;outline:none;" />
            </div>
            <!-- URL -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">URL</div>
              <input v-model="editReq.url"
                style="width:100%;box-sizing:border-box;font-size:11px;padding:5px 8px;border:1px solid #c8d6f0;border-radius:4px;background:#fff;font-family:monospace;color:#333;outline:none;" />
            </div>
            <!-- TOKEN -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">🔑 Bearer Token</div>
              <input v-model="editReq.token" placeholder="(없음)"
                style="width:100%;box-sizing:border-box;font-size:11px;padding:5px 8px;border:1px solid #c8d6f0;border-radius:4px;background:#fff;font-family:monospace;color:#555;outline:none;" />
            </div>
            <!-- HEADERS -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;">
                <span>Headers <span style="font-size:9px;font-weight:400;color:#aaa;">({{ editReq.headers.length }}개)</span></span>
                <button @click="editReq.headers.push({k:'',v:''})"
                  style="font-size:10px;padding:1px 7px;border:1px dashed #aad;border-radius:3px;background:#f0f4ff;color:#555;cursor:pointer;">+ 추가</button>
              </div>
              <div style="border:1px solid #c8d6f0;border-radius:4px;overflow:hidden;background:#fff;">
                <div v-if="!editReq.headers.length" style="padding:6px 10px;font-size:11px;color:#bbb;">(없음)</div>
                <div v-for="(h,i) in editReq.headers" :key="i" style="display:flex;border-bottom:1px solid #f0f0f0;align-items:center;gap:4px;padding:3px 6px;">
                  <input v-model="h.k" placeholder="Key"   style="flex:2;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #dde3f0;border-radius:3px;background:#f8f9fc;font-family:monospace;color:#555;outline:none;" />
                  <input v-model="h.v" placeholder="Value" style="flex:3;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #dde3f0;border-radius:3px;background:#f8f9fc;font-family:monospace;color:#333;outline:none;" />
                  <button @click="editReq.headers.splice(i,1)" style="border:none;background:none;cursor:pointer;color:#ccc;font-size:12px;padding:0 2px;flex-shrink:0;line-height:1;">✕</button>
                </div>
              </div>
            </div>
            <!-- PARAMS -->
            <div style="margin-bottom:7px;">
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;">
                <span>Parameters <span style="font-size:9px;font-weight:400;color:#aaa;">({{ editReq.params.length }}개)</span></span>
                <button @click="editReq.params.push({k:'',v:''})"
                  style="font-size:10px;padding:1px 7px;border:1px dashed #aad;border-radius:3px;background:#f0f4ff;color:#555;cursor:pointer;">+ 추가</button>
              </div>
              <div style="border:1px solid #c8d6f0;border-radius:4px;overflow:hidden;background:#fff;">
                <div v-if="!editReq.params.length" style="padding:6px 10px;font-size:11px;color:#bbb;">(없음)</div>
                <div v-for="(p,i) in editReq.params" :key="i" style="display:flex;border-bottom:1px solid #f0f0f0;align-items:center;gap:4px;padding:3px 6px;">
                  <input v-model="p.k" placeholder="Key"   style="flex:2;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #dde3f0;border-radius:3px;background:#f8f9fc;font-family:monospace;color:#555;outline:none;" />
                  <input v-model="p.v" placeholder="Value" style="flex:3;min-width:0;font-size:11px;padding:4px 6px;border:1px solid #dde3f0;border-radius:3px;background:#f8f9fc;font-family:monospace;color:#333;outline:none;" />
                  <button @click="editReq.params.splice(i,1)" style="border:none;background:none;cursor:pointer;color:#ccc;font-size:12px;padding:0 2px;flex-shrink:0;line-height:1;">✕</button>
                </div>
              </div>
            </div>
            <!-- BODY -->
            <div>
              <div style="font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">Body</div>
              <textarea v-model="editReq.body" placeholder="(없음)"
                style="width:100%;box-sizing:border-box;font-size:11px;padding:5px 8px;border:1px solid #c8d6f0;border-radius:4px;background:#fff;font-family:monospace;color:#333;outline:none;resize:vertical;min-height:60px;line-height:1.5;"></textarea>
            </div>
          </div>
          <!-- 우: 응답 -->
          <div style="flex:1;display:flex;flex-direction:column;min-width:0;background:#fff;overflow:hidden;">
            <!-- 응답 헤더 + progress bar (고정) -->
            <div style="flex-shrink:0;padding:12px 14px 0;border-bottom:1px solid #f0f0f0;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:10px;font-weight:800;color:#e8587a;text-transform:uppercase;letter-spacing:.05em;">응답</span>
                <span style="flex:1;"></span>
                <template v-if="histResSending">
                  <span style="font-size:10px;color:#1a73e8;font-weight:600;">전송 중… {{ histResProgress }}%</span>
                </template>
                <template v-else-if="histResStatus">
                  <span style="font-size:12px;font-weight:800;" :style="histResStatus<300?'color:#166534;':histResStatus<400?'color:#92400e;':'color:#991b1b;'">{{ histResStatus }}</span>
                  <span style="font-size:10px;color:#888;">{{ histResTime }}ms</span>
                  <span style="font-size:10px;color:#aaa;">{{ histResTs }}</span>
                  <span style="font-size:9px;color:#1a73e8;background:#e8f0fe;padding:1px 5px;border-radius:3px;font-weight:600;">재전송</span>
                </template>
                <template v-else-if="histModal.status">
                  <span style="font-size:12px;font-weight:800;" :style="histModal.status<300?'color:#166534;':histModal.status<400?'color:#92400e;':'color:#991b1b;'">{{ histModal.status }}</span>
                  <span style="font-size:10px;color:#888;">{{ histModal.time }}ms</span>
                  <span style="font-size:10px;color:#aaa;">{{ histModal.ts }}</span>
                </template>
              </div>
              <!-- progress bar -->
              <div style="height:6px;background:#f0f0f0;border-radius:0;margin:0 -14px;overflow:hidden;">
                <div style="height:100%;transition:width .08s linear;"
                  :style="histResSending ? 'background:#e8587a;width:'+histResProgress+'%;' : (histResStatus ? 'background:#22c55e;width:100%;' : 'width:0;')"
                ></div>
              </div>
            </div>
            <!-- 응답 본문 스크롤 영역 -->
            <div style="flex:1;overflow-y:auto;padding:12px 14px;">
              <pre v-if="!histResSending && histResJson" style="margin:0;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#333;line-height:1.6;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:10px;">{{ histResJson }}</pre>
              <pre v-else-if="!histResSending && !histResJson && histModal.resJson" style="margin:0;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#888;line-height:1.6;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:10px;">{{ histModal.resJson }}</pre>
              <div v-else-if="!histResSending" style="display:flex;align-items:center;justify-content:center;height:80px;color:#ccc;font-size:12px;">응답 본문 없음</div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div><!-- /Main Panel -->

  <!-- ━━━ Toast 알림 (우측 하단) ━━━ -->
  <div style="position:fixed;right:16px;bottom:16px;z-index:9500;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;">
    <div v-for="t in toasts" :key="t.id"
      style="pointer-events:all;width:380px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.22);overflow:hidden;font-size:11px;"
      :style="t.type==='error'?'border:1px solid #fca5a5;':'border:1px solid #86efac;'">
      <!-- 헤더바 -->
      <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;"
        :style="t.type==='error'?'background:#fee2e2;':'background:#dcfce7;'">
        <!-- 번호 배지 -->
        <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:10px;flex-shrink:0;"
          :style="t.type==='error'?'background:#ef4444;color:#fff;':'background:#22c55e;color:#fff;'">{{ t.seq }}</span>
        <span style="font-size:13px;flex-shrink:0;">{{ t.type==='error' ? '🔴' : '🟢' }}</span>
        <span style="font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:11px;"
          :title="t.tabLabel">{{ t.tabLabel }}</span>
        <button @click="closeToast(t.id)"
          style="border:none;background:none;cursor:pointer;font-size:13px;color:#888;padding:0;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <!-- progress bar -->
      <div style="height:3px;background:#e5e7eb;">
        <div style="height:100%;transition:width .2s linear;"
          :style="(t.type==='error'?'background:#ef4444;':'background:#22c55e;')+'width:'+t.progress+'%;'"></div>
      </div>
      <!-- URL 행 -->
      <div style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:#fff;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:9px;padding:1px 5px;border-radius:2px;font-weight:700;flex-shrink:0;"
          :style="t.method==='GET'?'background:#dcfce7;color:#166534;':t.method==='POST'?'background:#dbeafe;color:#1e40af;':t.method==='PUT'?'background:#fef3c7;color:#92400e;':t.method==='DELETE'?'background:#fee2e2;color:#991b1b;':'background:#f3e8ff;color:#6b21a8;'">{{ t.method }}</span>
        <span style="font-family:monospace;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:10px;" :title="t.url">{{ t.url }}</span>
        <span style="font-weight:700;flex-shrink:0;font-size:12px;"
          :style="t.status<300?'color:#166534;':t.status<400?'color:#92400e;':'color:#991b1b;'">{{ t.status }}</span>
      </div>
      <!-- JSON 접힌/펼친 -->
      <div style="background:#f9f9f9;">
        <div @click="t.jsonOpen=!t.jsonOpen"
          style="padding:4px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;color:#888;font-size:10px;">
          <span>응답 JSON</span>
          <span style="font-size:9px;">{{ t.jsonOpen ? '▲ 접기' : '▼ 펼치기' }}</span>
        </div>
        <div v-if="t.jsonOpen" style="max-height:160px;overflow:auto;padding:0 10px 8px;">
          <pre style="margin:0;font-size:10px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#333;line-height:1.5;">{{ t.resJson || '(없음)' }}</pre>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
};
