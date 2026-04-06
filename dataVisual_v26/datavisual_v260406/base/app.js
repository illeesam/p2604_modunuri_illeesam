/* ============================================
   DataVisual — Vue 3 SPA App
   ============================================ */
(function () {
  const { createApp, ref, onBeforeUnmount } = Vue;

  createApp({
    setup() {
      /* ── Theme ── */
      const theme = ref(localStorage.getItem('dv-theme') || 'dark');
      const applyTheme = t => {
        theme.value = t;
        localStorage.setItem('dv-theme', t);
        document.documentElement.setAttribute('data-theme', t);
      };
      applyTheme(theme.value);
      const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

      /* ── Navigation ── */
      const validPages = ['dashboard','gallery','realtime','panels','manager','layout'];
      const page = ref('dashboard');
      const sidebarOpen = ref(true);
      const mobileOpen = ref(false);

      function navigate(id) {
        if (!validPages.includes(id)) return;
        page.value = id;
        mobileOpen.value = false;
        window.scrollTo(0, 0);
        try { sessionStorage.setItem('dv_page', id); } catch (e) {}
        try {
          const p = new URLSearchParams();
          p.set('page', id);
          history.replaceState(null, '', window.location.pathname + '#' + p.toString());
        } catch (e) {}
      }

      function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
      function toggleMobile() { mobileOpen.value = !mobileOpen.value; }
      function closeMobile() { mobileOpen.value = false; }

      /* ── Restore page from hash/session ── */
      try {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage)) page.value = hPage;
        else {
          const sp = sessionStorage.getItem('dv_page');
          if (sp && validPages.includes(sp)) page.value = sp;
        }
      } catch (e) {}

      /* ── Close sidebar on small screens ── */
      if (window.innerWidth < 1024) sidebarOpen.value = false;
      window.addEventListener('resize', () => {
        if (window.innerWidth < 1024) mobileOpen.value = false;
      });

      return {
        theme, toggleTheme,
        page, navigate,
        sidebarOpen, mobileOpen, toggleSidebar, toggleMobile, closeMobile,
      };
    },

    template: /* html */ `
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <layout-header
    :page="page" :theme="theme"
    :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
    :navigate="navigate" :toggle-theme="toggleTheme"
    :toggle-sidebar="toggleSidebar" :toggle-mobile="toggleMobile"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <layout-sidebar
      :page="page" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
      :navigate="navigate" :toggle-sidebar="toggleSidebar" :close-mobile="closeMobile"
    />
    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobile"></div>

    <main style="flex:1;overflow-y:auto;min-width:0;">

      <page-dashboard  v-if="page==='dashboard'" :navigate="navigate" />
      <page-gallery    v-else-if="page==='gallery'" />
      <page-realtime   v-else-if="page==='realtime'" />
      <page-panels     v-else-if="page==='panels'" :navigate="navigate" />
      <page-manager    v-else-if="page==='manager'" :navigate="navigate" />
      <page-layout     v-else-if="page==='layout'"  :navigate="navigate" />

      <layout-footer />
    </main>
  </div>

</div>
    `,
  })
  /* Layout */
  .component('LayoutHeader',  window.DvLayout.LayoutHeader)
  .component('LayoutSidebar', window.DvLayout.LayoutSidebar)
  .component('LayoutFooter',  window.DvLayout.LayoutFooter)
  /* Widgets */
  .component('KpiWidget',           window.DvWidgets.KpiWidget)
  .component('LineChartWidget',     window.DvWidgets.LineChartWidget)
  .component('BarChartWidget',      window.DvWidgets.BarChartWidget)
  .component('PieChartWidget',      window.DvWidgets.PieChartWidget)
  .component('AreaChartWidget',     window.DvWidgets.AreaChartWidget)
  .component('RadarChartWidget',    window.DvWidgets.RadarChartWidget)
  .component('ScatterChartWidget',  window.DvWidgets.ScatterChartWidget)
  .component('BubbleChartWidget',   window.DvWidgets.BubbleChartWidget)
  .component('StackedBarWidget',    window.DvWidgets.StackedBarWidget)
  .component('HeatmapWidget',       window.DvWidgets.HeatmapWidget)
  .component('GaugeWidget',         window.DvWidgets.GaugeWidget)
  .component('DataTableWidget',     window.DvWidgets.DataTableWidget)
  .component('RealtimeScatterWidget', window.DvWidgets.RealtimeScatterWidget)
  /* Panels */
  .component('DashboardPanel', window.DvPanels.DashboardPanel)
  .component('AnalyticsPanel', window.DvPanels.AnalyticsPanel)
  .component('RealtimePanel',  window.DvPanels.RealtimePanel)
  .component('GridPanel',      window.DvPanels.GridPanel)
  /* Pages */
  .component('PageDashboard', window.DvPages.Dashboard)
  .component('PageGallery',   window.DvPages.Gallery)
  .component('PageRealtime',  window.DvPages.Realtime)
  .component('PagePanels',    window.DvPages.Panels)
  .component('PageManager',   window.DvPages.WidgetManager)
  .component('PageLayout',    window.DvPages.LayoutManager)
  .mount('#app');
})();
