/**
 * 모든 Controller에서 인라인 서비스 호출을 result 변수 패턴으로 변환
 *
 * Before: return ResponseEntity.status(201).body(ApiResponse.created(service.create(X)));
 * After:  T result = service.create(X);
 *         return ResponseEntity.status(201).body(ApiResponse.created(result));
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base',
  'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/bo',
  'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/fo',
  'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/autorest',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (e.name.endsWith('Controller.java')) files.push(full);
  }
  return files;
}

function transform(src) {
  const hasCrlf = src.includes('\r\n');
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let changed = false;
  let currentReturnType = null; // T from ResponseEntity<ApiResponse<T>>

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track method return type: public ResponseEntity<ApiResponse<T>> methodName(
    // T may contain spaces/nested generics like List<Foo>
    const retMatch = line.match(/public\s+ResponseEntity<ApiResponse<(.+?)>>\s+\w+\s*\(/);
    if (retMatch) {
      currentReturnType = retMatch[1];
    }

    // Pattern: return ResponseEntity.status(201).body(ApiResponse.created(service.X(ARGS)));
    const inlineMatch = trimmed.match(/^return\s+ResponseEntity\.status\(201\)\.body\(ApiResponse\.created\((service\.\w+\([^)]*\))\)\);$/);
    if (inlineMatch && currentReturnType) {
      const serviceCall = inlineMatch[1];
      const indent = line.match(/^(\s*)/)[1];
      out.push(`${indent}${currentReturnType} result = ${serviceCall};`);
      out.push(`${indent}return ResponseEntity.status(201).body(ApiResponse.created(result));`);
      changed = true;
      i++;
      continue;
    }

    // Also handle multi-arg service calls like service.create(table, body)
    const inlineMatchMulti = trimmed.match(/^return\s+ResponseEntity\.status\(201\)\.body\(ApiResponse\.created\((service\.\w+\([^)]+\))\)\);$/);
    if (inlineMatchMulti && currentReturnType && !inlineMatch) {
      const serviceCall = inlineMatchMulti[1];
      const indent = line.match(/^(\s*)/)[1];
      out.push(`${indent}${currentReturnType} result = ${serviceCall};`);
      out.push(`${indent}return ResponseEntity.status(201).body(ApiResponse.created(result));`);
      changed = true;
      i++;
      continue;
    }

    out.push(line);
    i++;
  }

  if (!changed) return src;
  const result = out.join('\n');
  return hasCrlf ? result.replace(/\n/g, '\r\n') : result;
}

let ok = 0, skip = 0;

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    const orig = fs.readFileSync(f, 'utf8');
    const transformed = transform(orig);
    if (transformed !== orig) {
      fs.writeFileSync(f, transformed, 'utf8');
      const short = f.replace(/.*ecadminapi/, '');
      console.log(short.replace(/\\/g, '/'));
      ok++;
    } else {
      skip++;
    }
  }
}

console.log(`\n완료: ${ok}개 수정, ${skip}개 스킵`);
