/* ZdSimulNotiNotice — ZdSimulNotiMng 을 mode='notice' 로 갈아끼운 래퍼.
 * 실제 좌측 메뉴 zdSimulNotiNotice('공지사항생성') 전용 진입점. */
import ZdSimulNotiMng from './ZdSimulNotiMng.js';

export default {
  ...ZdSimulNotiMng,
  name: 'zd-simul-zdSimulNotiNotice',
  props: { ...ZdSimulNotiMng.props, mode: { type: String, default: 'notice' } },
};
