/* Admin - 401 Unauthorized */
window.adminError401 = {
  name: 'AdminError401',
  props: ['navigate'],
  methods: {
    reloadPage() { location.reload(); },
  },
  template: /* html */`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
  <div style="font-size:80px;margin-bottom:16px;">🔒</div>
  <div style="font-size:48px;font-weight:800;color:#1a1a2e;letter-spacing:-1px;">401</div>
  <div style="font-size:18px;font-weight:600;color:#555;margin-top:8px;">관리자 로그인이 필요합니다</div>
  <div style="font-size:13px;color:#999;margin-top:12px;">
    세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.
  </div>
  <div style="display:flex;gap:10px;margin-top:28px;">
    <button @click="reloadPage"
      style="padding:12px 28px;font-size:14px;font-weight:600;background:#6a1b9a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      로그인 화면으로
    </button>
  </div>
</div>
`,
};
