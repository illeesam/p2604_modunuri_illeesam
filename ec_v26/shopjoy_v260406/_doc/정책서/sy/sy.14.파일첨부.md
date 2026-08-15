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

⭐ **2026-08-15 전면 개편** — `sy_attach_grp` 테이블 및 `attach_grp_id` 개념 전체 폐기.
모든 업로드는 **항상 미연계(unlinked) 상태로 즉시 물리 저장**되고, 실제 "이 파일이 무엇에 속하는지"는
`sy_attach.ref_table_nm`/`ref_id` 로 연계한다. 연계는 업로드 시점이 아니라, 대상 레코드를 저장하는
**업무 Service 의 create()/update() 트랜잭션 안**에서 반영한다 (`SyAttachService.applyChanges`, §10-A).

| 항목 | 단일 파일 | 다중 파일 |
|------|---------|---------|
| 엔드포인트 | POST /api/co/cm/upload/one | POST /api/co/cm/upload/multi |
| 파일 개수 | 1개 | 최대 10개 |
| 반환 데이터 | attachId 1개 | attachIds 배열 + files[] (attachId·cdnImgUrl·fileSize 등) |
| 연계(ref) | 없음(항상 미연계) | 없음(항상 미연계) — 부모 저장 시 별도 반영 |

#### 단일 파일 업로드
```
POST /api/co/cm/upload/one
- file: 업로드 파일
- businessCode: 업무 코드 (기본값: "common")
- createThumbnail: 이미지 썸네일 생성 여부 (기본값: false)
```

#### 다중 파일 업로드
```
POST /api/co/cm/upload/multi
- files: 파일 배열 (최대 10개)
- businessCode: 업무 코드 (기본값: "common")
```
응답 `data.files[]` 항목: `attachId`, `originalName`, `fileSize`, `fileExt`, `cdnImgUrl`, `thumbUrl`, `thumbCdnUrl` 등 —
`cdnImgUrl` 은 업로드 즉시 확정되므로 별도 조회 없이 바로 사용 가능.

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

### sy_attach (첨부파일 정보) — 단일 테이블, 그룹 테이블 없음

```
PK: attach_id (YYMMDDhhmmss+random+seq)

연계 컬럼 (2026-08-15 전면 개편 — attach_grp_id 폐기):
- ref_table_nm: 관련 테이블명 (예: 'sy_notice', 'pd_prod_img') — 대상 엔티티에 직접 연계
- ref_id:       관련 ID. ref_table_nm 과 조합해 대상 레코드를 식별. 대상이 아직 저장 전(ID 미확정)이면
                둘 다 NULL(미연계) — 업로드는 되지만 어디에도 속하지 않은 상태

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

### ref_table_nm 명명 규칙

⭐ 백엔드에서 `ref_table_nm` 값은 항상 **`SyAttachRefTableConst`**
([base/sy/constant/SyAttachRefTableConst.java](../../../_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/constant/SyAttachRefTableConst.java))
상수로 참조한다 — 문자열 리터럴 직접 타이핑 금지. 첨부 저장(연계 반영, `applyChanges`/`updateSelective`
호출부)뿐 아니라 목록/상세 조회에서 첨부 목록을 함께 내려줄 때(`findByRefTableNmAndRefIdIn...` 조회부,
§10 `fnFillAttachFiles` 패턴)도 동일하게 이 상수를 쓴다. 오타로 인한 연계 불일치(저장은
`"sy_notice"`, 조회는 `"sy_Notice"` 처럼 미묘하게 다른 문자열을 써서 조용히 빈 목록이 나오는 사고)를
컴파일 타임에 막기 위함.

⭐ **프론트도 이 값을 손으로 다시 타이핑하지 않는다** — `GET /co/cm/upload/ref/table-options`
(`SyAttachRefTableConst.OPTIONS` 그대로 반환) 를 `coUtil.cofGetAttachRefTableOptions()` 로 조회한다
(세션당 1회만 네트워크 호출, Promise 캐싱). 각 화면은 반환된 `[{key, value, label}]` 에서
`key`(예: `'NOTICE'`)로 자기 항목을 찾아 `value` 를 `<base-attach-grp :ref-table-nm>` 에 동적 바인딩한다.

```js
const refTableNm = ref('');
const fnLoadRefTableNm = async () => {
  const opts = await coUtil.cofGetAttachRefTableOptions();
  refTableNm.value = opts.find(o => o.key === 'NOTICE')?.value || '';
};
// initPage() 안에서 await fnLoadRefTableNm() 호출
```
```html
<base-attach-grp ref="attachGrpRef" :ref-table-nm="refTableNm" :ref-key-id="dtlId" ... />
```
- `refTableNm` 이 처음엔 빈 문자열이라 `BaseAttachGrp` 마운트 시점엔 `cfHasRef` 가 false 일 수 있다 —
  `BaseAttachGrp` 는 `onMounted` 1회성 체크가 아니라 `watch(cfHasRef, ..., {immediate:true})` 로
  감시하므로, `refTableNm` 이 나중에 채워져도 자동으로 `loadFiles()` 가 걸린다(2026-08-15, 놓치지 않게
  수정됨)
- `key` 값은 `SyAttachRefTableConst.OPTIONS` 에 정의된 것만 쓴다: `NOTICE`/`BBS`/`CONTACT_CONTENT`/
  `CONTACT_ANSWER`/`FAQ`/`CHATT_MSG`/`PROD_IMG`
- 적용 화면: `CmNoticeDtl`/`SyBbsDtl`/`CmFaqDtl`/`SyContactDtl`(2개)/`Contact.js`(FO)/`Faq.js`(FO)/
  `MyContact.js`(FO, 2개) — `SyAttachMng.js` 의 검색 select 도 동일하게 이 목록을 그대로 씀
  (+ 프론트 전용 `sy_attach_grp_legacy` 항목만 별도 부착, §구현 참조)

| 값 | 대상 | 비고 |
|---|---|---|
| `sy_notice` / `sy_bbs` / `cm_faq` / `cm_chatt_msg` | 실제 테이블명 1:1 | 레코드 1건 = 첨부 목록 N건. `SyAttachRefTableConst` 에 상수 있음 |
| `sy_contact_content` / `sy_contact_answer` | `sy_contact` 의 논리 슬롯 | 실제 테이블명 아님 — 한 레코드가 첨부 슬롯 2개(문의내용/답변)를 가질 때의 관례. `ref_id`=`contact_id` 공용. `SyAttachRefTableConst` 에 상수 있음 |
| `pd_prod_img` | `pd_prod_img` 1행 = 첨부 1건(1:1) | `ref_id`=해당 `prod_img_id`. **행 자체도 `pd_prod_img.attach_id` 로 정방향 참조**(1:1 특화 — §10-B). `SyAttachRefTableConst` 에 상수 있음 |
| `sy_vendor_content` / `sy_attach_grp_legacy` | 문서화만 됨, 실 연계 코드 없음 | 아직 어떤 Service 도 이 값으로 연계하지 않아 상수화 안 함(사용처 없는 상수 금지) — 실제로 연계하는 코드를 작성할 때 상수를 추가한다 |

⚠️ `pd_prod_content`(상품설명 file 타입 블록)는 **의도적으로 ref_table_nm 을 쓰지 않는다** — §10-B 참조.
저장마다 행이 재생성돼 행 단위 추적이 안 되고, 그렇다고 `ref_id`=`prod_id` 로 걸어버리면 제거/교체된
옛 파일이 "연계됨"으로 보여 오히려 `ATTACH_CLEANUP` 배치(§10-B)의 정리 대상에서도 영구히 빠져버린다.
그래서 이 파일들은 업로드 후 끝까지 미연계 상태로 두고, 유일한 정리 주체를 `ATTACH_CLEANUP` 배치로
한정한다.

새 도메인 추가 시 이 표에 항목을 추가한다. `SyAttachMng.js`(첨부관리 화면)의 `REF_TABLE_OPTS` 상수도 함께 갱신.

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

## 9. 프론트엔드 공통 컴포넌트 (BaseAttachGrp / BaseAttachOne)

첨부파일 UI 는 공용 컴포넌트 두 개로 통일한다 — [components/comp/BaseComp.js](../../../components/comp/BaseComp.js).

| 컴포넌트 | 태그 | 용도 |
|---|---|---|
| `BaseAttachGrp` | `<base-attach-grp>` | 다중 첨부(목록형) — `refTableNm`/`refKeyId` 로 연계, 업로드/삭제/드래그정렬/썸네일 |
| `BaseAttachOne` | `<base-attach-one>` | 단일 이미지(프로필 등) — `attachId` 를 직접 다룸(그룹/연계 개념 없음), 박스형 미리보기 + 변경/삭제 |

### 9.1 주요 props (BaseAttachGrp, 2026-08-15 개편)

| prop | 타입 | 기본 | 설명 |
|---|---|---|---|
| `refTableNm` | String\|null | null | 관련 테이블명(§ref_table_nm 명명 규칙 표 참조) |
| `refKeyId` | String\|null | null | 관련 ID. 대상 레코드가 아직 저장 전(ID 미확정)이면 null — 이 상태에서도 업로드는 허용(미연계) |
| `refId` | String | '' | **표시용 배지 문자열**(예: `NOTICE-1`). DB 연계와 무관 — `refKeyId` 와 다른 prop이니 혼동 주의 |
| `showToast` | Function | noop | 토스트 함수 |
| `grpCode` | String | 'common' | 업무 코드(businessCode) — 저장 폴더 경로 구성용 |
| `grpNm` | String | '첨부파일' | 표시용 라벨(서버로 전송되지 않음) |
| `maxCount` | Number | 10 | 최대 첨부 개수 |
| `maxSizeMb` | Number | 10 | 파일당 최대 MB |
| `allowExt` | String | '*' | 허용 확장자(쉼표 구분) |
| `readonly` | Boolean | false | **보기(view) 모드 — 업로드/삭제/정렬 컨트롤 숨김** ⭐ |
| `displayMode` | String | 'list' | 'list'\|'image' |

### 9.1-A 연계(link) 모델 — `pendingChanges` (2026-08-15)

업로드/삭제 버튼은 **항상 즉시 물리 반영**되지만(파일 자체는 그 자리에서 생기거나 없어짐),
`sy_attach.ref_table_nm`/`ref_id` **연계** 자체는 즉시 반영되지 않는다. 부모 화면(Dtl)이 실제
저장(등록/수정) 버튼을 누르는 시점에, 컴포넌트가 노출하는 `pendingChanges`
(`[{attachId, rowStatus:'I'|'D'}]`)를 읽어 저장 요청 바디에 `attachChanges`(또는 도메인별 필드명,
예: `contentAttachChanges`)로 함께 실어 보내고, 백엔드가 부모 레코드 저장과 **같은 트랜잭션**
안에서 원자적으로 반영한다(§10-A `SyAttachService.applyChanges`).

- **업로드(추가)** → 항상 미연계 상태로 즉시 업로드, `pendingChanges` 에 `{attachId,'I'}` 적재
- **삭제(✕) 클릭** → 이번 세션에 추가만 되고 아직 미연계인 파일(`pendingChanges` 의 `'I'` 항목)은
  저장을 기다릴 필요가 없어 **즉시 물리 삭제**. 이미 연계돼 있던(서버에서 불러온) 기존 파일은
  즉시 삭제하지 않고 `pendingChanges` 에 `{attachId,'D'}` 로만 적재 → 부모가 저장할 때만 반영
  (취소/미저장 이탈 시 원래 연계 상태 그대로 보존됨)
- 부모는 저장 성공 후 `template ref` 로 `reload()` 를 호출해 `pendingChanges` 를 비우고 최신 목록을
  다시 조회해야 한다 — **화면이 그대로 남아 재저장이 반복되는 패턴**(예: `SyContactDtl`)에서 필수.
  저장 직후 다른 화면으로 `navigate()`(unmount)하는 패턴은 호출 불필요(컴포넌트 자체가 사라짐).

```html
<base-attach-grp ref="attachGrpRef" ref-table-nm="sy_notice" :ref-key-id="dtlId" ... />
```
```js
const attachChanges = attachGrpRef.value?.pendingChanges || [];
await boApiSvc.cmNotice.create({ ...baseForm, attachChanges }, '공지사항관리', '등록');
// (수정 화면이 계속 열려 있는 패턴이면) await attachGrpRef.value.reload();
```

⚠️ 폐기된 과거 메서드: `linkNow()` / `PATCH /co/cm/upload/ref/link` / `coApiSvc.cmAttach.linkRef` —
저장 API 호출과 별개의 2차 API 콜에 의존해 그 콜이 누락되면 파일이 영구 미연계로 남는 문제가 있어
2026-08-15 폐기. 지금은 저장 API 자체가 연계까지 원자적으로 처리한다.

### 9.2 `readonly` (보기/수정 모드 분리) ⭐ (2026-06-08)

상세(Dtl)의 보기/수정 모드(`dtlMode`/`cfReadonly`/`cfDtlMode`)를 첨부 영역에도 그대로 전달한다.

- **보기모드(`readonly=true`) 숨김**: `📎 파일첨부` 버튼·하단 안내, 행별 `✕` 삭제, 드래그 핸들(`⠿`)·`draggable`·정렬, 이미지 모드 `📷 변경`/`✕ 삭제`·박스 클릭 업로드.
- **보기모드 유지(노출)**: 파일 목록 + 다운로드(⬇)·팝업보기(↗)·썸네일 미리보기.
- **이중 방어**: 템플릿 `v-if="!readonly"` + setup 의 `openPicker`/`removeFile`/`onDrop` 첫 줄 `if (props.readonly) return;` 가드.
- **사용처**: `:readonly="cfReadonly"`(또는 `cfDtlMode`). 항상-보기 FO 화면은 `:readonly="true"`, FO 작성 폼은 미지정(편집).
- ❌ 첨부 컴포넌트를 `v-if="!cfDtlMode"` 로 통째 숨기면 보기모드에서 목록까지 사라짐 → **`:readonly` 로 컨트롤만 숨기고 목록은 유지**.
- 적용: CmNoticeDtl·SyBbsDtl·SyContactDtl(내용·답변)·SyUserDtl·MyContact(FO). UX 정책 → [base/base.UX-bo.md](../base/base.UX-bo.md) §6.9.

---

## 10. 다른 도메인이 첨부를 물고 갈 때 — `SyAttachDto.Brief` (2026-07-28)

메시지·게시글·리뷰처럼 **본문 DTO 가 첨부 목록을 함께 내려주는** 경우가 있다.
이때 도메인마다 6~7필드짜리 첨부 클래스를 각자 만들면 안 된다.

### ⛔ 하지 말 것 — 도메인별 첨부 클래스

```java
// CmChattMsgDto 안에 있던 것 (2026-07-28 제거)
public static class AttachItem {
    private String attachId;
    private String attachUrl;
    private String attachNm;    // ← sy_attach 는 file_nm
    private String attachExt;   // ← sy_attach 는 file_ext
    private Long   attachSize;  // ← sy_attach 는 file_size
    private String thumbUrl;
}
```

같은 `sy_attach` 컬럼을 도메인마다 다른 이름으로 부르게 되어, 프론트가 화면마다 다른 키를 써야 한다.

### ✅ 공통 축약 DTO

```java
private List<SyAttachDto.Brief> attachFiles;
```

`SyAttachDto.Brief` — 화면이 파일을 띄우는 데 필요한 것만 담은 공통 투영.
**필드명은 `sy_attach` 컬럼 그대로**: `attachId` `fileNm` `fileExt` `fileSize`
`attachUrl` `thumbUrl` `cdnImgUrl` `thumbCdnUrl` `storagePath` `sortOrd`.
(2026-08-15 `attachGrpId` 필드 제거 — 연계는 `ref_table_nm`/`ref_id` 로만 한다)

- `SyAttachDto.Item`(27필드)은 **첨부관리 화면 전용** — 본문 DTO 에 물리지 않는다
- 첨부 목록이 필요한 새 DTO 는 `Brief` 를 쓴다. 필드가 모자라면 `Brief` 에 더한다(도메인 클래스를 새로 만들지 않는다)

### 채우는 쪽 — N+1 회피 일괄 주입

조회 쿼리(`Projections.bean`)는 스칼라 컬럼만 담을 수 있어 첨부를 함께 못 가져온다.
행마다 조회하면 N+1 이므로 **부모 ID 들을 모아 한 번에 읽고 메모리에서 붙인다**
(2026-08-15 이후: `ref_table_nm`/`ref_id` 기준. 과거 `attachGrpId` 기준은 폐기).

```java
private void fnFillAttachFiles(List<CmChattMsgDto.Item> items) {
    List<String> msgIds = items.stream().map(CmChattMsgDto.Item::getChattMsgId)
        .filter(g -> g != null && !g.isBlank()).distinct().toList();
    if (msgIds.isEmpty()) return;
    Map<String, List<SyAttachDto.Brief>> byMsg = new LinkedHashMap<>();
    for (SyAttach a : syAttachRepository.findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc(SyAttachRefTableConst.CM_CHATT_MSG, msgIds)) {
        byMsg.computeIfAbsent(a.getRefId(), k -> new ArrayList<>()).add(syAttachService.toBrief(a));  // 매핑은 SyAttachService.toBrief 로 통일(§10-A) — 도메인마다 복제 금지
    }
    items.forEach(it -> { ... it.setAttachFiles(byMsg.get(it.getChattMsgId())); });
}
```

- 조회 메서드 **전부**(`getById` / `getByIdOrNull` / `getList` / `getPageData`)에 걸어야 한다.
  한 곳만 빠뜨리면 그 경로에서만 첨부가 사라져 원인을 찾기 어렵다
- 리포지토리에 `findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc` 를 둔다
  (`SyAttachRepository` 에 이미 정의돼 있음 — 새 도메인도 재사용)
- `SyAttach → Brief` 매핑 자체는 `SyAttachService.toBrief(SyAttach)` 하나로 통일한다 — 각 도메인
  Service 가 사설로 복제하지 않는다(2026-08-15, `CmChattMsgService` 도 이 방식으로 정리)

> **주의** — DTO 에 `attachFiles` 필드만 선언하고 **채우는 코드를 안 넣는 사고가 실제로 있었다**
> (`CmChattMsgDto`, 2026-07-28 수정 전). 프론트는 렌더 코드를 갖고 있는데 값이 늘 비어
> "원래 첨부가 없는 화면"처럼 보였다. 필드를 추가하면 producer 까지 같이 넣는다.

---

## 10-A. 부모 레코드 저장과 원자적으로 연계 — `SyAttachService.applyChanges` (2026-08-15, 응답 필드 정정)

첨부의 실제 `ref_table_nm`/`ref_id` 연계는, 그 첨부를 소유하는 **대상 레코드를 저장하는 업무
Service** 가 `create()`/`update()` 안에서 직접 반영한다. 별도 API 호출(2차 콜)에 의존하지 않는다 —
그 콜이 누락되거나 실패하면 파일이 영구 미연계로 남는 문제가 실제로 있었기 때문이다.

**요청 필드(`attachChanges`)와 응답 필드(`attachFiles`)는 타입도 이름도 분리한다** — 처음엔
`applyChanges()` 가 연계 처리와 동시에 값을 채워 요청 타입(`SyAttachChangeItem`)째로 되돌려주는
방식으로 시작했으나, 그러면 응답 JSON 의 `attachChanges` 항목 대부분이 `fileSize`/`fileExt`/
`storagePath`/`refTableNm`/`refId` 전부 null 로 찍혀 나갔다(요청 시 프론트가 `attachId`/`rowStatus`
둘만 채워 보내고, `applyChanges()` 의 반환값을 엔티티에 되싣는 코드가 없었기 때문). 지금은:

```java
// base/sy/service/SyAttachService.java
@Transactional
public void applyChanges(List<SyAttachChangeItem> changes, String refTableNm, String refId) {
    // rowStatus 'I' → ref_table_nm/ref_id 주입(연계). 'D' → 연계 삭제(물리 삭제 포함).
    // DB 반영만 한다 — 응답용 정보는 이 메서드가 만들지 않는다.
}

/** refTableNm/refId 로 연계된 첨부파일을 Brief 로 반환 — 저장 후 응답의 attachFiles 에 그대로 싣는 용도 */
public List<SyAttachDto.Brief> getBriefsByRef(String refTableNm, String refId) { ... }

/** SyAttach → Brief 매핑 — 도메인마다 복제 금지, 이 메서드 하나로 통일 */
public SyAttachDto.Brief toBrief(SyAttach a) { ... }
```

```java
// base/sy/service/SyNoticeService.java (create) — 다른 도메인도 동일 패턴
SyNotice saved = syNoticeRepository.save(body);
syAttachService.applyChanges(body.getAttachChanges(), SyAttachRefTableConst.SY_NOTICE, saved.getNoticeId());
saved.setAttachFiles(syAttachService.getBriefsByRef(SyAttachRefTableConst.SY_NOTICE, saved.getNoticeId()));
em.flush();
```

- **요청** — 엔티티는 `@Transient private List<SyAttachChangeItem> attachChanges;` 를 요청 전용
  필드로 둔다(DB 컬럼 아님, JSON 역직렬화만 됨. `attachId`/`rowStatus` 둘뿐). Request DTO 를 직접
  쓰는 화면(FO 문의 등)은 DTO 에 둔다. **`@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)`
  를 반드시 붙인다** — 안 붙이면 응답 JSON 에도 그대로 echo 되어 저장 응답에 `attachChanges` 와
  `attachFiles` 가 중복으로 실린다(실제로 있었던 문제, 2026-08-15). WRITE_ONLY 는 "요청 역직렬화는
  받되 응답 직렬화는 하지 않는다"는 뜻 — 엔티티 자체는 그대로 두고 JSON 노출만 막는다.
- **응답** — 같은 엔티티에 `@Transient private List<SyAttachDto.Brief> attachFiles;` 를 별도로 둔다
  (`Brief` 는 `attachId`/`fileNm`/`fileExt`/`fileSize`/`attachUrl`/`thumbUrl`/`cdnImgUrl`/
  `thumbCdnUrl`/`storagePath`/`sortOrd` — sy_attach 컬럼 그대로라 항상 값이 있다). `applyChanges()`
  직후 `getBriefsByRef()` 로 다시 채워 넣는다 — 이 요청에서 새로 연계된 것뿐 아니라 **그 시점의
  전체 첨부 목록**을 담아 돌려준다(부분이 아니라 전체 상태를 응답하는 게 더 안전하고 이해하기 쉽다).
- **create() 뿐 아니라 update() 에도** 걸어야 한다 — 기존 레코드를 수정하며 첨부를 추가/삭제하는
  경우도 있다. create() 만 걸고 update() 를 빠뜨리는 실수가 있었다(2026-08-15 수정).
- **여러 첨부 슬롯을 가진 도메인** — 요청 필드는 슬롯별 의미있는 이름(`SyContact` 의
  `contentAttachChanges`/`answerAttachChanges`)을 쓰지만, **응답 필드는 번호로 구분한다**:
  1번째 슬롯 = `attachFiles`, 2번째 슬롯 = `attach2Files`(3번째가 생기면 `attach3Files`). 슬롯마다
  의미있는 응답 필드명을 새로 짓지 않고 숫자로 통일해, 슬롯이 늘어난 새 도메인에서도 프론트가
  같은 규칙으로 바로 알아볼 수 있게 한다.
- 적용 도메인: `SyNoticeService` / `SyBbsService` / `CmFaqService` / `SyContactService`(`attachFiles`
  = 문의내용, `attach2Files` = 답변) / `FoCmContactService`(`attachFiles` = 문의내용).

## 10-B. 도메인 자체 테이블이 sy_attach 를 정방향 참조하는 경우 — `pd_prod_img` (2026-08-15)

`sy_bbs`/`sy_notice` 처럼 도메인에 "첨부 행" 개념이 아예 없는 경우는 §10-A 로 충분하다. 하지만
`pd_prod_img` 처럼 **도메인 자체가 이미 1:1 첨부 행 테이블**이고(`is_thumb`/`sort_ord`/
`prod_opt_id_1·2` 같은 그 행 고유 메타데이터가 있음) 정밀한 "이 행이 정확히 어떤 파일인지"
식별이 필요하면, **정방향(도메인 행 → `attach_id`) + 역방향(`sy_attach.ref_table_nm`/`ref_id`)
을 둘 다** 채운다:

```java
PdProdImg img = PdProdImg.builder()
    .prodImgId(prodImgId).attachId(r.getAttachId())   // 정방향 — 정밀 식별
    .build();
pdProdImgRepository.save(img);
syAttachService.updateSelective(SyAttach.builder()
    .attachId(r.getAttachId()).refTableNm(SyAttachRefTableConst.PD_PROD_IMG).refId(prodImgId).build());  // 역방향 — 청소 안전
```

역방향(`ref_table_nm`/`ref_id`)을 빠뜨리면, 향후 `ATTACH_CLEANUP` 배치(§구현 참조)가 "미참조"로
오인해 **실사용 중인 파일을 삭제**할 위험이 있다 — 정방향 참조만으로는 청소 배치가 알 수 없다.

반대로 `pd_prod_content` 처럼 도메인 행이 **저장마다 새 ID 로 재생성**되는 구조는, 행 단위 연계도
`ref_id`=상위 ID(`prod_id`) 연계도 **둘 다 하지 않는다** — 처음엔 "신규 컬럼 없이 `ref_id=prod_id`
로 상품 단위 연계"를 시도했으나(2026-08-15 1차), 곧바로 더 나쁜 결과라는 게 드러나 제거했다(2026-08-15
2차, 이 문서 §ref_table_nm 명명 규칙 표 참조):

- 어차피 제거/교체된 옛 첨부를 행 단위로 추적 못 해 **정리(cleanup)는 하지 않기로** 이미 결정했다
- 그 상태에서 `ref_table_nm`/`ref_id` 를 채워버리면, 옛 파일이 "연계됨(=미참조 아님)"으로 보여
  향후 `ATTACH_CLEANUP` 배치(30일 이상 **미참조** 파일 정리)의 스윕 대상에서도 영구히 제외된다 —
  정리하는 코드도 없고 배치도 못 건드리는 상태로 **영구 방치**되어 버리는, 처음 의도한 것보다
  더 나쁜 결과다
- 그래서 `pd_prod_content` 의 file 타입 블록이 올리는 파일은 **업로드 후 끝까지 미연계 상태로
  둔다**(`sy_attach.ref_table_nm`/`ref_id` 항상 NULL) — 그래야 오래된 미사용 파일이 `ATTACH_CLEANUP`
  배치의 정상적인 "미참조" 판정 대상에 들어가 자연스럽게 정리된다. 유일한 정리 주체를 그 배치
  하나로 고정하는 것이 핵심.

---

## 구현 참조

| 항목 | 클래스 |
|------|--------|
| 파일 검증 | FileUploadUtil |
| 동영상 변환 | VideoConvertUtil |
| 단일 업로드 | CmUploadOneController |
| 다중 업로드 / 단건조회 / ref 목록조회 / ref 옵션목록조회 / 삭제 / 정렬 | CmUploadMultiController → CmUploadService |
| 연계 변경 반영(rowStatus I/D, 요청 전용) | SyAttachService.applyChanges |
| 응답용 첨부 목록 조회(Brief) | SyAttachService.getBriefsByRef / toBrief |
| `ref_table_nm` 값 상수 (문자열 리터럴 금지) | SyAttachRefTableConst / SyAttachRefTableOption(record) |
| 프론트 옵션 캐시 (세션당 1회 fetch) | coUtil.cofGetAttachRefTableOptions |
| 동영상 재생 | CmVideoPlayController |
| 파일 다운로드 | CmDownloadController |
| 미참조 첨부 정리(30일 이상, 매주 일요일 03:00) | SyAttachCleanupJob(`ATTACH_CLEANUP`) — 현재 TODO 스텁, 미구현 |

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
| 2026-06-08 | §9 프론트 공통 컴포넌트(BaseAttachGrp/One) props + `readonly` 보기/수정 모드 분리 추가 |
| 2026-08-15 | ⭐ 전면 개편 — `sy_attach_grp`/`attach_grp_id` 폐기, `ref_table_nm`/`ref_id` 로 통일. `BaseAttachGrp` 를 `pendingChanges`(rowStatus I/D) + `SyAttachService.applyChanges`(부모 저장과 원자적 반영) 모델로 재설계. §6·데이터베이스 테이블·§9·§10 전면 갱신, §10-A/§10-B 신설(applyChanges 표준 패턴 / 도메인 자체 첨부행 pd_prod_img 사례). PdProd 이미지 첨부의 base64 저장 방식도 실제 업로드로 전환(정방향 `attach_id` + 역방향 `ref_table_nm`/`ref_id` 둘 다 연계). 상품설명(`pd_prod_content`)은 처음엔 `ref_id=prod_id` 로 연계 시도했으나, 정리 코드가 없는 상태에서 연계까지 하면 `ATTACH_CLEANUP` 배치 대상에서도 영구히 빠지는 게 드러나 **연계를 아예 하지 않는 쪽으로 정정**. `ref_table_nm` 문자열 리터럴을 `SyAttachRefTableConst` 상수로 전면 치환(저장·조회 양쪽) — 이어서 프론트도 값을 다시 타이핑하지 않도록 `GET /co/cm/upload/ref/table-options` + `coUtil.cofGetAttachRefTableOptions()` 신설, `<base-attach-grp :ref-table-nm>` 동적 바인딩 9개 사이트 전환(`BaseAttachGrp` 는 `refTableNm` 늦게 채워지는 걸 놓치지 않도록 `watch(cfHasRef, ..., {immediate:true})` 로 교체). **당일 추가 수정**: 저장 응답의 `attachChanges` 항목 대부분이 null 로 나가던 문제 발견 — `applyChanges()` 는 DB 반영만 하도록 되돌리고(반환값 삭제), 응답은 별도 `attachFiles`(2번째 슬롯은 `attach2Files`) 필드에 `SyAttachDto.Brief`(항상 값 있음)로 채워 보내도록 `getBriefsByRef`/`toBrief` 신설 — `SyNotice`/`SyBbs`/`CmFaq`/`SyContact`/`FoCmContactService` 전부 적용, `CmChattMsgService` 의 중복 매핑도 `toBrief` 로 통합. 이어서 `attachChanges` 가 응답에도 그대로 echo 되는 것도 발견 — 4개 엔티티의 요청 필드에 `@JsonProperty(access = WRITE_ONLY)` 를 붙여 응답엔 `attachFiles`/`attach2Files` 만 나가도록 정리 |
