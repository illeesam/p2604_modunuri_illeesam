/* ShopJoy - Location Page (위치안내) */
window.Location = {
  name: 'Location',
  props: ['navigate', 'config'],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">위치안내</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;"><span class="gradient-text">오시는</span> 방법</h1>
    <p class="section-subtitle">ShopJoy를 직접 방문해주세요. 언제나 반갑게 맞이하겠습니다.</p>
  </div>

  <!-- 지도 영역 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
    <!-- 카카오맵 정적 지도 대체 (주소 표시 스타일) -->
    <div style="height:280px;background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;opacity:0.3;"
        style="background-image:repeating-linear-gradient(0deg,var(--border) 0,var(--border) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,var(--border) 0,var(--border) 1px,transparent 1px,transparent 40px);">
      </div>
      <!-- 도로 시뮬레이션 배경 -->
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:60%;height:30px;background:rgba(255,255,255,0.15);border-radius:4px;"></div>
      </div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:1;">
        <div style="font-size:3rem;margin-bottom:8px;">📍</div>
        <div style="background:var(--blue);color:#fff;padding:8px 20px;border-radius:24px;font-size:0.88rem;font-weight:700;box-shadow:0 4px 16px rgba(59,130,246,0.4);">
          ShopJoy 본사
        </div>
      </div>
    </div>
    <!-- 카카오맵 바로가기 -->
    <div style="padding:14px 20px;background:var(--bg-card);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:0.85rem;color:var(--text-secondary);">📍 경기도 성남시 중원구 성남대로 997번길 49-14 201호</div>
      <a href="https://map.kakao.com/?q=경기도 성남시 중원구 성남대로 997번길 49-14" target="_blank" rel="noopener"
        style="padding:7px 16px;background:#FEE500;color:#3c1e1e;border-radius:8px;font-size:0.8rem;font-weight:700;text-decoration:none;white-space:nowrap;display:flex;align-items:center;gap:5px;flex-shrink:0;margin-left:12px;">
        🗺️ 카카오맵
      </a>
    </div>
  </div>

  <!-- 상세 정보 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:24px;">

    <!-- 주소 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📍</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">주소</div>
      </div>
      <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
        <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">경기도 성남시 중원구</div>
        <div>성남대로 997번길 49-14, 201호</div>
        <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted);">우편번호: 13401</div>
      </div>
    </div>

    <!-- 영업시간 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🕐</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">영업시간</div>
      </div>
      <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
        <div style="display:flex;justify-content:space-between;">
          <span>월요일 ~ 금요일</span><span style="font-weight:700;color:var(--text-primary);">09:00 – 18:00</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>토요일</span><span style="font-weight:700;color:var(--text-primary);">10:00 – 15:00</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>일요일 / 공휴일</span><span style="font-weight:600;color:#ef4444;">휴무</span>
        </div>
      </div>
    </div>

    <!-- 연락처 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📞</div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">연락처</div>
      </div>
      <div style="font-size:0.87rem;color:var(--text-secondary);line-height:2;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>전화</span>
          <a :href="'tel:'+(config&&config.tel||'010-3805-0206')"
            style="font-weight:700;color:var(--blue);text-decoration:none;">{{ config&&config.tel||'010-3805-0206' }}</a>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>이메일</span>
          <a :href="'mailto:'+(config&&config.email||'illeesam@gmail.com')"
            style="font-weight:700;color:var(--blue);text-decoration:none;font-size:0.82rem;">{{ config&&config.email||'illeesam@gmail.com' }}</a>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <span>카카오채널</span>
          <span style="font-weight:700;color:var(--text-primary);">@shopjoy</span>
        </div>
      </div>
    </div>

  </div>

  <!-- 교통편 안내 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:16px;">🚌 교통편 안내</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚇 지하철</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>8호선 성남역 2번 출구</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">도보 약 10분</div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚌 버스</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>성남대로 정류장 하차</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">220, 500번 이용</div>
        </div>
      </div>
      <div style="padding:14px;background:var(--bg-base);border-radius:10px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">🚗 자가용</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
          <div>성남IC에서 약 5분</div>
          <div style="color:var(--text-muted);font-size:0.78rem;">건물 내 주차 가능 (무료 2시간)</div>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  setup() { return {}; }
};
