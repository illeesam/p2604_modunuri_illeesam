# 파일첨부 관리 정책

## 정책명 & 목적

**첨부파일 통합 관리 정책** — 모든 도메인에서 업로드되는 파일을 중앙에서 통일된 규칙으로 관리.

## 범위

- **역할**: 모든 사용자 (회원/비회원), 관리자
- **대상 시스템**: 리뷰, Q&A, 상품, 주문, 공지사항 등 파일 업로드가 필요한 모든 모듈
- **파일 종류**: 이미지, 문서, 동영상 등

## 주요 정책

### 1. 파일 검증

#### 허용 확장자
```
이미지: jpg, jpeg, png, gif, webp, bmp, svg
문서: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv
동영상: mp4, avi, mov, mkv, webm, flv, wmv, m4v
아카이브: zip (제한적 허용)
```

#### 차단 확장자 (보안)
```
exe, bat, cmd, com, dll, sys, scr, vbs, js, jar, rar, 7z, iso
```

#### 파일 크기 제한 (기본값, 프로파일별 조정 가능)
| 파일 종류 | 최대 크기 |
|---------|--------|
| 이미지 | 5 MB |
| 문서 | 20 MB |
| 동영상 | 100 MB |
| 기타 | 10 MB |

### 2. 파일 저장 정책

#### 폴더 경로 규칙
```
/cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/
예: /cdn/review/2026/202604/20260421/
예: /cdn/product/2026/202604/20260421/
```

#### 파일명 생성 규칙
```
YYYYMMDD + "_" + hhmmss + "_" + 순서번호(2자) + "_" + random(4자) + .확장자
예: 20260421_143045_01_1234.jpg
    20260421_143045_02_5678.mp4

분해:
- YYYYMMDD: 날짜 (20260421)
- hhmmss: 시간 (143045 = 14시 30분 45초)
- 순서번호: 같은 시간에 업로드된 파일 순번 (01, 02, ...)
- random(4): 충돌 방지 (0000~9999)
```

### 3. 스토리지 타입

| 타입 | 저장소 | 용도 | 경로 |
|------|-------|------|------|
| **LOCAL** | 로컬 파일시스템 | 개발/테스트 | `/cdn/...` |
| **AWS_S3** | Amazon S3 | 프로덕션 클라우드 | `s3://bucket/cdn/...` |
| **NCP_OBS** | Naver Cloud OBS | 대체 프로덕션 | `obs://bucket/cdn/...` |

### 4. 동영상 처리

#### 자동 변환
- 모든 동영상 파일을 **H.264 MP4**로 자동 변환
- 원본 파일은 변환 완료 후 **자동 삭제** (저장소 절약)
- 변환 후 파일 확장자: `.mp4` (원본 확장자 무시)

#### 동영상 메타데이터
| 항목 | 값 |
|------|-----|
| 비디오 코덱 | H.264 |
| 오디오 코덱 | AAC |
| 비트레이트 | CRF 23 (가변) |
| 스트리밍 최적화 | movflags +faststart (HTTP Range 요청 지원) |

#### 동영상 썸네일
- **필수 생성** (선택이 아님)
- 추출 위치: 동영상 시작으로부터 1초
- 크기: 200x200 px
- 형식: JPG
- 파일명: `{원본파일명}_thumb.jpg` (예: `20260421_143045_01_1234_thumb.jpg`)

### 5. 이미지 썸네일

- **선택 생성** (파라미터: `createThumbnail=true`)
- 크기: 200x200 px (기본), 400x400, 800x800 (선택 설정)
- 형식: JPG
- 파일명 규칙: `{원본파일명}_thumb.jpg`

### 6. 단일 파일 vs 다중 파일

| 항목 | 단일 파일 | 다중 파일 |
|------|---------|---------|
| 엔드포인트 | POST /api/cm/upload/one | POST /api/cm/upload/multi |
| 파일 개수 | 1개 | 최대 10개 |
| 그룹 생성 | ❌ (선택사항) | ✅ (자동) |
| 반환 데이터 | attachId 1개 | attachGrpId + attachIds 배열 |

#### 단일 파일 업로드
```
POST /api/cm/upload/one
- file: 업로드 파일
- businessCode: 업무 코드 (기본값: "common")
- createThumbnail: 이미지 썸네일 생성 여부 (기본값: false)
- attachGrpId: 파일 그룹 ID (선택, 기존 그룹에 파일 추가)
```

#### 다중 파일 업로드
```
POST /api/cm/upload/multi
- files: 파일 배열 (최대 10개)
- businessCode: 업무 코드 (기본값: "common")
- grpNm: 그룹 이름 (선택, 기본값: "{businessCode} 파일 그룹")
- createThumbnail: 이미지 썸네일 생성 여부 (기본값: false, 동영상은 자동)
```

### 7. HTTP Range 요청 (동영상 스트리밍)

#### 지원 엔드포인트
```
GET /api/cm/video/play/{videoPath}
```

#### Range 헤더 지원
```
GET /api/cm/video/play/static/cdn/review/...
Range: bytes=0-1023

응답: HTTP 206 Partial Content
Content-Range: bytes 0-1023/52428800
```

#### 클라이언트 사용
- **HTML5 <video> 태그**: 자동 지원 (일시정지/재개/스크롤)
- **JavaScript**: fetch API + Range 헤더
- **기타**: curl, wget, ffmpeg 등 표준 HTTP 클라이언트

### 8. 파일 다운로드

#### 경로 기반 다운로드
```
GET /api/cm/download/{filePath}
예: GET /api/cm/download/review/2026/202604/20260421/20260421_143045_01_1234.jpg
```

#### UUID 기반 다운로드 (보안)
```
GET /api/cm/download/secure/{fileId}
예: GET /api/cm/download/secure/ATT20260421143045010101

특징:
- 파일 경로 노출 없음
- DB에서 파일 정보 조회
- 사용자 접근 권한 검증 필수
```

#### 파일명 인코딩
- 모든 파일명은 UTF-8 자동 인코딩
- 한글 파일명 자동 지원
- 브라우저에서 자동 디코딩

## 데이터베이스 테이블

### sy_attach (첨부파일 정보)
```
PK: attach_id (YYMMDDhhmmss+random+seq)
FK: attach_grp_id → sy_attach_grp.attach_grp_id

주요 컬럼:
- file_nm: 원본 파일명
- stored_nm: 저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)
- file_ext: 파일 확장자
- storage_type: LOCAL / AWS_S3 / NCP_OBS
- storage_path: 저장 경로 (정책: /static/cdn/...)
- thumb_generated_yn: 썸네일 생성 여부 (Y/N)
- thumb_stored_nm: 썸네일 파일명
- thumb_url: 썸네일 경로
```

### sy_attach_grp (파일 그룹)
```
PK: attach_grp_id (ATG + timestamp + random)

주요 컬럼:
- attach_grp_code: 그룹 코드
- attach_grp_nm: 그룹 이름
- file_ext_allow: 허용 확장자
- max_file_size: 최대 파일 크기
- max_file_count: 최대 파일 개수
- use_yn: 사용 여부 (Y/N)
```

## 제약사항 & 주의

### 1. 보안
- ❌ 실행파일 업로드 금지 (차단 확장자 검사)
- ❌ 디렉토리 순회 공격 방지 ("../" 경로 검사)
- ✅ 파일명 자동 생성 (사용자 입력값 무시)
- ✅ MIME 타입 검증

### 2. 동영상 처리
- ⚠️ FFmpeg 설치 필수 (시스템 레벨)
- ⚠️ 원본 파일은 변환 후 자동 삭제 (복구 불가)
- ✅ 변환 실패 시 예외 처리 (에러 로깅)

### 3. 저장소 전환 (LOCAL → AWS_S3 / NCP_OBS)
- `storage_type` 변경만으로 스토리지 변경 가능
- 기존 파일은 `storage_path`로 기존 저장소에서 검색
- 신규 파일은 새 저장소에 저장

### 4. 성능
- 파일 업로드는 비동기 처리 권장 (대용량 동영상)
- 동영상 변환은 배경 작업 스케줄러에서 처리 (장시간 소요)

## 구현 참조

| 항목 | 클래스 |
|------|--------|
| 파일 검증 | FileUploadUtil |
| 동영상 변환 | VideoConvertUtil |
| 단일 업로드 | CmUploadOneController |
| 다중 업로드 | CmUploadMultiController |
| 동영상 재생 | CmVideoPlayController |
| 파일 다운로드 | CmDownloadController |

## 관련 설정 파일

- `application.yml`: `app.file.*` 정책 설정
- `application-prod.yml`: 프로덕션 스토리지 (AWS_S3/NCP_OBS)

## 변경 이력

| 날짜 | 변경 내용 |
|------|---------|
| 2026-04-21 | 초안 작성 |
| | - 파일 검증, 저장 정책 |
| | - 동영상 자동 변환 & 썸네일 생성 |
| | - HTTP Range 요청 스트리밍 지원 |
