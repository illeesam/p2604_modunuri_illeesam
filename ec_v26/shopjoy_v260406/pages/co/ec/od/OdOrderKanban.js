/**
 * OdOrderKanban.js — 주문/클레임 칸반 보드 (FO/BO 공용)
 *
 * 주문 진행상태, 클레임(취소/반품/교환) 진행상태를 칸반 보드로 시각화.
 * 카드를 드래그하거나 버튼 클릭으로 상태 이동 (validation 포함).
 *
 * Props:
 *   orderId      — 주문 ID (필수)
 *   orderItemId  — 주문항목 ID (선택). 일치 행 bold/파란 테두리 강조.
 *   claimId      — 클레임 ID (선택). 일치 클레임 행 강조.
 *   mode         — 'bo'(관리자, 기본) | 'fo'(사용자, 읽기전용)
 *   asModal      — true 면 닫기 버튼 노출
 *   onClose      — 닫기 콜백
 *   showToast    — 토스트 함수 (미전달 시 boApp fallback)
 *   showConfirm  — 확인 모달 함수 (미전달 시 boApp fallback)
 *
 * 상태코드 (DB 기준):
 *   ORDER_ITEM_STATUS: ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED
 *   CLAIM_TYPE       : CANCEL/RETURN/EXCHANGE
 *   CLAIM_STATUS     : REQUESTED/APPROVED/IN_PICKUP/PROCESSING/COMPLT/REJECTED/CANCELLED
 */

/* ── 스타일 한 번만 주입 ── */
(function () {
  if (document.getElementById('od-kanban-style-v2')) return;
  var old = document.getElementById('od-kanban-style'); if (old) old.remove();
  var s = document.createElement('style');
  s.id = 'od-kanban-style-v2';
  s.textContent = [
    /* ── 기본 래퍼 ── */
    '.od-kanban-wrap{font-family:inherit;color:#1f2937;background:#f8fafc;border-radius:12px;overflow:hidden;}',
    /* ── 헤더 ── */
    '.od-kanban-hdr{display:flex;align-items:center;gap:12px;padding:12px 12px 10px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);flex-wrap:wrap;}',
    '.od-kanban-hdr-title{font-size:15px;font-weight:700;color:#f1f5f9;letter-spacing:-.3px;}',
    '.od-kanban-hdr-id{font-size:11px;color:#94a3b8;font-family:monospace;background:rgba(255,255,255,.08);padding:2px 8px;border-radius:6px;}',
    '.od-kanban-hdr-id.hl-id{color:#60a5fa;font-weight:800;}',
    '.od-kanban-hdr-close{margin-left:auto;background:rgba(255,255,255,.1);border:none;font-size:16px;cursor:pointer;color:#94a3b8;padding:4px 8px;border-radius:6px;}',
    '.od-kanban-hdr-close:hover{background:rgba(239,68,68,.3);color:#fca5a5;}',
    /* ── 주문 요약 ── */
    '.od-kanban-order-info{display:flex;gap:0;flex-wrap:wrap;padding:0;font-size:12px;background:#fff;border-bottom:2px solid #e2e8f0;}',
    '.od-kanban-order-info>div{display:flex;flex-direction:column;padding:8px 12px;border-right:1px solid #f1f5f9;gap:2px;}',
    '.od-kanban-order-info dt{color:#94a3b8;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;}',
    '.od-kanban-order-info dd{font-weight:700;color:#1e293b;margin:0;font-size:13px;}',
    '.od-kanban-status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#dbeafe;color:#1d4ed8;letter-spacing:.3px;}',
    /* ── 섹션 공통 ── */
    '.od-kanban-section{padding:8px 8px 0;}',
    '.od-kanban-section-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;letter-spacing:.2px;}',
    '.od-kanban-hl-badge{font-size:10px;font-weight:700;background:#3b82f6;color:#fff;padding:2px 7px;border-radius:10px;}',
    /* ── 칸반 보드 공통 ── */
    '.od-kanban-board{display:flex;gap:1px;overflow-x:auto;padding-bottom:0;width:100%;background:#e2e8f0;border-radius:10px;overflow:hidden;}',
    '.od-kanban-col{flex:1 1 130px;min-width:120px;display:flex;flex-direction:column;}',
    '.od-kanban-col-hdr{text-align:center;padding:6px 4px 5px;background:#f1f5f9;border-top:3px solid #cbd5e1;font-size:10px;font-weight:700;color:#64748b;transition:all .15s;line-height:1.3;letter-spacing:.2px;}',
    '.od-kanban-col-hdr.drag-over-col{background:#fef9c3;border-top-color:#f59e0b;}',
    '.od-kanban-col-body{flex:1;min-height:0;padding:5px 5px 4px;background:#f8fafc;transition:background .15s;}',
    '.od-kanban-col-body.drag-over-body{background:#fef9c3;}',
    /* ── 카드 공통 ── */
    '.od-kanban-card{background:linear-gradient(160deg,#fffdf8 0%,#fdf8f0 60%,#faf4ea 100%);border:1px solid #e8dfd0;border-radius:10px;margin-bottom:6px;font-size:11px;transition:box-shadow .2s,transform .1s;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.04);max-width:160px;}',
    '.od-kanban-card:hover{box-shadow:0 6px 16px rgba(0,0,0,.12),0 2px 4px rgba(0,0,0,.06);transform:translateY(-1px);}',
    '.od-kanban-card.dragging-card{opacity:.4;transform:scale(1.02);}',
    '.od-kanban-card.locked-card{border-color:#fca5a5;background:linear-gradient(160deg,#fff7f7,#fff0f0);}',
    /* 카드 내용 영역 */
    '.od-kanban-card-body{padding:6px 9px 8px;background:transparent;}',
    '.od-kanban-card-nm{font-weight:600;color:#1e293b;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;font-size:11px;}',
    '.od-kanban-card-meta{color:#94a3b8;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.od-kanban-card-qty{font-size:10px;color:#64748b;font-weight:500;margin-left:4px;background:#f1f5f9;padding:0 4px;border-radius:4px;}',
    /* ── 카드 헤더 ── */
    '.od-kanban-card-hdr{display:flex;align-items:center;gap:4px;padding:5px 8px 5px;cursor:default;border-bottom:1px solid #ede5d8;}',
    '.od-kanban-drag-handle{font-size:14px;color:#94a3b8;cursor:grab;padding:0 3px;flex-shrink:0;line-height:1;border-radius:3px;transition:color .1s,background .1s;}',
    '.od-kanban-drag-handle:hover{color:#475569;background:rgba(0,0,0,.06);}',
    '.od-kanban-drag-handle:active{cursor:grabbing;color:#1e293b;}',
    '.od-kanban-card-hdr-id{font-family:monospace;font-size:10px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;user-select:text;-webkit-user-select:text;cursor:text;}',
    '.od-kanban-card-hdr-id.hl-id{color:#1d4ed8;font-weight:800;}',
    '.od-kanban-card-hdr-sub{font-family:monospace;font-size:9px;opacity:.6;margin-left:1px;}',
    '.od-kanban-card-hdr-icons{display:flex;align-items:center;gap:1px;flex-shrink:0;}',
    '.od-kanban-card-icon-btn{background:none;border:none;cursor:pointer;padding:1px 2px;border-radius:4px;font-size:11px;line-height:1;opacity:.7;transition:opacity .1s,background .1s;}',
    '.od-kanban-card-icon-btn:hover{opacity:1;background:rgba(0,0,0,.06);}',
    /* ─────────────────────────────────────────────
       주문(ORDER): 초록 계열
    ───────────────────────────────────────────── */
    /* 섹션 타이틀 */
    '.kanban-theme-order .od-kanban-section-title-bar{background:linear-gradient(90deg,#dcfce7,#f0fdf4);border-left:4px solid #16a34a;border-top:2px solid #16a34a;padding:5px 8px;border-radius:0 6px 6px 0;margin-bottom:6px;}',
    /* 열 헤더 */
    '.kanban-theme-order .od-kanban-col-hdr{border-top-color:#d1d5db;}',
    '.kanban-theme-order .od-kanban-col-hdr.active-col{border-top-color:#16a34a;background:#dcfce7;color:#14532d;font-weight:800;}',
    /* 카드 */
    '.kanban-theme-order .od-kanban-card.hl-card{border-color:#16a34a;box-shadow:0 0 0 2px rgba(22,163,74,.25);}',
    /* 카드 헤더 배경 */
    '.kanban-theme-order .od-kanban-card-hdr{background:linear-gradient(90deg,#f0fdf4,#fdfff5);}',
    '.kanban-theme-order .od-kanban-card-hdr-id{color:#15803d;}',
    /* drop-zone 활성 */
    '.kanban-theme-order .od-kanban-col-body.drag-over-body{background:#dcfce7;}',
    /* ─────────────────────────────────────────────
       취소(CANCEL): 적색 계열
    ───────────────────────────────────────────── */
    '.kanban-theme-cancel .od-kanban-section-title-bar{background:linear-gradient(90deg,#fee2e2,#fff1f2);border-left:4px solid #dc2626;border-top:2px solid #dc2626;padding:5px 8px;border-radius:0 6px 6px 0;margin-bottom:6px;}',
    '.kanban-theme-cancel .od-kanban-col-hdr{border-top-color:#d1d5db;}',
    '.kanban-theme-cancel .od-kanban-col-hdr.active-col{border-top-color:#dc2626;background:#fee2e2;color:#7f1d1d;font-weight:800;}',
    '.kanban-theme-cancel .od-kanban-card.hl-card{border-color:#dc2626;box-shadow:0 0 0 2px rgba(220,38,38,.2);}',
    '.kanban-theme-cancel .od-kanban-card-hdr{background:linear-gradient(90deg,#fff1f2,#fff8f8);}',
    '.kanban-theme-cancel .od-kanban-card-hdr-id{color:#b91c1c;}',
    '.kanban-theme-cancel .od-kanban-col-body.drag-over-body{background:#fee2e2;}',
    /* ─────────────────────────────────────────────
       반품(RETURN): 분홍 계열
    ───────────────────────────────────────────── */
    '.kanban-theme-return .od-kanban-section-title-bar{background:linear-gradient(90deg,#fce7f3,#fdf2f8);border-left:4px solid #db2777;border-top:2px solid #db2777;padding:5px 8px;border-radius:0 6px 6px 0;margin-bottom:6px;}',
    '.kanban-theme-return .od-kanban-col-hdr{border-top-color:#d1d5db;}',
    '.kanban-theme-return .od-kanban-col-hdr.active-col{border-top-color:#db2777;background:#fce7f3;color:#831843;font-weight:800;}',
    '.kanban-theme-return .od-kanban-card.hl-card{border-color:#db2777;box-shadow:0 0 0 2px rgba(219,39,119,.2);}',
    '.kanban-theme-return .od-kanban-card-hdr{background:linear-gradient(90deg,#fdf2f8,#fff8fc);}',
    '.kanban-theme-return .od-kanban-card-hdr-id{color:#be185d;}',
    '.kanban-theme-return .od-kanban-col-body.drag-over-body{background:#fce7f3;}',
    /* ─────────────────────────────────────────────
       교환(EXCHANGE): 파랑 계열
    ───────────────────────────────────────────── */
    '.kanban-theme-exchange .od-kanban-section-title-bar{background:linear-gradient(90deg,#dbeafe,#eff6ff);border-left:4px solid #2563eb;border-top:2px solid #2563eb;padding:5px 8px;border-radius:0 6px 6px 0;margin-bottom:6px;}',
    '.kanban-theme-exchange .od-kanban-col-hdr{border-top-color:#d1d5db;}',
    '.kanban-theme-exchange .od-kanban-col-hdr.active-col{border-top-color:#2563eb;background:#dbeafe;color:#1e3a8a;font-weight:800;}',
    '.kanban-theme-exchange .od-kanban-card.hl-card{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.2);}',
    '.kanban-theme-exchange .od-kanban-card-hdr{background:linear-gradient(90deg,#eff6ff,#f8fbff);}',
    '.kanban-theme-exchange .od-kanban-card-hdr-id{color:#1d4ed8;}',
    '.kanban-theme-exchange .od-kanban-col-body.drag-over-body{background:#dbeafe;}',
    /* ── 교환 2행 레이아웃 ── */
    '.od-kanban-exchange-rows{display:flex;flex-direction:column;gap:6px;}',
    '.od-kanban-exchange-row-wrap{display:flex;align-items:stretch;gap:0;}',
    '.od-kanban-exchange-row-label{writing-mode:vertical-rl;text-orientation:mixed;font-size:10px;font-weight:600;color:rgba(255,255,255,.82);letter-spacing:1px;padding:8px 0;display:flex;align-items:center;justify-content:center;min-width:22px;white-space:nowrap;border-radius:6px 0 0 6px;flex-shrink:0;}',
    '.od-kanban-exchange-row-label.row-pickup{background:linear-gradient(180deg,#a78bfa,#8b5cf6);}',
    '.od-kanban-exchange-row-label.row-dliv{background:linear-gradient(180deg,#60a5fa,#3b82f6);}',
    '.od-kanban-exchange-row-label.row-refund{background:linear-gradient(180deg,#f472b6,#db2777);}',
    '.od-kanban-exchange-row-board{flex:1;border-radius:0 8px 8px 0;overflow:hidden;}',
    /* ── 정산/잠금 뱃지 ── */
    '.od-kanban-settle{display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;}',
    '.od-kanban-settle-badge{display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:600;padding:1px 6px;border-radius:8px;white-space:nowrap;}',
    '.od-kanban-settle-badge.settle-locked{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}',
    '.od-kanban-settle-badge.settle-closed{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}',
    '.od-kanban-settle-badge.settle-pending{background:#fffbeb;color:#d97706;border:1px solid #fcd34d;}',
    '.od-kanban-settle-badge.settle-voucher{background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;}',
    '.od-kanban-move-btn.btn-locked{opacity:.4;cursor:not-allowed;}',
    /* ── ID 패널 ── */
    '.od-kanban-id-panel{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:8px 12px;display:flex;align-items:flex-start;gap:6px;}',
    '.od-kanban-id-chips{display:flex;gap:5px;flex-wrap:wrap;flex:1;}',
    '.od-kanban-id-toggle{background:none;border:none;cursor:pointer;font-size:11px;color:#94a3b8;padding:2px 6px;border-radius:4px;display:flex;align-items:center;gap:3px;font-weight:600;letter-spacing:.2px;flex-shrink:0;}',
    '.od-kanban-id-toggle:hover{background:#e2e8f0;color:#475569;}',
    '.od-kanban-id-chip{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;cursor:pointer;border:1.5px solid transparent;font-family:monospace;white-space:nowrap;transition:all .15s;letter-spacing:.2px;}',
    '.od-kanban-id-chip:hover{filter:brightness(.92);transform:translateY(-1px);box-shadow:0 2px 6px rgba(0,0,0,.12);}',
    '.od-kanban-id-chip.chip-order  {background:#dcfce7;color:#15803d;border-color:#86efac;}',
    '.od-kanban-id-chip.chip-item   {background:#dbeafe;color:#1d4ed8;border-color:#93c5fd;}',
    '.od-kanban-id-chip.chip-claim  {background:#fce7f3;color:#be185d;border-color:#f9a8d4;}',
    '.od-kanban-id-chip.chip-citem  {background:#ede9fe;color:#6d28d9;border-color:#c4b5fd;}',
    '.od-kanban-id-chip.chip-dliv   {background:#ffedd5;color:#c2410c;border-color:#fdba74;}',
    '.od-kanban-id-chip.chip-active {box-shadow:0 0 0 2.5px currentColor;filter:brightness(.88);}',
    '.od-kanban-id-chip-val{margin-left:4px;font-weight:400;opacity:.75;font-size:9px;letter-spacing:0;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle;}',
    /* 전체 ID 하이라이트 — 같은 종류 ID가 화면에 보일 때 */
    /* ── 검색바 ── */
    '.od-kanban-search{padding:10px 20px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}',
    '.od-kanban-search-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
    '.od-kanban-search-label{font-size:11px;color:#64748b;font-weight:600;white-space:nowrap;}',
    '.od-kanban-search input,.od-kanban-search select{border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:12px;background:#f8fafc;color:#1e293b;outline:none;transition:border .15s,box-shadow .15s;}',
    '.od-kanban-search input:focus,.od-kanban-search select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);background:#fff;}',
    '.od-kanban-search .btn-search{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(99,102,241,.3);}',
    '.od-kanban-search .btn-search:hover{background:linear-gradient(135deg,#4f46e5,#4338ca);}',
    '.od-kanban-search .btn-reset{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;}',
    '.od-kanban-search .btn-reset:hover{background:#e2e8f0;}',
    /* ── 강조 표시 행 ── */
    '.od-kanban-hl-row{padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
    '.od-kanban-hl-row-label{font-size:10px;color:#94a3b8;font-weight:700;white-space:nowrap;letter-spacing:.5px;text-transform:uppercase;}',
    '.od-kanban-hl-row input{border:1px solid #e2e8f0;border-radius:6px;padding:3px 10px;font-size:12px;background:#fff;color:#1e293b;width:190px;font-family:monospace;outline:none;}',
    '.od-kanban-hl-row input:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.15);}',
    '.od-kanban-hl-tag{display:inline-flex;align-items:center;gap:5px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;font-family:monospace;}',
    '.od-kanban-hl-tag button{background:none;border:none;color:#93c5fd;cursor:pointer;font-size:12px;padding:0 2px;line-height:1;}',
    '.od-kanban-hl-tag button:hover{color:#1d4ed8;}',
    /* ── 기타 ── */
    '.od-kanban-empty{color:#cbd5e1;text-align:center;font-size:11px;padding:20px 0;}',
    /* ── 검색 picker 버튼 ── */
    '.od-kanban-pick-btn{border:1px solid #e2e8f0;background:#f1f5f9;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;color:#475569;line-height:1.4;flex-shrink:0;transition:background .1s;}',
    '.od-kanban-pick-btn:hover{background:#e2e8f0;color:#1e293b;}',
    /* ── picker 모달 ── */
    '.od-kanban-pick-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9990;display:flex;align-items:center;justify-content:center;}',
    '.od-kanban-pick-box{background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.22);width:840px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;}',
    '.od-kanban-pick-hdr{display:flex;align-items:center;gap:10px;padding:13px 18px 12px;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);border-bottom:1px solid #fbc4d4;flex-shrink:0;}',
    '.od-kanban-pick-hdr-title{font-size:14px;font-weight:700;color:#1e293b;flex:1;}',
    '.od-kanban-pick-hdr-close{background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;padding:2px 4px;border-radius:6px;line-height:1;transition:background .1s,color .1s;}',
    '.od-kanban-pick-hdr-close:hover{background:rgba(239,68,68,.12);color:#ef4444;}',
    '.od-kanban-pick-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px;flex:1;overflow:hidden;}',
    '.od-kanban-pick-search{display:flex;flex-direction:column;gap:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;flex-shrink:0;}',
    '.od-kanban-pick-search-row{display:flex;align-items:center;gap:0;padding:7px 12px;border-bottom:1px solid #e2e8f0;}',
    '.od-kanban-pick-search-row:last-child{border-bottom:none;}',
    '.od-kanban-pick-search-lbl{font-size:11px;font-weight:600;color:#64748b;white-space:nowrap;min-width:44px;padding-right:8px;}',
    '.od-kanban-pick-search-fields{display:flex;gap:6px;align-items:center;flex:1;}',
    '.od-kanban-pick-search input{border:1px solid #e2e8f0;border-radius:5px;padding:5px 9px;font-size:12px;outline:none;background:#fff;height:28px;box-sizing:border-box;}',
    '.od-kanban-pick-search input[type=date]{font-size:12px;}',
    '.od-kanban-pick-search input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.12);}',
    '.od-kanban-pick-search button{border:none;border-radius:5px;padding:5px 16px;font-size:12px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;white-space:nowrap;height:28px;}',
    '.od-kanban-pick-table{min-height:260px;flex:1;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;}',
    '.od-kanban-pick-pager{display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 0 2px;flex-shrink:0;}',
    '.od-kanban-pick-pager-btn{border:1px solid #e2e8f0;background:#fff;border-radius:5px;padding:3px 9px;font-size:12px;cursor:pointer;color:#475569;line-height:1.4;}',
    '.od-kanban-pick-pager-btn:hover{background:#f1f5f9;}',
    '.od-kanban-pick-pager-btn.active{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-color:#6366f1;font-weight:700;}',
    '.od-kanban-pick-pager-btn:disabled{opacity:.35;cursor:default;}',
    '.od-kanban-pick-pager-info{font-size:11px;color:#94a3b8;margin:0 6px;}',
    '.od-kanban-pick-table table{width:100%;border-collapse:collapse;font-size:12px;}',
    '.od-kanban-pick-table th{background:#f8fafc;padding:7px 10px;text-align:left;font-weight:700;color:#64748b;font-size:11px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;}',
    '.od-kanban-pick-table td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#1e293b;vertical-align:middle;}',
    '.od-kanban-pick-table tr:last-child td{border-bottom:none;}',
    '.od-kanban-pick-table tr:hover td{background:#f0f9ff;cursor:pointer;}',
    '.od-kanban-pick-row-select{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;}',
    '.od-kanban-pick-empty{text-align:center;color:#cbd5e1;padding:32px;font-size:12px;}',
    '.od-kanban-pick-loading{text-align:center;color:#94a3b8;padding:24px;font-size:12px;}',
    /* ── 카드 액션 버튼 ── */
    /* ── 메모 다이얼로그 ── */
    '.od-kanban-memo-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;}',
    '.od-kanban-memo-box{background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.22);min-width:320px;max-width:600px;width:94%;max-height:90vh;overflow-y:auto;}',
    '.od-kanban-memo-hdr{display:flex;align-items:center;gap:10px;padding:13px 18px 12px;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);border-bottom:1px solid #fbc4d4;}',
    '.od-kanban-memo-hdr-icon{font-size:18px;line-height:1;}',
    '.od-kanban-memo-title{font-size:14px;font-weight:700;color:#1e293b;flex:1;}',
    '.od-kanban-memo-hdr-close{background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;padding:2px 4px;border-radius:6px;line-height:1;transition:background .1s,color .1s;}',
    '.od-kanban-memo-hdr-close:hover{background:rgba(239,68,68,.12);color:#ef4444;}',
    '.od-kanban-memo-body{padding:16px 20px 18px;}',
    '.od-kanban-memo-desc{font-size:12px;color:#64748b;margin-bottom:12px;}',
    '.od-kanban-memo-label{font-size:11px;font-weight:600;color:#475569;margin-bottom:4px;}',
    '.od-kanban-memo-ta{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:12px;resize:vertical;min-height:72px;font-family:inherit;outline:none;color:#1e293b;}',
    '.od-kanban-memo-ta:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15);}',
    '.od-kanban-dliv-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:12px;}',
    '.od-kanban-dliv-section-title{font-size:11px;font-weight:700;color:#4f46e5;margin-bottom:10px;display:flex;align-items:center;gap:5px;}',
    '.od-kanban-dliv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;}',
    '.od-kanban-dliv-pair{display:flex;flex-direction:column;gap:3px;}',
    '.od-kanban-dliv-pair-lbl{font-size:11px;font-weight:600;color:#475569;margin-bottom:2px;}',
    '.od-kanban-dliv-pair-lbl.req::after{content:" *";color:#ef4444;}',
    '.od-kanban-dliv-pair-row{display:flex;gap:4px;align-items:center;}',
    '.od-kanban-dliv-courier-sel{flex:1;width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;padding:5px 8px;font-size:12px;background:#fff;color:#1e293b;outline:none;cursor:pointer;}',
    '.od-kanban-dliv-courier-sel:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.15);}',
    '.od-kanban-dliv-courier-sel.err{border-color:#ef4444;}',
    '.od-kanban-dliv-input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;padding:5px 8px;font-size:12px;outline:none;color:#1e293b;}',
    '.od-kanban-dliv-input:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.15);}',
    '.od-kanban-dliv-input.err{border-color:#ef4444;}',
    '.od-kanban-dliv-err{font-size:10px;color:#ef4444;margin-top:1px;}',
    '.od-kanban-item-rows{margin:10px 0 2px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;}',
    '.od-kanban-item-rows-hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;}',
    '.od-kanban-item-rows-title{font-size:12px;font-weight:700;color:#334155;}',
    '.od-kanban-item-rows-all-btn{font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid #6366f1;background:#fff;color:#6366f1;cursor:pointer;font-weight:600;}',
    '.od-kanban-item-rows-all-btn:hover{background:#eef2ff;}',
    '.od-kanban-item-table{width:100%;border-collapse:collapse;font-size:11px;}',
    '.od-kanban-item-table th{background:#f8fafc;padding:4px 6px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;}',
    '.od-kanban-item-table td{padding:4px 6px;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#1e293b;}',
    '.od-kanban-item-table tr:last-child td{border-bottom:none;}',
    '.od-kanban-item-table tr.row-checked{background:#f0fdf4;}',
    '.od-kanban-claim-qty-input{width:52px;text-align:right;border:1px solid #cbd5e1;border-radius:5px;padding:2px 5px;font-size:11px;outline:none;}',
    '.od-kanban-claim-qty-input:focus{border-color:#6366f1;}',
    '.od-kanban-calc-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);z-index:10000;display:flex;align-items:center;justify-content:center;}',
    '.od-kanban-calc-box{background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.22);width:560px;max-width:96vw;max-height:90vh;overflow-y:auto;}',
    '.od-kanban-calc-hdr{display:flex;align-items:center;gap:8px;padding:14px 18px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #bbf7d0;border-radius:16px 16px 0 0;}',
    '.od-kanban-calc-hdr-icon{font-size:18px;}',
    '.od-kanban-calc-hdr-title{flex:1;font-size:14px;font-weight:800;color:#14532d;}',
    '.od-kanban-calc-hdr-close{background:none;border:none;font-size:16px;color:#6b7280;cursor:pointer;padding:2px 6px;border-radius:6px;}',
    '.od-kanban-calc-hdr-close:hover{background:#f3f4f6;}',
    '.od-kanban-calc-body{padding:16px 18px;}',
    '.od-kanban-calc-section{margin-bottom:14px;}',
    '.od-kanban-calc-section-title{font-size:11px;font-weight:800;color:#374151;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #f3f4f6;}',
    '.od-kanban-calc-row{display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12px;color:#374151;}',
    '.od-kanban-calc-row.total{border-top:2px solid #e5e7eb;margin-top:4px;padding-top:8px;font-weight:800;font-size:13px;}',
    '.od-kanban-calc-row.refund{color:#059669;font-weight:700;}',
    '.od-kanban-calc-row.deduct{color:#dc2626;}',
    '.od-kanban-calc-label{color:#6b7280;flex:1;}',
    '.od-kanban-calc-value{font-weight:600;font-family:monospace;font-size:12px;}',
    '.od-kanban-calc-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;}',
    '.od-kanban-calc-chip.green{background:#dcfce7;color:#15803d;}',
    '.od-kanban-calc-chip.orange{background:#ffedd5;color:#c2410c;}',
    '.od-kanban-calc-chip.blue{background:#dbeafe;color:#1d4ed8;}',
    '.od-kanban-calc-chip.gray{background:#f3f4f6;color:#6b7280;}',
    '.od-kanban-calc-note{font-size:10px;color:#9ca3af;margin-top:8px;padding:6px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #e5e7eb;}',
    '.od-kanban-calc-actions{display:flex;justify-content:center;padding:12px 18px;border-top:1px solid #f3f4f6;}',
    '.od-kanban-calc-close-btn{padding:7px 24px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;color:#374151;font-size:13px;font-weight:600;cursor:pointer;}',
    '.od-kanban-calc-close-btn:hover{background:#f1f5f9;}',
    '.od-kanban-calc-items-table{width:100%;border-collapse:collapse;font-size:11px;margin:4px 0;}',
    '.od-kanban-calc-items-table th{background:#f8fafc;padding:3px 6px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;}',
    '.od-kanban-calc-items-table td{padding:3px 6px;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#1e293b;}',
    '.od-kanban-calc-promo-tag{display:inline-block;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;margin:1px 2px;}',
    '.od-kanban-calc-loading{text-align:center;padding:30px;color:#94a3b8;font-size:13px;}',
    '.od-kanban-memo-actions{display:flex;gap:8px;justify-content:center;margin-top:14px;}',
    '.od-kanban-memo-btn-ok{padding:6px 18px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:13px;font-weight:700;cursor:pointer;}',
    '.od-kanban-memo-btn-ok:hover{filter:brightness(.93);}',
    '.od-kanban-memo-btn-cancel{padding:6px 14px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:13px;cursor:pointer;}',
    '.od-kanban-memo-btn-cancel:hover{background:#f1f5f9;}',
    '.od-kanban-card-actions{display:flex;align-items:center;justify-content:center;padding:3px 6px 3px;border-top:1px solid #ede5d8;background:linear-gradient(90deg,#fdf8f0,#faf4ea);gap:4px;}',
    '.od-kanban-card-actions-left{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;flex:1;}',
    '.od-kanban-card-actions-right{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-start;flex:1;}',
    '.od-kanban-card-actions-divider{width:1px;height:12px;background:#e2e8f0;flex-shrink:0;}',
    '.od-kanban-act-btn{font-size:9px;font-weight:600;padding:1px 5px;border-radius:8px;border:1px solid;cursor:pointer;line-height:1.5;transition:filter .1s;white-space:nowrap;}',
    '.od-kanban-act-btn:hover{filter:brightness(.92);}',
    '.od-kanban-act-btn.act-forward{background:#dcfce7;color:#15803d;border-color:#86efac;}',
    '.od-kanban-act-btn.act-back{background:#fef3c7;color:#92400e;border-color:#fcd34d;}',
    '.od-kanban-act-btn.act-danger{background:#fee2e2;color:#b91c1c;border-color:#fca5a5;}',
    '.od-kanban-act-btn.act-claim-return{background:#fff7ed;color:#9a3412;border-color:#fdba74;}',
    '.od-kanban-act-btn.act-claim-exchange{background:#eff6ff;color:#1d4ed8;border-color:#93c5fd;}',
    '.od-kanban-loading{text-align:center;padding:40px;color:#94a3b8;font-size:13px;}',
    '.od-kanban-divider{border:none;border-top:1px solid #e2e8f0;margin:6px 0 0;}',
  ].join('');
  document.head.appendChild(s);
}());

window.OdOrderKanban = {
  name: 'OdOrderKanban',
  props: {
    orderId:     { type: String,   default: null },
    orderItemId: { type: String,   default: null },
    claimId:     { type: String,   default: null },
    mode:        { type: String,   default: 'bo' },   // 'bo' | 'fo'
    asModal:     { type: Boolean,  default: false },
    onClose:     { type: Function, default: null },
    showToast:   { type: Function, default: null },
    showConfirm: { type: Function, default: null },
    navigate:    { type: Function, default: null },   // 페이지 이동
  },

  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted } = Vue;

    /* orderItemId / claimId / orderId:
     *   props 우선(boApp이 URL의 orderId/claimId 파라미터를 props로 전달), 없으면 window._odKanbanParams 폴백.
     *   사용법: navigate('odOrderKanban', { orderId, claimId }); → URL: #page=odOrderKanban&orderId=...&claimId=... */
    var _kp = window._odKanbanParams || {};
    var _oi = ref(props.orderItemId || _kp.orderItemId || null);
    var _ci = ref(props.claimId     || _kp.claimId     || null);
    /* 현재 조회 중인 orderId (검색으로 변경 가능) */
    var currentOrderId = ref(props.orderId || _kp.orderId || null);
    window._odKanbanParams = null; // 소비 후 초기화

    /* 검색 파라미터 */
    const searchParam = reactive({
      orderId:   currentOrderId.value || '',
      claimId:   _ci.value || '',
      memberNm:  '',
    });

    /* 검색 실행 */
    const handleSearch = async () => {
      const sid = (searchParam.orderId || '').trim();
      const cid = (searchParam.claimId || '').trim();

      /* claimId 로 검색 시 → claimId 기준으로 orderId 조회 */
      if (!sid && cid) {
        if (!window.boApiSvc) { toast('BO 모드에서만 클레임 번호 조회가 가능합니다.', 'error'); return; }
        try {
          const cr = await boApiSvc.odClaim.getById(cid, '주문칸반', '클레임조회');
          const cd = (cr.data && cr.data.data) || {};
          const oid = cd.orderId || cd.order_id;
          if (!oid) { toast('해당 클레임의 주문을 찾을 수 없습니다.', 'error'); return; }
          searchParam.orderId = oid;
          currentOrderId.value = oid;
        } catch (e) {
          toast('클레임 조회 중 오류가 발생했습니다.', 'error');
          return;
        }
      } else if (sid) {
        currentOrderId.value = sid;
      } else {
        toast('주문번호 또는 클레임번호를 입력해주세요.', 'error');
        return;
      }

      /* 강조 ID 갱신 */
      _ci.value = cid || null;
      _oi.value = null;

      await handleLoadOrder();
    };

    /* 검색 초기화 */
    const handleSearchReset = () => {
      searchParam.orderId  = '';
      searchParam.claimId  = '';
      searchParam.memberNm = '';
      currentOrderId.value = null;
      _ci.value = null;
      _oi.value = null;
      Object.keys(order).forEach(function (k) { delete order[k]; });
      orderItems.splice(0, orderItems.length);
      claims.splice(0, claims.length);
      settleRaws.splice(0, settleRaws.length);
    };

    /* ── picker 모달 ── */
    const pickerState = reactive({
      show: false,
      type: '',       // 'order' | 'claim'
      keyword: '',
      memberNm: '',
      dateStart: '',
      dateEnd: '',
      loading: false,
      rows: [],
      pageNo: 1,
      pageSize: 15,
      pageTotalCount: 0,
      pageTotalPage: 1,
    });

    const handlePickerOpen = async (type) => {
      pickerState.type           = type;
      pickerState.keyword        = '';
      pickerState.memberNm       = '';
      pickerState.dateStart      = '';
      pickerState.dateEnd        = '';
      pickerState.rows           = [];
      pickerState.pageNo         = 1;
      pickerState.pageTotalCount = 0;
      pickerState.pageTotalPage  = 1;
      pickerState.show           = true;
      await handlePickerSearch();
    };

    const handlePickerSearch = async (pageNo) => {
      if (!window.boApiSvc) return;
      if (pageNo) pickerState.pageNo = pageNo;
      pickerState.loading = true;
      pickerState.rows = [];
      try {
        const params = {
          searchValue: (pickerState.keyword || '').trim(),
          memberNm: pickerState.memberNm,
          dateStart: pickerState.dateStart,
          dateEnd: pickerState.dateEnd,
          pageNo: pickerState.pageNo,
          pageSize: pickerState.pageSize,
        };
        const svc = pickerState.type === 'order'
          ? boApiSvc.odOrder.getPage(params, '주문칸반', '주문선택')
          : boApiSvc.odClaim.getPage(params, '주문칸반', '클레임선택');
        const res = await svc;
        const d = (res.data && res.data.data) || {};
        pickerState.rows           = d.pageList       || [];
        pickerState.pageTotalCount = d.pageTotalCount || 0;
        pickerState.pageTotalPage  = d.pageTotalPage  || 1;
      } catch (_) { /* 무시 */ }
      pickerState.loading = false;
    };

    const handlePickerSelect = async (row) => {
      pickerState.show = false;
      if (pickerState.type === 'order') {
        const oid = row.orderId || row.order_id;
        searchParam.orderId  = oid;
        searchParam.claimId  = '';
        currentOrderId.value = oid;
        _ci.value = null;
        _oi.value = null;
        await handleLoadOrder();
      } else {
        const cid = row.claimId || row.claim_id;
        const oid = row.orderId || row.order_id;
        searchParam.claimId  = cid;
        searchParam.orderId  = oid || '';
        _ci.value = cid;
        _oi.value = null;
        if (oid) {
          currentOrderId.value = oid;
          await handleLoadOrder();
        } else {
          /* orderId 없으면 클레임 단건 조회로 보강 */
          try {
            const cr = await boApiSvc.odClaim.getById(cid, '주문칸반', '클레임조회');
            const cd = (cr.data && cr.data.data) || {};
            const resolvedOid = cd.orderId || cd.order_id;
            if (resolvedOid) {
              searchParam.orderId  = resolvedOid;
              currentOrderId.value = resolvedOid;
              await handleLoadOrder();
            }
          } catch (_) { /* 무시 */ }
        }
      }
    };

    /* toast / confirm fallback */
    const toast = (msg, type, dur) => {
      if (props.showToast) return props.showToast(msg, type, dur);
      if (window.boApp && window.boApp.showToast) return window.boApp.showToast(msg, type, dur);
      alert(msg);
    };
    const doConfirm = async (title, msg) => {
      if (props.showConfirm) return props.showConfirm(title, msg);
      if (window.boApp && window.boApp.showConfirm) return window.boApp.showConfirm(title, msg);
      return window.confirm(msg);
    };

    /* ── 메모 확인 다이얼로그 (클레임/주문항목 상태변경 시 사용) ── */
    /*
     * dlivFields: [{ key, label, value }] — 동적 택배사/송장번호 필드 목록
     *   key: 'returnCourierCd' | 'returnTrackingNo' | 'exchangeCourierCd' | 'exchangeTrackingNo'
     *        | 'dlivCourierCd' | 'dlivTrackingNo'
     */
    /* 택배사 코드 목록 (COURIER 그룹) */
    const courierCodes = reactive([]);


    const memoDialog = reactive({
      show:       false,
      title:      '',
      desc:       '',
      memo:       '',
      dlivFields: [],   // [{ key, label, value, error }]
      itemRows:   [],   // [{ orderItemId, prodNm, optItemNm1, optItemNm2, orderQty, claimQty, checked }]
      claimType:  '',   // 계산 버튼용 (RETURN/EXCHANGE/CANCEL)
      resolve:    null,
    });
    /* 메모 다이얼로그를 열고 { ok, memo, ...dlivValues, claimItems } 를 반환하는 Promise */
    const doConfirmWithMemo = (title, desc, opts) => {
      return new Promise(function (resolve) {
        memoDialog.title      = title;
        memoDialog.desc       = desc;
        memoDialog.memo       = '';
        memoDialog.dlivFields = (opts && opts.dlivFields) ? opts.dlivFields.map(function (f) {
          return { key: f.key, label: f.label, value: f.value || '', error: '', required: f.required !== false,
                   isCourier: !!f.isCourier, courierCd: f.courierCd || '' };
        }) : [];
        memoDialog.itemRows   = (opts && opts.itemRows)   ? opts.itemRows.map(function (r) {
          return { orderItemId: r.orderItemId, prodNm: r.prodNm, optItemNm1: r.optItemNm1 || '',
                   optItemNm2: r.optItemNm2 || '', orderQty: r.orderQty, claimQty: r.claimQty,
                   checked: r.claimQty >= 1 };
        }) : [];
        memoDialog.claimType  = (opts && opts.claimType)  ? opts.claimType : '';
        memoDialog.resolve    = resolve;
        memoDialog.show       = true;
      });
    };
    /* itemRows 에서 claimQty 변경 시 checked 자동 동기화 */
    const handleItemRowClaimQtyInput = (row, e) => {
      var v = parseInt(e.target.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > row.orderQty) v = row.orderQty;
      row.claimQty = v;
      row.checked  = v >= 1;
    };
    /* 전체 주문상품 선택 버튼 */
    const handleSelectAllItemRows = () => {
      memoDialog.itemRows.forEach(function (r) {
        r.claimQty = r.orderQty;
        r.checked  = true;
      });
    };
    const handleMemoDialogOk = () => {
      var hasErr = false;
      memoDialog.dlivFields.forEach(function (f) {
        f.error = (f.required && !f.value.trim()) ? (f.label + '을(를) 입력하세요.') : '';
        if (f.error) hasErr = true;
      });
      if (hasErr) return;
      memoDialog.show = false;
      var result = { ok: true, memo: memoDialog.memo };
      memoDialog.dlivFields.forEach(function (f) {
        result[f.key] = f.value;
        if (f.isCourier) result[f.key + '_code'] = f.courierCd;
      });
      if (memoDialog.itemRows.length) {
        result.claimItems = memoDialog.itemRows
          .filter(function (r) { return r.claimQty > 0; })
          .map(function (r) { return { orderItemId: r.orderItemId, claimQty: r.claimQty }; });
      }
      if (memoDialog.resolve) memoDialog.resolve(result);
    };
    const handleMemoDialogCancel = () => {
      memoDialog.show = false;
      if (memoDialog.resolve) memoDialog.resolve({ ok: false, memo: '' });
    };

    /* 읽기전용 여부 */
    const cfReadonly = computed(() => props.mode === 'fo');

    /* API 인스턴스 */
    const apiInst = computed(() => props.mode === 'fo' ? window.foApi : window.boApi);

    /* ── 주문항목 진행 단계 (DB 코드값 ORDER_ITEM_STATUS 기준) ── */
    const ORDER_STEPS = [
      { key: 'ORDERED',   label: '주문완료',   icon: '🛒', color: '#f97316' },
      { key: 'PAID',      label: '결제완료',   icon: '✅', color: '#3b82f6' },
      { key: 'PREPARING', label: '준비중',     icon: '📦', color: '#f59e0b' },
      { key: 'SHIPPING',  label: '배송중',     icon: '🚚', color: '#8b5cf6' },
      { key: 'DELIVERED', label: '배송완료',   icon: '📬', color: '#22c55e' },
      { key: 'CONFIRMED', label: '구매확정',   icon: '🏁', color: '#6b7280' },
      { key: 'CANCELLED', label: '취소',       icon: '❌', color: '#ef4444' },
    ];

    /* 배송 필수 검증 대상 / 배송 아이콘 표시 대상 */
    const DLIV_REQ_STEPS  = new Set(['SHIPPING', 'DELIVERED', 'CONFIRMED']);
    const DLIV_SHOW_STEPS = new Set(['PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED']);

    /* ── 클레임 유형별 흐름 (DB CLAIM_STATUS 기준, 정책서 1-C 준수) ── */
    const CLAIM_FLOWS = {
      /* CANCEL: REQUESTED → APPROVED → COMPLT (철회: CANCELLED) */
      CANCEL: [
        { key: 'REQUESTED', label: '취소요청',   icon: '📋', color: '#ef4444' },
        { key: 'APPROVED',  label: '취소처리중', icon: '⏳', color: '#f97316' },
        { key: 'COMPLT',    label: '취소완료',   icon: '✅', color: '#9ca3af' },
        { key: 'CANCELLED', label: '철회',       icon: '↩️', color: '#d1d5db' },
      ],
      /* RETURN: 1행(수거) REQUESTED→APPROVED→IN_PICKUP+CANCELLED / 2행(환불) PROCESSING→REFUND_WAIT→COMPLT */
      RETURN: [
        { key: 'REQUESTED',   label: '반품요청', icon: '📋', color: '#ef4444', row: 1 },
        { key: 'APPROVED',    label: '수거예정', icon: '🗓️', color: '#f59e0b', row: 1 },
        { key: 'IN_PICKUP',   label: '수거중',   icon: '🚚', color: '#8b5cf6', row: 1 },
        { key: 'CANCELLED',   label: '철회',     icon: '↩️', color: '#d1d5db', row: 1 },
        { key: 'PROCESSING',  label: '검수중',   icon: '📦', color: '#3b82f6', row: 2 },
        { key: 'REFUND_WAIT', label: '환불대기', icon: '💳', color: '#f97316', row: 2 },
        { key: 'COMPLT',      label: '환불완료', icon: '✅', color: '#9ca3af', row: 2 },
      ],
      /* EXCHANGE: 1행(수거) REQUESTED→APPROVED→IN_PICKUP+CANCELLED / 2행(배송) od_dliv 기준 */
      EXCHANGE: [
        { key: 'REQUESTED', label: '교환요청',   icon: '📋', color: '#3b82f6', row: 1 },
        { key: 'APPROVED',  label: '수거예정',   icon: '🗓️', color: '#f59e0b', row: 1 },
        { key: 'IN_PICKUP', label: '수거중',     icon: '🚚', color: '#8b5cf6', row: 1 },
        { key: 'CANCELLED', label: '철회',       icon: '↩️', color: '#d1d5db', row: 1 },
        /* 2행: 교환 배송 단계 (od_dliv.dliv_status_cd 기준, dlivOnly=true) + 교환완료(클레임 집계) */
        { key: 'DLIV_READY',       label: '배송준비',   icon: '📦', color: '#6366f1', row: 2, dlivOnly: true, dlivKey: 'READY' },
        { key: 'DLIV_IN_TRANSIT',  label: '배송중',     icon: '🚚', color: '#3b82f6', row: 2, dlivOnly: true, dlivKey: 'IN_TRANSIT' },
        { key: 'DLIV_DELIVERED',   label: '배송완료',   icon: '📬', color: '#10b981', row: 2, dlivOnly: true, dlivKey: 'DELIVERED' },
        { key: 'COMPLT',           label: '교환완료',   icon: '🏁', color: '#22c55e', row: 2 },
      ],
    };

    /* 데이터 */
    const order      = reactive({});
    const orderItems = reactive([]);
    const claims     = reactive([]);
    const settleRaws = reactive([]);   // st_settle_raw 원장 목록 (orderId 기준)
    const uiState    = reactive({ loading: false, idPanelOpen: true, hlIdValues: {} });

    /* 드래그 상태 — 현재 드래그 중인 아이템 정보 */
    const dragState = reactive({
      id: null,       // 드래그 중인 아이디 (orderItemId or claimId)
      type: null,     // 'orderItem' | 'claim'
      fromStep: null, // 출발 step key
      overCol: null,  // 현재 hover 중인 열 key (드래그오버 하이라이트용)
      overType: null, // 'orderItem' | 'claim_<claimId>'
    });

    /* ##### [02] 데이터 로드 ####################################################### */

    const handleLoadOrder = async () => {
      if (!currentOrderId.value) return;
      uiState.loading = true;
      /* 이전 데이터 초기화 */
      Object.keys(order).forEach(function (k) { delete order[k]; });
      orderItems.splice(0, orderItems.length);
      claims.splice(0, claims.length);
      settleRaws.splice(0, settleRaws.length);
      try {
        const isBo = props.mode !== 'fo';

        if (isBo && window.boApiSvc) {
          /* BO: 주문 단건 + 클레임 목록 병렬 조회 */
          const [or, cr] = await Promise.all([
            boApiSvc.odOrder.getById(currentOrderId.value, '주문칸반', '주문조회'),
            boApiSvc.odClaim.getPage({ orderId: currentOrderId.value, pageNo: 1, pageSize: 100 }, '주문칸반', '클레임조회').catch(function () { return null; }),
          ]);
          const od = (or.data && or.data.data) || {};
          Object.assign(order, od);
          orderItems.splice(0, orderItems.length, ...(od.orderItems || od.items || []));

          /* claimItems → _orderItemId / _claimItemId 보강 */
          const cd = (cr && cr.data && cr.data.data) || {};
          const claimList = cd.pageList || cd.list || [];
          claimList.forEach(function (c) {
            var items = c.claimItems || [];
            if (items.length) {
              c._orderItemId  = items[0].orderItemId  || items[0].order_item_id  || '';
              c._claimItemId  = items[0].claimItemId  || items[0].claim_item_id  || '';
            }
          });
          claims.splice(0, claims.length, ...claimList);

          /* 정산 원장 — 별도 조회 (BO 전용, 실패해도 무시) */
          try {
            const sr = await boApiSvc.stSettleRaw.getByOrderId(currentOrderId.value, '주문칸반', '정산조회');
            const sd = (sr.data && sr.data.data) || {};
            settleRaws.splice(0, settleRaws.length, ...(sd.pageList || sd.list || []));
          } catch (_) { /* 정산 조회 실패 무시 */ }

        } else {
          /* FO: 기존 단일 주문 조회 */
          const res = await apiInst.value.get('/fo/ec/od/order/' + currentOrderId.value);
          const d   = (res.data && res.data.data) || res.data || {};
          Object.assign(order, d);
          orderItems.splice(0, orderItems.length, ...(d.orderItems || d.items || []));
          claims.splice(0, claims.length, ...(d.claims || []));
        }
      } catch (e) {
        toast('주문 정보를 불러오는 중 오류가 발생했습니다.', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    /* ##### [03] 상태 변경 ######################################################### */

    /* ── 정산 잠금 검증 헬퍼 ──
     *  closeYn='Y' (마감됨) 또는 erpVoucherId 존재 (전표 발행) 이면 이동 차단.
     *  rawStatusCd='PENDING' 이면 정산 진행중 경고 (이동 가능하나 confirm 추가).
     *
     *  반환:
     *    'blocked'  — 이동 불가 (마감/전표)
     *    'warn'     — 정산 집계 중 (confirm 필요)
     *    'ok'       — 이동 가능
     */
    const fnSettleLockState = function (orderItemId) {
      var rows = settleRaws.filter(function (r) {
        return (r.orderItemId || r.order_item_id) === orderItemId;
      });
      if (!rows.length) return 'ok';
      /* 마감 혹은 전표 발행 → 차단 */
      var blocked = rows.some(function (r) {
        return r.closeYn === 'Y' || r.erpVoucherId;
      });
      if (blocked) return 'blocked';
      /* 정산 수집 중 (PENDING) → 경고 */
      var pending = rows.some(function (r) {
        return (r.rawStatusCd || r.raw_status_cd) === 'PENDING';
      });
      return pending ? 'warn' : 'ok';
    };

    /* 주문항목별 정산원장 목록 */
    const fnSettleRawsForItem = function (orderItemId) {
      return settleRaws.filter(function (r) {
        return (r.orderItemId || r.order_item_id) === orderItemId;
      });
    };

    /* 배송 정보 필수 검증 */
    const handleValidateDliv = (item) => {
      const courier    = item.dlivCourierCd  || item.dliv_courier_cd  || '';
      const trackingNo = item.dlivTrackingNo || item.dliv_tracking_no || '';
      if (!courier)    { toast('배송 상태로 이동하려면 택배사를 먼저 등록해주세요.', 'error', 0); return false; }
      if (!trackingNo) { toast('배송 상태로 이동하려면 송장번호를 먼저 등록해주세요.', 'error', 0); return false; }
      return true;
    };

    /* 주문항목 상태 변경 */
    const handleChangeOrderItemStatus = async (item, toKey) => {
      if (cfReadonly.value) return;
      /* 반품/교환 신청 — 클레임 신규 생성 흐름으로 위임 */
      if (toKey === 'NEW_RETURN' || toKey === 'NEW_EXCHANGE') {
        return handleCreateClaim(item, toKey === 'NEW_RETURN' ? 'RETURN' : 'EXCHANGE');
      }
      const fromKey = item.orderItemStatusCd || item.order_item_status_cd || '';
      if (fromKey === toKey) return;

      /* 정산 잠금 체크 */
      const itemId   = item.orderItemId || item.order_item_id;
      const lockSt   = fnSettleLockState(itemId);
      if (lockSt === 'blocked') {
        toast('정산이 마감되었거나 ERP 전표가 발행된 항목입니다. 상태를 변경할 수 없습니다.', 'error', 0);
        return;
      }
      if (lockSt === 'warn') {
        const proceed = await doConfirm('정산 진행 중', '이 항목은 현재 정산 집계 중입니다. 상태를 변경하면 정산 금액이 변동될 수 있습니다. 계속하시겠습니까?');
        if (!proceed) return;
      }

      const fromLabel = fnStepLabel(ORDER_STEPS, fromKey);
      const toLabel   = fnStepLabel(ORDER_STEPS, toKey);
      /* 취소(CANCELLED) / SHIPPING 진입 시 itemRows / 배송 정보 포함 */
      var dlgOpts = {};
      if (toKey === 'SHIPPING') {
        dlgOpts.dlivFields = [
          { key: 'dlivCourierCd',  label: '배송 택배사',  required: true, isCourier: true, value: item.dlivCourierCd  || item.dliv_courier_cd  || '' },
          { key: 'dlivTrackingNo', label: '배송 송장번호', required: true, value: item.dlivTrackingNo || item.dliv_tracking_no || '' },
        ];
      }
      if (toKey === 'CANCELLED') {
        dlgOpts.claimType = 'CANCEL';
        dlgOpts.itemRows = orderItems.map(function (it) {
          var oid = it.orderItemId || it.order_item_id || '';
          var qty = it.orderQty || it.order_qty || 1;
          var isTarget = oid === (item.orderItemId || item.order_item_id || '');
          return {
            orderItemId: oid,
            prodNm:      it.prodNm || it.prod_nm || '',
            optItemNm1:  it.optItemNm1 || it.opt_item_nm1 || '',
            optItemNm2:  it.optItemNm2 || it.opt_item_nm2 || '',
            orderQty:    qty,
            claimQty:    isTarget ? qty : 0,
          };
        });
      }
      const dlg = await doConfirmWithMemo('주문 상태 변경', '"' + fromLabel + '" → "' + toLabel + '" 으로 변경', dlgOpts);
      if (!dlg.ok) return;
      try {
        const body = { orderItemId: itemId, orderItemStatusCd: toKey, memo: dlg.memo || null, rowStatus: 'U' };
        if (toKey === 'SHIPPING') {
          body.dlivCourierCd  = dlg.dlivCourierCd;
          body.dlivTrackingNo = dlg.dlivTrackingNo;
        }
        await apiInst.value.post(
          '/base/ec/od/order-item/save/base',
          body,
          coUtil.cofApiHdr('주문칸반', '상태변경')
        );
        /* 로컬 상태 즉시 반영 */
        if (Object.prototype.hasOwnProperty.call(item, 'orderItemStatusCd')) item.orderItemStatusCd = toKey;
        else item.order_item_status_cd = toKey;
        if (toKey === 'SHIPPING') {
          item.dlivCourierCd  = dlg.dlivCourierCd;
          item.dlivTrackingNo = dlg.dlivTrackingNo;
        }
        toast(toLabel + '으로 변경되었습니다.', 'success');
      } catch (e) {
        toast((e.response && e.response.data && e.response.data.message) || e.message || '상태 변경 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* 반품/교환 클레임 신규 생성 */
    const handleCreateClaim = async (item, claimType) => {
      const typeLabel = claimType === 'RETURN' ? '반품' : '교환';
      const itemId    = item.orderItemId || item.order_item_id || '';
      const orderId   = order.orderId    || order.order_id    || '';
      const memberId  = order.memberId   || order.member_id   || '';
      const prodNm    = item.prodNm      || item.prod_nm      || '';
      /* 주문상품 전체를 itemRows로 빌드 — 클릭한 항목만 전체수량, 나머지는 0 */
      const claimItemRows = orderItems.map(function (it) {
        var oid = it.orderItemId || it.order_item_id || '';
        var qty = it.orderQty || it.order_qty || 1;
        var isTarget = oid === itemId;
        return {
          orderItemId: oid,
          prodNm:      it.prodNm || it.prod_nm || '',
          optItemNm1:  it.optItemNm1 || it.opt_item_nm1 || '',
          optItemNm2:  it.optItemNm2 || it.opt_item_nm2 || '',
          orderQty:    qty,
          claimQty:    isTarget ? qty : 0,
        };
      });
      const dlg = await doConfirmWithMemo(
        typeLabel + ' 신청',
        '신청 대상 항목을 확인하고 클레임 수량을 입력하세요.',
        { itemRows: claimItemRows, claimType: claimType }
      );
      if (!dlg.ok) return;
      try {
        const body = {
          siteId:         order.siteId    || order.site_id    || '',
          orderId:        orderId,
          orderItemId:    itemId,
          memberId:       memberId,
          memberNm:       order.memberNm  || order.member_nm  || '',
          prodNm:         prodNm,
          claimTypeCd:    claimType,
          claimStatusCd:  'REQUESTED',
          reasonDetail:   dlg.memo || '',
          claimItems:     dlg.claimItems  || [],
        };
        await apiInst.value.post(
          '/bo/ec/od/claim',
          body,
          coUtil.cofApiHdr('주문칸반', typeLabel + '신청')
        );
        toast(typeLabel + ' 신청이 등록되었습니다.', 'success');
        /* 클레임 목록 새로고침 */
        await handleLoadOrder();
      } catch (e) {
        toast((e.response && e.response.data && e.response.data.message) || e.message || typeLabel + ' 신청 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ── 클레임 금액 계산 다이얼로그 ── */
    const calcDialog = reactive({
      show:    false,
      loading: false,
      claimId: '',
      claimType: '',
      data:    null,  /* { order, claimItems, discounts } */
    });

    /* fnCalcClaimAmt — 클레임 대상 항목 기준 환불 예정 계산 */
    const fnCalcClaimAmt = function (claimData) {
      var items = claimData.claimItems || [];
      /* 기본 상품금액 합산 */
      var itemAmt = items.reduce(function (s, it) {
        return s + (it.itemAmt || it.item_amt || (it.unitPrice || it.unit_price || 0) * (it.claimQty || it.claim_qty || 1));
      }, 0);
      /* 비례 할인 계산 (주문 총액 대비 클레임 항목 비율) */
      var orderTotalAmt = order.payAmt || order.pay_amt || order.totalAmt || order.total_amt || 0;
      var orderItemAmt  = orderItems.reduce(function (s, it) {
        return s + ((it.salePrice || it.sale_price || 0) * (it.orderQty || it.order_qty || 1));
      }, 0);
      var ratio = orderItemAmt > 0 ? itemAmt / orderItemAmt : 0;
      /* 쿠폰 할인 복구 */
      var couponDiscAmt = Math.round((order.couponDiscAmt || order.coupon_disc_amt || 0) * ratio);
      /* 적립금 사용 복구 */
      var saveUsedAmt   = Math.round((order.saveUsedAmt  || order.save_used_amt  || 0) * ratio);
      /* 포인트/캐시 사용 복구 */
      var cacheUsedAmt  = Math.round((order.cacheUsedAmt || order.cache_used_amt || 0) * ratio);
      /* 배송비 환불 여부 (전체 취소인 경우만) */
      var totalClaimQty = items.reduce(function (s, it) { return s + (it.claimQty || it.claim_qty || 1); }, 0);
      var totalOrderQty = orderItems.reduce(function (s, it) { return s + (it.orderQty || it.order_qty || 1); }, 0);
      var isFullCancel  = totalClaimQty >= totalOrderQty;
      var dlivFeeRefund = isFullCancel ? (order.dlivFee || order.dliv_fee || 0) : 0;
      /* 최종 환불 예정액 */
      var refundBase = itemAmt - couponDiscAmt - saveUsedAmt - cacheUsedAmt + dlivFeeRefund;
      if (refundBase < 0) refundBase = 0;
      return {
        itemAmt:        itemAmt,
        couponDiscAmt:  couponDiscAmt,
        saveUsedAmt:    saveUsedAmt,
        cacheUsedAmt:   cacheUsedAmt,
        dlivFeeRefund:  dlivFeeRefund,
        refundBase:     refundBase,
        isFullCancel:   isFullCancel,
        ratio:          ratio,
        orderTotalAmt:  orderTotalAmt,
        couponNm:       order.couponNm       || order.coupon_nm       || '',
        saveGradePct:   order.saveGradePct   || order.save_grade_pct  || 0,
      };
    };

    /* handleOpenCalcDialog(claimOrId | 'memo-preview')
     *   - claimId 문자열 or 클레임 객체: API 조회 후 계산
     *   - 'memo-preview': 메모 다이얼로그의 현재 itemRows로 즉시 계산 (저장 전 미리보기)
     */
    const handleOpenCalcDialog = async function (claimOrId) {
      if (claimOrId === 'memo-preview') {
        /* 메모 다이얼로그 내 미리보기 — itemRows로 직접 계산 */
        var previewItems = memoDialog.itemRows.filter(function (r) { return r.claimQty > 0; }).map(function (r) {
          return { orderItemId: r.orderItemId, claimQty: r.claimQty, unitPrice: 0, itemAmt: 0 };
        });
        /* itemAmt 역산: orderItems에서 단가 조회 */
        previewItems.forEach(function (pi) {
          var oi = orderItems.find(function (it) { return (it.orderItemId || it.order_item_id) === pi.orderItemId; });
          if (oi) {
            var price = oi.salePrice || oi.sale_price || oi.unitPrice || oi.unit_price || 0;
            pi.unitPrice = price;
            pi.itemAmt   = price * pi.claimQty;
          }
        });
        calcDialog.claimId   = '';
        calcDialog.claimType = memoDialog.claimType;
        calcDialog.data      = null;
        calcDialog.loading   = false;
        calcDialog.show      = true;
        var calc = fnCalcClaimAmt({ claimItems: previewItems });
        calcDialog.data = { claim: { claimItems: previewItems }, calc: calc };
        return;
      }
      var cid = '';
      var existClaim = null;
      if (typeof claimOrId === 'string') {
        cid = claimOrId;
        existClaim = claims.find(function (c) { return (c.claimId || c.claim_id) === cid; });
      } else if (claimOrId && typeof claimOrId === 'object') {
        existClaim = claimOrId;
        cid = claimOrId.claimId || claimOrId.claim_id || '';
      }
      calcDialog.claimId   = cid;
      calcDialog.claimType = existClaim ? (existClaim.claimTypeCd || existClaim.claim_type_cd || '') : '';
      calcDialog.data      = null;
      calcDialog.loading   = true;
      calcDialog.show      = true;
      try {
        /* 클레임 상세(claimItems 포함)가 이미 있으면 재사용, 없으면 API 조회 */
        var claimData = existClaim;
        if (!claimData || !(claimData.claimItems && claimData.claimItems.length)) {
          var cr = await boApiSvc.odClaim.getById(cid, '주문칸반', '계산조회');
          claimData = (cr.data && cr.data.data) || cr.data || {};
        }
        /* 주문 정보가 없으면 로드 */
        if (!order.orderId && !order.order_id) { await handleLoadOrder(); }
        var calc = fnCalcClaimAmt(claimData);
        calcDialog.data      = { claim: claimData, calc: calc };
        calcDialog.claimType = claimData.claimTypeCd || claimData.claim_type_cd || calcDialog.claimType;
      } catch (e) {
        toast('계산 정보를 불러오는 중 오류가 발생했습니다.', 'error', 0);
        calcDialog.show = false;
      } finally {
        calcDialog.loading = false;
      }
    };
    const handleCloseCalcDialog = function () { calcDialog.show = false; };

    /* 클레임 상태 변경 */
    const handleChangeClaimStatus = async (claim, toKey) => {
      if (cfReadonly.value) return;
      const flow = fnClaimFlow(claim);
      const toStep = flow.find(function (s) { return s.key === toKey; });

      /* 교환 배송 전용 스텝 (DLIV_*) → od_dliv 배송 상태 변경 */
      if (toStep && toStep.dlivOnly) {
        const dlivStatusCd = claim.exchangeDlivStatusCd || claim.exchange_dliv_status_cd
          || claim.dlivStatusCd || claim.dliv_status_cd || '';
        if (dlivStatusCd === toStep.dlivKey) return;
        const fromLabel = dlivStatusCd || '(이전 상태)';
        /* DLIV_IN_TRANSIT(배송중) 진입 시 재배송 택배사/송장번호 필수 */
        const needExchDliv = toStep.dlivKey === 'IN_TRANSIT';
        const exchDlgOpts = needExchDliv ? { dlivFields: [
          { key: 'exchangeCourierCd',  label: '재배송 택배사',  required: true, isCourier: true, value: claim.exchangeCourierCd  || '' },
          { key: 'exchangeTrackingNo', label: '재배송 송장번호', required: true, value: claim.exchangeTrackingNo || '' },
        ]} : {};
        const dlg = await doConfirmWithMemo('교환 배송 상태 변경', '"' + fromLabel + '" → "' + toStep.label + '" 으로 변경', exchDlgOpts);
        if (!dlg.ok) return;
        try {
          const cid = claim.claimId || claim.claim_id;
          const body = { claimId: cid, dlivStatusCd: toStep.dlivKey, memo: dlg.memo || null, rowStatus: 'U' };
          if (needExchDliv) {
            body.exchangeCourierCd  = dlg.exchangeCourierCd;
            body.exchangeTrackingNo = dlg.exchangeTrackingNo;
          }
          await apiInst.value.post('/bo/ec/od/claim/save/exchange-dliv-status', body, coUtil.cofApiHdr('주문칸반', '교환배송상태변경'));
          if (Object.prototype.hasOwnProperty.call(claim, 'exchangeDlivStatusCd')) claim.exchangeDlivStatusCd = toStep.dlivKey;
          else claim.exchange_dliv_status_cd = toStep.dlivKey;
          if (needExchDliv) {
            claim.exchangeCourierCd  = dlg.exchangeCourierCd;
            claim.exchangeTrackingNo = dlg.exchangeTrackingNo;
          }
          toast(toStep.label + '으로 변경되었습니다.', 'success');
        } catch (e) {
          toast((e.response && e.response.data && e.response.data.message) || e.message || '배송 상태 변경 중 오류가 발생했습니다.', 'error', 0);
        }
        return;
      }

      /* 일반 클레임 상태 변경 */
      const fromKey   = claim.claimStatusCd || claim.claim_status_cd || '';
      if (fromKey === toKey) return;
      const fromLabel = fnStepLabel(flow, fromKey);
      const toLabel   = fnStepLabel(flow, toKey);
      const typeLabel = fnClaimTypeLabel(claim);
      const claimType = fnClaimTypeKey(claim);
      /*
       * 택배사/송장번호 필드 구성:
       * - RETURN/EXCHANGE + APPROVED→IN_PICKUP : 반품 수거 택배사 + 송장번호 (필수)
       * 나머지는 필드 없음 (메모만)
       */
      var dlgFields = [];
      if (toKey === 'IN_PICKUP' && (claimType === 'RETURN' || claimType === 'EXCHANGE')) {
        dlgFields = [
          { key: 'returnCourierCd',  label: '반품 수거 택배사',  required: true, isCourier: true, value: claim.returnCourierCd  || '' },
          { key: 'returnTrackingNo', label: '반품 수거 송장번호', required: true, value: claim.returnTrackingNo || '' },
        ];
      }
      const claimDlgOpts = dlgFields.length ? { dlivFields: dlgFields } : {};
      const dlg = await doConfirmWithMemo(typeLabel + ' 상태 변경', '"' + fromLabel + '" → "' + toLabel + '" 으로 변경', claimDlgOpts);
      if (!dlg.ok) return;
      try {
        const cid = claim.claimId || claim.claim_id;
        const body = { claimId: cid, claimStatusCd: toKey, memo: dlg.memo || null, rowStatus: 'U' };
        if (dlgFields.length) {
          body.returnCourierCd  = dlg.returnCourierCd;
          body.returnTrackingNo = dlg.returnTrackingNo;
        }
        await apiInst.value.post('/bo/ec/od/claim/save/status', body, coUtil.cofApiHdr('주문칸반', '클레임상태변경'));
        if (Object.prototype.hasOwnProperty.call(claim, 'claimStatusCd')) claim.claimStatusCd = toKey;
        else claim.claim_status_cd = toKey;
        if (dlgFields.length) {
          claim.returnCourierCd  = dlg.returnCourierCd;
          claim.returnTrackingNo = dlg.returnTrackingNo;
        }
        toast(toLabel + '으로 변경되었습니다.', 'success');
      } catch (e) {
        toast((e.response && e.response.data && e.response.data.message) || e.message || '클레임 상태 변경 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [04] 드래그 앤 드롭 ################################################### */

    /* dragstart: 카드 드래그 시작 */
    const handleDragStart = (e, id, type, fromStep) => {
      if (cfReadonly.value) { e.preventDefault(); return; }
      dragState.id = id;
      dragState.type = type;
      dragState.fromStep = fromStep;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    };

    /* dragend: 드래그 종료 (드롭 성공/실패 무관하게 상태 초기화) */
    const handleDragEnd = () => {
      dragState.id = null; dragState.type = null;
      dragState.fromStep = null; dragState.overCol = null; dragState.overType = null;
    };

    /* dragover: 열 위에 올라왔을 때 — e.preventDefault() 필수(드롭 허용) */
    const handleDragOver = (e, stepKey, overType) => {
      if (cfReadonly.value || !dragState.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragState.overCol  = stepKey;
      dragState.overType = overType;
    };

    /* dragleave: 열을 벗어날 때 — 자식 요소 이동 시 깜빡임 방지를 위해 relatedTarget 체크 */
    const handleDragLeave = (e, stepKey, overType) => {
      /* relatedTarget 이 같은 열의 자식이면 무시 */
      if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
      if (dragState.overCol === stepKey && dragState.overType === overType) {
        dragState.overCol = null; dragState.overType = null;
      }
    };

    /* drop: 주문항목 열에 드롭 */
    const handleDropOrderItem = async (e, toStep) => {
      e.preventDefault();
      const id       = dragState.id;
      const type     = dragState.type;
      const fromStep = dragState.fromStep;
      handleDragEnd(); // 상태 초기화 먼저
      if (cfReadonly.value || type !== 'orderItem' || fromStep === toStep || !id) return;
      const item = orderItems.find(function (i) {
        return (i.orderItemId || i.order_item_id) === id;
      });
      if (item) await handleChangeOrderItemStatus(item, toStep);
    };

    /* drop: 클레임 열에 드롭 */
    const handleDropClaim = async (e, claim, toStep) => {
      e.preventDefault();
      const id       = dragState.id;
      const type     = dragState.type;
      const fromStep = dragState.fromStep;
      const cid      = claim.claimId || claim.claim_id;
      handleDragEnd(); // 상태 초기화 먼저
      if (cfReadonly.value || type !== 'claim' || id !== cid || fromStep === toStep) return;
      await handleChangeClaimStatus(claim, toStep);
    };

    /* 닫기 */
    const handleClose = () => { if (props.onClose) props.onClose(); };

    /* 강조 ID 클리어 */
    const handleClearHlClaim     = () => { _ci.value = null; };
    const handleClearHlOrderItem = () => { _oi.value = null; };

    /* ##### [05] computed / helpers ################################################ */

    const cfOrderId     = computed(() => order.orderId    || order.order_id    || currentOrderId.value || '-');
    const cfMemberNm    = computed(() => order.memberNm   || order.member_nm   || '-');
    const cfOrderDate   = computed(() => {
      var d = order.orderDate || order.order_date || '';
      return d ? d.slice(0, 16).replace('T', ' ') : '-';
    });
    const cfTotalAmt = computed(() => {
      var v = order.totalAmt || order.total_amt || order.payAmt || order.pay_amt || 0;
      return (window.coUtil && coUtil.cofWon) ? coUtil.cofWon(v) : Number(v).toLocaleString() + '원';
    });
    const cfPayMethod   = computed(() => order.payMethodCd  || order.pay_method_cd  || '-');
    const cfOrderStatus = computed(() => order.orderStatusCd || order.order_status_cd || '-');

    /* step 배열에서 key로 label 조회 */
    const fnStepLabel = function (steps, key) {
      var s = steps.find(function (x) { return x.key === key; });
      return s ? s.label : key;
    };

    /* 클레임 유형 코드 (CANCEL/RETURN/EXCHANGE) */
    const fnClaimTypeKey = function (c) {
      var t = c.claimTypeCd || c.claim_type_cd || '';
      /* 한글로 저장된 경우도 매핑 */
      var MAP = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
      return MAP[t] || t || 'CANCEL';
    };

    /* 클레임 유형 한글 라벨 */
    const fnClaimTypeLabel = function (c) {
      var MAP = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };
      return MAP[fnClaimTypeKey(c)] || fnClaimTypeKey(c);
    };

    /* 클레임 유형에 맞는 흐름 배열 */
    const fnClaimFlow = function (c) {
      return CLAIM_FLOWS[fnClaimTypeKey(c)] || CLAIM_FLOWS.CANCEL;
    };

    /* 반품/교환: row 속성 기준으로 행별 스텝 그룹 반환 [{rowNo, label, steps}] */
    const fnClaimFlowRows = function (c) {
      var flow = fnClaimFlow(c);
      var typeKey = fnClaimTypeKey(c);
      if (typeKey === 'EXCHANGE') {
        var row1 = flow.filter(function (s) { return s.row === 1; });
        var row2 = flow.filter(function (s) { return s.row === 2; });
        return [
          { rowNo: 1, label: '🚚 수거', steps: row1 },
          { rowNo: 2, label: '📦 배송', steps: row2 },
        ];
      }
      if (typeKey === 'RETURN') {
        var row1 = flow.filter(function (s) { return s.row === 1; });
        var row2 = flow.filter(function (s) { return s.row === 2; });
        return [
          { rowNo: 1, label: '🚚 수거', steps: row1 },
          { rowNo: 2, label: '💳 환불', steps: row2 },
        ];
      }
      return [{ rowNo: 1, label: '', steps: flow }];
    };

    /* 배송 정보 */
    const fnDlivInfo = function (item) {
      return {
        courier:    item.dlivCourierCd  || item.dliv_courier_cd  || '',
        trackingNo: item.dlivTrackingNo || item.dliv_tracking_no || '',
      };
    };

    /* 현재 step 여부 */
    const fnIsOrderItemStep = function (item, stepKey) {
      return (item.orderItemStatusCd || item.order_item_status_cd || '') === stepKey;
    };
    const fnIsClaimStep = function (claim, stepKey) {
      var claimStatus = claim.claimStatusCd || claim.claim_status_cd || '';
      /* 교환 배송 전용 스텝 (DLIV_*): claim의 exchangeDlivStatusCd 또는 dlivStatusCd 로 판단 */
      if (stepKey.startsWith('DLIV_')) {
        var dlivStatus = claim.exchangeDlivStatusCd || claim.exchange_dliv_status_cd
          || claim.dlivStatusCd || claim.dliv_status_cd || '';
        var dlivKey = stepKey.replace('DLIV_', '');
        return dlivStatus === dlivKey;
      }
      return claimStatus === stepKey;
    };

    /* 강조 여부 */
    const fnIsHlOrderItem = function (item) {
      return !!_oi.value && (item.orderItemId || item.order_item_id) === _oi.value;
    };
    const fnIsHlClaim = function (claim) {
      return !!_ci.value && (claim.claimId || claim.claim_id) === _ci.value;
    };

    /* 열 dragover 하이라이트 — 주문항목 */
    const fnIsDragOverOrderItemCol = function (stepKey) {
      return dragState.overType === 'orderItem' && dragState.overCol === stepKey;
    };
    /* 열 dragover 하이라이트 — 클레임 (클레임ID 포함 식별) */
    const fnIsDragOverClaimCol = function (claim, stepKey) {
      var cid = claim.claimId || claim.claim_id;
      return dragState.overType === ('claim_' + cid) && dragState.overCol === stepKey;
    };

    /* ── 카드 헤더 아이콘 헬퍼 ── */

    /* 주문항목 — 배송 정보 아이콘 표시 여부 */
    const fnItemHasDliv = function (item) {
      return !!(item.dlivCourierCd || item.dliv_courier_cd || item.dlivTrackingNo || item.dliv_tracking_no);
    };
    /* 주문항목 — 정산마감 아이콘 표시 여부 */
    const fnItemHasSettleClosed = function (item) {
      var id = item.orderItemId || item.order_item_id;
      return settleRaws.some(function (r) {
        return (r.orderItemId || r.order_item_id) === id && r.closeYn === 'Y';
      });
    };
    /* 주문항목 — 전표 아이콘 표시 여부 */
    const fnItemHasVoucher = function (item) {
      var id = item.orderItemId || item.order_item_id;
      return settleRaws.some(function (r) {
        return (r.orderItemId || r.order_item_id) === id && !!(r.erpVoucherId || r.erp_voucher_id);
      });
    };
    /* 주문항목 — 배송 아이콘 클릭 (배송 탭으로 이동) */
    const handleItemDlivIconClick = function (item) {
      var trackingNo = item.dlivTrackingNo || item.dliv_tracking_no || '';
      var courier    = item.dlivCourierCd  || item.dliv_courier_cd  || '';
      toast((courier ? courier + ' ' : '') + (trackingNo || '송장번호 미등록'), 'success');
    };
    /* 주문항목 — 정산마감 아이콘 클릭 */
    const handleItemSettleIconClick = function (item) {
      var id = item.orderItemId || item.order_item_id;
      var rows = settleRaws.filter(function (r) { return (r.orderItemId || r.order_item_id) === id; });
      var closed = rows.filter(function (r) { return r.closeYn === 'Y'; });
      toast('정산마감 ' + closed.length + '건', 'success');
    };
    /* 주문항목 — 전표 아이콘 클릭 */
    const handleItemVoucherIconClick = function (item) {
      var id = item.orderItemId || item.order_item_id;
      var rows = settleRaws.filter(function (r) {
        return (r.orderItemId || r.order_item_id) === id && !!(r.erpVoucherId || r.erp_voucher_id);
      });
      var vid = rows.length ? (rows[0].erpVoucherId || rows[0].erp_voucher_id) : '';
      toast('ERP 전표 ' + (vid || '') + ' (' + rows.length + '건)', 'success');
    };

    /* 클레임 — 배송 정보 아이콘 표시 여부 */
    const fnClaimHasDliv = function (claim) {
      return !!(claim.dlivCourierCd || claim.dliv_courier_cd || claim.dlivTrackingNo || claim.dliv_tracking_no);
    };
    /* 클레임 — 정산마감 아이콘 표시 여부 */
    const fnClaimHasSettleClosed = function (claim) {
      var cid = claim.claimId || claim.claim_id;
      return settleRaws.some(function (r) {
        return (r.claimId || r.claim_id) === cid && r.closeYn === 'Y';
      });
    };
    /* 클레임 — 전표 아이콘 표시 여부 */
    const fnClaimHasVoucher = function (claim) {
      var cid = claim.claimId || claim.claim_id;
      return settleRaws.some(function (r) {
        return (r.claimId || r.claim_id) === cid && !!(r.erpVoucherId || r.erp_voucher_id);
      });
    };
    /* 클레임 — 배송 아이콘 클릭 */
    const handleClaimDlivIconClick = function (claim) {
      var trackingNo = claim.dlivTrackingNo || claim.dliv_tracking_no || '';
      var courier    = claim.dlivCourierCd  || claim.dliv_courier_cd  || '';
      toast((courier ? courier + ' ' : '') + (trackingNo || '송장번호 미등록'), 'success');
    };
    /* 클레임 — 정산마감 아이콘 클릭 */
    const handleClaimSettleIconClick = function (claim) {
      var cid = claim.claimId || claim.claim_id;
      var rows = settleRaws.filter(function (r) {
        return (r.claimId || r.claim_id) === cid && r.closeYn === 'Y';
      });
      toast('정산마감 ' + rows.length + '건', 'success');
    };
    /* 클레임 — 전표 아이콘 클릭 */
    const handleClaimVoucherIconClick = function (claim) {
      var cid = claim.claimId || claim.claim_id;
      var rows = settleRaws.filter(function (r) {
        return (r.claimId || r.claim_id) === cid && !!(r.erpVoucherId || r.erp_voucher_id);
      });
      var vid = rows.length ? (rows[0].erpVoucherId || rows[0].erp_voucher_id) : '';
      toast('ERP 전표 ' + (vid || '') + ' (' + rows.length + '건)', 'success');
    };

    /* ##### [06] 라이프사이클 ###################################################### */

    onMounted(function () {
      handleLoadOrder();
      /* 택배사 코드 로드 */
      if (window.coApiSvc && window.coApiSvc.syCode) {
        window.coApiSvc.syCode.getGrpCodes('COURIER', '주문칸반', '택배사코드조회').then(function (r) {
          var list = (r.data && r.data.data) || [];
          courierCodes.splice(0, courierCodes.length, ...list);
        }).catch(function () {});
      }
    });

    /* ##### [06-B] ID 패널 핸들러 ################################################## */

    const fnIsHlId = function (val) { return !!val && !!uiState.hlIdValues[val]; };
    const handleHlIdValue = function (val) {
      if (!val) return;
      if (uiState.hlIdValues[val]) delete uiState.hlIdValues[val];
      else uiState.hlIdValues[val] = true;
    };
    const handleHlIdClear = function () {
      Object.keys(uiState.hlIdValues).forEach(function (k) { delete uiState.hlIdValues[k]; });
    };

    /* ID 패널용 중복제거 목록 */
    const cfIdChips = computed(function () {
      var order_ = []; var item_ = []; var claim_ = []; var citem_ = []; var dliv_ = [];
      /* 주문ID */
      var oid = order.orderId || order.order_id || currentOrderId.value || '';
      if (oid) order_.push({ type: 'order', label: '주문', val: oid });
      /* 주문항목ID */
      var seenItem = new Set();
      orderItems.forEach(function (item) {
        var v = item.orderItemId || item.order_item_id || '';
        if (v && !seenItem.has(v)) { seenItem.add(v); item_.push({ type: 'item', label: '주문항목', val: v }); }
      });
      /* 클레임ID / 클레임항목ID */
      var seenClaim = new Set(); var seenCitem = new Set();
      claims.forEach(function (c) {
        var cv = c.claimId || c.claim_id || '';
        var tk = fnClaimTypeKey(c);
        var icon = tk === 'CANCEL' ? '🔴' : tk === 'RETURN' ? '🩷' : '🔵';
        var lbl = tk === 'CANCEL' ? '취소' : tk === 'RETURN' ? '반품' : '교환';
        if (cv && !seenClaim.has(cv)) { seenClaim.add(cv); claim_.push({ type: 'claim', label: icon + ' ' + lbl, val: cv }); }
        var civ = c._claimItemId || '';
        if (civ && !seenCitem.has(civ)) { seenCitem.add(civ); citem_.push({ type: 'citem', label: icon + ' ' + lbl + '항목', val: civ }); }
      });
      /* 배송ID */
      var seenDliv = new Set();
      orderItems.forEach(function (item) {
        var v = item.dlivId || item.dliv_id || '';
        if (v && !seenDliv.has(v)) { seenDliv.add(v); dliv_.push({ type: 'dliv', label: '🟠 배송', val: v }); }
      });
      claims.forEach(function (c) {
        var v = c.dlivId || c.dliv_id || c.exchangeDlivId || c.exchange_dliv_id || '';
        if (v && !seenDliv.has(v)) { seenDliv.add(v); dliv_.push({ type: 'dliv', label: '🟠 배송', val: v }); }
      });
      /* 유형별 순서: 주문 → 주문항목 → 클레임 → 클레임항목 → 배송 */
      return order_.concat(item_).concat(claim_).concat(citem_).concat(dliv_);
    });

    /* ##### [06-B] 카드 액션 버튼 정의 ############################################# */

    /* 주문항목 현재 상태 → 다음 가능한 버튼 목록 */
    const fnOrderItemActions = function (item) {
      var st = item.orderItemStatusCd || item.order_item_status_cd || '';
      var locked = fnSettleLockState(item.orderItemId || item.order_item_id) === 'blocked';
      if (locked) return [];
      var MAP = {
        ORDERED:   [{ key: 'CANCELLED', label: '취소',      cls: 'act-danger',  side: 'left'  },
                    { key: 'PAID',      label: '결제확인', cls: 'act-forward', side: 'right' }],
        PAID:      [{ key: 'CANCELLED', label: '취소',      cls: 'act-danger',  side: 'left'  },
                    { key: 'PREPARING', label: '준비시작', cls: 'act-forward', side: 'right' }],
        PREPARING: [{ key: 'CANCELLED', label: '취소',      cls: 'act-danger',  side: 'left'  },
                    { key: 'SHIPPING',  label: '배송처리', cls: 'act-forward', side: 'right' }],
        SHIPPING:  [{ key: 'DELIVERED', label: '배송완료', cls: 'act-forward', side: 'right' }],
        DELIVERED: [{ key: 'NEW_RETURN',   label: '반품',   cls: 'act-claim-return',   side: 'left'  },
                    { key: 'NEW_EXCHANGE', label: '교환',   cls: 'act-claim-exchange', side: 'left'  },
                    { key: 'CONFIRMED',    label: '구매확정', cls: 'act-forward',         side: 'right' }],
      };
      return MAP[st] || [];
    };

    /* 클레임 현재 상태 → 다음 가능한 버튼 목록 */
    const fnClaimActions = function (claim) {
      var tk  = fnClaimTypeKey(claim);
      var st  = claim.claimStatusCd || claim.claim_status_cd || '';
      var dst = claim.exchangeDlivStatusCd || claim.exchange_dliv_status_cd
              || claim.dlivStatusCd || claim.dliv_status_cd || '';
      if (tk === 'CANCEL') {
        var MAP_C = {
          REQUESTED: [{ key: 'APPROVED',  label: '취소승인', cls: 'act-forward', side: 'right' },
                      { key: 'CANCELLED', label: '거절',      cls: 'act-danger',  side: 'left'  }],
          APPROVED:  [{ key: 'COMPLT',    label: '취소완료', cls: 'act-forward', side: 'right' }],
        };
        return MAP_C[st] || [];
      }
      if (tk === 'RETURN') {
        var MAP_R = {
          REQUESTED:   [{ key: 'APPROVED',    label: '수거예약',   cls: 'act-forward', side: 'right' },
                        { key: 'CANCELLED',   label: '거절',        cls: 'act-danger',  side: 'left'  }],
          APPROVED:    [{ key: 'IN_PICKUP',   label: '수거시작',   cls: 'act-forward', side: 'right' },
                        { key: 'REQUESTED',   label: '요청으로', cls: 'act-back',    side: 'left'  }],
          IN_PICKUP:   [{ key: 'PROCESSING',  label: '입고완료',   cls: 'act-forward', side: 'right' },
                        { key: 'APPROVED',    label: '수거예정', cls: 'act-back',    side: 'left'  }],
          PROCESSING:  [{ key: 'REFUND_WAIT', label: '검수완료',   cls: 'act-forward', side: 'right' },
                        { key: 'CANCELLED',   label: '검수불합격',  cls: 'act-danger',  side: 'left'  }],
          REFUND_WAIT: [{ key: 'COMPLT',      label: '환불처리',   cls: 'act-forward', side: 'right' },
                        { key: 'PROCESSING',  label: '검수중',   cls: 'act-back',    side: 'left'  }],
        };
        return MAP_R[st] || [];
      }
      if (tk === 'EXCHANGE') {
        var MAP_E1 = {
          REQUESTED: [{ key: 'APPROVED',   label: '수거예약',      cls: 'act-forward', side: 'right' },
                      { key: 'CANCELLED',  label: '거절',           cls: 'act-danger',  side: 'left'  }],
          APPROVED:  [{ key: 'IN_PICKUP',  label: '수거시작',      cls: 'act-forward', side: 'right' },
                      { key: 'REQUESTED',  label: '요청으로',    cls: 'act-back',    side: 'left'  }],
          IN_PICKUP: [{ key: 'DLIV_READY', label: '입고→배송준비', cls: 'act-forward', side: 'right' },
                      { key: 'APPROVED',   label: '수거예정',    cls: 'act-back',    side: 'left'  }],
        };
        var MAP_E2 = {
          READY:      [{ key: 'DLIV_IN_TRANSIT', label: '배송시작', cls: 'act-forward', side: 'right' }],
          IN_TRANSIT: [{ key: 'DLIV_DELIVERED',  label: '배송완료', cls: 'act-forward', side: 'right' },
                       { key: 'DLIV_READY',      label: '배송준비', cls: 'act-back', side: 'left'  }],
          DELIVERED:  [{ key: 'COMPLT',           label: '교환완료', cls: 'act-forward', side: 'right' },
                       { key: 'DLIV_IN_TRANSIT',  label: '배송중', cls: 'act-back',   side: 'left'  }],
        };
        return (MAP_E1[st] || []).concat(MAP_E2[dst] || []);
      }
      return [];
    };

    /* ##### [07] return ############################################################ */

    return {
      order, orderItems, claims, settleRaws, uiState, dragState,
      searchParam, currentOrderId,
      cfReadonly, cfOrderId, cfMemberNm, cfOrderDate, cfTotalAmt, cfPayMethod, cfOrderStatus,
      hlOrderItemId: _oi, hlClaimId: _ci,
      ORDER_STEPS, DLIV_SHOW_STEPS,
      fnStepLabel, fnClaimTypeKey, fnClaimTypeLabel, fnClaimFlow, fnClaimFlowRows, fnDlivInfo,
      fnIsOrderItemStep, fnIsClaimStep,
      fnIsHlOrderItem, fnIsHlClaim,
      fnIsDragOverOrderItemCol, fnIsDragOverClaimCol,
      fnSettleLockState, fnSettleRawsForItem,
      handleSearch, handleSearchReset, handleClearHlClaim, handleClearHlOrderItem,
      cfIdChips, fnIsHlId, handleHlIdValue, handleHlIdClear,
      handleDragStart, handleDragEnd, handleDragOver, handleDragLeave,
      handleDropOrderItem, handleDropClaim,
      fnOrderItemActions, fnClaimActions,
      handleChangeOrderItemStatus, handleCreateClaim, handleChangeClaimStatus,
      memoDialog, handleMemoDialogOk, handleMemoDialogCancel,
      handleItemRowClaimQtyInput, handleSelectAllItemRows,
      calcDialog, handleOpenCalcDialog, handleCloseCalcDialog,
      courierCodes,
      pickerState, handlePickerOpen, handlePickerSearch, handlePickerSelect,
      handleClose,
      fnItemHasDliv, fnItemHasSettleClosed, fnItemHasVoucher,
      handleItemDlivIconClick, handleItemSettleIconClick, handleItemVoucherIconClick,
      fnClaimHasDliv, fnClaimHasSettleClosed, fnClaimHasVoucher,
      handleClaimDlivIconClick, handleClaimSettleIconClick, handleClaimVoucherIconClick,
    };
  },

  template: `
<div class="od-kanban-wrap">

  <!-- ① 헤더 -->
  <div class="od-kanban-hdr">
    <span class="od-kanban-hdr-title">📋 주문 칸반 보드</span>
    <span class="od-kanban-hdr-id is-order-id"
      :style="fnIsHlId(cfOrderId) ? 'outline:2px solid #16a34a;background:#dcfce7;border-radius:4px;' : ''"
    >{{ cfOrderId }}</span>
    <button v-if="asModal" class="od-kanban-hdr-close" @click="handleClose">✕</button>
  </div>

  <!-- ② 검색바 -->
  <div class="od-kanban-search">
    <div class="od-kanban-search-group">
      <span class="od-kanban-search-label">주문번호</span>
      <input v-model="searchParam.orderId" placeholder="주문번호 입력" style="width:150px;"
        @keyup.enter="handleSearch" />
      <button class="od-kanban-pick-btn" @click="handlePickerOpen('order')" title="주문 선택">🔎</button>
    </div>
    <div class="od-kanban-search-group">
      <span class="od-kanban-search-label">클레임번호</span>
      <input v-model="searchParam.claimId" placeholder="클레임번호 입력" style="width:160px;font-family:monospace;"
        @keyup.enter="handleSearch" />
      <button class="od-kanban-pick-btn" @click="handlePickerOpen('claim')" title="클레임 선택">🔎</button>
    </div>
    <button class="btn-search" @click="handleSearch">🔍 조회</button>
    <button class="btn-reset" @click="handleSearchReset">초기화</button>
  </div>


  <!-- 로딩 -->
  <div v-if="uiState.loading" class="od-kanban-loading">⏳ 불러오는 중...</div>

  <!-- 조회 전 안내 -->
  <div v-else-if="!currentOrderId" class="od-kanban-empty" style="padding:48px;font-size:13px;color:#94a3b8;">
    주문번호 또는 클레임번호를 입력하고 조회하세요.
  </div>

  <template v-else>

    <!-- ④ 주문 요약 -->
    <dl class="od-kanban-order-info">
      <div><dt>회원</dt><dd>{{ cfMemberNm }}</dd></div>
      <div><dt>주문일시</dt><dd>{{ cfOrderDate }}</dd></div>
      <div><dt>결제금액</dt><dd>{{ cfTotalAmt }}</dd></div>
      <div><dt>결제수단</dt><dd>{{ cfPayMethod }}</dd></div>
      <div><dt>주문상태</dt><dd><span class="od-kanban-status-badge">{{ cfOrderStatus }}</span></dd></div>
    </dl>

    <!-- ④-B ID 패널 -->
    <div class="od-kanban-id-panel">
      <button class="od-kanban-id-toggle" @click="uiState.idPanelOpen = !uiState.idPanelOpen"
        :title="uiState.idPanelOpen ? 'ID 패널 접기' : 'ID 패널 펼치기'">
        🏷 {{ uiState.idPanelOpen ? '▲' : '▼' }}
      </button>
      <button class="od-kanban-id-toggle"
        :disabled="!Object.keys(uiState.hlIdValues).length"
        :style="Object.keys(uiState.hlIdValues).length ? 'color:#ef4444;border:1px solid #fca5a5;background:#fff1f2;' : 'color:#cbd5e1;border:1px solid #e2e8f0;background:#f8fafc;cursor:default;'"
        @click="handleHlIdClear" title="강조 전체 해제">✕ 해제</button>
      <div v-if="uiState.idPanelOpen" class="od-kanban-id-chips">
        <span v-for="chip in cfIdChips" :key="chip.val"
          :class="['od-kanban-id-chip', 'chip-' + chip.type, fnIsHlId(chip.val) ? 'chip-active' : '']"
          @click="handleHlIdValue(chip.val)"
          :title="chip.val"
        >{{ chip.label }}<span class="od-kanban-id-chip-val">{{ chip.val }}</span></span>
      </div>
    </div>

    <!-- ⑤ 주문항목 칸반 — 초록 테마 -->
    <div class="od-kanban-section kanban-theme-order">
      <div class="od-kanban-section-title-bar" style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;font-weight:800;color:#15803d;">🟢 주문</span>
      </div>

      <div v-if="!orderItems.length" class="od-kanban-empty">주문항목이 없습니다.</div>

      <div v-for="(item, idx) in orderItems" :key="item.orderItemId || item.order_item_id || idx" style="margin-bottom:8px;">

        <!-- 칸반 보드 -->
        <div class="od-kanban-board">
          <div v-for="step in ORDER_STEPS" :key="step.key" class="od-kanban-col">
            <div
              :class="['od-kanban-col-hdr', fnIsOrderItemStep(item, step.key) ? 'active-col' : '', fnIsDragOverOrderItemCol(step.key) ? 'drag-over-col' : '']"
            ><span style="display:inline-flex;align-items:center;justify-content:center;gap:3px;width:100%;">{{ step.icon }} {{ step.label }}</span></div>
            <div
              :class="['od-kanban-col-body', fnIsDragOverOrderItemCol(step.key) ? 'drag-over-body' : '']"
              :style="!fnIsOrderItemStep(item, step.key) &amp;&amp; !fnIsDragOverOrderItemCol(step.key) ? 'min-height:0;padding:0;' : ''"
              @dragover="handleDragOver($event, step.key, 'orderItem')"
              @dragleave="handleDragLeave($event, step.key, 'orderItem')"
              @drop="handleDropOrderItem($event, step.key)"
            >
              <div
                v-if="fnIsOrderItemStep(item, step.key)"
                :class="['od-kanban-card', fnIsHlOrderItem(item) ? 'hl-card' : '', fnSettleLockState(item.orderItemId || item.order_item_id) === 'blocked' ? 'locked-card' : '', dragState.id === (item.orderItemId || item.order_item_id) ? 'dragging-card' : '']"
              >
                <div class="od-kanban-card-hdr">
                  <span
                    v-if="!cfReadonly &amp;&amp; fnSettleLockState(item.orderItemId || item.order_item_id) !== 'blocked'"
                    class="od-kanban-drag-handle"
                    draggable="true"
                    @dragstart="handleDragStart($event, item.orderItemId || item.order_item_id, 'orderItem', step.key)"
                    @dragend="handleDragEnd"
                    title="드래그하여 이동"
                  >☰</span>
                  <span v-else style="min-width:20px;"></span>
                  <span :class="['od-kanban-card-hdr-id', fnIsHlOrderItem(item) ? 'hl-id' : '']"
                    :style="fnIsHlId(item.orderItemId || item.order_item_id) ? 'outline:2px solid #2563eb;background:#dbeafe;border-radius:4px;' : ''"
                  >{{ item.orderItemId || item.order_item_id || '' }}</span>
                  <div class="od-kanban-card-hdr-icons">
                    <button v-if="fnItemHasDliv(item)" class="od-kanban-card-icon-btn" title="배송정보" @click.stop="handleItemDlivIconClick(item)">🚚</button>
                    <button v-if="fnItemHasSettleClosed(item)" class="od-kanban-card-icon-btn" title="정산마감" @click.stop="handleItemSettleIconClick(item)">🔒</button>
                    <button v-if="fnItemHasVoucher(item)" class="od-kanban-card-icon-btn" title="ERP전표" @click.stop="handleItemVoucherIconClick(item)">📄</button>
                  </div>
                </div>
                <div class="od-kanban-card-body">
                  <div class="od-kanban-card-nm">
                    {{ item.prodNm || item.prod_nm || '—' }}
                    <span v-if="item.orderQty || item.order_qty" class="od-kanban-card-qty">{{ item.orderQty || item.order_qty }}</span>
                  </div>
                  <div v-if="item.optItemNm1 || item.opt_item_nm1" class="od-kanban-card-meta">
                    {{ [item.optItemNm1 || item.opt_item_nm1, item.optItemNm2 || item.opt_item_nm2].filter(Boolean).join(' / ') }}
                  </div>
                  <div v-if="item.dlivId || item.dliv_id"
                    class="od-kanban-card-meta" style="font-family:monospace;font-size:9px;opacity:.7;"
                    :style="fnIsHlId(item.dlivId || item.dliv_id) ? 'outline:2px solid #ea580c;background:#ffedd5;border-radius:4px;opacity:1;' : ''"
                  >🚚 {{ item.dlivId || item.dliv_id || '' }}</div>
                </div>
                <div v-if="!cfReadonly &amp;&amp; fnOrderItemActions(item).length" class="od-kanban-card-actions">
                  <div class="od-kanban-card-actions-left">
                    <button v-for="act in fnOrderItemActions(item).filter(function(a){return a.side==='left';})" :key="act.key"
                      :class="['od-kanban-act-btn', act.cls]"
                      @click.stop="handleChangeOrderItemStatus(item, act.key)"
                    >◃ {{ act.label }}</button>
                  </div>
                  <div class="od-kanban-card-actions-divider"></div>
                  <div class="od-kanban-card-actions-right">
                    <button v-for="act in fnOrderItemActions(item).filter(function(a){return a.side==='right';})" :key="act.key"
                      :class="['od-kanban-act-btn', act.cls]"
                      @click.stop="handleChangeOrderItemStatus(item, act.key)"
                    >{{ act.label }} ▹</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ⑥ 클레임 칸반 -->
    <template v-if="claims.length">
      <hr class="od-kanban-divider" />

      <template v-for="(claim, cidx) in claims" :key="claim.claimId || claim.claim_id || cidx">
      <div
        v-if="fnClaimFlow(claim).some(function(s){ return s.key === (claim.claimStatusCd || claim.claim_status_cd); })"
        :class="['od-kanban-section', 'kanban-theme-' + (fnClaimTypeKey(claim) === 'CANCEL' ? 'cancel' : fnClaimTypeKey(claim) === 'RETURN' ? 'return' : 'exchange')]"
        style="margin-top:6px;"
      >
        <!-- 클레임 섹션 제목 -->
        <div class="od-kanban-section-title-bar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:14px;font-weight:800;">
            {{ fnClaimTypeKey(claim) === 'CANCEL' ? '🔴 취소' : fnClaimTypeKey(claim) === 'RETURN' ? '🩷 반품' : '🔵 교환' }}
          </span>
          <span style="font-family:monospace;font-size:11px;font-weight:700;opacity:.75;"
            :style="fnIsHlId(claim.claimId || claim.claim_id) ? 'outline:2px solid #db2777;background:#fce7f3;border-radius:4px;opacity:1;' : ''"
          >{{ claim.claimId || claim.claim_id || '' }}</span>
          <span style="font-size:11px;color:#475569;font-weight:600;">{{ claim.prodNm || claim.prod_nm || '' }}</span>
          <span style="font-size:10px;color:#94a3b8;margin-left:auto;">{{ (claim.requestDate || claim.request_date || claim.regDate || claim.reg_date || '').slice(0, 10) }}</span>
        </div>

        <!-- 클레임 칸반 보드 (반품/교환=2행, 취소=1행) -->
        <div :class="fnClaimTypeKey(claim) !== 'CANCEL' ? 'od-kanban-exchange-rows' : ''">
          <template v-for="rowGroup in fnClaimFlowRows(claim)" :key="rowGroup.rowNo">
            <div :class="fnClaimTypeKey(claim) !== 'CANCEL' ? 'od-kanban-exchange-row-wrap' : ''">
            <div v-if="rowGroup.label"
              :class="['od-kanban-exchange-row-label', rowGroup.rowNo === 1 ? 'row-pickup' : (fnClaimTypeKey(claim) === 'RETURN' ? 'row-refund' : 'row-dliv')]"
            >{{ rowGroup.label }}</div>
            <div :class="fnClaimTypeKey(claim) !== 'CANCEL' ? 'od-kanban-exchange-row-board' : ''" style="width:100%;">
            <div
              class="od-kanban-board"
              style="border-radius:0;overflow:hidden;width:100%;"
            >
              <div v-for="step in rowGroup.steps" :key="step.key" class="od-kanban-col">
                <div
                  :class="['od-kanban-col-hdr', fnIsClaimStep(claim, step.key) ? 'active-col' : '', fnIsDragOverClaimCol(claim, step.key) ? 'drag-over-col' : '']"
                ><span style="display:inline-flex;align-items:center;justify-content:center;gap:3px;width:100%;">{{ step.icon }} {{ step.label }}</span></div>
                <div
                  :class="['od-kanban-col-body', fnIsDragOverClaimCol(claim, step.key) ? 'drag-over-body' : '']"
                  :style="!fnIsClaimStep(claim, step.key) &amp;&amp; !fnIsDragOverClaimCol(claim, step.key) ? 'min-height:48px;' : ''"
                  @dragover="handleDragOver($event, step.key, 'claim_' + (claim.claimId || claim.claim_id))"
                  @dragleave="handleDragLeave($event, step.key, 'claim_' + (claim.claimId || claim.claim_id))"
                  @drop="handleDropClaim($event, claim, step.key)"
                >
                  <div
                    v-if="fnIsClaimStep(claim, step.key)"
                    :class="['od-kanban-card', fnIsHlClaim(claim) ? 'hl-card' : '', dragState.id === (claim.claimId || claim.claim_id) ? 'dragging-card' : '']"
                  >
                    <div class="od-kanban-card-hdr">
                      <span
                        v-if="!cfReadonly"
                        class="od-kanban-drag-handle"
                        draggable="true"
                        @dragstart="handleDragStart($event, claim.claimId || claim.claim_id, 'claim', step.key)"
                        @dragend="handleDragEnd"
                        title="드래그하여 이동"
                      >☰</span>
                      <span v-else style="min-width:20px;"></span>
                      <span :class="['od-kanban-card-hdr-id', fnIsHlClaim(claim) ? 'hl-id' : '']"
                        :style="fnIsHlId(claim._claimItemId || claim.claimId || claim.claim_id) ? 'outline:2px solid #db2777;background:#fce7f3;border-radius:4px;' : ''"
                      >{{ claim._claimItemId || claim.claimId || claim.claim_id || '' }}</span>
                      <span v-if="claim._orderItemId" class="od-kanban-card-hdr-sub"
                        :style="fnIsHlId(claim._orderItemId) ? 'outline:2px solid #2563eb;background:#dbeafe;border-radius:3px;opacity:1;' : ''"
                      >{{ claim._orderItemId }}</span>
                      <div class="od-kanban-card-hdr-icons">
                        <button class="od-kanban-card-icon-btn" title="환불 계산" style="font-size:9px;padding:1px 4px;" @click.stop="handleOpenCalcDialog(claim)">💰</button>
                        <button v-if="fnClaimHasDliv(claim)" class="od-kanban-card-icon-btn" title="배송정보" @click.stop="handleClaimDlivIconClick(claim)">🚚</button>
                        <button v-if="fnClaimHasSettleClosed(claim)" class="od-kanban-card-icon-btn" title="정산마감" @click.stop="handleClaimSettleIconClick(claim)">🔒</button>
                        <button v-if="fnClaimHasVoucher(claim)" class="od-kanban-card-icon-btn" title="ERP전표" @click.stop="handleClaimVoucherIconClick(claim)">📄</button>
                      </div>
                    </div>
                    <div class="od-kanban-card-body">
                      <div v-if="claim.prodNm || claim.prod_nm" class="od-kanban-card-nm">
                        {{ claim.prodNm || claim.prod_nm }}
                        <span v-if="claim.claimQty || claim.claim_qty" class="od-kanban-card-qty">{{ claim.claimQty || claim.claim_qty }}</span>
                      </div>
                      <div v-if="claim.prodOption || claim.prod_option" class="od-kanban-card-meta">
                        {{ claim.prodOption || claim.prod_option }}
                      </div>
                      <div v-if="claim.dlivId || claim.dliv_id || claim.exchangeDlivId || claim.exchange_dliv_id"
                        class="od-kanban-card-meta" style="font-family:monospace;font-size:9px;opacity:.7;"
                        :style="fnIsHlId(claim.dlivId || claim.dliv_id || claim.exchangeDlivId || claim.exchange_dliv_id) ? 'outline:2px solid #ea580c;background:#ffedd5;border-radius:4px;opacity:1;' : ''"
                      >🚚 {{ claim.dlivId || claim.dliv_id || claim.exchangeDlivId || claim.exchange_dliv_id || '' }}</div>
                    </div>
                    <div v-if="!cfReadonly &amp;&amp; fnClaimActions(claim).length" class="od-kanban-card-actions">
                      <div class="od-kanban-card-actions-left">
                        <button v-for="act in fnClaimActions(claim).filter(function(a){return a.side==='left';})" :key="act.key"
                          :class="['od-kanban-act-btn', act.cls]"
                          @click.stop="handleChangeClaimStatus(claim, act.key)"
                        >◃ {{ act.label }}</button>
                      </div>
                      <div class="od-kanban-card-actions-divider"></div>
                      <div class="od-kanban-card-actions-right">
                        <button v-for="act in fnClaimActions(claim).filter(function(a){return a.side==='right';})" :key="act.key"
                          :class="['od-kanban-act-btn', act.cls]"
                          @click.stop="handleChangeClaimStatus(claim, act.key)"
                        >{{ act.label }} ▹</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            </div>
          </template>
        </div>

      </div>
      </template>
    </template>

  </template>

  <!-- ── picker 모달 ── -->
  <teleport to="body">
    <div v-if="pickerState.show" class="od-kanban-pick-overlay" @mousedown.self="pickerState.show=false">
      <div class="od-kanban-pick-box">
        <div class="od-kanban-pick-hdr">
          <span style="font-size:18px;line-height:1;">{{ pickerState.type === 'order' ? '📦' : '🏷' }}</span>
          <span class="od-kanban-pick-hdr-title">{{ pickerState.type === 'order' ? '주문 선택' : '클레임 선택' }}</span>
          <button class="od-kanban-pick-hdr-close" @click="pickerState.show=false">✕</button>
        </div>
        <div class="od-kanban-pick-body">
          <div class="od-kanban-pick-search">
            <div class="od-kanban-pick-search-row">
              <span class="od-kanban-pick-search-lbl">검색어</span>
              <div class="od-kanban-pick-search-fields">
                <input v-model="pickerState.keyword"
                  :placeholder="pickerState.type === 'order' ? '주문번호 입력...' : '클레임번호 / 주문번호 입력...'"
                  @keyup.enter="handlePickerSearch" style="flex:2;min-width:120px;" />
                <input v-model="pickerState.memberNm" placeholder="회원명"
                  @keyup.enter="handlePickerSearch" style="flex:1;min-width:70px;" />
              </div>
            </div>
            <div class="od-kanban-pick-search-row">
              <span class="od-kanban-pick-search-lbl">생성일</span>
              <div class="od-kanban-pick-search-fields">
                <input type="date" v-model="pickerState.dateStart" @keyup.enter="handlePickerSearch" style="flex:1;" />
                <span style="color:#94a3b8;font-size:13px;">~</span>
                <input type="date" v-model="pickerState.dateEnd" @keyup.enter="handlePickerSearch" style="flex:1;" />
                <button @click="handlePickerSearch">조회</button>
              </div>
            </div>
          </div>
          <div class="od-kanban-pick-table">
            <div v-if="pickerState.loading" class="od-kanban-pick-loading">⏳ 조회 중...</div>
            <div v-else-if="!pickerState.rows.length" class="od-kanban-pick-empty">조회 결과가 없습니다.</div>
            <table v-else>
              <thead>
                <tr v-if="pickerState.type === 'order'">
                  <th>주문번호</th><th>회원</th><th>결제금액</th><th>주문상태</th><th>주문일시</th><th></th>
                </tr>
                <tr v-else>
                  <th>클레임번호</th><th>유형</th><th>주문번호</th><th>회원</th><th>상태</th><th>생성일시</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pickerState.rows" :key="row.orderId || row.claimId" @click="handlePickerSelect(row)">
                  <template v-if="pickerState.type === 'order'">
                    <td style="font-family:monospace;font-size:11px;">{{ row.orderId }}</td>
                    <td>{{ row.memberNm || '-' }}</td>
                    <td style="text-align:right;">{{ row.totalAmt != null ? row.totalAmt.toLocaleString() + '원' : '-' }}</td>
                    <td><span style="font-size:11px;color:#64748b;">{{ row.orderStatusCdNm || row.orderStatusCd }}</span></td>
                    <td style="font-size:11px;color:#94a3b8;white-space:nowrap;">{{ row.orderDate ? String(row.orderDate).slice(0,16).replace('T',' ') : '-' }}</td>
                  </template>
                  <template v-else>
                    <td style="font-family:monospace;font-size:11px;">{{ row.claimId }}</td>
                    <td><span style="font-size:11px;">{{ row.claimTypeCd === 'RETURN' ? '반품' : row.claimTypeCd === 'CANCEL' ? '취소' : row.claimTypeCd === 'EXCHANGE' ? '교환' : row.claimTypeCd }}</span></td>
                    <td style="font-family:monospace;font-size:11px;">{{ row.orderId }}</td>
                    <td>{{ row.memberNm || '-' }}</td>
                    <td><span style="font-size:11px;color:#64748b;">{{ row.claimStatusCdNm || row.claimStatusCd }}</span></td>
                    <td style="font-size:11px;color:#94a3b8;white-space:nowrap;">{{ row.requestDate ? String(row.requestDate).slice(0,16).replace('T',' ') : (row.regDate ? String(row.regDate).slice(0,16).replace('T',' ') : '-') }}</td>
                  </template>
                  <td><button class="od-kanban-pick-row-select">선택</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="pickerState.pageTotalPage > 1" class="od-kanban-pick-pager">
            <button class="od-kanban-pick-pager-btn" :disabled="pickerState.pageNo <= 1" @click="handlePickerSearch(1)">«</button>
            <button class="od-kanban-pick-pager-btn" :disabled="pickerState.pageNo <= 1" @click="handlePickerSearch(pickerState.pageNo - 1)">‹</button>
            <template v-for="n in pickerState.pageTotalPage" :key="n">
              <button v-if="n >= pickerState.pageNo - 2 &amp;&amp; n <= pickerState.pageNo + 2"
                class="od-kanban-pick-pager-btn" :class="{ active: n === pickerState.pageNo }"
                @click="handlePickerSearch(n)">{{ n }}</button>
            </template>
            <button class="od-kanban-pick-pager-btn" :disabled="pickerState.pageNo >= pickerState.pageTotalPage" @click="handlePickerSearch(pickerState.pageNo + 1)">›</button>
            <button class="od-kanban-pick-pager-btn" :disabled="pickerState.pageNo >= pickerState.pageTotalPage" @click="handlePickerSearch(pickerState.pageTotalPage)">»</button>
            <span class="od-kanban-pick-pager-info">{{ pickerState.pageNo }} / {{ pickerState.pageTotalPage }}p · 총 {{ pickerState.pageTotalCount }}건</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- ── 메모 확인 다이얼로그 ── -->
  <teleport to="body">
    <div v-if="memoDialog.show" class="od-kanban-memo-overlay" @mousedown.self="handleMemoDialogCancel">
      <div class="od-kanban-memo-box">
        <div class="od-kanban-memo-hdr">
          <span class="od-kanban-memo-hdr-icon">💾</span>
          <span class="od-kanban-memo-title">{{ memoDialog.title }}</span>
          <button class="od-kanban-memo-hdr-close" @click="handleMemoDialogCancel" title="닫기">✕</button>
        </div>
        <div class="od-kanban-memo-body">
          <div class="od-kanban-memo-desc">{{ memoDialog.desc }}</div>
          <div v-if="memoDialog.itemRows.length" class="od-kanban-item-rows">
            <div class="od-kanban-item-rows-hdr">
              <span class="od-kanban-item-rows-title">🛍️ 주문 상품 목록</span>
              <div style="display:flex;gap:4px;">
                <button class="od-kanban-item-rows-all-btn" @click="handleSelectAllItemRows">전체주문상품선택</button>
                <button class="od-kanban-item-rows-all-btn" style="border-color:#059669;color:#059669;" @click="handleOpenCalcDialog('memo-preview')">💰 계산</button>
              </div>
            </div>
            <table class="od-kanban-item-table">
              <thead><tr>
                <th style="width:24px;"></th>
                <th style="text-align:left;">상품명</th>
                <th>옵션1</th>
                <th>옵션2</th>
                <th>수량</th>
                <th>클레임수량</th>
              </tr></thead>
              <tbody>
                <tr v-for="(row, ri) in memoDialog.itemRows" :key="row.orderItemId || ri"
                  :class="{ 'row-checked': row.checked }">
                  <td style="text-align:center;">
                    <input type="checkbox" v-model="row.checked" style="cursor:pointer;" />
                  </td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="row.prodNm">{{ row.prodNm }}</td>
                  <td style="text-align:center;">{{ row.optItemNm1 || '-' }}</td>
                  <td style="text-align:center;">{{ row.optItemNm2 || '-' }}</td>
                  <td style="text-align:center;">{{ row.orderQty }}</td>
                  <td style="text-align:center;">
                    <input type="number" class="od-kanban-claim-qty-input"
                      :value="row.claimQty" min="0" :max="row.orderQty"
                      @input="e => handleItemRowClaimQtyInput(row, e)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="memoDialog.dlivFields.length" class="od-kanban-dliv-section">
            <div class="od-kanban-dliv-section-title">🚚 배송 정보 입력</div>
            <div class="od-kanban-dliv-grid">
              <div v-for="f in memoDialog.dlivFields" :key="f.key" class="od-kanban-dliv-pair">
                <div :class="['od-kanban-dliv-pair-lbl', f.required ? 'req' : '']">{{ f.label }}</div>
                <div class="od-kanban-dliv-pair-row">
                  <template v-if="f.isCourier">
                    <select :class="['od-kanban-dliv-courier-sel', f.error ? 'err' : '']"
                      :value="f.courierCd"
                      @change="e => { const opt = courierCodes.find(c => c.codeValue === e.target.value); f.courierCd = e.target.value; f.value = opt ? opt.codeLabel : e.target.value; f.error = ''; }">
                      <option value="">택배사 선택...</option>
                      <option v-for="c in courierCodes" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                    </select>
                  </template>
                  <template v-else>
                    <input class="od-kanban-dliv-input" :class="{ err: f.error }"
                      v-model="f.value" placeholder="송장번호 입력..."
                      @input="f.error = ''" />
                  </template>
                </div>
                <span v-if="f.error" class="od-kanban-dliv-err">{{ f.error }}</span>
              </div>
            </div>
          </div>
          <div class="od-kanban-memo-label">메모 (선택)</div>
          <textarea class="od-kanban-memo-ta" v-model="memoDialog.memo"
            placeholder="상태 변경 사유나 메모를 입력하세요..."
            @keydown.ctrl.enter="handleMemoDialogOk"></textarea>
          <div class="od-kanban-memo-actions">
            <button class="od-kanban-memo-btn-cancel" @click="handleMemoDialogCancel">취소</button>
            <button class="od-kanban-memo-btn-ok" @click="handleMemoDialogOk">확인</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- ── 클레임 금액 계산 다이얼로그 (claimId 있는 경우: 공용 풀모달) ── -->
  <od-claim-calc-modal :show="calcDialog.show &amp;&amp; !!calcDialog.claimId" :claim-id="calcDialog.claimId" @close="handleCloseCalcDialog" />
  <!-- ── 클레임 금액 계산 다이얼로그 (memo-preview: claimId 없는 간단 오버레이) ── -->
  <teleport to="body">
    <div v-if="calcDialog.show &amp;&amp; !calcDialog.claimId" class="od-kanban-calc-overlay" @mousedown.self="handleCloseCalcDialog">
      <div class="od-kanban-calc-box">
        <div class="od-kanban-calc-hdr">
          <span class="od-kanban-calc-hdr-icon">💰</span>
          <span class="od-kanban-calc-hdr-title">
            환불 예정 계산
            <span v-if="calcDialog.claimType" style="font-size:11px;font-weight:600;margin-left:8px;opacity:.7;">
              ({{ calcDialog.claimType === 'CANCEL' ? '취소' : calcDialog.claimType === 'RETURN' ? '반품' : calcDialog.claimType === 'EXCHANGE' ? '교환' : calcDialog.claimType }})
            </span>
            <span v-if="calcDialog.claimId" style="font-size:10px;font-weight:400;color:#6b7280;margin-left:6px;">{{ calcDialog.claimId }}</span>
          </span>
          <button class="od-kanban-calc-hdr-close" @click="handleCloseCalcDialog">✕</button>
        </div>
        <div class="od-kanban-calc-body">
          <div v-if="calcDialog.loading" class="od-kanban-calc-loading">⏳ 계산 중...</div>
          <template v-else-if="calcDialog.data">
            <!-- 클레임 항목 테이블 -->
            <div class="od-kanban-calc-section">
              <div class="od-kanban-calc-section-title">🛍️ 클레임 대상 항목</div>
              <table class="od-kanban-calc-items-table">
                <thead><tr>
                  <th style="text-align:left;">상품명</th>
                  <th>클레임수량</th>
                  <th style="text-align:right;">항목금액</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(it, i) in (calcDialog.data.claim.claimItems || [])" :key="i">
                    <td>{{ it.prodNm || it.prod_nm || '-' }}</td>
                    <td style="text-align:center;">{{ it.claimQty || it.claim_qty || 1 }}</td>
                    <td style="text-align:right;font-family:monospace;">
                      {{ (it.itemAmt || it.item_amt || 0).toLocaleString() }}원
                    </td>
                  </tr>
                  <tr v-if="!(calcDialog.data.claim.claimItems || []).length">
                    <td colspan="3" style="text-align:center;color:#94a3b8;">항목 없음</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- 금액 계산 내역 -->
            <div class="od-kanban-calc-section">
              <div class="od-kanban-calc-section-title">📊 환불 계산 내역</div>
              <div class="od-kanban-calc-row">
                <span class="od-kanban-calc-label">클레임 항목 금액</span>
                <span class="od-kanban-calc-value">{{ calcDialog.data.calc.itemAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="calcDialog.data.calc.dlivFeeRefund > 0" class="od-kanban-calc-row refund">
                <span class="od-kanban-calc-label">배송비 환불 (전체취소)</span>
                <span class="od-kanban-calc-value">+ {{ calcDialog.data.calc.dlivFeeRefund.toLocaleString() }}원</span>
              </div>
              <div v-if="calcDialog.data.calc.couponDiscAmt > 0" class="od-kanban-calc-row deduct">
                <span class="od-kanban-calc-label">쿠폰 할인 차감
                  <span v-if="calcDialog.data.calc.couponNm" style="font-size:10px;margin-left:4px;color:#9ca3af;">({{ calcDialog.data.calc.couponNm }})</span>
                </span>
                <span class="od-kanban-calc-value">- {{ calcDialog.data.calc.couponDiscAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="calcDialog.data.calc.saveUsedAmt > 0" class="od-kanban-calc-row deduct">
                <span class="od-kanban-calc-label">적립금 사용 차감</span>
                <span class="od-kanban-calc-value">- {{ calcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</span>
              </div>
              <div v-if="calcDialog.data.calc.cacheUsedAmt > 0" class="od-kanban-calc-row deduct">
                <span class="od-kanban-calc-label">충전금(캐시) 사용 차감</span>
                <span class="od-kanban-calc-value">- {{ calcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
              </div>
              <div class="od-kanban-calc-row total">
                <span class="od-kanban-calc-label">환불 예정액</span>
                <span class="od-kanban-calc-value" style="color:#059669;font-size:15px;">
                  {{ calcDialog.data.calc.refundBase.toLocaleString() }}원
                </span>
              </div>
            </div>
            <!-- 프로모션 복구 정보 -->
            <div v-if="calcDialog.data.calc.couponDiscAmt > 0 || calcDialog.data.calc.saveUsedAmt > 0 || calcDialog.data.calc.cacheUsedAmt > 0"
              class="od-kanban-calc-section">
              <div class="od-kanban-calc-section-title">🎁 프로모션 복구 정보</div>
              <div v-if="calcDialog.data.calc.couponDiscAmt > 0" class="od-kanban-calc-row">
                <span class="od-kanban-calc-label">쿠폰 복구</span>
                <span><span class="od-kanban-calc-chip orange">쿠폰 재발급 필요</span></span>
              </div>
              <div v-if="calcDialog.data.calc.saveUsedAmt > 0" class="od-kanban-calc-row">
                <span class="od-kanban-calc-label">적립금 복구</span>
                <span>
                  <span class="od-kanban-calc-chip green">{{ calcDialog.data.calc.saveUsedAmt.toLocaleString() }}원 복구</span>
                  <span v-if="calcDialog.data.calc.saveGradePct" class="od-kanban-calc-chip gray" style="margin-left:2px;">등급 적립 {{ calcDialog.data.calc.saveGradePct }}%</span>
                </span>
              </div>
              <div v-if="calcDialog.data.calc.cacheUsedAmt > 0" class="od-kanban-calc-row">
                <span class="od-kanban-calc-label">충전금 복구</span>
                <span><span class="od-kanban-calc-chip blue">{{ calcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원 복구</span></span>
              </div>
            </div>
            <!-- 참고 -->
            <div class="od-kanban-calc-note">
              ※ 비례 계산 기준: 클레임 항목 금액 / 전체 주문 상품금액 ({{ Math.round(calcDialog.data.calc.ratio * 100) }}%)
              <br>※ 실제 환불액은 결제 수단별 정책 및 배송비 공제 여부에 따라 달라질 수 있습니다.
            </div>
          </template>
        </div>
        <div class="od-kanban-calc-actions">
          <button class="od-kanban-calc-close-btn" @click="handleCloseCalcDialog">닫기</button>
        </div>
      </div>
    </div>
  </teleport>

</div>
`,
};
