# Synology NAS에 HTTPS 적용하기 — DSM 관리자 화면 매뉴얼 (초보자용)

작성일: 2026-09-04
대상: DSM(시놀로지 관리자 화면) 조작이 처음인 개발자

이 문서는 실제로 `21000.illeesam.synology.me`에 HTTPS를 적용하면서 캡처한 화면을 기준으로 정리했습니다. **DSM 화면 조작(GUI)이라 SSH/명령어로는 자동화할 수 없는 부분**입니다 — DSM 로그인 포털의 핵심 설정이라 잘못 건드리면 NAS 관리자 화면 자체에 영향이 갈 수 있어서, 이 부분만큼은 사람이 직접 DSM 제어판에서 진행합니다.

> 관련 문서: [12_illeesam_synology_FE_수동배포가이드.md](12_illeesam_synology_FE_수동배포가이드.md) §4-4 (이 작업을 하게 된 원인 — 로그인 시 `crypto.subtle` 에러)

## 왜 필요한가

브라우저는 로그인 비밀번호 해싱에 쓰는 `crypto.subtle` API를 **HTTPS 또는 localhost에서만** 허용합니다. `http://illeesam.synology.me:21000`처럼 평문 HTTP로 접속하면 이 API가 없어서 로그인이 항상 실패합니다. 이 문제를 근본적으로 해결하려면 HTTPS가 필요합니다.

## 왜 시놀로지 자체 DDNS 인증서(기본 인증서)를 그냥 못 쓰는가

DSM에 이미 `illeesam.synology.me` 기본 인증서(Synology DDNS Certificate)가 있지만, `443`(HTTPS 기본 포트)은 **DSM 자체 Web Station 기본 페이지**가 이미 쓰고 있습니다. 그래서 우리 앱을 그 자리에 바로 연결할 수 없고, **서브도메인 + DSM 리버스 프록시**로 우회합니다 — 다행히 이 NAS에는 이미 이런 식으로 서브도메인마다 서비스를 붙이는 패턴(`13000.illeesam.synology.me`, `11000.illeesam.synology.me` 등)이 여러 개 있어서, 그 패턴을 그대로 따라갑니다.

---

## STEP 1 — Let's Encrypt 인증서 발급

**경로**: DSM 로그인 → **제어판 → 보안 → 인증서** 탭

기존 인증서 목록 예시(이미 다른 프로젝트들이 이 패턴으로 여러 개 만들어둔 상태):

```
illeesam.synology.me     (기본 인증서) Synology DDNS Certificate
13000.illeesam.synology.me
11000.illeesam.synology.me
11500.illeesam.synology.me
...
```

**1-1.** 하단 **추가** 버튼 클릭

**1-2.** "새 인증서 추가" 선택 → 다음

**1-3.** 인증서 설명(이름) 입력: **`21000.illeesam.synology.me`**
> ⚠ 이 이름칸은 목록에서 구분하려는 "별명"일 뿐입니다 — 진짜 중요한 건 다음 단계의 "도메인 이름" 입력칸입니다. 이름과 도메인을 헷갈려서 도메인 칸에 `illeesam.synology.me`(서브도메인 없이)를 넣으면 잘못 발급됩니다(실제로 이 프로젝트 진행 중 한 번 그렇게 잘못 만들었다가 삭제하고 다시 만들었습니다).

**1-4.** 다음 → **"Let's Encrypt에서 인증서 받기"** 선택 → 다음

**1-5.** 입력:
   - **도메인 이름**: **`21000.illeesam.synology.me`** ← 여기가 진짜 핵심
   - **이메일**: 본인 이메일

**1-6.** 완료 클릭 → 수 초~1분 내 발급

**결과 확인**: 인증서 목록에서 새로 생긴 항목을 클릭해서 펼치면 아래처럼 나와야 정상입니다.

```
21000.illeesam.synology.me - 2026-12-01
(RSA/ECC) 21000.illeesam.synology.me

발급자:       YR1 (또는 R계열 — Let's Encrypt 중간 인증기관)
주제 대체 이름: 21000.illeesam.synology.me   ← 이게 실제로 이 인증서가 커버하는 도메인
대해:         -   (아직 어디에도 안 쓰이는 중 — STEP 3에서 연결함)
```

> ⚠ **"주제 대체 이름"이 반드시 `21000.illeesam.synology.me`와 정확히 일치해야 합니다.** `illeesam.synology.me`(서브도메인 없이)로 나오면 STEP 1-3에서 이름/도메인을 헷갈린 것이니, 그 인증서는 삭제(선택 → 작업 → 삭제)하고 다시 만드세요.

---

## STEP 2 — 리버스 프록시 규칙 생성

**경로**: **제어판 → 로그인 포털** → 상단 탭 **고급** → **리버스 프록시** → **생성**

생성 창에 아래 값을 그대로 입력합니다.

| 구분 | 항목 | 값 |
|---|---|---|
| 일반 | 역방향 프록시 이름 | `21000.illeesam` (아무 이름) |
| **소스** | 프로토콜 | `HTTPS` |
| **소스** | 호스트 이름 | `21000.illeesam.synology.me` |
| **소스** | 포트 | `443` |
| **소스** | HSTS 활성화 | 체크 해제(꺼둠) |
| **소스** | 액세스 제어 프로파일 | `구성되지 않음` (기본값 그대로) |
| **대상** | 프로토콜 | `HTTP` |
| **대상** | 호스트 이름 | `localhost` |
| **대상** | 포트 | `21000` |

**저장** 클릭.

> 💡 이 NAS는 이미 `443`을 여러 서브도메인이 나눠 쓰고 있는 구조(호스트 이름으로 구분)라서, **공유기에 새 포트포워딩을 추가할 필요가 없습니다** — `443`은 이미 열려 있습니다.

**결과 확인**: 리버스 프록시 목록에 방금 만든 규칙이 보이면 성공입니다.

---

## STEP 3 — 인증서를 리버스 프록시 규칙에 연결

**경로**: **제어판 → 보안 → 인증서** 탭 → 하단 **설정** 버튼

팝업(구성/고급 탭)에서 "서비스 ↔ 인증서" 매핑 표가 뜹니다. 예시:

```
서비스                          인증서
14200.illeesam.synology.me  →  illeesam.synology.me
14300.illeesam.synology.me  →  illeesam.synology.me
21000.illeesam.synology.me  →  21000.illeesam.synology.me   ← 이 행을 확인/선택
3000.illeesam.synology.me   →  3000.illeesam.synology.me
50100.illeesam.synology.me  →  50100.illeesam.synology.me
50500.illeesam.synology.me  →  50500.illeesam.synology.me
FTPS                        →  illeesam.synology.me
FileStation - 7001          →  illeesam.synology.me
```

**3-1.** `21000.illeesam.synology.me` 행을 찾습니다(STEP 2에서 만든 리버스 프록시가 자동으로 이 목록에 서비스로 나타납니다)

**3-2.** 그 옆 드롭다운에서 **STEP 1에서 발급한 `21000.illeesam.synology.me` 인증서** 선택(자동으로 같은 이름이 골라져 있을 수도 있음 — 그럼 그대로 두면 됨)

**3-3.** **확인** 클릭

---

## 최종 확인

브라우저 주소창에:
```
https://21000.illeesam.synology.me/index.html   (FO 사용자 화면)
https://21000.illeesam.synology.me/bo.html       (BO 관리자 화면)
```

- 주소창에 자물쇠 아이콘(정상 인증서) + 화면이 정상 렌더되면 성공
- **로그인 시도** — `crypto.subtle`이 정상 동작해서(HTTPS라서) 로그인이 됩니다

**실제로 이 프로젝트에서 curl로 검증한 결과** (참고용):

```
$ curl https://21000.illeesam.synology.me/bo.html
HTTP/1.1 200 OK

$ curl "https://21000.illeesam.synology.me/api/co/sy/code/page?pageNo=1&pageSize=2"
{"ok":true,"status":200,"data":{"pageList":[...],"pageTotalCount":1219,...}}

$ curl "https://21000.illeesam.synology.me/api/fo/ec/pd/prod/page"
HTTP/1.1 200 OK
```

---

## 겪었던 문제와 해결 (실제 진행 중 발생한 것들)

### 문제 1 — 인증서를 잘못 발급함 (도메인 이름 vs 설명 이름 혼동)

**증상**: 인증서 상세정보에서 "주제 대체 이름"이 `illeesam.synology.me`로 나옴(서브도메인 없이).

**원인**: STEP 1-3(설명/이름 입력칸)에는 `21000.illeesam.synology.me`를 넣었지만, STEP 1-5(실제 Let's Encrypt 도메인 입력칸)에는 `illeesam.synology.me`를 넣어서 생김 — **두 입력칸이 서로 다른 의미**인데 헷갈리기 쉽습니다.

**해결**: 잘못 만든 인증서 삭제(선택 → 작업 → 삭제) → STEP 1을 처음부터 다시 진행, 이번엔 **두 칸 모두** `21000.illeesam.synology.me`로 입력.

### 문제 2 — 리버스 프록시 연결 직후, 프론트 API 호출이 여전히 옛날 주소로 나감

**증상**: `https://21000.illeesam.synology.me`로 정상 접속은 되는데, 화면에서 상품목록 등을 열면 500 에러 + 콘솔에 `GET https://illeesam.synology.me:21000/api/...` (옛날 평문 HTTP 주소 + 포트)로 요청이 나가는 게 보임.

**원인**: 프론트 코드(`lib/env/profiles/env{Bo,Fo}Consts.dev.js`)의 `baseApiHost`/`baseApiPort`가 예전 값(`illeesam.synology.me` / `21000`, 평문 HTTP 포트)으로 고정돼 있었음 — HTTPS 서브도메인으로 옮겼는데 이 설정은 안 바꿔서 발생.

**해결**: `baseApiHost`를 `21000.illeesam.synology.me`로, `baseApiPort`를 빈 값(HTTPS 기본 포트 443이라 생략)으로 수정 → `npm run build:dev` 재빌드 → NAS 재배포. (이 설정을 바꾸면 예전 `http://illeesam.synology.me:21000` 직접 접속으로는 API가 더 이상 안 붙습니다 — 이제부터는 `https://21000.illeesam.synology.me`가 정식 진입점입니다.)

---

## 용어 설명

| 용어 | 뜻 |
|---|---|
| DDNS | 공유기 IP가 바뀌어도 항상 같은 도메인(`illeesam.synology.me`)으로 접속할 수 있게 해주는 시놀로지 서비스 |
| Let's Encrypt | 무료로 HTTPS 인증서를 발급해주는 공인 기관. DSM이 발급·자동갱신까지 대신 처리 |
| 리버스 프록시 | "이 주소(도메인+포트)로 들어온 요청을 저 내부 서비스로 넘겨줘"를 DSM이 대신 해주는 기능 |
| 서브도메인 | `21000.illeesam.synology.me`처럼 원래 도메인 앞에 붙는 이름. 같은 IP를 여러 서비스가 나눠 쓸 때 포트 대신 이걸로 구분 가능 |
| 주제 대체 이름(SAN) | 인증서가 실제로 보증하는 도메인 이름. 접속하는 주소와 이게 다르면 브라우저가 경고를 띄움 |
