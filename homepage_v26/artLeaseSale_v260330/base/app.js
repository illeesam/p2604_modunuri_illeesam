/* ============================================
   송진현 아트갤러리 - Vue App
   그림 대여 & 판매 사이트
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, computed, reactive, watch, onMounted, onBeforeUnmount } = Vue;

  const artGalleryApp = createApp({
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('artgallery-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('artgallery-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const sidebarOpen = ref(true);
    const mobileOpen  = ref(false);
    let replaceNextHash = false;
    const closeMobileMenu = () => {
      mobileOpen.value = false;
    };
    const toggleMobileMenu = () => {
      if (mobileOpen.value) {
        mobileOpen.value = false;
      } else {
        if (window.innerWidth < 1024) sidebarOpen.value = true;
        mobileOpen.value = true;
      }
    };

    const navigate = (id, opts = {}) => {
      if (opts && opts.replace) replaceNextHash = true;
      if (mobileOpen.value) mobileOpen.value = false;
      page.value = id;
      window.scrollTo(0, 0);
      try { sessionStorage.setItem('artgallery_page', id); } catch (e) {}
    };
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) mobileOpen.value = false;
    });

    /* ── Toast ── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    };

    /* ── Alert Modal ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Artworks ── */
    const artworks = window.SITE_CONFIG.artworks;
    const selectedArtwork = ref(artworks[0]);
    const selectArtwork = a => { selectedArtwork.value = a; navigate('detail'); };

    /* ── URL State Preservation ── */
    const PAGE_SIZE = 6;
    let restoring = true;
    try {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      if (rawHash && rawHash.includes('page=')) {
        const params = new URLSearchParams(rawHash);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'gallery', 'detail', 'lease', 'contact', 'location'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;
        const hAid = params.get('aid');
        const aid = hAid !== null && hAid !== '' ? Number(hAid) : NaN;
        if (!Number.isNaN(aid)) {
          const found = artworks.find(a => Number(a.artworkId) === aid);
          if (found) selectedArtwork.value = found;
        }
      } else {
        try {
          const sp = sessionStorage.getItem('artgallery_page');
          const validPages = ['home', 'about', 'gallery', 'detail', 'lease', 'contact', 'location'];
          if (sp && validPages.includes(sp)) page.value = sp;
        } catch (e) {}
        const saved = Number(sessionStorage.getItem('artgallery_aid'));
        if (!Number.isNaN(saved)) {
          const found = artworks.find(a => Number(a.artworkId) === saved);
          if (found) selectedArtwork.value = found;
        }
      }
    } catch (e) {}
    restoring = false;

    let syncingFromHash = false;
    const applyHashState = () => {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      if (!rawHash || !rawHash.includes('page=')) return;
      syncingFromHash = true;
      try {
        const params = new URLSearchParams(rawHash);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'gallery', 'detail', 'lease', 'contact', 'location'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;
        const hAid = params.get('aid');
        const aid = hAid !== null && hAid !== '' ? Number(hAid) : NaN;
        if (!Number.isNaN(aid)) {
          const found = artworks.find(a => Number(a.artworkId) === aid);
          if (found) selectedArtwork.value = found;
        }
      } catch (e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    };
    const onHashChange = () => { if (!syncingFromHash) applyHashState(); };
    window.addEventListener('hashchange', onHashChange);

    watch(page, id => {
      if (restoring || syncingFromHash) return;
      const params = new URLSearchParams();
      params.set('page', page.value);
      if (page.value === 'detail') {
        params.set('aid', selectedArtwork.value?.artworkId ?? '');
        if (selectedArtwork.value?.artworkId != null) sessionStorage.setItem('artgallery_aid', String(selectedArtwork.value.artworkId));
      }
      const hash = params.toString();
      const url = window.location.pathname + window.location.search + '#' + hash;
      if (replaceNextHash) {
        replaceNextHash = false;
        try { history.replaceState(null, '', url); } catch (e) { window.location.hash = hash; }
      } else {
        window.location.hash = hash;
      }
    });
    watch(selectedArtwork, a => {
      if (!syncingFromHash && a && a.artworkId != null) sessionStorage.setItem('artgallery_aid', String(a.artworkId));
    });

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const pr = new URLSearchParams();
        pr.set('page', page.value);
        if (page.value === 'detail' && selectedArtwork.value?.artworkId != null) {
          pr.set('aid', String(selectedArtwork.value.artworkId));
        }
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + pr.toString());
      }
    } catch (e) {}

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', onHashChange);
    });

    /* ── Loading done ── */
    const loadingEl = document.getElementById('vue-app-loading');
    if (loadingEl) {
      loadingEl.classList.add('vue-app-loading--done');
      setTimeout(() => { if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 500);
    }

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      artworks, selectedArtwork, selectArtwork,
      config: window.SITE_CONFIG,
    };
  },

  template: /* html */ `
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <app-header
    :page="page"
    :theme="theme"
    :sidebar-open="sidebarOpen"
    :mobile-open="mobileOpen"
    :config="config"
    :navigate="navigate"
    :toggle-theme="toggleTheme"
    @toggle-sidebar="sidebarOpen=!sidebarOpen"
    @toggle-mobile="toggleMobileMenu"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">

    <app-sidebar
      :page="page"
      :sidebar-open="sidebarOpen"
      :mobile-open="mobileOpen"
      :config="config"
      :navigate="navigate"
      @toggle-sidebar="sidebarOpen=!sidebarOpen"
      @close-mobile="closeMobileMenu"
    />

    <!-- Mobile overlay -->
    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <page-home       v-if="page==='home'"     :navigate="navigate" :config="config" :artworks="artworks" :select-artwork="selectArtwork" />
      <page-about      v-else-if="page==='about'"    :navigate="navigate" :config="config" />
      <page-gallery    v-else-if="page==='gallery'"  :navigate="navigate" :config="config" :artworks="artworks" :select-artwork="selectArtwork" />
      <page-detail     v-else-if="page==='detail'"   :navigate="navigate" :config="config" :artwork="selectedArtwork" :artworks="artworks" :select-artwork="selectArtwork" :show-alert="showAlert" />
      <page-lease      v-else-if="page==='lease'"    :navigate="navigate" :config="config" />
      <page-contact    v-else-if="page==='contact'"  :navigate="navigate" :config="config" :show-toast="showToast" :show-alert="showAlert" />
      <page-location   v-else-if="page==='location'" :navigate="navigate" :config="config" />

      <app-footer :config="config" :navigate="navigate" />
    </main>
  </div>

  <!-- ═══════════ TOAST ═══════════ -->
  <div v-if="toast.show" class="toast-wrap" :class="'toast-'+toast.type">
    <span class="toast-icon">{{ toast.type==='success'?'✅':toast.type==='error'?'❌':toast.type==='warning'?'⚠️':'ℹ️' }}</span>
    <span class="toast-msg">{{ toast.msg }}</span>
  </div>

  <!-- ═══════════ ALERT MODAL ═══════════ -->
  <div v-if="alertState.show" class="modal-overlay" @click.self="closeAlert">
    <div class="modal-box">
      <div class="modal-icon" :class="'icon-'+alertState.type">
        {{ alertState.type==='success'?'✅':alertState.type==='error'?'❌':'ℹ️' }}
      </div>
      <div class="modal-title">{{ alertState.title }}</div>
      <div class="modal-msg">{{ alertState.msg }}</div>
      <div class="modal-actions">
        <button class="btn-gold" @click="closeAlert" style="padding:10px 28px;">확인</button>
      </div>
    </div>
  </div>

</div>
`,
  })
    .component('AppHeader',   window.AppHeader)
    .component('AppSidebar',  window.AppSidebar)
    .component('AppFooter',   window.AppFooter)
    .component('PageHome',    window.PageHome)
    .component('PageAbout',   window.PageAbout)
    .component('PageGallery', window.PageGallery)
    .component('PageDetail',  window.PageDetail)
    .component('PageLease',   window.PageLease)
    .component('PageContact', window.PageContact)
    .component('PageLocation',window.PageLocation);

  artGalleryApp.config.globalProperties.$listImg = function (src) {
    return window.cmUtil.listImgSrc(src);
  };
  artGalleryApp.mount('#app');
})();
