/* ZdSimulNotiSms — ZdSimulNotiMng 을 mode='sms' 로 갈아끼운 래퍼.
 * 실제 좌측 메뉴 zdSimulNotiSms('메시지전송(SMS)') 전용 진입점. */
import ZdSimulNotiMng from './ZdSimulNotiMng.js';

export default {
  ...ZdSimulNotiMng,
  name: 'zd-simul-zdSimulNotiSms',
  props: { ...ZdSimulNotiMng.props, mode: { type: String, default: 'sms' } },
};
