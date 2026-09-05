/**
 * 안전한 데이터 접근 유틸리티
 * null/undefined 방지 로직
 */
window.safeUtil = {
  /**
   * 객체의 값을 안전하게 가져옴
   * @param {*} obj - 대상 객체
   * @param {string} path - 경로 (예: 'user.profile.name' 또는 'items[0].id')
   * @param {*} defaultValue - 기본값
   * @returns {*}
   */
  get(obj, path, defaultValue = null) {
    if (obj == null) return defaultValue;

    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let result = obj;

    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }

    return result ?? defaultValue;
  },

  /**
   * 배열이 유효한지 확인
   * @param {*} arr - 대상
   * @returns {boolean}
   */
  isArray(arr) {
    return Array.isArray(arr) && arr.length > 0;
  },

  /**
   * 객체가 유효한지 확인
   * @param {*} obj - 대상
   * @returns {boolean}
   */
  isObject(obj) {
    return obj != null && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
  },

  /**
   * 문자열이 유효한지 확인
   * @param {*} str - 대상
   * @returns {boolean}
   */
  isString(str) {
    return typeof str === 'string' && str.trim().length > 0;
  },

  /**
   * 숫자가 유효한지 확인
   * @param {*} num - 대상
   * @returns {boolean}
   */
  isNumber(num) {
    return typeof num === 'number' && !isNaN(num);
  },

  /**
   * 값이 참인지 확인 (0, false, '', [] 등 falsy 제외)
   * @param {*} val - 대상
   * @returns {boolean}
   */
  isTruthy(val) {
    return val != null && val !== '' && val !== false && (typeof val !== 'object' || Object.keys(val).length > 0);
  },

  /**
   * 안전한 배열 필터링 (null/undefined 제외)
   * @param {*} arr - 대상 배열
   * @returns {Array}
   */
  filterValid(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item != null);
  },

  /**
   * 안전한 배열 매핑
   * @param {*} arr - 대상 배열
   * @param {Function} fn - 매핑 함수
   * @returns {Array}
   */
  mapSafe(arr, fn) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item != null).map(fn);
  },

  /**
   * 객체 병합 (undefined 값 제외)
   * @param {...Object} objects - 병합할 객체들
   * @returns {Object}
   */
  merge(...objects) {
    return objects.reduce((result, obj) => {
      if (obj != null && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.entries(obj).forEach(([key, val]) => {
          if (val != null) result[key] = val;
        });
      }
      return result;
    }, {});
  },

  /**
   * 객체의 null/undefined 값을 기본값으로 변환
   * @param {Object} obj - 대상 객체
   * @param {*} defaultValue - 기본값
   * @returns {Object}
   */
  fillDefaults(obj, defaultValue = '') {
    if (obj == null || typeof obj !== 'object') return obj;
    return Object.entries(obj).reduce((result, [key, val]) => {
      result[key] = val ?? defaultValue;
      return result;
    }, {});
  },

  /**
   * 중첩된 배열/객체에서 안전하게 값 추출
   * @param {*} data - 데이터
   * @param {string} path - 경로
   * @param {*} defaultValue - 기본값
   * @returns {*}
   */
  deepGet(data, path, defaultValue = null) {
    return this.get(data, path, defaultValue);
  },
};
