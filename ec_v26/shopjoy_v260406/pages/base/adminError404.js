/* Admin - 404 Not Found */
window.adminError404 = {
  name: 'AdminError404',
  props: ['navigate', 'pageId'],
  template: /* html */`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
  <div style="font-size:80px;margin-bottom:16px;">🧭</div>
  <div style="font-size:48px;font-weight:800;color:#1a1a2e;letter-spacing:-1px;">404</div>
  <div style="font-size:18px;font-weight:600;color:#555;margin-top:8px;">관리자 페이지를 찾을 수 없습니다</div>
  <div v-if="pageId" style="font-size:13px;color:#999;margin-top:12px;">
    요청 페이지 <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;color:#6a1b9a;">{{ pageId }}</code> 는 존재하지 않습니다.
  </div>
  <button @click="navigate('dashboard')"
    style="margin-top:28px;padding:12px 32px;font-size:14px;font-weight:600;background:#6a1b9a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
    대시보드로
  </button>
</div>
`,
};
