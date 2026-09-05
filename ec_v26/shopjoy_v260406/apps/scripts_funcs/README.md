# scripts_funcs — 서브폴더별 독립 유틸리티 모음

`apps/scripts_deploy_illeesam_synol/`(배포 전용), `apps/scripts_testUrl/`(URL 점검 전용)처럼 목적이
뚜렷한 도구는 각자 최상위 `apps/scripts_*` 폴더를 갖지만, 그 정도로 크지 않은 **자잘한 개발용
유틸리티**는 여기 `scripts_funcs/` 밑에 **기능별 서브폴더**로 모은다 — 최상위에 폴더가 계속 늘어나는
걸 막기 위함(요청사항: "apps/scripts_funcs 안에 서브폴더 만들고 기능 적재하면 좋겠다").

## 폴더 구성

```
scripts_funcs/
├── crypto/    Jasypt 설정값 암호화/복호화 CLI (ENC(...) 값 생성)
└── (향후 추가되는 유틸리티들...)
```

## 새 유틸리티 추가 규칙

1. `scripts_funcs/{기능명}/` 서브폴더를 새로 만든다.
2. 그 폴더 안에 자체 `package.json`(필요하면 `scripts`/`scriptsGuide`)을 둔다 — 다른 서브폴더와
   완전히 독립적으로 실행 가능해야 한다(공용 의존성이 필요해지면 그때 워크스페이스 구조 도입 검토).
3. `apps/scripts_deploy_illeesam_synol/package.json` 등 다른 폴더의 관례대로, 여러 개의 관련
   기능이 한 서브폴더 안에 있다면 `"---------- 그룹명 ----------": "exit 0"` 더미 항목으로
   VS Code NPM SCRIPTS 패널 구분선을 넣는다.
4. 이 README 의 "폴더 구성" 표에 한 줄 추가한다.
