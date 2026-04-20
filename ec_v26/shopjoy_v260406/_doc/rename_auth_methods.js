const fs = require('fs');
const path = require('path');

const BASE = 'c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src';

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.java')) results.push(full);
  }
  return results;
}

const replacements = [
  // @PreAuthorize SpEL 문자열 안의 메서드명 (isUserOrMember 먼저)
  [/@authz\.isUserOrMember\(/g, '@authz.isBoOrFo('],
  [/@authz\.isUser\(/g,         '@authz.isBo('],
  [/@authz\.isMember\(/g,       '@authz.isFo('],
  // Authz.java / SecurityUtil.java 메서드 선언 및 호출 (isUserOrMember 먼저)
  [/\bisUserOrMember\b/g, 'isBoOrFo'],
  [/\bisUser\b/g,         'isBo'],
  [/\bisMember\b/g,       'isFo'],
];

let count = 0;
for (const file of walk(BASE)) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = src;
  for (const [from, to] of replacements) changed = changed.replace(from, to);
  if (changed !== src) {
    fs.writeFileSync(file, changed, 'utf8');
    console.log('updated:', path.relative(BASE, file));
    count++;
  }
}
console.log(`\nDone. ${count} files updated.`);
