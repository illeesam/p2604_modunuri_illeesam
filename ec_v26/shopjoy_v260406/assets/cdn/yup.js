/* Minimal Yup-compatible shim for ShopJoy Admin (no CDN required) */
window.yup = (() => {
  class ValidationError extends Error {
    constructor(errors) {
      super(errors[0] ? errors[0].message : 'Validation error');
      this.inner = errors;
    }
  }

  class StringSchema {
    constructor() { this._rules = []; }
    required(msg) {
      const m = msg || '필수 항목입니다.';
      this._rules.push((v, path) => (!v || !String(v).trim()) ? { path, message: m } : null);
      return this;
    }
    email(msg) {
      const m = msg || '올바른 이메일 형식이 아닙니다.';
      this._rules.push((v, path) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())) ? { path, message: m } : null);
      return this;
    }
    min(n, msg) {
      const m = msg || n + '자 이상 입력해주세요.';
      this._rules.push((v, path) => (v && String(v).trim().length < n) ? { path, message: m } : null);
      return this;
    }
    max(n, msg) {
      const m = msg || n + '자 이하로 입력해주세요.';
      this._rules.push((v, path) => (v && String(v).trim().length > n) ? { path, message: m } : null);
      return this;
    }
    nullable() { return this; }
    optional() { return this; }
    _validate(v, path) { return this._rules.map(r => r(v, path)).filter(Boolean); }
  }

  class NumberSchema {
    constructor() { this._rules = []; }
    typeError(msg) {
      const m = msg || '숫자를 입력해주세요.';
      this._rules.push((v, path) => (v !== null && v !== '' && v !== undefined && isNaN(Number(v))) ? { path, message: m } : null);
      return this;
    }
    required(msg) {
      const m = msg || '필수 항목입니다.';
      this._rules.push((v, path) => (v === null || v === '' || v === undefined) ? { path, message: m } : null);
      return this;
    }
    min(n, msg) {
      const m = msg || n + ' 이상이어야 합니다.';
      this._rules.push((v, path) => (!isNaN(Number(v)) && Number(v) < n) ? { path, message: m } : null);
      return this;
    }
    max(n, msg) {
      const m = msg || n + ' 이하이어야 합니다.';
      this._rules.push((v, path) => (!isNaN(Number(v)) && Number(v) > n) ? { path, message: m } : null);
      return this;
    }
    nullable() { return this; }
    optional() { return this; }
    _validate(v, path) { return this._rules.map(r => r(v, path)).filter(Boolean); }
  }

  class ObjectSchema {
    constructor(shape) { this._shape = shape; }
    async validate(data, opts) {
      const abortEarly = opts && opts.abortEarly !== false;
      const errors = [];
      for (const path of Object.keys(this._shape)) {
        const errs = this._shape[path]._validate(data[path], path);
        if (errs.length) {
          errors.push(...errs);
          if (abortEarly) break;
        }
      }
      if (errors.length) throw new ValidationError(errors);
      return data;
    }
  }

  return {
    object: (shape) => new ObjectSchema(shape),
    string:  () => new StringSchema(),
    number:  () => new NumberSchema(),
  };
})();
