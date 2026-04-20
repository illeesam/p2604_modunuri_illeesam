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
  // import 경로
  [/import com\.shopjoy\.ecadminapi\.auth\.annotation\.MemberOnly;/g,
   'import com.shopjoy.ecadminapi.auth.annotation.FoOnly;'],
  [/import com\.shopjoy\.ecadminapi\.auth\.annotation\.UserOnly;/g,
   'import com.shopjoy.ecadminapi.auth.annotation.BoOnly;'],
  [/import com\.shopjoy\.ecadminapi\.auth\.annotation\.UserOrMember;/g,
   'import com.shopjoy.ecadminapi.auth.annotation.BoOrFo;'],
  // 어노테이션 사용
  [/@MemberOnly\b/g, '@FoOnly'],
  [/@UserOnly\b/g,   '@BoOnly'],
  [/@UserOrMember\b/g, '@BoOrFo'],
  // 주석 내 용어
  [/USER_ONLY/g,      'BO_ONLY'],
  [/USER_OR_MEMBER/g, 'BO_OR_FO'],
  [/MEMBER_ONLY/g,    'FO_ONLY'],
];

let count = 0;
for (const file of walk(BASE)) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = src;
  for (const [from, to] of replacements) changed = changed.replace(from, to);
  if (changed !== src) {
    fs.writeFileSync(file, changed, 'utf8');
    console.log('updated:', file.replace(BASE, ''));
    count++;
  }
}
console.log(`\nDone. ${count} files updated.`);
