/* HOME — BLOG (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.Blog = {
    name: 'Blog',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-6xl mx-auto">
<h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">블로그</h1>
          <p class="section-subtitle mb-8">개발, 디자인, 전략에 대한 인사이트</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="post in studio.posts" :key="post.id" class="portfolio-card" style="cursor:pointer;" @click="studio.openBlogDetail(post)">
              <div class="flex items-center justify-center"
                   :style="'height:140px;font-size:4rem;background:'+post.bg">{{ post.emoji }}</div>
              <div class="p-5">
                <span class="text-xs px-2 py-0.5 rounded mb-2 inline-block font-medium"
                      style="background:var(--amber-dim);color:var(--amber)">{{ post.cat }}</span>
                <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">{{ post.title }}</h3>
                <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ post.excerpt }}</p>
                <div class="text-xs" style="color:var(--text-muted)">{{ post.date }}</div>
              </div>
            </div>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
