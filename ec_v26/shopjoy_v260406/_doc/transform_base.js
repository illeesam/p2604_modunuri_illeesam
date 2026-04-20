const fs = require('fs');
const path = require('path');

const BASE = 'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (e.name.endsWith('Controller.java') || e.name.endsWith('Service.java')) files.push(full);
  }
  return files;
}

function transformController(src) {
  // Normalize line endings
  const hasCrlf = src.includes('\r\n');
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Remove HashMap import
    if (trimmed === 'import java.util.HashMap;') {
      changed = true;
      i++;
      continue;
    }

    // 2. list() transformation: @GetMapping (no path) followed by list(
    if (trimmed === '@GetMapping') {
      const nextTrimmed = (lines[i + 1] || '').trim();
      const isOldPattern = i + 2 < lines.length && lines[i + 2].trim().startsWith('@RequestParam(');
      if (/^public\s+ResponseEntity.*\s+list\s*\(/.test(nextTrimmed) && isOldPattern) {
        out.push(line);        // @GetMapping
        out.push(lines[i + 1]); // public ... list(
        i += 2;
        // skip all @RequestParam lines (including last one ending with `) {`)
        while (i < lines.length && lines[i].trim().startsWith('@RequestParam')) {
          i++;
        }
        out.push('            @RequestParam Map<String, Object> p) {');
        // skip buildParam call
        if (i < lines.length && /^\s+Map<String, Object> p = buildParam\(/.test(lines[i])) {
          i++;
        }
        changed = true;
        continue;
      }
    }

    // 3. page() transformation: @GetMapping("/page") followed by page(
    if (/^\s*@GetMapping\("\/page"\)/.test(line)) {
      const nextTrimmed = (lines[i + 1] || '').trim();
      const isOldPattern = i + 2 < lines.length && lines[i + 2].trim().startsWith('@RequestParam(');
      if (/^public\s+ResponseEntity.*\s+page\s*\(/.test(nextTrimmed) && isOldPattern) {
        out.push(line);         // @GetMapping("/page")
        out.push(lines[i + 1]); // public ... page(
        i += 2;
        // skip all @RequestParam lines (including last one ending with `) {`)
        while (i < lines.length && lines[i].trim().startsWith('@RequestParam')) {
          i++;
        }
        out.push('            @RequestParam Map<String, Object> p) {');
        // skip buildParam call
        if (i < lines.length && /^\s+Map<String, Object> p = buildParam\(/.test(lines[i])) {
          i++;
        }
        // Fix getPageData(p, pageNo, pageSize) → getPageData(p)
        while (i < lines.length) {
          const l = lines[i];
          if (/service\.getPageData\(p,\s*pageNo,\s*pageSize\)/.test(l)) {
            out.push(l.replace(/service\.getPageData\(p,\s*pageNo,\s*pageSize\)/, 'service.getPageData(p)'));
            i++;
            break;
          }
          out.push(l);
          i++;
          if (l.trim() === '}') break;
        }
        changed = true;
        continue;
      }
    }

    // 4. Remove buildParam method entirely
    if (/^\s+private Map<String, Object> buildParam\(/.test(line)) {
      // Remove preceding blank line
      if (out.length > 0 && out[out.length - 1].trim() === '') {
        out.pop();
      }
      // Skip lines until method body closes (brace depth → 0)
      let depth = 0;
      let started = false;
      while (i < lines.length) {
        const l = lines[i];
        for (const c of l) {
          if (c === '{') { depth++; started = true; }
          else if (c === '}') depth--;
        }
        i++;
        if (started && depth === 0) break;
      }
      changed = true;
      continue;
    }

    out.push(line);
    i++;
  }

  if (!changed) return src;
  const result = out.join('\n');
  return hasCrlf ? result.replace(/\n/g, '\r\n') : result;
}

function transformService(src) {
  let code = src;

  // 1. import java.util.HashMap 제거
  code = code.replace(/^import java\.util\.HashMap;\r?\n/m, '');

  // 2. PageHelper import 추가 (없으면)
  if (!code.includes('import com.shopjoy.ecadminapi.common.util.PageHelper;')) {
    code = code.replace(
      /(import com\.shopjoy\.ecadminapi\.common\.)/,
      'import com.shopjoy.ecadminapi.common.util.PageHelper;\n$1'
    );
  }

  // 3. getList: add PageHelper.addPaging guard if missing
  code = code.replace(
    /(public List<[^>]+> getList\(Map<String, Object> p\) \{\n)(\s+)(?!if \(p\.containsKey)/g,
    '$1$2if (p.containsKey("pageSize")) PageHelper.addPaging(p);\n$2'
  );

  // 4. getPageData(Map p, int pageNo, int pageSize) → getPageData(Map p)
  code = code.replace(
    /@Transactional\(readOnly = true\)\r?\n\s+public PageResult<([^>]+)> getPageData\(Map<String, Object> p, int pageNo, int pageSize\) \{[\s\S]*?^\s+\}/m,
    `@Transactional(readOnly = true)\n    public PageResult<$1> getPageData(Map<String, Object> p) {\n        PageHelper.addPaging(p);\n        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);\n    }`
  );

  return code;
}

const files = walk(BASE);
let ctrlOk = 0, svcOk = 0, skip = 0;

for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  let transformed;

  if (f.endsWith('Controller.java')) {
    transformed = transformController(orig);
  } else {
    transformed = transformService(orig);
  }

  if (transformed !== orig) {
    fs.writeFileSync(f, transformed, 'utf8');
    const short = f.replace(BASE, '').replace(/\\/g, '/');
    if (f.endsWith('Controller.java')) { console.log('C', short); ctrlOk++; }
    else { console.log('S', short); svcOk++; }
  } else {
    skip++;
  }
}

console.log(`\n완료: Controller ${ctrlOk}개, Service ${svcOk}개 수정, ${skip}개 스킵`);
