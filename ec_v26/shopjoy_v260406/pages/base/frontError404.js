/* Front - 404 Not Found */
window.frontError404 = {
  name: 'FrontError404',
  props: ['navigate', 'pageId'],
  template: /* html */`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
  <div style="font-size:80px;margin-bottom:16px;">🚫</div>
  <div style="font-size:48px;font-weight:800;color:#222;letter-spacing:-1px;">404</div>
  <div style="font-size:18px;font-weight:600;color:#666;margin-top:8px;">페이지를 찾을 수 없습니다</div>
  <div v-if="pageId" style="font-size:13px;color:#aaa;margin-top:12px;">
    요청하신 페이지 <code style="background:#f5f5f5;padding:2px 8px;border-radius:4px;color:#e53935;">{{ pageId }}</code> 는 존재하지 않습니다.
  </div>
  <button @click="navigate('home')"
    style="margin-top:28px;padding:12px 32px;font-size:14px;font-weight:600;background:#e8587a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
    홈으로 돌아가기
  </button>
</div>
`,
};
