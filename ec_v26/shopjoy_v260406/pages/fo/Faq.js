/* ShopJoy - Faq */
window.Faq = {
  name: 'Faq',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  emits: [],
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, openFaq: null });
    const codes = reactive({});
    /* faqs — API(cm_faq). {q, a, pathId, cate} 형태로 정규화. 실패 시 SITE_CONFIG.faqs fallback */
    const faqs = reactive([]);
    /* pathRows — sy_path(biz_cd=cm_faq) 원본 행. 트리 빌드용 */
    const pathRows = reactive([]);
    /* 선택 분류 (null=전체) */
    const selectedPathId = ref(null);
    /* 페이저 (클라이언트 페이징, 최대 10건/페이지) */
    const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Faq.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      } else if (cmd === 'page-goContact') {
        return props.navigate('contact');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Faq.js : handleSelectAction -> ', cmd, param);
      // FAQ 아코디언 토글 (param: faqId)
      if (cmd === 'faqs-rowToggle') {
        uiState.openFaq = (uiState.openFaq === param ? null : param);
        return;
      // 분류 트리 노드 선택 (param: pathId | null=전체)
      } else if (cmd === 'tree-select') {
        selectedPathId.value = param;
        uiState.openFaq = null;
        pager.pageNo = 1;
        return;
      // 페이지 이동
      } else if (cmd === 'pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; uiState.openFaq = null; }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'pager-sizeChange') {
        pager.pageNo = 1; uiState.openFaq = null;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleLoadTree — FAQ 분류 표시경로(sy_path, biz_cd=cm_faq) 로드 */
    const handleLoadTree = async () => {
      try {
        const res = await coApiSvc.syPath.getPage({ bizCd: 'cm_faq' }, 'FAQ분류', '조회');
        const data = res.data?.data;
        const rows = Array.isArray(data) ? data : (data?.pageList || []);
        pathRows.splice(0, pathRows.length, ...rows);
      } catch (err) {
        console.error('[handleLoadTree]', err);
        pathRows.splice(0, pathRows.length);
      }
    };

    /* handleLoadFaqs — DB(cm_faq) 공개 FAQ 조회. 실패 시 SITE_CONFIG.faqs fallback */
    const handleLoadFaqs = async () => {
      uiState.loading = true;
      try {
        const res = await foApiSvc.cmFaq.getList({}, 'FAQ', '목록조회');
        const list = res.data?.data || [];
        faqs.splice(0, faqs.length, ...list.map(f => ({
          faqId: f.faqId, q: f.faqQuestion, a: f.faqAnswer,
          pathId: f.pathId != null ? String(f.pathId) : '', cate: f.pathLabel || '',
        })));
      } catch (err) {
        console.error('[handleLoadFaqs]', err);
        /* fallback: 정적 SITE_CONFIG.faqs */
        const fb = (window.SITE_CONFIG && window.SITE_CONFIG.faqs) || [];
        faqs.splice(0, faqs.length, ...fb.map((f, i) => ({ faqId: 'fb' + i, q: f.q, a: f.a, pathId: '', cate: '' })));
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 분류 트리 + FAQ 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadTree();
      handleLoadFaqs();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 트리 / 필터) #################### */

    /* cfTree — pathRows → 2계층 트리 [{id, label, count, children:[{id,label,count}]}] */
    const cfTree = computed(() => {
      const rows = pathRows.map(r => ({
        id: String(r.pathId), parentId: r.parentPathId != null ? String(r.parentPathId) : null,
        label: r.pathLabel, sortOrd: r.sortOrd || 0,
      }));
      const byParent = {};
      rows.forEach(r => { (byParent[r.parentId || '__root__'] = byParent[r.parentId || '__root__'] || []).push(r); });
      const sortFn = (a, b) => (a.sortOrd - b.sortOrd) || a.label.localeCompare(b.label, 'ko');
      const roots = (byParent['__root__'] || []).slice().sort(sortFn);
      return roots.map(root => ({
        id: root.id, label: root.label,
        count: fnCountFor(root.id),
        children: (byParent[root.id] || []).slice().sort(sortFn).map(ch => ({
          id: ch.id, label: ch.label, count: fnCountFor(ch.id),
        })),
      }));
    });

    /* fnDescendantIds — 노드 + 모든 자손 pathId 집합 */
    const fnDescendantIds = (pathId) => {
      const ids = new Set([String(pathId)]);
      let added = true;
      while (added) {
        added = false;
        pathRows.forEach(r => {
          const pid = r.parentPathId != null ? String(r.parentPathId) : null;
          if (pid && ids.has(pid) && !ids.has(String(r.pathId))) { ids.add(String(r.pathId)); added = true; }
        });
      }
      return ids;
    };

    /* fnCountFor — 해당 노드(하위 포함) FAQ 건수 */
    const fnCountFor = (pathId) => {
      const ids = fnDescendantIds(pathId);
      return faqs.filter(f => ids.has(f.pathId)).length;
    };

    /* cfFilteredFaqs — 선택 분류(하위 포함) 필터. null=전체 */
    const cfFilteredFaqs = computed(() => {
      if (selectedPathId.value == null) return faqs;
      const ids = fnDescendantIds(selectedPathId.value);
      return faqs.filter(f => ids.has(f.pathId));
    });

    /* cfPagedFaqs — 현재 페이지(최대 pageSize건) 슬라이스 + pager 메타 갱신 */
    const cfPagedFaqs = computed(() => {
      const list = cfFilteredFaqs.value;
      const size = pager.pageSize || 10;
      const total = list.length;
      const totalPage = Math.max(1, Math.ceil(total / size));
      /* 필터 변경으로 현재 페이지가 범위를 넘으면 보정 */
      const cur = Math.min(Math.max(1, pager.pageNo), totalPage);
      pager.pageTotalCount = total;
      pager.pageTotalPage = totalPage;
      if (pager.pageNo !== cur) pager.pageNo = cur;
      const start = (cur - 1) * size;
      return list.slice(start, start + size);
    });

    /* cfTotalCount — 전체 건수 */
    const cfTotalCount = computed(() => faqs.length);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, faqs, selectedPathId, pager,
      cfTree, cfFilteredFaqs, cfPagedFaqs, cfTotalCount,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */ `
<fo-page title="FAQ" eyebrow="Support"
  banner-img="assets/cdn/prod/img/page-title/page-title-1.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'FAQ' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 본문: 분류 트리 + 목록 2단 ================================== -->
  <div class="faq-layout" style="display:grid;grid-template-columns:230px 1fr;gap:20px;align-items:start;">
    <!-- ===== ■.■. 좌: 분류 트리 ============================================ -->
    <aside class="faq-tree" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:12px 8px;position:sticky;top:80px;">
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-secondary);padding:4px 10px 10px;border-bottom:1px solid var(--border);margin-bottom:6px;">
        📂 분류
      </div>
      <!-- 전체 -->
      <button class="faq-tree-node" @click="handleSelectAction('tree-select', null)"
        style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:7px 10px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:0.85rem;text-align:left;"
        :style="selectedPathId===null ? 'background:var(--accent);color:#fff;font-weight:700;' : 'color:var(--text-primary);'">
        <span>전체</span>
        <span style="font-size:0.72rem;opacity:0.85;">{{ cfTotalCount }}</span>
      </button>
      <!-- 대분류 + 중분류 -->
      <template v-for="root in cfTree" :key="root.id">
        <button class="faq-tree-node" @click="handleSelectAction('tree-select', root.id)"
          style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:7px 10px;margin-top:2px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:0.85rem;font-weight:600;text-align:left;"
          :style="selectedPathId===root.id ? 'background:var(--accent);color:#fff;' : 'color:var(--text-primary);'">
          <span>{{ root.label }}</span>
          <span style="font-size:0.72rem;opacity:0.85;">{{ root.count }}</span>
        </button>
        <button v-for="ch in root.children" :key="ch.id" class="faq-tree-node"
          @click="handleSelectAction('tree-select', ch.id)"
          style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:5px 10px 5px 24px;border:none;background:none;cursor:pointer;border-radius:6px;font-size:0.8rem;text-align:left;"
          :style="selectedPathId===ch.id ? 'background:var(--accent);color:#fff;font-weight:700;' : 'color:var(--text-secondary);'">
          <span>{{ ch.label }}</span>
          <span style="font-size:0.7rem;opacity:0.8;">{{ ch.count }}</span>
        </button>
      </template>
    </aside>
    <!-- ===== ■.■. 우: FAQ 목록 ============================================= -->
    <div>
      <fo-container card-style="padding:8px clamp(14px,3vw,28px);margin-bottom:16px;">
        <div v-if="!cfFilteredFaqs.length" style="text-align:center;padding:48px 0;color:var(--text-muted);font-size:0.9rem;">
          {{ uiState.loading ? '불러오는 중...' : '해당 분류의 FAQ가 없습니다.' }}
        </div>
        <div v-for="faq in cfPagedFaqs" :key="faq.faqId" class="faq-item">
          <button class="faq-question" @click="handleSelectAction('faqs-rowToggle', faq.faqId)">
            <span style="flex:1;">
              {{ faq.q }}
            </span>
            <span class="chevron" :class="{open: uiState.openFaq===faq.faqId}">
              ▼
            </span>
          </button>
          <div v-show="uiState.openFaq===faq.faqId" class="faq-answer">
            {{ faq.a }}
          </div>
        </div>
      </fo-container>
      <!-- ===== ■. 페이지네이션 (최대 10건/페이지) ============================ -->
      <fo-pager v-if="cfFilteredFaqs.length" :pager="pager"
        :on-set-page="n => handleSelectAction('pager-setPage', n)"
        :on-size-change="() => handleSelectAction('pager-sizeChange')" />
      <!-- ===== □. 페이지네이션 =============================================== -->
      <!-- ===== ■. 본문 영역 (문의 유도) ===================================== -->
      <div style="text-align:center;padding:clamp(12px,3vw,24px) 0;">
        <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
          원하시는 답변을 찾지 못하셨나요?
        </p>
        <button class="btn-blue" @click="handleBtnAction('page-goContact')">
          1:1 문의하기
        </button>
      </div>
    </div>
  </div>
  <!-- ===== □. 본문 =================================================== -->
</fo-page>
`
};
