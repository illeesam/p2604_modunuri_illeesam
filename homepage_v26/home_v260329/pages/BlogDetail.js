/* HOME — BLOG DETAIL (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.BlogDetail = {
    name: 'BlogDetail',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-6xl mx-auto">
<div class="mb-6 flex items-center gap-3">
            <button @click="studio.closeBlogDetail"
                    class="btn-outline px-4 py-2 rounded-full text-xs"
                    style="background:transparent;border:1px solid var(--border);color:var(--text-secondary);">
              ← 블로그로
            </button>
            <div class="flex-1"></div>
          </div>

          <div v-if="studio.blogModal.post" class="card p-6 lg:p-7">
            <div class="mb-4">
              <div class="text-3xl mb-2" style="line-height:1;">{{ studio.blogModal.post.emoji }}</div>
              <div class="text-xl font-black" style="color:var(--text-primary);margin-bottom:8px;">{{ studio.blogModal.post.title }}</div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs px-2 py-0.5 rounded font-medium"
                      style="background:var(--amber-dim);color:var(--amber);font-weight:700;">
                  {{ studio.blogModal.post.cat }}
                </span>
                <span class="text-xs" style="color:var(--text-muted);">{{ studio.blogModal.post.date }}</span>
              </div>
              <div class="text-sm leading-relaxed" style="color:var(--text-secondary);white-space:pre-line;">
                {{ studio.blogModal.post.excerpt }}
              </div>
            </div>
          </div>

          <div v-else class="card p-6">
            <div class="text-sm" style="color:var(--text-muted);">선택된 글이 없습니다.</div>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
