/* buildMinify.js — pages/lib/components 아래 .js 파일을 "번들링 없이" 개별 파일 그대로
 * dist/ 밑에 같은 디렉터리 구조로 minify 해서 복사한다.
 *
 * 왜 번들링(여러 파일을 하나로 합치기)을 안 하는가:
 *   이 프로젝트는 화면 하나 = 파일 하나(window.ClassName= 전역등록) 구조이고, lazy-loading
 *   엔진(boAppBase.js/foAppBase.js)이 "이 클래스는 이 파일에 있다"는 lib/app/{bo,fo}AppLazyClasses.js
 *   맵을 보고 필요한 파일만 그때그때 import() 한다. 여러 파일을 하나로 합치면 이 맵 자체가
 *   무의미해지고 "안 쓰는 화면까지 전부 미리 받는" 구조로 퇴행한다 — 번들링은 이 아키텍처
 *   전체를 다시 설계해야 하는 별개의(훨씬 큰) 작업이라 여기서 하지 않는다.
 *
 * 왜 esbuild 기본 minify 가 안전한가:
 *   esbuild 의 minify:true 는 공백/주석 제거 + "지역 변수/함수명"만 짧게 치환한다(minifyIdentifiers).
 *   객체 프로퍼티명(mangleProps 옵션, 기본 꺼짐)은 절대 안 건드리므로 window.PdProdMng 같은
 *   전역 등록 이름은 그대로 남는다 — lazy 로딩 시스템이 딱 이 문자열을 보고 동작하므로 이건
 *   협상 불가 전제(boAppBase.js/foAppBase.js 방어 체크 참고).
 *
 * console.log 디버그 로그 제거(2026-08-30 추가):
 *   화면마다 handleBtnAction/handleSelectAction 시작부에 습관적으로 박아둔
 *   `console.log(' ■■ 화면명 : handleBtnAction -> ', cmd, param)` 류가 운영에 그대로 나가면
 *   내부 cmd 이름·페이로드가 브라우저 콘솔에 그대로 노출된다. esbuild 의 `pure: ['console.log']`
 *   로 "이 호출은 부작용 없다고 간주해도 된다"고 표시하면, minify 의 dead-code-elimination 이
 *   반환값을 안 쓰는 console.log(...) 호출문을 통째로 지운다 — console.error/warn 은 그대로
 *   남겨서(진짜 에러는 운영에서도 devtools 로 확인 가능해야 하므로) 전부 지우는 `drop:['console']`
 *   보다 안전하다.
 *
 * dist/ 를 브라우저로 직접 열어 확인할 수 있도록, JS 압축과 별개로 bo.html/index.html 등
 * 루트 HTML 전부 + assets/(CSS·CDN 로컬패키지·이미지) 를 복사한다 — 이 중 assets/css/*.css 는
 * esbuild 의 css loader 로 같이 압축하고(공백/주석 제거, 안전 — CSS 는 클래스명을 바꾸지
 * 않으므로 selector 매칭에 영향 없음), 그 외(CDN 벤더 라이브러리·이미지)는 원본 그대로 복사한다
 * (CDN 패키지는 이미 자체적으로 프로덕션 빌드본이라 다시 압축해도 이득이 거의 없고, 복잡한
 * 서드파티 코드를 esbuild 로 재가공하면 미묘하게 깨질 리스크만 있어 건드리지 않는다).
 *
 * 환경(local/dev/prod) 프로파일(2026-09-03 추가):
 *   lib/env/env{Bo,Fo}Consts.js 는 API 서버를 어느 origin으로 부를지(apiOrigin) 등을 담고
 *   있는데, 배포 환경마다 값이 다르다(로컬 Live Server=백엔드 절대주소, nginx 뒤에 떠 있는
 *   배포=상대경로). "런타임에 지금이 무슨 환경인지 감지"하는 대신, 빌드할 때 이미 정해서
 *   lib/env/profiles/env{Bo,Fo}Consts.{dev,prod}.js 중 해당하는 걸 dist/lib/env/ 자리에
 *   덮어쓴다 — --profile 인자로 고른다(생략 시 'local' = 원본 그대로, 즉 아무 것도 안 덮어씀).
 *
 * 사용법: node scripts/buildMinify.js                    (= npm run build:local, local 프로파일)
 *        node scripts/buildMinify.js --profile=dev       (= npm run build:dev)
 *        node scripts/buildMinify.js --profile=prod      (= npm run build:prod)
 *        node scripts/buildMinify.js --check              (실제로 파일을 안 쓰고 개수만 리포트 — dry run)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const SRC_DIRS = ['pages', 'lib', 'components'];
const COPY_DIRS = ['assets'];               // 가공 없이 그대로 복사할 디렉터리(CSS/CDN/이미지 등)
const DRY_RUN = process.argv.includes('--check');

const PROFILE_ARG = process.argv.find((a) => a.startsWith('--profile='));
const PROFILE = PROFILE_ARG ? PROFILE_ARG.split('=')[1] : 'local';
const VALID_PROFILES = ['local', 'dev', 'prod'];
const ENV_TARGETS = ['envBoConsts', 'envFoConsts']; // lib/env/ 아래 프로파일 교체 대상 파일명(확장자 제외)

/* walkFiles — dir 아래 지정 확장자 파일을 재귀적으로 전부 모아 ROOT 기준 상대경로(슬래시 통일)로 반환 */
function walkFiles(dir, ext) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(rel, ext));
    } else if (entry.name.endsWith(ext)) {
      out.push(rel.split(path.sep).join('/'));
    }
  }
  return out;
}
const walkJsFiles = (dir) => walkFiles(dir, '.js');

async function main() {
  if (!VALID_PROFILES.includes(PROFILE)) {
    console.error(`❌ 알 수 없는 --profile 값: '${PROFILE}' (사용 가능: ${VALID_PROFILES.join(', ')})`);
    process.exit(1);
  }
  console.log(DRY_RUN ? 'minify 빌드 미리보기(--check, 실제 파일 안 씀) 시작' : 'minify 빌드 시작 (dist/ 생성)');
  console.log(`  프로파일: ${PROFILE}${PROFILE === 'local' ? ' (원본 lib/env/*.js 그대로 사용)' : ' (lib/env/profiles/*.' + PROFILE + '.js 로 교체 예정)'}`);

  console.log('\n[1] dist/ 정리(선삭제)');
  /* dist/ 선삭제 — 소스에서 파일을 지운 경우 dist/ 에 옛 산출물이 계속 남아있다가(덮어쓰기만
     하고 정리를 안 하면) 그대로 운영 서버까지 rsync 되는 걸 막는다. dist/ 는 로컬에만 있는
     빌드 산출물이라(운영 서버가 직접 보는 폴더가 아님) 여기서 지우는 건 항상 안전 — 실제
     운영 반영은 이 스크립트가 끝나고 verify-dist 까지 통과한 뒤 별도로 rsync 할 때만 일어난다. */
  if (!DRY_RUN && fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    console.log('  ㄴ 기존 dist/ 삭제 완료');
  } else if (DRY_RUN) {
    console.log('  ㄴ (--check 모드라 스킵)');
  } else {
    console.log('  ㄴ 기존 dist/ 없음(최초 빌드)');
  }

  console.log(`\n[2] pages/lib/components 아래 JS 파일 압축(minify)`);
  const files = SRC_DIRS.flatMap(walkJsFiles);
  console.log(`  ㄴ 대상 파일 수집(${SRC_DIRS.join(', ')} 아래): ${files.length}개`);

  let totalSrcBytes = 0;
  let totalOutBytes = 0;
  let failCount = 0;

  for (const rel of files) {
    const srcPath = path.join(ROOT, rel);
    const src = fs.readFileSync(srcPath, 'utf8');
    totalSrcBytes += Buffer.byteLength(src, 'utf8');

    let result;
    try {
      result = await esbuild.transform(src, {
        minify: true,        // whitespace + syntax + 지역 식별자만. 프로퍼티명(mangleProps)은 기본 꺼짐 — 손 안 댐
        loader: 'js',
        target: 'es2019',    // 이 프로젝트가 이미 쓰는 문법(옵셔널체이닝 ?. 등) 기준 넉넉히 지원되는 타깃
        legalComments: 'none',
        pure: ['console.log'], // 반환값 안 쓰는 console.log(...) 호출을 dead-code로 지움(error/warn은 유지)
      });
    } catch (e) {
      console.error(`❌ ${rel} : ${e.message}`);
      failCount++;
      continue;
    }

    totalOutBytes += Buffer.byteLength(result.code, 'utf8');

    if (!DRY_RUN) {
      const outPath = path.join(OUT_DIR, rel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, result.code, 'utf8');
    }
  }

  const pct = totalSrcBytes ? (100 - (totalOutBytes / totalSrcBytes) * 100).toFixed(1) : 0;
  console.log(`  ㄴ 압축 완료: 원본 ${(totalSrcBytes / 1024).toFixed(0)}KB → ${(totalOutBytes / 1024).toFixed(0)}KB (${pct}% 감소)`);
  if (failCount) {
    console.log(`  결과: ⚠️  변환 실패 ${failCount}개 — 위 로그 확인`);
    process.exit(1);
  }
  console.log(`  결과: ✅ ${files.length}개 파일 압축 성공`);

  /* 루트 HTML(bo.html/index.html/*-pop.html 등) + assets/ 는 가공 없이 그대로 복사 —
     dist/ 를 Live Server 같은 걸로 바로 열어서 확인할 수 있게 하기 위함(JS 압축과 무관). */
  console.log('\n[3] 루트 HTML + assets/ 복사(가공 없음)');
  if (!DRY_RUN) {
    const htmlFiles = fs.readdirSync(ROOT, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.html'))
      .map((e) => e.name);
    htmlFiles.forEach((name) => {
      fs.copyFileSync(path.join(ROOT, name), path.join(OUT_DIR, name));
    });
    console.log(`  ㄴ 루트 HTML(bo.html/index.html/*-pop.html 등) ${htmlFiles.length}개 복사`);
    COPY_DIRS.forEach((dir) => {
      const src = path.join(ROOT, dir);
      if (fs.existsSync(src)) {
        fs.cpSync(src, path.join(OUT_DIR, dir), { recursive: true });
      }
    });
    console.log(`  ㄴ ${COPY_DIRS.join(', ')}/ (CSS·CDN 로컬패키지·이미지) 복사`);

    // assets/css/*.css 만 복사 후 그 자리에서 압축(CDN 벤더 CSS/이미지는 원본 그대로 유지)
    const cssFiles = walkFiles('assets/css', '.css');
    let cssSrcBytes = 0;
    let cssOutBytes = 0;
    for (const rel of cssFiles) {
      const srcCss = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      cssSrcBytes += Buffer.byteLength(srcCss, 'utf8');
      const cssResult = await esbuild.transform(srcCss, { loader: 'css', minify: true });
      cssOutBytes += Buffer.byteLength(cssResult.code, 'utf8');
      fs.writeFileSync(path.join(OUT_DIR, rel), cssResult.code, 'utf8');
    }
    const cssPct = cssSrcBytes ? (100 - (cssOutBytes / cssSrcBytes) * 100).toFixed(1) : 0;
    console.log(`  ㄴ assets/css/*.css ${cssFiles.length}개 압축: ${(cssSrcBytes / 1024).toFixed(0)}KB → ${(cssOutBytes / 1024).toFixed(0)}KB (${cssPct}% 감소)`);
    console.log('  결과: ✅ 복사 + CSS 압축 완료');
  } else {
    console.log('  ㄴ (--check 모드라 스킵)');
  }

  /* [4] 프로파일 env 파일 교체 — local 이면 원본을 그대로 뒀으니 스킵.
     dev/prod 면 lib/env/profiles/env{Bo,Fo}Consts.<profile>.js 를 찾아서 dist/lib/env/ 의
     같은 이름 자리에 덮어쓴다(위 [2]단계가 이미 원본 lib/env/*.js 를 dist 에 복사해둔 뒤라,
     이 단계가 "그 위에 프로파일 버전으로 교체"하는 순서가 되어야 한다). */
  console.log(`\n[4] 프로파일 env 파일 적용 (${PROFILE})`);
  if (PROFILE === 'local') {
    console.log('  ㄴ local 프로파일 — 원본 lib/env/*.js 를 그대로 사용(교체 없음)');
  } else if (!DRY_RUN) {
    for (const name of ENV_TARGETS) {
      const profilePath = path.join(ROOT, 'lib/env/profiles', `${name}.${PROFILE}.js`);
      if (!fs.existsSync(profilePath)) {
        console.error(`❌ 프로파일 파일 없음: lib/env/profiles/${name}.${PROFILE}.js`);
        process.exit(1);
      }
      const src = fs.readFileSync(profilePath, 'utf8');
      const result = await esbuild.transform(src, {
        minify: true, loader: 'js', target: 'es2019', legalComments: 'none',
      });
      const outPath = path.join(OUT_DIR, 'lib/env', `${name}.js`);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, result.code, 'utf8');
      console.log(`  ㄴ lib/env/profiles/${name}.${PROFILE}.js → dist/lib/env/${name}.js 로 교체`);
    }
    console.log('  결과: ✅ 프로파일 적용 완료');
  } else {
    console.log('  ㄴ (--check 모드라 스킵)');
  }

  if (DRY_RUN) {
    console.log('\n[완료] --check 모드 — 실제 dist/ 파일은 안 씀(압축률 미리보기만)');
  } else {
    console.log(`\n[완료] dist/ 에 JS ${files.length - failCount}개 + HTML/assets 기록 완료 (프로파일: ${PROFILE})`);
    console.log('   다음: npm run verify-dist 로 lazy 클래스 매핑이 minify 후에도 살아있는지 확인할 것');
    console.log('   그 다음: dist/bo.html 또는 dist/index.html 을 Live Server 로 열어 직접 확인 가능');
  }
}

main();
