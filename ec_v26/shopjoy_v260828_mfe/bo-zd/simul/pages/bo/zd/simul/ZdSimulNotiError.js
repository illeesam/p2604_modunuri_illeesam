/* ZdSimulNotiError — ZdSimulNotiMng 을 mode='error' 로 갈아끼운 래퍼.
 * 실제 좌측 메뉴 zdSimulNotiError('오류정보생성') 전용 진입점. */
import ZdSimulNotiMng from './ZdSimulNotiMng.js';

export default {
  ...ZdSimulNotiMng,
  name: 'zd-simul-zdSimulNotiError',
  props: { ...ZdSimulNotiMng.props, mode: { type: String, default: 'error' } },
};
