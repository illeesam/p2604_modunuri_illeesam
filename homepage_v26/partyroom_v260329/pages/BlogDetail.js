/* PARTYROOM — blogDetail (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.BlogDetail = {
    name: 'BlogDetail',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:1000px;margin:0 auto;">
        <div style="margin-bottom:1.25rem;display:flex;align-items:center;gap:10px;">
          <button @click="partyroom.closeBlogDetail"
                  style="display:flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:999px;padding:8px 14px;font-weight:700;font-size:0.85rem;cursor:pointer;">
            ← 블로그로
          </button>
        </div>

        <div v-if="partyroom.blogModal.post" class="card" style="padding:1.5rem;max-width:860px;margin:0 auto;">
          <div style="font-size:2rem;margin-bottom:8px;line-height:1;">{{ partyroom.blogModal.post.emoji }}</div>
          <div style="font-size:1.35rem;font-weight:900;color:var(--text-primary);margin-bottom:10px;line-height:1.25;">{{ partyroom.blogModal.post.title }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;">
            <span class="badge badge-gold">{{ partyroom.blogModal.post.cat }}</span>
            <span style="font-size:0.85rem;color:var(--text-muted);">{{ partyroom.blogModal.post.date }} · {{ partyroom.blogModal.post.readTime }}</span>
          </div>
          <div style="white-space:pre-line;font-size:0.9rem;color:var(--text-secondary);line-height:1.8;">
            {{ partyroom.blogModal.post.desc }}
          </div>
        </div>

        <div v-else class="card" style="padding:1.5rem;max-width:860px;margin:0 auto;">
          <div style="color:var(--text-muted);font-weight:700;">선택된 글이 없습니다.</div>
        </div>
      </div>
    `,
  };
})(window);
