/* ZdSimulNotiChat — ZdSimulNotiMng 을 mode='chat' 으로 갈아끼운 래퍼.
 * 실제 좌측 메뉴 zdSimulNotiChat('메시지전송(채팅)') 전용 진입점. */
import ZdSimulNotiMng from './ZdSimulNotiMng.js';

export default {
  ...ZdSimulNotiMng,
  name: 'zd-simul-zdSimulNotiChat',
  props: { ...ZdSimulNotiMng.props, mode: { type: String, default: 'chat' } },
};
