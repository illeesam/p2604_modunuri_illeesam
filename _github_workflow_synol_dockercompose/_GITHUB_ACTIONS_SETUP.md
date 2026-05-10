# GitHub Actions 환경 설정 상세 가이드

> 레포지토리: `p2604_modunuri_illeesam`  
> 배포 대상: Synology NAS (`illeesam.synology.me`)

---

## 📌 전체 설정 체크리스트

```
[ ] 1. GitHub 레포지토리 Secrets 등록
[ ] 2. Synology SSH 키 생성 및 등록
[ ] 3. Synology SSH 접속 허용 설정
[ ] 4. Synology sudo 비밀번호 없이 실행 설정
[ ] 5. GitHub Actions 워크플로우 트리거 확인
[ ] 6. 최초 워크플로우 실행 테스트
```

---

## 1. GitHub Repository Secrets 등록

### 경로

```
GitHub → p2604_modunuri_illeesam 레포 → Settings
       → Secrets and variables → Actions
       → New repository secret
```

### 등록할 Secrets 목록

| Secret 명 | 값 예시 | 설명 |
|---|---|---|
| `SYNOLOGY_HOST` | `illeesam.synology.me` | Synology DDNS 또는 IP |
| `SYNOLOGY_PORT` | `22` | SSH 포트 (변경했으면 해당 포트) |
| `SYNOLOGY_USER` | `illeesam` | Synology 관리자 계정 |
| `SYNOLOGY_PASSWORD` | `your_password` | Synology 로그인 비밀번호 |
| `SYNOLOGY_SSH_KEY` | `-----BEGIN ...` | SSH 개인키 (선택, 아래 설명 참고) |

> **PASSWORD와 SSH_KEY 중 하나만 있어도 됩니다.**  
> 둘 다 등록하면 SSH_KEY 우선 시도, 실패 시 PASSWORD 사용.  
> 보안상 SSH_KEY 방식을 권장합니다.

### Secrets 등록 화면

```
Settings
└── Secrets and variables
    └── Actions
        ├── Repository secrets   ← 여기에 등록
        └── New repository secret 버튼 클릭
            ├── Name  : SYNOLOGY_HOST
            └── Secret: illeesam.synology.me
                        → Add secret 버튼
```

---

## 2. SSH 키 생성 및 등록 (권장)

> 비밀번호 방식보다 SSH 키 방식이 보안상 안전합니다.

### 2-1. 로컬 PC에서 SSH 키페어 생성

```bash
# PowerShell 또는 Git Bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/synology_deploy

# 생성 결과
# ~/.ssh/synology_deploy      ← 개인키 (GitHub Secret에 등록)
# ~/.ssh/synology_deploy.pub  ← 공개키 (Synology에 등록)
```

> 패스프레이즈(passphrase)는 **Enter(빈칸)** 으로 설정.  
> GitHub Actions 무인 실행이므로 passphrase 있으면 실패.

### 2-2. 공개키를 Synology에 등록

```bash
# 방법 A) ssh-copy-id 사용
ssh-copy-id -i ~/.ssh/synology_deploy.pub -p 22 illeesam@illeesam.synology.me

# 방법 B) 수동 등록
cat ~/.ssh/synology_deploy.pub
# 출력된 내용 복사

ssh illeesam@illeesam.synology.me -p 22
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vi ~/.ssh/authorized_keys
# 복사한 공개키 붙여넣기 후 저장
chmod 600 ~/.ssh/authorized_keys
```

### 2-3. 개인키를 GitHub Secret에 등록

```bash
# 개인키 내용 출력
cat ~/.ssh/synology_deploy

# 출력 예시 (이 전체 내용을 복사)
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACB...
-----END OPENSSH PRIVATE KEY-----
```

```
GitHub → Settings → Secrets and variables → Actions → New repository secret
Name   : SYNOLOGY_SSH_KEY
Secret : (위에서 복사한 개인키 전체 내용, 첫줄~끝줄 포함)
→ Add secret
```

### 2-4. 연결 테스트

```bash
# 로컬 PC에서 키 인증 테스트
ssh -i ~/.ssh/synology_deploy -p 22 illeesam@illeesam.synology.me
# 비밀번호 없이 접속되면 성공
```

---

## 3. Synology SSH 설정 확인

### 3-1. SSH 서비스 활성화

```
Synology DSM → 제어판 → 터미널 및 SNMP
→ [터미널] 탭
→ ☑ SSH 서비스 활성화
→ 포트: 22 (또는 변경한 포트)
→ 적용
```

### 3-2. SSH 포트 변경 시 (선택, 보안 강화)

```
DSM → 제어판 → 터미널 및 SNMP
→ SSH 포트를 22 → 다른 포트(예: 2222)로 변경
→ GitHub Secret SYNOLOGY_PORT 도 동일하게 수정
```

### 3-3. 방화벽 허용 확인

```
DSM → 제어판 → 보안 → 방화벽
→ 규칙 편집
→ 포트 22 (또는 변경한 SSH 포트) 허용 확인
→ 포트 31000 (API 포트) 허용 확인
```

### 3-4. 공유기 포트포워딩 확인 (외부 접속용)

> Synology가 공유기 내부망에 있는 경우 필요

```
공유기 관리 페이지 → 포트포워딩 (NAT)
→ 규칙 추가

서비스 포트 : 22        → 내부 IP:22    (SSH)
서비스 포트 : 31000     → 내부 IP:31000 (API)
서비스 포트 : 5432      → 내부 IP:5432  (DB, 내부만 사용 시 불필요)
```

> DDNS(`illeesam.synology.me`) 사용 중이면 Synology DDNS 설정 확인:  
> `DSM → 제어판 → 외부 액세스 → DDNS`

---

## 4. Synology sudo 패스워드 없이 실행 설정

> GitHub Actions 스크립트에서 `echo $PASSWORD | sudo -S docker ...` 방식을 쓰는데  
> sudoers 설정으로 더 깔끔하게 처리할 수 있습니다.

### 현재 방식 (SYNOLOGY_PASSWORD 사용)

```bash
# 워크플로우 내 현재 방식
echo "${{ secrets.SYNOLOGY_PASSWORD }}" | sudo -S docker compose up -d
```

### 개선 방식: NOPASSWD sudoers 설정 (선택)

> 비밀번호를 매번 파이프로 넘기지 않아도 됩니다.

```bash
# Synology SSH에서
sudo visudo
# 또는
sudo vi /etc/sudoers

# 아래 줄 추가 (파일 맨 아래에)
illeesam ALL=(ALL) NOPASSWD: /usr/local/bin/docker, /usr/bin/docker
```

> ⚠️ `visudo`로 문법 검증 후 저장해야 합니다.  
> 잘못 저장하면 sudo 자체가 안 될 수 있습니다.

### 적용 후 워크플로우 수정

```yaml
# 기존
echo "${{ secrets.SYNOLOGY_PASSWORD }}" | sudo -S docker compose ps

# NOPASSWD 설정 후 (더 간결)
sudo docker compose ps
```

---

## 5. 워크플로우 트리거 조건 확인

### 현재 트리거 설정

```yaml
# deploy-ec-admin.yml
on:
  push:
    branches: [ main ]
    paths:
      - 'ec_v26/shopjoy_v260406/_apps_be/EcAdminApi/**'
```

### 트리거 조건 해석

| 조건 | 설명 |
|---|---|
| `branches: [ main ]` | `main` 브랜치에 push 할 때만 실행 |
| `paths: EcAdminApi/**` | 해당 경로 파일 변경이 있을 때만 실행 |
| **두 조건 모두 충족** | AND 조건 → 둘 다 맞아야 트리거 |

### 트리거가 안 되는 경우 체크

```
✗ develop, feature/* 브랜치에 push → 실행 안 됨 (main만 해당)
✗ EcAdminApi 경로 외 파일만 변경 → 실행 안 됨
✗ PR 생성/머지 후 main에 반영 → push 이벤트 발생하므로 실행됨
✓ main 브랜치에 EcAdminApi 하위 파일 변경 포함 push → 실행됨
```

### 수동 실행 트리거 추가 (선택)

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'ec_v26/shopjoy_v260406/_apps_be/EcAdminApi/**'
  workflow_dispatch:   # ← 추가: GitHub UI에서 수동 실행 버튼 활성화
```

```
GitHub → Actions 탭 → Deploy EcAdminApi to Synology
→ Run workflow 버튼 → main 브랜치 선택 → Run workflow
```

---

## 6. GitHub Actions 권한 설정

### 6-1. Actions 활성화 확인

```
GitHub → Settings → Actions → General
→ Actions permissions
→ ☑ Allow all actions and reusable workflows
→ Save
```

### 6-2. 워크플로우 파일 위치 확인

```
레포 루트
└── .github/
    └── workflows/
        └── deploy-ec-admin.yml   ← 반드시 이 경로
```

> `.github` 폴더는 레포 **루트**에 있어야 합니다.  
> `ec_v26/...` 하위가 아닌 레포 최상단 위치.

---

## 7. 최초 실행 테스트 및 디버깅

### 7-1. 워크플로우 실행 확인

```
GitHub → Actions 탭
→ Deploy EcAdminApi to Synology 워크플로우 클릭
→ 최근 실행 목록 확인
→ 각 Step 클릭하여 로그 확인
```

### 7-2. 각 Step 실패 시 원인 및 해결

**[01] 체크아웃 실패**
```
원인: 레포 접근 권한 없음
해결: Settings → Actions → General → Read and write permissions 확인
```

**[03] Gradle 빌드 실패**
```
원인: Java 버전 불일치, 의존성 없음
해결:
- build.gradle 의 java 버전 확인 (17 vs 18)
- gradlew 파일이 Git에 포함되어 있는지 확인
  git add ec_v26/.../EcAdminApi/gradlew
  git add ec_v26/.../EcAdminApi/gradle/
```

**[04] Docker 빌드 실패**
```
원인: Dockerfile 경로 오류, 베이스 이미지 pull 실패
해결:
- Dockerfile이 EcAdminApi/ 루트에 있는지 확인
- FROM eclipse-temurin:18-jdk → 17-jdk 로 맞추기 (JDK 버전 통일)
```

**[06] SCP 전송 실패**
```
원인: SSH 접속 불가, 포트 차단, 인증 실패
해결:
- SYNOLOGY_HOST, SYNOLOGY_PORT 값 확인
- 로컬에서 직접 SSH 접속 테스트
  ssh -p {PORT} {USER}@{HOST}
- 공유기 포트포워딩 확인
- Synology 방화벽 확인
```

**[07] SSH 배포 실패 - sudo 권한**
```
원인: sudo 비밀번호 파이프 방식 실패
해결:
- SYNOLOGY_PASSWORD Secret 값 정확한지 확인
- 특수문자 포함 시 따옴표 처리 문제 → SSH Key 방식으로 전환 권장
```

**[07] docker compose 명령어 없음**
```
원인: DSM 구버전 (docker-compose 플러그인 미포함)
해결:
sudo docker-compose up -d   # 하이픈 방식으로 변경
또는 DSM 업그레이드 (7.2 이상)
```

### 7-3. 강제 트리거 (테스트용)

```bash
# EcAdminApi 하위 아무 파일에 공백 추가 후 push
# 예: README나 application.yml 끝에 빈 줄 추가
git add ec_v26/shopjoy_v260406/_apps_be/EcAdminApi/
git commit -m "chore: trigger deploy test"
git push origin main
```

---

## 8. Secrets 값 검증 방법

> 워크플로우 내 `[06-00]` 스텝에서 이미 출력하고 있음

```yaml
- name: "[06-00] 환경변수 값 출력"
  run: |
    echo "SYNOLOGY_HOST : ${{ secrets.SYNOLOGY_HOST }}"
    echo "SYNOLOGY_PORT : ${{ secrets.SYNOLOGY_PORT }}"
    echo "SYNOLOGY_USER : ${{ secrets.SYNOLOGY_USER }}"
    # PASSWORD, SSH_KEY는 마스킹되어 출력됨
```

### Secrets 마스킹 규칙

```
등록된 Secret 값은 로그에서 자동으로 *** 로 마스킹됨
→ SYNOLOGY_HOST 처럼 민감하지 않은 값도 등록하면 마스킹됨
→ 실제 값 확인은 Settings → Secrets에서 불가 (덮어쓰기만 가능)
→ 잊어버린 경우: 새 값으로 Update 처리
```

---

## 9. 최종 Secrets 등록 현황 확인

```
GitHub → p2604_modunuri_illeesam
→ Settings → Secrets and variables → Actions
→ Repository secrets 목록

✓ SYNOLOGY_HOST     등록됨
✓ SYNOLOGY_PORT     등록됨
✓ SYNOLOGY_USER     등록됨
✓ SYNOLOGY_PASSWORD 등록됨
✓ SYNOLOGY_SSH_KEY  등록됨 (선택)
```

> Secrets는 **레포 단위**로 관리됩니다.  
> Organization 레포인 경우 Organization Secrets도 확인하세요.

---

## 10. Dockerfile JDK 버전 통일 권장

> 현재 Dockerfile이 JDK 18, GitHub Actions가 JDK 17로 설정되어 있어  
> 빌드 환경 불일치가 발생할 수 있습니다.

### 현재 상태

```dockerfile
# Dockerfile
FROM eclipse-temurin:18-jdk AS build   ← JDK 18
FROM eclipse-temurin:18-jdk            ← JDK 18
```

```yaml
# deploy-ec-admin.yml
- uses: actions/setup-java@v4
  with:
    java-version: '17'                 ← JDK 17
```

### 권장: 통일 (17 또는 21로)

```dockerfile
# Dockerfile 수정 (JDK 17 LTS로 통일)
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 31000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

> 런타임 이미지는 `jdk` 대신 `jre`로 변경하면 이미지 크기 절감.  
> Spring Boot 3.x → Java 17 LTS 권장.  
> Spring Boot 3.3+ → Java 21 LTS 권장.
