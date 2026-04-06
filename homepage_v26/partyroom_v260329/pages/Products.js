/* PARTYROOM — products (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Products = {
    name: 'Products',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:1100px;margin:0 auto;">
        <div style="margin-bottom:1.5rem;">
          <h1 class="section-title">상품목록</h1>
          <p class="section-subtitle">총 {{ partyroom.rooms.length }}개 공간 · 원하는 태그로 필터링하세요.</p>
        </div>

        <!-- Tag filter -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem;">
          <span
            v-for="tag in partyroom.allTags"
            :key="tag"
            class="tag-pill clickable"
            :class="{ 'tag-active': partyroom.activeTag === tag }"
            @click="partyroom.setActiveTag(tag)"
          >{{ tag }}</span>
        </div>

        <!-- Search -->
        <div style="margin-bottom:28px;">
          <input
            v-model="partyroom.searchText"
            type="text"
            class="form-input w-full md:w-72"
            placeholder="공간명 검색"
            @input="partyroom.resetPagination"
          />
        </div>

        <!-- Room grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;">
          <div
            v-for="room in partyroom.displayedRooms"
            :key="room.roomId"
            class="room-card"
          >
            <div class="room-thumb">{{ room.emoji }}</div>
            <div style="padding:1.25rem;">
              <div style="font-weight:800;font-size:1rem;margin-bottom:4px;color:var(--text-primary);">{{ room.roomName }}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">{{ room.capacity }} · {{ room.area }}</div>

              <!-- Features -->
              <ul style="list-style:none;margin-bottom:12px;">
                <li
                  v-for="f in room.features"
                  :key="f"
                  style="font-size:0.78rem;color:var(--text-secondary);padding:2px 0;display:flex;align-items:center;gap:6px;"
                >
                  <span style="color:var(--gold);font-size:0.65rem;">●</span>{{ f }}
                </li>
              </ul>

              <!-- Tags -->
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
                <span v-for="tag in room.tags" :key="tag" class="tag-pill">{{ tag }}</span>
              </div>

              <!-- Prices -->
              <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
                <div>
                  <div style="display:flex;align-items:baseline;gap:3px;">
                    <span class="price-tag" style="font-size:1.1rem;">{{ room.hourly.toLocaleString() }}</span>
                    <span class="price-unit">원/시간</span>
                  </div>
                  <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">
                    일 {{ room.daily.toLocaleString() }}원
                  </div>
                </div>
              </div>

              <button class="btn-gold" style="width:100%;justify-content:center;font-size:0.82rem;" @click="partyroom.selectRoom(room)">
                상세보기 →
              </button>
            </div>
          </div>
        </div>

        <div v-if="partyroom.filteredRooms.length === 0" style="text-align:center;padding:4rem;color:var(--text-muted);">
          해당 조건의 공간이 없습니다.
        </div>

        <div id="partyroom-products-sentinel" v-show="partyroom.hasMore" style="height:1px;"></div>
      </div>
    `,
  };
})(window);
