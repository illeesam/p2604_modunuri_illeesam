/**
 * fo/ Controller + Service 파라미터 Map화 변환 스크립트
 *
 * Controller 변환:
 *   1. buildParam 패턴 (list/page) → @RequestParam Map<String, Object> p
 *   2. 단일 @RequestParam String 파라미터들 → @RequestParam Map<String, Object> p
 *   3. int pageNo, int pageSize 제거
 *
 * Service 변환:
 *   1. getPageData(Map p, int pageNo, int pageSize) → PageHelper 방식
 *   2. methodName(String siteId, ...) → methodName(Map<String, Object> p)
 *   3. methodName(String X, String Y) 개별 파라미터 → Map
 */
const fs = require('fs');
const path = require('path');

const FO_BASE = 'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo';

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

// ── Controller 변환 ──────────────────────────────────────────────────────────

function transformFoController(src) {
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
      changed = true; i++; continue;
    }

    // 2. buildParam list() → @RequestParam Map (same as base/)
    if (trimmed === '@GetMapping') {
      const nextTrimmed = (lines[i + 1] || '').trim();
      const isOldPattern = i + 2 < lines.length && lines[i + 2].trim().startsWith('@RequestParam(');
      if (/^public\s+ResponseEntity.*\s+list\s*\(/.test(nextTrimmed) && isOldPattern) {
        out.push(line);
        out.push(lines[i + 1]);
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith('@RequestParam')) i++;
        out.push('            @RequestParam Map<String, Object> p) {');
        if (i < lines.length && /^\s+.*service\.getList\(buildParam\(/.test(lines[i])) {
          out.push(lines[i].replace(/service\.getList\(buildParam\([^)]*\)\)/, 'service.getList(p)'));
          i++;
        }
        changed = true; continue;
      }
    }

    // 3. buildParam page() → @RequestParam Map
    if (/^\s*@GetMapping\("\/page"\)/.test(line)) {
      const nextTrimmed = (lines[i + 1] || '').trim();
      const isOldPattern = i + 2 < lines.length && lines[i + 2].trim().startsWith('@RequestParam(');
      if (/^public\s+ResponseEntity.*\s+page\s*\(/.test(nextTrimmed) && isOldPattern) {
        out.push(line);
        out.push(lines[i + 1]);
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith('@RequestParam')) i++;
        out.push('            @RequestParam Map<String, Object> p) {');
        // fix service.getPageData(buildParam(...), pageNo, pageSize) or service.getPageData(p)
        while (i < lines.length) {
          const l = lines[i];
          if (/service\.\w+\(buildParam\([^)]*\),\s*pageNo,\s*pageSize\)/.test(l)) {
            const methodMatch = l.match(/service\.(\w+)\(/);
            out.push(l.replace(/service\.\w+\(buildParam\([^)]*\),\s*pageNo,\s*pageSize\)/, `service.${methodMatch[1]}(p)`));
            i++; break;
          }
          if (/service\.getPageData\(p,\s*pageNo,\s*pageSize\)/.test(l)) {
            out.push(l.replace(/service\.getPageData\(p,\s*pageNo,\s*pageSize\)/, 'service.getPageData(p)'));
            i++; break;
          }
          out.push(l); i++;
          if (l.trim() === '}') break;
        }
        changed = true; continue;
      }
    }

    // 4. buildParam method removal
    if (/^\s+private Map<String, Object> buildParam\(/.test(line)) {
      if (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
      let depth = 0, started = false;
      while (i < lines.length) {
        const l = lines[i];
        for (const c of l) {
          if (c === '{') { depth++; started = true; }
          else if (c === '}') depth--;
        }
        i++;
        if (started && depth === 0) break;
      }
      changed = true; continue;
    }

    // 5. Single/multi @RequestParam String/int params → Map
    //    Pattern: method(\n    @RequestParam(required=false) String X,\n    @RequestParam(required=false) String Y,\n    @RequestParam(defaultValue=...) int pageNo,\n    @RequestParam(defaultValue=...) int pageSize) {
    //    → method(@RequestParam Map<String, Object> p) {
    //    We detect: public ... method(\n where next lines are only @RequestParam (String/int) until `) {`
    if (/^\s+public\s+ResponseEntity\S*\s+\w+\($/.test(line)) {
      // Check if next lines are @RequestParam (non-Map) params
      let j = i + 1;
      let paramLines = [];
      let foundClose = false;
      while (j < lines.length) {
        const pt = lines[j].trim();
        if (pt.startsWith('@RequestParam') && !pt.includes('Map<')) {
          paramLines.push(j);
          if (pt.endsWith(') {')) { foundClose = true; j++; break; }
          j++;
        } else if (pt.startsWith('@RequestParam') && pt.includes('Map<')) {
          // already Map, skip
          break;
        } else {
          break;
        }
      }
      if (foundClose && paramLines.length > 0) {
        out.push(line); // public ... method(
        out.push('            @RequestParam Map<String, Object> p) {');
        // Fix the service call: replace individual args with p
        // Skip old @RequestParam lines
        i = j;
        // Now handle service calls that pass individual params
        while (i < lines.length) {
          const l = lines[i];
          const lt = l.trim();
          // Fix service calls: service.method(siteId, pageNo, pageSize) → service.method(p)
          //                     service.method(siteId) → service.method(p)
          //                     service.method(siteId, targetTypeCd) → service.method(p)
          // General: replace call with only simple String/int identifiers inside with p
          if (/\bservice\.\w+\([^)]+\)/.test(l) && !/service\.\w+\(\)/.test(l)) {
            const fixed = l.replace(
              /\bservice\.(\w+)\(\s*(?:[a-z][a-zA-Z0-9]*(?:\s*,\s*[a-z][a-zA-Z0-9]*)*)\s*\)/,
              (m, nm) => `service.${nm}(p)`
            );
            if (fixed !== l) {
              out.push(fixed); i++;
              changed = true;
              break;
            }
          }
          // Also fix getOrDefault / Map.of calls that use siteId
          out.push(l); i++;
          if (lt === '}') break;
        }
        changed = true; continue;
      }
    }

    out.push(line);
    i++;
  }

  if (!changed) return src;
  const result = out.join('\n');
  return hasCrlf ? result.replace(/\n/g, '\r\n') : result;
}

// ── Service 변환 ─────────────────────────────────────────────────────────────

function transformFoService(src) {
  let code = src;

  // 1. Remove HashMap import (only if after transform it's unused)
  // We'll remove it and re-add only if needed - actually just keep HashMap for now
  // since some services still use new HashMap<>() for copying

  // 2. Add PageHelper import if missing
  if (!code.includes('import com.shopjoy.ecadminapi.common.util.PageHelper;')) {
    if (code.includes('PageResult')) {
      code = code.replace(
        /(import com\.shopjoy\.ecadminapi\.common\.)/,
        'import com.shopjoy.ecadminapi.common.util.PageHelper;\n$1'
      );
    }
  }

  // 3. getPageData(Map p, int pageNo, int pageSize) → getPageData(Map p) with PageHelper
  code = code.replace(
    /(@Transactional\(readOnly = true\)\r?\n\s+public PageResult<([^>]+)> getPageData\(Map<String, Object> p, int pageNo, int pageSize\) \{)\s*\n\s+Map<String, Object> param = new HashMap<>\(p\);\s*\n\s+param\.put\("limit",\s*pageSize\);\s*\n\s+param\.put\("offset",\s*\([^)]+\)\s*\*\s*pageSize\);\s*\n\s+return PageResult\.of\(mapper\.selectPageList\(param\),\s*mapper\.selectPageCount\(param\),\s*pageNo,\s*pageSize,\s*p\);\s*\n\s+\}/m,
    '@Transactional(readOnly = true)\n    public PageResult<$2> getPageData(Map<String, Object> p) {\n        PageHelper.addPaging(p);\n        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);\n    }'
  );

  // 4. getMyOrderPage(String siteId, int pageNo, int pageSize) → getMyOrderPage(Map<String, Object> p) with PageHelper
  code = code.replace(
    /(@Transactional\(readOnly = true\)\r?\n\s+public PageResult<([^>]+)> getMyOrderPage\(String siteId, int pageNo, int pageSize\) \{)\s*\n\s+String memberId = SecurityUtil\.currentUserId\(\);\s*\n\s+Map<String, Object> p = new HashMap<>\(\);\s*\n\s+p\.put\("memberId",\s*memberId\);\s*\n(?:\s+if \(siteId != null\) p\.put\("siteId",\s*siteId\);\s*\n)?\s+p\.put\("limit",\s*pageSize\);\s*\n\s+p\.put\("offset",[^;]+\);\s*\n\s+return PageResult\.of[^;]+;\s*\n\s+\}/m,
    '@Transactional(readOnly = true)\n    public PageResult<$2> getMyOrderPage(Map<String, Object> p) {\n        p.put("memberId", SecurityUtil.currentUserId());\n        PageHelper.addPaging(p);\n        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);\n    }'
  );

  // 5. getMyOrders(String siteId) → getMyOrders(Map<String, Object> p)
  code = code.replace(
    /(@Transactional\(readOnly = true\)\r?\n\s+public List<[^>]+> getMyOrders\()String siteId(\) \{)\s*\n\s+String memberId = SecurityUtil\.currentUserId\(\);\s*\n[^}]+\}/m,
    (m) => {
      // Replace signature and rebuild body
      return m
        .replace(/public (List<[^>]+> getMyOrders)\(String siteId\)/, 'public $1(Map<String, Object> p)')
        .replace(/String memberId = SecurityUtil\.currentUserId\(\);[\s\S]*?(?=\n\s*\})/,
          'p.put("memberId", SecurityUtil.currentUserId());\n        return mapper.selectList(p);');
    }
  );

  // 6. getMyClaims(String siteId) → getMyClaims(Map<String, Object> p)
  code = code.replace(
    /(public List<[^>]+> getMyClaims\()String siteId(\) \{)\s*\n\s+String memberId = SecurityUtil\.currentUserId\(\);\s*\n[^}]+\}/m,
    (m) => {
      return m
        .replace(/public (List<[^>]+> getMyClaims)\(String siteId\)/, 'public $1(Map<String, Object> p)')
        .replace(/String memberId = SecurityUtil\.currentUserId\(\);[\s\S]*?(?=\n\s*\})/,
          'p.put("memberId", SecurityUtil.currentUserId());\n        return claimMapper.selectList(p);');
    }
  );

  // 7. getMyCart(String siteId) → getMyCart(Map<String, Object> p)
  code = code.replace(
    /(public List<[^>]+> getMyCart\()String siteId(\) \{)\s*\n[^}]+\}/m,
    (m) => {
      return m
        .replace(/public (List<[^>]+> getMyCart)\(String siteId\)/, 'public $1(Map<String, Object> p)')
        .replace(/String memberId = SecurityUtil\.currentUserId\(\);[\s\S]*?(?=\n\s*\})/,
          'p.put("memberId", SecurityUtil.currentUserId());\n        return mapper.selectList(p);');
    }
  );

  // 8. getMyLikes(String siteId, String targetTypeCd) → getMyLikes(Map<String, Object> p)
  code = code.replace(
    /(public List<[^>]+> getMyLikes\()String siteId,\s*String targetTypeCd(\) \{)\s*\n[^}]+\}/m,
    (m) => {
      return m
        .replace(/public (List<[^>]+> getMyLikes)\(String siteId,\s*String targetTypeCd\)/, 'public $1(Map<String, Object> p)')
        .replace(/String memberId = SecurityUtil\.currentUserId\(\);[\s\S]*?(?=\n\s*\})/,
          'p.put("memberId", SecurityUtil.currentUserId());\n        return mapper.selectList(p);');
    }
  );

  // 9. toggle(String siteId, String targetTypeCd, String targetId) → toggle(String targetTypeCd, String targetId, Map<String, Object> p)
  code = code.replace(
    /public boolean toggle\(String siteId,\s*String targetTypeCd,\s*String targetId\)/,
    'public boolean toggle(String targetTypeCd, String targetId, Map<String, Object> p)'
  );
  // Also update references to siteId in toggle body → p.get("siteId")
  // The toggle body uses siteId in the filter. After rename, replace local siteId usage
  code = code.replace(
    /(public boolean toggle\(String targetTypeCd, String targetId, Map<String, Object> p\) \{[\s\S]*?String memberId = SecurityUtil\.currentUserId\(\);)([\s\S]*?)(\n\s+if \(existing\.isPresent\(\))/,
    (m, before, middle, after) => {
      // Replace siteId references in the lambda with p.get("siteId")
      const fixed = middle.replace(/&& \(siteId == null \|\| siteId\.equals\(l\.getSiteId\(\)\)\)/, '&& (p.get("siteId") == null || p.get("siteId").equals(l.getSiteId()))');
      const fixed2 = fixed.replace(/like\.setSiteId\(siteId\)/, 'like.setSiteId((String) p.get("siteId"))');
      return before + fixed2 + after;
    }
  );

  // 10. unlike(String siteId, String targetTypeCd, String targetId) → unlike(String targetTypeCd, String targetId, Map<String, Object> p)
  code = code.replace(
    /public void unlike\(String siteId,\s*String targetTypeCd,\s*String targetId\)/,
    'public void unlike(String targetTypeCd, String targetId, Map<String, Object> p)'
  );

  // 11. getBalance(String siteId) → getBalance(Map<String, Object> p)
  code = code.replace(
    /(public \w+ getBalance\()String siteId(\) \{)\s*\n\s+String memberId = SecurityUtil\.currentUserId\(\);\s*\n\s+List<[^>]+> list = mapper\.selectList\(Map\.of\([^)]*\)\);/m,
    '$1Map<String, Object> p$2\n        p.put("memberId", SecurityUtil.currentUserId());\n        List<PmCacheDto> list = mapper.selectList(p);'
  );

  // 12. getAvailableCoupons(String siteId) → getAvailableCoupons(Map<String, Object> p)
  code = code.replace(
    /(public List<[^>]+> getAvailableCoupons\()String siteId(\) \{)\s*\n\s+String memberId = SecurityUtil\.currentUserId\(\);\s*\n\s+return mapper\.selectList\(Map\.of\([^)]*\)\);/m,
    '$1Map<String, Object> p$2\n        p.put("memberId", SecurityUtil.currentUserId());\n        p.put("useYn", "N");\n        return mapper.selectList(p);'
  );

  return code;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = walk(FO_BASE);
let ctrlOk = 0, svcOk = 0, skip = 0;

for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  const transformed = f.endsWith('Controller.java')
    ? transformFoController(orig)
    : transformFoService(orig);

  if (transformed !== orig) {
    fs.writeFileSync(f, transformed, 'utf8');
    const short = f.replace(FO_BASE, '').replace(/\\/g, '/');
    if (f.endsWith('Controller.java')) { console.log('C', short); ctrlOk++; }
    else { console.log('S', short); svcOk++; }
  } else {
    skip++;
  }
}

console.log(`\n완료: Controller ${ctrlOk}개, Service ${svcOk}개 수정, ${skip}개 스킵`);
