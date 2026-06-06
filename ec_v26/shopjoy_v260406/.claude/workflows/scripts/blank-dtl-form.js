export const meta = {
  name: 'blank-dtl-form',
  description: 'BO Dtl 폼: 미선택(inactive) 시 빈 폼 표준 일괄 적용 (form 기본값→빈값 + _applyNewDefaults + onMounted 가드)',
  phases: [
    { title: 'Transform', detail: '파일별 빈폼 변환 + node --check' },
    { title: 'Verify', detail: '변환 결과 재검증' },
  ],
}

const FILES = [
  'pages/bo/ec/pm/PmDiscntDtl.js',
  'pages/bo/ec/pm/PmCouponDtl.js',
  'pages/bo/ec/pm/PmEventDtl.js',
  'pages/bo/ec/pm/PmGiftDtl.js',
  'pages/bo/ec/pm/PmCacheDtl.js',
  'pages/bo/ec/pm/PmVoucherDtl.js',
  'pages/bo/sy/SyBbmDtl.js',
  'pages/bo/sy/SyBbsDtl.js',
  'pages/bo/sy/SyCodeDtl.js',
  'pages/bo/sy/SyTemplateDtl.js',
  'pages/bo/sy/SyAlarmDtl.js',
  'pages/bo/ec/cm/CmNoticeDtl.js',
  'pages/bo/ec/od/OdOrderDtl.js',
  'pages/bo/ec/od/OdClaimDtl.js',
  'pages/bo/ec/od/OdDlivDtl.js',
  'pages/bo/ec/dp/DpDispWidgetLibDtl.js',
]

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'status', 'summary'],
  properties: {
    file: { type: 'string' },
    status: { type: 'string', enum: ['changed', 'skipped', 'failed'] },
    nodeCheck: { type: 'string', enum: ['pass', 'fail', 'na'] },
    movedDefaults: { type: 'array', items: { type: 'string' }, description: '빈값으로 바꾸고 _applyNewDefaults 로 옮긴 필드:값 목록' },
    summary: { type: 'string', description: '무엇을 어떻게 바꿨는지 1-3문장' },
  },
}

const PROMPT = (f) => `BO 관리자 Vue Dtl 컴포넌트 파일 \`${f}\` 에 "미선택(inactive) 시 완전 빈 폼" 표준을 적용하라.

## 배경 / 정책
BO 상세(Dtl) 폼은 항상 렌더되며 \`active\` prop(기본 true)이 false면 "미선택: 행 선택 전/검색 초기화 후" 상태다. 현재 많은 Dtl이 \`form\`(또는 \`baseForm\`) reactive 를 신규 기본값(상태='활성', 날짜=오늘, 365, 'Y', 유형코드 등)으로 초기화해서, inactive 상태(검색 [초기화] 후)에도 폼이 기본값으로 채워져 보인다. → 사용자가 "초기화했는데 내용이 남아있다"고 인지.

## 적용할 표준 (참조 모델: pages/bo/ec/pm/PmSaveDtl.js — 이미 적용됨)
1. \`form\`/\`baseForm\` reactive 초기값을 **빈 값**으로 바꾼다:
   - 문자열 필드(상태코드/유형코드/단위/'Y'·'N' 플래그 등): \`''\`
   - 숫자 필드(기본값이 0/1/365 등): \`''\` (빈 문자열) — Vue input 에서 빈칸으로 보이게
   - 날짜 필드(today/DEFAULT_START/계산된 날짜): \`''\`
   - **유지(건드리지 말 것)**: id 필드(null 유지), 빈 문자열 이미 ''인 것, 빈 배열 [], \`visibilityTargets: '^PUBLIC^'\`(구조적 기본 — 그대로 둠), boolean 플래그가 의미상 false 기본인 것(authRequired:false 등은 false 유지 가능)
2. \`_applyNewDefaults\` 함수를 추가한다 (form 선언 바로 아래). 위에서 빈값으로 바꾼 필드들의 **원래 기본값**을 Object.assign 으로 채운다:
   \`\`\`js
   const _applyNewDefaults = () => {
     Object.assign(form, { /* 원래 비어있지 않던 기본값들만: status:'활성', someType:'XXX', expireDay:365, startDate: DEFAULT_START, ... */ });
   };
   \`\`\`
   (form 변수명이 baseForm 이면 baseForm 사용. 날짜 상수 DEFAULT_START/DEFAULT_END/_today() 가 있으면 그대로 활용; 없고 인라인 new Date 계산이었다면 그 계산식을 _applyNewDefaults 안으로 옮긴다.)
3. \`onMounted\` 콜백 안에서 신규 진입 시에만 기본값을 채운다. cfIsNew(없으면 cfNew/!props.dtlId) 판정 사용:
   \`\`\`js
   onMounted(() => {
     // ... 기존 코드(코드로드 등) 유지 ...
     if (props.active && cfIsNew.value) { _applyNewDefaults(); }
   });
   \`\`\`
   - 기존 onMounted 가 이미 있으면 그 안 끝에 한 줄 추가. onMounted 가 없으면 새로 만들되 기존 초기화 로직을 깨지 말 것.
   - cfIsNew 가 computed 로 존재하면 그대로 사용. 없으면 \`!props.dtlId\` 로 인라인 판정.
   - **주의**: cfIsNew/_applyNewDefaults 가 onMounted 보다 먼저 선언되도록(참조 순서). 선언이 뒤에 있으면 _applyNewDefaults 정의를 form 선언 직후로 두고, onMounted 는 원래 위치 유지(런타임 호출이라 순서 OK). cfIsNew 가 onMounted 뒤에 선언돼 있어도 computed 는 런타임 접근이라 OK.

## 특수 케이스
- **CmNoticeDtl.js**: 변수명 \`baseForm\`. startDate:_today(), endDate:_today(7) 를 _applyNewDefaults 로 이동. isFixed:'N' 도 이동(빈값은 '' 또는 'N' 유지 판단 — 신규 진입 시 'N' 채우고 inactive 면 '' 가 자연스러움 → ''로 비우고 default 'N').
- **DpDispWidgetLibDtl.js**: form 이 \`makeForm()\` 함수 반환으로 초기화될 수 있다. 이 경우 makeForm() 의 비어있지 않은 기본값을 분리해 _applyNewDefaults 로 옮기고, 초기 reactive 는 빈값 버전으로. handleLoadDetail 등에서 makeForm() 을 재사용한다면 그 동작은 깨지 말 것(로드는 서버값으로 덮어쓰므로 무관). 복잡하면 onMounted 가드만 추가하고 makeForm 기본값을 신규 진입시에만 적용하도록 최소 변경.
- **PmVoucherDtl.js**: 이미 onMounted 에서 날짜를 cfIsNew 가드로 채우는 부분이 있을 수 있다. 그 패턴을 확장해 나머지 기본값(vaucherStatus:'활성' 등)도 _applyNewDefaults 로 통합하고 onMounted 가드 일원화.
- **Od*Dtl** (Order/Claim/Dliv): 상태/결제수단/클레임유형/환불방법 기본값을 _applyNewDefaults 로. 단 이들은 신규 등록이 거의 없는 화면일 수 있으나 정책 일관성 위해 동일 적용.

## 금지
- template(\`template:\` 백틱 문자열) 정렬/리포맷 금지 (Vue 컴파일 깨짐). 오직 setup() 의 form 초기화 + _applyNewDefaults 추가 + onMounted 한 줄만 수정.
- 속성값에 \`&&\` 신규 도입 금지(이미 있으면 유지). v-if 의 논리 && 는 무관.
- 기존 검증 스키마(yup)/watch/핸들러 로직 변경 금지.

## 작업 순서
1. 파일을 Read 한다.
2. form/baseForm 초기값에서 "비어있지 않은 기본값" 목록을 파악한다(id:null, 이미 '', [], '^PUBLIC^' 제외).
3. 그 필드들을 빈값('')으로 바꾸고, _applyNewDefaults 추가, onMounted 가드 추가 — Edit 로 정확히 수정.
4. 반드시 \`node --check ${f}\` 를 Bash 로 실행해 통과 확인. 실패하면 수정해 재확인.
5. 비어있지 않은 기본값이 애초에 없었으면 status:'skipped'.

반드시 StructuredOutput 으로 결과 반환: file, status(changed/skipped/failed), nodeCheck(pass/fail/na), movedDefaults(옮긴 필드:값 배열), summary.`

phase('Transform')
const results = await pipeline(
  FILES,
  (f) => agent(PROMPT(f), { label: `blank:${f.split('/').pop()}`, phase: 'Transform', schema: SCHEMA }),
)

const ok = results.filter(Boolean)
const changed = ok.filter(r => r.status === 'changed')
const failed = ok.filter(r => r.status === 'failed' || r.nodeCheck === 'fail')
const skipped = ok.filter(r => r.status === 'skipped')

log(`변환 ${changed.length} / 스킵 ${skipped.length} / 실패 ${failed.length}`)

return {
  total: FILES.length,
  changed: changed.map(r => r.file),
  skipped: skipped.map(r => r.file),
  failed: failed.map(r => ({ file: r.file, summary: r.summary, nodeCheck: r.nodeCheck })),
  details: ok,
}
