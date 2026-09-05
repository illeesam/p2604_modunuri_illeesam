/* ShopJoy - 대시보드 메뉴관리 (공용)
 *
 *  좌측메뉴 '대시보드' 그룹의 구성을 관리한다. 구성 화면 자체는
 *  CmDashboardMenuMng 과 완전히 같고 대상만 다르므로(공용 vs 개인)
 *  scope="SYS" 만 넘겨 그대로 재사용한다.
 *
 *  화면을 통째로 복사하지 않는 이유: 드래그·폴더·저장 로직이 200줄 넘게 같고,
 *  한쪽만 고치면 반드시 어긋난다. 다른 것은 "어떤 대시보드를 담는가" 하나뿐이다.
 */
window.CmDashboardSysMenuMng = {
  name: 'CmDashboardSysMenuMng',
  props: {
    navigate:  { type: Function, required: true },    // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  template: /* html */ `
<cm-dashboard-menu-mng scope="SYS" :navigate="navigate" :show-toast="showToast" />
`,
};
