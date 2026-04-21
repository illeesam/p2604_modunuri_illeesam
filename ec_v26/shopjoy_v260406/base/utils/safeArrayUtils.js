/* Safe Array & Object Utilities - 안전한 데이터 접근 */
window.safeArrayUtils = {
  // Array 안전 접근
  safeGet: (arr, index, defaultValue = null) => {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) return defaultValue;
    return arr[index];
  },

  safeFirst: (arr, defaultValue = null) => {
    if (!Array.isArray(arr) || arr.length === 0) return defaultValue;
    return arr[0];
  },

  safeLast: (arr, defaultValue = null) => {
    if (!Array.isArray(arr) || arr.length === 0) return defaultValue;
    return arr[arr.length - 1];
  },

  // Array 필터 - 안전한 체크
  safeFilter: (arr, predicate) => {
    if (!Array.isArray(arr)) return [];
    try {
      return arr.filter(predicate);
    } catch (e) {
      console.error('safeFilter error:', e);
      return [];
    }
  },

  // Array 맵 - 안전한 변환
  safeMap: (arr, mapper) => {
    if (!Array.isArray(arr)) return [];
    try {
      return arr.map(mapper);
    } catch (e) {
      console.error('safeMap error:', e);
      return [];
    }
  },

  // Array 찾기 - 안전한 검색
  safeFind: (arr, predicate, defaultValue = null) => {
    if (!Array.isArray(arr)) return defaultValue;
    try {
      return arr.find(predicate) || defaultValue;
    } catch (e) {
      console.error('safeFind error:', e);
      return defaultValue;
    }
  },

  // Array forEach - 안전한 반복
  safeForEach: (arr, callback) => {
    if (!Array.isArray(arr)) return;
    try {
      arr.forEach(callback);
    } catch (e) {
      console.error('safeForEach error:', e);
    }
  },

  // Array some - 안전한 존재 확인
  safeSome: (arr, predicate) => {
    if (!Array.isArray(arr)) return false;
    try {
      return arr.some(predicate);
    } catch (e) {
      console.error('safeSome error:', e);
      return false;
    }
  },

  // Array every - 안전한 모두 확인
  safeEvery: (arr, predicate) => {
    if (!Array.isArray(arr)) return true;
    try {
      return arr.every(predicate);
    } catch (e) {
      console.error('safeEvery error:', e);
      return false;
    }
  },

  // Array 길이 체크
  safeLength: (arr) => {
    if (!Array.isArray(arr)) return 0;
    return arr.length;
  },

  // Object 안전 접근
  safeGet: (obj, path, defaultValue = null) => {
    if (obj === null || obj === undefined) return defaultValue;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  },

  // Object 프로퍼티 안전 접근
  safeProp: (obj, prop, defaultValue = null) => {
    if (obj === null || obj === undefined) return defaultValue;
    const value = obj[prop];
    return value !== undefined ? value : defaultValue;
  },

  // Object 필터
  safeObjFilter: (obj, predicate) => {
    if (obj === null || obj === undefined || typeof obj !== 'object') return {};
    try {
      return Object.entries(obj)
        .filter(([key, val]) => predicate(val, key))
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
    } catch (e) {
      console.error('safeObjFilter error:', e);
      return {};
    }
  },

  // 안전한 배열 업데이트 (reactive 배열용)
  updateArray: (arr, newData) => {
    if (!Array.isArray(arr) || !Array.isArray(newData)) return;
    arr.splice(0, arr.length, ...newData);
  },

  // 안전한 배열 추가
  pushSafe: (arr, item) => {
    if (!Array.isArray(arr)) return;
    arr.push(item);
  },

  // 안전한 배열 제거
  removeSafe: (arr, predicate) => {
    if (!Array.isArray(arr)) return;
    const index = arr.findIndex(predicate);
    if (index >= 0) arr.splice(index, 1);
  },

  // 안전한 배열 분류
  groupBy: (arr, keyFn) => {
    if (!Array.isArray(arr)) return {};
    try {
      return arr.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    } catch (e) {
      console.error('groupBy error:', e);
      return {};
    }
  },

  // 안전한 배열 정렬
  safeSortBy: (arr, keyFn, ascending = true) => {
    if (!Array.isArray(arr)) return [];
    try {
      const copy = [...arr];
      copy.sort((a, b) => {
        const aKey = keyFn(a);
        const bKey = keyFn(b);
        const result = aKey > bKey ? 1 : aKey < bKey ? -1 : 0;
        return ascending ? result : -result;
      });
      return copy;
    } catch (e) {
      console.error('safeSortBy error:', e);
      return [...arr];
    }
  },
};
