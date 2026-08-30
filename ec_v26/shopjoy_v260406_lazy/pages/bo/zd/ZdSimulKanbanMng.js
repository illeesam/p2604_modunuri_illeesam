/* ZdSimulKanbanMng — 주문칸반 시뮬레이터 (메뉴 stub, kanban 화면으로 연결) */
window.ZdSimulKanbanMng = {
  name: 'ZdSimulKanbanMng',
  props: {
    navigate:    { type: Function, required: true },
    showToast:   { type: Function, default: () => {} },
    showConfirm: { type: Function, default: () => Promise.resolve(true) },
  },
  setup(props) {
    const onGoKanban = () => props.navigate('odOrderKanban');
    return { onGoKanban };
  },
  template: `
<div>
  <div class="page-title">🎲 주문칸반 시뮬레이터</div>
  <div class="card" style="padding:40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🗂️</div>
    <div style="font-size:18px;font-weight:600;margin-bottom:8px;color:#334155;">주문 칸반 시뮬레이션</div>
    <div style="color:#888;margin-bottom:24px;line-height:1.7;">
      주문 칸반 화면에서 직접 드래그 앤 드롭으로<br>
      주문 상태 변경 및 클레임 계산 시뮬레이션을 할 수 있습니다.
    </div>
    <button class="btn btn_preview" @click="onGoKanban">📋 주문칸반 화면으로 이동</button>
  </div>
</div>`,
};
