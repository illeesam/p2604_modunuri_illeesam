/* ZdSimulNotiKakao — ZdSimulNotiMng 을 mode='kakao' 로 갈아끼운 래퍼.
 * 실제 좌측 메뉴 zdSimulNotiKakao('메시지전송(알림톡)') 전용 진입점.
 * 본체(ZdSimulNotiMng.js)는 mode prop 하나로 6개 채널을 전부 커버하므로,
 * 여기서는 default mode 만 바꿔치기한다 — 로직/템플릿 중복 없음. */
import ZdSimulNotiMng from './ZdSimulNotiMng.js';

export default {
  ...ZdSimulNotiMng,
  name: 'zd-simul-zdSimulNotiKakao',
  props: { ...ZdSimulNotiMng.props, mode: { type: String, default: 'kakao' } },
};
