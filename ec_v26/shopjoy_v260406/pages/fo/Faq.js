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
    /* faqs — 우측 목록(선택 분류로 서버 필터된 결과). {q, a, pathId, cate} 정규화 */
    const faqs = reactive([]);
    /* faqAll — 좌측 트리 뱃지 카운트용 전체 스냅샷(분류 무관, 1회 로드) */
    const faqAll = reactive([]);
    /* pathRows — sy_path(biz_cd=cm_faq) 원본 행. 트리 빌드용 */
    const pathRows = reactive([]);
    /* 선택 분류 (null=전체) */
    const selectedPathId = ref(null);
    /* 이번 세션에 이미 조회수 증가시킨 faqId — 재펼침 시 중복 증가 방지(새로고침 시 초기화 → 재반영 허용) */
    const _viewedFaqIds = new Set();
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
      // FAQ 아코디언 토글 (param: faqId). 펼칠 때(처음 읽을 때만) 조회수 +1
      if (cmd === 'faqs-rowToggle') {
        const willOpen = uiState.openFaq !== param;
        uiState.openFaq = willOpen ? param : null;
        if (willOpen) { handleIncrView(param); }
        return;
      // 분류 트리 노드 선택 (param: pathId | null=전체) — 클릭마다 서버 재조회
      } else if (cmd === 'tree-select') {
        selectedPathId.value = param;
        uiState.openFaq = null;
        pager.pageNo = 1;
        handleLoadFaqs();
        return;
      // 페이지 이동 — 버튼 클릭마다 서버 재조회 (페이징 정책)
      } else if (cmd === 'pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) {
          pager.pageNo = param; uiState.openFaq = null;
          handleLoadFaqs();
        }
        return;
      // 페이지 크기 변경 — 1페이지로 리셋 후 서버 재조회
      } else if (cmd === 'pager-sizeChange') {
        pager.pageNo = 1; uiState.openFaq = null;
        handleLoadFaqs();
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

    /* handleLoadFaqs — DB(cm_faq) 공개 FAQ 서버사이드 페이지 조회 (분류 pathId 자손 포함 + pageNo/pageSize).
     *   분류 클릭·페이지 버튼·페이지크기 변경 시마다 API 재조회 (검색·페이징 정책). 실패 시 SITE_CONFIG.faqs fallback */
    const handleLoadFaqs = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(selectedPathId.value != null ? { pathId: selectedPathId.value } : {}),
        };
        const res = await foApiSvc.cmFaq.getPage(params, 'FAQ', '목록조회');
        const d = res.data?.data || {};
        const list = d.pageList || [];
        faqs.splice(0, faqs.length, ...list.map(f => ({
          faqId: f.faqId, q: f.faqQuestion, a: f.faqAnswer,
          attachGrpId: f.answerAttachGrpId || null,
          viewCount: f.viewCount || 0,
          pathId: f.pathId != null ? String(f.pathId) : '', cate: f.pathLabel || '',
        })));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        console.error('[handleLoadFaqs]', err);
        /* fallback: 정적 SITE_CONFIG.faqs (페이징 없이 전체) */
        const fb = (window.SITE_CONFIG && window.SITE_CONFIG.faqs) || [];
        faqs.splice(0, faqs.length, ...fb.map((f, i) => ({ faqId: 'fb' + i, q: f.q, a: f.a, viewCount: 0, pathId: '', cate: '' })));
        pager.pageTotalCount = faqs.length;
        pager.pageTotalPage = 1;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleIncrView — FAQ 펼침(읽음) 시 조회수 +1. 이번 세션에 이미 본 FAQ 는 재증가 안 함.
     *   fallback 항목(fb*)·미존재는 스킵. 서버 갱신값으로 로컬 카운트 동기화. */
    const handleIncrView = async (faqId) => {
      if (!faqId || faqId.startsWith('fb') || _viewedFaqIds.has(faqId)) { return; }
      _viewedFaqIds.add(faqId);   // 낙관적 마킹(중복 호출 방지)
      try {
        const res = await foApiSvc.cmFaq.incrView(faqId, 'FAQ', '조회수증가');
        const next = res.data?.data;
        if (next != null) {
          const item = faqs.find(f => f.faqId === faqId);
          if (item) { item.viewCount = next; }
        }
      } catch (err) {
        console.error('[handleIncrView]', err);
        _viewedFaqIds.delete(faqId);   // 실패 시 마킹 해제(다음 펼침에 재시도)
      }
    };

    /* handleLoadFaqCounts — 좌측 트리 뱃지용 전체 FAQ 스냅샷(분류 무관, 1회). 카운트만 사용 */
    const handleLoadFaqCounts = async () => {
      try {
        const res = await foApiSvc.cmFaq.getList({}, 'FAQ', '분류카운트');
        const list = res.data?.data || [];
        faqAll.splice(0, faqAll.length, ...list.map(f => ({
          faqId: f.faqId, pathId: f.pathId != null ? String(f.pathId) : '',
        })));
      } catch (err) { console.error('[handleLoadFaqCounts]', err); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 분류 트리 + 카운트(전체) + FAQ(선택분류) 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadTree();
      handleLoadFaqCounts();
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

    /* fnCountFor — 해당 노드(하위 포함) FAQ 건수. 트리 뱃지용으로 전체 스냅샷(faqAll)에서 집계
     *   (우측 목록 faqs 는 선택 분류로 서버 필터된 결과라 카운트엔 부적합) */
    const fnCountFor = (pathId) => {
      const ids = fnDescendantIds(pathId);
      return faqAll.filter(f => ids.has(f.pathId)).length;
    };

    /* cfPagedFaqs — 서버에서 분류 필터된 faqs 의 현재 페이지 슬라이스 + pager 메타 갱신 */
    const cfPagedFaqs = computed(() => {
      const list = faqs;
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

    /* cfTotalCount — 좌측 '전체' 뱃지용 전체 건수 (분류 무관 스냅샷) */
    const cfTotalCount = computed(() => faqAll.length);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, faqs, selectedPathId, pager,
      cfTree, cfPagedFaqs, cfTotalCount,
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
        <div v-if="!faqs.length" style="text-align:center;padding:48px 0;color:var(--text-muted);font-size:0.9rem;">
          {{ uiState.loading ? '불러오는 중...' : '해당 분류의 FAQ가 없습니다.' }}
        </div>
        <div v-for="faq in cfPagedFaqs" :key="faq.faqId" class="faq-item">
          <button class="faq-question" @click="handleSelectAction('faqs-rowToggle', faq.faqId)">
            <span style="flex:1;">
              {{ faq.q }}
            </span>
            <span class="faq-views" title="읽음 수" style="flex-shrink:0;margin-right:10px;font-size:0.72rem;color:var(--text-muted);font-weight:500;">
              👁 {{ (faq.viewCount || 0).toLocaleString() }}
            </span>
            <span class="chevron" :class="{open: uiState.openFaq===faq.faqId}">
              ▼
            </span>
          </button>
          <div v-show="uiState.openFaq===faq.faqId" class="faq-answer">
            <div v-if="faq.a" class="faq-answer-html" v-html="faq.a"></div>
            <!-- 답변 첨부파일 -->
            <div v-if="faq.attachGrpId" style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border);">
              <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:6px;">
                📎 첨부파일
              </div>
              <base-attach-grp :model-value="faq.attachGrpId" :ref-id="'FAQ-' + faq.faqId"
                grp-code="FAQ_ANSWER_ATTACH" grp-nm="FAQ 답변 첨부파일"
                display-mode="list" :readonly="true" />
            </div>
          </div>
        </div>
      </fo-container>
      <!-- ===== ■. 페이지네이션 (최대 10건/페이지) ============================ -->
      <fo-pager v-if="faqs.length" :pager="pager"
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
