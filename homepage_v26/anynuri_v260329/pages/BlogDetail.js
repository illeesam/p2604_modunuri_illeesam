/* ANYNURI — 블로그 상세 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageBlogDetail = {
    name: 'PageBlogDetail',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-5xl mx-auto">
  <div class="mb-6 flex items-center gap-3">
    <button type="button" @click="anynuri.closeBlogDetail"
      class="btn-outline px-4 py-2 rounded-full text-xs"
      style="background:transparent;border:1px solid var(--border);color:var(--text-secondary);">
      ← 블로그로
    </button>
    <div class="flex-1"></div>
  </div>
  <div v-if="anynuri.blogModal.post" class="card p-6 lg:p-7">
    <div class="mb-4">
      <div class="text-3xl mb-2" style="line-height:1;">{{ anynuri.blogModal.post.emoji }}</div>
      <div class="text-xl font-black" style="color:var(--text-primary);margin-bottom:8px;">{{ anynuri.blogModal.post.title }}</div>
      <div class="flex items-center gap-2 mb-3">
        <span class="tag-pill" style="background:var(--blue-dim);border-color:rgba(0,153,204,0.2);color:var(--blue);">{{ anynuri.blogModal.post.tag }}</span>
        <span class="text-xs" style="color:var(--text-muted);">{{ anynuri.blogModal.post.date }}</span>
      </div>
      <div class="text-sm leading-relaxed" style="color:var(--text-secondary);white-space:pre-line;">
        {{ anynuri.blogModal.post.content }}
      </div>
    </div>
  </div>
  <div v-else class="card p-6">
    <div class="text-sm" style="color:var(--text-muted);">선택된 글이 없습니다.</div>
  </div>
</div>
    `,
  };
})(window);
